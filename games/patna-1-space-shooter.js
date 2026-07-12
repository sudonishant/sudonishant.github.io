(() => {
  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const shell = new Arcade.GameShell({
    gameId: "patna-1-space-shooter",
    hud: [
      { id: "score", label: "Score", value: "0" },
      { id: "wave", label: "Wave", value: "1" },
      { id: "hp", label: "Hull", value: "100" },
      { id: "multiplier", label: "Multiplier", value: "x1" }
    ],
    board: {
      id: "main",
      title: "Top 10 Flights",
      compare: (a, b) => (b.score - a.score) || (b.wave - a.wave),
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">Wave ${entry.wave} · ${entry.kills} kills</span>
        </div>
      `,
      summarize: (entry) => `Score ${entry.score} · Wave ${entry.wave} by ${entry.name}`
    },
    noteTitle: "Flight Notes",
    noteBody: "Rapid fire keeps pressure high. Spread shot is best on swarms. The boss telegraphs heavy beams before firing.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
    }
  });

  const input = { left: false, right: false, up: false, down: false };
  let paused = false;
  let running = false;
  let lastTime = 0;
  let animationFrame = 0;
  let score = 0;
  let wave = 1;
  let multiplier = 1;
  let multiplierTimer = 0;
  let kills = 0;
  let screenShake = 0;
  let waveCooldown = 0;
  let pointerActive = false;

  const player = {
    x: 480,
    y: 430,
    width: 34,
    height: 34,
    speed: 320,
    hp: 100,
    shield: 0,
    fireCooldown: 0,
    weapon: "single",
    weaponTimer: 0
  };

  let bullets = [];
  let enemies = [];
  let enemyBullets = [];
  let particles = [];
  let pickups = [];

  function resetState() {
    paused = false;
    running = true;
    lastTime = 0;
    score = 0;
    wave = 1;
    multiplier = 1;
    multiplierTimer = 0;
    kills = 0;
    screenShake = 0;
    waveCooldown = 0;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    pickups = [];
    player.x = 480;
    player.y = 430;
    player.hp = 100;
    player.shield = 0;
    player.weapon = "single";
    player.weaponTimer = 0;
    player.fireCooldown = 0;
    shell.updateStat("score", 0);
    shell.updateStat("wave", 1);
    shell.updateStat("hp", "100");
    shell.updateStat("multiplier", "x1");
    shell.togglePause(false);
    spawnWave();
  }

  function spawnParticles(x, y, amount, color) {
    for (let index = 0; index < amount; index += 1) {
      particles.push({
        x,
        y,
        velocityX: (Math.random() - 0.5) * 220,
        velocityY: (Math.random() - 0.5) * 220,
        life: 0.35 + Math.random() * 0.45,
        size: 2 + Math.random() * 4,
        color
      });
    }
  }

  function spawnWave() {
    enemies = [];
    if (wave === 3) {
      enemies.push({ x: 480, y: 110, width: 120, height: 72, hp: 120, speed: 45, type: "miniBoss", fireTimer: 1.4 });
      return;
    }
    if (wave >= 5) {
      enemies.push({ x: 480, y: 110, width: 160, height: 94, hp: 260, speed: 38, type: "boss", fireTimer: 1.2 });
      return;
    }
    const count = 5 + wave * 2;
    for (let index = 0; index < count; index += 1) {
      enemies.push({
        x: 120 + (index % 4) * 180,
        y: 50 + Math.floor(index / 4) * 70,
        width: 34,
        height: 28,
        hp: 18 + wave * 5,
        speed: 44 + wave * 4,
        type: "drone",
        sway: Math.random() * Math.PI * 2,
        fireTimer: 1.3 + Math.random() * 1.1
      });
    }
  }

  function fireBullets() {
    const base = { x: player.x, y: player.y - player.height / 2, velocityY: -560, velocityX: 0, damage: 14 };
    bullets.push(base);
    if (player.weapon === "spread") {
      bullets.push({ ...base, velocityX: -140, damage: 12 });
      bullets.push({ ...base, velocityX: 140, damage: 12 });
    }
    if (player.weapon === "laser") {
      bullets.push({ ...base, velocityX: 0, damage: 30, velocityY: -780 });
    }
  }

  function enemyFire(enemy) {
    const count = enemy.type === "boss" ? 5 : enemy.type === "miniBoss" ? 3 : 1;
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index - (count - 1) / 2) * 0.18;
      enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2,
        velocityX: Math.sin(offset) * 160,
        velocityY: enemy.type === "boss" ? 220 : 170,
        radius: enemy.type === "boss" ? 7 : 5
      });
    }
  }

  function takeDamage(amount) {
    if (player.shield > 0) {
      player.shield = Math.max(0, player.shield - amount);
    } else {
      player.hp = Math.max(0, player.hp - amount);
    }
    multiplier = 1;
    multiplierTimer = 0;
    screenShake = 12;
    shell.audio.cue("hit");
    if (player.hp <= 0) {
      endRun(false);
    }
  }

  function destroyEnemy(enemy, index) {
    const baseScore = enemy.type === "boss" ? 3000 : enemy.type === "miniBoss" ? 1200 : 240;
    score += Math.floor(baseScore * multiplier);
    kills += 1;
    multiplier = Arcade.clamp(multiplier + 0.15, 1, 6);
    multiplierTimer = 3;
    spawnParticles(enemy.x, enemy.y, enemy.type.includes("boss") ? 28 : 16, enemy.type === "drone" ? "#76ecff" : "#ff688c");
    shell.audio.cue("success");
    enemies.splice(index, 1);
    if (Math.random() > 0.78 && !enemy.type.includes("boss")) {
      const types = ["spread", "rapid", "shield", "laser"];
      pickups.push({ x: enemy.x, y: enemy.y, radius: 13, type: types[Math.floor(Math.random() * types.length)] });
    }
  }

  function endRun(victory) {
    running = false;
    shell.audio.cue(victory ? "success" : "fail");
    shell.finishRun({
      title: victory ? "Flight cleared" : "Patna-1 down",
      text: victory ? "Boss defeated and route secured." : "The ship could not survive the full route.",
      stats: [
        `Score: ${Math.floor(score)}`,
        `Wave Reached: ${wave}`,
        `Kills: ${kills}`,
        `Hull Remaining: ${Math.floor(player.hp)}`
      ],
      entry: { score: Math.floor(score), wave, kills }
    });
  }

  function update(delta) {
    if (!pointerActive) {
      const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      player.x += moveX * player.speed * delta;
      player.y += moveY * player.speed * delta;
    }

    player.x = Arcade.clamp(player.x, 26, canvas.width - 26);
    player.y = Arcade.clamp(player.y, 70, canvas.height - 40);
    player.fireCooldown -= delta;
    if (player.fireCooldown <= 0) {
      fireBullets();
      player.fireCooldown = player.weapon === "rapid" ? 0.09 : 0.18;
    }

    player.weaponTimer -= delta;
    if (player.weaponTimer <= 0) player.weapon = "single";

    multiplierTimer -= delta;
    if (multiplierTimer <= 0) multiplier = 1;

    enemies.forEach((enemy, enemyIndex) => {
      enemy.fireTimer -= delta;
      if (enemy.type === "drone") {
        enemy.sway += delta * 1.7;
        enemy.x += Math.sin(enemy.sway) * enemy.speed * delta;
      } else {
        enemy.x += Math.sin(Date.now() / 400 + enemyIndex) * enemy.speed * delta;
      }
      if (enemy.fireTimer <= 0) {
        enemyFire(enemy);
        enemy.fireTimer = enemy.type === "boss" ? 0.85 : enemy.type === "miniBoss" ? 1.1 : 1.9;
      }
    });

    bullets = bullets.filter((bullet) => {
      bullet.x += bullet.velocityX * delta;
      bullet.y += bullet.velocityY * delta;
      for (let index = enemies.length - 1; index >= 0; index -= 1) {
        const enemy = enemies[index];
        const hit =
          bullet.x > enemy.x - enemy.width / 2 &&
          bullet.x < enemy.x + enemy.width / 2 &&
          bullet.y > enemy.y - enemy.height / 2 &&
          bullet.y < enemy.y + enemy.height / 2;
        if (hit) {
          enemy.hp -= bullet.damage;
          spawnParticles(bullet.x, bullet.y, 4, "#76ecff");
          if (enemy.hp <= 0) destroyEnemy(enemy, index);
          return false;
        }
      }
      return bullet.y > -20;
    });

    enemyBullets = enemyBullets.filter((bullet) => {
      bullet.x += bullet.velocityX * delta;
      bullet.y += bullet.velocityY * delta;
      const hitPlayer =
        bullet.x > player.x - player.width / 2 &&
        bullet.x < player.x + player.width / 2 &&
        bullet.y > player.y - player.height / 2 &&
        bullet.y < player.y + player.height / 2;
      if (hitPlayer) {
        takeDamage(bullet.radius * 2);
        return false;
      }
      return bullet.y < canvas.height + 20;
    });

    pickups = pickups.filter((pickup) => {
      pickup.y += 50 * delta;
      const hit =
        pickup.x > player.x - player.width / 2 &&
        pickup.x < player.x + player.width / 2 &&
        pickup.y > player.y - player.height / 2 &&
        pickup.y < player.y + player.height / 2;
      if (hit) {
        if (pickup.type === "shield") {
          player.shield = Math.min(100, player.shield + 35);
        } else {
          player.weapon = pickup.type;
          player.weaponTimer = 7;
        }
        shell.audio.cue("power");
        spawnParticles(pickup.x, pickup.y, 10, "#ffd76b");
        return false;
      }
      return pickup.y < canvas.height + 40;
    });

    particles = particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      return particle.life > 0;
    });

    if (!enemies.length && waveCooldown <= 0) waveCooldown = 1.2;
    if (waveCooldown > 0) {
      waveCooldown -= delta;
      if (waveCooldown <= 0) {
        wave += 1;
        if (wave > 5) {
          endRun(true);
        } else {
          spawnWave();
        }
      }
    }

    screenShake *= 0.86;
    shell.updateStat("score", Math.floor(score));
    shell.updateStat("wave", wave);
    shell.updateStat("hp", `${Math.floor(player.hp)} / ${Math.floor(player.shield)}`);
    shell.updateStat("multiplier", `x${multiplier.toFixed(1)}`);
  }

  function draw() {
    context.save();
    context.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    context.fillStyle = "#040913";
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < 70; index += 1) {
      const x = (index * 131 + score * 0.4) % canvas.width;
      const y = (index * 73 + score * 0.1) % canvas.height;
      context.fillStyle = index % 3 === 0 ? "rgba(118,236,255,0.6)" : "rgba(255,255,255,0.25)";
      context.fillRect(x, y, 2, 2);
    }

    bullets.forEach((bullet) => {
      context.fillStyle = "#76ecff";
      context.fillRect(bullet.x - 2, bullet.y - 10, 4, 14);
    });
    enemyBullets.forEach((bullet) => {
      context.fillStyle = "#ff688c";
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fill();
    });
    pickups.forEach((pickup) => {
      context.fillStyle = pickup.type === "shield" ? "#76ecff" : pickup.type === "laser" ? "#ffd76b" : pickup.type === "rapid" ? "#ff688c" : "#8e7cff";
      context.beginPath();
      context.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      context.fill();
    });
    enemies.forEach((enemy) => {
      context.save();
      context.translate(enemy.x, enemy.y);
      context.fillStyle = enemy.type === "drone" ? "#ff688c" : enemy.type === "miniBoss" ? "#ffd76b" : "#8e7cff";
      context.beginPath();
      context.roundRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height, 12);
      context.fill();
      context.fillStyle = "#040913";
      context.fillRect(-enemy.width / 4, -6, enemy.width / 2, 12);
      context.restore();
    });
    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = "#76ecff";
    context.beginPath();
    context.moveTo(0, -22);
    context.lineTo(16, 18);
    context.lineTo(0, 10);
    context.lineTo(-16, 18);
    context.closePath();
    context.fill();
    if (player.shield > 0) {
      context.strokeStyle = "rgba(118,236,255,0.5)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, 0, 28, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();

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
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
    if (event.code === "ArrowUp" || event.code === "KeyW") input.up = true;
    if (event.code === "ArrowDown" || event.code === "KeyS") input.down = true;
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
    if (event.code === "ArrowUp" || event.code === "KeyW") input.up = false;
    if (event.code === "ArrowDown" || event.code === "KeyS") input.down = false;
  });
  canvas.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    const bounds = canvas.getBoundingClientRect();
    player.x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
    player.y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointerActive) return;
    const bounds = canvas.getBoundingClientRect();
    player.x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
    player.y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;
  });
  window.addEventListener("pointerup", () => {
    pointerActive = false;
  });
})();
