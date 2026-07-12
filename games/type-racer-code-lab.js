(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const languageConfig = {
    html: {
      label: "HTML",
      color: "#76ecff",
      tokens: ["div", "hero", "main", "nav", "grid", "section", "button", "header"]
    },
    css: {
      label: "CSS",
      color: "#ffd76b",
      tokens: ["flex", "grid", "gap", "radius", "shadow", "color", "align", "display"]
    },
    javascript: {
      label: "JS",
      color: "#8e7cff",
      tokens: ["const", "return", "await", "start", "score", "listen", "event", "state"]
    },
    python: {
      label: "PYTHON",
      color: "#ff688c",
      tokens: ["def", "range", "print", "score", "build", "input", "return", "while"]
    }
  };

  const shell = new Arcade.GameShell({
    gameId: "type-racer-code-lab",
    hud: [
      { id: "language", label: "Language", value: "HTML" },
      { id: "time", label: "Time", value: "45" },
      { id: "wpm", label: "WPM", value: "0" },
      { id: "accuracy", label: "Accuracy", value: "100%" }
    ],
    board: {
      id: "html",
      title: "HTML Top 10",
      compare: (a, b) => (b.score - a.score) || (b.wpm - a.wpm),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.wpm} WPM | ${entry.accuracy}% accuracy</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | ${entry.wpm} WPM by ${entry.name}`
    },
    noteTitle: "Lab Notes",
    noteBody: "Press 1 HTML, 2 CSS, 3 JS, 4 Python before the run. Move, jump, and type the live token to break compile walls.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Lab paused." : "Lab live.");
    }
  });

  Object.keys(languageConfig).forEach((key) => {
    shell.registerBoard({
      id: key,
      title: `${languageConfig[key].label} Top 10`,
      compare: (a, b) => (b.score - a.score) || (b.wpm - a.wpm),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.wpm} WPM | ${entry.accuracy}% accuracy</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | ${entry.wpm} WPM by ${entry.name}`
    });
  });

  const input = { left: false, right: false };
  const groundY = 434;
  let currentLanguage = "html";
  let player;
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let running = false;
  let paused = false;
  let ended = false;
  let rafId = 0;
  let lastTime = 0;
  let spawnTimer = 0;
  let pickupTimer = 0;
  let timeLeft = 45;
  let score = 0;
  let typedChars = 0;
  let correctChars = 0;
  let mistakes = 0;
  let tokensCleared = 0;
  let typedBuffer = "";
  let startTime = 0;

  function setLanguage(nextLanguage) {
    if (!(nextLanguage in languageConfig)) {
      return;
    }
    currentLanguage = nextLanguage;
    shell.useBoard(currentLanguage);
    shell.updateStat("language", languageConfig[currentLanguage].label);
    shell.setStatus(`${languageConfig[currentLanguage].label} selected.`);
  }

  function createPlayer() {
    return {
      x: 164,
      y: groundY,
      width: 54,
      height: 58,
      vy: 0,
      speed: 260
    };
  }

  function activeWall() {
    return obstacles.find((obstacle) => obstacle.type === "wall" && obstacle.x + obstacle.width > player.x - 24) || null;
  }

  function addParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        life: 0.55 + Math.random() * 0.45,
        color,
        radius: 2 + Math.random() * 4
      });
    }
  }

  function spawnObstacle() {
    const language = languageConfig[currentLanguage];
    const roll = Math.random();
    if (roll < 0.44) {
      obstacles.push({
        type: "wall",
        x: canvas.width + 40,
        y: groundY - 130,
        width: 86,
        height: 130,
        token: language.tokens[Math.floor(Math.random() * language.tokens.length)],
        broken: false
      });
      return;
    }
    obstacles.push({
      type: "block",
      x: canvas.width + 40,
      y: groundY - 56,
      width: 60,
      height: 56
    });
  }

  function spawnPickup() {
    pickups.push({
      x: canvas.width + 30,
      y: 220 + Math.random() * 130,
      radius: 12
    });
  }

  function updateHud() {
    const elapsed = Math.max(1, (Date.now() - startTime) / 1000);
    const accuracy = typedChars ? Math.round((correctChars / typedChars) * 100) : 100;
    const wpm = Math.round((correctChars / 5) / (elapsed / 60));
    shell.updateStat("language", languageConfig[currentLanguage].label);
    shell.updateStat("time", Math.ceil(timeLeft));
    shell.updateStat("wpm", Math.max(0, wpm));
    shell.updateStat("accuracy", `${Math.max(0, accuracy)}%`);
    return { accuracy, wpm };
  }

  function jump() {
    if (!running || paused) {
      return;
    }
    if (player.y >= groundY - 1) {
      player.vy = -510;
      shell.audio.cue("click");
    }
  }

  function typeCharacter(char) {
    if (!running || paused || ended || !/^[a-z]$/i.test(char)) {
      return;
    }
    const wall = activeWall();
    if (!wall) {
      typedChars += 1;
      mistakes += 1;
      shell.audio.cue("fail");
      shell.setStatus("No compile wall live. Save the typing for the next token.");
      updateHud();
      return;
    }

    typedChars += 1;
    const nextBuffer = `${typedBuffer}${char.toLowerCase()}`;
    if (wall.token.startsWith(nextBuffer)) {
      typedBuffer = nextBuffer;
      correctChars += 1;
      shell.audio.cue("click");
      if (typedBuffer === wall.token) {
        wall.broken = true;
        typedBuffer = "";
        tokensCleared += 1;
        score += 160;
        shell.audio.cue("success");
        shell.setStatus(`Token clear: ${wall.token}`);
        addParticles(wall.x + wall.width / 2, wall.y + 32, languageConfig[currentLanguage].color, 20);
      }
    } else {
      mistakes += 1;
      typedBuffer = "";
      shell.audio.cue("fail");
      shell.setStatus(`Mistyped. Target was ${wall.token}.`);
      addParticles(player.x + 24, player.y - 18, "#ff688c", 12);
    }
    updateHud();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#08101b");
    gradient.addColorStop(1, "#040812");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 12; index += 1) {
      ctx.strokeStyle = index % 2 ? "rgba(118,236,255,0.08)" : "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.moveTo(index * 90, 0);
      ctx.lineTo(index * 90 + 110, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, groundY + 2, canvas.width, canvas.height - groundY);
  }

  function drawPlayer() {
    ctx.fillStyle = "#76ecff";
    ctx.fillRect(player.x - player.width / 2, player.y - player.height, player.width, player.height);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - player.width / 2, player.y - player.height, player.width, player.height);
  }

  function drawObstacles() {
    obstacles.forEach((obstacle) => {
      if (obstacle.type === "block") {
        ctx.fillStyle = "rgba(255,215,107,0.26)";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = "rgba(255,255,255,0.44)";
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        return;
      }
      if (!obstacle.broken) {
        ctx.fillStyle = "rgba(118,236,255,0.14)";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = languageConfig[currentLanguage].color;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = "#f5f8ff";
        ctx.font = "bold 20px JetBrains Mono";
        ctx.fillText(obstacle.token, obstacle.x + 12, obstacle.y + 70);
      }
    });
  }

  function drawPickups() {
    pickups.forEach((pickup) => {
      ctx.fillStyle = languageConfig[currentLanguage].color;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.stroke();
    });
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawPanels() {
    const wall = activeWall();
    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(24, 24, 310, 102);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(24, 24, 310, 102);
    ctx.fillStyle = languageConfig[currentLanguage].color;
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`${languageConfig[currentLanguage].label} | 1 HTML | 2 CSS | 3 JS | 4 PY`, 42, 48);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "bold 18px Sora";
    ctx.fillText(`Live Token: ${wall ? wall.token : "none"}`, 42, 78);
    ctx.font = "14px JetBrains Mono";
    ctx.fillText(`Typed: ${typedBuffer || "-"}`, 42, 102);

    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(canvas.width - 264, 24, 236, 84);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(canvas.width - 264, 24, 236, 84);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`Space jump | type a-z live`, canvas.width - 242, 48);
    ctx.fillText(`Tokens cleared ${tokensCleared}`, canvas.width - 242, 72);
    ctx.fillText(`Mistakes ${mistakes}`, canvas.width - 242, 96);
  }

  function draw() {
    if (!player) {
      drawBackground();
      return;
    }
    drawBackground();
    drawObstacles();
    drawPickups();
    drawPlayer();
    drawParticles();
    drawPanels();
  }

  function finishRun(title) {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    const { accuracy, wpm } = updateHud();
    const finalScore = Math.max(1, score + tokensCleared * 70 + Math.round(wpm * (accuracy / 100)));
    shell.audio.cue(title === "Lab clear" ? "success" : "fail");
    shell.finishRun({
      title,
      text: title === "Lab clear" ? "Compile lane cleared." : "Compile lane crashed.",
      boardId: currentLanguage,
      stats: [
        `Language: ${languageConfig[currentLanguage].label}`,
        `Score: ${finalScore}`,
        `WPM: ${wpm}`,
        `Accuracy: ${accuracy}%`
      ],
      entry: {
        score: finalScore,
        language: languageConfig[currentLanguage].label,
        wpm,
        accuracy
      }
    });
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function loop(timestamp) {
    rafId = window.requestAnimationFrame(loop);
    if (!running || paused || ended) {
      draw();
      return;
    }

    if (!lastTime) {
      lastTime = timestamp;
    }
    const dt = Math.min(0.032, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    timeLeft = Math.max(0, timeLeft - dt);
    spawnTimer -= dt;
    pickupTimer -= dt;

    if (input.left) {
      player.x = Math.max(60, player.x - player.speed * dt);
    }
    if (input.right) {
      player.x = Math.min(canvas.width - 60, player.x + player.speed * dt);
    }
    player.vy += 980 * dt;
    player.y = Math.min(groundY, player.y + player.vy * dt);
    if (player.y >= groundY) {
      player.vy = 0;
    }

    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1.1 + Math.random() * 0.75;
    }
    if (pickupTimer <= 0) {
      spawnPickup();
      pickupTimer = 1 + Math.random() * 1.4;
    }

    const speed = 280 + (45 - timeLeft) * 4;
    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height,
      w: player.width,
      h: player.height
    };

    obstacles = obstacles.filter((obstacle) => {
      obstacle.x -= speed * dt;
      if (obstacle.broken) {
        return obstacle.x + obstacle.width > -120;
      }
      if (intersects(playerRect, { x: obstacle.x, y: obstacle.y, w: obstacle.width, h: obstacle.height })) {
        shell.audio.cue("fail");
        addParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, "#ff688c", 18);
        finishRun("Compile crash");
        return false;
      }
      return obstacle.x + obstacle.width > -120;
    });

    pickups = pickups.filter((pickup) => {
      pickup.x -= (speed - 70) * dt;
      if (Math.hypot(player.x - pickup.x, (player.y - player.height / 2) - pickup.y) < pickup.radius + 20) {
        score += 34;
        shell.audio.cue("power");
        addParticles(pickup.x, pickup.y, languageConfig[currentLanguage].color, 12);
        return false;
      }
      return pickup.x > -40;
    });

    particles = particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt,
        life: particle.life - dt
      }))
      .filter((particle) => particle.life > 0);

    score += Math.floor(dt * 18);
    updateHud();

    if (timeLeft <= 0) {
      finishRun("Lab clear");
    }

    draw();
  }

  function resetState() {
    player = createPlayer();
    obstacles = [];
    pickups = [];
    particles = [];
    running = true;
    paused = false;
    ended = false;
    lastTime = 0;
    spawnTimer = 1.1;
    pickupTimer = 0.75;
    timeLeft = 45;
    score = 0;
    typedChars = 0;
    correctChars = 0;
    mistakes = 0;
    tokensCleared = 0;
    typedBuffer = "";
    startTime = Date.now();
    shell.togglePause(false);
    setLanguage(currentLanguage);
    shell.setStatus(`${languageConfig[currentLanguage].label} lane live.`);
    updateHud();
    draw();
  }

  function startGame() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
    resetState();
    shell.setMobileControls([
      { label: "Left", onDown: () => { input.left = true; }, onUp: () => { input.left = false; } },
      { label: "Jump", onTap: jump },
      { label: "Right", onDown: () => { input.right = true; }, onUp: () => { input.right = false; } }
    ]);
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
      event.preventDefault();
    }
    if ((event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3" || event.code === "Digit4") && !running) {
      const mapping = {
        Digit1: "html",
        Digit2: "css",
        Digit3: "javascript",
        Digit4: "python"
      };
      setLanguage(mapping[event.code]);
      return;
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
    if (event.code === "Space") {
      jump();
      return;
    }
    if (event.key.length === 1 && /^[a-z]$/i.test(event.key)) {
      typeCharacter(event.key);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
  });

  setLanguage(currentLanguage);
  draw();
})();
