"use strict";

(function () {
  const App = () => window.App;
  const $msg = () => document.getElementById("chatMessages");
  const $input = () => document.getElementById("chatInput");

  const TOPICS = [
    { k: /\b(docker|container)\b/i, n: [15, 16, 17], t: "Docker containers + compose + optimization" },
    { k: /\b(kubernetes|k8s|minikube|pod|helm)\b/i, n: [18, 19, 20], t: "Kubernetes fundamentals, deployments, secrets" },
    { k: /\b(terraform|iac|provider)\b/i, n: [22], t: "Terraform + Azure Infra as Code" },
    { k: /\b(azure|az cli|blob|vm)\b/i, n: [23], t: "Azure Core Services (VNet, VM, Storage, SQL)" },
    { k: /\b(git|github)\b/i, n: [6, 9], t: "Git fundamentals + GitHub Actions" },
    { k: /\b(jenkins|pipeline)\b/i, n: [10, 8], t: "Jenkins pipeline + CI/CD concepts" },
    { k: /\b(prometheus|grafana|monitoring|alert)\b/i, n: [24], t: "Prometheus + Grafana monitoring" },
    { k: /\b(el[kK]|logging|logstash|kibana|elasticsearch|filebeat)\b/i, n: [25], t: "ELK logging stack" },
    { k: /\b(secur|devsecops|trivy|bandit|gitleaks)\b/i, n: [26], t: "DevSecOps security scanning" },
    { k: /\b(sre|slo|sli|reliab)\b/i, n: [27], t: "SRE concepts, SLIs/SLOs" },
    { k: /\b(linux|command|bash|terminal)\b/i, n: [2, 3, 4, 13], t: "Linux commands, permissions, scripting" },
    { k: /\b(shell|script|awk|sed|jq|cron)\b/i, n: [4, 13], t: "Shell scripting + automation" },
    { k: /\b(network|dns|ip|http|tcp|port)\b/i, n: [5], t: "Networking fundamentals" },
    { k: /\b(maven|gradle|build tool)\b/i, n: [11], t: "Build tools (Maven, Gradle)" },
    { k: /\b(artifact|nexus|repository|registry)\b/i, n: [12], t: "Artifact management" },
    { k: /\b(capstone|deploytrack|project)\b/i, n: [29, 30], t: "Final capstone project (DeployTrack)" },
    { k: /\b(devops|calms|culture)\b/i, n: [1], t: "DevOps culture & principles" },
  ];

  const HELP_TEXT =
    "Main kya kar sakta hoon:\n" +
    "• 'day 5' → wo day kholo\n" +
    "• 'docker kya hai' → us topic ke days\n" +
    "• 'week 3' → us week ke topics\n" +
    "• 'progress' → tumhara progress\n" +
    "• 'interview' / 'tricky' → Interview Q&A kholo\n" +
    "• 'practice' / 'lab' → dummy Practice Lab\n" +
    "• 'deep dive' → topic deep dives\n" +
    "• 'setup' → Day 0 tools install\n" +
    "• 'debug' / 'help' → ye help, ya Help page\n" +
    "Koi bhi topic likh do — main dhoondh dunga. 😄";

  const welcome = {
    text: "Namaste! 🙏 Main tumhara DevOps guide hoon.\nDay 0-50 tak sab content offline available hai — jis din ka bhi puchho, wahi khol doonga. Poore 50 days = 5-saal experience level ka DevOps.",
    chips: ["Day 1 shuru karo", "🔧 Setup (Day 0)", "🎯 Interview Q&A", "🧪 Practice Lab", "📈 Meri progress"],
  };

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function addMsg(text, who) {
    const m = document.createElement("div");
    m.className = "msg " + who;
    m.textContent = text;
    $msg().appendChild(m);
    scrollBottom();
    return m;
  }

  function addHtml(html, who) {
    const m = document.createElement("div");
    m.className = "msg " + who;
    m.innerHTML = html;
    $msg().appendChild(m);
    scrollBottom();
  }

  function addChips(list, fn) {
    const c = document.getElementById("chatChips");
    c.innerHTML = "";
    list.forEach(label => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = label;
      b.addEventListener("click", () => fn(label));
      c.appendChild(b);
    });
  }

  function scrollBottom() { $msg().scrollTop = $msg().scrollHeight; }

  function typing(next) {
    const m = document.createElement("div");
    m.className = "msg bot";
    m.innerHTML = '<span class="typing">···</span>';
    $msg().appendChild(m);
    scrollBottom();
    setTimeout(() => { m.remove(); next(); }, 420);
  }

  function linkDots(days) {
    return days.map(n => {
      if (n === -2) return '<button class="chip-link nav-btn" onclick="App.loadHelp()">💡 Open Help &amp; Debug</button>';
      const d = App().DAYS.find(x => x.num === n);
      if (!d) return "";
      return '<button class="chip-link nav-btn" onclick="App.loadDay(' + n + ')">▶ Day ' + n + " · " + esc(d.title) + "</button>";
    }).join("<br>");
  }

  function dayInfo(n) {
    const d = App().DAYS.find(x => x.num === n);
    if (!d) return null;
    const done = App().isDone(n) ? "✓ done" : "⏳ baaki";
    return { n, title: d.title, short: d.short, type: d.type, done };
  }

  function answer(q) {
    q = q.trim();
    const app = App();

    if (/^(hi|hello|hey|namaste|pranam|namaskar)\b/i.test(q))
      return { text: welcome.text, chips: welcome.chips };

    if (/\b(help|kya kar sakta|commands|kya karna)\b/i.test(q))
      return { text: HELP_TEXT, chips: ["progress", "setup", "debug"] };

    if (/\b(debug|problem|error|garabari|trouble|kaam nahi|issue|fail)\b/i.test(q))
      return { text: "Debug page khol deta hoon — wahan har tool ke errors + fixes hain.\nAgar specific ho to error ka text batao. 👇", days: [0, -2] };

    if (/\b(setup|install|prerequisites|day 0|tools)\b/i.test(q))
      return { text: "Day 0 = saare tools install + verify + debug. Open karun? 👇", days: [0] };

    if (/\b(progress|kitna|complete|tracking|kya complete|done kiya)\b/i.test(q))
      return progressMsg();

    const nextD = /^(\s*(next|agle?|agla)\s*)$/i.test(q);
    if (nextD) {
      const cur = app.current();
      const target = cur >= 0 ? cur + 1 : app.nextUndone();
      const info = dayInfo(target);
      return info ? { text: "Aagaya: Day " + info.n + " — " + info.title, days: [target] }
                  : { text: "Saare days ho gaya! 🎉 Ab interview corner/practice lab try karo.", days: [50] };
    }

    if (/\b(interview|sawaal|question|qa|tricky)\b/i.test(q))
      return { text: "Interview Corner kholun? Har day ke top Q&amp;A + 🧩 tricky section. Sirf soch ke answer dekho. 🎯", html: '<button class="chip-link nav-btn" onclick="App.loadInterviews(null)">🎯 Open Interview Q&amp;A</button>' };

    if (/\b(practice|lab|sandbox|labs)\b/i.test(q))
      return { text: "Practice Lab kholun? Dummy Linux sandbox — commands type karo aur checklists me ✓ kamaye. 🧪", html: '<button class="chip-link nav-btn" onclick="App.loadLab()">🧪 Open Practice Lab</button>' };

    if (/\b(deep ?dive|topic(|s)|in.?depth|detail study|concept detail)\b/i.test(q))
      return { text: "Deep Dives yahan hain — har chhota topic ka apna in-depth page. 📚", html: App().TOPICS.slice(0, 8).map(t =>
        '<button class="chip-link nav-btn" onclick="App.loadTopic(\'' + t.slug + '\')">📚 ' + esc(t.title) + "</button>").join("<br>") };

    let m = q.match(/\b(?:day|d|din)\s*[#:-]?\s*(\d{1,2})\b/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 0 && n <= 50) {
        const info = dayInfo(n);
        return { text: "Ye lo Day " + n + ": " + (info && info.title) + " (" + (info && info.done) + ")", days: [n] };
      }
      return { text: "Day 0-50 ke beech koi number batao." };
    }

    m = q.match(/\b(?:week|hafta)\s*[:-]?\s*([1234])\b/i);
    if (m) {
      const w = parseInt(m[1], 10);
      const list = app.DAYS.filter(d => d.week === w);
      return { text: "🧱 Week " + w + " topics:\n" +
        list.map(d => "  D" + d.num + " — " + d.title + (app.isDone(d.num) ? " ✓" : "")).join("\n") +
        "\nKonsa din kholun?", days: list.map(d => d.num) };
    }

    for (const t of TOPICS) {
      if (t.k.test(q)) {
        return { text: "Ye topics hain: " + t.n.map(n => "Day " + n + " (" + dayInfo(n).title + ")").join(", ") + ".\nKholun? 👇", days: t.n };
      }
    }

    // fallback: fuzzy search titles
    const hits = app.DAYS.filter(d => (d.title + " " + d.short).toLowerCase().includes(q.toLowerCase())).slice(0, 3);
    if (hits.length)
      return { text: "Ho sakta hai ye chahte ho? 👇", days: hits.map(d => d.num) };

    return { text: "Hmm, wo samajh nahi paya. Ye try karo:", chips: ["day 5", "docker kya hai", "progress", "help"] };
  }

  function progressMsg() {
    const app = App();
    const p = app.getProgress();
    const total = 50;
    const done = p.filter(n => n >= 1 && n <= total).length;
    const cur = app.current();
    const next = app.nextUndone();
    const curText = cur >= 0 ? ("Abhi khola hai: Day " + cur) : "Abhi landing page pe ho";
    let s = "📈 Tumhara progress:\n   Complete: " + done + "/50 din (" + Math.round((done / total) * 100) + "%)\n" +
      "   " + curText + "\n" +
      "   Agla din: Day " + next + " — " + dayInfo(next).title + "\n";
    if (done === total) s += "\n🎉 Poora 50-day sheet complete! Aaj tum 5-saal experience level ke DevOps ho. Ab interviews + practice lab + apna portfolio. 🏆";
    else s += "\nChalu karein? 👇";
    return { text: s, days: [next] };
  }

  function handle(userText) {
    addMsg(userText, "user");
    const r = answer(userText);
    typing(() => {
      if (r.chips) addChips(r.chips, handle);
      if (r.text) addMsg(r.text, "bot");
      if (r.html) addHtml(r.html, "bot");
      if (r.days) addHtml(linkDots(r.days), "bot");
      scrollBottom();
    });
  }

  function send() {
    const v = $input().value.trim();
    if (!v) return;
    $input().value = "";
    document.getElementById("chatChips").innerHTML = "";
    handle(v);
  }

  document.getElementById("chatSend").addEventListener("click", send);
  $input().addEventListener("keydown", ev => { if (ev.key === "Enter") send(); });

  window.ChatBot = {
    _booted: false,
    start(preset) {
      const boot = () => {
        this._booted = true;
        typing(() => {
          addMsg(welcome.text, "bot");
          addChips(welcome.chips, handle);
          if (preset === "progress") {
            setTimeout(() => { document.getElementById("chatChips").innerHTML = ""; handle("progress"); }, 250);
          }
          scrollBottom();
        });
      };
      if (this._booted) {
        if (preset === "progress") handle("progress");
      } else {
        boot();
      }
    },
  };
})();