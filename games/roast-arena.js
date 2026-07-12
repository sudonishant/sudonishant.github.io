(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const progressStore = new Arcade.ProgressStore("roast-arena");
  const progress = progressStore.load({ unlocked: 1, current: 0 });

  const opponents = [
    { id: "freshman", name: "Freshman Flex", trait: "ego", color: "#76ecff", fireRate: 0.9, moveSpeed: 110 },
    { id: "latebuild", name: "Late Build Larry", trait: "lazy", color: "#ffd76b", fireRate: 0.78, moveSpeed: 130 },
    { id: "coldreply", name: "Cold Reply Queen", trait: "ice", color: "#8e7cff", fireRate: 0.72, moveSpeed: 138 },
    { id: "bossbyte", name: "Boss Byte", trait: "brag", color: "#ff688c", fireRate: 0.64, moveSpeed: 152 }
  ];

  const styles = [
    { id: "precision", label: "Precision", key: "1", color: "#76ecff", beats: ["ego", "brag"], crowd: 16, score: 120 },
    { id: "clean", label: "Clean Hit", key: "2", color: "#ffd76b", beats: ["lazy"], crowd: 20, score: 150 },
    { id: "savage", label: "Savage", key: "3", color: "#ff688c", beats: ["ice", "lazy"], crowd: 14, score: 170 }
  ];

  const shell = new Arcade.GameShell({
    gameId: "roast-arena",
    hud: [
      { id: "round", label: "Round", value: "1 / 3" },
      { id: "crowd", label: "Crowd", value: "50%" },
      { id: "mic", label: "Mic", value: "0%" },
      { id: "score", label: "Battle Score", value: "0" }
    ],
    board: {
      id: "main",
      title: "Top 10 Battle Scores",
      compare: (a, b) => (b.score - a.score) || (b.crowd - a.crowd),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${escapeHtml(entry.opponent)} | Crowd ${entry.crowd}%</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | Crowd ${entry.crowd}% by ${entry.name}`
    },
    noteTitle: "Battle Notes",
    noteBody: "Dodge clean, fill the mic, then fire the style that breaks the current opponent best.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Battle paused." : "Battle live.");
    }
  });

  const input = { left: false, right: false, duck: false };

  let running = false;
  let paused = false;
  let ended = false;
  let rafId = 0;
  let lastTime = 0;
  let round = 1;
  let roundTimer = 14;
  let crowd = 50;
  let mic = 0;
  let score = 0;
  let currentOpponentIndex = Math.min(progress.current || 0, Math.max(0, progress.unlocked - 1));
  let player;
  let opponent;
  let projectiles = [];
  let pickups = [];
  let shots = [];
  let particles = [];
  let fireTimer = 0;
  let pickupTimer = 0;
  let attackCooldown = 0;

  function currentOpponent() {
    return opponents[currentOpponentIndex];
  }

  function resetActors() {
    player = { x: canvas.width / 2, y: canvas.height - 82, width: 54, height: 42, speed: 320 };
    opponent = { x: canvas.width / 2, y: 108, radius: 42, direction: 1 };
    projectiles = [];
    pickups = [];
    shots = [];
    particles = [];
    fireTimer = currentOpponent().fireRate;
    pickupTimer = 1.1;
    attackCooldown = 0;
  }

  function addParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        life: 0.5 + Math.random() * 0.5,
        color,
        radius: 2 + Math.random() * 4
      });
    }
  }

  function updateHud() {
    shell.updateStat("round", `${round} / 3`);
    shell.updateStat("crowd", `${Math.round(crowd)}%`);
    shell.updateStat("mic", `${Math.round(mic)}%`);
    shell.updateStat("score", score);
  }

  function spawnProjectile() {
    const type = Math.random() > 0.45 ? "high" : "low";
    const targetY = type === "high" ? player.y - 32 : player.y + 10;
    const angle = Math.atan2(targetY - opponent.y, player.x - opponent.x + (Math.random() - 0.5) * 80);
    const speed = type === "high" ? 260 : 300;
    projectiles.push({
      x: opponent.x,
      y: opponent.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type,
      radius: type === "high" ? 14 : 10
    });
  }

  function spawnPickup() {
    pickups.push({
      x: 80 + Math.random() * (canvas.width - 160),
      y: -20,
      vy: 160 + Math.random() * 80,
      radius: 12
    });
  }

  function fireStyle(styleIndex) {
    if (!running || paused || attackCooldown > 0) {
      return;
    }
    const style = styles[styleIndex];
    if (!style || mic < 32) {
      shell.audio.cue("fail");
      shell.setStatus("Mic too cold. Dodge more and collect spotlight to charge it.");
      return;
    }
    shots.push({
      x: player.x,
      y: player.y - 20,
      vy: -420,
      radius: 12,
      style
    });
    mic = Math.max(0, mic - 34);
    attackCooldown = 0.32;
    shell.audio.cue("power");
    shell.setStatus(`${style.label} fired.`);
    updateHud();
  }

  function playerBox() {
    return {
      x: player.x - player.width / 2,
      y: player.y - (input.duck ? player.height * 0.45 : player.height),
      w: player.width,
      h: input.duck ? player.height * 0.45 : player.height
    };
  }

  function intersectsCircleRect(circle, rect) {
    const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    return Math.hypot(circle.x - nearestX, circle.y - nearestY) <= circle.radius;
  }

  function advanceRound() {
    if (round >= 3) {
      finishBattle();
      return;
    }
    round += 1;
    roundTimer = 14 - round;
    fireTimer = Math.max(0.42, currentOpponent().fireRate - round * 0.08);
    pickupTimer = 0.9;
    shell.audio.cue("success");
    shell.setStatus(`Round ${round}. Crowd is still watching.`);
    updateHud();
  }

  function finishBattle() {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    const win = crowd >= 55;
    const defeatedOpponent = currentOpponent().name;
    if (win && progress.unlocked < opponents.length) {
      progress.unlocked += 1;
      progress.current = Math.min(progress.unlocked - 1, opponents.length - 1);
      currentOpponentIndex = progress.current;
      progressStore.save(progress);
    } else if (!win) {
      progress.current = currentOpponentIndex;
      progressStore.save(progress);
    }

    shell.audio.cue(win ? "success" : "fail");
    shell.finishRun({
      title: win ? "Crowd won over" : "Crowd slipped away",
      text: win
        ? `${defeatedOpponent} got drowned out by the room.`
        : `${defeatedOpponent} held the room and the round got away from you.`,
      stats: [
        `Opponent: ${defeatedOpponent}`,
        `Battle Score: ${score}`,
        `Crowd Energy: ${Math.round(crowd)}%`,
        `Unlocked Opponents: ${progress.unlocked}`
      ],
      entry: {
        score,
        crowd: Math.round(crowd),
        opponent: defeatedOpponent
      }
    });
  }

  function drawStage() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#160813");
    gradient.addColorStop(1, "#050812");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.02)";
    for (let index = 0; index < 24; index += 1) {
      ctx.fillRect(index * 40, 0, 2, canvas.height);
    }

    ctx.fillStyle = "rgba(255,215,107,0.08)";
    ctx.fillRect(0, canvas.height - 72, canvas.width, 72);

    ctx.fillStyle = "rgba(7,12,24,0.78)";
    ctx.fillRect(24, 24, 242, 72);
    ctx.strokeStyle = "rgba(255,104,140,0.18)";
    ctx.strokeRect(24, 24, 242, 72);
    ctx.fillStyle = "#ff9bc3";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(currentOpponent().name.toUpperCase(), 42, 48);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "bold 16px Sora";
    ctx.fillText(`Trait: ${currentOpponent().trait}`, 42, 76);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(24, 108, 220, 12);
    ctx.fillStyle = "linear-gradient(90deg, #76ecff, #ffd76b)";
    ctx.fillStyle = "rgba(118,236,255,0.9)";
    ctx.fillRect(24, 108, 220 * (crowd / 100), 12);
  }

  function drawOpponent() {
    const targetX = canvas.width / 2 + Math.sin(Date.now() / 420) * 120;
    opponent.x += Math.sign(targetX - opponent.x) * currentOpponent().moveSpeed * 0.005;

    ctx.fillStyle = currentOpponent().color;
    ctx.beginPath();
    ctx.arc(opponent.x, opponent.y, opponent.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.76)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#050912";
    ctx.fillRect(opponent.x - 20, opponent.y - 12, 12, 12);
    ctx.fillRect(opponent.x + 8, opponent.y - 12, 12, 12);
    ctx.fillRect(opponent.x - 16, opponent.y + 10, 32, 6);
  }

  function drawPlayer() {
    const body = playerBox();
    ctx.fillStyle = "#76ecff";
    ctx.fillRect(body.x, body.y, body.w, body.h);
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 2;
    ctx.strokeRect(body.x, body.y, body.w, body.h);

    ctx.fillStyle = "rgba(118,236,255,0.16)";
    ctx.fillRect(body.x - 18, body.y + body.h + 6, body.w + 36, 8);
  }

  function drawProjectiles() {
    projectiles.forEach((shot) => {
      ctx.fillStyle = shot.type === "high" ? "#ff688c" : "#ffd76b";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShots() {
    shots.forEach((shot) => {
      ctx.fillStyle = shot.style.color;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPickups() {
    pickups.forEach((pickup) => {
      ctx.fillStyle = "#ffd76b";
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
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

  function drawHUDText() {
    ctx.fillStyle = "rgba(7,12,24,0.82)";
    ctx.fillRect(canvas.width - 272, 24, 244, 98);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(canvas.width - 272, 24, 244, 98);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`Round time: ${roundTimer.toFixed(1)}s`, canvas.width - 250, 50);
    ctx.fillText(`Mic meter: ${Math.round(mic)}%`, canvas.width - 250, 72);
    ctx.fillText(`1 Precision | 2 Clean | 3 Savage`, canvas.width - 250, 94);
  }

  function draw() {
    if (!player || !opponent) {
      drawStage();
      return;
    }
    drawStage();
    drawOpponent();
    drawPickups();
    drawProjectiles();
    drawShots();
    drawPlayer();
    drawParticles();
    drawHUDText();
  }

  function updateParticles(dt) {
    particles = particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt,
        life: particle.life - dt
      }))
      .filter((particle) => particle.life > 0);
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

    roundTimer -= dt;
    fireTimer -= dt;
    pickupTimer -= dt;
    attackCooldown = Math.max(0, attackCooldown - dt);
    updateParticles(dt);

    if (input.left) {
      player.x = Math.max(54, player.x - player.speed * dt);
    }
    if (input.right) {
      player.x = Math.min(canvas.width - 54, player.x + player.speed * dt);
    }

    if (fireTimer <= 0) {
      spawnProjectile();
      fireTimer = Math.max(0.38, currentOpponent().fireRate - round * 0.06);
    }
    if (pickupTimer <= 0) {
      spawnPickup();
      pickupTimer = 1.2 + Math.random() * 0.9;
    }

    const playerRect = playerBox();

    projectiles = projectiles.filter((projectile) => {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (intersectsCircleRect(projectile, playerRect)) {
        if (projectile.type === "high" && input.duck) {
          crowd = Math.min(100, crowd + 1.5);
          score += 18;
          addParticles(projectile.x, projectile.y, "#76ecff", 10);
          return false;
        }
        crowd = Math.max(0, crowd - (projectile.type === "high" ? 7 : 10));
        mic = Math.max(0, mic - 10);
        score = Math.max(0, score - 32);
        shell.audio.cue("fail");
        shell.setStatus("You got clipped. The crowd felt that one.");
        addParticles(projectile.x, projectile.y, "#ff688c", 16);
        updateHud();
        return false;
      }
      return projectile.y < canvas.height + 40 && projectile.x > -50 && projectile.x < canvas.width + 50;
    });

    pickups = pickups.filter((pickup) => {
      pickup.y += pickup.vy * dt;
      if (intersectsCircleRect(pickup, playerRect)) {
        mic = Math.min(100, mic + 24);
        score += 34;
        crowd = Math.min(100, crowd + 2);
        shell.audio.cue("power");
        addParticles(pickup.x, pickup.y, "#ffd76b", 14);
        updateHud();
        return false;
      }
      return pickup.y < canvas.height + 40;
    });

    shots = shots.filter((shot) => {
      shot.y += shot.vy * dt;
      const hit = Math.hypot(shot.x - opponent.x, shot.y - opponent.y) <= opponent.radius + shot.radius;
      if (hit) {
        const bonus = shot.style.beats.includes(currentOpponent().trait) ? 1.35 : 0.88;
        const crowdGain = shot.style.crowd * bonus;
        const points = Math.round(shot.style.score * bonus);
        crowd = Arcade.clamp(crowd + crowdGain, 0, 100);
        score += points;
        shell.audio.cue("success");
        shell.setStatus(`${shot.style.label} landed hard on ${currentOpponent().name}.`);
        addParticles(opponent.x, opponent.y, shot.style.color, 24);
        updateHud();
        return false;
      }
      return shot.y > -40;
    });

    crowd = Arcade.clamp(crowd + dt * 0.4, 0, 100);
    score += Math.floor(dt * 10);
    updateHud();

    if (roundTimer <= 0) {
      advanceRound();
    }

    if (crowd <= 8) {
      finishBattle();
    }

    draw();
  }

  function resetState() {
    running = true;
    paused = false;
    ended = false;
    lastTime = 0;
    round = 1;
    roundTimer = 14;
    crowd = 50;
    mic = 0;
    score = 0;
    currentOpponentIndex = Math.min(progress.current || 0, Math.max(0, progress.unlocked - 1));
    resetActors();
    shell.togglePause(false);
    shell.setStatus(`Battle live against ${currentOpponent().name}.`);
    shell.setNote("Battle Notes", `Current opponent: ${currentOpponent().name}. Trait focus: ${currentOpponent().trait}.`);
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
      { label: "Duck", onDown: () => { input.duck = true; }, onUp: () => { input.duck = false; } },
      { label: "Right", onDown: () => { input.right = true; }, onUp: () => { input.right = false; } },
      { label: "1", onTap: () => fireStyle(0) },
      { label: "2", onTap: () => fireStyle(1) },
      { label: "3", onTap: () => fireStyle(2) }
    ]);
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "KeyA", "KeyD", "KeyS", "Digit1", "Digit2", "Digit3"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
    if (event.code === "ArrowDown" || event.code === "KeyS") input.duck = true;
    if (event.code === "Digit1") fireStyle(0);
    if (event.code === "Digit2") fireStyle(1);
    if (event.code === "Digit3") fireStyle(2);
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
    if (event.code === "ArrowDown" || event.code === "KeyS") input.duck = false;
  });

  draw();
})();
