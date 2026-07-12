(() => {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const progressStore = new Arcade.ProgressStore("desi-detective");
  const progress = progressStore.load({ endings: [] });

  const shell = new Arcade.GameShell({
    gameId: "desi-detective",
    hud: [
      { id: "zone", label: "Zone", value: "Station" },
      { id: "clues", label: "Clues", value: "0 / 3" },
      { id: "heat", label: "Heat", value: "0%" },
      { id: "time", label: "Time", value: "00:00" }
    ],
    board: {
      id: "main",
      title: "Top 10 Case Files",
      compare: (a, b) => (b.score - a.score) || (a.time - b.time),
      renderEntry: (entry, index, escapeHtml, formatTime) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.score}</span>
          <span class="board-meta">${escapeHtml(entry.ending)} | ${formatTime(entry.time)}</span>
        </div>
      `,
      summarize: (entry, formatTime) => `${entry.ending} | ${formatTime(entry.time)} by ${entry.name}`
    },
    noteTitle: "Case Board",
    noteBody: "Collect clues, question suspects, then return to the case board for the final call.",
    onStart: startGame,
    onRestart: restartGame,
    onPauseChange: (nextPaused) => {
      paused = nextPaused;
      shell.setStatus(nextPaused ? "Case paused." : "Case live.");
    }
  });

  const world = {
    width: canvas.width,
    height: canvas.height,
    walls: [
      { x: 84, y: 84, w: 180, h: 132, label: "Tea Stall" },
      { x: 332, y: 64, w: 212, h: 154, label: "Archive Wing" },
      { x: 640, y: 102, w: 196, h: 122, label: "Maintenance" },
      { x: 138, y: 312, w: 184, h: 132, label: "Courtyard" },
      { x: 402, y: 304, w: 176, h: 150, label: "Cold Room" },
      { x: 684, y: 318, w: 150, h: 126, label: "Roof Access" }
    ]
  };

  const suspects = [
    {
      id: "farid",
      name: "Farid",
      x: 176,
      y: 258,
      color: "#ffd76b",
      line: "Farid says the raincoat moved toward the archive wing.",
      evidence: "Tea stain points away from the stall."
    },
    {
      id: "meera",
      name: "Meera",
      x: 434,
      y: 254,
      color: "#8e7cff",
      line: "Meera talks calm, but avoids the cold-room question.",
      evidence: "Only Meera knew which shelf the ledger used."
    },
    {
      id: "tapan",
      name: "Tapan",
      x: 760,
      y: 264,
      color: "#76ecff",
      line: "Tapan admits the maintenance door was opened on request.",
      evidence: "Tapan moved the route, but not the motive."
    }
  ];

  const clueSpots = [
    {
      id: "keycard",
      label: "Failed keycard",
      x: 548,
      y: 146,
      color: "#76ecff",
      text: "Archive keycard failed at 7:42 PM."
    },
    {
      id: "perfume",
      label: "Jasmine trace",
      x: 494,
      y: 360,
      color: "#ff79b8",
      text: "Jasmine trace ends near the cold-room vent."
    },
    {
      id: "sleeve",
      label: "Ledger sleeve",
      x: 720,
      y: 220,
      color: "#ffd76b",
      text: "Torn ledger sleeve hidden near maintenance."
    }
  ];

  const patrols = [
    {
      x: 288,
      y: 274,
      speed: 102,
      angle: 0,
      path: [
        { x: 288, y: 274 },
        { x: 378, y: 274 },
        { x: 378, y: 448 },
        { x: 288, y: 448 }
      ],
      index: 1,
      radius: 12
    },
    {
      x: 610,
      y: 260,
      speed: 110,
      angle: Math.PI,
      path: [
        { x: 610, y: 260 },
        { x: 864, y: 260 },
        { x: 864, y: 466 },
        { x: 610, y: 466 }
      ],
      index: 1,
      radius: 12
    }
  ];

  const caseBoard = { x: 494, y: 486, radius: 28 };
  const input = { up: false, down: false, left: false, right: false };

  let player;
  let collectedClues;
  let questioned;
  let notes;
  let heat = 0;
  let running = false;
  let paused = false;
  let ended = false;
  let accusationMode = false;
  let startTime = 0;
  let rafId = 0;
  let lastTime = 0;

  function createPlayer() {
    return {
      x: 98,
      y: 486,
      radius: 14,
      speed: 214
    };
  }

  function resetPatrols() {
    patrols.forEach((guard) => {
      guard.x = guard.path[0].x;
      guard.y = guard.path[0].y;
      guard.index = 1;
      guard.angle = 0;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function pointInRect(x, y, rect, padding = 0) {
    return x > rect.x - padding &&
      x < rect.x + rect.w + padding &&
      y > rect.y - padding &&
      y < rect.y + rect.h + padding;
  }

  function blocked(x, y, radius) {
    return world.walls.some((wall) => pointInRect(x, y, wall, radius));
  }

  function zoneName() {
    const zones = [
      { name: "Tea Stall", rect: world.walls[0] },
      { name: "Archive", rect: world.walls[1] },
      { name: "Maintenance", rect: world.walls[2] },
      { name: "Courtyard", rect: world.walls[3] },
      { name: "Cold Room", rect: world.walls[4] },
      { name: "Roof Access", rect: world.walls[5] }
    ];
    const found = zones.find((zone) => pointInRect(player.x, player.y, zone.rect, 42));
    return found ? found.name : "Station";
  }

  function setDynamicNote() {
    const clueList = clueSpots
      .filter((spot) => collectedClues.has(spot.id))
      .map((spot) => spot.label)
      .join(", ");
    if (accusationMode) {
      shell.setNote("Case Board", "Board unlocked. Press 1 for Farid, 2 for Meera, 3 for Tapan.");
      return;
    }
    if (!clueList) {
      shell.setNote("Case Board", "No clue logged yet. Search the archive, cold-room path, and maintenance corner.");
      return;
    }
    shell.setNote("Case Board", `Logged clues: ${clueList}. Question at least two suspects before the final call.`);
  }

  function updateHud() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    shell.updateStat("zone", zoneName());
    shell.updateStat("clues", `${collectedClues.size} / 3`);
    shell.updateStat("heat", `${Math.floor(heat)}%`);
    shell.updateStat("time", Arcade.formatTime(elapsed));
  }

  function finishCase(ending, success) {
    if (ended) {
      return;
    }
    ended = true;
    running = false;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const cleanBonus = Math.max(0, 240 - Math.floor(heat) * 2);
    const score = Math.max(
      120,
      (success ? 780 : 260) +
      collectedClues.size * 180 +
      questioned.size * 80 +
      cleanBonus -
      elapsed * 3
    );

    if (!progress.endings.includes(ending)) {
      progress.endings.push(ending);
      progressStore.save(progress);
    }

    shell.audio.cue(success ? "success" : "fail");
    shell.finishRun({
      title: ending,
      text: success
        ? "Evidence matched the route and the case closed clean."
        : "The call missed the full route and the file closed under pressure.",
      stats: [
        `Ending: ${ending}`,
        `Score: ${score}`,
        `Clues: ${collectedClues.size}/3`,
        `Time: ${Arcade.formatTime(elapsed)}`
      ],
      entry: {
        score,
        time: elapsed,
        ending
      }
    });
  }

  function accuse(targetId) {
    if (!accusationMode || ended) {
      return;
    }
    if (targetId === "meera" && collectedClues.size === clueSpots.length) {
      finishCase("Full Solve", true);
      return;
    }
    if (targetId === "meera") {
      finishCase("Sharp but Incomplete", true);
      return;
    }
    if (targetId === "tapan") {
      finishCase("Courier Fall", false);
      return;
    }
    finishCase("False Close", false);
  }

  function nearestClue() {
    return clueSpots.find((spot) => !collectedClues.has(spot.id) && distance(player, spot) < 34) || null;
  }

  function nearestSuspect() {
    return suspects.find((suspect) => distance(player, suspect) < 42) || null;
  }

  function nearCaseBoard() {
    return Math.hypot(player.x - caseBoard.x, player.y - caseBoard.y) < caseBoard.radius + 18;
  }

  function interact() {
    if (ended) {
      return;
    }
    const clue = nearestClue();
    if (clue) {
      collectedClues.add(clue.id);
      notes.push(clue.text);
      if (notes.length > 4) {
        notes.shift();
      }
      shell.audio.cue("power");
      shell.setStatus(clue.text);
      if (collectedClues.size === clueSpots.length) {
        shell.setStatus("All clues locked. Question the room, then return to the case board.");
      }
      setDynamicNote();
      return;
    }

    const suspect = nearestSuspect();
    if (suspect) {
      questioned.add(suspect.id);
      shell.audio.cue("click");
      shell.setStatus(suspect.line);
      if (collectedClues.size === clueSpots.length && questioned.size >= 2) {
        shell.setStatus(`${suspect.evidence} Return to the case board for the final call.`);
      }
      setDynamicNote();
      return;
    }

    if (nearCaseBoard()) {
      if (collectedClues.size === clueSpots.length && questioned.size >= 2) {
        accusationMode = true;
        shell.audio.cue("success");
        shell.setStatus("Case board open. Press 1, 2, or 3 to accuse.");
        setDynamicNote();
      } else {
        shell.audio.cue("fail");
        shell.setStatus("Need all three clues and two suspect talks before the final call.");
      }
    }
  }

  function movePlayer(dt) {
    let moveX = 0;
    let moveY = 0;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;
    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    if (!moveX && !moveY) {
      return;
    }

    const length = Math.hypot(moveX, moveY) || 1;
    const nextX = clamp(player.x + (moveX / length) * player.speed * dt, player.radius, world.width - player.radius);
    const nextY = clamp(player.y + (moveY / length) * player.speed * dt, player.radius, world.height - player.radius);

    if (!blocked(nextX, player.y, player.radius)) {
      player.x = nextX;
    }
    if (!blocked(player.x, nextY, player.radius)) {
      player.y = nextY;
    }
  }

  function updatePatrols(dt) {
    patrols.forEach((guard) => {
      const target = guard.path[guard.index];
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const distanceToTarget = Math.hypot(dx, dy);
      if (distanceToTarget < 2) {
        guard.index = (guard.index + 1) % guard.path.length;
        return;
      }
      guard.angle = Math.atan2(dy, dx);
      guard.x += (dx / distanceToTarget) * guard.speed * dt;
      guard.y += (dy / distanceToTarget) * guard.speed * dt;
    });
  }

  function updateHeat(dt) {
    heat = Math.max(0, heat - dt * 5);
    patrols.forEach((guard) => {
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 22) {
        heat = Math.min(100, heat + 110 * dt);
        return;
      }
      const forwardAngle = guard.angle;
      const targetAngle = Math.atan2(dy, dx);
      const angleDelta = Math.atan2(Math.sin(targetAngle - forwardAngle), Math.cos(targetAngle - forwardAngle));
      if (dist < 168 && Math.abs(angleDelta) < 0.62) {
        heat = Math.min(100, heat + 38 * dt);
      }
    });
    if (heat >= 100) {
      finishCase("Case Blown", false);
    }
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#08101a");
    gradient.addColorStop(1, "#050912");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 18; index += 1) {
      ctx.fillStyle = index % 2 === 0 ? "rgba(118,236,255,0.03)" : "rgba(255,215,107,0.02)";
      ctx.fillRect(index * 60, 0, 2, canvas.height);
    }
  }

  function drawWalls() {
    world.walls.forEach((wall) => {
      ctx.fillStyle = "rgba(12, 23, 42, 0.96)";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = "rgba(118,236,255,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = "rgba(245,248,255,0.86)";
      ctx.font = "12px JetBrains Mono";
      ctx.fillText(wall.label, wall.x + 14, wall.y + 22);
    });
  }

  function drawCaseBoard() {
    ctx.save();
    ctx.translate(caseBoard.x, caseBoard.y);
    ctx.fillStyle = accusationMode ? "rgba(255,215,107,0.35)" : "rgba(118,236,255,0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, caseBoard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#081018";
    ctx.font = "bold 16px Sora";
    ctx.textAlign = "center";
    ctx.fillText("BOARD", 0, 5);
    ctx.restore();
  }

  function drawClues() {
    clueSpots.forEach((spot) => {
      if (collectedClues.has(spot.id)) {
        return;
      }
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.fillStyle = spot.color;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,248,255,0.92)";
      ctx.font = "11px JetBrains Mono";
      ctx.textAlign = "center";
      ctx.fillText(spot.label.toUpperCase(), 0, -18);
      ctx.restore();
    });
  }

  function drawSuspects() {
    suspects.forEach((suspect) => {
      ctx.save();
      ctx.translate(suspect.x, suspect.y);
      ctx.fillStyle = questioned.has(suspect.id) ? "rgba(255,255,255,0.26)" : suspect.color;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,248,255,0.92)";
      ctx.font = "12px JetBrains Mono";
      ctx.textAlign = "center";
      ctx.fillText(suspect.name, 0, -20);
      ctx.restore();
    });
  }

  function drawPatrols() {
    patrols.forEach((guard) => {
      ctx.save();
      ctx.translate(guard.x, guard.y);
      ctx.rotate(guard.angle);
      ctx.fillStyle = "rgba(255,104,140,0.12)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 168, -0.62, 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#ff688c";
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawPlayer() {
    ctx.fillStyle = "#76ecff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawOverlayText() {
    const interactLines = [];
    const clue = nearestClue();
    const suspect = nearestSuspect();
    if (clue) {
      interactLines.push(`Press E to inspect ${clue.label}`);
    } else if (suspect) {
      interactLines.push(`Press E to question ${suspect.name}`);
    } else if (nearCaseBoard()) {
      interactLines.push(
        collectedClues.size === clueSpots.length && questioned.size >= 2
          ? "Press E to open the case board"
          : "Case board locked"
      );
    }
    if (accusationMode) {
      interactLines.push("1 = Farid | 2 = Meera | 3 = Tapan");
    }

    if (!interactLines.length) {
      return;
    }

    ctx.fillStyle = "rgba(6,12,24,0.72)";
    ctx.fillRect(18, canvas.height - 76, 360, 46 + interactLines.length * 16);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(18, canvas.height - 76, 360, 46 + interactLines.length * 16);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "14px JetBrains Mono";
    interactLines.forEach((line, index) => {
      ctx.fillText(line, 34, canvas.height - 46 + index * 18);
    });
  }

  function draw() {
    if (!player || !(collectedClues instanceof Set) || !(questioned instanceof Set)) {
      drawBackground();
      drawWalls();
      drawCaseBoard();
      return;
    }
    drawBackground();
    drawWalls();
    drawCaseBoard();
    drawClues();
    drawSuspects();
    drawPatrols();
    drawPlayer();
    drawOverlayText();

    ctx.fillStyle = "rgba(6,12,24,0.88)";
    ctx.fillRect(canvas.width - 228, 18, 192, 86);
    ctx.strokeStyle = "rgba(118,236,255,0.18)";
    ctx.strokeRect(canvas.width - 228, 18, 192, 86);
    ctx.fillStyle = "#f5f8ff";
    ctx.font = "12px JetBrains Mono";
    ctx.fillText("NOTES", canvas.width - 210, 38);
    ctx.font = "11px JetBrains Mono";
    notes.slice(-3).forEach((note, index) => {
      ctx.fillStyle = "rgba(245,248,255,0.78)";
      ctx.fillText(note.slice(0, 28), canvas.width - 210, 58 + index * 16);
    });
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

    movePlayer(dt);
    updatePatrols(dt);
    updateHeat(dt);
    updateHud();
    draw();
  }

  function resetState() {
    player = createPlayer();
    collectedClues = new Set();
    questioned = new Set();
    notes = [];
    heat = 0;
    running = true;
    paused = false;
    ended = false;
    accusationMode = false;
    startTime = Date.now();
    lastTime = 0;
    resetPatrols();
    updateHud();
    setDynamicNote();
    shell.setStatus("Case live.");
    shell.togglePause(false);
    draw();
  }

  function startGame() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(loop);
    }
    resetState();
    shell.setMobileControls([
      { label: "Up", onDown: () => { input.up = true; }, onUp: () => { input.up = false; } },
      { label: "Left", onDown: () => { input.left = true; }, onUp: () => { input.left = false; } },
      { label: "Act", onTap: interact },
      { label: "Right", onDown: () => { input.right = true; }, onUp: () => { input.right = false; } },
      { label: "Down", onDown: () => { input.down = true; }, onUp: () => { input.down = false; } }
    ]);
  }

  function restartGame() {
    resetState();
  }

  function handleKey(event, pressed) {
    if (event.code === "ArrowUp" || event.code === "KeyW") input.up = pressed;
    if (event.code === "ArrowDown" || event.code === "KeyS") input.down = pressed;
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = pressed;
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = pressed;
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "Digit1", "Digit2", "Digit3"].includes(event.code)) {
      event.preventDefault();
    }
    handleKey(event, true);
    if (event.code === "KeyE") {
      interact();
    }
    if (event.code === "Digit1") accuse("farid");
    if (event.code === "Digit2") accuse("meera");
    if (event.code === "Digit3") accuse("tapan");
  });

  window.addEventListener("keyup", (event) => {
    handleKey(event, false);
  });

  draw();
})();
