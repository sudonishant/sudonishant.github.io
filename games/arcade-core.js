(function () {
  const STORAGE_PREFIX = "nk.arcade";
  const PLAYER_KEY = `${STORAGE_PREFIX}.playerName`;
  const SETTINGS_KEY = `${STORAGE_PREFIX}.settings`;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function boardKey(gameId, boardId) {
    return `${STORAGE_PREFIX}.${gameId}.${boardId}.top10`;
  }

  function progressKey(gameId) {
    return `${STORAGE_PREFIX}.${gameId}.progress`;
  }

  function sanitizePlayerName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 12);
  }

  function readPlayerName() {
    return sanitizePlayerName(loadJson(PLAYER_KEY, ""));
  }

  function writePlayerName(name) {
    const cleanName = sanitizePlayerName(name);
    if (!cleanName) {
      return "";
    }
    saveJson(PLAYER_KEY, cleanName);
    return cleanName;
  }

  class AudioManager {
    constructor() {
      this.context = null;
      this.settings = loadJson(SETTINGS_KEY, { muted: false });
    }

    unlock() {
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.context.state === "suspended") {
        this.context.resume();
      }
    }

    isMuted() {
      return Boolean(this.settings.muted);
    }

    setMuted(nextValue) {
      this.settings.muted = Boolean(nextValue);
      saveJson(SETTINGS_KEY, this.settings);
    }

    tone({
      frequency = 440,
      duration = 0.12,
      type = "sine",
      gain = 0.05,
      attack = 0.01,
      release = 0.06
    }) {
      if (this.isMuted()) {
        return;
      }
      this.unlock();
      if (!this.context) {
        return;
      }

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const now = this.context.currentTime;

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + release);
    }

    cue(type) {
      const palette = {
        click: [
          { frequency: 520, duration: 0.05, type: "triangle", gain: 0.025 }
        ],
        success: [
          { frequency: 520, duration: 0.06, type: "triangle", gain: 0.04 },
          { frequency: 780, duration: 0.1, type: "sine", gain: 0.05, attack: 0.01 }
        ],
        fail: [
          { frequency: 210, duration: 0.16, type: "sawtooth", gain: 0.05 }
        ],
        hit: [
          { frequency: 320, duration: 0.04, type: "square", gain: 0.035 },
          { frequency: 180, duration: 0.08, type: "triangle", gain: 0.02 }
        ],
        power: [
          { frequency: 440, duration: 0.08, type: "triangle", gain: 0.03 },
          { frequency: 660, duration: 0.08, type: "triangle", gain: 0.03 }
        ]
      };

      (palette[type] || []).forEach((tone) => this.tone(tone));
    }
  }

  class Leaderboards {
    load(gameId, boardId) {
      return loadJson(boardKey(gameId, boardId), []);
    }

    save(gameId, boardId, entries) {
      saveJson(boardKey(gameId, boardId), entries.slice(0, 10));
    }

    qualifies(gameId, boardId, candidate, compareFn) {
      const token = Math.random().toString(16).slice(2);
      const entries = [...this.load(gameId, boardId), { ...candidate, __token: token }]
        .sort(compareFn);
      const rank = entries.findIndex((entry) => entry.__token === token);
      return rank > -1 && rank < 10 ? rank + 1 : null;
    }

    insert(gameId, boardId, candidate, compareFn) {
      const entries = [...this.load(gameId, boardId), candidate].sort(compareFn).slice(0, 10);
      this.save(gameId, boardId, entries);
      return entries.findIndex(
        (entry) =>
          entry.createdAt === candidate.createdAt &&
          entry.name === candidate.name &&
          entry.score === candidate.score
      ) + 1;
    }
  }

  class ProgressStore {
    constructor(gameId) {
      this.gameId = gameId;
    }

    load(fallback = {}) {
      return loadJson(progressKey(this.gameId), fallback);
    }

    save(nextValue) {
      saveJson(progressKey(this.gameId), nextValue);
    }
  }

  class GameShell {
    constructor(config) {
      this.config = config;
      this.gameId = config.gameId;
      this.boards = new Map();
      this.currentBoardId = config.defaultBoard ?? "main";
      this.audio = new AudioManager();
      this.leaderboards = new Leaderboards();
      this.progress = new ProgressStore(this.gameId);
      this.isPaused = false;
      this.finishing = false;

      this.elements = {
        body: document.body,
        hud: document.getElementById("hud"),
        noteTitle: document.getElementById("note-title"),
        noteBody: document.getElementById("note-body"),
        boardTitle: document.getElementById("board-title"),
        leaderboardList: document.getElementById("leaderboard-list"),
        recordSummary: document.getElementById("record-summary"),
        startOverlay: document.getElementById("start-overlay"),
        resultOverlay: document.getElementById("result-overlay"),
        resultTitle: document.getElementById("result-title"),
        resultText: document.getElementById("result-text"),
        resultStats: document.getElementById("result-stats"),
        bestRecord: document.getElementById("best-record"),
        recentRank: document.getElementById("recent-rank"),
        status: document.getElementById("status-line"),
        startButton: document.getElementById("start-btn"),
        playAgainButton: document.getElementById("play-again-btn"),
        restartButton: document.getElementById("restart-btn"),
        pauseButton: document.getElementById("pause-btn"),
        muteButton: document.getElementById("mute-btn"),
        mobileControls: document.getElementById("mobile-controls")
      };

      this.ensureModalScaffold();
      this.buildHud(config.hud ?? []);
      this.setNote(config.noteTitle ?? "Game Notes", config.noteBody ?? "Ready.");
      this.registerBoard(config.board ?? {
        id: this.currentBoardId,
        title: "Top 10",
        compare: (a, b) => (b.score ?? 0) - (a.score ?? 0),
        renderEntry: (entry, index) => `
          <div class="board-row">
            <span class="board-rank">#${index + 1}</span>
            <span class="board-name">${escapeHtml(entry.name)}</span>
            <span class="board-score">${escapeHtml(entry.score ?? 0)}</span>
          </div>
        `,
        summarize: (entry) => `Best: ${entry.score ?? 0}`
      });
      this.renderLeaderboard(this.currentBoardId);
      this.updateMuteButton();
      this.bindCommon();
    }

    ensureModalScaffold() {
      const container = document.createElement("div");
      container.innerHTML = `
        <div class="modal-backdrop hidden" id="rank-modal">
          <div class="modal-card">
            <p class="modal-kicker" id="rank-modal-kicker">NEW HIGH SCORE</p>
            <h3 id="rank-modal-title">You took the top spot.</h3>
            <p id="rank-modal-text">That run is now the one to beat.</p>
            <button class="arcade-button primary" id="rank-modal-btn" type="button">Continue</button>
          </div>
        </div>
        <div class="modal-backdrop hidden" id="name-modal">
          <div class="modal-card">
            <p class="modal-kicker" id="name-modal-kicker">TOP 10</p>
            <h3 id="name-modal-title">Add your name.</h3>
            <p id="name-modal-text">This run made the leaderboard.</p>
            <input class="name-input" id="name-input" type="text" maxlength="12" placeholder="Your name">
            <div class="modal-actions">
              <button class="arcade-button primary" id="name-submit" type="button">Save Record</button>
            </div>
          </div>
        </div>
      `;
      document.body.append(...container.children);
      this.rankModal = document.getElementById("rank-modal");
      this.rankModalTitle = document.getElementById("rank-modal-title");
      this.rankModalText = document.getElementById("rank-modal-text");
      this.rankModalButton = document.getElementById("rank-modal-btn");
      this.nameModal = document.getElementById("name-modal");
      this.nameModalTitle = document.getElementById("name-modal-title");
      this.nameModalText = document.getElementById("name-modal-text");
      this.nameInput = document.getElementById("name-input");
      this.nameSubmit = document.getElementById("name-submit");
    }

    async ensurePlayerName(options = {}) {
      const savedName = readPlayerName();
      if (savedName) {
        return savedName;
      }
      return this.promptForPlayerName({
        kicker: options.kicker ?? "PLAYER PROFILE",
        title: options.title ?? "Before the run starts, lock your player name.",
        text: options.text ?? "This name is reused for leaderboards, saved progress, and support shout-outs."
      });
    }

    bindCommon() {
      this.elements.startButton?.addEventListener("click", async () => {
        this.audio.unlock();
        this.audio.cue("click");
        await this.ensurePlayerName();
        this.hideOverlay(this.elements.startOverlay);
        this.config.onStart?.();
      });

      this.elements.playAgainButton?.addEventListener("click", () => {
        this.audio.cue("click");
        this.hideOverlay(this.elements.resultOverlay);
        this.config.onRestart?.();
      });

      this.elements.restartButton?.addEventListener("click", () => {
        this.audio.cue("click");
        this.hideOverlay(this.elements.resultOverlay);
        this.config.onRestart?.();
      });

      this.elements.pauseButton?.addEventListener("click", () => {
        this.togglePause();
      });

      this.elements.muteButton?.addEventListener("click", () => {
        this.audio.setMuted(!this.audio.isMuted());
        this.updateMuteButton();
      });
    }

    updateMuteButton() {
      if (this.elements.muteButton instanceof HTMLButtonElement) {
        this.elements.muteButton.textContent = this.audio.isMuted() ? "Sound Off" : "Sound On";
      }
    }

    buildHud(items) {
      if (!(this.elements.hud instanceof HTMLElement)) {
        return;
      }
      this.elements.hud.innerHTML = items.map((item) => `
        <article class="hud-card">
          <span>${escapeHtml(item.label)}</span>
          <strong id="hud-${escapeHtml(item.id)}">${escapeHtml(item.value ?? "0")}</strong>
        </article>
      `).join("");
    }

    updateStat(id, value) {
      const node = document.getElementById(`hud-${id}`);
      if (node) {
        node.textContent = String(value);
      }
    }

    setNote(title, body) {
      if (this.elements.noteTitle) {
        this.elements.noteTitle.textContent = title;
      }
      if (this.elements.noteBody) {
        this.elements.noteBody.textContent = body;
      }
    }

    setStatus(text) {
      if (this.elements.status) {
        this.elements.status.textContent = text;
      }
    }

    registerBoard(board) {
      this.boards.set(board.id, board);
    }

    useBoard(boardId) {
      this.currentBoardId = boardId;
      this.renderLeaderboard(boardId);
    }

    getBoard(boardId = this.currentBoardId) {
      return this.boards.get(boardId);
    }

    renderLeaderboard(boardId = this.currentBoardId) {
      const board = this.getBoard(boardId);
      if (!board || !(this.elements.leaderboardList instanceof HTMLElement)) {
        return;
      }

      if (this.elements.boardTitle) {
        this.elements.boardTitle.textContent = board.title;
      }

      const entries = this.leaderboards.load(this.gameId, boardId);
      if (!entries.length) {
        this.elements.leaderboardList.innerHTML = '<p class="board-empty">No scores yet. Start the first run.</p>';
        if (this.elements.recordSummary) {
          this.elements.recordSummary.textContent = "No record set yet.";
        }
        return;
      }

      this.elements.leaderboardList.innerHTML = entries
        .map((entry, index) => board.renderEntry(entry, index, escapeHtml, formatTime))
        .join("");

      if (this.elements.recordSummary) {
        this.elements.recordSummary.textContent = board.summarize(entries[0], formatTime);
      }
    }

    getBestEntry(boardId = this.currentBoardId) {
      return this.leaderboards.load(this.gameId, boardId)[0] ?? null;
    }

    togglePause(force) {
      this.isPaused = typeof force === "boolean" ? force : !this.isPaused;
      if (this.elements.pauseButton instanceof HTMLButtonElement) {
        this.elements.pauseButton.textContent = this.isPaused ? "Resume" : "Pause";
      }
      this.config.onPauseChange?.(this.isPaused);
    }

    showOverlay(node) {
      if (node instanceof HTMLElement) {
        node.classList.remove("hidden");
      }
    }

    hideOverlay(node) {
      if (node instanceof HTMLElement) {
        node.classList.add("hidden");
      }
    }

    setMobileControls(buttons) {
      if (!(this.elements.mobileControls instanceof HTMLElement)) {
        return;
      }

      this.elements.mobileControls.innerHTML = "";
      buttons.forEach((button) => {
        const control = document.createElement("button");
        control.type = "button";
        control.className = "touch-button";
        control.textContent = button.label;

        const onPress = (event) => {
          event.preventDefault();
          button.onDown?.();
          if (button.onTap) {
            button.onTap();
          }
        };

        const onRelease = (event) => {
          event.preventDefault();
          button.onUp?.();
        };

        control.addEventListener("touchstart", onPress, { passive: false });
        control.addEventListener("touchend", onRelease, { passive: false });
        control.addEventListener("mousedown", onPress);
        control.addEventListener("mouseup", onRelease);
        control.addEventListener("mouseleave", onRelease);
        control.addEventListener("click", (event) => {
          if (!button.onTap) {
            event.preventDefault();
          }
        });
        this.elements.mobileControls.appendChild(control);
      });
    }

    showInfoModal(title, text) {
      return new Promise((resolve) => {
        if (!(this.rankModal instanceof HTMLElement)) {
          resolve();
          return;
        }
        this.rankModalTitle.textContent = title;
        this.rankModalText.textContent = text;
        this.rankModal.classList.remove("hidden");

        const close = () => {
          this.rankModal.classList.add("hidden");
          this.rankModalButton.removeEventListener("click", close);
          resolve();
        };

        this.rankModalButton.addEventListener("click", close);
      });
    }

    promptForPlayerName({
      kicker = "TOP 10",
      title = "Add your name.",
      text = "Saved locally with the leaderboard entry.",
      defaultName = readPlayerName(),
      buttonLabel = "Save Name"
    } = {}) {
      return new Promise((resolve) => {
        if (!(this.nameModal instanceof HTMLElement) || !(this.nameInput instanceof HTMLInputElement)) {
          resolve("PLAYER");
          return;
        }

        const lastName = sanitizePlayerName(defaultName) || "PLAYER";
        const kickerNode = document.getElementById("name-modal-kicker");
        if (kickerNode) {
          kickerNode.textContent = kicker;
        }
        this.nameModalTitle.textContent = title;
        this.nameModalText.textContent = text;
        this.nameInput.value = lastName;
        this.nameSubmit.textContent = buttonLabel;
        this.nameSubmit.disabled = !lastName.trim();
        this.nameModal.classList.remove("hidden");
        this.nameInput.focus();
        this.nameInput.select();

        const updateState = () => {
          this.nameSubmit.disabled = !this.nameInput.value.trim();
        };

        const submit = () => {
          const cleanName = writePlayerName(this.nameInput.value);
          if (!cleanName) {
            return;
          }
          this.nameModal.classList.add("hidden");
          this.nameSubmit.removeEventListener("click", submit);
          this.nameInput.removeEventListener("keydown", onKeyDown);
          this.nameInput.removeEventListener("input", updateState);
          resolve(cleanName);
        };

        const onKeyDown = (event) => {
          if (event.key === "Enter") {
            submit();
          }
        };

        this.nameSubmit.addEventListener("click", submit);
        this.nameInput.addEventListener("keydown", onKeyDown);
        this.nameInput.addEventListener("input", updateState);
      });
    }

    promptForName(rank) {
      return this.promptForPlayerName({
        kicker: rank === 1 ? "NEW HIGH SCORE" : "TOP 10",
        title: rank === 1 ? "Champion run. Add your name." : `Rank #${rank} secured. Add your name.`,
        text: "Saved locally with the leaderboard entry.",
        buttonLabel: "Save Record"
      });
    }

    async finishRun({
      title = "Run complete",
      text = "Good run.",
      stats = [],
      boardId = this.currentBoardId,
      entry = null
    }) {
      if (this.finishing) {
        return;
      }

      this.finishing = true;
      const board = this.getBoard(boardId);
      let placedRank = null;

      if (board && entry) {
        placedRank = this.leaderboards.qualifies(this.gameId, boardId, entry, board.compare);
        if (placedRank) {
          if (placedRank === 1) {
            await this.showInfoModal("New High Score", "You took the top spot on this board.");
          }
          const name = await this.promptForName(placedRank);
          const finalEntry = {
            ...entry,
            name,
            createdAt: Date.now()
          };
          placedRank = this.leaderboards.insert(this.gameId, boardId, finalEntry, board.compare);
          this.renderLeaderboard(boardId);
        }
      }

      if (this.elements.resultTitle) {
        this.elements.resultTitle.textContent = title;
      }
      if (this.elements.resultText) {
        this.elements.resultText.textContent = text;
      }
      if (this.elements.resultStats) {
        this.elements.resultStats.innerHTML = stats
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("");
      }
      if (this.elements.recentRank) {
        this.elements.recentRank.textContent = placedRank ? `Leaderboard Rank: #${placedRank}` : "Leaderboard Rank: not in Top 10";
      }
      if (this.elements.bestRecord) {
        const bestEntry = this.getBestEntry(boardId);
        this.elements.bestRecord.textContent = bestEntry
          ? `Best record: ${board.summarize(bestEntry, formatTime)}`
          : "Best record: none yet";
      }

      this.showOverlay(this.elements.resultOverlay);
      this.finishing = false;
    }
  }

  window.Arcade = {
    GameShell,
    AudioManager,
    Leaderboards,
    ProgressStore,
    clamp,
    formatTime,
    escapeHtml,
    loadJson,
    saveJson,
    readPlayerName,
    writePlayerName,
    sanitizePlayerName,
    sorters: {
      scoreDesc: (a, b) => (b.score ?? 0) - (a.score ?? 0) || (a.time ?? Number.MAX_SAFE_INTEGER) - (b.time ?? Number.MAX_SAFE_INTEGER),
      timeAsc: (a, b) => (a.time ?? Number.MAX_SAFE_INTEGER) - (b.time ?? Number.MAX_SAFE_INTEGER) || (a.moves ?? Number.MAX_SAFE_INTEGER) - (b.moves ?? Number.MAX_SAFE_INTEGER),
      efficiencyDesc: (a, b) => (b.score ?? 0) - (a.score ?? 0) || (a.time ?? Number.MAX_SAFE_INTEGER) - (b.time ?? Number.MAX_SAFE_INTEGER)
    }
  };
})();
