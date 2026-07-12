(() => {
  const root = document.getElementById("game-root");
  const difficulties = {
    easy: { pairs: 8, preview: 1800 },
    medium: { pairs: 10, preview: 1500 },
    hard: { pairs: 12, preview: 1200 }
  };
  const techSet = ["HTML", "CSS", "JS", "PY", "NODE", "GIT", "API", "VUE", "REACT", "SQL", "TS", "AI"];

  const shell = new Arcade.GameShell({
    gameId: "memory-stack-tech",
    hud: [
      { id: "difficulty", label: "Difficulty", value: "Medium" },
      { id: "time", label: "Time", value: "0s" },
      { id: "moves", label: "Moves", value: "0" },
      { id: "combo", label: "Combo", value: "0" }
    ],
    board: {
      id: "medium",
      title: "Top 10 Memory Times",
      compare: Arcade.sorters.timeAsc,
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.time}s</span>
          <span class="board-meta">${entry.moves} moves | ${entry.difficulty}</span>
        </div>
      `,
      summarize: (entry) => `${entry.time}s | ${entry.moves} moves by ${entry.name}`
    },
    noteTitle: "Memory Notes",
    noteBody: "Each difficulty keeps its own board. Faster chain matches improve combo score but rankings are decided by time first.",
    onStart: startGame,
    onRestart: restartGame
  });

  ["easy", "medium", "hard"].forEach((difficulty) => {
    shell.registerBoard({
      id: difficulty,
      title: `${difficulty[0].toUpperCase()}${difficulty.slice(1)} Top 10`,
      compare: Arcade.sorters.timeAsc,
      renderEntry: (entry, index, escapeHtml) => `
        <div class="board-row">
          <span class="board-rank">#${index + 1}</span>
          <span class="board-name">${escapeHtml(entry.name)}</span>
          <span class="board-score">${entry.time}s</span>
          <span class="board-meta">${entry.moves} moves | Combo ${entry.bestCombo}</span>
        </div>
      `,
      summarize: (entry) => `${entry.time}s | ${entry.moves} moves by ${entry.name}`
    });
  });

  let currentDifficulty = "medium";
  let cards = [];
  let openCards = [];
  let matchedCount = 0;
  let moves = 0;
  let combo = 0;
  let bestCombo = 0;
  let running = false;
  let lockBoard = false;
  let startTime = 0;
  let timerId = 0;
  let previewId = 0;
  let lastMatchTime = 0;

  function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
  }

  function buildDeck() {
    const symbols = shuffle(techSet).slice(0, difficulties[currentDifficulty].pairs);
    cards = shuffle([...symbols, ...symbols]).map((value, index) => ({
      id: `${value}-${index}`,
      value,
      revealed: false,
      matched: false
    }));
  }

  function updateHud() {
    const elapsed = running ? Math.floor((Date.now() - startTime) / 1000) : 0;
    shell.updateStat("difficulty", currentDifficulty[0].toUpperCase() + currentDifficulty.slice(1));
    shell.updateStat("time", `${elapsed}s`);
    shell.updateStat("moves", moves);
    shell.updateStat("combo", combo);
  }

  function render() {
    root.innerHTML = `
      <section class="challenge-panel">
        <h3>Difficulty</h3>
        <div class="difficulty-row">
          ${Object.keys(difficulties).map((difficulty) => `
            <button class="tab-chip" type="button" data-difficulty="${difficulty}">${difficulty}</button>
          `).join("")}
        </div>
        <p class="muted-line">Preview starts automatically after the round begins.</p>
      </section>
      <section class="challenge-panel">
        <h3>Board</h3>
        <div class="memory-board ${currentDifficulty}">
          ${cards.map((card) => `
            <button class="memory-card ${card.revealed ? "revealed" : ""} ${card.matched ? "matched" : ""}" type="button" data-card="${card.id}">
              <span class="memory-card-inner">
                <span class="memory-face back">?</span>
                <span class="memory-face front">${card.value}</span>
              </span>
            </button>
          `).join("")}
        </div>
      </section>
    `;

    root.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        currentDifficulty = button.getAttribute("data-difficulty");
        shell.useBoard(currentDifficulty);
        restartGame();
      });
      button.classList.toggle("pulse", button.getAttribute("data-difficulty") === currentDifficulty);
    });

    root.querySelectorAll("[data-card]").forEach((button) => {
      button.addEventListener("click", () => flipCard(button.getAttribute("data-card")));
    });
  }

  function timerLoop() {
    if (!running) {
      return;
    }
    updateHud();
    timerId = window.setTimeout(timerLoop, 250);
  }

  function finishRound() {
    running = false;
    window.clearTimeout(timerId);
    const time = Math.floor((Date.now() - startTime) / 1000);
    shell.audio.cue("success");
    shell.finishRun({
      title: "Board cleared",
      text: "Every pair matched.",
      boardId: currentDifficulty,
      stats: [
        `Difficulty: ${currentDifficulty}`,
        `Time: ${time}s`,
        `Moves: ${moves}`,
        `Best Combo: ${bestCombo}`
      ],
      entry: {
        score: 1000 - time * 10 - moves * 4 + bestCombo * 25,
        time,
        moves,
        bestCombo,
        difficulty: currentDifficulty
      }
    });
  }

  function resolvePair() {
    const [first, second] = openCards.map((id) => cards.find((card) => card.id === id));
    if (!first || !second) {
      return;
    }

    if (first.value === second.value) {
      first.matched = true;
      second.matched = true;
      matchedCount += 2;
      const secondsSinceLastMatch = (Date.now() - lastMatchTime) / 1000;
      combo = secondsSinceLastMatch < 2.4 ? combo + 1 : 1;
      bestCombo = Math.max(bestCombo, combo);
      lastMatchTime = Date.now();
      shell.audio.cue("success");
      if (matchedCount === cards.length) {
        finishRound();
      }
    } else {
      combo = 0;
      shell.audio.cue("fail");
      window.setTimeout(() => {
        first.revealed = false;
        second.revealed = false;
        render();
      }, 650);
    }
    openCards = [];
    lockBoard = false;
    updateHud();
    render();
  }

  function flipCard(cardId) {
    if (!running || lockBoard) {
      return;
    }
    const card = cards.find((entry) => entry.id === cardId);
    if (!card || card.revealed || card.matched) {
      return;
    }
    card.revealed = true;
    openCards.push(cardId);
    moves += 1;
    shell.audio.cue("click");
    render();
    updateHud();

    if (openCards.length === 2) {
      lockBoard = true;
      window.setTimeout(resolvePair, 420);
    }
  }

  function prepareRound() {
    window.clearTimeout(previewId);
    buildDeck();
    matchedCount = 0;
    moves = 0;
    combo = 0;
    bestCombo = 0;
    openCards = [];
    lockBoard = true;
    cards.forEach((card) => {
      card.revealed = true;
    });
    render();
    updateHud();
    shell.useBoard(currentDifficulty);
    previewId = window.setTimeout(() => {
      cards.forEach((card) => {
        if (!card.matched) {
          card.revealed = false;
        }
      });
      running = true;
      lockBoard = false;
      startTime = Date.now();
      timerLoop();
      render();
    }, difficulties[currentDifficulty].preview);
  }

  function startGame() {
    prepareRound();
  }

  function restartGame() {
    running = false;
    window.clearTimeout(timerId);
    window.clearTimeout(previewId);
    prepareRound();
  }
})();
