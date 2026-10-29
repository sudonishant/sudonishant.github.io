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

// Interactive modes and filesystem state
let currentDir = "~";
let editorMode = null; // "nano", "htop", "msf", "python"
let htopInterval = null;
let aliasMap = {};
let commandHistory = [];

// Focus input on load
window.onload = () => {
  terminalInput.focus();
};

document.querySelector(".mac-terminal-body").addEventListener("click", () => {
  if (!editorMode && activeTab === "portfolio") {
    terminalInput.focus();
  }
});

// Dynamic prompt formatter
function getPromptHTML() {
  if (editorMode === "msf") {
    return `<span class="prompt-user">msf6</span> <span class="term-cyan">&gt;</span>`;
  }
  if (editorMode === "python") {
    return `<span class="term-green">&gt;&gt;&gt;</span>`;
  }
  return `<span class="prompt-user">Nee</span>@<span class="prompt-host">nishant</span> <span class="prompt-tilde">${currentDir}</span> %`;
}

// Default filesystem structure (serializable to JSON)
const defaultFilesystem = {
  "~": {
    "desktop": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "welcome_note.txt": "Welcome to my desktop terminal portfolio!\nType 'help' to see the Kali Linux command manual.",
        "portfolio_shortcut.lnk": "URL: https://sudonishant.github.io/\nStatus: Active Online Node",
        "aadhaar.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│                 GOVERNMENT OF INDIA                    │",
          "│  Name:   Neeshant Kumar                                │",
          "│  DOB:    12/10/2007 (18 Years)                         │",
          "│  Gender: Male                                          │",
          "│                                                        │",
          "│  AADHAAR NO: XXXX-XXXX-4321                            │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n"),
        "passwords.txt": [
          "┌────────────────────────────────────────────────────────┐",
          "│  Service         │ Username         │ Password         │",
          "├──────────────────┼──────────────────┼──────────────────┤",
          "│  GitHub          │ sudonishant      │ ************     │",
          "│  Discord         │ sudonishant      │ ************     │",
          "│  Local SSH       │ root             │ ************     │",
          "└────────────────────────────────────────────────────────┘"
        ].join("\n")
      }
    },
    "documents": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "dossier.txt": "Identity: Neeshant (alias: sudonishant)\nFocus: Cyber Security Student & Ethical Hacker\nAge: 18 Years (Bihar, India)\nPhilosophy: Identify security gaps to patch them.",
        "skills.audit": "System Hardening: 60%  (PAM / Firewalls)\nPython Scripting: 70%  (Scanners / Automation)\nWeb Pentesting:   65%  (OWASP Top 10)\nNetwork Recon:    60%  (Nmap / Wireshark)",
        "projects.md": "- OmniDetect AI: Full-Stack Media Metadata Forensics & AI Detection Platform (https://github.com/sudonishant/omnidetect-ai).\n- AetherSense: 3D WiFi Volumetric Occupancy Radar & Spatial Mapper (https://github.com/sudonishant/aethersense).\n- PyScanner: Multi-threaded port scanner in Python.\n- LogShield: Bash failed login parser utility.\n- ReconBot: OSINT harvesting automation scripts.",
        "contact.key": "Email: sudonishant@users.noreply.github.com\nDiscord: sudonishant\nLinkedIn: nishant-kumar-423870291",
        "confidential.bin": "[SENSITIVE DATA LAYER] Secure system logs locked."
      }
    },
    "downloads": {
      isDir: true,
      perms: "drwxr-xr-x",
      files: {
        "pyscanner.py": "# Multi-threaded port scanner - sudonishant\nimport socket\nimport threading\n\ndef scan_port(host, port):\n    try:\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        s.settimeout(0.5)\n        if s.connect_ex((host, port)) == 0:\n            print(f'[+] Port {port} is OPEN')\n        s.close()\n    except:\n        pass"
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
  const saved = localStorage.getItem("nee_terminal_fs");
  if (saved) {
    try {
      filesystem = JSON.parse(saved);
    } catch (e) {
      filesystem = JSON.parse(JSON.stringify(defaultFilesystem));
    }
  } else {
    filesystem = JSON.parse(JSON.stringify(defaultFilesystem));
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
        "│  <span class='term-green'>linux</span>     - Boot Real Linux (WebAssembly) in browser (₹0 Cost).     │",
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
        "│  <span class='term-green'>git clone</span> - Clone a simulated repository folder.                    │",
        "│  <span class='term-green'>msfconsole</span>- Open interactive Metasploit Framework shell.           │",
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
  uname: {
    action: () => "Linux nishant-kali 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2026-07-12) x86_64 GNU/Linux"
  },
  hostnamectl: {
    action: () => [
      "   Static hostname: nishant-kali",
      "         Icon name: computer-laptop",
      "           Chassis: laptop",
      "  Operating System: Kali GNU/Linux Rolling",
      "            Kernel: Linux 6.5.0-kali3-amd64",
      "      Architecture: x86-64"
    ].join("\n")
  },
  uptime: {
    action: () => "14:42:01 up 17 years, 8 months, 12 days, 3:45, 1 user, load average: 0.12, 0.08, 0.05"
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
    action: () => "nishant-kali"
  },
  id: {
    action: () => "uid=1001(nee) gid=1001(nee) groups=1001(nee),27(sudo),44(video)"
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
    action: () => commandHistory.map((cmd, idx) => `  ${idx + 1}  ${cmd}`).join("\n")
  },
  matrix: {
    action: () => {
      const active = toggleMatrix();
      return active 
        ? "[+] Matrix digital rain animation: <span class='term-green'>ENABLED</span>"
        : "[-] Matrix digital rain animation: <span class='term-error'>DISABLED</span>";
    }
  },
  linux: {
    desc: "Boot real in-browser Linux (WebAssembly) VM with zero server cost.",
    action: () => {
      setTimeout(() => {
        switchTab("linux");
      }, 500);
      return [
        "┌────────────────── IN-BROWSER LINUX (WEBASSEMBLY) ────────────────┐",
        "│  [+] Booting x86 CPU Virtual Machine via WebAssembly...          │",
        "│  [+] Core Engine: Debian (CheerpX / WebVM)                       │",
        "│  [+] Hosting Cost: ₹0.00 (Runs 100% on client browser CPU/RAM)    │",
        "│  [+] Opening Real Linux Terminal Session...                      │",
        "└──────────────────────────────────────────────────────────────────┘"
      ].join("\n");
    }
  },
  vm: {
    desc: "Alias for linux command.",
    action: () => commands.linux.action()
  },
  webvm: {
    desc: "Alias for linux command.",
    action: () => commands.linux.action()
  },
  v86: {
    desc: "Boot v86 Alpine x86 Linux in browser.",
    action: () => {
      const btnV86 = document.getElementById("btn-engine-v86");
      if (btnV86) btnV86.click();
      setTimeout(() => {
        switchTab("linux");
      }, 500);
      return "[+] Booting v86 (Alpine Linux) WebAssembly VM...";
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
  }
};

// Filesystem command runners (ls, cd, mkdir, rmdir, touch, rm, cat)
function executeLs(args) {
  const node = getDirectoryNode(currentDir);
  const rows = ["┌───────────────────────────────── DIRECTORY LISTING ───────────────────────────┐"];
  
  if (currentDir === "~") {
    for (const [name, meta] of Object.entries(node)) {
      const label = name + "/";
      rows.push(`│  ${meta.perms}  1 Nee   staff      128 B  ${label.padEnd(25, " ")} │`);
    }
  } else {
    for (const [name, content] of Object.entries(node.files)) {
      const isConf = name === "confidential.bin";
      const perms = isConf ? "-r--------" : "-rw-r--r--";
      const size = isConf ? "1.0 KB" : "256 B";
      const owner = isConf ? "root" : "Nee";
      rows.push(`│  ${perms}  1 ${owner.padEnd(4, " ")}  staff     ${size.padStart(6, " ")}  ${name.padEnd(25, " ")} │`);
    }
  }
  rows.push("└───────────────────────────────────────────────────────────────────────────────┘");
  return rows.join("\n");
}

function executeCd(args) {
  if (!args || args === "~") {
    currentDir = "~";
    promptTilde.textContent = currentDir;
    return getCdGuideHTML();
  }
  if (args === "..") {
    if (currentDir !== "~") {
      currentDir = "~";
      promptTilde.textContent = currentDir;
    }
    return getCdGuideHTML();
  }
  
  const cleanTarget = args.trim().toLowerCase();
  if (currentDir === "~") {
    if (filesystem["~"][cleanTarget] && filesystem["~"][cleanTarget].isDir) {
      currentDir = `~/${cleanTarget}`;
      promptTilde.textContent = currentDir;
      return getCdGuideHTML();
    }
  } else if (currentDir.startsWith("~/")) {
    const parentNode = getDirectoryNode(currentDir);
    if (parentNode && parentNode[cleanTarget] && parentNode[cleanTarget].isDir) {
      currentDir = `${currentDir}/${cleanTarget}`;
      promptTilde.textContent = currentDir;
      return getCdGuideHTML();
    }
  }
  return `<span class='term-error'>cd: no such file or directory: ${args}</span>`;
}

// Generate automatic directory instructions when moving folders
function getCdGuideHTML() {
  if (currentDir === "~") {
    return [
      "<span class='term-cyan'>[+] Changed Directory: ~ (home)</span>",
      "    Available Folders: <span class='term-green'>desktop/</span>, <span class='term-green'>documents/</span>, <span class='term-green'>downloads/</span>",
      "    Type '<span class='term-green'>cd [folder]</span>' to navigate or '<span class='term-green'>help</span>' to show TUI commands."
    ].join("\n");
  }
  if (currentDir === "~/desktop") {
    return [
      "<span class='term-cyan'>[+] Changed Directory: desktop/</span>",
      "    Available Files: <span class='term-green'>welcome_note.txt</span>, <span class='term-green'>portfolio_shortcut.lnk</span>, <span class='term-green'>aadhaar.txt</span>, <span class='term-green'>passwords.txt</span>",
      "    Type '<span class='term-green'>ls</span>' to view list, or '<span class='term-green'>cat [filename]</span>' to read files."
    ].join("\n");
  }
  if (currentDir === "~/documents") {
    return [
      "<span class='term-cyan'>[+] Changed Directory: documents/</span>",
      "    Available Files: <span class='term-green'>dossier.txt</span>, <span class='term-green'>skills.audit</span>, <span class='term-green'>projects.md</span>, <span class='term-green'>contact.key</span>",
      "    Type '<span class='term-green'>cat dossier.txt</span>' or '<span class='term-green'>cat skills.audit</span>' to review dossier details."
    ].join("\n");
  }
  if (currentDir === "~/downloads") {
    return [
      "<span class='term-cyan'>[+] Changed Directory: downloads/</span>",
      "    Available Files: <span class='term-green'>pyscanner.py</span>",
      "    Type '<span class='term-green'>cat pyscanner.py</span>' to review defensive Python security script code."
    ].join("\n");
  }
  // If it's a cloned repo
  if (currentDir.startsWith("~/") && currentDir.split("/").length > 2) {
    const parts = currentDir.split("/");
    const repoName = parts[parts.length - 1];
    const node = getDirectoryNode(currentDir);
    const filesList = Object.keys(node.files).join(", ");
    return [
      `<span class='term-cyan'>[+] Entered Repository Folder: ${repoName}/</span>`,
      `    Available Files: <span class='term-green'>${filesList}</span>`,
      "    Type '<span class='term-green'>ls</span>' to view list or '<span class='term-green'>cat README.md</span>' to read files."
    ].join("\n");
  }
  return "";
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
  return `[+] Created directory: ${cleanName}`;
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
  return `[-] Removed directory: ${cleanName}`;
}

function executeTouch(name) {
  if (!name) return "<span class='term-error'>touch: missing file operand</span>";
  const cleanName = name.trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    return "<span class='term-error'>touch: Files must be created inside sub-directories</span>";
  }
  node.files[cleanName] = "[Empty File] Edit using nano editor.";
  saveFilesystem();
  return `[+] Created empty file: ${cleanName}`;
}

function executeRm(name) {
  if (!name) return "<span class='term-error'>rm: missing operand</span>";
  const cleanName = name.replace("-rf", "").trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    if (filesystem["~"][cleanName]) {
      delete filesystem["~"][cleanName];
      saveFilesystem();
      return `[-] Deleted directory: ${cleanName}`;
    }
    return `<span class='term-error'>rm: cannot remove '${name}': No such file or directory</span>`;
  }
  
  if (node.files[cleanName]) {
    delete node.files[cleanName];
    saveFilesystem();
    return `[-] Deleted file: ${cleanName}`;
  }
  return `<span class='term-error'>rm: cannot remove '${name}': No such file or directory</span>`;
}

function executeCat(name) {
  if (!name) return "<span class='term-error'>usage: cat [filename]</span>";
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    if (filesystem["~"][name]) return `<span class='term-error'>cat: ${name}: Is a directory</span>`;
    return `<span class='term-error'>cat: ${name}: No such file or directory</span>`;
  }
  
  const fileContent = node.files[name];
  if (fileContent !== undefined) {
    if (name === "confidential.bin" || name === "aadhaar.txt" || name === "passwords.txt") {
      // In English as requested by user
      const warnHeader = "<span class='term-error'>[!] ERROR: Don't try to be a smart hacker. Why are you trying to steal my personal data? Access Denied!</span>";
      if (name === "confidential.bin") return warnHeader;
      return warnHeader + "<br><br>" + fileContent.replace(/\n/g, "<br>");
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

// Handle command input
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = "";
    
    if (inputVal === "") return;
    
    commandHistory.push(inputVal);

    // 1. Echo command using custom user prompt
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${inputVal}</span>`;
    terminalHistory.appendChild(commandLine);

    const outputDiv = document.createElement("div");
    outputDiv.className = "terminal-output-block";

    // 2. Intercept sensitive commands (in English as requested by user)
    if (checkSensitiveQuery(inputVal)) {
      outputDiv.innerHTML = "<span class='term-error'>[!] ERROR: Don't try to be a smart hacker. Why are you trying to steal my personal data? Access Denied!</span>";
      terminalHistory.appendChild(outputDiv);
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 3. Handle Python REPL state
    if (editorMode === "python") {
      if (inputVal === "exit()" || inputVal === "quit()") {
        editorMode = null;
        winTitle.textContent = "Nee@nishant-terminal: ~ (zsh)";
        tabInd.textContent = "TUI Session";
        outputDiv.innerHTML = "[+] Closed Python REPL console.";
      } else {
        // Safe math evaluator for calculator
        const mathRegex = /^[0-9+\-*/().\s]+$/;
        if (mathRegex.test(inputVal)) {
          try {
            const result = Function("return " + inputVal)();
            outputDiv.innerHTML = `  ${result}`;
          } catch (err) {
            outputDiv.innerHTML = "  SyntaxError: invalid syntax";
          }
        } else {
          outputDiv.innerHTML = "  NameError: name is not defined (Python REPL restricted to arithmetic evaluations)";
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
        winTitle.textContent = "Nee@nishant-terminal: ~ (zsh)";
        tabInd.textContent = "TUI Session";
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

    // 5. Parse command arguments
    const spaceIndex = inputVal.indexOf(" ");
    let cmd = inputVal.toLowerCase();
    let args = "";
    
    if (spaceIndex !== -1) {
      cmd = inputVal.substring(0, spaceIndex).toLowerCase();
      args = inputVal.substring(spaceIndex + 1);
    }

    if (aliasMap[cmd]) {
      cmd = aliasMap[cmd];
    }

    // Global Command router
    if (cmd === "clear") {
      terminalHistory.innerHTML = "";
      return;
    } else if (cmd === "cd") {
      outputDiv.innerHTML = executeCd(args);
    } else if (cmd === "ls") {
      outputDiv.innerHTML = executeLs(args);
    } else if (cmd === "mkdir") {
      outputDiv.innerHTML = executeMkdir(args);
    } else if (cmd === "rmdir") {
      outputDiv.innerHTML = executeRmdir(args);
    } else if (cmd === "touch") {
      outputDiv.innerHTML = executeTouch(args);
    } else if (cmd === "rm") {
      outputDiv.innerHTML = executeRm(args);
    } else if (cmd === "cat") {
      outputDiv.innerHTML = executeCat(args);
    } else if (cmd === "less") {
      outputDiv.innerHTML = executeLess(args);
    } else if (cmd === "head") {
      outputDiv.innerHTML = executeHead(args);
    } else if (cmd === "tail") {
      outputDiv.innerHTML = executeTail(args);
    } else if (cmd === "wc") {
      outputDiv.innerHTML = executeWc(args);
    } else if (cmd === "grep") {
      outputDiv.innerHTML = executeGrep(args);
    } else if (cmd === "nano") {
      openNano(args);
      return;
    } else if (cmd === "vim") {
      openNano(args);
      return;
    } else if (cmd === "top" || cmd === "htop") {
      openHtop();
      return;
    } else if (cmd === "msfconsole") {
      editorMode = "msf";
      winTitle.textContent = "Nee@nishant-msfconsole: msfconsole";
      tabInd.textContent = "Metasploit";
      outputDiv.innerHTML = [
        "       =[ metasploit v6.3.50-dev                          ]",
        "+ -- --=[ 2345 exploits - 1234 auxiliary - 410 post        ]",
        "+ -- --=[ 900 payloads - 45 encoders - 11 nops            ]",
        "+ -- --=[ Free Metasploit Pro trial: http://metasploit.com ]",
        "",
        "msfconsole ready. Type 'help' for options."
      ].join("\n");
    } else if (cmd === "alias") {
      if (!args) {
        outputDiv.innerHTML = Object.entries(aliasMap).map(([k, v]) => `alias ${k}='${v}'`).join("\n");
      } else {
        const parts = args.split("=");
        if (parts.length === 2) {
          aliasMap[parts[0].trim()] = parts[1].replace(/'/g, "").trim();
          outputDiv.innerHTML = `[+] Set alias: ${parts[0]} -> ${parts[1]}`;
        } else {
          outputDiv.innerHTML = "<span class='term-error'>usage: alias name='command'</span>";
        }
      }
    } else if (cmd === "music" || cmd === "play") {
      const bgMusic = document.getElementById("bg-music");
      const musicToggle = document.getElementById("music-toggle");
      if (args === "stop" || args === "pause" || args === "mute") {
        bgMusic.pause();
        musicToggle.classList.remove("playing");
        musicToggle.textContent = "🎵 PLAY MUSIC";
        outputDiv.innerHTML = "[-] Theme music paused.";
      } else {
        bgMusic.play().then(() => {
          musicToggle.classList.add("playing");
          musicToggle.textContent = "⏸ PAUSE MUSIC";
        }).catch(e => console.log("Blocked:", e));
        outputDiv.innerHTML = "[+] Playing hacker theme song... Enjoy the cyber beats! 🎧";
      }
    } else if (cmd === "exit") {
      outputDiv.innerHTML = "[+] Terminal session closed. Restart by refreshing the browser tab.";
    } else if (commands[cmd]) {
      outputDiv.innerHTML = commands[cmd].action(args);
    } else {
      // Check standard 1000+ commands fallback simulation
      const fallbackOutput = executeFallbackKaliCommand(cmd, args);
      if (fallbackOutput !== null) {
        outputDiv.innerHTML = fallbackOutput.replace(/\n/g, "<br>");
      } else {
        outputDiv.innerHTML = `<span class='term-error'>zsh: command not found: ${inputVal}. Type 'help' to show commands.</span>`;
      }
    }

    if (outputDiv.innerHTML !== "") {
      terminalHistory.appendChild(outputDiv);
    }
    
    // Auto scroll to bottom
    const container = document.querySelector(".terminal-container");
    container.scrollTop = container.scrollHeight;
  }
});

// Music Toggle Click Handler
document.getElementById("music-toggle").addEventListener("click", () => {
  const bgMusic = document.getElementById("bg-music");
  const musicToggle = document.getElementById("music-toggle");
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      musicToggle.classList.add("playing");
      musicToggle.textContent = "⏸ PAUSE MUSIC";
    }).catch((err) => {
      console.log("Audio playback blocked:", err);
    });
  } else {
    bgMusic.pause();
    musicToggle.classList.remove("playing");
    musicToggle.textContent = "🎵 PLAY MUSIC";
  }
});

// ==========================================
// 3. IN-BROWSER REAL LINUX (WEBASSEMBLY) CONTROLLER
// ==========================================
let activeTab = "portfolio";
let currentLinuxSrc = "https://webvm.io/";

function switchTab(tabName) {
  const tabPortfolio = document.getElementById("tab-portfolio");
  const tabLinux = document.getElementById("tab-linux");
  const shellContainer = document.getElementById("shell-container");
  const linuxContainer = document.getElementById("linux-container");
  const terminalBody = document.querySelector(".mac-terminal-body");
  const tabIndicator = document.getElementById("terminal-tab-indicator");
  const linuxIframe = document.getElementById("linux-iframe");

  if (tabName === "linux") {
    activeTab = "linux";
    if (tabPortfolio) tabPortfolio.classList.remove("active");
    if (tabLinux) tabLinux.classList.add("active");
    if (shellContainer) shellContainer.style.display = "none";

    // Close any simulated editors/monitors
    const nano = document.getElementById("nano-editor");
    const htop = document.getElementById("htop-monitor");
    if (nano) nano.style.display = "none";
    if (htop) htop.style.display = "none";

    if (linuxContainer) linuxContainer.style.display = "flex";
    if (terminalBody) terminalBody.classList.add("linux-active");
    if (tabIndicator) tabIndicator.textContent = "Debian (WASM)";
    if (winTitle) winTitle.textContent = "root@webvm-debian: ~ (bash)";
    document.title = "root@webvm-debian: ~ (bash)";

    // Lazy load the Linux WebAssembly VM iframe on first access
    if (!linuxIframe.src || linuxIframe.src === "about:blank" || linuxIframe.src === window.location.href) {
      loadLinuxEngine(currentLinuxSrc);
    }
  } else {
    activeTab = "portfolio";
    if (tabLinux) tabLinux.classList.remove("active");
    if (tabPortfolio) tabPortfolio.classList.add("active");
    if (linuxContainer) linuxContainer.style.display = "none";
    if (shellContainer) shellContainer.style.display = "flex";
    if (terminalBody) terminalBody.classList.remove("linux-active");
    if (tabIndicator) tabIndicator.textContent = "TUI Session";
    if (winTitle) winTitle.textContent = "Nee@nishant-terminal: ~ (zsh)";
    document.title = "sudonishant | Security Researcher & Developer";
    terminalInput.focus();
  }
}

function loadLinuxEngine(url) {
  const linuxIframe = document.getElementById("linux-iframe");
  const linuxLoading = document.getElementById("linux-loading");
  currentLinuxSrc = url;

  if (linuxLoading) {
    linuxLoading.style.display = "flex";
    linuxLoading.style.opacity = "1";
  }

  linuxIframe.onload = () => {
    setTimeout(() => {
      if (linuxLoading) {
        linuxLoading.style.opacity = "0";
        setTimeout(() => {
          linuxLoading.style.display = "none";
        }, 300);
      }
    }, 1200);
  };

  linuxIframe.src = url;
}

// Tab navigation listeners
const tabPortfolioBtn = document.getElementById("tab-portfolio");
const tabLinuxBtn = document.getElementById("tab-linux");

if (tabPortfolioBtn) {
  tabPortfolioBtn.addEventListener("click", () => switchTab("portfolio"));
}
if (tabLinuxBtn) {
  tabLinuxBtn.addEventListener("click", () => switchTab("linux"));
}

// In-Browser Linux Engine Switchers
const btnEngineWebvm = document.getElementById("btn-engine-webvm");
const btnEngineV86 = document.getElementById("btn-engine-v86");
const btnReloadVm = document.getElementById("btn-reload-vm");
const btnBackPortfolio = document.getElementById("btn-back-portfolio");

if (btnEngineWebvm) {
  btnEngineWebvm.addEventListener("click", () => {
    btnEngineWebvm.classList.add("active");
    if (btnEngineV86) btnEngineV86.classList.remove("active");
    loadLinuxEngine("https://webvm.io/");
    if (tabInd) tabInd.textContent = "Debian (WASM)";
  });
}

if (btnEngineV86) {
  btnEngineV86.addEventListener("click", () => {
    btnEngineV86.classList.add("active");
    if (btnEngineWebvm) btnEngineWebvm.classList.remove("active");
    loadLinuxEngine("https://copy.sh/v86/?profile=linux");
    if (tabInd) tabInd.textContent = "Alpine x86 (v86)";
  });
}

if (btnReloadVm) {
  btnReloadVm.addEventListener("click", () => {
    loadLinuxEngine(currentLinuxSrc);
  });
}

if (btnBackPortfolio) {
  btnBackPortfolio.addEventListener("click", () => {
    switchTab("portfolio");
  });
}

// Window Dot Controls (macOS authentic behavior)
const btnMaximize = document.getElementById("btn-maximize");
const btnClose = document.getElementById("btn-close");
const btnMinimize = document.getElementById("btn-minimize");
const macTerminalEl = document.querySelector(".mac-terminal");

if (btnMaximize) {
  btnMaximize.addEventListener("click", () => {
    macTerminalEl.classList.toggle("maximized");
  });
}

if (btnClose) {
  btnClose.addEventListener("click", () => {
    if (activeTab === "linux") {
      switchTab("portfolio");
    } else {
      terminalHistory.innerHTML = "";
    }
  });
}

if (btnMinimize) {
  btnMinimize.addEventListener("click", () => {
    macTerminalEl.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    macTerminalEl.style.transform = "scale(0.96)";
    macTerminalEl.style.opacity = "0.7";
    setTimeout(() => {
      macTerminalEl.style.transform = "scale(1)";
      macTerminalEl.style.opacity = "1";
    }, 200);
  });
}

