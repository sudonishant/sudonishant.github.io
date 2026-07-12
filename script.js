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
  // Fade out previous frames with transparency to create trails
  ctx.fillStyle = "rgba(8, 11, 14, 0.06)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < rainDrops.length; i++) {
    const text = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    // Position of character
    const x = i * fontSize;
    const y = rainDrops[i] * fontSize;

    // Draw the character
    // Give the lead character a bright white highlight, others get neon green
    if (Math.random() > 0.98) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 8;
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
    // Clear canvas
    ctx.fillStyle = "#05070a";
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
const inputArea = document.getElementById("input-area");

// Focus input on click anywhere in terminal screen
document.querySelector(".panel-right").addEventListener("click", () => {
  if (inputArea.style.display !== "none") {
    terminalInput.focus();
  }
});

// Command definitions
const commands = {
  help: {
    desc: "Show all available security shell commands.",
    action: () => {
      return [
        "<span class='term-cyan'>Available Commands:</span>",
        "  <span class='term-green'>help</span>      - Show this manual list.",
        "  <span class='term-green'>about</span>     - Display information about Neeshant.",
        "  <span class='term-green'>skills</span>    - List cybersecurity capabilities & audit level.",
        "  <span class='term-green'>projects</span>  - List educational defensive security tools.",
        "  <span class='term-green'>contact</span>   - Show secure communication channels.",
        "  <span class='term-green'>matrix</span>    - Toggle the background Matrix code rain animation.",
        "  <span class='term-green'>clear</span>     - Clear terminal buffer."
      ].join("\n");
    }
  },
  about: {
    desc: "Display information about Neeshant.",
    action: () => {
      return [
        "[+] <span class='term-cyan'>Identity:</span> Neeshant (alias: sudonishant)",
        "[+] <span class='term-cyan'>Focus:</span> Cyber Security Student & Ethical Hacker",
        "[+] <span class='term-cyan'>Age:</span>       18 Years (Bihar, India)",
        "[+] <span class='term-cyan'>Profile:</span> Enthusiast focused on learning defensive security,",
        "             script scripting, OWASP core practices, and operating system hardening.",
        "[+] <span class='term-cyan'>Philosophy:</span> \"Identify security gaps to patch them, build secure code.\""
      ].join("\n");
    }
  },
  skills: {
    desc: "List cybersecurity capabilities.",
    action: () => {
      return [
        "<span class='term-cyan'>Capabilities Audit:</span>",
        "  System Hardening: [###########.......] 60%  (Linux / PAM / Firewalls)",
        "  Python Scripting: [#############.....] 70%  (Security / Scanners / Automation)",
        "  Web Pentesting:   [############......] 65%  (OWASP Top 10 / Burp / Audit)",
        "  Network Recon:    [############......] 60%  (Nmap / Wireshark / Protocols)"
      ].join("\n");
    }
  },
  projects: {
    desc: "List educational security tools.",
    action: () => {
      return [
        "<span class='term-cyan'>Educational Defensive Tools (In Development/Research Mode):</span>",
        "  - <span class='term-green'>PyScanner</span>  : A fast multi-threaded port scanner written in Python.",
        "  - <span class='term-green'>LogShield</span>  : Bash utility for automated log parsing & failed logins detection.",
        "  - <span class='term-green'>ReconBot</span>   : Script to harvest public details (OSINT) to identify audit targets.",
        "",
        "<span class='term-dim'>Note: These tools are created strictly for educational purposes,</span>",
        "<span class='term-dim'>defensive system auditing, and authorized security research.</span>"
      ].join("\n");
    }
  },
  contact: {
    desc: "Show secure communication channels.",
    action: () => {
      return [
        "<span class='term-cyan'>Secure Channels:</span>",
        "  Email:      <span class='term-green'>sudonishant@users.noreply.github.com</span>",
        "  Discord:    <span class='term-green'>sudonishant</span>",
        "  LinkedIn:   <span class='term-green'>nishant-kumar-423870291</span>",
        "  GitHub:     <span class='term-green'>https://github.com/sudonishant</span>"
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

// ==========================================
// 3. INTENSE HACKING INTRO SIMULATION
// ==========================================
const introLines = [
  { type: "write", prompt: true, text: "nmap -sV -T4 sudonishant.github.io" },
  { type: "log", text: "[+] Starting Nmap 7.92 ( https://nmap.org ) at 2026-07-12 14:08 IST", delay: 100 },
  { type: "log", text: "[+] Scanning sudonishant.github.io (185.199.108.153) [1000 ports]...", delay: 200 },
  { type: "log", text: "[+] Discovered open port 443/tcp (HTTPS) - Apache HTTP Server", delay: 500 },
  { type: "write", prompt: true, text: "exploit -target sudonishant.github.io -payload reverse_tcp", delay: 400 },
  { type: "log", text: "<span class='term-warning'>[!] Launching exploit module: exploit/multi/handler...</span>", delay: 200 },
  { type: "log", text: "<span class='term-warning'>[!] Setting PAYLOAD => generic/shell_reverse_tcp</span>", delay: 100 },
  { type: "log", text: "<span class='term-warning'>[!] Setting LHOST => 10.0.2.15</span>", delay: 100 },
  { type: "log", text: "[+] Injecting payload block... [SUCCESS]", delay: 300 },
  { type: "log", text: "[+] Sending stage (175135 bytes) to 185.199.108.153", delay: 200 },
  { type: "log", text: "<span class='term-green'>[+] Meterpreter session 1 opened (10.0.2.15:4444 -> 185.199.108.153:50423)</span>", delay: 600 },
  { type: "log", text: "<span class='term-green'>[+] Session 1 active. Compiling secure shell access... [OK]</span>", delay: 400 }
];

// Type characters helper
function typeText(element, text, index, callback) {
  if (index < text.length) {
    element.innerHTML += text[index];
    setTimeout(() => typeText(element, text, index + 1, callback), 50 + Math.random() * 50);
  } else {
    setTimeout(callback, 200);
  }
}

// Run the intro steps
function runIntro(stepIndex) {
  if (stepIndex >= introLines.length) {
    // End of intro simulation: clear screen and present the prompt
    setTimeout(() => {
      terminalHistory.innerHTML = "";
      
      // Print welcome
      const welcome = document.createElement("div");
      welcome.className = "welcome-message";
      welcome.innerHTML = `
<span class="glitch-title" style="font-size: 16px; display: block; margin-bottom: 8px;">[+] SECURITY SYSTEM COMPROMISED - ROOT ACCESS GRANTED</span>
[+] Welcome to Secure Shell Terminal v2.6-Stable.
[+] Intrusion simulation scan completed successfully.
[+] Type <span class="term-highlight">'help'</span> to view available security commands.
      `;
      terminalHistory.appendChild(welcome);
      
      // Display input prompt area
      inputArea.style.display = "flex";
      terminalInput.focus();
    }, 1200);
    return;
  }

  const step = introLines[stepIndex];
  const delay = step.delay || 300;

  setTimeout(() => {
    const logRow = document.createElement("div");
    logRow.className = "scan-line-log";

    if (step.type === "write") {
      // Print prompt and start typing
      logRow.innerHTML = `<span class="prompt"><span class="prompt-user">guest</span>@<span class="prompt-host">sudonishant</span>:<span class="prompt-tilde">~</span>$</span> `;
      const cmdTextSpan = document.createElement("span");
      cmdTextSpan.className = "term-input-echo";
      logRow.appendChild(cmdTextSpan);
      terminalHistory.appendChild(logRow);
      
      typeText(cmdTextSpan, step.text, 0, () => {
        runIntro(stepIndex + 1);
      });
    } else {
      // Print static logs
      logRow.innerHTML = step.text;
      terminalHistory.appendChild(logRow);
      
      // Auto-scroll during intro
      const screen = document.querySelector(".cli-screen");
      screen.scrollTop = screen.scrollHeight;
      
      runIntro(stepIndex + 1);
    }
  }, delay);
}

// Kick off simulation
window.onload = () => {
  runIntro(0);
};

// ==========================================
// 4. USER KEYBOARD LISTENER
// ==========================================
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = ""; // Clear input immediately
    
    if (inputVal === "") return;

    // 1. Echo command
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `<span class="prompt"><span class="prompt-user">guest</span>@<span class="prompt-host">sudonishant</span>:<span class="prompt-tilde">~</span>$</span> <span class="term-input-echo">${inputVal}</span>`;
    terminalHistory.appendChild(commandLine);

    // 2. Parse command
    const parts = inputVal.split(" ");
    const cmd = parts[0].toLowerCase();
    
    const outputDiv = document.createElement("div");
    outputDiv.className = "terminal-output-block";

    if (cmd === "clear") {
      terminalHistory.innerHTML = "";
      return;
    }

    if (commands[cmd]) {
      outputDiv.innerHTML = commands[cmd].action();
    } else {
      outputDiv.innerHTML = `<span class='term-error'>bash: command not found: ${inputVal}. Type 'help' to show commands.</span>`;
    }

    terminalHistory.appendChild(outputDiv);
    
    // Auto scroll to bottom
    const screen = document.querySelector(".cli-screen");
    screen.scrollTop = screen.scrollHeight;
  }
});
