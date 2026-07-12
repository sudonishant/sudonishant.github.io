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
let editorMode = null; // "nano", "htop", "msf"
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

// Dynamic prompt formatter
function getPromptHTML() {
  if (editorMode === "msf") {
    return `<span class="prompt-user">msf6</span> <span class="term-cyan">&gt;</span>`;
  }
  return `<span class="prompt-user">Nee</span>@<span class="prompt-host">nishant</span> <span class="prompt-tilde">${currentDir}</span> %`;
}

// Simulated UNIX filesystem (Mutable state)
let filesystem = {
  "~": {
    "documents": {
      isDir: true,
      files: {
        "dossier.txt": "Identity: Neeshant (alias: sudonishant)\nFocus: Cyber Security Student & Ethical Hacker\nAge: 18 Years (Bihar, India)\nPhilosophy: Identify security gaps to patch them.",
        "skills.audit": "System Hardening: 60%  (PAM / Firewalls)\nPython Scripting: 70%  (Scanners / Automation)\nWeb Pentesting:   65%  (OWASP Top 10)\nNetwork Recon:    60%  (Nmap / Wireshark)",
        "projects.md": "- PyScanner: Multi-threaded port scanner in Python.\n- LogShield: Bash failed login parser utility.\n- ReconBot: OSINT harvesting automation scripts.",
        "contact.key": "Email: sudonishant@users.noreply.github.com\nDiscord: sudonishant\nLinkedIn: nishant-kumar-423870291",
        "confidential.bin": "[SENSITIVE DATA LAYER] Secure system logs locked."
      }
    },
    "downloads": {
      isDir: true,
      files: {
        "pyscanner.py": "import socket\n# Multi-threaded port scanner\ndef scan(host, port):\n    s = socket.socket()\n    if s.connect_ex((host, port)) == 0:\n        print(f'[+] {port} is OPEN')"
      }
    }
  }
};

// Helper: Traverse filesystem path to get node
function getDirectoryNode(pathStr) {
  if (pathStr === "~") return filesystem["~"];
  if (pathStr === "~/documents") return filesystem["~"]["documents"];
  if (pathStr === "~/downloads") return filesystem["~"]["downloads"];
  return null;
}

// Helper: Check for sensitive keywords and output warnings
function checkSensitiveQuery(text) {
  const query = text.toLowerCase();
  const sensitiveWords = [
    "aadhaar", "aadhar", "sudo", "hack", "flag", "root", "password", 
    "pass", "admin", "ip", "location", "personal", "secret", "cvv", 
    "card", "details", "phone", "mobile", "address", "otp", "pin",
    "sqlmap", "hydra", "john", "hashcat", "aircrack", "airodump", "airmon",
    "nikto", "dirb", "gobuster", "wfuzz", "searchsploit", "passwd",
    "useradd", "userdel", "chown", "kill", "killall", "autoremove"
  ];
  
  if (query.includes("cat confidential.bin")) return true;
  return sensitiveWords.some(word => query.split(" ").includes(word) || query.startsWith(word));
}

// Command interpreter
const commands = {
  help: {
    action: () => [
      "┌──────────────────────── AVAILABLE KALI SHELL COMMANDS ───────────────────┐",
      "│  <span class='term-green'>help</span>      - Show this interactive TUI shell guide.                  │",
      "│  <span class='term-green'>whoami</span>    - Print current user session details.                     │",
      "│  <span class='term-green'>pwd</span>       - Print name of current/working directory.                │",
      "│  <span class='term-green'>ls -la</span>    - List directory contents (directories and files).         │",
      "│  <span class='term-green'>cd [dir]</span>  - Change working directory (~, documents, downloads).     │",
      "│  <span class='term-green'>cat [file]</span>- Output content of a specific simulated file.            │",
      "│  <span class='term-green'>touch/rm</span>  - Create / Delete files.                                  │",
      "│  <span class='term-green'>mkdir/rmdir</span>- Create / Delete directories.                              │",
      "│  <span class='term-green'>nano [file]</span>- Open full interactive GNU Nano text editor.              │",
      "│  <span class='term-green'>htop</span>      - Launch simulated system task manager.                   │",
      "│  <span class='term-green'>neofetch</span>  - Show system specs next to Kali Linux ASCII logo.        │",
      "│  <span class='term-green'>uname -a</span>  - Print system information and kernel stats.              │",
      "│  <span class='term-green'>ping [tgt]</span>- Send ICMP echo requests to target host.                 │",
      "│  <span class='term-green'>msfconsole</span>- Open interactive Metasploit Framework shell.           │",
      "│  <span class='term-green'>clear</span>     - Clear terminal buffer.                                  │",
      "└──────────────────────────────────────────────────────────────────────────┘"
    ].join("\n")
  },
  whoami: {
    action: () => "Nee (Security Researcher & Ethical Hacker)"
  },
  pwd: {
    action: () => currentDir === "~" ? "/home/nee" : `/home/nee/${currentDir.substring(2)}`
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
    // List home folder
    for (const [name, meta] of Object.entries(node)) {
      const label = name + "/";
      rows.push(`│  ${meta.perms}  1 Nee   staff      128 B  ${label.padEnd(25, " ")} │`);
    }
  } else {
    // List subdirectory
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
    return "";
  }
  if (args === "..") {
    if (currentDir !== "~") {
      currentDir = "~";
      promptTilde.textContent = currentDir;
    }
    return "";
  }
  
  const cleanTarget = args.trim().toLowerCase();
  if (currentDir === "~") {
    if (filesystem["~"][cleanTarget] && filesystem["~"][cleanTarget].isDir) {
      currentDir = `~/${cleanTarget}`;
      promptTilde.textContent = currentDir;
      return "";
    }
  }
  return `<span class='term-error'>cd: no such file or directory: ${args}</span>`;
}

function executeMkdir(name) {
  if (!name) return "<span class='term-error'>mkdir: missing operand</span>";
  const cleanName = name.trim().toLowerCase();
  if (currentDir !== "~") return "<span class='term-error'>mkdir: Write permissions restricted in sub-directories</span>";
  if (filesystem["~"][cleanName]) return `<span class='term-error'>mkdir: cannot create directory '${name}': File exists</span>`;
  
  filesystem["~"][cleanName] = { isDir: true, perms: "drwxr-xr-x", files: {} };
  return `[+] Created directory: ${cleanName}`;
}

function executeRmdir(name) {
  if (!name) return "<span class='term-error'>rmdir: missing operand</span>";
  const cleanName = name.trim().toLowerCase();
  if (currentDir !== "~") return "<span class='term-error'>rmdir: Write permissions restricted in sub-directories</span>";
  if (!filesystem["~"][cleanName]) return `<span class='term-error'>rmdir: failed to remove '${name}': No such file or directory</span>`;
  
  delete filesystem["~"][cleanName];
  return `[-] Removed directory: ${cleanName}`;
}

function executeTouch(name) {
  if (!name) return "<span class='term-error'>touch: missing file operand</span>";
  const cleanName = name.trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    return "<span class='term-error'>touch: Files must be created inside directories (documents or downloads)</span>";
  }
  node.files[cleanName] = "[Empty File] Edit using nano editor.";
  return `[+] Created empty file: ${cleanName}`;
}

function executeRm(name) {
  if (!name) return "<span class='term-error'>rm: missing operand</span>";
  const cleanName = name.replace("-rf", "").trim();
  const node = getDirectoryNode(currentDir);
  
  if (currentDir === "~") {
    if (filesystem["~"][cleanName]) {
      delete filesystem["~"][cleanName];
      return `[-] Deleted directory: ${cleanName}`;
    }
    return `<span class='term-error'>rm: cannot remove '${name}': No such file or directory</span>`;
  }
  
  if (node.files[cleanName]) {
    delete node.files[cleanName];
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
    if (typeof fileContent === "function") {
      return fileContent();
    }
    if (name === "confidential.bin") {
      return "<span class='term-error'>[!] ACCESS DENIED: abbe jada info mat le tu kuch nahi kar pyaga!</span>";
    }
    return fileContent.replace(/\n/g, "<br>");
  }
  return `<span class='term-error'>cat: ${name}: No such file or directory</span>`;
}

// Simulated file editors, paging, and tool utilities
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
    alert("Cannot open file here. Navigate to documents or downloads.");
    return;
  }
  
  editorMode = "nano";
  nanoFilename.textContent = filename;
  
  const node = getDirectoryNode(currentDir);
  const existingContent = node.files[filename] || "";
  nanoTextarea.value = typeof existingContent === "function" ? existingContent() : existingContent;
  
  shellContainer.style.display = "none";
  nanoEditor.style.display = "flex";
  nanoTextarea.focus();
}

// Intercept Ctrl+X to exit Nano
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
  
  // Fluctuate CPU and Memory bars dynamically
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

// Close htop when pressing 'q'
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
// MAIN COMMAND ROUTER & EVENT LISTENERS
// ──────────────────────────────────────────
terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const inputVal = terminalInput.value.trim();
    terminalInput.value = "";
    
    if (inputVal === "") return;
    
    commandHistory.push(inputVal);

    // 1. Echo user prompt
    const commandLine = document.createElement("div");
    commandLine.className = "terminal-command-echo";
    commandLine.innerHTML = `${getPromptHTML()} <span class="term-input-echo">${inputVal}</span>`;
    terminalHistory.appendChild(commandLine);

    const outputDiv = document.createElement("div");
    outputDiv.className = "terminal-output-block";

    // 2. Intercept sensitive commands
    if (checkSensitiveQuery(inputVal)) {
      outputDiv.innerHTML = "<span class='term-error'>[!] ERROR: abbe jada info mat le tu kuch nahi kar pyaga!</span>";
      terminalHistory.appendChild(outputDiv);
      const container = document.querySelector(".terminal-container");
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Handle MSF Subshell
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

    // 3. Parse arguments
    const spaceIndex = inputVal.indexOf(" ");
    let cmd = inputVal.toLowerCase();
    let args = "";
    
    if (spaceIndex !== -1) {
      cmd = inputVal.substring(0, spaceIndex).toLowerCase();
      args = inputVal.substring(spaceIndex + 1);
    }

    // Check alias mapping
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
    } else if (cmd === "exit") {
      outputDiv.innerHTML = "[+] Terminal session closed. Restart by refreshing the browser tab.";
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
