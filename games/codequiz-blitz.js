(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const questions = [
    { category: "HTML", difficulty: 1, prompt: "Best tag for the main page heading?", options: ["h1", "title", "header", "p"], answer: 0 },
    { category: "CSS", difficulty: 1, prompt: "Which property changes text color?", options: ["font-color", "color", "text-style", "foreground"], answer: 1 },
    { category: "JS", difficulty: 1, prompt: "What does === compare?", options: ["value", "type", "value + type", "assignment"], answer: 2 },
    { category: "Python", difficulty: 1, prompt: "Function keyword in Python?", options: ["func", "def", "lambda", "make"], answer: 1 },
    { category: "Logic", difficulty: 1, prompt: "Next after 2, 4, 8, 16?", options: ["20", "24", "32", "34"], answer: 2 },
    { category: "HTML", difficulty: 2, prompt: "Which tag wraps navigation links?", options: ["menu", "nav", "links", "aside"], answer: 1 },
    { category: "CSS", difficulty: 2, prompt: "display: grid gives you?", options: ["grid layout", "absolute mode", "table mode", "scroll mode"], answer: 0 },
    { category: "JS", difficulty: 2, prompt: "Array.map returns?", options: ["same array", "boolean", "new array", "number"], answer: 2 },
    { category: "Python", difficulty: 2, prompt: "len() returns?", options: ["length", "type", "loop count", "index"], answer: 0 },
    { category: "Logic", difficulty: 2, prompt: "Binary search complexity?", options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], answer: 1 },
    { category: "HTML", difficulty: 3, prompt: "Which tag is best for page footer?", options: ["section", "footer", "bottom", "aside"], answer: 1 },
    { category: "CSS", difficulty: 3, prompt: "Highest selector specificity?", options: ["element", "class", "id", "universal"], answer: 2 },
    { category: "JS", difficulty: 3, prompt: "querySelectorAll returns?", options: ["array", "NodeList", "map", "HTML"], answer: 1 },
    { category: "Python", difficulty: 3, prompt: "list(range(3)) becomes?", options: ["[1,2,3]", "[0,1,2]", "[0,1,2,3]", "[3]"], answer: 1 },
    { category: "Logic", difficulty: 3, prompt: "Truthy value?", options: ["0", "''", "[]", "null"], answer: 2 }
  ];

  const laneCenters = [168, 378, 588, 798];
  const answerZoneY = 420;

  const shell = new Arcade.GameShell({
    gameId: "codequiz-blitz",
    hud: [
      { id: "score", label: "Score", value: "0" },
      { id: "time", label: "Time", value: "60" },
      { id: "streak", label: "Streak", value: "0" },
      { id: "category", label: "Category", value: "HTML" }
    ],
    board: {
      id: "main",
      title: "Top 10 Blitz Scores",
      compare: (a, b) => (b.score - a.score) || (b.streak - a.streak),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">Streak ${entry.streak} | ${entry.correct} correct</span>
        </div>
      `,
      summarize: (entry) => `Score ${entry.score} | Streak ${entry.streak} by ${entry.name}`
    },
    noteTitle: "Blitz Notes",
    noteBody: "Move hard, answer late only when the gates hit the zone, and protect the streak.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Quiz paused." : "Quiz live.");
    }
  });

  let running = false;
  let paused = false;
  let ended = false;
  let lastTime = 0;
  let rafId = 0;
  let timeLeft = 60;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let correct = 0;
  let playerLane = 1;
  let playerX = laneCenters[playerLane];
  let burstTimer = 0;
  let currentWave = null;
  let waveCooldown = 0;
  let particles = [];

  function chooseQuestion() {
    const targetDifficulty = streak >= 6 ? 3 : streak >= 3 ? 2 : 1;
    const pool = questions.filter((question) => question.difficulty <= targetDifficulty + 1);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnWave() {
    const question = chooseQuestion();
    const speed = 170 + Math.min(150, score / 24) + question.difficulty * 18;
    currentWave = {
      question,
      y: -120,
      speed,
      locked: false,
      resolved: false
    };
    shell.updateStat("category", question.category);
    shell.setStatus("Move into the right lane and lock the answer in the zone.");
  }

  function addParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        life: 0.7 + Math.random() * 0.4,
        radius: 2 + Math.random() * 4,
        color
      });
    }
  }

  function resolveAnswer(answerLane) {
    if (!currentWave || currentWave.resolved) {
      return;
    }
    const isCorrect = answerLane === currentWave.question.answer;
    currentWave.resolved = true;
    currentWave.locked = true;
    burstTimer = 0.18;
    if (isCorrect) {
      correct += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += 110 + streak * 22 + currentWave.question.difficulty * 30;
      timeLeft = Math.min(60, timeLeft + 1.1);
      shell.audio.cue("success");
      shell.setStatus(`Correct: ${currentWave.question.options[currentWave.question.answer]}`);
      addParticles(laneCenters[answerLane], answerZoneY, "#76ecff", 18);
    } else {
      streak = 0;
      score = Math.max(0, score - 40);
      timeLeft = Math.max(0, timeLeft - 5);
      shell.audio.cue("fail");
      shell.setStatus(`Wrong lane. Correct answer was ${currentWave.question.options[currentWave.question.answer]}.`);
      addParticles(laneCenters[answerLane], answerZoneY, "#ff688c", 22);
    }
    waveCooldown = 0.9;
    shell.updateStat("score", score);
    shell.updateStat("streak", streak);
  }

  function lockAnswer() {
    if (!running || paused || !currentWave || currentWave.locked) {
      return;
    }
    const waveFront = currentWave.y + 112;
    if (Math.abs(waveFront - answerZoneY) > 64) {
      shell.audio.cue("fail");
      shell.setStatus("Too early. Wait for the gate to hit the answer zone.");
      return;
    }
    resolveAnswer(playerLane);
  }

  function shiftLane(delta) {
    if (!running || paused) {
      return;
    }
    playerLane = Arcade.clamp(playerLane + delta, 0, laneCenters.length - 1);
    shell.audio.cue("click");
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#07111f");
    gradient.addColorStop(1, "#050913");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    laneCenters.forEach((center) => {
      ctx.strokeStyle = "rgba(118,236,255,0.08)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, canvas.height);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(118,236,255,0.08)";
    ctx.fillRect(84, answerZoneY - 12, canvas.width - 168, 24);
    ctx.strokeStyle = "rgba(255,215,107,0.6)";
    ctx.strokeRect(84, answerZoneY - 12, canvas.width - 168, 24);
  }

  function drawWave() {
    if (!currentWave) {
      return;
    }

    ctx.fillStyle = "rgba(7,12,24,0.88)";
    ctx.fillRect(70, 26, canvas.width - 140, 86);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(70, 26, canvas.width - 140, 86);
    ctx.fillStyle = "#76ecff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`${currentWave.question.category} | Difficulty ${currentWave.question.difficulty}`, 92, 54);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "bold 24px Sora";
    ctx.fillText(currentWave.question.prompt, 92, 88);

    currentWave.question.options.forEach((option, lane) => {
      const x = laneCenters[lane] - 78;
      const y = currentWave.y;
      const isCorrect = lane === currentWave.question.answer;
      ctx.fillStyle = isCorrect ? "rgba(118,236,255,0.12)" : "rgba(255,255,255,0.04)";
      ctx.fillRect(x, y, 156, 112);
      ctx.strokeStyle = isCorrect ? "rgba(118,236,255,0.4)" : "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 156, 112);
      ctx.fillStyle = "#ffd76b";
      ctx.font = "bold 14px JetBrains Mono";
      ctx.fillText(String.fromCharCode(65 + lane), x + 14, y + 28);
      ctx.fillStyle = "#f5f8ff";
      ctx.font = "bold 18px Sora";
      const clipped = option.length > 12 ? `${option.slice(0, 11)}...` : option;
      ctx.fillText(clipped, x + 14, y + 64);
    });
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(playerX, answerZoneY + 24 - burstTimer * 120);
    ctx.fillStyle = "#ffd76b";
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-24, 22);
    ctx.lineTo(24, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function draw() {
    drawBackground();
    drawWave();
    drawPlayer();
    drawParticles();

    ctx.fillStyle = "rgba(7,12,24,0.82)";
    ctx.fillRect(24, canvas.height - 96, 286, 68);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(24, canvas.height - 96, 286, 68);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "13px JetBrains Mono";
    ctx.fillText("LEFT / RIGHT to move", 42, canvas.height - 62);
    ctx.fillText("SPACE to lock answer in zone", 42, canvas.height - 38);
  }

  function finishGame() {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    shell.audio.cue("fail");
    shell.finishRun({
      title: "Time up",
      text: "The blitz run is complete.",
      stats: [
        `Score: ${score}`,
        `Correct: ${correct}`,
        `Best Streak: ${bestStreak}`,
        `Time Left: ${Math.ceil(timeLeft)}`
      ],
      entry: {
        score,
        streak: bestStreak,
        correct
      }
    });
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

    playerX += (laneCenters[playerLane] - playerX) * Math.min(1, dt * 12);
    burstTimer = Math.max(0, burstTimer - dt);
    timeLeft = Math.max(0, timeLeft - dt);
    waveCooldown = Math.max(0, waveCooldown - dt);
    updateParticles(dt);

    if (!currentWave && waveCooldown <= 0) {
      spawnWave();
    }

    if (currentWave) {
      currentWave.y += currentWave.speed * dt;
      if (!currentWave.resolved && currentWave.y + 112 > answerZoneY + 84) {
        streak = 0;
        timeLeft = Math.max(0, timeLeft - 4);
        score = Math.max(0, score - 30);
        currentWave.resolved = true;
        waveCooldown = 0.85;
        shell.audio.cue("fail");
        shell.setStatus("Missed answer window.");
        shell.updateStat("score", score);
        shell.updateStat("streak", streak);
        addParticles(playerX, answerZoneY, "#ff688c", 16);
      }
      if (currentWave.resolved && currentWave.y > canvas.height + 40) {
        currentWave = null;
      }
    }

    shell.updateStat("score", score);
    shell.updateStat("time", Math.ceil(timeLeft));
    shell.updateStat("streak", streak);

    if (timeLeft <= 0) {
      finishGame();
    }

    draw();
  }

  function resetState() {
    running = true;
    paused = false;
    ended = false;
    lastTime = 0;
    timeLeft = 60;
    score = 0;
    streak = 0;
    bestStreak = 0;
    correct = 0;
    playerLane = 1;
    playerX = laneCenters[playerLane];
    burstTimer = 0;
    currentWave = null;
    waveCooldown = 0.55;
    particles = [];
    shell.togglePause(false);
    shell.updateStat("score", 0);
    shell.updateStat("time", 60);
    shell.updateStat("streak", 0);
    shell.updateStat("category", "Mixed");
    shell.setStatus("Quiz live.");
    draw();
  }

  function startGame() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
    resetState();
    shell.setMobileControls([
      { label: "Left", onTap: () => shiftLane(-1) },
      { label: "Lock", onTap: lockAnswer },
      { label: "Right", onTap: () => shiftLane(1) }
    ]);
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      shiftLane(-1);
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      shiftLane(1);
    }
    if (event.code === "Space") {
      lockAnswer();
    }
  });

  draw();
})();
