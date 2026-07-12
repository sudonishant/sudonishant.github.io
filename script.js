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
const promptTilde = document.querySelector(".prompt-tilde");

// Session working directory tracking
let currentDir = "~";

// Focus input on load
window.onload = () => {
  terminalInput.focus();
};

// Focus input on click anywhere in terminal screen
document.querySelector(".mac-terminal-body").addEventListener("click", () => {
  terminalInput.focus();
});

// Helper to get raw prompt string for echoing
function getPromptHTML() {
  return `<span class="prompt"><span class="prompt-user">Nee</span>@<span class="prompt-host">nishant</span> <span class="prompt-tilde">${currentDir}</span> %</span>`;
}

// Simulated UNIX filesystem
const filesystem = {
  "~": {
    files: {
      "documents": { isDir: true, size: "128 B", perms: "drwxr-xr-x" },
      "downloads": { isDir: true, size: "64 B", perms: "drwxr-xr-x" }
    }
  },
  "~/documents": {
    files: {
      "dossier.txt": { isDir: false, size: "256 B", perms: "-rw-r--r--", content: () => commands.about.action() },
      "skills.audit": { isDir: false, size: "230 B", perms: "-rw-r--r--", content: () => commands.skills.action() },
      "projects.md": { isDir: false, size: "312 B", perms: "-rw-r--r--", content: () => commands.projects.action() },
      "contact.key": { isDir: false, size: "184 B", perms: "-rw-r--r--", content: () => commands.contact.action() },
      "confidential.bin": { isDir: false, size: "1.0 KB", perms: "-r--------", content: () => "<span class='term-error'>[!] ACCESS DENIED: abbe jada info mat le tu kuch nahi kar pyaga!</span>" }
    }
  },
  "~/downloads": {
    files: {
      "pyscanner.py": { 
        isDir: false, 
        size: "420 B", 
        perms: "-rwxr-xr-x", 
        content: () => [
          "<span class='term-dim'># Multi-threaded Port Scanner - sudonishant</span>",
          "import socket",
          "import threading",
          "",
          "def scan_port(host, port):",
          "    try:",
          "        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)",
          "        s.settimeout(0.5)",
          "        if s.connect_ex((host, port)) == 0:",
          "            print(f'[+] Port {port} is OPEN')",
          "        s.close()",
          "    except Exception:",
          "        pass",
          "",
          "print('[+] Initializing PyScanner thread pool...')"
        ].join("\n") 
      }
    }
  }
};

// Command definitions with TUI layouts and Kali Linux commands
const commands = {
  help: {
    desc: "Show available commands.",
    action: () => {
      return [
        "┌──────────────────────── AVAILABLE KALI SHELL COMMANDS ───────────────────┐",
        "│  <span class='term-green'>help</span>      - Show this interactive TUI shell guide.                  │",
        "│  <span class='term-green'>whoami</span>    - Print current user session details.                     │",
        "│  <span class='term-green'>pwd</span>       - Print name of current/working directory.                │",
        "│  <span class='term-green'>cd [dir]</span>  - Change working directory (~, documents, downloads).     │",
        "│  <span class='term-green'>ls</span>        - List directory contents and simulated files.            │",
        "│  <span class='term-green'>cat [file]</span>- Output content of a specific simulated file.            │",
        "│  <span class='term-green'>neofetch</span>  - Show system specs next to Kali Linux ASCII logo.        │",
        "│  <span class='term-green'>uname -a</span>  - Print system information and kernel stats.              │",
        "│  <span class='term-green'>hostname</span>  - Print current host system name.                         │",
        "│  <span class='term-green'>id</span>        - Print real and effective user/group IDs.                │",
        "│  <span class='term-green'>date</span>      - Print current system date and time.                     │",
        "│  <span class='term-green'>ping [tgt]</span>- Send ICMP echo requests to target host.                 │",
        "│  <span class='term-green'>echo [txt]</span>- Display a line of text on standard output.              │",
        "│  <span class='term-green'>matrix</span>    - Toggle the background Matrix code rain.                 │",
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
  pwd: {
    desc: "Print working directory.",
    action: () => {
      return currentDir === "~" ? "/home/nee" : `/home/nee/${currentDir.substring(2)}`;
    }
  },
  cd: {
    desc: "Change directory.",
    action: (target) => {
      if (!target || target === "~") {
        currentDir = "~";
        promptTilde.textContent = currentDir;
        return "";
      }
      if (target === "..") {
        if (currentDir !== "~") {
          currentDir = "~";
          promptTilde.textContent = currentDir;
        }
        return "";
      }
      
      const cleanTarget = target.toLowerCase();
      if (currentDir === "~") {
        if (cleanTarget === "documents") {
          currentDir = "~/documents";
          promptTilde.textContent = currentDir;
          return "";
        } else if (cleanTarget === "downloads") {
          currentDir = "~/downloads";
          promptTilde.textContent = currentDir;
          return "";
        }
      }
      return `<span class='term-error'>cd: no such file or directory: ${target}</span>`;
    }
  },
  ls: {
    desc: "List files.",
    action: () => {
      const rows = [
        "┌───────────────────────────────── DIRECTORY LISTING ───────────────────────────┐"
      ];
      const currentFiles = filesystem[currentDir].files;
      for (const [name, meta] of Object.entries(currentFiles)) {
        const spaceFile = name + (meta.isDir ? "/" : "");
        const paddedFile = spaceFile.padEnd(18, " ");
        const spaceSize = meta.size.padStart(6, " ");
        rows.push(`│  ${meta.perms}  1 Nee   staff  ${spaceSize}  ${paddedFile} │`);
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
      const currentFiles = filesystem[currentDir].files;
      const file = currentFiles[filename.toLowerCase()];
      if (file) {
        if (file.isDir) {
          return `<span class='term-error'>cat: ${filename}: Is a directory</span>`;
        }
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
  uname: {
    desc: "Print system information.",
    action: (arg) => {
      return "Linux nishant-kali 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2026-07-12) x86_64 GNU/Linux";
    }
  },
  hostname: {
    desc: "Print system host name.",
    action: () => "nishant-kali"
  },
  id: {
    desc: "Print user identity stats.",
    action: () => "uid=1001(nee) gid=1001(nee) groups=1001(nee),27(sudo),44(video)"
  },
  date: {
    desc: "Print system timestamp.",
    action: () => new Date().toString()
  },
  ping: {
    desc: "Ping host.",
    action: (target) => {
      if (!target) return "<span class='term-error'>ping: missing host operand</span>";
      return [
        `PING ${target} (142.250.190.46) 56(84) bytes of data.`,
        `64 bytes from 142.250.190.46: icmp_seq=1 ttl=116 time=14.2 ms`,
        `64 bytes from 142.250.190.46: icmp_seq=2 ttl=116 time=15.1 ms`,
        `64 bytes from 142.250.190.46: icmp_seq=3 ttl=116 time=13.8 ms`,
        `--- ${target} ping statistics ---`,
        `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`,
        `rtt min/avg/max/mdev = 13.841/14.392/15.122/0.531 ms`
      ].join("\n");
    }
  },
  echo: {
    desc: "Echo parameters.",
    action: (args) => args || ""
  },
  neofetch: {
    desc: "Show neofetch details.",
    action: () => {
      return [
        "<span class='term-cyan'>  ..............             Nee@nishant-kali</span>",
        "<span class='term-cyan'>  `, ,`                      ----------------</span>",
        "<span class='term-cyan'>    `:::`                    OS: <span class='term-green'>Kali GNU/Linux x86_64</span></span>",
        "<span class='term-cyan'>      `:::`                  Kernel: <span class='term-green'>6.5.0-kali3-amd64</span></span>",
        "<span class='term-cyan'>    `::::::::`               Uptime: <span class='term-green'>17 years, 8 months, 12 days</span></span>",
        "<span class='term-cyan'>   `:::::::::::`             Shell: <span class='term-green'>zsh 5.9</span></span>",
        "<span class='term-cyan'>  `::::::::::::::`           Resolution: <span class='term-green'>3840x2160 (4K UHD)</span></span>",
        "<span class='term-cyan'>  :::::::::::::::::          DE: <span class='term-green'>Glassmorphism TUI</span></span>",
        "<span class='term-cyan'>  ::::::::::::::::::         WM: <span class='term-green'>Mutter</span></span>",
        "<span class='term-cyan'>  :::::::::::::::::          Terminal: <span class='term-green'>macOS Terminal Simulator</span></span>",
        "<span class='term-cyan'>  ::::::::::::::`            CPU: <span class='term-green'>Intel i7-13700K (16) @ 5.40GHz</span></span>",
        "<span class='term-cyan'>   :::::::::::`              GPU: <span class='term-green'>NVIDIA RTX 4080</span></span>",
        "<span class='term-cyan'>    ::::::::`                Memory: <span class='term-green'>8420MiB / 32540MiB (25%)</span></span>",
        "<span class='term-cyan'>      `:::`</span>",
        "<span class='term-cyan'>        `:::`</span>",
        "<span class='term-cyan'>          `:::`</span>"
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

    // 1. Echo command using custom user prompt and directory
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${inputVal}</span>`;
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

    // 3. Parse command arguments
    const spaceIndex = inputVal.indexOf(" ");
    let cmd = inputVal.toLowerCase();
    let args = "";
    
    if (spaceIndex !== -1) {
      cmd = inputVal.substring(0, spaceIndex).toLowerCase();
      args = inputVal.substring(spaceIndex + 1);
    }

    if (cmd === "clear") {
      terminalHistory.innerHTML = "";
      return;
    }

    if (cmd === "cd") {
      outputDiv.innerHTML = commands.cd.action(args);
    } else if (cmd === "cat") {
      outputDiv.innerHTML = commands.cat.action(args);
    } else if (cmd === "echo") {
      outputDiv.innerHTML = commands.echo.action(args);
    } else if (cmd === "uname") {
      outputDiv.innerHTML = commands.uname.action(args);
    } else if (commands[cmd]) {
      outputDiv.innerHTML = commands[cmd].action(args);
    } else {
      outputDiv.innerHTML = `<span class='term-error'>zsh: command not found: ${inputVal}. Type 'help' to show commands.</span>`;
    }

    if (outputDiv.innerHTML !== "") {
      terminalHistory.appendChild(outputDiv);
    }
    
    // Auto scroll to bottom
    const container = document.querySelector(".terminal-container");
    container.scrollTop = container.scrollHeight;
  }
});
