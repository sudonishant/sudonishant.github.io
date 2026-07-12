(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const progressStore = new Arcade.ProgressStore("signal-heist");
  const levels = [
    {
      id: "level-1",
      name: "Signal Room",
      size: 7,
      start: [6, 0],
      exit: [6, 6],
      target: [1, 5],
      hackNodes: [[5, 3]],
      walls: [[3, 1], [3, 2], [3, 4], [3, 5]],
      guards: [{ path: [[4, 2], [4, 4], [2, 4], [2, 2]], index: 0 }],
      cameras: [{ position: [0, 3], direction: "down" }]
    },
    {
      id: "level-2",
      name: "Archive Bypass",
      size: 8,
      start: [7, 1],
      exit: [0, 7],
      target: [2, 5],
      hackNodes: [[6, 4], [1, 2]],
      walls: [[2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [2, 6], [3, 6]],
      guards: [
        { path: [[6, 5], [5, 5], [4, 5], [3, 5], [4, 5], [5, 5]], index: 0 },
        { path: [[1, 4], [1, 5], [1, 6], [1, 5]], index: 0 }
      ],
      cameras: [{ position: [0, 1], direction: "down" }, { position: [7, 4], direction: "up" }]
    },
    {
      id: "level-3",
      name: "Vault Loop",
      size: 8,
      start: [7, 0],
      exit: [0, 7],
      target: [3, 6],
      hackNodes: [[6, 2], [2, 4]],
      walls: [[2, 1], [2, 2], [2, 3], [5, 4], [5, 5], [5, 6], [3, 3], [4, 3]],
      guards: [
        { path: [[6, 6], [5, 6], [4, 6], [4, 5], [4, 4], [5, 4], [6, 4], [6, 5]], index: 0 },
        { path: [[1, 1], [1, 2], [1, 3], [1, 4], [1, 3], [1, 2]], index: 0 }
      ],
      cameras: [{ position: [0, 5], direction: "down" }, { position: [7, 3], direction: "up" }]
    }
  ];

  const progress = progressStore.load({ unlocked: 1, level: 0 });

  const shell = new Arcade.GameShell({
    gameId: "signal-heist",
    hud: [
      { id: "level", label: "Level", value: "1" },
      { id: "alert", label: "Alert", value: "0%" },
      { id: "time", label: "Time", value: "00:00" },
      { id: "target", label: "Target", value: "Hidden" }
    ],
    board: {
      id: levels[0].id,
      title: "Top 10 Heists",
      compare: Arcade.sorters.efficiencyDesc,
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${escapeHtml(entry.level)} | Alert ${entry.alert}%</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | Alert ${entry.alert}% by ${entry.name}`
    },
    noteTitle: "Heist Notes",
    noteBody: "Move fast, stay out of beams, hack nodes to cut cameras, and use distraction pings to bend patrol routes.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Heist paused." : "Heist live.");
    }
  });

  levels.forEach((level) => {
    shell.registerBoard({
      id: level.id,
      title: `${level.name} Top 10`,
      compare: Arcade.sorters.efficiencyDesc,
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.time}s | Alert ${entry.alert}%</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | ${entry.time}s by ${entry.name}`
    });
  });

  const held = { up: false, down: false, left: false, right: false };
  let currentLevelIndex = Math.min(progress.level || 0, levels.length - 1);
  let player;
  let guards;
  let alertLevel = 0;
  let running = false;
  let paused = false;
  let ended = false;
  let startTime = 0;
  let lastTime = 0;
  let rafId = 0;
  let moveTimer = 0;
  let guardTimer = 0;
  let cameraDisable = 0;
  let pingCooldown = 0;

  function currentLevel() {
    return levels[currentLevelIndex];
  }

  function key(row, col) {
    return `${row}-${col}`;
  }

  function inside(row, col) {
    return row >= 0 && row < currentLevel().size && col >= 0 && col < currentLevel().size;
  }

  function isWall(row, col) {
    return currentLevel().walls.some(([r, c]) => r === row && c === col);
  }

  function isHackNode(row, col) {
    return currentLevel().hackNodes.some(([r, c]) => r === row && c === col);
  }

  function isExit(row, col) {
    return row === currentLevel().exit[0] && col === currentLevel().exit[1];
  }

  function isTarget(row, col) {
    return row === currentLevel().target[0] && col === currentLevel().target[1];
  }

  function resetState() {
    const level = currentLevel();
    player = {
      row: level.start[0],
      col: level.start[1],
      hasTarget: false
    };
    guards = level.guards.map((guard) => ({
      path: guard.path.map(([row, col]) => ({ row, col })),
      index: 0,
      noiseTarget: null
    }));
    alertLevel = 0;
    running = true;
    paused = false;
    ended = false;
    startTime = Date.now();
    lastTime = 0;
    moveTimer = 0;
    guardTimer = 0.36;
    cameraDisable = 0;
    pingCooldown = 0;
    shell.useBoard(level.id);
    shell.togglePause(false);
    shell.updateStat("level", currentLevelIndex + 1);
    shell.updateStat("alert", "0%");
    shell.updateStat("time", "00:00");
    shell.updateStat("target", "Hidden");
    shell.setStatus("Target cold. Stay off the beams.");
    draw();
  }

  function neighbors(node) {
    return [
      { row: node.row - 1, col: node.col },
      { row: node.row + 1, col: node.col },
      { row: node.row, col: node.col - 1 },
      { row: node.row, col: node.col + 1 }
    ].filter((next) => inside(next.row, next.col) && !isWall(next.row, next.col));
  }

  function bfs(start, goal) {
    const queue = [[start]];
    const seen = new Set();
    while (queue.length) {
      const path = queue.shift();
      const node = path[path.length - 1];
      const nodeKey = key(node.row, node.col);
      if (seen.has(nodeKey)) continue;
      seen.add(nodeKey);
      if (node.row === goal.row && node.col === goal.col) {
        return path;
      }
      neighbors(node).forEach((next) => {
        if (!seen.has(key(next.row, next.col))) {
          queue.push([...path, next]);
        }
      });
    }
    return [];
  }

  function cameraVision(camera) {
    if (cameraDisable > 0) {
      return [];
    }
    const cells = [];
    const [row, col] = camera.position;
    const direction = camera.direction === "down"
      ? [1, 0]
      : camera.direction === "up"
        ? [-1, 0]
        : camera.direction === "left"
          ? [0, -1]
          : [0, 1];
    let nextRow = row + direction[0];
    let nextCol = col + direction[1];
    while (inside(nextRow, nextCol) && !isWall(nextRow, nextCol)) {
      cells.push(key(nextRow, nextCol));
      nextRow += direction[0];
      nextCol += direction[1];
    }
    return cells;
  }

  function handleTileEffects() {
    if (!player.hasTarget && isTarget(player.row, player.col)) {
      player.hasTarget = true;
      shell.audio.cue("success");
      shell.updateStat("target", "Stolen");
      shell.setStatus("Target grabbed. Reach the exit.");
    }
    if (player.hasTarget && isExit(player.row, player.col)) {
      finishHeist(true);
    }
  }

  function tryMove(rowDelta, colDelta) {
    if (!running || paused || ended) {
      return;
    }
    const nextRow = player.row + rowDelta;
    const nextCol = player.col + colDelta;
    if (!inside(nextRow, nextCol) || isWall(nextRow, nextCol)) {
      return;
    }
    player.row = nextRow;
    player.col = nextCol;
    handleTileEffects();
  }

  function hack() {
    if (!running || paused || ended) {
      return;
    }
    const nearNode = currentLevel().hackNodes.some(
      ([row, col]) => Math.abs(row - player.row) + Math.abs(col - player.col) <= 1
    );
    if (!nearNode) {
      shell.audio.cue("fail");
      shell.setStatus("Need to stand next to a hack node.");
      return;
    }
    cameraDisable = 4.2;
    shell.audio.cue("power");
    shell.setStatus("Cameras cut for a few seconds.");
  }

  function distract() {
    if (!running || paused || ended || pingCooldown > 0) {
      return;
    }
    let nearest = null;
    guards.forEach((guard) => {
      const tile = guard.path[guard.index];
      const distance = Math.abs(tile.row - player.row) + Math.abs(tile.col - player.col);
      if (!nearest || distance < nearest.distance) {
        nearest = { guard, distance };
      }
    });
    if (!nearest || nearest.distance > 5) {
      shell.audio.cue("fail");
      shell.setStatus("No guard close enough to pull.");
      return;
    }
    const target = {
      row: Math.max(0, Math.min(currentLevel().size - 1, player.row + (Math.random() > 0.5 ? 1 : -1))),
      col: Math.max(0, Math.min(currentLevel().size - 1, player.col + (Math.random() > 0.5 ? 1 : -1)))
    };
    if (isWall(target.row, target.col)) {
      target.row = player.row;
      target.col = player.col;
    }
    nearest.guard.noiseTarget = target;
    pingCooldown = 3.2;
    shell.audio.cue("click");
    shell.setStatus("Distraction ping sent.");
  }

  function moveGuards() {
    guards.forEach((guard) => {
      if (guard.noiseTarget) {
        const start = guard.path[guard.index];
        const route = bfs(start, guard.noiseTarget);
        if (route.length > 1) {
          guard.path[guard.index] = route[1];
        }
        if (route.length <= 1 || (route[1] && route[1].row === guard.noiseTarget.row && route[1].col === guard.noiseTarget.col)) {
          guard.noiseTarget = null;
        }
        return;
      }
      guard.index = (guard.index + 1) % guard.path.length;
    });
  }

  function guardTiles() {
    return guards.map((guard) => guard.path[guard.index]);
  }

  function updateAlert(dt) {
    alertLevel = Math.max(0, alertLevel - dt * 7);
    const playerKey = key(player.row, player.col);
    const cameraSeen = currentLevel().cameras.some((camera) => cameraVision(camera).includes(playerKey));
    if (cameraSeen) {
      alertLevel = Math.min(100, alertLevel + dt * 42);
    }
    guardTiles().forEach((guardTile) => {
      const distance = Math.abs(guardTile.row - player.row) + Math.abs(guardTile.col - player.col);
      if (distance === 0) {
        alertLevel = 100;
      } else if (distance === 1) {
        alertLevel = Math.min(100, alertLevel + dt * 60);
      }
    });
    shell.updateStat("alert", `${Math.round(alertLevel)}%`);
    if (alertLevel >= 100) {
      finishHeist(false);
    }
  }

  function finishHeist(success) {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    const levelId = currentLevel().id;
    const levelName = currentLevel().name;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(
      150,
      (success ? 900 : 220) -
      elapsed * 10 -
      Math.round(alertLevel) * 5 +
      (player.hasTarget ? 180 : 0) +
      Math.round(cameraDisable * 10)
    );
    if (success && progress.unlocked < levels.length && currentLevelIndex + 1 === progress.unlocked) {
      progress.unlocked += 1;
      progress.level = Math.min(currentLevelIndex + 1, levels.length - 1);
      currentLevelIndex = Math.min(currentLevelIndex + 1, levels.length - 1);
      progressStore.save(progress);
    } else {
      progress.level = currentLevelIndex;
      progressStore.save(progress);
    }
    shell.audio.cue(success ? "success" : "fail");
    shell.finishRun({
      title: success ? "Signal secured" : "Heist blown",
      text: success ? "Target extracted with the route still open." : "Security locked hard before the exit was reached.",
      boardId: levelId,
      stats: [
        `Level: ${levelName}`,
        `Score: ${score}`,
        `Time: ${Arcade.formatTime(elapsed)}`,
        `Alert: ${Math.round(alertLevel)}%`
      ],
      entry: {
        score,
        level: levelName,
        time: elapsed,
        alert: Math.round(alertLevel)
      }
    });
  }

  function updateHeldMovement(dt) {
    moveTimer -= dt;
    if (moveTimer > 0) {
      return;
    }
    if (held.up) {
      tryMove(-1, 0);
      moveTimer = 0.15;
    } else if (held.down) {
      tryMove(1, 0);
      moveTimer = 0.15;
    } else if (held.left) {
      tryMove(0, -1);
      moveTimer = 0.15;
    } else if (held.right) {
      tryMove(0, 1);
      moveTimer = 0.15;
    }
  }

  function drawBoard() {
    if (!player || !guards) {
      ctx.fillStyle = "#050b16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const level = currentLevel();
    const cellSize = Math.min(54, Math.floor((canvas.height - 120) / level.size));
    const boardWidth = level.size * cellSize;
    const boardHeight = level.size * cellSize;
    const offsetX = Math.floor((canvas.width - boardWidth) / 2);
    const offsetY = Math.floor((canvas.height - boardHeight) / 2) + 12;

    ctx.fillStyle = "#050b16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < level.size; row += 1) {
      for (let col = 0; col < level.size; col += 1) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        if (isWall(row, col)) ctx.fillStyle = "rgba(255,215,107,0.18)";
        if (isExit(row, col)) ctx.fillStyle = "rgba(142,124,255,0.22)";
        if (isTarget(row, col) && !player.hasTarget) ctx.fillStyle = "rgba(118,236,255,0.16)";
        if (isHackNode(row, col)) ctx.fillStyle = "rgba(255,104,140,0.18)";
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
      }
    }

    currentLevel().cameras.forEach((camera) => {
      cameraVision(camera).forEach((tileKey) => {
        const [row, col] = tileKey.split("-").map(Number);
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        ctx.fillStyle = "rgba(255,104,140,0.12)";
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
      });
    });

    const drawToken = (row, col, color, label) => {
      const x = offsetX + col * cellSize + cellSize / 2;
      const y = offsetY + row * cellSize + cellSize / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#050912";
      ctx.font = "bold 12px JetBrains Mono";
      ctx.fillText(label, x - 4, y + 4);
    };

    drawToken(player.row, player.col, "#76ecff", "P");
    guardTiles().forEach((guardTile) => drawToken(guardTile.row, guardTile.col, "#ff688c", "G"));

    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(24, 24, 290, 100);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(24, 24, 290, 100);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`Level ${currentLevelIndex + 1}: ${level.name}`, 42, 48);
    ctx.fillText(`Hack E | Distract Q`, 42, 72);
    ctx.fillText(cameraDisable > 0 ? `Cameras offline ${cameraDisable.toFixed(1)}s` : "Cameras active", 42, 96);

    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(canvas.width - 250, 24, 222, 82);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(canvas.width - 250, 24, 222, 82);
    ctx.fillStyle = "#f5f8ff";
    ctx.fillText(`Target ${player.hasTarget ? "stolen" : "hidden"}`, canvas.width - 230, 48);
    ctx.fillText(`Ping ${pingCooldown > 0 ? `${pingCooldown.toFixed(1)}s` : "ready"}`, canvas.width - 230, 72);
    ctx.fillText(`Exit after target only`, canvas.width - 230, 96);
  }

  function draw() {
    drawBoard();
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

    updateHeldMovement(dt);
    guardTimer -= dt;
    cameraDisable = Math.max(0, cameraDisable - dt);
    pingCooldown = Math.max(0, pingCooldown - dt);

    if (guardTimer <= 0) {
      guardTimer = 0.34;
      moveGuards();
    }

    updateAlert(dt);
    shell.updateStat("time", Arcade.formatTime(Math.floor((Date.now() - startTime) / 1000)));
    draw();
  }

  function startGame() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
    resetState();
    shell.setMobileControls([
      { label: "Up", onTap: () => tryMove(-1, 0) },
      { label: "Left", onTap: () => tryMove(0, -1) },
      { label: "Hack", onTap: hack },
      { label: "Right", onTap: () => tryMove(0, 1) },
      { label: "Ping", onTap: distract },
      { label: "Down", onTap: () => tryMove(1, 0) }
    ]);
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyQ"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") held.up = true;
    if (event.code === "ArrowDown" || event.code === "KeyS") held.down = true;
    if (event.code === "ArrowLeft" || event.code === "KeyA") held.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") held.right = true;
    if (event.code === "KeyE") hack();
    if (event.code === "KeyQ") distract();
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowUp" || event.code === "KeyW") held.up = false;
    if (event.code === "ArrowDown" || event.code === "KeyS") held.down = false;
    if (event.code === "ArrowLeft" || event.code === "KeyA") held.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") held.right = false;
  });

  draw();
})();
