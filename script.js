// sudonishant.github.io - Terminal & Matrix Animation script

// ==========================================
// 1. HIGH-PERFORMANCE MATRIX RAIN ANIMATION
// ==========================================
const canvas = document.getElementById("matrix-canvas");
const ctx = canvas.getContext("2d");

let animationId = null;
let isMatrixActive = true;

// Set canvas dimensions
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Character set (Cyberpunk, Katakana, and standard symbols)
const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const hex = "0123456789ABCDEF";
const symbols = "$#@%&*+=?!^~<>";
const alphabet = (katakana + latin + hex + symbols).split("");

const fontSize = 14;
let columns = Math.floor(canvas.width / fontSize);
let rainDrops = [];

// Initialize rain columns
function initRain() {
  columns = Math.floor(canvas.width / fontSize);
  rainDrops = [];
  for (let x = 0; x < columns; x++) {
    rainDrops[x] = Math.random() * -100; // Offset starting heights for natural flow
  }
}
initRain();

// Draw matrix characters
function drawMatrix() {
  ctx.fillStyle = "rgba(3, 5, 8, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < rainDrops.length; i++) {
    const text = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    // Position of character
    const x = i * fontSize;
    const y = rainDrops[i] * fontSize;

    // Draw the character
    if (Math.random() > 0.985) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#00ff66";
    }
    
    ctx.fillText(text, x, y);

    // If it reaches the bottom, randomly reset to top
    if (y > canvas.height && Math.random() > 0.975) {
      rainDrops[i] = 0;
    }
    
    // Speed increment
    rainDrops[i]++;
  }
}

// Start rain loop
function startMatrix() {
  if (!isMatrixActive) return;
  drawMatrix();
  animationId = requestAnimationFrame(startMatrix);
}

// Toggle matrix animation
function toggleMatrix() {
  if (isMatrixActive) {
    isMatrixActive = false;
    cancelAnimationFrame(animationId);
    // Clear canvas to dark desktop background
    ctx.fillStyle = "#030508";
    ctx.shadowBlur = 0;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    isMatrixActive = true;
    initRain();
    startMatrix();
  }
  return isMatrixActive;
}

// Run matrix on startup
startMatrix();


// ==========================================
// 2. TERMINAL SHELL SIMULATOR
// ==========================================
const terminalInput = document.getElementById("terminal-input");
const terminalHistory = document.getElementById("terminal-history");

// Focus input on load
window.onload = () => {
  terminalInput.focus();
};

// Focus input on click anywhere in terminal screen
document.querySelector(".mac-terminal-body").addEventListener("click", () => {
  terminalInput.focus();
});

// Simulated Filesystem
const files = {
  "dossier.txt": {
    size: "256 B",
    owner: "Nee",
    perms: "-rw-r--r--",
    content: () => commands.about.action()
  },
  "skills.audit": {
    size: "230 B",
    owner: "Nee",
    perms: "-rw-r--r--",
    content: () => commands.skills.action()
  },
  "projects.md": {
    size: "312 B",
    owner: "Nee",
    perms: "-rw-r--r--",
    content: () => commands.projects.action()
  },
  "contact.key": {
    size: "184 B",
    owner: "Nee",
    perms: "-rw-r--r--",
    content: () => commands.contact.action()
  },
  "confidential.bin": {
    size: "1.0 KB",
    owner: "root",
    perms: "-r--------",
    content: () => "<span class='term-error'>[!] ACCESS DENIED: abbe jada info mat le tu kuch nahi kar pyaga!</span>"
  }
};

// Command definitions with custom TUI layouts
const commands = {
  help: {
    desc: "Show all available security shell commands.",
    action: () => {
      return [
        "┌──────────────────────── AVAILABLE SHELL COMMANDS ────────────────────────┐",
        "│  <span class='term-green'>help</span>      - Show this interactive TUI menu guide.                   │",
        "│  <span class='term-green'>whoami</span>    - Print current user session details.                     │",
        "│  <span class='term-green'>ls</span>        - List simulated folder contents and files.               │",
        "│  <span class='term-green'>cat [file]</span>- Output content of a specific simulated file.            │",
        "│  <span class='term-green'>about</span>     - Display background dossier for Nee.                     │",
        "│  <span class='term-green'>skills</span>    - List technical security capabilities & audit level.     │",
        "│  <span class='term-green'>projects</span>  - Show defensive security auditing code repositories.     │",
        "│  <span class='term-green'>contact</span>   - Display secure channels & connection keys.              │",
        "│  <span class='term-green'>matrix</span>    - Toggle the Matrix background code rain.                 │",
        "│  <span class='term-green'>clear</span>     - Clear terminal buffer.                                  │",
        "└──────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  whoami: {
    desc: "Print current user details.",
    action: () => {
      return [
        "┌────────────────────────────── SESSION WHOAMI ─────────────────────────────┐",
        "│  User: Nee (Security Researcher & Ethical Hacker)                         │",
        "│  Host: nishant (sudonishant.github.io)                                    │",
        "│  Role: Local Administrator / Auditor                                      │",
        "└───────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  ls: {
    desc: "List files.",
    action: () => {
      const rows = [
        "┌───────────────────────────────── DIRECTORY LISTING ───────────────────────────┐"
      ];
      for (const [name, meta] of Object.entries(files)) {
        // format: perms size owner file
        const spaceFile = name.padEnd(18, " ");
        const spaceSize = meta.size.padStart(6, " ");
        rows.push(`│  ${meta.perms}  1 ${meta.owner.padEnd(4, " ")}  staff  ${spaceSize}  ${spaceFile} │`);
      }
      rows.push("└───────────────────────────────────────────────────────────────────────────────┘");
      return rows.join("\n");
    }
  },
  cat: {
    desc: "Read file.",
    action: (filename) => {
      if (!filename) {
        return "<span class='term-error'>usage: cat [filename]</span>";
      }
      const file = files[filename.toLowerCase()];
      if (file) {
        return file.content();
      } else {
        return `<span class='term-error'>cat: ${filename}: No such file or directory</span>`;
      }
    }
  },
  about: {
    desc: "Display information about Neeshant.",
    action: () => {
      return [
        "┌───────────────────────────────── NEE DOSSIER ─────────────────────────────────┐",
        "│  [+] <span class='term-cyan'>Identity</span> : Neeshant (alias: sudonishant)                                 │",
        "│  [+] <span class='term-cyan'>Focus</span>    : Cyber Security Student & Ethical Hacker                       │",
        "│  [+] <span class='term-cyan'>Age</span>      : 18 Years (Bihar, India)                                       │",
        "│  [+] <span class='term-cyan'>Profile</span>  : Focused on threat hunting, script automation,                 │",
        "│                 OWASP core guidelines, and system hardening.                  │",
        "│  [+] <span class='term-cyan'>Philosophy</span>: \"Identify security gaps to patch them, build safe.\"         │",
        "└───────────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  skills: {
    desc: "List cybersecurity capabilities.",
    action: () => {
      return [
        "┌────────────────────────────── CAPABILITIES AUDIT ─────────────────────────────┐",
        "│  System Hardening : ████████████░░░░░░ 60%  (PAM / Firewalls / Auth)            │",
        "│  Python Scripting : ██████████████░░░░ 70%  (Scanners / Scripting)              │",
        "│  Web Pentesting   : █████████████░░░░░ 65%  (OWASP Top 10 / Auditing)           │",
        "│  Network Recon    : ████████████░░░░░░ 60%  (Nmap / Wireshark / Protocols)      │",
        "└───────────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  projects: {
    desc: "List educational security tools.",
    action: () => {
      return [
        "┌─────────────────────────── DEFENSIVE RESEARCH PROJECTS ───────────────────────┐",
        "│  - <span class='term-green'>PyScanner</span>  : Fast multi-threaded target port scanner script.              │",
        "│  - <span class='term-green'>LogShield</span>  : Bash log parsing script for intrusion monitoring.             │",
        "│  - <span class='term-green'>ReconBot</span>   : Script for automated details harvesting (OSINT).              │",
        "├───────────────────────────────────────────────────────────────────────────────┤",
        "│  Note: All tools are developed strictly for educational purposes,             │",
        "│  defensive security audits, and authorized threat research labs.              │",
        "└───────────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  contact: {
    desc: "Show secure communication channels.",
    action: () => {
      return [
        "┌───────────────────────────────── SECURE CHANNELS ─────────────────────────────┐",
        "│  Email   : <span class='term-green'>sudonishant@users.noreply.github.com</span>                               │",
        "│  Discord : <span class='term-green'>sudonishant</span>                                                        │",
        "│  LinkedIn: <span class='term-green'>nishant-kumar-423870291</span>                                            │",
        "│  GitHub  : <span class='term-green'>https://github.com/sudonishant</span>                                     │",
        "└───────────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  matrix: {
    desc: "Toggle Matrix rain background.",
    action: () => {
      const active = toggleMatrix();
      return active 
        ? "[+] Matrix digital rain animation: <span class='term-green'>ENABLED</span>"
        : "[-] Matrix digital rain animation: <span class='term-error'>DISABLED</span>";
    }
  },
  clear: {
    desc: "Clear terminal buffer.",
    action: null
  }
};

// Check for sensitive queries (Aadhaar, passwords, location, etc.)
function isSensitiveQuery(text) {
  const sensitiveWords = [
    "aadhaar", "aadhar", "sudo", "hack", "flag", "root", "password", 
    "pass", "admin", "ip", "location", "personal", "secret", "cvv", 
    "card", "details", "phone", "mobile", "address", "otp", "pin"
  ];
  const query = text.toLowerCase();
  return sensitiveWords.some(word => query.includes(word));
}

// Handle command input
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = ""; // Clear input immediately
    
    if (inputVal === "") return;

    // 1. Echo command using custom user prompt Nee@nishant
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `<span class="prompt"><span class="prompt-user">Nee</span>@<span class="prompt-host">nishant</span> <span class="prompt-tilde">~</span> %</span> <span class="term-input-echo">${inputVal}</span>`;
    terminalHistory.appendChild(commandLine);

    const outputDiv = document.createElement("div");
    outputDiv.className = "terminal-output-block";

    // 2. Intercept sensitive commands
    if (isSensitiveQuery(inputVal)) {
      outputDiv.innerHTML = "<span class='term-error'>[!] ERROR: abbe jada info mat le tu kuch nahi kar pyaga!</span>";
      terminalHistory.appendChild(outputDiv);
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 3. Parse command
    const parts = inputVal.split(" ");
    const cmd = parts[0].toLowerCase();

    if (cmd === "clear") {
      terminalHistory.innerHTML = "";
      return;
    }

    if (cmd === "cat") {
      outputDiv.innerHTML = commands.cat.action(parts[1]);
    } else if (commands[cmd]) {
      outputDiv.innerHTML = commands[cmd].action();
    } else {
      outputDiv.innerHTML = `<span class='term-error'>zsh: command not found: ${inputVal}. Type 'help' to show commands.</span>`;
    }

    terminalHistory.appendChild(outputDiv);
    
    // Auto scroll to bottom
    const container = document.querySelector(".terminal-container");
    container.scrollTop = container.scrollHeight;
  }
});
