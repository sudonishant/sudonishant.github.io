(() => {
  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const shell = new Arcade.GameShell({
    gameId: "bug-catcher-run",
    hud: [
      { id: "score", label: "Score", value: "0" },
      { id: "distance", label: "Distance", value: "0m" },
      { id: "combo", label: "Combo", value: "x1" },
      { id: "focus", label: "Focus", value: "0%" }
    ],
    board: {
      id: "main",
      title: "Top 10 Runs",
      compare: (a, b) => (b.score - a.score) || (b.distance - a.distance),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.distance}m · Combo x${entry.bestCombo}</span>
        </div>
      `,
      summarize: (entry) => `Score ${entry.score} · ${entry.distance}m by ${entry.name}`
    },
    noteTitle: "Run Notes",
    noteBody: "Coffee fills the focus meter. Shift or the focus button slows the world when the run gets crowded.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
    }
  });

  const world = { groundY: 440 };
  const player = { x: 170, y: 0, width: 50, height: 72, velocityY: 0, jumps: 0 };
  let paused = false;
  let running = false;
  let lastTime = 0;
  let animationFrame = 0;
  let score = 0;
  let distance = 0;
  let combo = 1;
  let comboTimer = 0;
  let bestCombo = 1;
  let focus = 0;
  let focusActive = 0;
  let speed = 380;
  let spawnTimer = 0;
  let pickupTimer = 0;
  let shake = 0;
  let obstacles = [];
  let pickups = [];
  let particles = [];

  function resetState() {
    running = true;
    paused = false;
    lastTime = 0;
    score = 0;
    distance = 0;
    combo = 1;
    comboTimer = 0;
    bestCombo = 1;
    focus = 0;
    focusActive = 0;
    speed = 380;
    spawnTimer = 0.9;
    pickupTimer = 2.5;
    shake = 0;
    obstacles = [];
    pickups = [];
    particles = [];
    player.y = world.groundY - player.height;
    player.velocityY = 0;
    player.jumps = 0;
    shell.updateStat("score", 0);
    shell.updateStat("distance", "0m");
    shell.updateStat("combo", "x1");
    shell.updateStat("focus", "0%");
    shell.setStatus("Run active.");
    shell.togglePause(false);
  }

  function spawnParticles(x, y, amount, color) {
    for (let index = 0; index < amount; index += 1) {
      particles.push({
        x,
        y,
        velocityX: (Math.random() - 0.5) * 220,
        velocityY: (Math.random() - 0.5) * 240,
        size: 2 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.6,
        color
      });
    }
  }

  function jump() {
    if (!running || paused || player.jumps >= 2) {
      return;
    }
    player.velocityY = player.jumps === 0 ? -720 : -650;
    player.jumps += 1;
    shell.audio.cue("click");
  }

  function triggerFocus() {
    if (!running || paused || focus < 100 || focusActive > 0) {
      return;
    }
    focus = 0;
    focusActive = 3.25;
    spawnParticles(player.x + 20, player.y + 20, 14, "#76ecff");
    shell.audio.cue("power");
  }

  function spawnObstacle() {
    const types = [
      { type: "block", width: 52, height: 58, color: "#ff688c" },
      { type: "spike", width: 44, height: 42, color: "#ffd76b" },
      { type: "warning", width: 38, height: 86, color: "#8e7cff" }
    ];
    const pick = types[Math.floor(Math.random() * types.length)];
    obstacles.push({ x: canvas.width + 30, width: pick.width, height: pick.height, type: pick.type, color: pick.color, checked: false });
  }

  function spawnPickup() {
    pickups.push({ x: canvas.width + 40, y: 320 - Math.random() * 100, radius: 16, angle: 0 });
  }

  function boundsCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function onNearMiss() {
    combo = Arcade.clamp(combo + 1, 1, 12);
    bestCombo = Math.max(bestCombo, combo);
    comboTimer = 1.7;
    spawnParticles(player.x + player.width, player.y + 28, 8, "#8e7cff");
    shell.audio.cue("success");
  }

  function failRun() {
    running = false;
    shake = 18;
    shell.audio.cue("fail");
    spawnParticles(player.x + 20, player.y + 20, 24, "#ff688c");
    shell.finishRun({
      title: "Signal lost",
      text: "The code city finally caught you.",
      stats: [
        `Score: ${Math.floor(score)}`,
        `Distance: ${Math.floor(distance)}m`,
        `Best Combo: x${bestCombo}`,
        `Focus Meter Ends At: ${Math.floor(focus)}%`
      ],
      entry: { score: Math.floor(score), distance: Math.floor(distance), bestCombo }
    });
  }

  function update(delta) {
    const scaledDelta = delta * (focusActive > 0 ? 0.55 : 1);
    focusActive = Math.max(0, focusActive - delta);
    comboTimer -= delta;
    if (comboTimer <= 0) combo = Math.max(1, combo - delta * 2.8);

    speed += delta * 10;
    distance += scaledDelta * speed * 0.08;
    score += scaledDelta * (speed * 0.12) * combo;

    spawnTimer -= scaledDelta;
    pickupTimer -= scaledDelta;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 0.7 + Math.random() * 0.75 - Math.min(0.25, distance / 4000);
    }
    if (pickupTimer <= 0) {
      spawnPickup();
      pickupTimer = 4 + Math.random() * 2.5;
    }

    player.velocityY += 2100 * scaledDelta;
    player.y += player.velocityY * scaledDelta;
    if (player.y >= world.groundY - player.height) {
      player.y = world.groundY - player.height;
      player.velocityY = 0;
      player.jumps = 0;
    }

    const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
    obstacles = obstacles.filter((obstacle) => {
      obstacle.x -= speed * scaledDelta;
      const obstacleBounds = { x: obstacle.x, y: world.groundY - obstacle.height, width: obstacle.width, height: obstacle.height };
      if (boundsCollision(playerBounds, obstacleBounds)) {
        failRun();
      }
      if (!obstacle.checked && obstacle.x + obstacle.width < player.x) {
        obstacle.checked = true;
        const topGap = world.groundY - obstacle.height;
        if (player.y + player.height < topGap + 38) onNearMiss();
      }
      return obstacle.x + obstacle.width > -40;
    });

    pickups = pickups.filter((pickup) => {
      pickup.x -= speed * scaledDelta;
      pickup.angle += scaledDelta * 4;
      const hit =
        player.x < pickup.x + pickup.radius &&
        player.x + player.width > pickup.x - pickup.radius &&
        player.y < pickup.y + pickup.radius &&
        player.y + player.height > pickup.y - pickup.radius;
      if (hit) {
        focus = Arcade.clamp(focus + 35, 0, 100);
        spawnParticles(player.x + 20, player.y + 20, 10, "#ffd76b");
        shell.audio.cue("power");
        return false;
      }
      return pickup.x > -40;
    });

    particles = particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      particle.velocityY += 440 * delta;
      return particle.life > 0;
    });

    shake *= 0.88;
    shell.updateStat("score", Math.floor(score));
    shell.updateStat("distance", `${Math.floor(distance)}m`);
    shell.updateStat("combo", `x${combo.toFixed(1)}`);
    shell.updateStat("focus", `${Math.floor(focusActive > 0 ? 100 * (focusActive / 3.25) : focus)}%`);
  }

  function draw() {
    context.save();
    context.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#06101d";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 16; index += 1) {
      const offset = (distance * 1.5 + index * 70) % canvas.width;
      context.fillStyle = `rgba(118,236,255,${0.04 + (index % 3) * 0.02})`;
      context.fillRect(canvas.width - offset, 0, 2, canvas.height);
    }

    for (let skyline = 0; skyline < 12; skyline += 1) {
      const width = 50 + (skyline % 4) * 18;
      const height = 120 + (skyline % 5) * 34;
      const x = skyline * 110 - (distance * 0.9) % 1200;
      context.fillStyle = skyline % 2 === 0 ? "rgba(11, 22, 40, 0.8)" : "rgba(16, 26, 52, 0.78)";
      context.fillRect(x, canvas.height - 220 - height, width, height);
    }

    context.fillStyle = "rgba(118,236,255,0.08)";
    context.fillRect(0, world.groundY, canvas.width, canvas.height - world.groundY);
    context.strokeStyle = "rgba(118,236,255,0.18)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, world.groundY + 2);
    context.lineTo(canvas.width, world.groundY + 2);
    context.stroke();

    obstacles.forEach((obstacle) => {
      const y = world.groundY - obstacle.height;
      context.fillStyle = obstacle.color;
      if (obstacle.type === "spike") {
        context.beginPath();
        context.moveTo(obstacle.x, world.groundY);
        context.lineTo(obstacle.x + obstacle.width / 2, y);
        context.lineTo(obstacle.x + obstacle.width, world.groundY);
        context.closePath();
        context.fill();
      } else {
        context.beginPath();
        context.roundRect(obstacle.x, y, obstacle.width, obstacle.height, 12);
        context.fill();
      }
    });

    pickups.forEach((pickup) => {
      context.save();
      context.translate(pickup.x, pickup.y);
      context.rotate(pickup.angle);
      context.fillStyle = "#ffd76b";
      context.beginPath();
      context.arc(0, 0, pickup.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#5d4214";
      context.fillRect(-8, -6, 16, 12);
      context.restore();
    });

    context.save();
    context.translate(player.x + player.width / 2, player.y + player.height / 2);
    context.fillStyle = "#76ecff";
    context.beginPath();
    context.roundRect(-20, -28, 40, 56, 14);
    context.fill();
    context.fillStyle = "#051018";
    context.fillRect(-10, -10, 20, 8);
    context.fillStyle = "#f5f8ff";
    context.fillRect(-12, -18, 7, 7);
    context.fillRect(5, -18, 7, 7);
    context.restore();

    particles.forEach((particle) => {
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    context.globalAlpha = 1;

    if (focusActive > 0) {
      context.fillStyle = "rgba(118,236,255,0.08)";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
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
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      jump();
    }
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      event.preventDefault();
      triggerFocus();
    }
  });
  canvas.addEventListener("pointerdown", () => jump());
  shell.setMobileControls([{ label: "Jump", onTap: jump }, { label: "Focus", onTap: triggerFocus }]);
})();
