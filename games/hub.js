(function () {
  const recordNodes = document.querySelectorAll("[data-record]");

  function loadBoard(gameId, boardId) {
    try {
      return JSON.parse(localStorage.getItem(`nk.arcade.${gameId}.${boardId}.top10`) || "[]");
    } catch (error) {
      return [];
    }
  }

  const boardCandidates = {
    "bug-catcher-run": ["main"],
    "desi-detective": ["main"],
    "patna-1-space-shooter": ["main"],
    "codequiz-blitz": ["main"],
    "memory-stack-tech": ["easy", "medium", "hard"],
    "tower-slice-precision": ["main"],
    "roast-arena": ["main"],
    "type-racer-code-lab": ["html", "css", "javascript", "python"],
    "pathfinder-arena": ["level-1", "level-2", "level-3", "level-4"],
    "signal-heist": ["level-1", "level-2", "level-3"]
  };

  const labels = {
    "bug-catcher-run": (entry) => `Best score ${entry.score} | ${entry.distance}m by ${entry.name}`,
    "desi-detective": (entry) => `Best case score ${entry.score} by ${entry.name}`,
    "patna-1-space-shooter": (entry) => `Best score ${entry.score} | Wave ${entry.wave} by ${entry.name}`,
    "codequiz-blitz": (entry) => `Best score ${entry.score} | Streak ${entry.streak} by ${entry.name}`,
    "memory-stack-tech": (entry) => `Best ${entry.difficulty} time ${entry.time}s by ${entry.name}`,
    "tower-slice-precision": (entry) => `Best tower ${entry.height} | Score ${entry.score} by ${entry.name}`,
    "roast-arena": (entry) => `Best battle score ${entry.score} by ${entry.name}`,
    "type-racer-code-lab": (entry) => `Best ${entry.language} score ${entry.score} by ${entry.name}`,
    "pathfinder-arena": (entry) => `Best route score ${entry.score} by ${entry.name}`,
    "signal-heist": (entry) => `Best stealth score ${entry.score} by ${entry.name}`
  };

  recordNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const gameId = node.dataset.record;
    if (!gameId) return;
    const candidates = boardCandidates[gameId] ?? ["main"];
    const entries = candidates.flatMap((boardId) => loadBoard(gameId, boardId));
    const entry = entries.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    node.textContent = entry ? (labels[gameId]?.(entry) ?? `Best score ${entry.score} by ${entry.name}`) : "No record yet.";
  });
})();
