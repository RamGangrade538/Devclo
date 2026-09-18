"use strict";

/*
 * DevClo Practice Lab — offline terminal simulator + guided labs.
 * Dummy environment hai syntax/sequence practice ke liye.
 * Real environment ke liye Day 0 ka setup karo.
 */
window.Lab = (function () {

  /* ============ Environment ============ */
  const FS = {
    "/": { children: ["bin/", "etc/", "home/", "root/", "tmp/", "usr/", "var/", "devops/"] },
    "/bin/": "ls cd cat touch mkdir echo sh bash grep curl ip python3 wget sudo apt".split(" ").map(x => x),
    "/etc/": ["hostname", "passwd", "hosts", "nginx/"],
    "/home/": ["user/"],
    "/home/user/": [".bashrc", "devops-lab/", "project/", "server-setup.sh", "app/"],
    "/home/user/devops-lab/": ["notes.txt", "scripts/"],
    "/home/user/devops-lab/scripts/": ["backup.sh", "health-check.sh", "system-info.sh"],
    "/home/user/project/": [".git/", "app.py", "Dockerfile", "docker-compose.yml", "deployment.yaml", "main.tf", "ci.yml"],
    "/home/user/app/": ["app.py", "templates/", "requirements.txt"],
    "/tmp/": [],
    "/usr/": ["bin/", "lib/"],
    "/usr/bin/": [],
    "/var/": ["log/", "www/"],
    "/var/log/": ["nginx/", "syslog"],
    "/var/www/": ["index.html"],
    "/root/": [".bashrc"],
    "/devops/": ["notes/"],
    "/devops/notes/": ["day1.md", "day2.md"],
  };

  const USER = "user";
  const HOST = "devclo";
  const SYS = {
    useradd: ["deploy", "jenkins"],
    services: { nginx: "running", docker: "running", ssh: "running", apache2: "stopped" },
    curl: {
      "https://jsonplaceholder.typicode.com/todos/1": '{"userId":1,"id":1,"title":"delectus aut autem","completed":false}',
      "https://api.github.com": '{"current_user_url":"https://api.github.com/user","current_user_avatar_url":"https://avatars.githubusercontent.com/u/0"}',
    },
  };

  const state = {
    fs: JSON.parse(JSON.stringify(FS)),
    cwd: "/home/user",
    user: USER,
    git: { inited: false, branch: "main", staged: [], files: {}, commits: [], remotes: {}, tag: null },
    net: { ip: "10.10.1.42", up: true },
    node: null,              // selected kubectl node/pod
    aks: { nodes: ["aks-nodepool1-100000", "aks-nodepool1-100001", "aks-nodepool1-100002"], pods: ["nginx", "backend-7d4b9f", "frontend-8c1a2e"] },
    jenkins: { started: false },
    tf: { initialized: false, applied: false },
    az: { loggedIn: false, rg: [] },
    maven: { project: false, packaged: false },
    history: [],
    lastSleep: 0,
  };

  const gitFiles = { "app.py": "print('hello')\n", "README.md": "# Project\n", "main.py": "print('main')\n" };

  function pathResolve(p) {
    if (!p || p === ".") return clean(state.cwd);
    if (p.startsWith("/")) return clean(p);
    return clean(state.cwd + "/" + p);
  }
  function clean(p) {
    const parts = [];
    p.split("/").forEach(seg => {
      if (!seg || seg === ".") return;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    });
    return "/" + parts.join("/");
  }
  function basename(p) { return p.split("/").pop(); }
  function dirname(p) { const c = clean(p); return c.includes("/") ? c.slice(0, c.lastIndexOf("/")) || "/" : "/"; }
  function isDir(p) { return Array.isArray(state.fs[p]); }
  function exists(p) { return p in state.fs && p !== "." && p !== "/"; }
  function resolveDir(p) {
    const d = dirname(p);
    return state.fs[d] && Array.isArray(state.fs[d]) ? d : null;
  }
  function listDir(p) {
    const kids = state.fs[p] || [];
    return kids.map(k => (Array.isArray(state.fs[p + "/" + k]) ? k + "/" : k));
  }
  function addPath(p) {
    if (exists(p)) return;
    const d = resolveDir(p);
    if (!d) return;
    state.fs[p] = "";
    state.fs[d] = (state.fs[d] || []).concat([basename(p)]);
  }
  function removePath(p) {
    if (!exists(p)) return false;
    state.fs[p] = undefined;
    delete state.fs[p];
    const d = dirname(p);
    state.fs[d] = (state.fs[d] || []).filter(x => x !== basename(p) && x !== basename(p) + "/");
    return true;
  }
  function mkDir(p) {
    if (exists(p)) return false;
    const d = resolveDir(p);
    if (!d) return false;
    state.fs[p] = [];
    state.fs[d] = (state.fs[d] || []).concat([basename(p) + "/"]);
    return true;
  }

  /* ============ Commands ============ */
  const OUT = { error: (t) => t, ok: (t) => t };

  const CMD = {};

  function unknown(cmd) {
    return ["bash: " + cmd + ": command not found", "Hint: 'help' likho available commands ke liye."];
  }

  CMD.help = function () {
    return ["DevClo Lab — available commands:",
      "  pwd cd ls ls-l cat touch mkdir echo cp mv rm find tree",
      "  chmod chown whoami id useradd groupadd history clear",
      "  ps kill systemctl service env export hostname",
      "  ip ping curl dig ss netstat host",
      "  git (init status add commit log branch checkout merge push remote diff)",
      "  docker (--version ps images pull run build compose)",
      "  kubectl (get describe apply logs port-forward rollout)",
      "  python3 terraform az mvn node npm",
      "  cal date uptime who free df su sudo",
      "---",
      "Har command ka behaviour realistic-dummy hai. 'check' se lab tasks dekho, 'reset' se sandbox reset."];
  };

  CMD.pwd = function () { return [state.cwd]; };
  CMD.whoami = function () { return [state.user]; };
  CMD.hostname = function () { return [HOST]; };
  CMD.date = function () { return ["Tue Sep 09 10:24:00 IST 2026"]; };
  CMD.cal = function () {
    return ["   September 2026", "Mo Tu We Th Fr Sa Su",
      "    1  2  3  4  5  6", " 7  8  9 10 11 12 13",
      "14 15 16 17 18 19 20", "21 22 23 24 25 26 27", "28 29 30"];
  };
  CMD.uptime = function () { return [" 04:25:00 up 2 days, 3 min, 2 users,  load average: 0.08, 0.12, 0.15"]; };
  CMD.who = function () { return ["user    pts/0    Sep 09 09:55 (192.168.1.5)", "deploy  pts/1    Sep 09 10:01 (devclo.local)"]; };

  CMD.ls = function (args) {
    const opt = args.includes("-l") || args.includes("-la") || args.includes("-al");
    const target = args.filter(a => !a.startsWith("-")).join(" ") || state.cwd;
    const p = pathResolve(target);
    if (!isDir(p)) {
      if (exists(p)) return [p];
      return OUT.error("ls: cannot access '" + target + "': No such file or directory");
    }
    const kids = listDir(p);
    if (!kids.length) return opt ? ["total 0"] : [];
    if (!opt) return kids;
    const lines = ["total " + kids.length * 4];
    kids.forEach(k => {
      const isD = k.endsWith("/");
      const name = isD ? k : k;
      lines.push((isD ? "drwxr-xr-x" : "-rw-r--r--") + "  user user   " + (isD ? "4096" : "220") + " Sep 09 10:00 " + name);
    });
    return lines;
  };

  CMD.cd = function (args) {
    if (!args.length) { state.cwd = "/home/user"; return []; }
    const p = pathResolve(args[0]);
    if (isDir(p)) { state.cwd = p; return []; }
    return OUT.error("cd: no such file or directory: " + args[0]);
  };

  CMD.cat = function (args) {
    const out = [];
    (args.length ? args : [".bashrc"]).forEach(f => {
      const p = pathResolve(f);
      if (!exists(p)) { out.push("cat: " + f + ": No such file or directory"); return; }
      if (isDir(p)) { out.push("cat: " + f + ": Is a directory"); return; }
      if (f.includes("hostname")) out.push("devclo");
      else if (p.endsWith("/app.py") || (state.cwd.includes("project") && f === "app.py")) out.push("from flask import Flask\napp = Flask(__name__)\n\n@app.route(\"/\")\ndef home():\n    return \"Hello DevOps!\"\n");
      else if (f.includes("requirements")) out.push("flask==3.0.0\ngunicorn==21.2.0\n");
      else if (f === "ci.yml") out.push("name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n");
      else if (f === "index.html") out.push("<h1>Welcome to DevClo</h1>");
      else out.push("(dummy content) " + f + ": file kar dekhna hai? cat <file>");
    });
    return out;
  };

  CMD.echo = function (args) {
    if (!args.length) return [""];
    const s = args.join(" ");
    const m = s.match(/^["']?(.*?)["']?\s*>>?\s*(\S+)$/);
    if (m) {
      const p = pathResolve(m[2]);
      addPath(p);
      return [];
    }
    if (s.includes("$")) {
      const e = s.indexOf("$");
      const v = s.slice(e).match(/^\$([A-Za-z_][A-Za-z0-9_]*)/);
      if (v) return [s.slice(0, e) + (process.vars && process.vars[v[1]] || "127.0.0.1")];
    }
    // strip quotes
    return [s.replace(/^["']|["']$/g, "")];
  };

  CMD.mkdir = function (args) {
    const r = args.includes("-p");
    const dirs = args.filter(a => !a.startsWith("-"));
    const made = [];
    dirs.forEach(d => {
      if (!exists(pathResolve(d))) {
        mkDir(pathResolve(d));
        made.push(pathResolve(d));
      }
    });
    return made.map(m => "(created) " + m);
  };

  CMD.touch = function (args) {
    args.forEach(a => addPath(pathResolve(a)));
    return [];
  };

  CMD.cp = function (args) {
    if (args.length >= 2) {
      const src = pathResolve(args[args.length - 2]);
      const dst = pathResolve(args[args.length - 1]);
      addPath(dst);
      return ["(copied) " + args[args.length - 2] + " -> " + args[args.length - 1]];
    }
    return OUT.error("cp: missing destination file operand");
  };

  CMD.mv = function (args) {
    if (args.length >= 2) {
      const src = pathResolve(args[args.length - 2]);
      const dst = pathResolve(args[args.length - 1]);
      removePath(src); addPath(dst);
      return ["(moved) " + args[args.length - 2] + " -> " + args[args.length - 1]];
    }
    return OUT.error("mv: missing destination file operand");
  };

  CMD.rm = function (args) {
    const r = args.includes("-r") || args.includes("-rf");
    (args.filter(a => !a.startsWith("-"))).forEach(a => removePath(pathResolve(a)));
    return [];
  };

  CMD.find = function (args) {
    const p = pathResolve(args[0] || ".");
    return [p + "/" + basename(p), p + "/app.py", p + "/Dockerfile"];
  };

  CMD.tree = function () {
    return [state.cwd, "├── app.py", "├── Dockerfile", "├── deployment.yaml",
      "├── docker-compose.yml", "├── main.tf", "└── ci.yml"];
  };

  CMD.grep = function (args) {
    const pat = args.find(a => a.startsWith("-") === false);
    return ["(dummy match) " + pat + ": line 12 of " + (args[args.length - 1] || "file")];
  };

  CMD.tail = function (args) {
    const n = parseInt(args.find(a => !a.startsWith("-")), 10) || 10;
    return ["(tail) lines " + Math.max(1, n - 4) + "-" + n + ": INFO request handled at 10:2" + n + ":00"];
  };

  CMD.head = function (args) {
    const n = parseInt(args.find(a => !a.startsWith("-")), 10) || 10;
    return ["(head) lines 1-" + n + " (dummy log)"];
  };

  CMD.wc = function (args) { return [args.length ? " 42 120 900 " + args[0] : "0 0 0"]; };
  CMD.sort = function () { return ["apple", "banana", "cherry"]; };
  CMD.uniq = function () { return ["-c 1-3 (dummy uniq)"]; };

  CMD.chmod = function (args) {
    const mode = args.find(a => !a.startsWith("-"));
    const target = args[args.length - 1];
    addPath(pathResolve(target));
    return ["mode of '" + target + "' changed to " + (mode || "0755") + " (r-xr-xr-x)"];
  };
  CMD.chown = function (args) {
    const u = args[0]; const target = args[args.length - 1];
    return ["changed ownership of '" + target + "' to " + u];
  };
  CMD.id = function (args) {
    const u = args[0] ? (args[0].replace(/^[-]*/, "")) : state.user;
    return ["uid=1000(" + u + ") gid=1000(" + u + ") groups=1000(" + u + "),27(sudo)"];
  };
  CMD.useradd = function (args) {
    const u = args[0];
    SYS.useradd.push(u);
    return ["added user '" + u + "'", "Check: id " + u];
  };
  CMD.groupadd = function (args) { return ["group '" + args[0] + "' added"]; };

  CMD.ps = function () {
    return ["  PID TTY          TIME CMD", "    1 pts/0    00:00:01 bash",
      "  101 pts/0    00:00:00 nginx: worker", "  118 pts/1    00:00:03 python3 app.py",
      "  209 pts/0    00:00:00 ps"];
  };
  CMD.kill = function (args) { return ["(simulated) signal TERM sent to " + args.join(" ")]; };
  CMD.systemctl = function (args) {
    const act = args[0]; const svc = args[1];
    if (act === "status") {
      const s = SYS.services[svc];
      return s ? ["● " + svc + ".service - " + (s === "running" ? "active (running)" : s)] : OUT.error("Unit " + svc + ".service not found");
    }
    if (act === "start" || act === "restart" || act === "stop") {
      const s = args[1];
      if (SYS.services[s] !== undefined) {
        SYS.services[s] = act === "stop" ? "stopped" : "running";
        return ["● " + s + ".service " + act + " done"];
      }
    }
    return ["(dummy systemctl) " + args.join(" ")];
  };
  CMD.service = function (args) {
    if (args[1] === "status") return SYS.services[args[0]];
    return ["(dummy service) " + args.join(" ")];
  };

  CMD.env = function () { return ["HOME=/home/user", "PATH=/usr/local/sbin:/usr/bin:/bin", "USER=user", "SHELL=/bin/bash"]; };
  CMD.export = function (args) {
    process.vars = process.vars || {};
    const eq = args[0];
    if (eq && eq.includes("=")) { const [k, v] = eq.split("="); process.vars[k] = v.replace(/^["']|["']$/g, ""); }
    return [];
  };

  CMD.ip = function (args) {
    if ((args[0] || "") === "addr") {
      return ["1: lo: <LOOPBACK,UP> mtu 65536", "    inet 127.0.0.1/8 scope host lo",
        "2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500", "    inet " + state.net.ip + "/24 brd 10.10.1.255 scope global eth0"];
    }
    return ["(dummy ip) " + args.join(" ")];
  };
  CMD.ifconfig = function () { return ["eth0      Link encap:Ethernet  inet addr:" + state.net.ip]; };
  CMD.ping = function (args) {
    const h = args[args.length - 1];
    return ["PING " + h + " (8.8.8.8) 56(84) bytes of data.",
      "64 bytes from " + h + " (8.8.8.8): icmp_seq=1 ttl=116 time=21.3 ms",
      "64 bytes from " + h + " (8.8.8.8): icmp_seq=2 ttl=116 time=19.8 ms",
      "", "--- " + h + " ping statistics ---", "2 packets transmitted, 2 received, 0% packet loss"];
  };
  CMD.curl = function (args) {
    const url = args.find(a => a.startsWith("-") === false);
    if (!url) return ["curl: try 'curl --help'"];
    if (SYS.curl[url]) return [SYS.curl[url]];
    if (url.includes("-I") || url.includes("-i")) return ["HTTP/2 200", "content-type: application/json"];
    return ['{"ok":true,"data":"(dummy response from ' + url + ')"}'];
  };
  CMD.dig = function () {
    return [";; ANSWER SECTION:", "devclo.example.com.  300  IN  A  10.10.1.42"];
  };
  CMD.ss = function (args) {
    return ["State  Recv-Q  Send-Q  Local Address", "LISTEN  0      511     0.0.0.0:80",
      "LISTEN  0      128     0.0.0.0:22", "LISTEN  0      128     127.0.0.1:5000"];
  };
  CMD.netstat = function () { return CMD.ss(); };
  CMD.host = function (args) { return ["Name: " + (args[0] || "host") + "\nAddress: 10.10.1.42"]; };
  CMD.traceroute = function (args) { return ["traceroute to " + args[0] + " (8.8.8.8):", " 1  10.10.1.1  1.2 ms", " 2  192.168.0.1  8.4 ms", " 3  8.8.8.8  21.0 ms"]; };

  /* --- git --- */
  CMD.git = function (args) {
    const s = state.git;
    const sub = args[0];
    if (sub === "init") { s.inited = true; s.branch = "main"; return ["Initialized empty Git repository in " + state.cwd + "/.git/"]; }
    if (!s.inited) return ["fatal: not a git repository (or any parent up to mount point)"];
    if (sub === "status") {
      const lines = ["On branch " + s.branch];
      if (!s.commits.length) lines.push("No commits yet");
      const mod = Object.keys(s.files).filter(f => !s.staged.includes(f));
      if (s.staged.length) lines.push("Changes to be committed:", s.staged.map(f => "\tnew file:   " + f).join("\n"));
      if (mod.length) lines.push("Changes not staged:", mod.map(f => "\tmodified:   " + f).join("\n"));
      else if (!s.staged.length) lines.push("nothing to commit, working tree clean");
      return lines;
    }
    if (sub === "add") {
      const files = args.slice(1).join(" ").split(" ");
      files.forEach(f => { if (f && f !== ".") s.files[f] = 1; if (f === ".") ["app.py", "README.md", "Dockerfile"].forEach(x => s.files[x] = 1); });
      s.staged = Object.keys(s.files);
      return ["aint = " + s.staged.length + " files staged"];
    }
    if (sub === "commit") {
      if (!s.staged.length) return ["nothing to commit"];
      s.commits.push({ msg: args.slice(2).join(" ").replace(/^["']|["']$/g, "") || "update" });
      const sha = "a4f2c1d";
      s.staged = [];
      return ["[main " + sha + "] " + (args.slice(2).join(" ") || "update") + "\n " + Object.keys(s.files).length + " file(s) changed"];
    }
    if (sub === "log") {
      if (!s.commits.length) return ["fatal: your current branch 'main' does not have any commits yet"];
      return s.commits.slice().reverse().map((c, i) =>
        "commit " + "e8a9c" + (i + 3) + "1f0" + (i + 1) + "\nAuthor: user <user@devclo>\n    " + c.msg).join("\n\n");
    }
    if (sub === "branch") {
      return ["* " + s.branch, "  feature/login", "  fix/bug-42"];
    }
    if (sub === "checkout" && args[1] === "-b") {
      s.branch = args[2]; return ["Switched to a new branch '" + args[2] + "'"];
    }
    if (sub === "checkout") {
      s.branch = args[1]; return ["Switched to branch '" + args[1] + "'"];
    }
    if (sub === "merge") {
      return ["Updating e8a9c31..f1a4b02", "Fast-forward"];
    }
    if (sub === "remote") {
      if (args[1] === "-v") return ["origin  https://github.com/user/repo.git (fetch)", "origin  https://github.com/user/repo.git (push)"];
      if (args[1] === "add") { s.remotes[args[2]] = args[3]; return []; }
      return [];
    }
    if (sub === "push") { return ["Enumerating objects: 5, done.", "To https://github.com/user/repo.git", "   e8a9c31..f1a4b02  " + s.branch + " -> " + s.branch]; }
    if (sub === "diff") {
      return ["diff --git a/app.py b/app.py", "+print('hello devops')"];
    }
    return ["(dummy git) " + args.join(" ")];
  };

  /* --- docker --- */
  let dockerCount = 1000;
  CMD.docker = function (args) {
    if (args[0] === "--version" || args[0] === "-v") return ["Docker version 27.2.0, build 3ab5e7d"];
    if (args[0] === "ps") return ["CONTAINER ID   IMAGE           COMMAND         STATUS          PORTS",
      "a3f01c2f 51e8   nginx:1.27      \"/docker-entryp…\"   Up 2 hours      0.0.0.0:80->80/tcp"];
    if (args[0] === "images") return ["REPOSITORY   TAG       IMAGE ID       CREATED       SIZE",
      "app-latest   latest    b31f51a          12 seconds   121MB",
      "nginx        1.27      1a2b3c4d5e6f      2 weeks ago   132MB"];
    if (args[0] === "pull") return ["Using default tag: " + (args[2] || "latest"), "[OK] Pull complete"];
    if (args[0] === "run") return ["a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6", "Unable to find image locally — pulling from registry… complete."];
    if (args[0] === "build") return ["[+] Building 3.2s", "=> [2/2] copying files 0.1s", "=> exporting to image 0.2s", "Successfully built " + dockerCount++ + " | tagged " + (args[args.length - 1] || "app:latest")];
    if (args[0] === "exec") return ["root@a1b2c3d4e5f6:/# (dummy interactive shell)"];
    if (args[0] === "compose") {
      if (args[1] === "up") return ["[+] Running 4/4", "✔ Container app created", "✔ Container db created", "✔ Container redis created", "✔ Container nginx created"];
      if (args[1] === "ps") return ["NAME   IMAGE       STATUS", "app    app:latest  Up 2 minutes", "db     postgres:16 Up 2 minutes (healthy)"];
      return ["(dummy compose) " + args.join(" ")];
    }
    return ["(dummy docker) " + args.join(" ")];
  };

  /* --- kubectl --- */
  CMD.kubectl = function (args) {
    if (args[0] === "get" && args[1] === "nodes") return ["NAME                 STATUS   ROLES    AGE   VERSION",
      "aks-nodepool1-100000   Ready    agent    15d   v1.29.4",
      "aks-nodepool1-100001   Ready    agent    15d   v1.29.4",
      "aks-nodepool1-100002   Ready    agent    15d   v1.29.4"];
    if (args[0] === "get" && (args[1] === "pods" || args[1] === "po")) return ["NAME                     READY   STATUS    RESTARTS   AGE",
      "backend-7d4b9f-8x2k1     1/1     Running   0          3h",
      "frontend-8c1a2e-9n4m6    1/1     Running   0          3h",
      "nginx-7796b7cd5-2hjqz    1/1     Running   0          3h"];
    if (args[0] === "get" && (args[1] === "deployments" || args[1] === "deploy")) return ["NAME       READY   UP-TO-DATE   AVAILABLE   AGE",
      "backend    1/1     1            1           3h", "frontend   1/1     1            1           3h"];
    if (args[0] === "get" && (args[1] === "svc" || args[1] === "services")) return ["NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE",
      "backend      ClusterIP   10.0.0.12      <none>        5000/TCP        3h",
      "frontend     ClusterIP   10.0.0.15      <none>        80/TCP          3h",
      "nginx        LoadBalancer 10.0.0.20     20.82.10.5     80:31589/TCP    3h"];
    if (args[0] === "apply") return [args[args.length - 1] + " created (or unchanged)"];
    if (args[0] === "describe" && args[1] === "pod") return ["Name:         nginx-7796b7cd5-2hjqz", "Namespace:    default", "IP:           10.244.0.7", "Status:       Running", "Image:        nginx:1.27"];
    if (args[0] === "logs") return ["[nginx] 10.1.0.8 - - [09/Sep/2026:10:24:00] \"GET / HTTP/1.1\" 200 612", "[nginx] 10.1.0.8 - - [09/Sep/2026:10:24:01] \"GET /favicon.ico HTTP/1.1\" 404 153"];
    if (args[0] === "port-forward") return ["Forwarding from 127.0.0.1:8080 -> 80"];
    if (args[0] === "rollout") return ["deployment.apps/backend rolled back"];
    if (args[0] === "scale") return ["deployment.apps/backend scaled to " + args[args.length - 1]];
    return ["(dummy kubectl) " + args.join(" ")];
  };

  /* --- misc --- */
  CMD.python3 = function (args) {
    if (args[0] === "--version") return ["Python 3.12.4"];
    if (args[0] === "-c") return ["(python executed) " + args.slice(1).join(" ")];
    return ["(simulated python3) app.py started on port 5000"];
  };
  CMD.pip3 = function (args) { return [args[0] === "install" ? "(installed) " + args[1].replace(/=.*/, "") : "(dummy pip3)"]; };
  CMD.node = function (args) { return args[0] === "-v" ? ["v20.12.0"] : ["(dummy node)"]; };
  CMD.npm = function (args) { return [args[0] === "-v" ? ["10.5.0"] : "(npm " + args.join(" ") + " done)"].flat(); };

  CMD.terraform = function (args) {
    if (args[0] === "version") return ["Terraform v1.9.2", "+ provider registry.terraform.io/hashicorp/azurerm v4.5.0"];
    if (args[0] === "init") { state.tf.initialized = true; return ["Initializing provider plugin", "[OK] Terraform has been successfully initialized!"]; }
    if (args[0] === "plan") return ["Terraform used the selected providers to generate the following execution plan.",
      "Plan: 3 to add, 0 to change, 0 to destroy.", "> azurerm_resource_group.rg will be created", "> azurerm_virtual_network.vnet will be created"];
    if (args[0] === "apply") { state.tf.applied = true; return ["azurerm_resource_group.rg: Creating...", "azurerm_resource_group.rg: Creation complete", "Apply complete! Resources: 3 added, 0 changed, 0 destroyed."]; }
    if (args[0] === "destroy") return ["Destroy complete! Resources: 3 destroyed."];
    return ["(dummy terraform) " + args.join(" ")];
  };

  CMD.az = function (args) {
    if (args[0] === "version") return ["azure-cli                    2.63.0", "core                         2.63.0", "python-location               /usr/bin/python3"];
    if (args[0] === "login") { state.az.loggedIn = true; return ["Opening browser... success", "Subscription name: \"Azure for Students\"", "Tenant: Default Directory"]; }
    if (args[0] === "group" && args[1] === "create") { state.az.rg.push(args[3]); return ["{", "  \"name\": \"" + args[3] + "\",", "  \"location\": \"" + (args[5] || "eastus") + "\",", "  \"provisioningState\": \"Succeeded\"", "}"]; }
    if (args[0] === "group" && args[1] === "list") return ["Name", "devops-rg", "prod-rg"];
    return ["(dummy az) " + args.join(" ")];
  };

  CMD.mvn = function (args) {
    if (args[0] === "-version") return ["Apache Maven 3.9.6 (bc0241f3c7449c9d)", "Java version: 17.0.11"];
    if (args[0] === "clean" && args[1] === "package") { state.maven.packaged = true; return ["[INFO] Building jar: target/app-1.0.0.jar", "[INFO] BUILD SUCCESS"]; }
    return ["(dummy maven) " + args.join(" ")];
  };
  CMD.clear = function () { return []; };
  CMD.reset = function () {
    // reset sandbox
    state.fs = JSON.parse(JSON.stringify(FS));
    state.cwd = "/home/user";
    state.git = { inited: false, branch: "main", staged: [], files: {}, commits: [], remotes: {} };
    return ["Sandbox reset ho gaya. Fresh start!"];
  };
  CMD.check = function () {
    const done = getLabDone();
    return ["Lab progress: " + done.length + " tasks done.", "Labs wali list left panel me dekho."];
  };

  function runCmd(raw, envVars) {
    process.vars = process.vars || {};
    const line = raw.trim();
    state.history.push(line);
    if (!line) return [""];
    let args = tokenize(line);
    if (!args.length) return [""];
    const cmd = args[0];
    args = args.slice(1);
    if (cmd === "sudo") { args = args.slice(1); return runCmdGeneric(args); }
    if (cmd === "su") { state.user = args[0] || "root"; return ["(simulated) now user: " + (args[0] || "root")]; }
    if (CMD[cmd]) return CMD[cmd](args);
    return unknown(cmd);
  }
  function runCmdGeneric(args) {
    return CMD[args[0]] ? CMD[args[0]](args.slice(1)) : unknown(args[0]);
  }
  function tokenize(s) {
    const out = [];
    let cur = "";
    let q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === q) q = null; else cur += c; }
      else if (c === '"' || c === "'") q = c;
      else if (c === " " || c === "\t") { if (cur) { out.push(cur); cur = ""; } }
      else cur += c;
    }
    if (cur) out.push(cur);
    return out;
  }

  /* ============ Labs data ============ */
  const LABS = {
    0:  [ {p: /^sudo apt (update|upgrade)/i, h: "OS update karo — 'sudo apt update'", d: "apt/dpkg, Day 0"},
          {p: /^git --version/i, h: "'git --version' chalao", d: "verify install"},
          {p: /^docker --version/i, h: "'docker --version'", d: "verify install"},
          {p: /^terraform version/i, h: "'terraform version'", d: "verify install"},
          {p: /^az version/i, h: "'az version'", d: "verify install"},
          {p: /^bash ~\/setup-check\.sh/i, h: "setup-check.sh chalao", d: "day0 script"} ],
    1:  [ {p: /^echo .*devops/i, h: "'echo hello devops'", d: "culture"},
          {p: /^cat \/etc\/hostname/i, h: "'cat /etc/hostname'", d: "linux basics"} ],
    2:  [ {p: /^pwd/i, h: "pwd (kaha hai?)", d: "filesystem"},
          {p: /^mkdir -p lab\/a\/b/i, h: "'mkdir -p lab/a/b' nested banao", d: "mkdir"},
          {p: /^cd lab/i, h: "'cd lab'", d: "cd"},
          {p: /^touch note\.txt/i, h: "'touch note.txt'", d: "touch"},
          {p: /^ls -la/i, h: "'ls -la' hidden files", d: "ls"} ],
    3:  [ {p: /^whoami/i, h: "whoami", d: "users"},
          {p: /^sudo useradd deploy/i, h: "'sudo useradd deploy'", d: "useradd"},
          {p: /^chmod 755 setup\.sh/i, h: "'chmod 755 setup.sh'", d: "permissions"},
          {p: /^ps aux/i, h: "'ps aux' processes", d: "ps"},
          {p: /^(echo .*; *)?kill 101/i, h: "'kill 101'", d: "processes"} ],
    4:  [ {p: /^echo \$HOME/i, h: "'echo $HOME' variables", d: "script"},
          {p: /^export NAME=devclo/i, h: "'export NAME=devclo'", d: "env"},
          {p: /^bash ~\/setup-check\.sh/i, h: "script chalao", d: "run script"} ],
    5:  [ {p: /^ip addr/i, h: "'ip addr'", d: "network"},
          {p: /^ping -c 2 google\.com/i, h: "'ping -c 2 google.com'", d: "ping"},
          {p: /^curl https:\/\/jsonplaceholder/i, h: "'curl https://jsonplaceholder.typicode.com/todos/1'", d: "curl"},
          {p: /^ss -tlnp/i, h: "'ss -tlnp' ports", d: "ports"} ],
    6:  [ {p: /^cd project/i, h: "'cd project'", d: "git"},
          {p: /^git init/i, h: "'git init'", d: "git init"},
          {p: /^git status/i, h: "'git status'", d: "git status"},
          {p: /^git add app\.py/i, h: "'git add app.py'", d: "git add"},
          {p: /^git commit -m/i, h: "'git commit -m \"first\"'", d: "git commit"},
          {p: /^git log/i, h: "'git log'", d: "git log"},
          {p: /^git branch feature\/login/i, h: "'git branch feature/login'", d: "branch"},
          {p: /^git checkout feature\/login/i, h: "'git checkout feature/login'", d: "checkout"} ],
    7:  [ {p: /^bash ~\/server-setup\.sh/i, h: "capstone script", d: "review"} ],
    8:  [ {p: /^cd project/i, h: "project me jao", d: "cicd"},
          {p: /^cat ci\.yml/i, h: "'cat ci.yml' pipeline file", d: "cicd"} ],
    9:  [ {p: /^git push/i, h: "'git push' Actions trigger", d: "actions"} ],
    10: [ {p: /^docker pull jenkins\/jenkins/i, h: "'docker pull jenkins/jenkins'", d: "jenkins"},
          {p: /^docker run -p 8080:8080 jenkins/i, h: "'docker run -p 8080:8080 jenkins/jenkins'", d: "jenkins"} ],
    11: [ {p: /^mvn --version/i, h: "'mvn --version'", d: "maven"},
          {p: /^mvn clean package/i, h: "'mvn clean package'", d: "maven build"} ],
    12: [ {p: /^docker pull sonatype\/nexus/i, h: "nexus pull", d: "artifacts"},
          {p: /^docker push ghcr\.io/i, h: "'docker push ghcr.io/user/app:1.0.0'", d: "registry"} ],
    13: [ {p: /^grep ERROR \/var\/log/i, h: "'grep ERROR /var/log/syslog'", d: "automation"},
          {p: /^crontab -e/i, h: "'crontab -e' scheduling", d: "cron"} ],
    14: [ {p: /^bash .*deploy/i, h: "deploy script", d: "review"} ],
    15: [ {p: /^docker --version/i, h: "docker version", d: "docker"},
          {p: /^docker ps/i, h: "'docker ps'", d: "docker"},
          {p: /^cd ~\/app && docker build/i, h: "'docker build -t app .'", d: "docker build"},
          {p: /^docker run -d -p 5000:5000 app/i, h: "'docker run -d -p 5000:5000 app'", d: "docker run"} ],
    16: [ {p: /^cd project/i, h: "cd project", d: "compose"},
          {p: /^docker compose up -d/i, h: "'docker compose up -d'", d: "compose"},
          {p: /^docker compose ps/i, h: "'docker compose ps'", d: "compose"} ],
    17: [ {p: /^docker images/i, h: "'docker images' size", d: "images"},
          {p: /^docker build -t app:multi/i, h: "multi-stage image", d: "optimize"},
          {p: /^docker pull aquasec\/trivy/i, h: "trivy scanner", d: "security"} ],
    18: [ {p: /^kubectl get nodes/i, h: "'kubectl get nodes'", d: "k8s"},
          {p: /^kubectl get pods/i, h: "'kubectl get pods'", d: "k8s"},
          {p: /^kubectl describe pod/i, h: "'kubectl describe pod nginx-7796b7cd5-2hjqz'", d: "k8s"} ],
    19: [ {p: /^kubectl apply -f deployment\.yaml/i, h: "'kubectl apply -f deployment.yaml'", d: "deploy"},
          {p: /^kubectl scale deploy/i, h: "scale replicas", d: "scale"},
          {p: /^kubectl rollout undo/i, h: "rollback", d: "rollout"} ],
    20: [ {p: /^kubectl create configmap/i, h: "'kubectl create configmap app-config --from-literal=env=prod'", d: "configmap"},
          {p: /^kubectl create secret/i, h: "'kubectl create secret generic db-pass --from-literal=pass=123'", d: "secret"} ],
    21: [ {p: /^kubectl get all/i, h: "'kubectl get all' microservices", d: "review"} ],
    22: [ {p: /^terraform init/i, h: "'terraform init'", d: "tf"},
          {p: /^terraform plan/i, h: "'terraform plan'", d: "tf"},
          {p: /^terraform apply/i, h: "'terraform apply'", d: "tf"} ],
    23: [ {p: /^az login/i, h: "'az login'", d: "azure"},
          {p: /^az group create/i, h: "'az group create -n devops-rg -l eastus'", d: "azure"} ],
    24: [ {p: /^docker run -d -p 9090:9090 prom\/prometheus/i, h: "prometheus run", d: "monitoring"},
          {p: /^docker run -d -p 3000:3000 grafana/i, h: "grafana run", d: "monitoring"} ],
    25: [ {p: /^docker run -d -p 9200:9200 docker\.elastic/i, h: "elasticsearch", d: "elk"},
          {p: /^curl localhost:9200/i, h: "'curl localhost:9200' ES check", d: "elk"} ],
    26: [ {p: /^docker pull aquasec\/trivy/i, h: "trivy image scan", d: "security"},
          {p: /^pip3 install bandit/i, h: "'pip3 install bandit'", d: "sast"} ],
    27: [ {p: /^echo "SLO 99.9%/i, h: "'echo \"SLO 99.9% = 43min/month downtime\"'", d: "sre"} ],
    28: [ {p: /^cd /i, h: "capstone stack", d: "review"} ],
    29: [ {p: /^mkdir -p project\/{backend,frontend,worker}/i, h: "microservices tree", d: "plan"} ],
    30: [ {p: /^kubectl apply -f deployment\.yaml/i, h: "deploy deploytrack", d: "impl"} ],
    31: [ {p: /^az account list/i, h: "az account list — subs dekho", d: "azure"},
          {p: /^az cost management export/i, h: "cost export", d: "finops intro"} ],
    32: [ {p: /^docker run -d -p 8080:8080 quay\.io\/argoproj\/argocd/i, h: "ArgoCD run", d: "gitops"},
          {p: /^argocd app create/i, h: "'argocd app create <name>'", d: "gitops"},
          {p: /^argocd app sync/i, h: "'argocd app sync <name>'", d: "gitops"},
          {p: /^argocd app get/i, h: "'argocd app get <name>' health", d: "gitops"} ],
    33: [ {p: /^istioctl install/i, h: "'istioctl install'", d: "mesh"},
          {p: /^kubectl label namespace/i, h: "istio-injection=enabled", d: "mesh"},
          {p: /^kubectl apply -f virtual-service\.yaml/i, h: "VirtualService canary", d: "mesh"} ],
    34: [ {p: /^curl -s https:\/\/get\.gitleaks\.com/i, h: "gitleaks install", d: "sec"},
          {p: /^gitleaks detect/i, h: "'gitleaks detect' repo scan", d: "sec"},
          {p: /^docker pull aquasec\/trivy/i, h: "trivy image scan", d: "sec"} ],
    35: [ {p: /^az keyvault create/i, h: "'az keyvault create ...'", d: "kv"},
          {p: /^az keyvault secret set/i, h: "'az keyvault secret set'", d: "kv"},
          {p: /^sops --encrypt/i, h: "'sops --encrypt secrets.yaml'", d: "sops"},
          {p: /^vault kv put/i, h: "'vault kv put secret/demo user=dev'", d: "vault"} ],
    36: [ {p: /^kubectl api-resources/i, h: "'kubectl api-resources' CRDs", d: "k8s adv"},
          {p: /^kubectl create -f crd\.yaml/i, h: "CRD create", d: "k8s adv"},
          {p: /^kubectl get sc/i, h: "'kubectl get sc' storageclasses", d: "k8s adv"} ],
    37: [ {p: /^kubectl create namespace policy/i, h: "policy ns", d: "policy"},
          {p: /^kubectl apply -f policy\.yaml/i, h: "'kubectl apply -f kyverno'", d: "policy"},
          {p: /^kubectl get clusterpolicy/i, h: "'kubectl get clusterpolicy'", d: "policy"} ],
    38: [ {p: /^npx @backstage\/create-app/i, h: "backstage create", d: "idp"},
          {p: /^yarn dev/i, h: "'yarn dev' backstage run", d: "idp"},
          {p: /^cat catalog-info\.yaml/i, h: "catalog-info.yaml", d: "idp"} ],
    39: [ {p: /^kubectl cost/i, h: "'kubectl cost namespace'", d: "finops"},
          {p: /^az cost*/i, h: "'az cost management'", d: "finops"},
          {p: /^az tag create/i, h: "tags budget tracking", d: "finops"} ],
    40: [ {p: /^docker pull litmuschaos\/litmus/i, h: "litmus pull", d: "chaos"},
          {p: /^helm install litmus/i, h: "'helm install litmus ...'", d: "chaos"},
          {p: /^litmus create experiment/i, h: "chaos experiment", d: "chaos"} ],
    41: [ {p: /^velero install/i, h: "'velero install --provider azure ...'", d: "dr"},
          {p: /^velero backup create/i, h: "'velero backup create demo'", d: "dr"},
          {p: /^velero restore create/i, h: "'velero restore create ...'", d: "dr"},
          {p: /^az site-recovery/i, h: "ASR test-failover", d: "dr"} ],
    42: [ {p: /^terraform providers/i, h: "'terraform providers' multi", d: "multicloud"},
          {p: /^aws configure/i, h: "aws creds (optional)", d: "multicloud"},
          {p: /^az account show/i, h: "'az account show' Azure info", d: "multicloud"} ],
    43: [ {p: /^az functionapp create/i, h: "function app", d: "serverless"},
          {p: /^func new/i, h: "'func new --worker-runtime python'", d: "serverless"},
          {p: /^keda install/i, h: "KEDA install", d: "serverless"} ],
    44: [ {p: /^pip3 install mlflow/i, h: "'pip3 install mlflow'", d: "mlops"},
          {p: /^mlflow run/i, h: "'mlflow run experiment'", d: "mlops"},
          {p: /^mlflow serve/i, h: "'mlflow models serve'", d: "mlops"} ],
    45: [ {p: /^docker pull fishtownanalytics\/dbt/i, h: "dbt pull", d: "data"},
          {p: /^dbt init/i, h: "'dbt init my_project'", d: "data"},
          {p: /^dbt run/i, h: "'dbt run' models", d: "data"},
          {p: /^dbt test/i, h: "'dbt test' quality", d: "data"} ],
    46: [ {p: /^az apim create/i, h: "'az apim create'", d: "api"},
          {p: /^curl -w "%{http_code}"/i, h: "API status code", d: "api"},
          {p: /^nc -z localhost/i, h: "port check", d: "api"} ],
    47: [ {p: /^docker run -d -p 5665:5665 grafana\/k6/i, h: "k6 run", d: "perf"},
          {p: /^k6 run script/i, h: "'k6 run load.js'", d: "perf"},
          {p: /^top/i, h: "'top' resource", d: "perf"} ],
    48: [ {p: /^syft .* -o cyclonedx/i, h: "'syft image -o cyclonedx-json'", d: "sbom"},
          {p: /^cosign sign/i, h: "'cosign sign image'", d: "sbom"},
          {p: /^cosign verify/i, h: "'cosign verify image'", d: "sbom"},
          {p: /^kubectl apply -f verify-images\.yaml/i, h: "Kyverno verify-images", d: "sbom"} ],
    49: [ {p: /^az role assignment list/i, h: "RBAC check", d: "sec"},
          {p: /^az account get-access-token/i, h: "token (entra)", d: "sec"},
          {p: /^az network nsg list/i, h: "NSG rules", d: "sec"},
          {p: /^az monitor app-insights create/i, h: "sentinel/app-insights", d: "sec"} ],
    50: [ {p: /^kubectl get all -A/i, h: "full platform check", d: "capstone"},
          {p: /^kubectl get nodes/i, h: "cluster health", d: "capstone"},
          {p: /^argocd app list/i, h: "gitops status", d: "capstone"},
          {p: /^velero get backups/i, h: "DR backup list", d: "capstone"} ],
  };

  const CHEAT = {
    0:  ["sudo apt update", "git --version", "python3 --version", "docker --version", "kubectl version --client", "terraform version", "az --version"],
    1:  ["echo Hello DevOps", "cat /etc/hostname"],
    2:  ["pwd", "mkdir -p lab/a/b", "cd lab", "touch note.txt", "ls -la", "find . -name '*.txt'"],
    3:  ["whoami", "sudo useradd deploy", "chmod 755 setup.sh", "ps aux", "kill 101", "systemctl status nginx"],
    4:  ["echo $HOME", "export NAME=devclo", "echo $NAME", "bash script.sh"],
    5:  ["ip addr", "ping -c 2 google.com", "curl https://jsonplaceholder.typicode.com/todos/1", "dig google.com", "ss -tlnp"],
    6:  ["cd project", "git init", "git status", "git add app.py", "git commit -m \"first commit\"", "git log", "git branch feature/login", "git checkout feature/login"],
    7:  ["bash ~/server-setup.sh", "systemctl status nginx"],
    8:  ["cd project", "cat ci.yml", "git push"],
    9:  ["git push", "git status"],
    10: ["docker pull jenkins/jenkins", "docker run -p 8080:8080 jenkins/jenkins"],
    11: ["mvn --version", "mvn clean package"],
    12: ["docker pull sonatype/nexus3", "docker push ghcr.io/user/app:1.0.0"],
    13: ["grep ERROR /var/log/syslog", "tail -f /var/log/syslog", "crontab -e"],
    14: ["bash deploy.sh", "bash ~/server-setup.sh"],
    15: ["docker --version", "cd ~/app", "docker build -t app .", "docker run -d -p 5000:5000 app", "docker ps"],
    16: ["cd project", "docker compose up -d", "docker compose ps", "docker compose logs"],
    17: ["docker images", "docker build -t app:multi .", "docker pull aquasec/trivy", "python3 /dev/null"],
    18: ["kubectl get nodes", "kubectl get pods", "kubectl describe pod nginx-7796b7cd5-2hjqz", "kubectl logs nginx-7796b7cd5-2hjqz"],
    19: ["kubectl apply -f deployment.yaml", "kubectl scale deploy backend --replicas=3", "kubectl rollout undo deploy backend", "kubectl get svc"],
    20: ["kubectl create configmap app-config --from-literal=env=prod", "kubectl create secret generic db-pass --from-literal=pass=DevClo123", "kubectl get configmap"],
    21: ["kubectl get all", "kubectl get pods -o wide"],
    22: ["cd project", "terraform init", "terraform plan", "terraform apply", "terraform destroy"],
    23: ["az login", "az group create -n devops-rg -l eastus", "az vm create -n vm-app -g devops-rg --image Ubuntu2204"],
    24: ["docker run -d -p 9090:9090 prom/prometheus", "docker run -d -p 3000:3000 grafana/grafana"],
    25: ["docker run -d -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:8.13.0", "curl localhost:9200"],
    26: ["docker pull aquasec/trivy", "pip3 install bandit", "python3 -m bandit /home/user/app"],
    27: ["echo \"SLO 99.9% = 43 min/month downtime\""],
    28: ["terraform apply", "kubectl get pods", "curl localhost:9090"],
    29: ["mkdir -p ~/deploytrack/{backend,frontend,worker}", "cd ~/deploytrack", "ls -R"],
    30: ["kubectl apply -f deployment.yaml", "kubectl rollout status deploy backend", "kubectl get pods"],
    31: ["az account list", "az cost management export create --name export", "az group list"],
    32: ["docker run -d -p 8080:8080 -e ARGOCD_SERVER_INSECURE=true quay.io/argoproj/argocd:v2.10.2", "argocd app create demo --repo https://github.com/you/app.git --path manifests --dest-server https://kubernetes.default.svc", "argocd app sync demo", "argocd app get demo"],
    33: ["istioctl install --set profile=demo -y", "kubectl label namespace default istio-injection=enabled", "kubectl apply -f virtual-service.yaml", "kubectl get virtualservice", "kubectl get pods -l istio.io/rev"],
    34: ["curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/install.sh | sh", "gitleaks detect --source .", "docker pull aquasec/trivy", "trivy image myapp:latest", "pip3 install semgrep"],
    35: ["az keyvault create -n devclo-kv-$RANDOM -g devops-rg --location eastus", "az keyvault secret set --vault-name devclo-kv --name db-pass --value 'DevClo#123'", "az keyvault secret show --vault-name devclo-kv --name db-pass", "vault kv put secret/demo user=devops pass=dev#123", "sops --encrypt secrets.yaml"],
    36: ["kubectl api-resources", "kubectl explain deployment", "kubectl create -f crd.yaml", "kubectl get crd", "kubectl get sc", "kubectl create rolebinding app-deployer --role=editor --user=devops --namespace=apps"],
    37: ["kubectl create ns policy", "kubectl apply -f policy.yaml", "kubectl get clusterpolicy", "kubectl get policyreport", "kubectl apply -f deploy-with-latest.yaml"],
    38: ["npx @backstage/create-app@latest", "yarn dev", "cat catalog-info.yaml", "cat templates/scaffolder-template.yaml"],
    39: ["kubectl cost namespace --show-cpu", "az cost management query --type ActualCost", "az tag create --resource-id /subscriptions/x/resourceGroups/devops-rg --tags owner=devops env=prod", "az account list -o table"],
    40: ["docker pull litmuschaos/litmus:2.14.0", "helm repo add litmuschaos https://charts.litmuschaos.io", "helm install litmus litmuschaos/litmus --namespace litmus --create-namespace", "kubectl create -f pod-delete.yaml", "kubectl get experiments"],
    41: ["velero install --provider azure --bucket devclo-backups --secret-file ./credentials-velero", "velero backup create demo-backup", "velero backup get", "velero restore create --from-backup demo-backup", "az site-recovery vault create -n rs-vault -g devops-rg --location eastus"],
    42: ["terraform providers", "az account show -o json", "aws configure", "kubectl config get-contexts"],
    43: ["func new --worker-runtime python --template HTTP trigger", "az functionapp create -n devclo-func -g devops-rg --consumption-plan-location eastus --runtime python", "helm repo add kedacore https://kedacore.github.io/charts", "helm install keda kedacore/keda"],
    44: ["pip3 install mlflow", "mlflow run https://github.com/mlflow/mlflow-example", "mlflow experiments create --experiment-name devops-lab", "mlflow models serve -m models:/iris_model/Production -p 5002"],
    45: ["docker pull fishtownanalytics/dbt", "dbt init devops_analytics", "cd devops_analytics && dbt run", "dbt test", "dbt docs generate"],
    46: ["az apim create -n devclo-apim -g devops-rg --publisher-email admin@devops.com --publisher-name DevClo", "curl -sw '%{http_code}' https://jsonplaceholder.typicode.com/todos/1", "curl -i https://api.github.com/zen"],
    47: ["docker run -d -p 5665:5665 grafana/k6", "cat > load.js <<'EOF'\nimport http from 'k6/http';\nexport const options = { thresholds: { http_req_duration: ['p(99)<500'] }, stages: [{ duration: '30s', target: 50 }] };\nexport default function () { http.get('http://localhost:5000/'); }\nEOF", "k6 run load.js", "top", "docker stats"],
    48: ["syft image alpine:latest -o cyclonedx-json", "cosign generate-key-pair", "cosign sign --key cosign.key myimage", "cosign verify --key cosign.pub myimage", "kubectl apply -f verify-images.yaml"],
    49: ["az role assignment list --assignee devops@example.com -o table", "az account get-access-token -o json", "az network nsg list -o table", "az monitor app-insights create -n devclo-ai -g devops-rg --workspace devclo-log"],
    50: ["kubectl get nodes", "kubectl get all -A", "argocd app list", "velero get backups", "kubectl get clusterpolicy", "az cost management query --type ActualCost", "curl -I localhost", "kubectl get virtualservice"],
  };

  function getLabToken(d) { return "devclo-lab-" + d; }
  function getLabDone(d) {
    try { return JSON.parse(localStorage.getItem(getLabToken(d)) || "[]"); } catch (e) { return []; }
  }
  function saveLabDone(d, arr) {
    localStorage.setItem(getLabToken(d), JSON.stringify(arr));
    renderLabs();
  }

  function checkTasks(d, rawCmd) {
    const tasks = LABS[d];
    if (!tasks) return;
    const done = getLabDone(d);
    let changed = false;
    tasks.forEach((t, i) => {
      if (!done.includes(i) && t.p.test(rawCmd)) { done.push(i); changed = true; }
    });
    if (changed) { done.sort((a, b) => a - b); saveLabDone(d, done); }
  }

  /* ============ UI ============ */
  let terminalEl = null, inputEl = null, outEl = null;
  let historyIdx = -1;
  let currentDay = 0;

  function line(html, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    outEl.appendChild(d);
  }

  function promptHtml() {
    return '<span class="t-user">' + state.user + "</span><span class=\"t-at\">@</span><span class=\"t-host\">" + HOST +
      "</span><span class=\"t-path\">:" + state.cwd.replace("/home/user", "~") + "$</span>";
  }

  function print(cmd, output, cls) {
    line(promptHtml() + ' <span class="t-cmd">' + escHtml(cmd) + "</span>");
    (output || [""]).forEach(o => line(escHtml(o), cls || ""));
  }

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function execute() {
    const cmd = inputEl.value.trim();
    if (!cmd) return;
    const out = runCmd(cmd);
    print(cmd, out);
    if (currentDay >= 0) checkTasks(currentDay, cmd);
    inputEl.value = "";
    historyIdx = -1;
    outEl.scrollTop = outEl.scrollHeight;
  }

  function renderLabs() {
    const tasks = LABS[currentDay] || [];
    const done = getLabDone(currentDay);
    const wrap = document.getElementById("labTasks");
    if (!wrap) return;
    const day = (window.App.DAYS || []).find(dd => dd.num === currentDay);
    const related = (window.App.TOPICS || []).filter(t => t.days.indexOf(currentDay) !== -1);
    const studyLine =
      '<div class="lab-studyline">' +
        '<button class="lab-study" data-go="day" title="Day page = study material (theory + diagram + demo)">📖 Study Material' +
          (day ? escHtml(" — Day " + currentDay + ": " + day.title) : "") + " →</button>" +
        (related.length
          ? "<span class='lab-study-sub'>Related deep dive" + (related.length > 1 ? "s" : "") + ':</span> ' +
            related.map(t => '<button class="lab-study-chip" data-go="topic" data-slug="' + t.slug + '">' + escHtml(t.title) + "</button>").join("")
          : "") +
      "</div>";
    const body = tasks.length
      ? tasks.map((t, i) => {
          const d = done.includes(i);
          return '<div class="lab-task' + (d ? " done" : "") + '">' +
            '<span class="lab-tick">' + (d ? "✓" : "•") + "</span>" +
            '<div class="lab-txt"><div class="lab-ins">' + escHtml(t.d) + ": " + escHtml(t.h) + "</div>" +
            '<div class="lab-prog">' + escHtml(t.prev || t.d) + "</div></div></div>";
        }).join("") +
          '<div class="lab-count">' + done.length + "/" + tasks.length + " tasks</div>"
      : '<div class="lab-empty">Is day ke liye koi practice task nahi — demo commands terminal me try karo.</div>';
    wrap.innerHTML = studyLine + body;
    wrap.querySelectorAll(".lab-study, .lab-study-chip").forEach(b => {
      b.addEventListener("click", () => {
        if (b.dataset.go === "day") window.App.loadDay(currentDay);
        else if (b.dataset.go === "topic") window.App.loadTopic(b.dataset.slug);
      });
    });
  }

  function cheatWrap() {
    const box = document.getElementById("labCheat");
    if (!box) return;
    const cmds = CHEAT[currentDay] || [];
    box.innerHTML = cmds.map(c => '<button class="cheat-btn" data-cmd="' + escHtml(c) + '">$ ' + escHtml(c) + "</button>").join("");
    box.querySelectorAll(".cheat-btn").forEach(b => {
      b.addEventListener("click", () => {
        inputEl.value = b.dataset.cmd;
        inputEl.focus();
        inputEl.scrollLeft = inputEl.scrollLength;
      });
    });
  }

  function dayTabs() {
    const wrap = document.getElementById("labDays");
    if (!wrap) return;
    wrap.innerHTML = window.App.DAYS.map(d => {
      const done = getLabDone(d.num);
      const total = (LABS[d.num] || []).length;
      const cls = currentDay === d.num ? " active" : "";
      return '<button class="lab-day' + cls + '" data-day="' + d.num + '">' +
        (done.length === total && total ? "✓" : "") + " D" + d.num + "</button>";
    }).join("");
    wrap.querySelectorAll(".lab-day").forEach(b => {
      b.addEventListener("click", () => { currentDay = parseInt(b.dataset.day, 10); renderLabs(); cheatWrap(); });
    });
  }

  function init(container) {
    container.innerHTML =
      '<div class="lab-shell">' +
        '<div class="lab-head"><h2>🧪 Practice Lab <span class="lab-sub">— dummy sandbox (offline)</span></h2>' +
        '<div class="lab-note">Command type karo aur practice karo. Checklist wali command sahi hui to <b>✓</b> lagta hai. Real environment: Day 0.</div></div>' +
        '<div class="lab-main">' +
          '<div class="lab-left">' +
            '<div class="lab-daybar"><div class="lab-title">DAY WISE LABS</div><div class="lab-days" id="labDays"></div></div>' +
            '<div class="lab-tasks" id="labTasks"></div>' +
            '<div class="lab-cheat-title">📖 CHEAT SHEET (click = terminal me daalo)</div>' +
            '<div class="lab-cheat" id="labCheat"></div>' +
          "</div>" +
          '<div class="lab-term-wrap">' +
            '<div class="lab-term-head"><span>📟 devclo-guest — /bin/bash</span><button class="lab-clear" id="labClear">clear</button><button class="lab-reset" id="labReset">reset sandbox</button></div>' +
            '<div class="lab-term-out" id="labOut"></div>' +
            '<div class="lab-term-in">' + promptHtml() + ' <input id="labInput" spellcheck="false" autocomplete="off"></div>' +
          "</div>" +
        "</div>" +
      "</div>";

    outEl = document.getElementById("labOut");
    inputEl = document.getElementById("labInput");
    terminalEl = document.getElementById("labTermWrap");
    currentDay = window.App.current() >= 0 ? window.App.current() : 1;

    line('<span class="t-muted">DevClo Practice Lab — dummy Linux sandbox.</span>');
    line('<span class="t-muted">Commands: pwd ls cd mkdir touch cat echo chmod ps git docker kubectl terraform az python3 ...</span>');
    line('<span class="t-muted">"help" for full list. Start: Day ' + currentDay + " tasks left me dekho.</span>");
    print("", ["DevClo " + state.user + "@" + HOST + ": " + state.cwd], "t-muted");

    renderLabs();
    cheatWrap();
    dayTabs();

    function submit() { execute(); }
    inputEl.addEventListener("keydown", ev => {
      if (ev.key === "Enter") submit();
      else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        if (historyIdx < state.history.length - 1) {
          historyIdx++;
          inputEl.value = state.history[state.history.length - 1 - historyIdx];
        }
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (historyIdx > 0) { historyIdx--; inputEl.value = state.history[state.history.length - 1 - historyIdx]; }
        else { historyIdx = -1; inputEl.value = ""; }
      }
    });
    inputEl.focus();
    document.getElementById("labClear").addEventListener("click", () => { outEl.innerHTML = ""; line('<span class="t-muted">(cleared)</span>'); inputEl.focus(); });
    document.getElementById("labReset").addEventListener("click", () => {
      const out = runCmd("reset");
      outEl.innerHTML = "";
      line('<span class="t-muted">Sandbox reset.</span>');
      inputEl.focus();
    });
  }

  return { init, LABS, checkTasks, getLabDone };
})();