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
    rainDrops[x] = Math.random() * -100;
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
    const x = i * fontSize;
    const y = rainDrops[i] * fontSize;

    if (Math.random() > 0.985) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#00ff66";
    }
    
    ctx.fillText(text, x, y);

    if (y > canvas.height && Math.random() > 0.975) {
      rainDrops[i] = 0;
    }
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

startMatrix();


// ==========================================
// 2. TERMINAL SHELL SIMULATOR
// ==========================================
const terminalInput = document.getElementById("terminal-input");
const terminalHistory = document.getElementById("terminal-history");
const promptTilde = document.querySelector(".prompt-tilde");
const promptLabel = document.getElementById("prompt-label");
const winTitle = document.getElementById("terminal-window-title");
const tabInd = document.getElementById("terminal-tab-indicator");

// Interactive modes, user identity and filesystem state
let currentUser = "nee";
let currentHost = "nishant-kali";
let currentDir = "~";
let isRoot = false;
let isPasswordPrompt = false;
let pendingSudoCommand = null;
let activeInterval = null;

let editorMode = null; // "nano", "htop", "msf", "python"
let htopInterval = null;
let aliasMap = {};
let commandHistory = [];

// Focus input on load
window.onload = () => {
  terminalInput.focus();
};

document.querySelector(".mac-terminal-body").addEventListener("click", () => {
  if (!editorMode) {
    terminalInput.focus();
  }
});

// Dynamic authentic prompt formatter
function getPromptHTML() {
  if (isPasswordPrompt) {
    return `<span class="term-yellow">[sudo] password for ${currentUser}:</span>`;
  }
  if (editorMode === "msf") {
    return `<span class="prompt-user">msf6</span> <span class="term-cyan">&gt;</span>`;
  }
  if (editorMode === "python") {
    return `<span class="term-green">&gt;&gt;&gt;</span>`;
  }
  if (isRoot) {
    return `<span class="prompt-root" style="color:#ff5f56;font-weight:700;">root</span>@<span class="prompt-host" style="color:#00e5ff;">${currentHost}</span>:<span class="prompt-tilde" style="color:#3b82f6;">${currentDir}</span>#`;
  }
  return `<span class="prompt-user" style="color:#00ff66;font-weight:600;">${currentUser}</span>@<span class="prompt-host" style="color:#00e5ff;">${currentHost}</span>:<span class="prompt-tilde" style="color:#3b82f6;">${currentDir}</span>$`;
}

function updatePrompt() {
  if (promptLabel) {
    promptLabel.innerHTML = getPromptHTML();
  }
  if (winTitle) {
    if (isRoot) {
      winTitle.textContent = `root@${currentHost}: ${currentDir} (bash)`;
    } else {
      winTitle.textContent = `${currentUser}@${currentHost}: ${currentDir} (zsh)`;
    }
  }
}

// Default filesystem structure with authentic hacker files & witty twists
const defaultFilesystem = {
  "~": {
    "desktop": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "welcome_note.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│             NISHANT'S KALI WORKSTATION                 │",
          "├────────────────────────────────────────────────────────┤",
          "│  OS: Kali GNU/Linux 6.6.9-1kali1 (x86_64)              │",
          "│  Shell: zsh 5.9 | User: nee@nishant-kali               │",
          "│  Status: Active Penetration Testing Node               │",
          "│                                                        │",
          "│  Warning: Everything you type is monitored.            │",
          "│  Type 'ls' to see desktop files.                       │",
          "│  Type 'help' to show all Kali Linux commands.          │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "aadhaar.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│                   [!] SECURITY ALERT [!]               │",
          "├────────────────────────────────────────────────────────┤",
          "│                                                        │",
          "│   Abeee! Noob 💀 Mera details jankar kya karega?       │",
          "│   Achha se apna kaam karo!                             │",
          "│                                                        │",
          "│   [+] Target IP: 192.168.1.1 (Trace successful 😂)     │",
          "│   [+] Threat Level: Script Kiddie (Zero Risk)          │",
          "│   [+] Real Info: Nishant Kumar | Ethical Hacker        │",
          "│   [+] Portfolio: https://sudonishant.github.io/        │",
          "│                                                        │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "dossier.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│             CONFIDENTIAL DOSSIER - LEVEL 4             │",
          "├────────────────────────────────────────────────────────┤",
          "│  Target: Nishant Kumar (alias: sudonishant)            │",
          "│  Focus: Ethical Hacker | Security Researcher           │",
          "│  Age: 18 | Base: Bihar, India                          │",
          "│                                                        │",
          "│  \"Abeee! Noob 💀 Mera details jankar kya karega?       │",
          "│   Accha se apna kaam karo! Pehle Nmap scan seekh le.\"  │",
          "│                                                        │",
          "│  Philosophy: \"Find the crack before the bad guy does.\" │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "passwords.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│             ROOT SHADOW PASSWORD VAULT                 │",
          "├────────────────────────────────────────────────────────┤",
          "│  GitHub          │ sudonishant  │ ************         │",
          "│  Discord         │ sudonishant  │ ************         │",
          "│  SharmaJi_WiFi   │ WPA2         │ sharmaji_ki_chai_123 │",
          "│  FBI_Backdoor    │ root         │ hunter2              │",
          "│  Bank_PIN        │ ATM          │ \"Abeee Noob! Account │",
          "│                  │              │  me ₹14 bache hain!😂│",
          "│  Shadow_Hash     │ $6$rounds=50000$salt$k9z... (Crack) │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "target_recon.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│              LIVE TARGET RECONNAISSANCE LOG            │",
          "├────────────────────────────────────────────────────────┤",
          "│  Scope: *.bugcrowd.com / *.hackerone.com targets       │",
          "│  [+] Active Subdomains: 142 discovered                 │",
          "│  [+] Open Ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)      │",
          "│  [!] Findings:                                         │",
          "│      - Critical IDOR in billing invoice endpoint       │",
          "│      - Blind SSRF triggered via webhook parser         │",
          "│  [-] Note: Reported responsibly to security team.      │",
          "│  [+] Status: Triaged / Bounty Pending 💰              │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "wifi_handshake.cap": [
          "[WIFI 802.11 WPA2 4-WAY HANDSHAKE DUMP]",
          "BSSID: 00:14:6C:7E:40:80 | ESSID: \"SharmaJi_HighSpeed_5G\"",
          "Handshake captured: 14,290 EAPOL frames",
          "Dictionary attack: rockyou.txt",
          "Decrypted Key: \"sharmaji_ka_beta_engineer\"",
          "Status: PWNED in 0.42 seconds. (Sharma ji ko pata na chale 🤫)"
        ].join("\n"),
        "fbi_warning.txt": [
          "[!!! WARNING: UNLAWFUL ACCESS MONITORING ACTIVE !!!]",
          "Federal Cyber Division (Honeypot Triggered)",
          "Source: Client Browser via WebAssembly VM",
          "Intruder Classification: Curious Visitor / Noob Explorer",
          "Result: Abeee! Noob 💀 Dar gaya kya? Chill kar, ethical raho aur apna kaam karo!"
        ].join("\n"),
        "bank_balance.txt": [
          "STATE BANK OF HACKERS:",
          "Account Holder: Nishant Kumar",
          "Available Balance: ₹14.30",
          "Crypto Portfolio: 0.00000042 BTC",
          "Status: Insufficient funds to buy Maggi.",
          "\"Abeee! Noob, ethical hacker hu, Ambani nahi! Bug bounty aane de fir party karenge.\" 😂"
        ].join("\n"),
        "crush.txt": [
          "ERROR 404: Relationship Not Found!",
          "Exception: Too busy analyzing network packets and memory dumps.",
          "Terminal is my only loyal companion. 💻❤️"
        ].join("\n"),
        "payloads.sh": [
          "#!/bin/bash",
          "# Nishant's Automated Penetration Payload",
          "echo \"[*] Initializing quantum injection...\"",
          "echo \"[+] Reverse shell established on 127.0.0.1:4444\"",
          "echo \"💀 Abeee! Noob! Terminal me script run karke socha tu hacker ban gaya? Padhai pe dhyan de!\""
        ].join("\n"),
        "todo_hacks.txt": [
          "NISHANT'S DAILY CHECKLIST:",
          "[x] Wake up & update Kali packages (sudo apt update)",
          "[x] Drink Adrak Chai ☕",
          "[x] Test new SQL injection bypass script",
          "[ ] Report sub-domain takeover to vulnerability disclosure program",
          "[ ] Teach noobs why 'sudo rm -rf /' is fatal",
          "[ ] Push latest code to GitHub"
        ].join("\n"),
        "skills.audit": [
          "SKILLS AUDIT (REAL DATA):",
          "Web Pentesting (OWASP Top 10): 85%",
          "Network Recon (Nmap/Wireshark): 80%",
          "Python Security Automation:    75%",
          "Linux System Hardening:        80%",
          "Reverse Engineering:           60%",
          "Trolling Script Kiddies:       100% (Abeee Noob Level 💀)"
        ].join("\n"),
        "projects.md": [
          "# NISHANT'S KEY PROJECTS",
          "- OmniDetect AI: Media Forensics & Deepfake Detection Platform",
          "- AetherSense: 3D WiFi Volumetric Occupancy Radar & Spatial Mapper",
          "- PyScanner: Multi-threaded socket-level asynchronous port exploration tool",
          "- LogShield: Intrusion detection & brute-force mitigation daemon",
          "- ReconBot: Automated OSINT aggregator for target reconnaissance"
        ].join("\n"),
        "contact.key": [
          "CONTACT DETAILS:",
          "Email:    sudonishant@users.noreply.github.com",
          "GitHub:   https://github.com/sudonishant",
          "Discord:  sudonishant",
          "LinkedIn: nishant-kumar-423870291"
        ].join("\n"),
        "portfolio_shortcut.lnk": "URL: https://sudonishant.github.io/\nStatus: Active Online Node"
      }
    },
    "documents": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "dossier.txt": "Identity: Neeshant (alias: sudonishant)\nFocus: Cyber Security Student & Ethical Hacker\nAge: 18 Years (Bihar, India)\nWarning: Abeee! Noob 💀 Mera details jankar kya karega? Achha se apna kaam karo!",
        "skills.audit": "System Hardening: 80%  (PAM / Firewalls)\nPython Scripting: 75%  (Scanners / Automation)\nWeb Pentesting:   85%  (OWASP Top 10)\nNetwork Recon:    80%  (Nmap / Wireshark)\nTrolling Noobs:   100% (Abeee Noob Level)",
        "projects.md": "- OmniDetect AI: Full-Stack Media Metadata Forensics & AI Detection Platform (https://github.com/sudonishant/omnidetect-ai).\n- AetherSense: 3D WiFi Volumetric Occupancy Radar & Spatial Mapper (https://github.com/sudonishant/aethersense).\n- PyScanner: Multi-threaded port scanner in Python.\n- LogShield: Bash failed login parser utility.\n- ReconBot: OSINT harvesting automation scripts.",
        "contact.key": "Email: sudonishant@users.noreply.github.com\nDiscord: sudonishant\nLinkedIn: nishant-kumar-423870291",
        "confidential.bin": "[SENSITIVE DATA LAYER] Secure system logs locked. (Abeee Noob! Sudo permission chahiye iske liye!)"
      }
    },
    "downloads": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "pyscanner.py": "# Multi-threaded port scanner - sudonishant\nimport socket\nimport threading\n\ndef scan_port(host, port):\n    try:\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        s.settimeout(0.5)\n        if s.connect_ex((host, port)) == 0:\n            print(f'[+] Port {port} is OPEN')\n        s.close()\n    except:\n        pass",
        "exploit_poc.py": "# PoC Exploit - Created by Nishant (sudonishant)\nprint('[*] Sending exploit payload...')\nprint('💀 Abeee! Noob! Mera details jankar kya karega? Jaake apna kaam kar!')",
        "wordlist.txt": "admin\npassword\n123456\nadmin123\nsharmaji123\nhacker\npass@123\niloveyou"
      }
    }
  }
};

// Initialize fileSystem with localStorage state persistence
let filesystem = {};
function saveFilesystem() {
  localStorage.setItem("nee_terminal_fs", JSON.stringify(filesystem));
}

function loadFilesystem() {
  const version = "v4_twists";
  const savedVersion = localStorage.getItem("nee_fs_version");
  const saved = localStorage.getItem("nee_terminal_fs");
  if (saved && savedVersion === version) {
    try {
      filesystem = JSON.parse(saved);
    } catch (e) {
      filesystem = JSON.parse(JSON.stringify(defaultFilesystem));
    }
  } else {
    filesystem = JSON.parse(JSON.stringify(defaultFilesystem));
    localStorage.setItem("nee_fs_version", version);
    saveFilesystem();
  }
}
loadFilesystem();

// Helper: Traverse filesystem path to get node
function getDirectoryNode(pathStr) {
  if (pathStr === "~") return filesystem["~"];
  if (pathStr.startsWith("~/")) {
    const parts = pathStr.split("/");
    const sub = parts[1].toLowerCase();
    if (filesystem["~"][sub] && filesystem["~"][sub].isDir) {
      if (parts.length > 2) {
        const sub2 = parts[2].toLowerCase();
        if (filesystem["~"][sub][sub2] && filesystem["~"][sub][sub2].isDir) {
          return filesystem["~"][sub][sub2];
        }
        return null;
      }
      return filesystem["~"][sub];
    }
  }
  return null;
}

// Helper: Check for sensitive keywords and output warnings
function checkSensitiveQuery(text) {
  const query = text.toLowerCase();
  
  // If reading confidential bin or private keys
  if (query.includes("confidential.bin") || query.includes("aadhaar.txt") || query.includes("passwords.txt")) {
    return true;
  }
  
  const sensitiveWords = [
    "aadhaar", "aadhar", "sudo", "hack", "flag", "root", "password", 
    "pass", "admin", "ip", "location", "personal", "secret", "cvv", 
    "card", "details", "phone", "mobile", "address", "otp", "pin",
    "sqlmap", "hydra", "john", "hashcat", "aircrack", "airodump", "airmon",
    "nikto", "dirb", "gobuster", "wfuzz", "searchsploit", "passwd",
    "useradd", "userdel", "chown", "kill", "killall", "autoremove"
  ];
  
  return sensitiveWords.some(word => query.split(" ").includes(word) || query.startsWith(word));
}

// Command definitions with TUI layouts and Kali Linux commands
const commands = {
  help: {
    desc: "Show available commands.",
    action: () => {
      return [
        "┌──────────────────────── AVAILABLE KALI SHELL COMMANDS ───────────────────┐",
        "│  <span class='term-green'>help</span>      - Show this interactive TUI shell guide.                  │",
        "│  <span class='term-green'>sudo</span>      - Execute command with superuser / root privileges.       │",
        "│  <span class='term-green'>nmap</span>      - Network exploration tool and security / port scanner.   │",
        "│  <span class='term-green'>whoami</span>    - Print current user session details.                     │",
        "│  <span class='term-green'>pwd</span>       - Print name of current/working directory.                │",
        "│  <span class='term-green'>ls -la</span>    - List directory contents (directories and files).         │",
        "│  <span class='term-green'>cd [dir]</span>  - Change working directory (~, desktop, documents, down). │",
        "│  <span class='term-green'>cat [file]</span>- Output content of a specific simulated file.            │",
        "│  <span class='term-green'>touch/rm</span>  - Create / Delete files.                                  │",
        "│  <span class='term-green'>mkdir/rmdir</span>- Create / Delete directories.                              │",
        "│  <span class='term-green'>nano [file]</span>- Open full interactive GNU Nano text editor.              │",
        "│  <span class='term-green'>htop</span>      - Launch simulated system task manager.                   │",
        "│  <span class='term-green'>neofetch</span>  - Show system specs next to Kali Linux ASCII logo.        │",
        "│  <span class='term-green'>uname -a</span>  - Print system information and kernel stats.              │",
        "│  <span class='term-green'>ping [tgt]</span>- Send ICMP echo requests to target host.                 │",
        "│  <span class='term-green'>sqlmap</span>    - Automated SQL injection and database takeover tool.     │",
        "│  <span class='term-green'>msfconsole</span>- Open interactive Metasploit Framework shell.           │",
        "│  <span class='term-green'>clear</span>     - Clear terminal buffer.                                  │",
        "└──────────────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  whoami: {
    desc: "Print effective user id.",
    action: () => isRoot ? "root" : currentUser
  },
  pwd: {
    desc: "Print current working directory.",
    action: () => isRoot && currentDir === "~" ? "/root" : (currentDir === "~" ? `/home/${currentUser}` : `/home/${currentUser}/${currentDir.substring(2)}`)
  },
  uname: {
    action: () => "Linux nishant-kali 6.6.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2026-01-08) x86_64 GNU/Linux"
  },
  hostnamectl: {
    action: () => [
      "   Static hostname: nishant-kali",
      "         Icon name: computer-laptop",
      "           Chassis: laptop",
      "  Operating System: Kali GNU/Linux Rolling",
      "            Kernel: Linux 6.6.0-kali3-amd64",
      "      Architecture: x86-64"
    ].join("\n")
  },
  uptime: {
    action: () => `17:42:01 up 17 days, 8:42, 1 user, load average: 0.18, 0.12, 0.08`
  },
  lscpu: {
    action: () => [
      "Architecture:            x86_64",
      "CPU op-mode(s):          32-bit, 64-bit",
      "Byte Order:              Little Endian",
      "CPU(s):                  16",
      "Model name:              13th Gen Intel(R) Core(TM) i7-13700K"
    ].join("\n")
  },
  arch: {
    action: () => "x86_64"
  },
  hostname: {
    action: () => currentHost
  },
  id: {
    action: () => isRoot 
      ? "uid=0(root) gid=0(root) groups=0(root)" 
      : "uid=1000(nee) gid=1000(nee) groups=1000(nee),27(sudo),100(users),1001(docker)"
  },
  date: {
    action: () => new Date().toString()
  },
  free: {
    action: () => [
      "               total        used        free      shared  buff/cache   available",
      "Mem:           32540        8420       12040         230       12080       23890",
      "Swap:           8192           0        8192"
    ].join("\n")
  },
  df: {
    action: () => [
      "Filesystem      Size  Used Avail Use% Mounted on",
      "/dev/nvme0n1p2  953G  240G  665G  27% /",
      "tmpfs            16G  1.2M   16G   1% /dev/shm"
    ].join("\n")
  },
  lsof: {
    action: () => [
      "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME",
      "zsh      1024  nee  cwd    DIR  259,2     4096    2 /home/nee",
      "systemd     1 root  txt    REG  259,2  1823902   12 /lib/systemd/systemd"
    ].join("\n")
  },
  lsb_release: {
    action: () => [
      "No LSB modules are available.",
      "Distributor ID: Kali",
      "Description:    Kali GNU/Linux Rolling",
      "Release:        2026.2"
    ].join("\n")
  },
  neofetch: {
    action: () => [
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
      "<span class='term-cyan'>    ::::::::`                Memory: <span class='term-green'>8420MiB / 32540MiB (25%)</span></span>"
    ].join("\n")
  },
  ping: {
    action: (target) => {
      if (!target) return "<span class='term-error'>ping: missing host operand</span>";
      return [
        `PING ${target} (142.250.190.46) 56(84) bytes of data.`,
        `64 bytes from 142.250.190.46: icmp_seq=1 ttl=116 time=14.2 ms`,
        `64 bytes from 142.250.190.46: icmp_seq=2 ttl=116 time=15.1 ms`,
        `64 bytes from 142.250.190.46: icmp_seq=3 ttl=116 time=13.8 ms`,
        `--- ${target} ping statistics ---`,
        `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`
      ].join("\n");
    }
  },
  ip: {
    action: () => [
      "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000",
      "    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00",
      "    inet 127.0.0.1/8 scope host lo",
      "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000",
      "    link/ether 00:0c:29:43:a8:bc brd ff:ff:ff:ff:ff:ff",
      "    inet 192.168.1.105/24 brd 192.168.1.255 scope global dynamic eth0"
    ].join("\n")
  },
  ifconfig: {
    action: () => [
      "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
      "        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255",
      "        ether 00:0c:29:43:a8:bc  txqueuelen 1000  (Ethernet)"
    ].join("\n")
  },
  netstat: {
    action: () => [
      "Active Internet connections (only servers)",
      "Proto Recv-Q Send-Q Local Address           Foreign Address         State      ",
      "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     ",
      "tcp        0      0 127.0.0.1:80            0.0.0.0:*               LISTEN     "
    ].join("\n")
  },
  ss: {
    action: () => [
      "Netid State  Recv-Q Send-Q      Local Address:Port      Peer Address:PortProcess",
      "tcp   LISTEN 0      128               0.0.0.0:22             0.0.0.0:*",
      "tcp   LISTEN 0      128             127.0.0.1:80             0.0.0.0:*"
    ].join("\n")
  },
  route: {
    action: () => [
      "Kernel IP routing table",
      "Destination     Gateway         Genmask         Flags Metric Ref    Use Iface",
      "0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0",
      "192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0"
    ].join("\n")
  },
  iwconfig: {
    action: () => "lo no wireless extensions.\neth0 no wireless extensions."
  },
  nmcli: {
    action: () => "eth0: connected to nm-default (ethernet)\n\"Intel Corporation Ethernet Connection\""
  },
  dig: {
    action: (tgt) => {
      const target = tgt || "google.com";
      return [
        `; <<>> DiG 9.18.12-1-Debian <<>> ${target}`,
        `;; ANSWER SECTION:`,
        `${target}.		300	IN	A	142.250.190.46`
      ].join("\n");
    }
  },
  nslookup: {
    action: (tgt) => {
      const target = tgt || "google.com";
      return `Server:  1.1.1.1\nAddress: 1.1.1.1#53\n\nNon-authoritative answer:\nName:    ${target}\nAddress: 142.250.190.46`;
    }
  },
  curl: {
    action: (url) => `[+] Fetching connection details for ${url || "host"}...\n<span class='term-green'>HTTP/2 200 OK</span>\nServer: Nginx\nContent-Type: text/html`
  },
  wget: {
    action: (url) => `[+] Connecting to ${url || "host"}... connected.\n[+] HTTP request sent, awaiting response... 200 OK\n[+] Saving file output to local download buffer.`
  },
  ps: {
    action: () => [
      "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND",
      "root         1  0.0  0.0  20124  4120 ?        Ss   14:30   0:02 /sbin/init",
      "nee       1024  0.1  0.1  25102  8420 pts/0    Ss   14:31   0:01 /bin/zsh",
      "nee       1088  0.0  0.0  10420  2102 pts/0    R+   14:42   0:00 ps aux"
    ].join("\n")
  },
  history: {
    desc: "Display shell command history.",
    action: () => {
      if (commandHistory.length === 0) return "  1  help";
      return commandHistory.map((cmd, idx) => `  ${(idx + 1).toString().padStart(4, " ")}  ${cmd}`).join("\n");
    }
  },
  sudo: {
    desc: "Execute a command as superuser (root).",
    action: (args) => {
      if (isRoot) {
        if (!args || args === "su" || args === "-i") {
          return "[+] Already running as superuser (root).";
        }
        return runSingleCommand(args);
      }
      isPasswordPrompt = true;
      pendingSudoCommand = args || "su";
      terminalInput.type = "password";
      updatePrompt();
      return "";
    }
  },
  su: {
    desc: "Switch user to root.",
    action: () => {
      if (isRoot) return "[+] Already running as root.";
      isPasswordPrompt = true;
      pendingSudoCommand = "su";
      terminalInput.type = "password";
      updatePrompt();
      return "";
    }
  },
  echo: {
    desc: "Write arguments to standard output.",
    action: (args) => args || ""
  },
  nmap: {
    desc: "Network exploration tool and security / port scanner.",
    action: (args) => {
      const target = args ? args.split(" ").filter(a => !a.startsWith("-")).pop() || "192.168.1.1" : "192.168.1.1";
      return [
        `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()} IST`,
        `Initiating SYN Stealth Scan against ${target} [1000 ports]`,
        `Scanning ${target} ... Done.`,
        `Nmap scan report for ${target}`,
        `Host is up (0.0019s latency).`,
        `Not shown: 996 closed tcp ports (reset)`,
        `PORT     STATE SERVICE    VERSION`,
        `<span class='term-green'>22/tcp   open  ssh        OpenSSH 9.3p1 Debian 1 (protocol 2.0)</span>`,
        `<span class='term-green'>80/tcp   open  http       nginx 1.24.0 (Ubuntu)</span>`,
        `<span class='term-green'>443/tcp  open  ssl/http   nginx 1.24.0 (TLSv1.3)</span>`,
        `<span class='term-green'>8080/tcp open  http-proxy Apache Tomcat/10.1.15</span>`,
        `MAC Address: 00:0C:29:43:A8:BC (VMware)`,
        `Device type: general purpose`,
        `Running: Linux 6.X`,
        `OS CPE: cpe:/o:linux:linux_kernel:6`,
        ``,
        `Nmap done: 1 IP address (1 host up) scanned in 1.48 seconds`
      ].join("\n");
    }
  },
  sqlmap: {
    desc: "Automatic SQL injection and database takeover tool.",
    action: (args) => {
      const target = args || "http://target.local/vuln.php?id=1";
      return [
        `        ___`,
        `       __H__`,
        ` ___ ___[)]_____ ___ ___  {1.7.11#stable}`,
        `|_ -| . ["]     | .'| . |`,
        `|___|_  ["]_|_|_|__,|  _|`,
        `      |_|V...       |_|   https://sqlmap.org`,
        ``,
        `[*] starting @ ${new Date().toLocaleTimeString()}`,
        `[INFO] testing connection to the target URL: ${target}`,
        `[INFO] testing if the target URL content is stable`,
        `[INFO] heuristics detected that the target parameter 'id' might be injectable`,
        `<span class='term-green'>[+] Parameter 'id' is vulnerable:</span>`,
        `    Type: boolean-based blind`,
        `    Title: AND boolean-based blind - WHERE or HAVING clause`,
        `    Payload: id=1 AND 8829=8829`,
        `    Type: time-based blind`,
        `    Title: MySQL >= 5.0.12 AND time-based blind`,
        `    Payload: id=1 AND (SELECT 2819 FROM (SELECT(SLEEP(5)))a)`,
        `[INFO] the back-end DBMS is MySQL >= 5.0.12`,
        `[INFO] fetched tables: users, admin_credentials, audit_logs`
      ].join("\n");
    }
  },
  hydra: {
    desc: "Fast network logon cracker.",
    action: (args) => {
      return [
        `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak`,
        `[DATA] max 16 tasks per target, 1 target, 256 login tries (l:16/p:16)`,
        `[ATTACK] attacking ssh://192.168.1.105:22/`,
        `[STATUS] 64.00 tries/min, 64 tries in 00:01h, 192 to do...`,
        `<span class='term-green'>[22][ssh] host: 192.168.1.105   login: admin   password: shadow123</span>`,
        `[STATUS] attack finished for 192.168.1.105 (1 valid password found)`,
        `1 of 1 target completed, 1 valid password found`
      ].join("\n");
    }
  },
  apt: {
    desc: "Advanced Package Tool (Kali/Debian package manager).",
    action: (args) => {
      const sub = (args || "").split(" ")[0].toLowerCase();
      const pkg = (args || "").split(" ")[1] || "metasploit-framework";
      if (sub === "update") {
        return [
          "Get:1 http://http.kali.org/kali kali-rolling InRelease [41.5 kB]",
          "Get:2 http://http.kali.org/kali kali-rolling/main amd64 Packages [19.8 MB]",
          "Get:3 http://http.kali.org/kali kali-rolling/non-free amd64 Packages [214 kB]",
          "Fetched 20.1 MB in 1s (18.2 MB/s)",
          "Reading package lists... Done",
          "Building dependency tree... Done",
          "Reading state information... Done",
          "All packages are up to date."
        ].join("\n");
      }
      if (sub === "install") {
        return [
          `Reading package lists... Done`,
          `Building dependency tree... Done`,
          `The following NEW packages will be installed:`,
          `  ${pkg}`,
          `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`,
          `Need to get 2,840 kB of archives.`,
          `Get:1 http://http.kali.org/kali kali-rolling/main amd64 ${pkg} amd64 [2,840 kB]`,
          `Fetched 2,840 kB in 1s (3,120 kB/s)`,
          `Selecting previously unselected package ${pkg}.`,
          `(Reading database ... 385420 files and directories currently installed.)`,
          `Preparing to unpack .../${pkg}_amd64.deb ...`,
          `Unpacking ${pkg} (latest) ...`,
          `Setting up ${pkg} (latest) ...`,
          `Processing triggers for man-db (2.11.2-2) ...`,
          `<span class='term-green'>[+] ${pkg} installed successfully.</span>`
        ].join("\n");
      }
      if (sub === "upgrade") {
        return "Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove.";
      }
      return `apt: '${sub}' executed successfully.`;
    }
  },
  "apt-get": {
    action: (args) => commands.apt.action(args)
  },
  traceroute: {
    desc: "Print the route packets trace to network host.",
    action: (args) => {
      const tgt = args || "8.8.8.8";
      return [
        `traceroute to ${tgt} (${tgt}), 30 hops max, 60 byte packets`,
        ` 1  _gateway (192.168.1.1)  1.214 ms  1.102 ms  1.085 ms`,
        ` 2  10.124.0.1 (10.124.0.1)  4.812 ms  4.750 ms  4.680 ms`,
        ` 3  182.79.140.21 (airtel-gw)  8.120 ms  8.050 ms  7.990 ms`,
        ` 4  72.14.215.98 (google-peering)  12.340 ms  12.280 ms  12.190 ms`,
        ` 5  dns.google (${tgt})  13.410 ms  13.350 ms  13.290 ms`
      ].join("\n");
    }
  },
  boot: {
    desc: "Display Linux kernel startup dmesg sequence.",
    action: () => [
      "[    0.000000] Linux version 6.6.9-kali1 (devel@kali.org) (gcc-13) #1 SMP PREEMPT_DYNAMIC",
      "[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.6.9-kali1 root=UUID=5a7e... ro quiet splash",
      "[    0.021045] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
      "[    0.021049] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'",
      "[    0.140231] ACPI: Core revision 20230628",
      "[    0.281940] pci 0000:00:00.0: [8086:9a14] type 00 class 0x060000 Host bridge",
      "[    0.354120] Memory: 32540MB available",
      "[    0.781200] [ OK ] Started systemd-udevd.service - Rule-based Manager for Device Events.",
      "[    0.912400] [ OK ] Reached target System Initialization.",
      "[    1.120500] [ OK ] Started ssh.service - OpenBSD Secure Shell server.",
      "[    1.340100] [ OK ] Reached target Multi-User System.",
      "[    1.500000] [ OK ] Reached target Graphical Interface.",
      "<span class='term-green'>[+] System state: ACTIVE | Runlevel 5 | All security daemons nominal.</span>"
    ].join("\n")
  },
  dmesg: {
    action: () => commands.boot.action()
  },
  matrix: {
    action: () => {
      const active = toggleMatrix();
      return active 
        ? "[+] Matrix digital rain animation: <span class='term-green'>ENABLED</span>"
        : "[-] Matrix digital rain animation: <span class='term-error'>DISABLED</span>";
    }
  },
  reboot: {
    action: () => {
      triggerRebootSequence();
      return "";
    }
  },
  shutdown: {
    action: () => {
      triggerRebootSequence();
      return "";
    }
  },
  hack: {
    desc: "Simulate automated cyber attack sequence.",
    action: (target) => {
      const tgt = target || "NASA";
      return [
        `[*] Initializing cyber attack sequence on: ${tgt}...`,
        `[*] Resolving target DNS... 127.0.0.1 (Loopback)`,
        `[*] Bypassing military-grade firewalls... [OK]`,
        `[*] Injecting zero-day RCE vector... [SUCCESS]`,
        `[*] Gaining root privileges on ${tgt}... [DONE]`,
        `<span style='color:#ff5f56;font-weight:bold;'>💀 Abeee! Noob! ${tgt} hack karne se pehle thoda padhai toh kar le!</span>`,
        `<span style='color:var(--text-muted);'>Real hacker bano bhai, movies dekh ke script kiddie mat bano! 😂</span>`
      ].join("\n");
    }
  },
  exploit: {
    action: (target) => commands.hack.action(target)
  },
  wifi: {
    action: () => [
      `[*] Scanning airwaves for 802.11 beacon frames...`,
      `[+] SSID: 'SharmaJi_HighSpeed_5G' | Signal: -42dBm | WPA2 | Status: PWNED 🔑`,
      `[+] SSID: 'FBI_Surveillance_Van'  | Signal: -68dBm | WPA3 | Status: Honeypot 🚨`,
      `[+] SSID: 'Free_WiFi_No_Virus'    | Signal: -80dBm | OPEN | Status: Trap 🪤`,
      `<span style='color:#00ff66;'>Abeee! Noob, apna WiFi secure kar pehle!</span>`
    ].join("\n")
  },
  crush: {
    action: () => "ERROR 404: Girlfriend Not Found!\nTerminal & Kali Linux are my only true love. 💻❤️"
  },
  secret: {
    action: () => "<span style='color:#ff5f56;font-weight:bold;'>💀 Abeee! Noob! Mera details jankar kya karega? Achha se apna kaam karo!</span>"
  },
  personal: {
    action: () => "<span style='color:#ff5f56;font-weight:bold;'>💀 Abeee! Noob! Mera details jankar kya karega? Achha se apna kaam karo!</span>"
  },
  sharmaji: {
    action: () => [
      `[+] Target: Sharma Ji Ka Beta`,
      `[-] Status: Currently topping college exams`,
      `[!] Counter-measure: Pwned his home WiFi in 0.42 seconds using Hashcat.`
    ].join("\n")
  },
  "real-linux": {
    desc: "Boot Real x86 Linux Kernel inside browser via WebAssembly (v86).",
    action: () => startRealLinux()
  },
  "boot-linux": {
    desc: "Boot Real x86 Linux Kernel inside browser via WebAssembly (v86).",
    action: () => startRealLinux()
  },
  v86: {
    desc: "Boot Real x86 Linux Kernel inside browser via WebAssembly (v86).",
    action: () => startRealLinux()
  }
};

// ──────────────────────────────────────────
// REAL WEBASSEMBLY x86 LINUX ENGINE (v86)
// ──────────────────────────────────────────
let v86Emulator = null;
let isV86Running = false;

function appendV86Output(text) {
  const div = document.createElement("div");
  div.className = "terminal-output-block";
  div.innerHTML = text;
  terminalHistory.appendChild(div);
  const container = document.querySelector(".terminal-container");
  if (container) container.scrollTop = container.scrollHeight;
}

function startRealLinux() {
  if (isV86Running) {
    return "[!] Real x86 Linux emulator is already active. Type 'exit' to switch back.";
  }

  appendV86Output("<span class='term-green'>[*] Initializing Real x86 Linux Emulator (WebAssembly / v86)...</span>");
  appendV86Output("[*] Allocating 64MB RAM in client WebAssembly memory space...");
  appendV86Output("[*] Connecting serial console (ttyS0) to macOS Terminal display...");

  const tabIndicator = document.getElementById("terminal-tab-indicator");
  if (tabIndicator) tabIndicator.innerHTML = "⚡ Real x86 Linux (Wasm)";
  const btnBootV86 = document.getElementById("btn-boot-v86");
  if (btnBootV86) {
    btnBootV86.textContent = "⏹ STOP REAL LINUX";
    btnBootV86.style.borderColor = "#ff5f56";
    btnBootV86.style.color = "#ff5f56";
  }
  const winTitle = document.getElementById("terminal-window-title");
  if (winTitle) winTitle.textContent = "root@real-linux-x86: ~ (v86 ttyS0)";

  function launchEmulator() {
    try {
      let v86Screen = document.getElementById("v86-screen-container");
      if (!v86Screen) {
        v86Screen = document.createElement("div");
        v86Screen.id = "v86-screen-container";
        v86Screen.style.display = "none";
        document.body.appendChild(v86Screen);
      }

      v86Emulator = new window.V86({
        wasm_path: "https://cdn.jsdelivr.net/npm/v86/build/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        screen_container: v86Screen,
        bios: {
          url: "https://cdn.jsdelivr.net/npm/v86/bios/seabios.bin",
        },
        vga_bios: {
          url: "https://cdn.jsdelivr.net/npm/v86/bios/vgabios.bin",
        },
        cdrom: {
          url: "https://cdn.jsdelivr.net/npm/v86@0.5.472/images/linux.iso"
        },
        cmdline: "console=ttyS0 root=/dev/ram0 rw quiet",
        autostart: true,
        disable_keyboard: false
      });

      isV86Running = true;
      let lineBuf = "";

      v86Emulator.add_listener("serial0-output-byte", function(byte) {
        const char = String.fromCharCode(byte);
        if (char === "\r") return;
        lineBuf += char;
        if (char === "\n" || lineBuf.length > 100) {
          appendV86Output(lineBuf.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
          lineBuf = "";
        }
      });

      v86Emulator.add_listener("emulator-ready", function() {
        appendV86Output("<span class='term-green'>[+] SeaBIOS started real x86 instruction execution. Linux booting via serial line...</span>");
      });

    } catch (e) {
      appendV86Output(`<span class='term-error'>[!] Error starting real Linux: ${e.message}</span>`);
    }
  }

  if (!window.V86) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/v86/build/libv86.js";
    script.onload = () => {
      launchEmulator();
    };
    script.onerror = () => {
      appendV86Output("<span class='term-error'>[!] Failed to load v86 Wasm engine from CDN. Check connection.</span>");
    };
    document.head.appendChild(script);
  } else {
    launchEmulator();
  }

  return "";
}

function stopRealLinux() {
  if (v86Emulator) {
    try {
      v86Emulator.stop();
      v86Emulator.destroy();
    } catch (e) {}
    v86Emulator = null;
  }
  isV86Running = false;
  appendV86Output("<span class='term-green'>[+] Exited Real x86 Linux emulator session. Switched back to Kali GNU/Linux shell.</span>");
  const tabIndicator = document.getElementById("terminal-tab-indicator");
  if (tabIndicator) tabIndicator.innerHTML = "● Kali GNU/Linux";
  const btnBootV86 = document.getElementById("btn-boot-v86");
  if (btnBootV86) {
    btnBootV86.textContent = "⚡ REAL LINUX (WASM)";
    btnBootV86.style.borderColor = "#00ff66";
    btnBootV86.style.color = "#00ff66";
  }
  updatePrompt();
}

// Filesystem command runners (ls, cd, mkdir, rmdir, touch, rm, cat)
function executeLs(args) {
  const parts = (args || "").trim().split(/\s+/).filter(Boolean);
  const flags = parts.filter(p => p.startsWith("-")).join("");
  const target = parts.find(p => !p.startsWith("-")) || "";

  const isLong = flags.includes("l");
  const isAll = flags.includes("a");

  let targetPath = currentDir;
  if (target) {
    if (target === "~" || target === "/") {
      targetPath = "~";
    } else if (target === "..") {
      if (currentDir !== "~") {
        const p = currentDir.split("/");
        p.pop();
        targetPath = p.join("/") || "~";
      } else {
        targetPath = "~";
      }
    } else if (target === ".") {
      targetPath = currentDir;
    } else if (currentDir === "~" && filesystem["~"][target.toLowerCase()] && filesystem["~"][target.toLowerCase()].isDir) {
      targetPath = `~/${target.toLowerCase()}`;
    } else if (currentDir.startsWith("~/")) {
      const parentNode = getDirectoryNode(currentDir);
      if (parentNode && parentNode[target.toLowerCase()] && parentNode[target.toLowerCase()].isDir) {
        targetPath = `${currentDir}/${target.toLowerCase()}`;
      } else if (parentNode && parentNode.files && parentNode.files[target] !== undefined) {
        if (isLong) {
          const isConf = target === "confidential.bin" || target === "passwords.txt";
          const perms = isConf ? "-r--------" : "-rw-r--r--";
          const owner = isConf ? "root" : currentUser;
          const group = isConf ? "root" : currentUser;
          const size = String(parentNode.files[target].length || 256).padStart(6, " ");
          return `${perms}  1 ${owner}  ${group}  ${size} Oct 29 17:30 ${target}`;
        }
        return target;
      } else {
        return `<span class='term-error'>ls: cannot access '${target}': No such file or directory</span>`;
      }
    } else {
      return `<span class='term-error'>ls: cannot access '${target}': No such file or directory</span>`;
    }
  }

  const node = getDirectoryNode(targetPath);
  if (!node) {
    return `<span class='term-error'>ls: cannot access '${target}': No such file or directory</span>`;
  }

  const entries = [];

  if (targetPath === "~") {
    if (isAll) {
      entries.push({ name: ".", isDir: true, perms: "drwxr-xr-x", links: 5, owner: currentUser, group: currentUser, size: 4096 });
      entries.push({ name: "..", isDir: true, perms: "drwxr-xr-x", links: 3, owner: "root", group: "root", size: 4096 });
      entries.push({ name: ".bash_logout", isDir: false, perms: "-rw-r--r--", links: 1, owner: currentUser, group: currentUser, size: 220 });
      entries.push({ name: ".bashrc", isDir: false, perms: "-rw-r--r--", links: 1, owner: currentUser, group: currentUser, size: 3526 });
      entries.push({ name: ".profile", isDir: false, perms: "-rw-r--r--", links: 1, owner: currentUser, group: currentUser, size: 807 });
      entries.push({ name: ".zshrc", isDir: false, perms: "-rw-r--r--", links: 1, owner: currentUser, group: currentUser, size: 1240 });
    }
    for (const [name, meta] of Object.entries(node)) {
      if (meta && meta.isDir) {
        entries.push({ name, isDir: true, perms: meta.perms || "drwxr-xr-x", links: 2, owner: currentUser, group: currentUser, size: 4096 });
      }
    }
  } else {
    if (isAll) {
      entries.push({ name: ".", isDir: true, perms: "drwxr-xr-x", links: 2, owner: currentUser, group: currentUser, size: 4096 });
      entries.push({ name: "..", isDir: true, perms: "drwxr-xr-x", links: 5, owner: currentUser, group: currentUser, size: 4096 });
    }
    if (node.files) {
      for (const [name, content] of Object.entries(node.files)) {
        const isConf = name === "confidential.bin" || name === "passwords.txt";
        const perms = isConf ? "-r--------" : "-rw-r--r--";
        const owner = isConf ? "root" : currentUser;
        const group = isConf ? "root" : currentUser;
        const size = typeof content === "string" ? content.length : 256;
        entries.push({ name, isDir: false, perms, links: 1, owner, group, size });
      }
    }
    for (const [name, meta] of Object.entries(node)) {
      if (meta && meta.isDir) {
        entries.push({ name, isDir: true, perms: meta.perms || "drwxr-xr-x", links: 2, owner: currentUser, group: currentUser, size: 4096 });
      }
    }
  }

  // Sort: dotfiles first, then alphabetical
  entries.sort((a, b) => {
    if (a.name === ".") return -1;
    if (b.name === ".") return 1;
    if (a.name === "..") return -1;
    if (b.name === "..") return 1;
    return a.name.localeCompare(b.name);
  });

  if (isLong) {
    const totalK = Math.ceil(entries.reduce((acc, e) => acc + (e.size || 4096), 0) / 1024) * 4;
    const rows = [`total ${totalK}`];
    for (const item of entries) {
      const p = item.perms.padEnd(10, " ");
      const l = String(item.links).padStart(2, " ");
      const o = item.owner.padEnd(4, " ");
      const g = item.group.padEnd(4, " ");
      const s = String(item.size).padStart(6, " ");
      const date = "Oct 29 17:30";
      
      let styledName = item.name;
      if (item.isDir) {
        styledName = `<span style="color:#5dade2;font-weight:bold;">${item.name}</span>`;
      } else if (item.name.endsWith(".py") || item.name.endsWith(".sh")) {
        styledName = `<span style="color:#2ecc71;font-weight:bold;">${item.name}</span>`;
      } else if (item.name === "passwords.txt" || item.name === "confidential.bin") {
        styledName = `<span style="color:#ff5f56;font-weight:bold;">${item.name}</span>`;
      } else if (item.name.endsWith(".lnk")) {
        styledName = `<span style="color:#00e5ff;">${item.name}</span>`;
      }
      rows.push(`${p} ${l} ${o} ${g} ${s} ${date} ${styledName}`);
    }
    return rows.join("\n");
  }

  // Authentic compact Kali ls (colored, space separated)
  const formatted = entries.map(item => {
    if (item.isDir) {
      return `<span style="color:#5dade2;font-weight:bold;">${item.name}</span>`;
    } else if (item.name.endsWith(".py") || item.name.endsWith(".sh")) {
      return `<span style="color:#2ecc71;font-weight:bold;">${item.name}</span>`;
    } else if (item.name === "passwords.txt" || item.name === "confidential.bin") {
      return `<span style="color:#ff5f56;font-weight:bold;">${item.name}</span>`;
    } else if (item.name.endsWith(".lnk")) {
      return `<span style="color:#00e5ff;">${item.name}</span>`;
    }
    return `<span>${item.name}</span>`;
  });

  return formatted.join("&nbsp;&nbsp;&nbsp;&nbsp;");
}

function executeCd(args) {
  const target = (args || "").trim();
  if (!target || target === "~") {
    currentDir = "~";
    updatePrompt();
    return "";
  }
  if (target === "..") {
    if (currentDir !== "~") {
      const parts = currentDir.split("/");
      parts.pop();
      currentDir = parts.join("/") || "~";
      updatePrompt();
    }
    return "";
  }
  
  const cleanTarget = target.toLowerCase();
  if (currentDir === "~") {
    if (filesystem["~"][cleanTarget] && filesystem["~"][cleanTarget].isDir) {
      currentDir = `~/${cleanTarget}`;
      updatePrompt();
      return "";
    }
  } else if (currentDir.startsWith("~/")) {
    const parentNode = getDirectoryNode(currentDir);
    if (parentNode && parentNode[cleanTarget] && parentNode[cleanTarget].isDir) {
      currentDir = `${currentDir}/${cleanTarget}`;
      updatePrompt();
      return "";
    }
  }
  return `<span class='term-error'>bash: cd: ${args}: No such file or directory</span>`;
}

function executeMkdir(name) {
  if (!name) return "<span class='term-error'>mkdir: missing operand</span>";
  const cleanName = name.trim().toLowerCase();
  
  if (currentDir === "~") {
    if (filesystem["~"][cleanName]) return `<span class='term-error'>mkdir: cannot create directory '${name}': File exists</span>`;
    filesystem["~"][cleanName] = { isDir: true, perms: "drwxr-xr-x", files: {} };
  } else {
    const node = getDirectoryNode(currentDir);
    if (node[cleanName]) return `<span class='term-error'>mkdir: cannot create directory '${name}': File exists</span>`;
    node[cleanName] = { isDir: true, perms: "drwxr-xr-x", files: {} };
  }
  
  saveFilesystem();
  return "";
}

function executeRmdir(name) {
  if (!name) return "<span class='term-error'>rmdir: missing operand</span>";
  const cleanName = name.trim().toLowerCase();
  
  if (currentDir === "~") {
    if (!filesystem["~"][cleanName]) return `<span class='term-error'>rmdir: failed to remove '${name}': No such file or directory</span>`;
    delete filesystem["~"][cleanName];
  } else {
    const node = getDirectoryNode(currentDir);
    if (!node[cleanName]) return `<span class='term-error'>rmdir: failed to remove '${name}': No such file or directory</span>`;
    delete node[cleanName];
  }
  
  saveFilesystem();
  return "";
}

function executeTouch(name) {
  if (!name) return "<span class='term-error'>touch: missing file operand</span>";
  const cleanName = name.trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    return `<span class='term-error'>touch: cannot touch '${cleanName}': Permission denied</span>`;
  }
  node.files[cleanName] = "";
  saveFilesystem();
  return "";
}

function executeRm(name) {
  if (!name) return "<span class='term-error'>rm: missing operand</span>";
  const cleanName = name.replace("-rf", "").replace("-r", "").replace("-f", "").trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    if (filesystem["~"][cleanName]) {
      if (cleanName === "desktop" || cleanName === "documents" || cleanName === "downloads") {
        return `<span class='term-error'>rm: cannot remove '${cleanName}': Is a directory</span>`;
      }
      delete filesystem["~"][cleanName];
      saveFilesystem();
      return "";
    }
    return `<span class='term-error'>rm: cannot remove '${name}': No such file or directory</span>`;
  }
  
  if (node.files && node.files[cleanName] !== undefined) {
    delete node.files[cleanName];
    saveFilesystem();
    return "";
  }
  return `<span class='term-error'>rm: cannot remove '${name}': No such file or directory</span>`;
}

function executeCat(name) {
  if (!name) return "<span class='term-error'>cat: missing operand</span>";
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    if (filesystem["~"][name]) return `<span class='term-error'>cat: ${name}: Is a directory</span>`;
    return `<span class='term-error'>cat: ${name}: No such file or directory</span>`;
  }
  
  const fileContent = node.files[name];
  if (fileContent !== undefined) {
    if ((name === "confidential.bin" || name === "passwords.txt") && !isRoot) {
      return `<span class='term-error'>cat: ${name}: Permission denied</span>`;
    }
    return fileContent.replace(/\n/g, "<br>");
  }
  return `<span class='term-error'>cat: ${name}: No such file or directory</span>`;
}

function executeLess(name) {
  return executeCat(name);
}

function executeHead(args) {
  const parts = args.split(" ");
  const file = parts[parts.length - 1];
  const output = executeCat(file);
  if (output.startsWith("<span")) return output;
  return output.split("<br>").slice(0, 10).join("<br>");
}

function executeTail(args) {
  const parts = args.split(" ");
  const file = parts[parts.length - 1];
  const output = executeCat(file);
  if (output.startsWith("<span")) return output;
  const lines = output.split("<br>");
  return lines.slice(Math.max(0, lines.length - 10)).join("<br>");
}

function executeWc(args) {
  const file = args.replace("-l", "").trim();
  const output = executeCat(file);
  if (output.startsWith("<span")) return output;
  const lines = output.split("<br>").length;
  return `      ${lines} ${file}`;
}

function executeGrep(args) {
  const parts = args.split(" ");
  if (parts.length < 2) return "<span class='term-error'>usage: grep [pattern] [file]</span>";
  const pattern = parts[0];
  const file = parts[1];
  const output = executeCat(file);
  if (output.startsWith("<span")) return output;
  const lines = output.split("<br>");
  const filtered = lines.filter(l => l.toLowerCase().includes(pattern.toLowerCase()));
  return filtered.join("<br>");
}

// ──────────────────────────────────────────
// GNU NANO EDITOR INTERACTION
// ──────────────────────────────────────────
const nanoEditor = document.getElementById("nano-editor");
const nanoFilename = document.getElementById("nano-filename");
const nanoTextarea = document.getElementById("nano-textarea");
const shellContainer = document.getElementById("shell-container");

function openNano(filename) {
  if (!filename) {
    alert("Nano needs a filename!");
    return;
  }
  if (currentDir === "~") {
    alert("Cannot open file here. Navigate to desktop, documents, or downloads.");
    return;
  }
  
  editorMode = "nano";
  nanoFilename.textContent = filename;
  
  const node = getDirectoryNode(currentDir);
  const existingContent = node.files[filename] || "";
  nanoTextarea.value = existingContent;
  
  shellContainer.style.display = "none";
  nanoEditor.style.display = "flex";
  nanoTextarea.focus();
}

window.addEventListener("keydown", (e) => {
  if (editorMode === "nano" && e.ctrlKey && e.key.toLowerCase() === "x") {
    e.preventDefault();
    closeNano();
  }
});

function closeNano() {
  const filename = nanoFilename.textContent;
  const content = nanoTextarea.value;
  const node = getDirectoryNode(currentDir);
  
  node.files[filename] = content;
  saveFilesystem();
  
  nanoEditor.style.display = "none";
  shellContainer.style.display = "flex";
  editorMode = null;
  
  const saveEcho = document.createElement("div");
  saveEcho.className = "terminal-output-block";
  saveEcho.innerHTML = `[+] nano: Saved changes to file '${filename}'.`;
  terminalHistory.appendChild(saveEcho);
  
  terminalInput.focus();
}

// ──────────────────────────────────────────
// HTOP SYSTEM TASK MONITOR INTERACTION
// ──────────────────────────────────────────
const htopMonitor = document.getElementById("htop-monitor");
const htopCpu1 = document.getElementById("htop-cpu1");
const htopCpu2 = document.getElementById("htop-cpu2");
const htopMem = document.getElementById("htop-mem");
const htopList = document.getElementById("htop-list");

function openHtop() {
  editorMode = "htop";
  shellContainer.style.display = "none";
  htopMonitor.style.display = "flex";
  
  winTitle.textContent = "Nee@nishant-monitor: htop";
  tabInd.textContent = "Monitor";
  
  htopInterval = setInterval(() => {
    const c1 = (Math.random() * 40 + 10).toFixed(1);
    const c2 = (Math.random() * 30 + 5).toFixed(1);
    const m = (Math.random() * 2 + 7.5).toFixed(2);
    
    const fill1 = "|".repeat(Math.floor(parseFloat(c1) / 2));
    const fill2 = "|".repeat(Math.floor(parseFloat(c2) / 2));
    const fillM = "|".repeat(Math.floor(parseFloat(m) * 2));
    
    htopCpu1.innerHTML = `[${fill1.padEnd(25, " ")} ${c1}%]`;
    htopCpu2.innerHTML = `[${fill2.padEnd(25, " ")} ${c2}%]`;
    htopMem.innerHTML = `[${fillM.padEnd(25, " ")} ${m}G/31.7G]`;
  }, 1000);
}

window.addEventListener("keydown", (e) => {
  if (editorMode === "htop" && e.key.toLowerCase() === "q") {
    clearInterval(htopInterval);
    htopMonitor.style.display = "none";
    shellContainer.style.display = "flex";
    editorMode = null;
    
    winTitle.textContent = "Nee@nishant-terminal: ~ (zsh)";
    tabInd.textContent = "TUI Session";
    
    terminalInput.focus();
  }
});

// ──────────────────────────────────────────
// REBOOT & SYSTEM SHUTDOWN POWERDOWN EFFECT
// ──────────────────────────────────────────
function triggerRebootSequence() {
  terminalHistory.innerHTML = "";
  const blocks = [
    "[-] Deactivating target network controllers... [OK]",
    "[-] Unmounting partition points... [OK]",
    "[-] Powerdown sequence initiated.",
    "[+] Connection terminated by remote host.",
    "<br>[+] RESTARTING SYSTEM CORE ENVIRONMENT...",
    "[+] Re-establishing secure shell session... Done.",
    "<br>"
  ];
  
  let delay = 0;
  blocks.forEach((line, idx) => {
    setTimeout(() => {
      const row = document.createElement("div");
      row.className = "terminal-output-block";
      row.innerHTML = line;
      terminalHistory.appendChild(row);
    }, delay);
    delay += 500;
  });
  
  setTimeout(() => {
    terminalHistory.innerHTML = "";
    terminalInput.focus();
  }, delay + 200);
}

// ──────────────────────────────────────────
// KALI LINUX COMMAND FALLBACK ENGINE (1000+ commands)
// ──────────────────────────────────────────
function executeFallbackKaliCommand(cmd, args) {
  const cleanCmd = cmd.toLowerCase();
  
  // Simulated Git Clone local filesystem download
  if (cleanCmd === "git") {
    const parts = args.trim().split(" ");
    const action = parts[0].toLowerCase();
    
    if (action === "clone") {
      if (parts.length < 2) return "<span class='term-error'>fatal: You must specify a repository to clone.</span>";
      const url = parts[1];
      let repoName = url.substring(url.lastIndexOf("/") + 1).replace(".git", "").trim();
      if (!repoName) repoName = "cloned-repo";
      
      // Clone it into the current directory
      if (currentDir === "~") {
        filesystem["~"][repoName] = {
          isDir: true,
          perms: "drwxr-xr-x",
          files: {
            "README.md": `# ${repoName}\nCloned successfully from: ${url}\nThis repository is active in your persistent browser shell.`,
            "main.py": `# Autogenerated source file\nprint('Initializing ${repoName} main runtime execution... [OK]')`
          }
        };
      } else {
        const node = getDirectoryNode(currentDir);
        node[repoName] = {
          isDir: true,
          perms: "drwxr-xr-x",
          files: {
            "README.md": `# ${repoName}\nCloned successfully from: ${url}\nThis repository is active in your persistent browser shell.`,
            "main.py": `# Autogenerated source file\nprint('Initializing ${repoName} main runtime execution... [OK]')`
          }
        };
      }
      
      saveFilesystem();
      
      return [
        `Cloning into '${repoName}'...`,
        "remote: Enumerating objects: 15, done.",
        "remote: Counting objects: 100% (15/15), done.",
        "remote: Compressing objects: 100% (10/10), done.",
        "Receiving objects: 100% (15/15), 4.25 KiB | 4.25 MiB/s, done.",
        "Resolving deltas: 100% (5/5), done.",
        `<span class='term-green'>[+] Repository cloned successfully: ${repoName}/</span>`,
        `Type 'cd ${repoName}' to enter the folder.`
      ].join("\n");
    }
    
    if (action === "status") {
      return "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean";
    }
    if (action === "log") {
      return [
        "commit b1883689408bf5f72abd8246a1bc1b0e7dfc (HEAD -> main)",
        "Author: Nee <sudonishant@users.noreply.github.com>",
        "Date:   Sun Jul 12 14:42:00 2026",
        "",
        "    Optimize welcome banner ASCII art spelling and box-alignment in TUI mode"
      ].join("\n");
    }
    return `[+] git: execution success for parameter: '${args}'`;
  }
  
  // Docker Command simulation
  if (cleanCmd === "docker") {
    if (args.includes("ps")) {
      return "CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES\n7afa418aa4fb   nginx:alpine   \"/docker-entrypoint.…\"   2 hours ago     Up 2 hours     80/tcp    local-web";
    }
    return `[+] docker: container initialized successfully: '${args}'`;
  }
  
  // Systemctl Service simulation
  if (cleanCmd === "systemctl" || cleanCmd === "service") {
    return `[+] systemd: active session loaded. Service execution [OK]`;
  }
  
  // Interactive Python interpreter REPL mode
  if (cleanCmd === "python" || cleanCmd === "python3") {
    if (args === "") {
      editorMode = "python";
      winTitle.textContent = "Nee@nishant-python: python3";
      tabInd.textContent = "Python REPL";
      return "Python 3.10.12 (main, Jun 11 2026, 10:45:00)\n[GCC 11.2.0] on linux\nType \"help\", \"copyright\", \"credits\" or \"license\" for more information.";
    } else {
      // Execute local python file
      if (args === "pyscanner.py" && currentDir === "~/downloads") {
        return "[+] Initializing PyScanner thread pool...\n[+] Scanning 127.0.0.1...\n[+] Port 80: OPEN\n[+] Port 443: OPEN\n[+] Done.";
      }
      return `[+] python3: executed file '${args}' with exit status 0.`;
    }
  }
  
  // Compression & Archiving
  if (cleanCmd === "tar") {
    return `[+] tar: package archiving processed successfully: ${args}`;
  }
  if (cleanCmd === "zip" || cleanCmd === "unzip") {
    return `[+] zip/unzip: operation complete: ${args}`;
  }

  // Compiler commands
  if (cleanCmd === "gcc" || cleanCmd === "g++" || cleanCmd === "make" || cleanCmd === "clang") {
    return `[+] compilation complete. binary target generated successfully.`;
  }

  // Supported commands mapper fallback
  const simulatedGeneralCommands = [
    "awk", "sed", "cut", "tr", "sort", "uniq", "find", "locate", "which", "whereis",
    "diff", "patch", "env", "export", "set", "unset", "chmod", "chown", "nmcli"
  ];
  if (simulatedGeneralCommands.includes(cleanCmd)) {
    return `[+] ${cmd}: execution success. Exit status 0.`;
  }

  return null;
}

// ──────────────────────────────────────────
// REALISTIC LINUX SHELL PIPELINE & RUNTIME
// ──────────────────────────────────────────
let historyIndex = 0;

function executeWriteFile(targetName, content, append = false) {
  const cleanName = targetName.trim();
  const node = getDirectoryNode(currentDir);
  if (!node) return "<span class='term-error'>bash: cannot write file: invalid path</span>";
  if (!node.files) node.files = {};
  if (append && node.files[cleanName]) {
    node.files[cleanName] += "\n" + content;
  } else {
    node.files[cleanName] = content;
  }
  saveFilesystem();
  return "";
}

function runPipeFilter(stageCmd, inputData) {
  const trimmed = stageCmd.trim();
  const spaceIdx = trimmed.indexOf(" ");
  let cmd = trimmed.toLowerCase();
  let args = "";
  if (spaceIdx !== -1) {
    cmd = trimmed.substring(0, spaceIdx).toLowerCase();
    args = trimmed.substring(spaceIdx + 1);
  }

  const plainText = inputData.replace(/<br>/g, "\n").replace(/<[^>]+>/g, "");
  const lines = plainText.split("\n");

  if (cmd === "grep") {
    const pattern = args.replace("-i", "").replace(/'/g, "").replace(/"/g, "").trim().toLowerCase();
    const filtered = lines.filter(l => l.toLowerCase().includes(pattern));
    return filtered.join("<br>");
  }
  if (cmd === "wc") {
    return `      ${lines.length} lines`;
  }
  if (cmd === "head") {
    return lines.slice(0, 10).join("<br>");
  }
  if (cmd === "tail") {
    return lines.slice(Math.max(0, lines.length - 10)).join("<br>");
  }
  if (cmd === "sort") {
    return lines.slice().sort().join("<br>");
  }
  if (cmd === "uniq") {
    return [...new Set(lines)].join("<br>");
  }

  return inputData;
}

function runSingleCommand(rawCmd) {
  const trimmed = rawCmd.trim();
  if (!trimmed) return "";

  if (trimmed.includes("rm -rf /") || trimmed.includes("rm -rf *") || trimmed.includes("rm -rf ~")) {
    return [
      "<span style='color:#ff5f56;font-weight:bold;'>[CRITICAL KERNEL ALERT] Deleting all root filesystem tables...</span>",
      "rm: removing '/boot/vmlinuz-6.6.9' ... [FAIL]",
      "rm: removing '/etc/shadow' ... [ACCESS DENIED]",
      "<span style='color:#00ff66;font-weight:bold;'>💀 Abeee! Noob! Mera terminal udaane chala tha? Itni asani se Kali crash nahi hoti! 😂</span>"
    ].join("\n");
  }

  const spaceIndex = trimmed.indexOf(" ");
  let cmd = trimmed.toLowerCase();
  let args = "";
  
  if (spaceIndex !== -1) {
    cmd = trimmed.substring(0, spaceIndex).toLowerCase();
    args = trimmed.substring(spaceIndex + 1);
  }

  if (aliasMap[cmd]) {
    cmd = aliasMap[cmd];
  }

  if (cmd === "clear") {
    terminalHistory.innerHTML = "";
    return "";
  }
  if (cmd === "cd") return executeCd(args);
  if (cmd === "ls") return executeLs(args);
  if (cmd === "mkdir") return executeMkdir(args);
  if (cmd === "rmdir") return executeRmdir(args);
  if (cmd === "touch") return executeTouch(args);
  if (cmd === "rm") return executeRm(args);
  if (cmd === "cat") return executeCat(args);
  if (cmd === "less") return executeLess(args);
  if (cmd === "head") return executeHead(args);
  if (cmd === "tail") return executeTail(args);
  if (cmd === "wc") return executeWc(args);
  if (cmd === "grep") return executeGrep(args);
  if (cmd === "echo") return args;
  
  if (cmd === "exit") {
    if (isRoot) {
      isRoot = false;
      updatePrompt();
      return "[+] Logged out of root session. Switched back to nee.";
    }
    return "[+] Terminal session closed. Restart by refreshing the browser tab.";
  }

  if (cmd === "nano" || cmd === "vim") {
    openNano(args);
    return "";
  }
  if (cmd === "top" || cmd === "htop") {
    openHtop();
    return "";
  }
  if (cmd === "msfconsole") {
    editorMode = "msf";
    updatePrompt();
    return [
      "       =[ metasploit v6.3.50-dev                          ]",
      "+ -- --=[ 2345 exploits - 1234 auxiliary - 410 post        ]",
      "+ -- --=[ 900 payloads - 45 encoders - 11 nops            ]",
      "+ -- --=[ Free Metasploit Pro trial: http://metasploit.com ]",
      "",
      "msfconsole ready. Type 'help' for options."
    ].join("\n");
  }

  if (cmd === "alias") {
    if (!args) {
      return Object.entries(aliasMap).map(([k, v]) => `alias ${k}='${v}'`).join("\n");
    }
    const parts = args.split("=");
    if (parts.length === 2) {
      aliasMap[parts[0].trim()] = parts[1].replace(/'/g, "").trim();
      return `[+] Set alias: ${parts[0]} -> ${parts[1]}`;
    }
    return "<span class='term-error'>usage: alias name='command'</span>";
  }

  if (commands[cmd]) {
    return commands[cmd].action(args);
  }

  const fallback = executeFallbackKaliCommand(cmd, args);
  if (fallback !== null) return fallback;

  return `<span class='term-error'>zsh: command not found: ${cmd}. Type 'help' to show commands.</span>`;
}

function handlePipeline(rawInput) {
  // 1. Redirection >>
  if (rawInput.includes(">>")) {
    const parts = rawInput.split(">>");
    const cmdPart = parts[0].trim();
    const filePart = parts[1].trim();
    if (!filePart) return "<span class='term-error'>bash: syntax error near unexpected token 'newline'</span>";
    const res = runSingleCommand(cmdPart);
    const plain = res.replace(/<[^>]+>/g, "");
    executeWriteFile(filePart, plain, true);
    return "";
  }

  // 2. Redirection >
  if (rawInput.includes(">")) {
    const parts = rawInput.split(">");
    const cmdPart = parts[0].trim();
    const filePart = parts[1].trim();
    if (!filePart) return "<span class='term-error'>bash: syntax error near unexpected token 'newline'</span>";
    const res = runSingleCommand(cmdPart);
    const plain = res.replace(/<[^>]+>/g, "");
    executeWriteFile(filePart, plain, false);
    return "";
  }

  // 3. Pipes |
  if (rawInput.includes("|")) {
    const stages = rawInput.split("|").map(s => s.trim());
    let currentOutput = runSingleCommand(stages[0]);
    for (let i = 1; i < stages.length; i++) {
      currentOutput = runPipeFilter(stages[i], currentOutput);
    }
    return currentOutput;
  }

  return runSingleCommand(rawInput);
}

// ──────────────────────────────────────────
// TAB AUTO-COMPLETION & CTRL+C
// ──────────────────────────────────────────
const commandNamesList = [
  "help", "whoami", "pwd", "ls", "cd", "cat", "touch", "rm", "mkdir", "rmdir",
  "nano", "vim", "htop", "top", "neofetch", "uname", "ping", "traceroute",
  "nmap", "sqlmap", "hydra", "apt", "apt-get", "curl", "wget", "history",
  "python3", "python", "git", "msfconsole", "clear", "reboot", "boot", "dmesg",
  "date", "uptime", "free", "df", "ps", "ip", "ifconfig", "netstat", "ss",
  "sudo", "su", "exit", "echo", "grep", "wc", "head", "tail", "alias", "music",
  "hack", "wifi", "crush", "sharmaji", "secret"
];

function handleTabCompletion() {
  const currentVal = terminalInput.value;
  if (!currentVal) return;

  const parts = currentVal.split(" ");
  
  // Case 1: Completing command name
  if (parts.length === 1) {
    const prefix = parts[0].toLowerCase();
    const matches = commandNamesList.filter(c => c.startsWith(prefix));
    if (matches.length === 1) {
      terminalInput.value = matches[0] + " ";
    } else if (matches.length > 1) {
      const echoDiv = document.createElement("div");
      echoDiv.className = "terminal-command-echo";
      echoDiv.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${currentVal}</span>`;
      terminalHistory.appendChild(echoDiv);

      const listDiv = document.createElement("div");
      listDiv.className = "terminal-output-block";
      listDiv.innerHTML = matches.map(m => `<span class='term-green'>${m}</span>`).join("    ");
      terminalHistory.appendChild(listDiv);

      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
    }
    return;
  }

  // Case 2: Completing file or directory argument
  const lastPart = parts[parts.length - 1];
  const node = getDirectoryNode(currentDir);
  let availableItems = [];

  if (currentDir === "~") {
    availableItems = Object.keys(filesystem["~"]);
  } else if (node && node.files) {
    availableItems = Object.keys(node.files);
  }

  const matches = availableItems.filter(item => item.toLowerCase().startsWith(lastPart.toLowerCase()));
  if (matches.length === 1) {
    parts[parts.length - 1] = matches[0];
    terminalInput.value = parts.join(" ") + " ";
  } else if (matches.length > 1) {
    const echoDiv = document.createElement("div");
    echoDiv.className = "terminal-command-echo";
    echoDiv.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${currentVal}</span>`;
    terminalHistory.appendChild(echoDiv);

    const listDiv = document.createElement("div");
    listDiv.className = "terminal-output-block";
    listDiv.innerHTML = matches.map(m => `<span class='term-cyan'>${m}</span>`).join("    ");
    terminalHistory.appendChild(listDiv);

    const container = document.querySelector(".terminal-container");
    container.scrollTop = container.scrollHeight;
  }
}

function handleCtrlC() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  const echo = document.createElement("div");
  echo.className = "terminal-command-echo";
  echo.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${terminalInput.value}^C</span>`;
  terminalHistory.appendChild(echo);
  terminalInput.value = "";
  isPasswordPrompt = false;
  pendingSudoCommand = null;
  terminalInput.type = "text";
  updatePrompt();
  const container = document.querySelector(".terminal-container");
  container.scrollTop = container.scrollHeight;
}

// ──────────────────────────────────────────
// TERMINAL INPUT EVENT LISTENER
// ──────────────────────────────────────────
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    handleTabCompletion();
    return;
  }

  if (event.ctrlKey && event.key === "c") {
    event.preventDefault();
    handleCtrlC();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (commandHistory.length > 0 && historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = "";
    }
    return;
  }

  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = "";

    // 1. Password prompt mode
    if (isPasswordPrompt) {
      terminalInput.type = "text";
      isPasswordPrompt = false;
      const cmdToRun = pendingSudoCommand;
      pendingSudoCommand = null;

      const echoLine = document.createElement("div");
      echoLine.className = "terminal-command-echo";
      echoLine.innerHTML = `<span class="term-yellow">[sudo] password for ${currentUser}:</span>`;
      terminalHistory.appendChild(echoLine);

      const outDiv = document.createElement("div");
      outDiv.className = "terminal-output-block";

      if (cmdToRun === "su" || cmdToRun === "sudo su" || cmdToRun === "-i") {
        isRoot = true;
        updatePrompt();
        outDiv.innerHTML = "<span class='term-green'>[+] Authenticated. Switched to superuser (root).</span>";
      } else {
        isRoot = true;
        outDiv.innerHTML = handlePipeline(cmdToRun);
        if (!cmdToRun.startsWith("su")) {
          isRoot = false;
        }
        updatePrompt();
      }

      if (outDiv.innerHTML !== "") {
        terminalHistory.appendChild(outDiv);
      }
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (inputVal === "") return;

    // Route input directly to Real x86 Linux (v86 serial ttyS0)
    if (isV86Running && v86Emulator) {
      if (inputVal === "exit" || inputVal === "exit-v86") {
        stopRealLinux();
        return;
      }
      const commandLine = document.createElement("div");
      commandLine.className = "terminal-command-echo";
      commandLine.innerHTML = `<span style="color:#00e5ff;">real-x86#</span> <span class="term-input-echo">${inputVal}</span>`;
      terminalHistory.appendChild(commandLine);
      v86Emulator.serial0_send(inputVal + "\n");
      const container = document.querySelector(".terminal-container");
      if (container) container.scrollTop = container.scrollHeight;
      return;
    }

    commandHistory.push(inputVal);
    historyIndex = commandHistory.length;

    // 2. Echo command using authentic prompt
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${inputVal}</span>`;
    terminalHistory.appendChild(commandLine);

    const outputDiv = document.createElement("div");
    outputDiv.className = "terminal-output-block";

    // 3. Handle Python REPL state
    if (editorMode === "python") {
      if (inputVal === "exit()" || inputVal === "quit()") {
        editorMode = null;
        updatePrompt();
        outputDiv.innerHTML = "[+] Closed Python REPL console.";
      } else {
        const mathRegex = /^[0-9+\-*/().\s]+$/;
        if (mathRegex.test(inputVal)) {
          try {
            const result = Function("return " + inputVal)();
            outputDiv.innerHTML = `  ${result}`;
          } catch (err) {
            outputDiv.innerHTML = "  SyntaxError: invalid syntax";
          }
        } else {
          outputDiv.innerHTML = `  NameError: name '${inputVal}' is not defined`;
        }
      }
      terminalHistory.appendChild(outputDiv);
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 4. Handle MSF Subshell
    if (editorMode === "msf") {
      const parts = inputVal.split(" ");
      const sub = parts[0].toLowerCase();
      if (sub === "exit") {
        editorMode = null;
        updatePrompt();
        outputDiv.innerHTML = "[+] Metasploit console shut down.";
      } else if (sub === "help") {
        outputDiv.innerHTML = "Metasploit Core Commands:\n  search [name] - Search for exploit modules.\n  use [exploit] - Select exploit module.\n  exploit       - Execute exploit payload.\n  exit          - Close Metasploit console.";
      } else if (sub === "search") {
        outputDiv.innerHTML = `Matching Exploits:\n  #  Name                        Disclosure Date  Rank    Check  Description\n  -  ----                        ---------------  ----    -----  -----------\n  1  exploit/sudonishant/bypass  2026-07-12       great   Yes    Interactive terminal port audit.`;
      } else if (sub === "use") {
        outputDiv.innerHTML = "[+] Selected module: exploit/sudonishant/bypass\nmsf6 exploit(bypass) &gt; ";
      } else if (sub === "exploit" || sub === "run") {
        outputDiv.innerHTML = "[*] Injecting exploit trigger...\n[*] Target vulnerable!\n<span class='term-green'>[+] Session established: Meterpreter zsh console active.</span>";
      } else {
        outputDiv.innerHTML = `[-] Unknown Metasploit command: ${inputVal}`;
      }
      terminalHistory.appendChild(outputDiv);
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 5. Intercept sudo / su command
    if (inputVal.startsWith("sudo ") || inputVal === "sudo" || inputVal === "su") {
      if (isRoot) {
        const subCmd = inputVal.replace(/^sudo\s*/, "");
        if (!subCmd || subCmd === "su") {
          outputDiv.innerHTML = "[+] Already root.";
        } else {
          outputDiv.innerHTML = handlePipeline(subCmd);
        }
      } else {
        isPasswordPrompt = true;
        pendingSudoCommand = inputVal.replace(/^sudo\s*/, "") || "su";
        terminalInput.type = "password";
        updatePrompt();
        return;
      }
    } else {
      // Execute through pipeline handler (handles pipes and redirection)
      outputDiv.innerHTML = handlePipeline(inputVal);
    }

    if (outputDiv.innerHTML !== "") {
      terminalHistory.appendChild(outputDiv);
    }

    const container = document.querySelector(".terminal-container");
    container.scrollTop = container.scrollHeight;
  }
});

// Music Toggle Click Handler
const musicToggleBtn = document.getElementById("music-toggle");
if (musicToggleBtn) {
  musicToggleBtn.addEventListener("click", () => {
    const bgMusic = document.getElementById("bg-music");
    if (!bgMusic) return;
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        musicToggleBtn.classList.add("playing");
        musicToggleBtn.textContent = "⏸ PAUSE MUSIC";
      }).catch((err) => {
        console.log("Audio playback blocked:", err);
      });
    } else {
      bgMusic.pause();
      musicToggleBtn.classList.remove("playing");
      musicToggleBtn.textContent = "🎵 PLAY MUSIC";
    }
  });
}

// Window Dot Controls (macOS authentic behavior)
const btnMaximize = document.getElementById("btn-maximize");
const btnClose = document.getElementById("btn-close");
const btnMinimize = document.getElementById("btn-minimize");
const macTerminalEl = document.querySelector(".mac-terminal");

if (btnMaximize) {
  btnMaximize.addEventListener("click", () => {
    if (macTerminalEl) macTerminalEl.classList.toggle("maximized");
  });
}

if (btnClose) {
  btnClose.addEventListener("click", () => {
    terminalHistory.innerHTML = "";
  });
}

if (btnMinimize) {
  btnMinimize.addEventListener("click", () => {
    if (!macTerminalEl) return;
    macTerminalEl.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    macTerminalEl.style.transform = "scale(0.96)";
    macTerminalEl.style.opacity = "0.7";
    setTimeout(() => {
      macTerminalEl.style.transform = "scale(1)";
      macTerminalEl.style.opacity = "1";
    }, 200);
  });
}

// Boot Real Linux Button Handler
const btnBootV86 = document.getElementById("btn-boot-v86");
if (btnBootV86) {
  btnBootV86.addEventListener("click", () => {
    if (isV86Running) {
      stopRealLinux();
    } else {
      startRealLinux();
    }
  });
}

// Initialize prompt display
updatePrompt();

