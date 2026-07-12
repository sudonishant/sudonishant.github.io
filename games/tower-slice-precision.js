(() => {
  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const shell = new Arcade.GameShell({
    gameId: "tower-slice-precision",
    hud: [
      { id: "score", label: "Score", value: "0" },
      { id: "height", label: "Height", value: "0" },
      { id: "combo", label: "Combo", value: "0" },
      { id: "width", label: "Width", value: "100%" }
    ],
    board: {
      id: "main",
      title: "Top 10 Towers",
      compare: (a, b) => (b.score - a.score) || (b.height - a.height),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.height} blocks · Combo ${entry.bestCombo}</span>
        </div>
      `,
      summarize: (entry) => `Score ${entry.score} · Height ${entry.height} by ${entry.name}`
    },
    noteTitle: "Stack Notes",
    noteBody: "Perfect alignments keep combo alive and give a large score bonus. Every miss slices the next block smaller.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
    }
  });

  let blocks = [];
  let currentBlock = null;
  let score = 0;
  let combo = 0;
  let bestCombo = 0;
  let paused = false;
  let running = false;
  let lastTime = 0;
  let animationFrame = 0;
  let shake = 0;
  let particles = [];

  function resetState() {
    running = true;
    paused = false;
    lastTime = 0;
    score = 0;
    combo = 0;
    bestCombo = 0;
    shake = 0;
    particles = [];
    blocks = [{ x: 320, y: 500, width: 320, height: 30 }];
    currentBlock = { x: 0, y: 470, width: 320, height: 30, direction: 1, speed: 280, color: "#ffd76b" };
    shell.updateStat("score", 0);
    shell.updateStat("height", 0);
    shell.updateStat("combo", 0);
    shell.updateStat("width", "100%");
    shell.togglePause(false);
  }

  function spawnParticles(x, y, amount, color) {
    for (let index = 0; index < amount; index += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        life: 0.5 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        color
      });
    }
  }

  function dropBlock() {
    if (!running || paused || !currentBlock) return;
    const previous = blocks[blocks.length - 1];
    const overlapLeft = Math.max(previous.x, currentBlock.x);
    const overlapRight = Math.min(previous.x + previous.width, currentBlock.x + currentBlock.width);
    const overlap = overlapRight - overlapLeft;

    if (overlap <= 0) {
      running = false;
      shell.audio.cue("fail");
      shell.finishRun({
        title: "Tower slipped",
        text: "The final drop missed the stack.",
        stats: [
          `Score: ${Math.floor(score)}`,
          `Height: ${Math.max(0, blocks.length - 1)}`,
          `Best Combo: ${bestCombo}`
        ],
        entry: { score: Math.floor(score), height: Math.max(0, blocks.length - 1), bestCombo }
      });
      return;
    }

    const perfect = Math.abs(overlap - previous.width) < 8;
    currentBlock.x = overlapLeft;
    currentBlock.width = overlap;
    blocks.push({ ...currentBlock });
    score += Math.floor(100 + overlap * 0.45 + combo * 24);
    if (perfect) {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += combo * 60;
      spawnParticles(currentBlock.x + currentBlock.width / 2, currentBlock.y, 18, "#76ecff");
      shell.audio.cue("success");
      shake = 12;
    } else {
      combo = 0;
      spawnParticles(currentBlock.x + currentBlock.width / 2, currentBlock.y, 12, "#ffd76b");
      shell.audio.cue("click");
      shake = 6;
    }

    currentBlock = {
      x: currentBlock.direction > 0 ? 0 : canvas.width - overlap,
      y: currentBlock.y - 30,
      width: overlap,
      height: 30,
      direction: currentBlock.direction * -1,
      speed: Math.min(460, currentBlock.speed + 12),
      color: perfect ? "#76ecff" : "#ffd76b"
    };

    if (currentBlock.y < 120) {
      blocks.forEach((block) => {
        block.y += 30;
      });
      currentBlock.y += 30;
    }

    shell.updateStat("score", Math.floor(score));
    shell.updateStat("height", Math.max(0, blocks.length - 1));
    shell.updateStat("combo", combo);
    shell.updateStat("width", `${Math.round((overlap / 320) * 100)}%`);
  }

  function update(delta) {
    currentBlock.x += currentBlock.direction * currentBlock.speed * delta;
    if (currentBlock.x <= 0 || currentBlock.x + currentBlock.width >= canvas.width) {
      currentBlock.direction *= -1;
      currentBlock.x = Arcade.clamp(currentBlock.x, 0, canvas.width - currentBlock.width);
    }
    particles = particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 360 * delta;
      return particle.life > 0;
    });
    shake *= 0.88;
  }

  function draw() {
    context.save();
    context.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#05101d";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(118,236,255,0.08)";
    context.fillRect(0, 520, canvas.width, 20);

    blocks.forEach((block, index) => {
      context.fillStyle = index % 2 === 0 ? "#76ecff" : "#8e7cff";
      context.beginPath();
      context.roundRect(block.x, block.y, block.width, block.height, 10);
      context.fill();
    });

    if (running && currentBlock) {
      context.fillStyle = currentBlock.color;
      context.beginPath();
      context.roundRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height, 10);
      context.fill();
    }

    particles.forEach((particle) => {
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    context.globalAlpha = 1;
    context.restore();
  }

  function loop(timestamp) {
    animationFrame = requestAnimationFrame(loop);
    if (!running || paused) {
      draw();
      return;
    }
    if (!lastTime) lastTime = timestamp;
    const delta = Math.min(0.032, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    update(delta);
    draw();
  }

  function startGame() {
    if (!animationFrame) animationFrame = requestAnimationFrame(loop);
    resetState();
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      dropBlock();
    }
  });
  canvas.addEventListener("pointerdown", dropBlock);
  shell.setMobileControls([{ label: "Drop", onTap: dropBlock }]);
})();
