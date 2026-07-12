(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const progressStore = new Arcade.ProgressStore("pathfinder-arena");
  const levels = [
    { id: "level-1", name: "Grid Warmup", size: 8, start: [0, 0], goal: [7, 7], fixedWalls: [[1, 2], [2, 2], [3, 2], [5, 5]], bonuses: [[2, 5], [5, 1]] },
    { id: "level-2", name: "Split Corridor", size: 8, start: [0, 4], goal: [7, 1], fixedWalls: [[2, 4], [2, 5], [2, 6], [4, 1], [4, 2], [5, 2]], bonuses: [[1, 1], [6, 6]] },
    { id: "level-3", name: "Crossfire", size: 9, start: [0, 8], goal: [8, 0], fixedWalls: [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [4, 1], [4, 2], [4, 6], [4, 7]], bonuses: [[1, 6], [7, 2], [6, 7]] },
    { id: "level-4", name: "Tight Spiral", size: 9, start: [0, 0], goal: [8, 8], fixedWalls: [[1, 0], [1, 1], [1, 2], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [3, 6], [4, 6], [5, 6], [7, 4], [7, 5], [7, 6]], bonuses: [[2, 7], [6, 1]] }
  ];
  const algorithms = ["bfs", "dfs", "astar"];
  const progress = progressStore.load({ unlocked: 1, level: 0, algorithm: "astar" });

  const shell = new Arcade.GameShell({
    gameId: "pathfinder-arena",
    hud: [
      { id: "level", label: "Level", value: "1" },
      { id: "algo", label: "Seeker", value: "A*" },
      { id: "nodes", label: "Nodes", value: "0 / 0" },
      { id: "time", label: "Time", value: "00:00" }
    ],
    board: {
      id: levels[0].id,
      title: "Top 10 Routes",
      compare: Arcade.sorters.efficiencyDesc,
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${entry.algorithm} | ${entry.time}s</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | ${entry.algorithm} by ${entry.name}`
    },
    noteTitle: "Arena Notes",
    noteBody: "Pick BFS, DFS, or A* before the run. The seeker uses that search style to cut you off.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Arena paused." : "Arena live.");
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
          <span class="board-meta">${entry.algorithm} | ${entry.time}s</span>
        </div>
      `,
      summarize: (entry) => `${entry.score} pts | ${entry.time}s by ${entry.name}`
    });
  });

  let currentLevelIndex = Math.min(progress.level || 0, levels.length - 1);
  let currentAlgorithm = progress.algorithm || "astar";
  let player;
  let seeker;
  let collected;
  let pathCells = [];
  let running = false;
  let paused = false;
  let ended = false;
  let rafId = 0;
  let lastTime = 0;
  let startTime = 0;
  let seekerTimer = 0;
  let moveCount = 0;

  function currentLevel() {
    return levels[currentLevelIndex];
  }

  function key(row, col) {
    return `${row}-${col}`;
  }

  function setAlgorithm(nextAlgorithm) {
    if (!algorithms.includes(nextAlgorithm)) {
      return;
    }
    currentAlgorithm = nextAlgorithm;
    progress.algorithm = currentAlgorithm;
    progressStore.save(progress);
    shell.updateStat("algo", currentAlgorithm === "astar" ? "A*" : currentAlgorithm.toUpperCase());
    shell.setStatus(`Seeker switched to ${currentAlgorithm.toUpperCase()}.`);
  }

  function resetState() {
    const level = currentLevel();
    player = { row: level.start[0], col: level.start[1] };
    seeker = { row: level.goal[0], col: level.goal[1] };
    collected = new Set();
    pathCells = [];
    running = true;
    paused = false;
    ended = false;
    lastTime = 0;
    startTime = Date.now();
    seekerTimer = 0.34;
    moveCount = 0;
    shell.useBoard(level.id);
    shell.togglePause(false);
    shell.updateStat("level", currentLevelIndex + 1);
    shell.updateStat("nodes", `0 / ${level.bonuses.length}`);
    setAlgorithm(currentAlgorithm);
    shell.updateStat("time", "00:00");
    shell.setStatus("Collect every node, then hit the exit.");
    draw();
  }

  function inside(row, col) {
    return row >= 0 && row < currentLevel().size && col >= 0 && col < currentLevel().size;
  }

  function isWall(row, col) {
    return currentLevel().fixedWalls.some(([r, c]) => r === row && c === col);
  }

  function isGoal(row, col) {
    return row === currentLevel().goal[0] && col === currentLevel().goal[1];
  }

  function isBonus(row, col) {
    return currentLevel().bonuses.some(([r, c]) => r === row && c === col);
  }

  function neighbors(node) {
    return [
      [node.row - 1, node.col],
      [node.row + 1, node.col],
      [node.row, node.col - 1],
      [node.row, node.col + 1]
    ]
      .filter(([row, col]) => inside(row, col) && !isWall(row, col))
      .map(([row, col]) => ({ row, col }));
  }

  function heuristic(node, target) {
    return Math.abs(node.row - target.row) + Math.abs(node.col - target.col);
  }

  function findPath(start, goal) {
    const open = [[start]];
    const visited = new Set();
    const cost = new Map([[key(start.row, start.col), 0]]);

    while (open.length) {
      let path;
      if (currentAlgorithm === "dfs") {
        path = open.pop();
      } else if (currentAlgorithm === "astar") {
        open.sort((a, b) => {
          const aNode = a[a.length - 1];
          const bNode = b[b.length - 1];
          return (cost.get(key(aNode.row, aNode.col)) + heuristic(aNode, goal)) - (cost.get(key(bNode.row, bNode.col)) + heuristic(bNode, goal));
        });
        path = open.shift();
      } else {
        path = open.shift();
      }

      const node = path[path.length - 1];
      const nodeKey = key(node.row, node.col);
      if (visited.has(nodeKey)) {
        continue;
      }
      visited.add(nodeKey);
      if (node.row === goal.row && node.col === goal.col) {
        return path;
      }
      neighbors(node).forEach((nextNode) => {
        const nextKey = key(nextNode.row, nextNode.col);
        if (!visited.has(nextKey)) {
          cost.set(nextKey, (cost.get(nodeKey) ?? 0) + 1);
          open.push([...path, nextNode]);
        }
      });
    }
    return [];
  }

  function collectNode() {
    if (isBonus(player.row, player.col)) {
      collected.add(key(player.row, player.col));
      shell.audio.cue("power");
      shell.updateStat("nodes", `${collected.size} / ${currentLevel().bonuses.length}`);
      shell.setStatus("Node captured.");
    }
  }

  function finishLevel(success) {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    const levelId = currentLevel().id;
    const levelName = currentLevel().name;
    const levelNodeTotal = currentLevel().bonuses.length;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const nodes = collected.size;
    const score = Math.max(
      140,
      (success ? 760 : 180) +
      nodes * 160 -
      moveCount * 8 -
      elapsed * 6 +
      (currentAlgorithm === "dfs" ? 80 : currentAlgorithm === "bfs" ? 40 : 0)
    );

    if (success && progress.unlocked < levels.length && currentLevelIndex + 1 === progress.unlocked) {
      progress.unlocked += 1;
    }
    if (success) {
      progress.level = Math.min(currentLevelIndex + 1, levels.length - 1);
      currentLevelIndex = Math.min(currentLevelIndex + 1, levels.length - 1);
    }
    progressStore.save(progress);

    shell.audio.cue(success ? "success" : "fail");
    shell.finishRun({
      title: success ? "Route cleared" : "Seeker caught you",
      text: success
        ? "All data nodes were collected and the exit stayed open."
        : "The seeker closed the route before you escaped.",
      boardId: levelId,
      stats: [
        `Level: ${levelName}`,
        `Score: ${score}`,
        `Nodes: ${nodes}/${levelNodeTotal}`,
        `Time: ${Arcade.formatTime(elapsed)}`
      ],
      entry: {
        score,
        algorithm: currentAlgorithm === "astar" ? "A*" : currentAlgorithm.toUpperCase(),
        time: elapsed
      }
    });
  }

  function tryMove(rowDelta, colDelta) {
    if (!running || paused || ended) {
      return;
    }
    const nextRow = player.row + rowDelta;
    const nextCol = player.col + colDelta;
    if (!inside(nextRow, nextCol) || isWall(nextRow, nextCol)) {
      shell.audio.cue("fail");
      return;
    }
    player.row = nextRow;
    player.col = nextCol;
    moveCount += 1;
    collectNode();
    if (isGoal(player.row, player.col) && collected.size === currentLevel().bonuses.length) {
      finishLevel(true);
      return;
    }
    if (player.row === seeker.row && player.col === seeker.col) {
      finishLevel(false);
    }
  }

  function moveSeeker() {
    const path = findPath(seeker, player);
    pathCells = path.map((node) => key(node.row, node.col));
    if (path.length > 1) {
      seeker.row = path[1].row;
      seeker.col = path[1].col;
    }
    if (player.row === seeker.row && player.col === seeker.col) {
      finishLevel(false);
    }
  }

  function drawBoard() {
    if (!player || !(collected instanceof Set)) {
      ctx.fillStyle = "#060d18";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const level = currentLevel();
    const cellSize = Math.min(50, Math.floor((canvas.height - 120) / level.size));
    const boardWidth = level.size * cellSize;
    const boardHeight = level.size * cellSize;
    const offsetX = Math.floor((canvas.width - boardWidth) / 2);
    const offsetY = Math.floor((canvas.height - boardHeight) / 2) + 18;

    ctx.fillStyle = "#060d18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < level.size; row += 1) {
      for (let col = 0; col < level.size; col += 1) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        const tileKey = key(row, col);
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        if (isWall(row, col)) ctx.fillStyle = "rgba(255,215,107,0.18)";
        if (pathCells.includes(tileKey)) ctx.fillStyle = "rgba(118,236,255,0.10)";
        if (isGoal(row, col)) ctx.fillStyle = "rgba(142,124,255,0.22)";
        if (isBonus(row, col) && !collected.has(tileKey)) ctx.fillStyle = "rgba(118,236,255,0.16)";
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

        if (isGoal(row, col)) {
          ctx.fillStyle = "#f5f8ff";
          ctx.font = "bold 14px JetBrains Mono";
          ctx.fillText("E", x + cellSize / 2 - 5, y + cellSize / 2 + 5);
        }
        if (isBonus(row, col) && !collected.has(tileKey)) {
          ctx.fillStyle = "#ffd76b";
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const drawActor = (actor, color, label) => {
      const x = offsetX + actor.col * cellSize + cellSize / 2;
      const y = offsetY + actor.row * cellSize + cellSize / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#050912";
      ctx.font = "bold 12px JetBrains Mono";
      ctx.fillText(label, x - 4, y + 4);
    };

    drawActor(seeker, "#ff688c", "S");
    drawActor(player, "#76ecff", "P");

    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(24, 24, 278, 86);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(24, 24, 278, 86);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText(`Level ${currentLevelIndex + 1}: ${level.name}`, 44, 48);
    ctx.fillText(`Nodes ${collected.size}/${level.bonuses.length}`, 44, 72);
    ctx.fillText(`1 BFS | 2 DFS | 3 A*`, 44, 96);

    ctx.fillStyle = "rgba(7,12,24,0.84)";
    ctx.fillRect(canvas.width - 278, 24, 250, 86);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(canvas.width - 278, 24, 250, 86);
    ctx.fillStyle = "#f5f8ff";
    ctx.fillText(`Seeker path: ${pathCells.length ? pathCells.length - 1 : 0} tiles`, canvas.width - 258, 48);
    ctx.fillText(`Moves ${moveCount}`, canvas.width - 258, 72);
    ctx.fillText(`Exit opens after all nodes`, canvas.width - 258, 96);
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

    seekerTimer -= dt;
    if (seekerTimer <= 0) {
      seekerTimer = currentAlgorithm === "astar" ? 0.24 : currentAlgorithm === "bfs" ? 0.3 : 0.38;
      moveSeeker();
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    shell.updateStat("time", Arcade.formatTime(elapsed));
    draw();
  }

  function cycleAlgorithm() {
    const nextIndex = (algorithms.indexOf(currentAlgorithm) + 1) % algorithms.length;
    setAlgorithm(algorithms[nextIndex]);
  }

  function startGame() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
    resetState();
    shell.setMobileControls([
      { label: "Up", onTap: () => tryMove(-1, 0) },
      { label: "Left", onTap: () => tryMove(0, -1) },
      { label: "Algo", onTap: cycleAlgorithm },
      { label: "Right", onTap: () => tryMove(0, 1) },
      { label: "Down", onTap: () => tryMove(1, 0) }
    ]);
  }

  function restartGame() {
    resetState();
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Digit1", "Digit2", "Digit3"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") tryMove(-1, 0);
    if (event.code === "ArrowDown" || event.code === "KeyS") tryMove(1, 0);
    if (event.code === "ArrowLeft" || event.code === "KeyA") tryMove(0, -1);
    if (event.code === "ArrowRight" || event.code === "KeyD") tryMove(0, 1);
    if (event.code === "Digit1") setAlgorithm("bfs");
    if (event.code === "Digit2") setAlgorithm("dfs");
    if (event.code === "Digit3") setAlgorithm("astar");
  });

  draw();
})();
