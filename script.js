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

  ctx.fillStyle = "#00ff66"; // Neon green text
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < rainDrops.length; i++) {
    const text = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    // Position of character
    const x = i * fontSize;
    const y = rainDrops[i] * fontSize;

    // Draw the character
    // Give the lead character a bright white highlight for contrast
    if (Math.random() > 0.98) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#00ff66";
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
    ctx.fillStyle = "#080b0e";
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

// Focus input on click anywhere in terminal screen
document.querySelector(".panel-right").addEventListener("click", () => {
  terminalInput.focus();
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
        "[+] <span class='term-cyan'>Education:</span> Grade 12 (Bihar, India)",
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
    action: null // Handled directly in listener
  }
};

// Handle command input
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = ""; // Clear input immediately
    
    if (inputVal === "") return;

    // 1. Echo the command typed by guest
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
