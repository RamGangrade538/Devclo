#!/usr/bin/env node
/* DevClo local diagram generator: builds offline SVG assets for every
   image referenced in the markdown (previously hot-linked, now broken
   offline) and rewrites the md references to local assets/img/*.svg. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMG = path.join(ROOT, "web", "assets", "img");
fs.mkdirSync(IMG, { recursive: true });

const W = 860, PADX = 30, PADT = 62, GAP = 48, NOTEH = 24, BOT = 22;

function svg(d) {
  const boxH = d.rows.some(r => r.some(b => b.s)) ? 66 : 52;
  const H = PADT + d.rows.length * boxH + (d.rows.length - 1) * GAP + (d.note ? NOTEH + 6 : 0) + BOT;
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" style="background:#fbfbfc;border:1px solid #e6e8ef;border-radius:12px;font-family:'Inter','Segoe UI',system-ui,sans-serif" role="img" aria-label="${(d.aria||d.title).replace(/"/g,"'")}">`);
  parts.push(`<rect width="${W}" height="${H}" fill="#fbfbfc"/>`);
  parts.push(`<text x="${PADX}" y="26" font-size="19" font-weight="800" fill="#0f172a">${d.title}</text>`);
  parts.push(`<text x="${PADX}" y="46" font-size="12.5" fill="#64748b">${d.sub}</text>`);
  parts.push(`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker></defs>`);

  const rows = d.rows.map((row, ri) => {
    const y = PADT + ri * (boxH + GAP);
    const n = row.length;
    return row.map((b, bi) => {
      const single = n === 1 && (b.big || row.length === 1);
      const w = single ? W - PADX * 2
                       : Math.min(360, (W - PADX * 2 - 16 * (n - 1)) / n);
      const x = single ? PADX : PADX + (W - PADX * 2 - (w * n + 16 * (n - 1))) / 2 + bi * (w + 16);
      const cy = y + boxH / 2;
      const last = ri === d.rows.length - 1;
      const fill = last ? "#ecfdf5" : (b.m ? "#fef3c7" : "#eef2ff");
      const stroke = last ? "#10b981" : (b.m ? "#f59e0b" : "#6366f1");
      return { x, y, w, cy, fill, stroke, b, single };
    });
  });

  // arrows
  const tops = rows.map(r => r[0].y);
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    const x1 = a.length === 1 ? a[0].x + a[0].w / 2 : (a.length > b.length ? a[Math.floor(a.length / 2)].x + a[Math.floor(a.length / 2)].w / 2 : a[0].x + a[0].w / 2);
    const x2 = b.length === 1 ? b[0].x + b[0].w / 2 : (b.length > a.length ? b[Math.floor(b.length / 2)].x + b[Math.floor(b.length / 2)].w / 2 : b[0].x + b[0].w / 2);
    const y1 = a[0].y + boxH, y2 = b[0].y;
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#ah)"/>`);
    if (d.labels && d.labels[i]) {
      parts.push(`<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-size="10.5" fill="#475569">${d.labels[i]}</text>`);
    }
  }
  // fan rows (single box in prev, many in next, or control->pool)
  rows.forEach((r, ri) => {
    if (ri === rows.length - 1) return;
    const nx = rows[ri + 1];
    if (r.length === 1 && nx.length > 1) {
      const sx = r[0].x + r[0].w / 2, sy = r[0].y + boxH;
      nx.forEach(b => {
        parts.push(`<line x1="${sx}" y1="${sy}" x2="${b.x + b.w / 2}" y2="${b.y}" stroke="#94a3b8" stroke-width="1.6" marker-end="url(#ah)"/>`);
      });
    } else if (r.length > 1 && nx.length === 1) {
      const ex = nx[0].x, ey = nx[0].y;
      r.forEach(b => {
        parts.push(`<line x1="${b.x + b.w / 2}" y1="${b.y + boxH}" x2="${ex + 20}" y2="${ey}" stroke="#94a3b8" stroke-width="1.6" marker-end="url(#ah)"/>`);
      });
    }
  });

  rows.forEach(r => r.forEach(bx => {
    parts.push(`<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${boxH}" rx="11" fill="${bx.fill}" stroke="${bx.stroke}" stroke-width="1.6"/>`);
    const ty = bx.y + (bx.b.s ? boxH / 2 - 3 : boxH / 2 + 4);
    parts.push(`<text x="${bx.x + bx.w / 2}" y="${ty}" text-anchor="middle" font-size="13.5" font-weight="700" fill="#1e293b">${bx.b.t}</text>`);
    if (bx.b.s) parts.push(`<text x="${bx.x + bx.w / 2}" y="${bx.y + boxH / 2 + 17}" text-anchor="middle" font-size="10.5" fill="#64748b">${bx.b.s}</text>`);
  }));

  if (d.note) parts.push(`<text x="${PADX}" y="${H - BOT + 2}" font-size="11.5" fill="#64748b">${d.note}</text>`);
  parts.push("</svg>");
  return parts.join("\n");
}

const DIAG = {
  "docker-architecture": {
    title: "Docker Architecture", sub: "Client-server model: CLI → daemon → containers",
    rows: [
      [{ t: "Docker Client", s: "docker build / run / push (CLI)" }],
      [{ t: "Docker Daemon (dockerd)", s: "manages objects via REST API", m: true }],
      [{ t: "containerd", s: "runC creates container processes" }, { t: "Containers", s: "isolated apps + images" }],
    ],
    labels: ["REST API request", "build / run engine"],
  },
  "azure-pipeline": {
    title: "CI/CD Pipeline Flow", sub: "Code se Production tak — automated stages",
    rows: [
      [{ t: "Source Repo", s: "git push triggers pipeline" }],
      [{ t: "Build Stage", s: "compile + unit tests" }],
      [{ t: "Artifacts", s: "package / image publish" }],
      [{ t: "Release Stage", s: "deploy to environments" }],
      [{ t: "Production", s: "live app + monitoring" }],
    ],
    labels: ["commit", "compile+test", "package", "deploy"],
  },
  "linux-fs-hierarchy": {
    title: "Linux Filesystem Hierarchy", sub: "Root (/) ke neeche standardized directories",
    rows: [
      [{ t: "/", s: "root of filesystem", m: true }],
      [
        { t: "/bin", s: "user binaries (ls, cat)" },
        { t: "/etc", s: "config files" },
        { t: "/home", s: "user data (~/)" },
        { t: "/var", s: "logs, spool" },
        { t: "/tmp", s: "temp files" },
        { t: "/usr", s: "installed apps" },
      ],
    ],
    note: "Har directory = ek specific kaam. Tumhe pata hona chahiye kaha kya hai — prod me logs /var/log me, config /etc me.",
  },
  "linux-permissions": {
    title: "Linux Permissions (rwx)", sub: "File: -rw-r--r-- user:devclo → Owner rw-, Group r--, Other r--",
    rows: [
      [
        { t: "Owner", s: "r w -  (read, write)" },
        { t: "Group", s: "r - -  (read only)" },
        { t: "Other", s: "r - -  (read only)" },
      ],
    ],
    note: "1st tri-bit = user, 2nd = group, 3rd = others. chmod 644 / chmod u+x yaad rahe.",
  },
  "bash-scripting": {
    title: "Bash Scripting Flow", sub: "Editor me likho → bash parse kare → kernel run kare → output",
    rows: [
      [{ t: "Text Editor", s: "vi / nano — write script.sh" }],
      [{ t: "Bash Script", s: "#!/bin/bash + commands" }],
      [{ t: "Bash Interpreter", s: "reads line by line" }],
      [{ t: "Linux Kernel", s: "executes programs/syscalls" }],
      [{ t: "Output", s: "stdout / files / exit code" }],
    ],
  },
  "dns-lookup": {
    title: "DNS Resolution Process", sub: '"google.com" → IP — step by step, cache ke saath',
    rows: [
      [{ t: "Browser / App", s: "wants google.com IP" }],
      [{ t: "Local Resolver", s: "OS cache / ISP (168.63.129.16*)" }],
      [{ t: "Root Nameserver", s: "batata hai: .com ka server" }],
      [{ t: "TLD Nameserver", s: ".com → authoritative NS" }],
      [{ t: "Authoritative NS", s: "final IP: 142.250.x.x" }],
      [{ t: "Machine ko IP milta hai", s: "connection banata hai (TTL cache)" }],
    ],
    note: "*Azure default DNS. Agar koi link ask ho to records: A, CNAME, NS, MX, TXT (+TTL).",
  },
  "tcp-ip-model": {
    title: "TCP/IP — 4-Layer Model", sub: "Data sender se receiver tak in layers me chalta hai",
    rows: [
      [{ t: "4. Application", s: "HTTP/HTTPS • DNS • SSH • SMTP" }],
      [{ t: "3. Transport", s: "TCP (reliable) • UDP (fast)" }],
      [{ t: "2. Internet (IP)", s: "IPv4 • IPv6 • ICMP — routing" }],
      [{ t: "1. Link", s: "Ethernet • Wi-Fi • MAC" }],
    ],
    note: "Interview: encapsulation top→down sender pe, decapsulation receiver pe; port = transport, IP = network.",
  },
  "git-areas": {
    title: "Git Staging Area (3 trees)", sub: "Working → Staging → Local repo → Remote",
    rows: [
      [{ t: "Working Directory", s: "tumhare edited files" }],
      [{ t: "Staging Area (Index)", s: "git add — snapshot ready" }],
      [{ t: "Local Repo (HEAD)", s: "git commit — permanent history" }],
      [{ t: "Remote (GitHub)", s: "git push — shared" }],
    ],
    labels: [null, "git add", "git commit", "git push"],
  },
  "gh-actions-overview": {
    title: "GitHub Actions — Overview", sub: "Event triggers workflow → jobs → steps → runner → output",
    rows: [
      [{ t: "Event", s: "push / pull_request / schedule" }],
      [{ t: "Workflow", s: ".github/workflows/*.yml (jobs define)" }],
      [{ t: "Job", s: "runs-on: ubuntu; steps run actions" }],
      [{ t: "Runner", s: "VM me code clone + steps execute" }],
      [{ t: "Logs + Artifacts", s: "status, reports, packages" }],
    ],
  },
  "maven-lifecycle": {
    title: "Maven Lifecycle Phases", sub: "Har phase pehle wale ke baad chalta hai (order fix)",
    rows: [
      [
        { t: "validate" }, { t: "compile" }, { t: "test" }, { t: "package" }, { t: "install" }, { t: "deploy" },
      ],
    ],
    note: "mvn clean install = clean + whole chain. pom.xml holi: coordinates (groupId/artifactId/version) + plugins + deps.",
  },
  "gh-workflows": {
    title: "Understanding Workflows", sub: "Triggers → Jobs (parallel) → Steps (sequential) → Actions reuse",
    rows: [
      [{ t: "Triggers", s: "push (main) • PR • schedule • manual" }],
      [{ t: "Jobs", s: "parallel by default, needs: dependency" }],
      [{ t: "Steps", s: "actions/checkout → setup → run tests" }],
      [{ t: "Actions", s: "reusable marketplace blocks" }],
    ],
  },
  "jenkins-architecture": {
    title: "Jenkins Architecture", sub: "Controller schedules, agents execute — master/agent split",
    rows: [
      [{ t: "Jenkins Controller", s: "UI • jobs • scheduler • logs", m: true }],
      [
        { t: "Agent 1", s: "Linux builder" },
        { t: "Agent 2", s: "Docker host" },
        { t: "Agent 3", s: "K8s pod" },
      ],
    ],
  },
  "jenkins-pipeline": {
    title: "Jenkins Pipeline Flow", sub: "Real-world pipeline: code se deploy tak ke stages",
    rows: [
      [
        { t: "Checkout", s: "SCM sync" }, { t: "Build", s: "compile" }, { t: "Test", s: "junit" },
        { t: "Package", s: "artifact/image" }, { t: "Deploy", s: "stage env" }, { t: "Post", s: "report/cleanup" },
      ],
    ],
  },
  "maven-logo": {
    title: "Maven", sub: "Build automation + dependency management (pom.xml based)",
    rows: [
      [{ t: "Maven", s: "Project Object Model → build + deps + plugins", big: true }],
    ],
  },
  "nexus-repo": {
    title: "Nexus Repository Manager", sub: "Hosted (apna) + Proxy (central cache) + Group (sab ek URL pe)",
    rows: [
      [{ t: "Developer / CI", s: "pull & push artifacts" }],
      [
        { t: "Hosted", s: "apne build artifacts" },
        { t: "Proxy", s: "maven-central cache" },
        { t: "Group", s: "sab ek URL aggregator" },
      ],
    ],
  },
  "github-packages": {
    title: "GitHub Packages", sub: "CI se build, registry me publish, app wahi se pull",
    rows: [
      [{ t: "CI Pipeline", s: "build + test" }],
      [{ t: "GitHub Packages", s: "container • npm • maven • .NET" }],
      [{ t: "Consumers", s: "app / other CI pulls versioned package" }],
    ],
  },
  "jenkins-syntax": {
    title: "Jenkins Pipeline (Declarative)", sub: "pipeline { agent } stages { stage{ steps{} } } post {}",
    rows: [
      [{ t: "stage 'Build'", s: "steps: sh 'mvn compile'" }],
      [{ t: "stage 'Test'", s: "steps: sh 'mvn test'" }],
      [{ t: "stage 'Deploy'", s: "steps: sh './deploy.sh'" }],
      [{ t: "post", s: "always/success/failure → email, cleanup" }],
    ],
  },
  "aks-architecture": {
    title: "AKS Architecture", sub: "Azure-managed control plane + saath me node pools",
    rows: [
      [{ t: "Control Plane (managed)", s: "API server • etcd • scheduler • controllers", m: true }],
      [
        { t: "Node Pool", s: "VM nodes: kubelet + kube-proxy" },
        { t: "App Pods", s: "replicas (deployments)" },
        { t: "Ingress Controller", s: "nginx — external traffic + TLS" },
      ],
    ],
  },
  "aks-ingress": {
    title: "NGINX Ingress Controller on AKS", sub: "External HTTP(S) → Ingress → Service → Pods",
    rows: [
      [{ t: "External Traffic", s: "curl https://your-app.example.com" }],
      [{ t: "Service (LB)", s: "public IP / Azure LB" }],
      [{ t: "NGINX Ingress", s: "TLS + route by host/path" }],
      [{ t: "K8s Service", s: "internal ClusterIP" }],
      [{ t: "Pods", s: "app replicas (backend)" }],
    ],
    note: "Host header = web pe kaunsa app, path = kaunsa service. Certificates: cert-manager + Let's Encrypt (day 49).",
  },
  "gh-actions-hero": {
    title: "GitHub Actions — CI/CD Workflow", sub: "Mere repo ka: lint → test → build image → deploy",
    rows: [
      [{ t: "Push to main", s: "workflow triggers" }],
      [{ t: "CI Job", s: "checkout • setup • npm test" }],
      [{ t: "Build Job", s: "docker build + push (needs: CI)" }],
      [{ t: "Deploy Job", s: "kubectl / az webapp (needs: Build)" }],
    ],
  },
  "azure-pipeline-schema": {
    title: "Azure DevOps Pipeline Schema", sub: "triggers → stages → jobs → steps (YAML)",
    rows: [
      [{ t: "CI Trigger", s: "branch • PR • schedule" }],
      [{ t: "Stage: Build", s: "compile + test + publish artifact" }],
      [{ t: "Stage: Deploy", s: "env: Dev → Staging → Prod (approval)" }],
      [{ t: "Jobs → Steps", s: "tasks: azure-specific / scripts" }],
    ],
  },
  "git-branching": {
    title: "Git Branching Model (GitFlow)", sub: "main + develop + feature + release/hotfix",
    rows: [
      [{ t: "main", s: "production-ready", m: true }],
      [
        { t: "develop", s: "integration branch" },
        { t: "release/*", s: "version prep" },
        { t: "hotfix/*", s: "urgent prod fix" },
      ],
      [{ t: "feature/*", s: "per feature, PR se merge" }],
    ],
    note: "Commit messages + PR review isse zyada matter karte hain. Trunk-based bhi popular hai.",
  },
};

const URLMAP = {
  "https://docs.docker.com/get-started/docker-overviews/images/docker-architecture.webp": "docker-architecture",
  "https://learn.microsoft.com/en-us/azure/devops/pipelines/media/overview.png": "azure-pipeline",
  "https://www.thegeekstuff.com/wp-content/uploads/2010/09/linux-file-system-hierarchy.jpg": "linux-fs-hierarchy",
  "https://www.redhat.com/sysadmin/sites/default/files/styles/full_img/public/2020-06/permissions.png": "linux-permissions",
  "https://www.hostinger.com/tutorials/wp-content/uploads/sites/5/2022/07/bash-scripting-overview.png": "bash-scripting",
  "https://www.cloudflare.com/img/learning/dns/what-is-dns/dns-lookup.png": "dns-lookup",
  "https://www.fortinet.com/content/dam/fortinet/images/cyberpedia/tcp-ip-model.jpg": "tcp-ip-model",
  "https://git-scm.com/images/areas@2x.png": "git-areas",
  "https://docs.github.com/assets/cb-23199/images/help/images/overview-actions-design.png": "gh-actions-overview",
  "https://maven.apache.org/images/flow.png": "maven-lifecycle",
  "https://docs.github.com/assets/cb-11418/images/help/actions/understanding-workflows.png": "gh-workflows",
  "https://www.jenkins.io/doc/book/resources/architecture/controller-agent.png": "jenkins-architecture",
  "https://www.jenkins.io/doc/book/resources/pipeline/realworld-pipeline-flow.png": "jenkins-pipeline",
  "https://maven.apache.org/images/logo.png": "maven-logo",
  "https://help.sonatype.com/images/nexus-repo/nexus3-home.png": "nexus-repo",
  "https://docs.github.com/assets/cb-27128/images/help/packages/packages-overview-diagram.png": "github-packages",
  "https://www.jenkins.io/doc/book/pipeline/syntax.png": "jenkins-syntax",
  "https://learn.microsoft.com/en-us/azure/aks/media/aks-overview.png": "aks-architecture",
  "https://learn.microsoft.com/en-us/azure/aks/media/ingress-basic.png": "aks-ingress",
  "https://docs.github.com/assets/cb-28357/images/modules/pages/actions/hero-actions.png": "gh-actions-hero",
  "https://learn.microsoft.com/en-us/azure/devops/pipelines/media/et-schema.png": "azure-pipeline-schema",
  "https://nvie.com/posts/a-successful-git-branching-model/": "git-branching",
};

/* 1) write SVGs */
let made = 0;
for (const [url, slug] of Object.entries(URLMAP)) {
  const d = DIAG[slug];
  if (!d) { console.log("!! no diagram for", slug); continue; }
  fs.writeFileSync(path.join(IMG, slug + ".svg"), svg(d));
  made++;
}
console.log("SVGs written:", made);

/* 2) rewrite md files */
function rewrite(url, alt) {
  const slug = URLMAP[url];
  if (!slug) return null;
  return `![${alt}](assets/img/${slug}.svg)`;
}
let changed = false;
const FILES = fs.readdirSync(ROOT).filter(f => /^day-\d\d-.*\.md$/.test(f))
  .concat(["capstone/day-29-capstone-planning.md", "capstone/day-30-capstone-implementation.md"]);
for (const f of FILES) {
  const abs = path.join(ROOT, f);
  let txt = fs.readFileSync(abs, "utf8");
  let newTxt = txt.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, (m, alt, url) => {
    const r = rewrite(url, alt);
    return r || m;
  });
  // tldp/gawk reference "images" -> proper external links
  newTxt = newTxt.replace(/!\[(Advanced Bash Scripting Guide)\]\((https:\/\/tldp\.org[^)]*)\)/g, "[$1]($2)");
  newTxt = newTxt.replace(/!\[(AWK Manual)\]\((https:\/\/www\.gnu\.org[^)]*)\)/g, "[$1]($2)");
  if (newTxt !== txt) { fs.writeFileSync(abs, newTxt); changed = true; console.log("rewrote", f); }
}
if (!changed) console.log("(no md changes)");

/* 3) report leftovers */
const left = FILES.flatMap(f => {
  const txt = fs.readFileSync(path.join(ROOT, f), "utf8");
  const im = [...txt.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g)];
  return im.map(m => f + " -> " + m[1]);
});
console.log("external image refs left:", left.length ? left : "none");