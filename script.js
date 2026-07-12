const revealNodes = document.querySelectorAll("[data-reveal]");
const headerShell = document.querySelector(".header-shell");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav a");

function setText(id, value) {
  const node = document.getElementById(id);
  if (node instanceof HTMLElement) {
    node.textContent = value;
  }
}

function setupReveal() {
  if (!revealNodes.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealNodes.forEach((node) => {
    node.classList.add("reveal-ready");
    observer.observe(node);
  });
}

function setupMatrixRain() {
  const canvas = document.getElementById("matrix-rain");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const fontSize = 14;
  const glyphs = "01<>/$#%*+";
  let columns = 0;
  let drops = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.ceil(canvas.width / fontSize);
    drops = new Array(columns).fill(1);
  }

  function drawFrame() {
    context.fillStyle = "rgba(6, 12, 24, 0.14)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#76ecff";
    context.font = `${fontSize}px JetBrains Mono`;

    for (let index = 0; index < drops.length; index += 1) {
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = index * fontSize;
      const y = drops[index] * fontSize;
      context.fillText(glyph, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[index] = 0;
      }

      drops[index] += 1;
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  window.setInterval(drawFrame, 74);
}

function setupMenu() {
  if (!(menuToggle instanceof HTMLButtonElement) || !(headerShell instanceof HTMLElement)) {
    return;
  }

  function closeMenu() {
    headerShell.classList.remove("nav-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const open = headerShell.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node) || headerShell.contains(event.target)) {
      return;
    }
    closeMenu();
  });
}

function setupTilt() {
  const tiltTargets = document.querySelectorAll(
    ".portrait-card, .info-card, .project-card, .game-showcase-card, .contact-hub, .comic-panel, .donation-panel, .launcher-card, .hero-spotlight"
  );

  tiltTargets.forEach((target) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.classList.add("tilt-ready");

    target.addEventListener("pointermove", (event) => {
      const bounds = target.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      const rotateY = offsetX * 8;
      const rotateX = offsetY * -8;
      target.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    target.addEventListener("pointerleave", () => {
      target.style.transform = "";
    });
  });
}

function setupHeroTyping() {
  const target = document.getElementById("hero-typing");
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const phrases = [
    "Frontend builds with motion and intent.",
    "Playable browser games with real feedback.",
    "Projects that load fast and feel sharp.",
    "Code, polish, and repeat."
  ];

  let phraseIndex = 0;
  let letterIndex = 0;
  let deleting = false;

  function tick() {
    const currentPhrase = phrases[phraseIndex];

    if (!deleting) {
      letterIndex += 1;
      target.textContent = currentPhrase.slice(0, letterIndex);
      if (letterIndex >= currentPhrase.length) {
        deleting = true;
        window.setTimeout(tick, 1400);
        return;
      }
    } else {
      letterIndex -= 1;
      target.textContent = currentPhrase.slice(0, letterIndex);
      if (letterIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }

    window.setTimeout(tick, deleting ? 32 : 48);
  }

  tick();
}

function setupDonatePage() {
  const donateRoot = document.querySelector("[data-donate-page]");
  if (!(donateRoot instanceof HTMLElement)) {
    return;
  }

  const amountCards = donateRoot.querySelectorAll(".amount-card");
  const customAmountInput = donateRoot.querySelector("#custom-amount");
  const openUpi = donateRoot.querySelector("#open-upi");
  const copyUpi = donateRoot.querySelector("#copy-upi");
  const botRepeat = donateRoot.querySelector("#bot-repeat");
  const qrCodeNode = donateRoot.querySelector("#qr-code");
  const comicMascot = document.getElementById("comic-mascot");
  const thanksBot = document.getElementById("thanks-bot");
  const playerLine = document.getElementById("comic-player-line");
  const thanksOverlay = document.getElementById("thanks-overlay");
  const thanksDismiss = document.getElementById("thanks-dismiss");
  const thanksClose = document.getElementById("thanks-close");
  const thanksDonateAgain = document.getElementById("thanks-donate-again");

  const upiId = "sudonishant@pnb";
  const upiName = "Nishant Kumar";
  const botStateKey = "nk.donate.botState";
  const supportStateKey = "nk.donate.supportState";
  const returnKey = "nk-donate-return";
  const playerName = (() => {
    try {
      return (localStorage.getItem("nk.arcade.playerName") || "").trim();
    } catch (error) {
      return "";
    }
  })();

  let selectedAmount = 251;
  let lastSpokenLine = "";
  let customSpeakTimer = 0;
  let handledReturnAt = 0;

  const openers = [
    "Boss, yeh click promising lag raha hai",
    "Aaj support mood strong lag raha hai",
    "Screen dekh ke hi bot alert ho gaya",
    "Entry clean hai, ab amount bhi clean aana chahiye",
    "Yeh start achha lag raha hai",
    "Bot ne is move ko seriously le liya hai",
    "Scene ban sakta hai",
    "Aaj support section me jaan aa gayi",
    "Yeh arrival halki cheez nahi lag rahi",
    "Ab kuch achha hone wala lag raha hai"
  ];

  const middles = [
    "{nameLead}{amount} aaya to server raat bhar tik jayega",
    "{nameLead}{amount} se next build ka fuel ready ho jayega",
    "{nameLead}{amount} support nahi, seedha push hai",
    "{nameLead}{amount} se kaam visibly aage badhega",
    "{nameLead}{amount} ka impact seedha uptime par padta hai",
    "{nameLead}{amount} ka matlab bot aur build dono stable",
    "{nameLead}{amount} se coding night thodi aur lambi chalegi",
    "{nameLead}{amount} clean support bracket me aata hai",
    "{nameLead}{amount} se bot ka confidence alag level pakad leta hai",
    "{nameLead}{amount} se next feature ko hawa mil jati hai"
  ];

  const closers = [
    "custom box bhi khula hai agar mood aur bada ho",
    "UPI ready hai, bas final tap aapka chahiye",
    "agar haath khul raha ho to aur upar bhi ja sakte ho",
    "QR yahin hai, delay ki zarurat nahi",
    "is mood ko aadhe raste mat chhodo",
    "ek clean tap aur scene set",
    "aaj number thoda bold likhne me hi fayda hai",
    "agar aur support bacha ho to custom me likh do",
    "yeh waqt seedha finish maang raha hai",
    "ab bas amount final karo aur UPI kholo"
  ];

  const thanksOpeners = [
    "Aaj ka server sambhal gaya",
    "Return dekhte hi bot smile karne laga",
    "Yeh comeback solid tha",
    "Support landing clean mili",
    "Screen par wapas aate hi mood better ho gaya",
    "Yeh payment return strong laga",
    "Bot ne thank you mode on kar diya",
    "Ab build thoda halka saans le raha hai",
    "Yeh support seedha kaam aayega",
    "Return capture ho gaya boss"
  ];

  const thanksClosers = [
    "agar pet ka bhi intejam ho jaye to din ban jayega",
    "agar mood bacha ho to ek aur round bhi chalega",
    "custom amount abhi bhi aapka wait kar raha hai",
    "Again Donate button bhi isi liye yahin rakha hai",
    "yeh support seedha yaad rakha jayega",
    "ab kaam aur better pace pakdega",
    "agar phir se tap karoge to bot aur zyada tarif karega",
    "aaj ka gratitude properly save ho gaya",
    "ab aap repeat supporter zone ke kareeb ho",
    "yeh help seedha useful niklegi"
  ];

  const repeatPraise = [
    "Pehli baar ka support bhi strong lag raha hai.",
    "Repeat support dekh ke bot ka respect aur badh gaya.",
    "Aap ab regular support mode me aa gaye ho.",
    "Itni baar laut kar aana legend energy lagti hai.",
    "Ab to bot aapko VIP supporter bol raha hai."
  ];

  const amountProfiles = [
    {
      max: 180,
      title: "Warm support locked.",
      copy: "Yeh start clean hai, lekin aaj amount thoda aur upar bhi achha lagega.",
      text: "Warm tier selected. Good opening, bigger push still available.",
      nudge: "Agar mood ho to next jump 251 ya uske upar rakho.",
      stickerTop: "WARM",
      stickerSide: "START"
    },
    {
      max: 500,
      title: "Strong support detected.",
      copy: "Yeh range real help wali range hai. Bot yahan se proper serious ho jata hai.",
      text: "Strong tier selected. Build ko clean fuel mil raha hai.",
      nudge: "Custom amount se isko aur heavy push me badal sakte ho.",
      stickerTop: "STRONG",
      stickerSide: "LIVE"
    },
    {
      max: 1000,
      title: "Heavy support mode.",
      copy: "Iss bracket me bot sirf khush nahi hota, seedha proud feel karta hai.",
      text: "Heavy tier selected. Yeh amount visibly kaam aata hai.",
      nudge: "Agar momentum bana hua hai to 1101 ya custom aur clean lagega.",
      stickerTop: "HEAVY",
      stickerSide: "BOOST"
    },
    {
      max: Number.MAX_SAFE_INTEGER,
      title: "Legend amount entered.",
      copy: "Yeh direct premium support zone hai. Bot isko seedha big move maan raha hai.",
      text: "Legend tier selected. Is amount ka impact seedha long-term feel hota hai.",
      nudge: "UPI kholo aur isko clean finish do. Bot yeh scene yaad rakhega.",
      stickerTop: "LEGEND",
      stickerSide: "MAX"
    }
  ];

  function loadBotState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(botStateKey) || "{}");
      return {
        cursor: Number.isFinite(parsed.cursor) ? parsed.cursor : 0
      };
    } catch (error) {
      return { cursor: 0 };
    }
  }

  function saveBotState(nextState) {
    try {
      localStorage.setItem(botStateKey, JSON.stringify(nextState));
    } catch (error) {
      // Ignore storage issues.
    }
  }

  function buildSpeechBank() {
    const lines = [];
    for (const opener of openers) {
      for (const middle of middles) {
        for (const closer of closers) {
          lines.push(`${opener}, ${middle}, ${closer}.`);
          if (lines.length === 1000) {
            return lines;
          }
        }
      }
    }
    return lines;
  }

  const speechBank = buildSpeechBank();
  const botState = loadBotState();

  function loadSupportState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(supportStateKey) || "{}");
      return {
        returns: Number.isFinite(parsed.returns) ? parsed.returns : 0,
        repeatClicks: Number.isFinite(parsed.repeatClicks) ? parsed.repeatClicks : 0,
        lastAmount: Number.isFinite(parsed.lastAmount) ? parsed.lastAmount : 251
      };
    } catch (error) {
      return { returns: 0, repeatClicks: 0, lastAmount: 251 };
    }
  }

  function saveSupportState(nextState) {
    try {
      localStorage.setItem(supportStateKey, JSON.stringify(nextState));
    } catch (error) {
      // Ignore storage issues.
    }
  }

  const supportState = loadSupportState();

  function playerLead() {
    return playerName ? `${playerName}, ` : "";
  }

  function availableVoices() {
    if (!("speechSynthesis" in window)) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  function voiceScore(voice) {
    const lang = (voice.lang || "").toLowerCase();
    const name = (voice.name || "").toLowerCase();
    let score = 0;
    if (lang.includes("en-in")) score += 18;
    if (lang.includes("hi-in")) score += 14;
    if (name.includes("india")) score += 10;
    if (name.includes("neural")) score += 6;
    if (name.includes("microsoft")) score += 4;
    if (name.includes("google")) score += 3;
    if (name.includes("female") || name.includes("heera") || name.includes("swara")) score += 3;
    if (voice.localService) score += 2;
    return score;
  }

  function speechVoice() {
    if (!("speechSynthesis" in window)) {
      return null;
    }
    const voices = availableVoices();
    return voices.sort((left, right) => voiceScore(right) - voiceScore(left))[0] || null;
  }

  if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", speechVoice);
  }

  function setBotMood(mood) {
    [comicMascot, thanksBot].forEach((bot) => {
      if (!(bot instanceof HTMLElement)) {
        return;
      }
      bot.dataset.mood = mood;
      bot.classList.toggle("is-speaking", mood === "talk");
      bot.classList.toggle("is-smiling", mood === "smile");
    });
  }

  function supportTierText() {
    const repeatCount = supportState.returns + supportState.repeatClicks;
    return repeatPraise[Math.min(repeatCount, repeatPraise.length - 1)];
  }

  function makeLine(display, spoken = display) {
    return { display, spoken };
  }

  function speakBot(line, mood = "talk") {
    const payload = typeof line === "string" ? makeLine(line) : line;
    lastSpokenLine = payload.display;
    setText("comic-speech", payload.display);
    setBotMood(mood);
    window.setTimeout(() => {
      if (!(thanksOverlay instanceof HTMLElement) || thanksOverlay.hidden) {
        setBotMood("idle");
      }
    }, 2600);

    if (!("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(payload.spoken);
      const voice = speechVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "en-IN";
      } else {
        utterance.lang = "en-IN";
      }
      utterance.rate = mood === "smile" ? 0.92 : 0.9;
      utterance.pitch = mood === "smile" ? 1.02 : 0.98;
      utterance.volume = 1;
      utterance.onend = () => {
        if (!(thanksOverlay instanceof HTMLElement) || thanksOverlay.hidden) {
          setBotMood("idle");
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Ignore speech issues.
    }
  }

  function formatAmount(amount) {
    return `Rs ${Math.max(1, Math.floor(amount))}`;
  }

  function resolveProfile(amount) {
    return amountProfiles.find((profile) => amount <= profile.max) || amountProfiles[amountProfiles.length - 1];
  }

  function nextPitchLine(kind, amount) {
    const offsetMap = {
      select: 17,
      custom: 101,
      copy: 229,
      open: 347,
      return: 463,
      repeat: 587
    };
    const index = (botState.cursor + (offsetMap[kind] || 0) + amount) % speechBank.length;
    botState.cursor = (botState.cursor + 37) % speechBank.length;
    saveBotState(botState);
    const line = speechBank[index]
      .replace("{nameLead}", playerLead())
      .replace("{amount}", formatAmount(amount));
    return makeLine(`${line} ${supportTierText()}`, `${line}. ${supportTierText()}`);
  }

  function nextThanksLine(amount) {
    const starter = thanksOpeners[(botState.cursor + amount) % thanksOpeners.length];
    const closer = thanksClosers[(botState.cursor + amount * 3) % thanksClosers.length];
    botState.cursor = (botState.cursor + 29) % speechBank.length;
    saveBotState(botState);
    return makeLine(
      `${playerLead()}${starter} ${formatAmount(amount)} ke saath aa gaya. ${closer}`,
      `${playerLead()}${starter}. ${formatAmount(amount)} ke saath aa gaya. ${closer}`
    );
  }

  function sendoffLine(amount) {
    return makeLine(
      `${playerLead()}UPI khul raha hai. ${formatAmount(amount)} ready hai. Wapas aate hi main phir bolunga.`,
      `${playerLead()}UPI khul raha hai. ${formatAmount(amount)} ready hai. Wapas aate hi main phir bolunga.`
    );
  }

  function buildUpiUrl(amount) {
    const params = new URLSearchParams({
      pa: upiId,
      pn: upiName,
      tn: "Support Nishant",
      cu: "INR",
      am: String(amount)
    });
    return `upi://pay?${params.toString()}`;
  }

  function renderQr(url) {
    if (!(qrCodeNode instanceof HTMLElement) || typeof QRCode === "undefined") {
      return;
    }

    qrCodeNode.innerHTML = "";
    new QRCode(qrCodeNode, {
      text: url,
      width: 224,
      height: 224,
      colorDark: "#081020",
      colorLight: "#f5f7ff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  function resolveAmount() {
    if (
      customAmountInput instanceof HTMLInputElement &&
      customAmountInput.value &&
      Number(customAmountInput.value) > 0
    ) {
      return Number(customAmountInput.value);
    }
    return selectedAmount;
  }

  function syncActiveAmountCard(amount) {
    amountCards.forEach((card) => {
      const cardAmount = Number(card.getAttribute("data-amount") || "0");
      card.classList.toggle("active", cardAmount === amount);
    });
  }

  function applyContent(amount, options = {}) {
    const { speak = false, speechKind = "select" } = options;
    const safeAmount = Math.max(1, Math.floor(amount));
    const profile = resolveProfile(safeAmount);
    const label = formatAmount(safeAmount);
    const url = buildUpiUrl(safeAmount);

    setText("selected-amount-label", label);
    setText("donation-kicker", `${label} selected.`);
    setText("donation-text", profile.text);
    setText("comic-core", label);
    setText("comic-title", profile.title);
    setText("comic-copy", profile.copy);
    setText("donation-nudge", profile.nudge);
    setText("comic-sticker-top", profile.stickerTop);
    setText("comic-sticker-side", safeAmount >= 1000 ? "MAX" : safeAmount >= 501 ? "POWER" : safeAmount >= 251 ? "SOLID" : "UPI");
    setText("qr-caption", `QR generated for ${label}.`);

    if (openUpi instanceof HTMLAnchorElement) {
      openUpi.href = url;
    }

    renderQr(url);

    if (speak) {
      speakBot(nextPitchLine(speechKind, safeAmount), "talk");
    }

    supportState.lastAmount = safeAmount;
    saveSupportState(supportState);
  }

  amountCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!(card instanceof HTMLButtonElement)) {
        return;
      }
      selectedAmount = Number(card.dataset.amount ?? "251");
      syncActiveAmountCard(selectedAmount);
      if (customAmountInput instanceof HTMLInputElement) {
        customAmountInput.value = "";
      }
      applyContent(selectedAmount, { speak: true, speechKind: "select" });
    });
  });

  if (customAmountInput instanceof HTMLInputElement) {
    customAmountInput.addEventListener("input", () => {
      const parsed = Number(customAmountInput.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        amountCards.forEach((card) => card.classList.remove("active"));
        applyContent(parsed);
        window.clearTimeout(customSpeakTimer);
        customSpeakTimer = window.setTimeout(() => {
          applyContent(parsed, { speak: true, speechKind: "custom" });
        }, 520);
      }
    });
  }

  if (copyUpi instanceof HTMLButtonElement) {
    copyUpi.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(upiId);
        copyUpi.textContent = "UPI Copied";
        speakBot(nextPitchLine("copy", resolveAmount()), "talk");
        window.setTimeout(() => {
          copyUpi.textContent = "Copy UPI ID";
        }, 1200);
      } catch (error) {
        copyUpi.textContent = "Copy Failed";
        window.setTimeout(() => {
          copyUpi.textContent = "Copy UPI ID";
        }, 1200);
      }
    });
  }

  if (botRepeat instanceof HTMLButtonElement) {
    botRepeat.addEventListener("click", () => {
      const line = lastSpokenLine || nextPitchLine("repeat", resolveAmount());
      speakBot(line, "talk");
    });
  }

  if (openUpi instanceof HTMLAnchorElement) {
    openUpi.addEventListener("click", () => {
      const amount = resolveAmount();
      sessionStorage.setItem(returnKey, JSON.stringify({ amount, at: Date.now() }));
      speakBot(sendoffLine(amount), "talk");
    });
  }

  function openThanksOverlay() {
    if (!(thanksOverlay instanceof HTMLElement)) {
      return;
    }
    thanksOverlay.hidden = false;
    thanksOverlay.setAttribute("aria-hidden", "false");
    setBotMood("smile");
  }

  function closeThanksOverlay() {
    if (!(thanksOverlay instanceof HTMLElement)) {
      return;
    }
    thanksOverlay.hidden = true;
    thanksOverlay.setAttribute("aria-hidden", "true");
    setBotMood("idle");
  }

  if (thanksDismiss instanceof HTMLButtonElement) {
    thanksDismiss.addEventListener("click", closeThanksOverlay);
  }
  if (thanksClose instanceof HTMLButtonElement) {
    thanksClose.addEventListener("click", closeThanksOverlay);
  }

  if (thanksDonateAgain instanceof HTMLButtonElement) {
    thanksDonateAgain.addEventListener("click", () => {
      supportState.repeatClicks += 1;
      saveSupportState(supportState);
      closeThanksOverlay();
      const ladder = [101, 251, 501, 1101, 2101];
      const current = resolveAmount();
      const nextPreset = ladder.find((amount) => amount > current) || current + 500;
      selectedAmount = nextPreset;
      if (customAmountInput instanceof HTMLInputElement) {
        customAmountInput.value = "";
      }
      syncActiveAmountCard(selectedAmount);
      applyContent(selectedAmount, { speak: true, speechKind: "repeat" });
      donateRoot.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function updateThanksOverlay(amount) {
    const totalReturns = supportState.returns;
    const welcome = playerName ? `${playerName}, welcome back.` : "Welcome back.";
    const praise = repeatPraise[Math.min(Math.max(0, totalReturns - 1), repeatPraise.length - 1)];
    setText("thanks-core", formatAmount(amount));
    setText("thanks-overlay-title", welcome);
    setText("thanks-overlay-text", `${formatAmount(amount)} return capture ho gaya. ${praise}`);
    setText("thanks-overlay-nudge", "Aaj ka server set ho gaya. Agar mood ho to Again Donate se ek aur round chala do.");
  }

  function maybeHandleReturn() {
    if (document.visibilityState === "hidden") {
      return;
    }
    const raw = sessionStorage.getItem(returnKey);
    if (!raw) {
      return;
    }
    try {
      const payload = JSON.parse(raw);
      if (!payload || !payload.amount) {
        return;
      }
      if (handledReturnAt === payload.at) {
        return;
      }
      handledReturnAt = payload.at;
      sessionStorage.removeItem(returnKey);
      supportState.returns += 1;
      supportState.lastAmount = payload.amount;
      saveSupportState(supportState);
      openThanksOverlay();
      updateThanksOverlay(payload.amount);
      window.setTimeout(() => {
        speakBot(nextThanksLine(payload.amount), "smile");
      }, 420);
    } catch (error) {
      sessionStorage.removeItem(returnKey);
    }
  }

  if (playerLine instanceof HTMLElement && playerName) {
    playerLine.hidden = false;
    playerLine.textContent = `Arcade player: ${playerName}`;
  }

  function scheduleReturnCheck() {
    window.setTimeout(maybeHandleReturn, 320);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      scheduleReturnCheck();
    }
  });
  window.addEventListener("pageshow", scheduleReturnCheck);
  window.addEventListener("focus", scheduleReturnCheck);

  applyContent(selectedAmount);
}

setupReveal();
setupMatrixRain();
setupMenu();
setupTilt();
setupHeroTyping();
setupDonatePage();



function setupMascot3D() {
  const stage = document.getElementById("comic-stage");
  const mascot = document.getElementById("comic-mascot");
  const thanksOverlay = document.getElementById("thanks-overlay");
  const thanksBot = document.getElementById("thanks-bot");

  if (stage && mascot) {
    stage.style.perspective = "1000px";

    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      
      const rotateY = offsetX * 25;
      const rotateX = offsetY * -25;
      
      mascot.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    stage.addEventListener("pointerleave", () => {
      mascot.style.transform = "";
    });
  }

  if (thanksOverlay && thanksBot) {
    thanksOverlay.style.perspective = "1000px";

    thanksOverlay.addEventListener("pointermove", (event) => {
      const bounds = thanksOverlay.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      
      const rotateY = offsetX * 20;
      const rotateX = offsetY * -20;
      
      thanksBot.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    thanksOverlay.addEventListener("pointerleave", () => {
      thanksBot.style.transform = "";
    });
  }
}

setupMascot3D();


