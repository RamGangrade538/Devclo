/* DevClo — Study Engine (offline)
   1) Flashcards   — spaced repetition (SM-2 lite) over content already written
   2) Quiz         — self-graded question sessions built from the same corpus
   3) Knowledge map — prerequisite/related graph over the 40 topic modules
   Every card is generated from the existing markdown + interviews.js.
   No network. State lives in localStorage under devclo-study-*. */
"use strict";

(function () {
  const SRS_KEY = "devclo-study-srs";
  const STATS_KEY = "devclo-study-stats";
  const DAY_MS = 86400000;
  const VER = 1;

  /* ---------------- utils ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /* very small markdown subset — safe because we escape first */
  function lite(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  }
  function read(key, fb) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; }
    catch (e) { return fb; }
  }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function now() { return Date.now(); }
  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function uid(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function md(file) {
    const C = window.DEVCLO_CONTENT;
    return (C && C[file]) ? C[file] : "";
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  /* ---------------- markdown section slicing ---------------- */
  const RE_H2 = /^##\s/;
  const RE_QUICK = /^##\s.*\bQuick Notes\b/i;
  const RE_NOTES2 = /^##\s+Notes\s*\|/;
  const RE_CONCEPTS = /^##\s.*Important Concepts/i;
  const RE_INTERVIEW = /^##\s.*Interview Corner/i;
  const RE_REVIEWQ = /^##\s.*Review Quiz/i;
  const RE_CHEAT = /^##\s.*Cheat-?Sheet/i;

  function section(file, headRe) {
    const L = String(md(file)).split(/\r?\n/);
    const out = [];
    let on = false;
    for (let i = 0; i < L.length; i++) {
      const ln = L[i];
      if (RE_H2.test(ln)) {
        if (on) break;
        if (headRe.test(ln)) on = true;
        continue;
      }
      if (on) out.push(ln);
    }
    return on ? out : null;
  }

  function bullets(lines) {
    const out = [];
    if (!lines) return out;
    for (let i = 0; i < lines.length; i++) {
      const m = String(lines[i]).match(/^\s*[-*]\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/);
      if (!m) continue;
      const t = m[1];
      if (!t) continue;
      if (/^\*\*|^\W+$/.test(t) === false && /^[-=*_]+$/.test(t)) continue;
      if (/^\*\*$/.test(t)) continue;
      out.push(t);
    }
    return out;
  }

  /* term = meaning  ->  two-sided card; otherwise a "recite this line" card */
  function noteCard(raw) {
    let s = String(raw || "").trim();
    s = s.replace(/^(?:[-*]\s+)?/, "").replace(/^\[[ xX]\]\s*/, "");
    s = s.replace(/\s*(?:\*\*|__)\s*$/, "").trim();
    const trimQ = function (x) {
      return x.replace(/^\*\*|\*\*$/g, "").replace(/^\*\*/g, "").replace(/\s*·\s*$/, "").trim();
    };
    let m = s.match(/^([^\s][^=—–]{1,58}?)\s*(?:=|—|–)\s+(.{2,})$/);
    if (m && trimQ(m[1]).length >= 2) return { q: trimQ(m[1]), a: m[2].trim() };
    m = s.match(/^([^\s][^=:—–]{0,58}?)\s*:\s+(.{2,})$/);
    if (m && trimQ(m[1]).length >= 2) return { q: trimQ(m[1]), a: m[2].trim() };
    m = s.match(/^\*\*([^*]{2,60}?)\*\*\s*(?:[—–-]\s*|:)?\s*(.+)$/);
    if (m && m[2].trim().length >= 2) return { q: m[1].trim(), a: m[2].trim() };
    return { q: s, a: "" };
  }

  /* cheat-sheet tables: | command | meaning | */
  function tableQA(lines) {
    const out = [];
    if (!lines) return out;
    for (let i = 0; i < lines.length; i++) {
      const t = String(lines[i]).trim();
      const m = t.match(/^\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/);
      if (!m) continue;
      const c1 = m[1].replace(/[`*]/g, "").trim();
      const c2 = m[2].replace(/[`*]/g, "").trim();
      if (!c1 || !c2) continue;
      if (/^[-: ]+$/.test(c1) || /^[-: ]+$/.test(c2)) continue;
      if (/[-:]{3,}/.test(c1) || /[-:]{3,}/.test(c2)) continue;
      if (/^(command|commands|term|concept|principle|phase|topic|tool|area|scenario|flag|parameter|keyword)$/i.test(c1)) continue;
      out.push({ q: c1, a: c2 });
    }
    return out;
  }

  /* every table in the file, fence-aware, split into {head, rows} */
  function tablesOf(file) {
    const L = String(md(file)).split(/\r?\n/);
    const out = [];
    let cur = null, fence = false;
    const close = () => { if (cur && cur.rows.length) out.push(cur); cur = null; };
    for (let i = 0; i < L.length; i++) {
      const raw = L[i];
      const t = raw.trim();
      if (/^```|~~~/.test(t)) { fence = !fence; continue; }
      if (fence) continue;
      if (!/^\|/.test(t)) { close(); continue; }
      const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) {
        return c.replace(/[`*]/g, "").trim();
      });
      if (cells.length < 2) { close(); continue; }
      if (cells.every(function (c) { return /^[-: ]*$/.test(c); })) continue;
      if (!cur) {
        if (cells.some(function (c) { return /^[-:]{3,}/.test(c); })) continue;
        cur = { head: cells, rows: [] };
      } else {
        cur.rows.push(cells);
      }
    }
    close();
    return out;
  }

  /* 2-col  ->  term -> meaning  (best case)
     3+col ->  "<header>: <label>" -> cell, once per comparison column */
  function allTableCards(file) {
    const out = [];
    tablesOf(file).forEach(function (tb) {
      const head = tb.head, rows = tb.rows;
      if (head.length === 2) {
        rows.forEach(function (r) {
          if (r.length < 2 || !r[0] || !r[1]) return;
          if (/^[-:]{3,}/.test(r[0]) || /^[-:]{3,}/.test(r[0])) return;
          out.push({ q: r[0], a: r[1] });
        });
        return;
      }
      if (head.length < 3) return;
      rows.forEach(function (r) {
        const label = r[0];
        if (!label || /^[-:]{3,}/.test(label)) return;
        for (let c = 1; c < head.length; c++) {
          const cell = r[c];
          if (!cell || /^[-:]{3,}/.test(cell)) continue;
          const h = (head[c] || "").replace(/:$/, "");
          if (!h) continue;
          out.push({ q: h + ": " + label, a: cell });
        }
      });
    });
    return out;
  }

  /* Interview Corner / Review Quiz — 6 different answer styles in the wild */
  function lookAhead(L, i) {
    for (let j = i + 1; j < L.length; j++) {
      const t = String(L[j]).trim();
      if (!t) continue;
      if (/^A:\s*/.test(t)) return t.replace(/^A:\s*/, "").trim();
      if (/^>\s?/.test(t)) {
        const buf = [];
        for (let k = j; k < L.length; k++) {
          const u = String(L[k]).trim();
          if (!/^>\s?/.test(u)) break;
          buf.push(u.replace(/^>\s?/, ""));
        }
        return buf.join(" ").replace(/\s+/g, " ").trim();
      }
      if (/^#{1,6}\s/.test(t) || /^---+$/.test(t) || /^\|/.test(t) || /^[-*]\s/.test(t)) return "";
      if (/^\*\*Q\d*\s*:/.test(t) || /^\d+\.\s/.test(t)) return "";
      return t;
    }
    return "";
  }
  function parseQA(lines) {
    const out = [];
    if (!lines) return out;
    for (let i = 0; i < lines.length; i++) {
      const ln = String(lines[i]);
      let m = ln.match(/^\s*(?:\d+\.\s*)?\*\*Q\d*:\s*(.+?)\*\*\s*(?:(?:—|–|-)\s*(.+?)|A:\s*(.+?))?\s*$/);
      if (m) {
        const q = m[1].trim();
        const a = (m[2] || m[3] || "").trim() || lookAhead(lines, i);
        if (q && a) out.push({ q: q, a: a });
        continue;
      }
      m = ln.match(/^\s*\d+\.\s+(.+?)\s*\*\(([^)]+)\)\*\s*$/);
      if (m) out.push({ q: m[1].trim(), a: m[2].trim() });
    }
    return out;
  }

  /* ---------------- corpus ---------------- */
  let _D = null;

  function decks() {
    if (_D) return _D;
    const A = window.App || {};
    const out = [];
    function usable(it) {
      const q = String(it.q || "").trim();
      if (q.length < 2) return false;
      if (/^\d+(\.\d+)*$/.test(q)) return false;                       // table index column
      if (/^[^A-Za-z0-9$#`/*&+-]+$/.test(q)) return false;              // punctuation only
      return true;
    }
    const push = function (d) {
      if (!d) return;
      const seen = {};
      d.items = d.items.filter(function (it) {
        if (!usable(it)) return false;
        const k = it.q + "\u0000" + (it.a || "");
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      });
      if (!d.items.length) return;
      d.items.forEach(function (it, i) { it.id = uid(d.id + "|" + i + "|" + it.q); });
      out.push(d);
    };
    function feed(items, file, opts) {
      opts = opts || {};
      if (opts.notes !== false) bullets(section(file, RE_QUICK)).concat(bullets(section(file, RE_NOTES2)))
        .forEach(function (b) { items.push(noteCard(b)); });
      if (opts.qa !== false) parseQA(section(file, RE_INTERVIEW)).concat(parseQA(section(file, RE_REVIEWQ)))
        .forEach(function (q) { items.push({ q: q.q, a: q.a }); });
      if (opts.tables !== false) tableQA(section(file, RE_CHEAT)).forEach(function (q) { items.push(q); });
      return items;
    }

    (A.DAYS || []).forEach(function (d) {
      const items = [];
      if (window.INTERVIEWS && window.INTERVIEWS[d.num]) {
        (window.INTERVIEWS[d.num] || []).forEach(function (q) {
          if (q && q.q) items.push({ q: q.q, a: q.a || "" });
        });
      }
      feed(items, d.file);
      push({ id: "day-" + d.num, group: "50-Day Track", icon: "📅", name: "Day " + d.num + " — " + d.title, file: d.file, items: items });
    });

    (A.EXP_DAYS || []).forEach(function (d) {
      const items = feed([], d.file);
      push({ id: "exp-" + d.n, group: "Detailed Days", icon: "📗", name: "Detailed Day " + d.n + " — " + d.title, file: d.file, items: items });
    });

    (A.TOPIC_MODULES || []).forEach(function (m) {
      const file = "modules/" + m.slug + ".md";
      const items = bullets(section(file, RE_CONCEPTS)).map(noteCard);
      feed(items, file, { notes: false, qa: false });
      push({ id: "mod-" + m.slug, group: "Topic Modules", icon: m.emoji || "🧩", name: m.title, file: file, items: items });
    });

    (A.TOPICS || []).forEach(function (t) {
      const items = feed([], t.file, { notes: false, qa: false });
      items.push.apply(items, allTableCards(t.file));
      push({ id: "topic-" + t.slug, group: "Deep Dives", icon: "📚", name: t.title, file: t.file, items: items });
    });

    const tricks = (window.TRICKS || []).map(function (t) { return { q: t.q, a: t.a || "" }; });
    if (tricks.length) push({ id: "tricky", group: "Global", icon: "🧩", name: "Tricky Interview Bank", items: tricks });

    _D = out;
    return out;
  }

  function deckById(id) {
    const all = decks();
    for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function allItems() {
    const out = [];
    decks().forEach(function (d) {
      d.items.forEach(function (it) { out.push({ id: it.id, q: it.q, a: it.a, deck: d.name }); });
    });
    return out;
  }

  /* ---------------- spaced repetition ---------------- */
  function srs() { return read(SRS_KEY, {}); }
  function st(id) { return srs()[id] || null; }

  function grade(id, rating) {
    const all = srs();
    const cur = all[id] || { ease: 2.5, reps: 0, lapses: 0, iv: 0 };
    let ease = cur.ease, reps = cur.reps, lapses = cur.lapses, iv = cur.iv;
    if (rating === 0) { ease = Math.max(1.3, ease - 0.2); iv = 0; lapses++; reps = 0; }
    else if (rating === 1) { ease = Math.max(1.3, ease - 0.15); iv = iv ? Math.max(1, Math.round(iv * 1.2)) : 1; reps++; }
    else if (rating === 2) { iv = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(1, Math.round(iv * ease)); reps++; }
    else { ease = Math.min(2.9, ease + 0.15); iv = reps === 0 ? 3 : Math.max(1, Math.round(iv * ease * 1.3)); reps++; }
    all[id] = { ease: ease, reps: reps, lapses: lapses, iv: iv, due: now() + (rating === 0 ? 6e5 : iv * DAY_MS), last: now() };
    write(SRS_KEY, all);
    bump(rating >= 2 ? "cardsKnown" : "cardsMissed");
    bump("cardsReviewed");
  }

  function deckProgress(d) {
    const all = srs(), t = now();
    let due = 0, known = 0, seen = 0;
    d.items.forEach(function (it) {
      const s = all[it.id];
      if (!s) { due++; return; }
      seen++;
      if (s.iv >= 3) known++;
      if (s.due <= t) due++;
    });
    return { due: due, known: known, seen: seen, total: d.items.length };
  }
  function overall() {
    const all = srs(), t = now();
    let total = 0, known = 0, due = 0;
    decks().forEach(function (d) {
      d.items.forEach(function (it) {
        total++;
        const s = all[it.id];
        if (!s) { due++; return; }
        if (s.iv >= 3) known++;
        if (s.due <= t) due++;
      });
    });
    return { total: total, known: known, due: due, pct: total ? Math.round(known / total * 100) : 0 };
  }

  /* ---------------- stats ---------------- */
  function stats() {
    const s = read(STATS_KEY, null);
    if (s && s.v) return s;
    return { v: VER, cardsReviewed: 0, cardsKnown: 0, cardsMissed: 0, quizAsked: 0, quizKnown: 0, sessions: 0, streak: 0, lastDay: "" };
  }
  function bump(key) {
    const s = stats();
    const d = todayKey();
    if (s.lastDay !== d) {
      const y = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
      s.streak = s.lastDay === y ? (s.streak || 0) + 1 : 1;
      s.lastDay = d;
    }
    s[key] = (s[key] || 0) + 1;
    write(STATS_KEY, s);
  }

  /* ---------------- export / import ---------------- */
  function exportJSON() {
    const out = { app: "DevClo", version: VER, at: new Date().toISOString(), data: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("devclo-") === 0) out.data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devclo-backup-" + todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function importJSON() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.addEventListener("change", function () {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = function () {
        let obj;
        try { obj = JSON.parse(String(fr.result)); } catch (e) { return alert("❌ Ye valid JSON file nahi hai."); }
        if (!obj || !obj.data) return alert("❌ Backup file ka format theek nahi hai.");
        if (!confirm("Ye backup import karega? (current progress usse replace ho jayega)")) return;
        const keys = Object.keys(obj.data);
        keys.forEach(function (k) {
          if (k.indexOf("devclo-") === 0) localStorage.setItem(k, obj.data[k]);
        });
        alert("✅ " + keys.length + " keys import ho gayi — page reload ho raha hai…");
        setTimeout(function () { location.reload(); }, 900);
      };
      fr.readAsText(f);
    });
    inp.click();
  }

  /* ---------------- shared chrome ---------------- */
  function head(root, title, sub, right) {
    root.innerHTML =
      '<div class="st-page">' +
        '<div class="st-toolbar" style="margin-top:0">' +
          '<button class="st-btn ghost" data-back="1">← Home</button>' +
          '<h1 class="st-h1" style="margin:0;flex:1">' + title + "</h1>" +
          '<div class="st-actions" style="margin:0">' + (right || "") + "</div>" +
        "</div>" +
        (sub ? '<p class="st-sub">' + sub + "</p>" : "") +
        '<div id="stBody"></div>' +
      "</div>";
    const b = $('[data-back]', root);
    if (b) b.addEventListener("click", function () { window.App.loadStart(); });
    return $("#stBody", root);
  }
  function statPill(n, l) {
    return '<span class="st-stat"><span class="st-stat-n">' + n + '</span><span class="st-stat-l">' + l + "</span></span>";
  }

  /* ---------------- 1) HUB ---------------- */
  function hub(root) {
    const ov = overall();
    const s = stats();
    const body = head(root, "🧠 Study Room", "Yahi se flashcards, quizzes aur knowledge map — sab kuch aapke likhe hue content se banta hai, offline.");
    const d = decks();
    const totalQ = allItems().length;
    body.innerHTML =
      '<div class="st-hub-grid">' +
        tile("🎴", "Flashcards", plural(d.length, "deck", "decks") + " · " + totalQ + " cards · " + ov.due + " due abhi", "cards") +
        tile("📝", "Quiz", "Self-graded sessions · " + (s.quizAsked || 0) + " sawal poochhe", "quiz") +
        tile("🕸️", "Knowledge Map", "40 modules + unke prereq/related links", "graph") +
      "</div>" +
      '<h2 class="st-h2">Tumhara progress</h2>' +
      '<div class="st-stats">' +
        statPill(ov.known + "/" + ov.total, "cards mastered") +
        statPill(ov.due, "due now") +
        statPill(ov.pct + "%", "retention") +
        statPill(s.streak || 0, "day streak") +
        statPill(s.cardsReviewed || 0, "cards reviewed") +
        statPill(s.quizKnown || 0, "quiz correct") +
      "</div>" +
      '<div class="st-bar" style="margin:12px 0 22px"><i style="width:' + Math.max(ov.pct, 2) + '%"></i></div>' +
      '<h2 class="st-h2">Backup</h2>' +
      '<p class="st-note" style="margin-bottom:10px">Saara progress browser ke localStorage me hai — cache clear karne se uda sakta hai. Kabhi kabhi export kar lo.</p>' +
      '<div class="st-toolbar">' +
        '<button class="st-btn" data-x="1">⬇️ Export backup (JSON)</button>' +
        '<button class="st-btn" data-x="2">⬆️ Import backup</button>' +
        '<span class="st-sep"></span>' +
        '<button class="st-btn danger" data-x="3">♻️ Reset study data</button>' +
      "</div>";

    $$("[data-k]", body).forEach(function (b) {
      b.addEventListener("click", function () { window.App.loadStudyPage(b.getAttribute("data-k")); });
    });
    $$("[data-x]", body).forEach(function (b) {
      b.addEventListener("click", function () {
        const a = b.getAttribute("data-x");
        if (a === "1") exportJSON();
        else if (a === "2") importJSON();
        else if (confirm("Flashcards + quiz ka saara progress delete karna hai? (course progress safe rahega)")) {
          localStorage.removeItem(SRS_KEY);
          localStorage.removeItem(STATS_KEY);
          _D = null;
          hub(root);
        }
      });
    });
  }
  function tile(ico, t, s, k) {
    return '<button class="st-tile" data-k="' + k + '">' +
      '<span class="st-tile-ico">' + ico + "</span>" +
      '<span class="st-tile-t">' + t + "</span>" +
      '<span class="st-tile-s">' + s + "</span></button>";
  }

  /* ---------------- 2) FLASHCARDS ---------------- */
  let session = null;

  function cards(root, wantId) {
    const d = decks();
    if (!d.length) return (root.innerHTML = '<div class="st-empty">Koi content load nahi hua.</div>');
    const body = head(root, "🎴 Flashcards", "Quick Notes, cheat-sheet tables aur interview Q&A se bane cards. Click card → answer. Phir Again / Hard / Good / Easy choose karo — weak cards jaldi wapas aayenge.");

    const first = wantId && deckById(wantId) ? wantId : (d[0] && d[0].id);
    body.innerHTML =
      '<div class="st-cards">' +
        '<div><div class="st-toolbar" style="margin:0 0 8px">' +
          '<input class="st-input" id="deckQ" placeholder="Deck filter…" style="flex:1">' +
        "</div>" +
        '<div class="st-decks" id="deckList"></div></div>' +
        '<div class="st-study" id="study"></div>' +
      "</div>";

    const list = $("#deckList", body);
    const study = $("#study", body);

    function renderList() {
      const q = ($("#deckQ", body).value || "").trim().toLowerCase();
      const groups = [];
      d.forEach(function (dk) {
        if (q && (dk.name + " " + dk.group).toLowerCase().indexOf(q) < 0) return;
        let g = null;
        for (let i = 0; i < groups.length; i++) if (groups[i].name === dk.group) g = groups[i];
        if (!g) { g = { name: dk.group, items: [] }; groups.push(g); }
        g.items.push(dk);
      });
      list.innerHTML = groups.map(function (g) {
        return '<div class="st-deck-group">' + esc(g.name) + "</div>" + g.items.map(function (dk) {
          const p = deckProgress(dk);
          return '<button class="st-deck' + (dk.id === sessionDeckId(dk) ? " active" : "") + (p.due ? " due" : "") + '" data-id="' + dk.id + '">' +
            '<span class="st-deck-t">' + dk.icon + " " + esc(dk.name) + "</span>" +
            '<span class="st-deck-s">' + p.total + " cards · " + (p.due ? p.due + " due" : p.known + " mastered") + "</span></button>";
        }).join("");
      }).join("") || '<div class="st-empty">Koi deck nahi mila.</div>';
      $$(".st-deck", list).forEach(function (b) {
        b.addEventListener("click", function () { startDeck(b.getAttribute("data-id")); });
      });
    }
    function sessionDeckId(dk) { return session && session.deckId === dk.id ? dk.id : null; }

    function startDeck(id) {
      const dk = deckById(id);
      if (!dk) return;
      const p = deckProgress(dk);
      let pool = dk.items.filter(function (it) {
        const s = st(it.id);
        return !s || s.due <= now();
      });
      if (!pool.length) pool = shuffle(dk.items).slice(0, 12);
      session = { deckId: id, deck: dk, queue: shuffle(pool).slice(0, 20), i: 0, flipped: false, known: 0, missed: 0 };
      renderList();
      paint();
    }

    function paint() {
      if (!session) { study.innerHTML = '<div class="st-empty">Left side se ek deck choose karo →</div>'; return; }
      const s = session;
      if (s.i >= s.queue.length) {
        const total = s.known + s.missed;
        const pct = total ? Math.round(s.known / total * 100) : 0;
        bump("sessions");
        study.innerHTML =
          '<div class="st-result">' +
            '<div class="st-score">' + pct + "%</div>" +
            '<div class="st-verdict">' + (pct >= 85 ? "🔥 Mast! Concept pakka hai." : pct >= 60 ? "👍 Theek hai — weak cards dobara." : "💪 Thoda aur — notes ek baar phir padho.") + "</div>" +
            '<p class="st-sub">' + s.deck.name + " · " + total + " cards · " + s.known + " yaad · " + s.missed + " weak</p>" +
            '<div class="st-actions">' +
              '<button class="st-btn pri" data-again="1">🔁 Dobara isi deck se</button>' +
              '<button class="st-btn" data-backhub="1">🧠 Study Room</button>' +
            "</div></div>";
        $("[data-again]", study).addEventListener("click", function () { startDeck(s.deckId); });
        $("[data-backhub]", study).addEventListener("click", function () { window.App.loadStudyPage("hub"); });
        return;
      }
      const it = s.queue[s.i];
      const hasA = !!it.a;
      study.innerHTML =
        '<div class="st-study-top">' +
          '<span class="st-counter">' + (s.i + 1) + " / " + s.queue.length + "</span>" +
          '<span class="st-counter">' + esc(s.deck.name) + "</span>" +
          '<span class="st-counter">' + s.known + " ✅ · " + s.missed + " 🔁</span>" +
        "</div>" +
        '<div class="st-bar" style="margin-bottom:14px"><i style="width:' + Math.round(s.i / s.queue.length * 100) + '%"></i></div>' +
        '<div class="st-card' + (s.flipped && hasA ? "" : " a-empty") + '" id="flipCard">' +
          '<span class="st-card-tag">' + (s.flipped && hasA ? "Answer" : "Question") + "</span>" +
          '<div class="st-card-q">' + lite(it.q) + "</div>" +
          (s.flipped && hasA ? '<div class="st-card-a">' + lite(it.a) + "</div>" : '<span class="st-card-hint">' + (hasA ? "click to reveal answer" : "apne words me yaad karo — koi answer text nahi") + "</span>") +
        "</div>" +
        (s.flipped
          ? '<div class="st-actions">' +
              '<button class="st-btn g" data-r="0">Again</button>' +
              '<button class="st-btn y" data-r="1">Hard</button>' +
              '<button class="st-btn b" data-r="2">Good</button>' +
              '<button class="st-btn n" data-r="3">Easy</button>' +
            "</div>"
          : '<div class="st-actions"><button class="st-btn pri" data-show="1">' + (hasA ? "👁️ Answer dikhao" : "✓ Samajh gaya, next") + "</button></div>") +
        '<div class="st-hint-sm">card pe click = flip · <kbd>Space</kbd> next · <kbd>1</kbd>-<kbd>4</kbd> grade</div>';

      $("#flipCard", study).addEventListener("click", function () {
        if (!hasA) return;
        s.flipped = !s.flipped;
        paint();
      });
      const sh = $("[data-show]", study);
      if (sh) sh.addEventListener("click", function () {
        if (!hasA) { grade(it.id, 3); s.known++; s.i++; s.flipped = false; paint(); return; }
        s.flipped = true;
        paint();
      });
      $$("[data-r]", study).forEach(function (b) {
        b.addEventListener("click", function () {
          const r = parseInt(b.getAttribute("data-r"), 10);
          grade(it.id, r);
          if (r >= 2) s.known++; else s.missed++;
          s.i++;
          s.flipped = false;
          paint();
        });
      });
    }

    const qInp = $("#deckQ", body);
    qInp.addEventListener("input", renderList);
    renderList();
    startDeck(first);

    root._cardsKey = function (ev) {
      if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      if (!session || session.i >= session.queue.length) return;
      const it = session.queue[session.i];
      const hasA = !!it.a;
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        if (!hasA || !session.flipped) { if (hasA) session.flipped = true; else { grade(it.id, 3); session.known++; session.i++; } paint(); }
        return;
      }
      if (session.flipped && ["1", "2", "3", "4"].indexOf(ev.key) >= 0) {
        const r = parseInt(ev.key, 10) - 1;
        grade(it.id, r);
        if (r >= 2) session.known++; else session.missed++;
        session.i++; session.flipped = false;
        paint();
      }
    };
  }

  /* ---------------- 3) QUIZ ---------------- */
  function quiz(root, opt) {
    opt = opt || {};
    const d = decks();
    const body = head(root, "📝 Quiz", "Sawaal pehle padho, dimag me jawab banao, phir \"Answer dekho\" dabao. Khud ko honestly grade karo — hi score yahi rakhta hai.");
    if (!d.length) return (body.innerHTML = '<div class="st-empty">Quiz content load nahi hua.</div>');

    function setup(keepQ) {
      const s = stats();
      const q = keepQ || ($("#quizQ", body) ? $("#quizQ", body).value : "") || "";
      const picked = opt.deck || "";
      const pool = d.filter(function (dk) {
        return !q || (dk.name + " " + dk.group).toLowerCase().indexOf(q.toLowerCase()) >= 0;
      });
      body.innerHTML =
        '<div class="st-toolbar">' +
          '<input class="st-input" id="quizQ" placeholder="Topic filter — e.g. docker, Day 12, linux" value="' + esc(q) + '" style="flex:1;min-width:180px">' +
          '<button class="st-btn pri" id="quizStart">▶️ Shuru karo</button>' +
        "</div>" +
        '<div class="st-chips" id="quizChips"></div>' +
        '<h2 class="st-h2">Ya seedha pick karo</h2>' +
        '<div class="st-chips">' +
          (picked ? '<button class="st-chip ok" data-pick="' + esc(picked) + '">✓ ' + esc((deckById(picked) || {}).name || picked) + "</button>" : "") +
          pool.slice(0, 90).map(function (dk) {
            const n = dk.items.length;
            return '<button class="st-chip" data-pick="' + dk.id + '">' + dk.icon + " " + esc(dk.name) + " <span class='st-note'>" + n + "</span></button>";
          }).join("") +
        "</div>" +
        '<p class="st-note" style="margin-top:14px">Total ' + allItems().length + " questions available · tumne " + (s.quizAsked || 0) + " poochhe hain, " + (s.quizKnown || 0) + " sahi.</p>";

      $("#quizStart", body).addEventListener("click", function () {
        const pickedId = $(".st-chip.ok", body);
        const id = pickedId ? pickedId.getAttribute("data-pick") : "";
        if (id) return run(deckById(id).items.map(function (i) { return { q: i.q, a: i.a, src: deckById(id).name }; }));
        const list = [];
        const matches = pool.length ? pool : d;
        matches.forEach(function (dk) {
          shuffle(dk.items).slice(0, 3).forEach(function (i) { list.push({ q: i.q, a: i.a, src: dk.name }); });
        });
        run(shuffle(list).slice(0, 10));
      });
      $$("[data-pick]", body).forEach(function (b) {
        b.addEventListener("click", function () {
          opt.deck = b.getAttribute("data-pick");
          setup($("#quizQ", body).value);
        });
      });
      const qi = $("#quizQ", body);
      qi.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); $("#quizStart", body).click(); } });
    }

    function run(list) {
      const qs = shuffle(list).slice(0, 20);
      if (!qs.length) return;
      let i = 0, ok = 0, wrong = [];
      paint();

      function paint() {
        if (i >= qs.length) return result();
        const it = qs[i];
        body.innerHTML =
          '<div class="st-quiz">' +
            '<div class="st-qbar"><i style="width:' + Math.round(i / qs.length * 100) + '%"></i></div>' +
            '<div class="st-qmeta"><span>Question ' + (i + 1) + " of " + qs.length + "</span><span>✅ " + ok + " · ❌ " + wrong.length + " · " + esc(it.src || "") + "</span></div>" +
            '<div class="st-qbox">' +
              '<div class="st-q">' + lite(it.q) + "</div>" +
              '<div id="qAnsWrap"></div>' +
            "</div>" +
            '<div class="st-actions left" id="qBtns"></div>' +
          "</div>";
        $("#qBtns", body).innerHTML =
          '<button class="st-btn pri" id="qShow">👁️ Answer dekho</button>' +
          '<button class="st-btn ghost" id="qSkip">⏭️ Skip</button>';
        $("#qShow", body).addEventListener("click", function () {
          $("#qAnsWrap", body).innerHTML = it.a ? '<div class="st-qa">' + lite(it.a) + "</div>" : '<div class="st-qa">Ye line apne words me likh ke practice karo (source me answer text nahi).</div>';
          $("#qBtns", body).innerHTML =
            '<button class="st-btn g" data-ok="0">❌ Nahi aata</button>' +
            '<button class="st-btn b" data-ok="1">✅ Yaad tha</button>';
          $$("[data-ok]", body).forEach(function (b) {
            b.addEventListener("click", function () {
              const good = b.getAttribute("data-ok") === "1";
              bump("quizAsked");
              if (good) ok++; else wrong.push(it);
              i++;
              paint();
            });
          });
        });
        $("#qSkip", body).addEventListener("click", function () { i++; paint(); });
      }

      function result() {
        bump("sessions");
        const total = ok + wrong.length;
        const pct = total ? Math.round(ok / total * 100) : 0;
        body.innerHTML =
          '<div class="st-quiz">' +
            '<div class="st-qbox st-result">' +
              '<div class="st-score">' + pct + "%</div>" +
              '<div class="st-verdict">' + (pct >= 85 ? "🔥 Solid — interview ready." : pct >= 60 ? "👍 Basis ban raha hai, weak ones dobara." : "💪 Notes dobara padho — ye topic weak hai.") + "</div>" +
              '<p class="st-sub">' + ok + " sahi · " + wrong.length + " galat · " + total + " total</p>" +
              '<div class="st-actions">' +
                (wrong.length ? '<button class="st-btn pri" id="qRetry">🔁 Galat wapas</button>' : "") +
                '<button class="st-btn" id="qNew">🎲 Naya session</button>' +
                '<button class="st-btn ghost" id="qSetup">☰ Choose another</button>' +
              "</div>" +
            "</div>" +
            (wrong.length ? '<h2 class="st-h2">Ye abhi weak hain</h2><div class="st-wrong">' + wrong.map(function (w) {
              return '<div class="st-wrong-item"><div class="st-wrong-q">' + lite(w.q) + "</div>" +
                (w.a ? '<div class="st-wrong-a">' + lite(w.a) + "</div>" : "") + "</div>";
            }).join("") + "</div>" : '<div class="st-empty" style="margin-top:18px">🎉 Sab sahi — koi weak question nahi.</div>') +
          "</div>";
        const rt = $("#qRetry", body);
        if (rt) rt.addEventListener("click", function () { run(wrong); });
        $("#qNew", body).addEventListener("click", function () { opt.deck = ""; setup(""); });
        $("#qSetup", body).addEventListener("click", function () { opt.deck = ""; setup($("#quizQ", body) ? $("#quizQ", body).value : ""); });
      }
    }
    setup(opt.q || "");
  }

  /* ---------------- 4) KNOWLEDGE MAP ---------------- */
  let GMAP = null;
  function gmap() {
    if (GMAP) return GMAP;
    const A = window.App || {};
    const mods = A.TOPIC_MODULES || [];
    const pct = {}, title = {}, emoji = {}, byslug = {};
    mods.forEach(function (m) { pct[m.slug] = A.modulePct ? A.modulePct(m.slug) : 0; title[m.slug] = m.title; emoji[m.slug] = m.emoji || "•"; byslug[m.slug] = m; });
    const nb = {};
    mods.forEach(function (m) { nb[m.slug] = {}; });
    mods.forEach(function (m) {
      const src = md("modules/" + m.slug + ".md");
      const re = /\]\(\.\.\/modules\/([A-Za-z0-9._-]+)\.md\)/g;
      let x;
      while ((x = re.exec(src))) {
        const s = x[1].toLowerCase();
        if (s === m.slug || !byslug[s]) continue;
        nb[m.slug][s] = 1;
        nb[s][m.slug] = 1;
      }
    });
    const days = {};
    mods.forEach(function (m) {
      const src = md("modules/" + m.slug + ".md");
      const re = /\]\(\.\.\/(day-[0-9]{2}-[A-Za-z0-9._-]+)\.md\)/g;
      const set = {};
      let x;
      while ((x = re.exec(src))) set[x[1]] = 1;
      days[m.slug] = Object.keys(set);
    });
    GMAP = { mods: mods, pct: pct, title: title, emoji: emoji, nb: nb, days: days };
    return GMAP;
  }

  function nodeId(slug) { return "n_" + slug.replace(/[^a-z0-9]+/gi, "_"); }

  function graph(root, want) {
    const g = gmap();
    const body = head(root, "🕸️ Knowledge Map", "Har module ka apna 'Related Topics' se pata chalta hai kaun pehle aana chahiye. Green = aapne 100% kiya, red = koi neighbour abhi weak hai.");
    if (!g.mods.length) return (body.innerHTML = '<div class="st-empty">Modules load nahi hue.</div>');

    const pick = want && g.pct[want] !== undefined ? want : (g.mods[0] && g.mods[0].slug);
    body.innerHTML =
      '<div class="st-graph">' +
        '<div><div class="st-toolbar" style="margin:0 0 8px"><input class="st-input" id="gQ" placeholder="Module filter…" style="flex:1"></div><div class="st-mods" id="modList"></div></div>' +
        '<div class="st-canvas" id="canvas"></div>' +
      "</div>";

    const list = $("#modList", body);
    const canvas = $("#canvas", body);
    let cur = pick;

    function stats4(slug) {
      const nbs = Object.keys(g.nb[slug] || {});
      const weak = nbs.filter(function (s) { return g.pct[s] < 100; });
      return { nbs: nbs, weak: weak };
    }

    function renderList() {
      const q = ($("#gQ", body).value || "").trim().toLowerCase();
      const rows = g.mods.filter(function (m) {
        return !q || (m.title + " " + m.slug).toLowerCase().indexOf(q) >= 0;
      }).map(function (m) {
        const s = stats4(m.slug);
        const p = g.pct[m.slug];
        const cls = m.slug === cur ? " active" : (p >= 100 ? "" : (s.weak.length ? " blocked" : " ready"));
        const sub = p >= 100 ? "✓ 100% mastered" : (s.weak.length ? "pehle: " + s.weak.slice(0, 2).map(function (x) { return g.title[x]; }).join(", ") : (p > 0 ? p + "% · koi blocker nahi" : "ready to start"));
        return '<button class="st-mod' + cls + '" data-slug="' + m.slug + '">' +
          '<span class="st-mod-t">' + g.emoji[m.slug] + " " + esc(m.title) + "</span>" +
          '<span class="st-mod-s">' + esc(sub) + "</span>" +
          '<span class="st-mod-bar"><i style="width:' + Math.max(p, 2) + '%"></i></span></button>';
      });
      list.innerHTML = rows.join("") || '<div class="st-empty">Koi module nahi mila.</div>';
      $$(".st-mod", list).forEach(function (b) {
        b.addEventListener("click", function () { cur = b.getAttribute("data-slug"); renderList(); paint(); });
      });
    }


    function paint() {
      const slug = cur;
      if (!slug) return;
      const p = g.pct[slug];
      const s = stats4(slug);
      const done = s.nbs.filter(function (x) { return g.pct[x] >= 100; });
      const cls = function (x) {
        if (x === slug) return "cur";
        return g.pct[x] >= 100 ? "ok" : "bad";
      };

      const lines = [];
      lines.push("graph TD");
      lines.push('  ' + nodeId(slug) + '["' + g.emoji[slug] + " " + g.title[slug].replace(/"/g, "") + '"]:::' + cls(slug));
      (g.nb[slug] ? Object.keys(g.nb[slug]) : []).forEach(function (x) {
        lines.push("  " + nodeId(x) + '["' + (g.title[x] || x).replace(/"/g, "") + '"]:::' + cls(x));
        lines.push("  " + nodeId(slug) + " --- " + nodeId(x));
      });
      lines.push("  classDef ok fill:#e6f6ee,stroke:#059669,color:#054d38;");
      lines.push("  classDef bad fill:#fdeaea,stroke:#dc2626,color:#7a1616;");
      lines.push("  classDef cur fill:#e3f0fb,stroke:#0369a1,color:#0a3d5c,stroke-width:3px;");

      const dayChips = (g.days[slug] || []).map(function (f) {
        const base = f.replace(/\.md$/, "");
        const n = parseInt(base.slice(4, 6), 10);
        const d = (window.App.DAYS || []).filter(function (x) { return x.num === n; })[0];
        const doneDay = d && window.App.isDone ? window.App.isDone(n) : false;
        return '<button class="st-chip' + (doneDay ? " ok" : " bad") + '" data-day="' + n + '">' + (doneDay ? "✓ " : "○ ") + "Day " + n + (d ? " — " + esc(d.title) : "") + "</button>";
      }).join("");

      canvas.innerHTML =
        '<div class="st-toolbar" style="margin-top:0">' +
          '<span class="st-chip ok">📘 Module</span>' +
          '<button class="st-btn" data-open="1">📖 Padho →</button>' +
          (window.App.loadStudyPage ? '<button class="st-btn" data-cards="1">🎴 Is module ke cards</button>' : "") +
        "</div>" +
        '<h2 class="st-h2" style="margin-top:14px">' + g.emoji[slug] + " " + esc(g.title[slug]) + "</h2>" +
        '<div class="st-stats">' +
          statPill(p + "%", "module done") +
          statPill(s.nbs.length, "linked topics") +
          statPill(done.length + "/" + s.nbs.length, "neighbours ready") +
        "</div>" +
        '<div class="st-legend">' +
          '<span><span class="st-lg cur"></span> ye module</span>' +
          '<span><span class="st-lg ok"></span> 100% done</span>' +
          '<span><span class="st-lg bad"></span> abhi weak</span>' +
        "</div>" +
        '<div class="mermaid">' + lines.join("\n") + "</div>" +
        (s.nbs.length ? '<h2 class="st-h2">Related modules</h2><div class="st-neigh">' +
          s.nbs.map(function (x) {
            return '<button class="st-chip ' + (g.pct[x] >= 100 ? "ok" : "bad") + '" data-go="' + x + '">' + (g.pct[x] >= 100 ? "✓ " : "○ ") + esc(g.title[x]) + " · " + g.pct[x] + "%</button>";
          }).join("") + "</div>" : "") +
        (dayChips ? '<h2 class="st-h2">Is module ke days</h2><div class="st-neigh">' + dayChips + "</div>" : "");

      $("[data-open]", canvas).addEventListener("click", function () {
        window.App.loadModule(slug);
      });
      const cb = $("[data-cards]", canvas);
      if (cb) cb.addEventListener("click", function () { window.App.loadStudyPage("cards", "mod-" + slug); });
      $$("[data-go]", canvas).forEach(function (b) {
        b.addEventListener("click", function () { cur = b.getAttribute("data-go"); renderList(); paint(); });
      });
      $$("[data-day]", canvas).forEach(function (b) {
        b.addEventListener("click", function () { window.App.loadDay(parseInt(b.getAttribute("data-day"), 10)); });
      });
      if (window.mermaid) {
        try {
          window.mermaid.initialize({ startOnLoad: false, theme: "light", securityLevel: "loose" });
          window.mermaid.run({ nodes: $$(".mermaid", canvas) });
        } catch (e) { /* graph is decorative — never block the page */ }
      }
    }

    $("#gQ", body).addEventListener("input", renderList);
    renderList();
    paint();
  }

  window.Study = {
    hub: hub,
    cards: cards,
    quiz: quiz,
    graph: graph,
    decks: decks,
    overall: overall,
    stats: stats,
    exportJSON: exportJSON,
    importJSON: importJSON,
    rebuild: function () { _D = null; GMAP = null; },
  };
})();
