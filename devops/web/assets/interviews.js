// DevClo Interview Corner — per-day Q&A + tricky bank (offline).
// Q&A short aur interview-style: pehle socho, phir answer dekho.
window.INTERVIEWS = {
  0: [
    { q: "DevOps ke liye WSL2 kyun use karte hain, WSL1 kyun nahi?", a: "WSL2 ke pass real Linux kernel hai (translated syscalls nahi). Docker Desktop, minikube, aur real shell behavior WSL2 pe sahi chalte hain. Industry me WSL2 + VS Code + Docker hi standard 2026 setup hai." },
    { q: "Konse 3 checks confirm karte hain ki aapka setup ready hai?", a: "1) `java -version` / `python3 --version` — runtime, 2) `docker info` / `docker ps` — daemon chal raha, 3) `az account show` — Azure login + subscription. Inhi ko ek `setup-check.sh` me automate karte hain." },
    { q: "Agar setup-check me docker nahi chal raha to pehla kya check karenge?", a: "Service status: `sudo systemctl status docker` (WSL/Ubuntu) ya Docker Desktop chalu hai ya nahi (Windows/Mac). Baad me: kya user `docker` group me hai (`usermod -aG docker $USER` + logout), aur kernel virtualization on hai. Service → permissions → virtualization, isi order me." }
  ],
  1: [
    { q: "CALMS ko ek line me explain karo.", a: "Culture, Automation, Lean, Measurement, Sharing — ye 5 pillars DevOps ko define karte hain. Culture = trust, Automation = repeatable, Lean = chhota batch, Measurement = data decisions, Sharing = knowledge open." },
    { q: "The 3 Ways (Gene Kim) kya hain?", a: "First Way = Flow (left→right fast), Second Way = Feedback (production se wapas dev ko), Third Way = Learning (experiment + blameless postmortem). Inhi pe DORA metrics alap hai." },
    { q: "Aapki company me ops team DevOps se darti hai. Kaise shuru karoge?", a: "Industry me gain: 'pilot project' + koi dict taan-do. 1) Ek low-risk service pe pilot (auto deploy), 2) coaching/CD bina galti ke, 3) blameless postmortems establish karo, 4) wins (downtime kam) numbers me dikha aur leadership ko do. Culture palta jaata hai, gunban krke nahi." }
  ],
  2: [
    { q: "`rm -rf /` kya karta hai — aur real system me kya hota?", a: "Root directory aur uske andar sab kuch delete karne ki koshish. Modern Linux `rm` root pe guard rakhta hai (`rm -rf /` turant fail hota hai sans `--no-preserve-root`), lekin `rm -rf /*` ya `rm -rf ~/` galti se kisi bhi time data kha sakta hai. Isliye destructuring scripts me `set -u` + confirm." },
    { q: "`/usr/bin`, `/bin`, `/sbin` me kya difference hai?", a: "Historical: /bin basic tools, /sbin system-admin tools (root ke liye), /usr binaries user software. Aajkal modern distros me /bin → /usr/bin symlink (usrmerge). Interviewee jo ye bole wo current system bolta hai." },
    { q: "`ln` vs `cp` — kya copy hoti hai jab symbolic link banate ho?", a: "`ln -s target link` sirf ek '*pointer*' file banata hai (dusra name), data copy nahi hota — disk space almost zero. `cp` actual data copy. Isliye configs me symlink use karte hain taaki ek source har jagah update ho." }
  ],
  3: [
    { q: "chmod 755 vs 644 kab lagate hain?", a: "755 = owner(rwx) + group(4) + others(4), x included. Dirs/executables (web-server scripts) 755. 644 = readable sab, write sirf owner — normal files ke liye (configs, logs). Yaad wave: dir ka x = enter/docs access." },
    { q: "`chmod` ka parseInt — 754 ka matlab?", a: "7=4+2+1 (rwx), 5=4+1 (r-x), 4=r--. Owner full, group read+execute, others sirf read. Agar service me group users ko run karna hai to scripts 750+owner-group pattern common hai." },
    { q: "What is the sticky bit and SUID/SGID?", a: "**Sticky bit** (chmod 1777, jaisa /tmp): sirf owner hi apni file delete/rename kar sakta hai. **SUID** (4xxx): file user ke tor pe chalta hai (jaise `passwd` root privilege ke saath)... **SGID** (2xxx) dir pe: naye files us dir ka group inherit karti hain. SGID dirs continuous team projects me standard." },
    { q: "Private key pe `chmod 600` kyun? 644 kyun nahi?", a: "SSH strict mode karta hai: agar private key world/grupo readable (permissions too open) to connection reject hota hai. 600 = owner read/write only. Security + SSH ki hard requirement dono ek line me batao." }
  ],
  4: [
    { q: "`$?` aur `&&` / `||` ka use?", a: "$? = last command ka exit code (0=success). `cmd1 && cmd2` → cmd2 sirf success pe; `cmd1 || cmd2` → sirf failure pe. Pipeline me fail-fast isi se rakhta hain." },
    { q: "Why `set -euo pipefail` har script me?", a: "-e = koi bhi command fail to script exit, -u = unset variable pe error (galti pakad), -o pipefail = pipeline ka exit ustha last command exit nahi, koi bhi fail to fail. Best practice sirf `if cmd; then` use karo." },
    { q: "Subshell vs `source` me fark?", a: "Subshell `(cmd)` = nayi copy, variables bahar nahi ate. `source script` = current shell me execute, variables change ho kar wapas milte hain. Isliye `source ~/.bashrc` naye env load karta hai, `./script` nahi." }
  ],
  5: [
    { q: "`ping`, `telnet`, `curl` — teeno ka objective?", a: "ping = ICMP layer-3 reachability. telnet (port) = TCP connect test for a port. curl = HTTP/API full request-response. Troubleshooting order: ping → telnet → curl." },
    { q: "What is 127.0.0.1 vs 0.0.0.0?", a: "127.0.0.1 (loopback) = sirf local machine se reachable. 0.0.0.0 = saare interfaces pe listen (localhost + external). Server bind 0.0.0.0:8080 → container/network se milte hain; 127.0.0.1 sirf khudko." },
    { q: "DNS TTL 86400 rakha hai, records change hua to client ko kab pata chalega?", a: "Max TTL (86400s = 24h) tak cache purana answer de sakta hai. Isliye migration se **phele** TTL 60s karo, wait karo (old TTL expire), phir change karo. Industry me isi 'DNS cutover' process se zero-downtime sarte hain." },
    { q: "NAT kya hai, aur private IP-internet kaise jata hai?", a: "Private IP (10/172/192) internet pe directly route nahi hota. NAT device (router/NAT gateway) private→public IP mapping karta hai outgoing ke liye, reply reverse wise. Cloud me NAT Gateway kayka (AKS) heavy egress ke liye standard hai." }
  ],
  6: [
    { q: "`git reset --hard` vs `git revert`?", a: "reset --hard = history rewrite (local, force push pe bhi shared me danger). revert = **nayi commit** jo purani ke effect ko undo kare — shared branches pe sirf revert. Rule: 'private branch me reset, shared branch me revert'." },
    { q: "Merge vs rebase — kab kya?", a: "merge = nayi 'merge commit', history real events ki tarah, simple. rebase = apne commits ko target ke upar 'replay' karke **linear history**; clean log, par history rewrite. Feature branch local me rebase, main pe merge — industry pattern." },
    { q: "Detached HEAD kya hai?", a: "Jab aap kisi commit/tag pe checkout karte ho (branch reference nahi), HEAD kisi branch pe nahi — 'detached'. Naye commit log me kahin na mile ref se. Fix: branch bana kar attach (`git checkout -b fix-old-commit`)." },
    { q: "Force push ko kabhi kabhi acha kyu mana jata hai?", a: "`git push --force` branch history badal deta hai — dusron ke locally-pulled commits silently miss ho sakte hain (conflicts reel). Rule: sirf apni feature branch pe, kabhi `main`/shared release branch pe nahi. `--force-with-lease` safer hai." }
  ],
  7: [
    { q: "Production nginx server ko harden karne ke 4 checks?", a: "1) UFW/firewalld: sirf 80/443 open (`ufw deny` rest), 2) SSH: root login no + key-only, 3) nginx: user `www-data` root na chale, permissions 644/755, 4) logs rotate + fail2ban. Industry me installation script ye sab automate karta hai." },
    { q: "Zero-downtime release kaise kiya jata hai?", a: "Classic: **blue-green** (2 server groups, LB switch) ya **rolling** (ek-ek karke naya version, healthcheck pas hone pe next). Isi week ke server-setup + LB concept ka basic ekta inhi patterns use karte hain. 2026 me progressive delivery (canary % traffic) normal hai." },
    { q: "Systemd service aur simple script me fark?", a: "systemd unit = restart-on-fail, auto-start on boot, dependencies/health (Restart=always, After=network.target), logging via journald. Script = bas `&` background. Production service hamesha systemd/Tooling (docker) xnecha — aap bas 'service' naam se manage karo." }
  ],
  8: [
    { q: "CI vs CD kya hai ek line me?", a: "CI = har push pe build+test (fast feedback). CD = CI results ko production tak **automatic/ready** — Delivery (approval gate) ya Deployment (full-auto). CI without CD = sirf half pipeline." },
    { q: "Kyun CI breakdown without artifacts achha nahi hai?", a: "Har job me alag build = slow + impredictable. Industry: **artifact-first** — CI ek immutable artifact (tar/container) produce karta hai, wo stage aur prod me **same artifact** promote hota hai. 'Dev/prod parity' isi se milta hai." },
    { q: "Agar pipeline test fail ho raha hai weekly — CI se kya farak?", a: "Coverage/timing deadlock aata hai: team test fail ko 'expected' maan leti hai, pipiline unreliable, quality degrade. Fix: **fail-fast gate** + test sauce file — flaky test fix karo ya side par 'triage list' me lo. Unreliable CI = no trust = no value." }
  ],
  9: [
    { q: "GitHub Actions ke 5 core keywords?", a: "`name`, `on` (triggers), `jobs`, `steps`, `uses/run`. Job runner classification (runs-on), env/secrets, concurrency, permissions. YAML indentation exact honi chahiye — bas space ka galti pipeline todti hai." },
    { q: "Expressions vs secrets: `${{ }}` kahan nahi use hota?", a: "Expressions sirf contexts (github.*, env, vars) ke liye runtime pe evaluate. Secrets/if-conditions me `${{ }}` chahiye, lekin runner shell me `$ENV_VAR` style. Chain of env se kisi ko bhar na mile — correct pattern: step `env:` me map karo phir use karo." },
    { q: "Matrix builds ka benefit?", a: "Ek workflow ko alag OS/version combo pe parallel run (`matrix: node: [18,20]`). Time cheat + catch compatibility issues. Industry (e.g., my projects) matrix me unit+integration+lint ek saath chalate hain." }
  ],
  10: [
    { q: "Jenkins master/agent architecture?", a: "Master = scheduling + UI + logs; agents = actual builds ke nodes. Agents me labels se assign hote hain (`node { label 'linux' }`). Isi se distributed CI — heavy jobs dedicated agents pe." },
    { q: "Declarative vs scripted pipeline?", a: "Declarative = structured (`pipeline { agent {} stages {} }`) — readable, stages UI me dikhte hain, environment blok saaf. Scripted = groovy me full control (`node { stage{} }`). Naya code: declarative + shared library." },
    { q: "Jenkins vs GitHub Actions — yaad kaise rkhe jab puchhein?", a: "Answer structured: dono CI/CD. Jenkins = self-hosted, plugin system, YAML groovy-dsl; Actions = hosted, YAML file `.github/workflows`, tight GitHub integration. Choice = infra ownership vs SaaS convenience." }
  ],
  11: [
    { q: "`mvn package` vs `install`?", a: "package = build artifact (jar/war) `target` me banao. install = package + **local repo me install** (dusre local modules use kar sakein). deploy = remote repo (artifact repo) me push. Interview me sequence zaroor batao." },
    { q: "Depedency scope: compile vs test vs provided?", a: "compile = runtime+compile (jar included). test = sirf test phase (JUnit). provided = runtime container deta hai (jakarta.servlet in web container) — build me ho, jar me nahi. Galat scope = fat jar bloat + conflicts." },
    { q: "SNAPSHOT kya hai?", a: "SNAPSHOT = '-SNAPSHOT' version jo transition pe rebuild hota hai (20.1-SNAPSHOT = 'coming'), immutable nahi. Release build me hamesha **fixed version** dependency — reproducibility + no surprise updates. Production repo me snapshot ban pay hat." }
  ],
  12: [
    { q: "Artifact immutability ka matlab?", a: "Ek baar publish, kabhi overwrite nahi. Same version HR bhi guarantee same binary. Yih supply-chain security ka base — mutate opas dekhenge aur woh 'known-good' khata hai." },
    { q: "Semantic versioning ka formula?", a: "MAJOR.MINOR.PATCH. MAJOR = breaking change, MINOR = backward-compatible feature, PATCH = bug fix. Pre-release suffix (1.0.0-beta.1). Sila rule isi se auto-deploy decide hote hain." },
    { q: "Nexus/JFrog proxy vs hosted repo fark?", a: "Proxy = internet se fetch + cache (maven-central, docker hub) — team haloan dega nahi. Hosted = apna upload (final releases). Group = dono combined view. Isi se offline company bhi build karti hai cache se." }
  ],
  13: [
    { q: "awk vs sed kahan kya?", a: "awk = column/data processing (CSV: `awk '{print $2}'`), conditions + totals. sed = line text substitution (`sed -i 's/foo/bar/g'`). Log parsing me dono ek saath (grep→sed→awk) classic pipeline." },
    { q: "`cron` vs systemd timer?", a: "Cron simple time-based. Timer = dependencies, missed-while-off catchup, random delay (anti-thundering), logging+unit — modern sysadmin timer jyada prefer karta hai. Kotra: min 1min granularity." },
    { q: "`find ... | xargs` me filename with spaces kyu toot jata hai?", a: "xargs default space-separated. Fix: `-print0` + `xargs -0`, ya safer `-exec ... {} +`. Ye classic gotcha interview + real cron scripts dono me pucha jaata hai." }
  ],
  14: [
    { q: "Full CI/CD demo ek flow me?", a: "Commit → Actions/Jenkins: lint+unit → build jar/image → Trivy scan → push artifact (GHCR/Nexus) → deploy stage (auto) → smoke test → **approval gate** prod → deploy prod → monitoring (Prometheus/Grafana) → on fail auto-rollback. Ye hi poora course hai 8-14 me." },
    { q: "Rollback strategy kya hongi?", a: "3 options: 1) git revert + nayi pipeline (artifact re-deploy), 2) artifact registry me **immutable version** rollback (helm/k8s `--from-revision`), 3) blue-green switch. Backup bhi hota hai: DB migrations reverse-safe." },
    { q: "Kya stage aur prod me same artifact jaroori?", a: "**100% haan.** Alag artifact = 'works on stage' + 'breaks on prod' classic problem. Same jar/image stage me validate hua, prod me purana verified data ke saath — ki sirf config/env alag." }
  ],
  15: [
    { q: "Image vs container difference?", a: "Image = immutable template (Dockerfile), container = resulting running process (image + write layer + env/network). `docker build` → image, `docker run` → container." },
    { q: "ENTRYPOINT vs CMD?", a: "ENTRYPOINT = binary jo hamesha chale (pid 1), CMD = default args (override kiya ja sakta hai). Best: `ENTRYPOINT [\"nginx\"] CMD [\"-g\", \"daemon off\"]`. Galat combo = beginners ko aksar confuse karta hai; isliye interview favorite." },
    { q: "Layer caching kyun important hai?", a: "Dockerfile har line = layer, Docker **bohot zyada upar se cache** check karta hai. Order rkho: dependencies-modifable phe.Nahin — copy package.json pehle (rare change), `npm install`, phir code ka COPY (frequent) — rebuild second time fast hota hai." },
    { q: "Container me process as root kyun nahi?", a: "Root in container ≈ root on host (kernels shared). Risk: escape → host compromise. Best practice: `USER appuser`, rootless for runtime, capabilities drop. Ye **security interview 101** hai — trivy se ho ya manual." }
  ],
  16: [
    { q: "`depends_on` kb tk serve karta hai?", a: "Sirf **start order** pakka karta hai — app ready hai iski guarantee nahi. Isliye healthcheck (depends_on: condition: service_healthy) use karo. Yhi gotcha compose + k8s dono me." },
    { q: "Compose networks kaise distribute hue better?", a: "Services ko named networks me alag karo: `app-net` (frontend→backend), `db-net` (backend→db). NSG-like isolation — db external exposure nahi. Compose me default bridge bas built-in hota hai, custom better." },
    { q: ".env vs environment vs env_file?", a: ".env = compose interpolation (${VAR}), not passed to container. environment = container me env vars. env_file = file se vars load. Kaafi beginners in teeno ko milate hain — samajh se yaad rakho: interpolate vs inject." }
  ],
  17: [
    { q: "Multi-stage build kya solve karta hai?", a: "Image me build tools (JDK, gcc) na jayein. Phase 1: full build from `maven:3`; Phase 2: `FROM` runtime `JRE` me sirf jar COPY. Final image chhota (MB), no secrets — **industry standard**." },
    { q: "Distroless vs slim vs alpine choice?", a: "slim = debian minus extras (bal. good balance). alpine = super small (musl — kaafi apps glibc dependency ke liye compile issues). distroless = sirf runtime, no shell — least attack surface, debugging hard. Try: slim/distroless by default, alpine jab access compatible." },
    { q: "Trivy scan me CRITICAL mile to kya?", a: "CI me gate: fail build (`--exit-code 1 --severity CRITICAL`). Fix: 1) base image update/patch, 2) package upgrade, 3) jaiseki CVE false-positive manual review. SBOM (syft) produce + publish — supply chain audit-ready." }
  ],
  18: [
    { q: "Container in Kubernetes kaise pack karte ho (PO-d vs deployment)?", a: "Container → **Pod** (1+ containers, shared network/storage). But **direct pod nahi** — Deployment banate ho jo ReplicaSet manage kare (self-healing, rollouts). Pod = instance, Deployment = desired state." },
    { q: "Control plane ke 4 components?", a: "api-server (front-door), etcd (state store), scheduler (pod→node), controller-manager (desired vs actual loop). Worker: kubelet + runtime + kube-proxy. Ye skeleton interview ka backbone hai." },
    { q: "liveness vs readiness — fark?", a: "liveness = pod restart hota hai jab app hang (deadlock). readiness = traffic ALLOW karega jab app ready (load, init). Galat liveness = restard loop; galat readiness = traffic before ready. Dono probes alag-alag set karte hain." },
    { q: "Kube-proxy ka kya kaam, service me IP kaise?", a: "Service = stable virtual IP + label selector. kube-proxy us VIP ki traffic actual pod IPs (endpoints) pe forward karta hai. Pod IPs change/scale hone pe service URL stable rehta hai — ye namuna customers ko bina IP change ka deploy deta hai." }
  ],
  19: [
    { q: "Rolling update — deployment kya karta hai (step by step)?", a: "Old ReplicaSet scale-down, new ReplicaSet scale-up, ek-ek karke — Ready pods guarantee. maxSurge (extra pods) + maxUnavailable (at most X down) control speed/risk. Halted: status.rollout + kubectl rollout undo." },
    { q: "HPA ko kaam karte hua?", a: "`kubectl autoscale deployment app --cpu-percent=70 --min=3 --max=10`. Metrics server poll karta hai utilization, target ratio pass → replicas scale. CPU se hi nahi, custom metrics (QPS) se better." },
    { q: "Manual `kubectl scale` vs HPA conflict?", a: "HPA + manual scale ek saath = to-and-fro (thrash). Rule: executor ek choose karo — HPA (auto) ya replocas in deployment code (GitOps). Dono ko control-plane conflict manata hai." }
  ],
  20: [
    { q: "ConfigMap vs Secret — underlying fark?", a: "ConfigMap = non-sensitive config (URLs, settings). Secret = sensitive (password, token). **Secret base64 is obfuscation, not encryption** — etcd me encrypted StorageBackend se hi asli security. API inspect se readable secret raw aata hai." },
    { q: "Secret rotate karne par pod update kyun nahi hota?", a: "Secret/ConfigMap mount ki env vars restart pe hi naye value lete hain. Naye: restart pod (rollout restart) after rotation, ya mounted file (symlink /etc/.../..data) live update hoti hai. Isi gotcha se secrets staleness hoti hai." },
    { q: "Azure Key Vault se k8s me secret kaise?", a: "AKS me CSI Secrets Store driver: pod mount karta hai vault key direct (no secret objects in etcd). Ya Flux/External Secrets Operator — GitOps sync. Security: secrets kubectl/etcd me avoid, secrets manager me centralize." }
  ],
  21: [
    { q: "AKS vs self-managed K8s?", a: "AKS: managed control plane (Azure updates/kubelet), managed node pools, RBAC+AAD, managed disks, cluster autoscaler. Self-managed: full control + ops burden. Cloud me managed always for business — isliye course AKS pe." },
    { q: "Microservices on AKS ke 5 production considerations?", a: "1) Namespace isolation (dev/prod), 2) Resource requests/limits har pod pe, 3) HPA + cluster autoscaler, 4) NetworkPolicy + ingress (App Gateway/Nginx), 5) Secrets via CSI/Key Vault + HA (multi-AZ node pools)." },
    { q: "k8s me app ko expose karne ke 3 tarike?", a: "ClusterIP (internal service), NodePort (node IP:port, test), LoadBalancer (external LB, prod), Ingress (L7 routing — hostname/path based; standard). ServiceAccount/Route k8s-native but AKS pe Ingress + AGIC typical." }
  ],
  22: [
    { q: "Terraform state kya hai aur kahan rahna chahiye?", a: "state = real infra snapshot in JSON. Production me **remote backend** (Azure Storage blobs / S3) + locking (avoid drift + parallel conflicts). Kabhi local — team multiple editors me state overwrite hoga. Yhi 'state atomicity' interview topic." },
    { q: "`terraform plan` vs `apply` vs `destroy`?", a: "plan = diff preview (kya bana/badlega, no changes), apply = changes execute, destroy = sab resources remove karo (cleanup/cost). Automation: plan in CI, approval pe apply." },
    { q: "IaC drift kya hota hai?", a: "Kisi ne portal/console se resource manually badal diya — code se state mismatch ho gaya (drift). Fix: `terraform plan` detect → re-apply, ya `refresh`/`import`. Real-world: **console lockdown** policy + drift detection cron." }
  ],
  23: [
    { q: "Resource Group kya hai, kyon useful?", a: "Logical container of resources (same lifecycle), RBAC boundary + **cost tag**. Ek RG = ek 'budget bucket': `az group delete` se pura cleanup. Never scatter resources randomly — RG team/project based." },
    { q: "NSG rules: priority kaise kaam karta hai?", a: "Rule priority 100 (high) se 4095 tak, chhota number pehle match. Default **deny-allow** hai (last). Allow exact ranges — `0.0.0.0/0` port 3389 (RDP) SAKTH — tier-1 vuln scanners, kabhi use nahi karo." },
    { q: "RBAC vs MFA vs Conditional Access — identity layer?", a: "RBAC = *kya kar sakta hai* (role assignment). MFA = *kaun ho tum* (proof). Conditional Access = *kab/kahan* (device, location, risk) policy. Yaad: roles fail-said rule = least privilege. Azure AD(Entra) me identity ka base." },
    { q: "Static vs Dynamic public IP?", a: "Static = fixed, DNS/whitelist/firewall allowed ke liye. Dynamic = VM restart pe badal sakta. Production services me static + DNS names. By default empty VM = no public IP (secure) — Bastion se access in private." }
  ],
  24: [
    { q: "Prometheus ki pull model vs push (Graphite/StatsD)?", a: "Pull = Prometheus har target ke /metrics pe jata hai (targets known, Sirf service discovery). Push = client bhejta hai. Pull advantage: central config, target up/down detect, replay from scrape. K8s discovery ek reason iska default hai." },
    { q: "Cardinality explosion kya hota hai?", a: "Metric me label unique values badhna (e.g., user_id label). 10^6 unique series = memory/query explosion. Rule: label = low-cardinality dimensions (method, status); high-cardinality (user/request id) ko **logs/traces** me show. Ye classic prod incident hota hai." },
    { q: "How to alert only when it matters?", a: "1) SLO/predictable threshold (e.g., 99.9% 5m window), 2) **for duration** 5m — spikes ignore, 3) Alertmanager noise suppression + routing. False alarms = on-call burnout = numko bhi phata-pata nahi — alert quality > count." }
  ],
  25: [
    { q: "ELK/EFK me 'L' (Logstash vs Fluentd) aur 'K' (Kibana)?", a: "Elasticsearch = search/index engine (storage+query), Logstash/Fluentd = log ingestion+enrichment, Kibana = dashboard/visualize. Logging pipeline = app → agent (filebeat/fluentd) → ES → Kibana." },
    { q: "Shards aur index-retention ka design?", a: "Index = month/day wise (logstash-2026.09.09), shards = document partitions (replica/cluster). Retention policy: hot (30d) → warm/cold → delete; cost + search speed balance. Industry: TTL-index lifecycle (ILM)." },
    { q: "Structured vs unstructured logs — difference?", a: "Structured (JSON) = queryable fields (status, user_id) — Kibana/ES me aggregations + correlation. Unstructured = sirf string, pain. Rule: app logs JSON, and log level gating (info/debug) in prod. Ye 'structured logging' interview bullet hai." }
  ],
  26: [
    { q: "Shift-left security ka matlab?", a: "Security testing pipeline ke **start** me karo (SAST/SCA/scan), production nahi. Bug code stage me mila → rs. 100 fix; production me mila → saan laga hua patch + user harm + incident report. 'Cheaper earlier' — ye principle respond in interview." },
    { q: "SAST vs DAST vs SCA?", a: "SAST = source code static analysis (Semgrep/Bandit) bina run kiye. DAST = running app pentest (OWASP ZAP). SCA = dependency/CVE check (npm audit, snyk). Sequence: SAST→SCA→build→DAST→runtime(Falco)." },
    { q: "High severity vuln mile par build fail karna chahiye?", a: "**Haan** — gate break-the-build CRITICAL/HIGH. NOTE: 'block every vuln' nahi, sirf rated (suppress false positives documented). Log4j (2021) jaisa incident: scan-based gate ne production-level CVEs ka supply-chain break rok diya. Ye real value hai." } 
  ],
  27: [
    { q: "SLI, SLO, SLA — difference?", a: "SLI = measure (e.g., % requests < 200ms). SLO = target (99.9% within month). SLA = customer contract (legal, penalty). SLO humility chaahiye — SLO product keeps. = 'Measure → Target → Promise'." },
    { q: "Error budget ka business use?", a: "Budget = 100% - SLO. 99.9% → 8.76 hrs/year allowed bad-time (budget). Jab budget khatam → **release freeze** (reliability first). Budge full → release frequency badha (speed). Yhi 'balance between velocity and stability' ka formal version hai." },
    { q: "Toil reduction kaise show karte ho?", a: "Toil = repetitive manual work. Metric: hours toil/week. Reductions: automation (runbooks→scripts), self-service portals, IaC. 'Zero toil by default' — SRE book core idea, managed clouds (AKS) toil minimize karte hain." }
  ],
  28: [
    { q: "Production incident (P1) ka response order?", a: "1) Mitigate/stabilize (rollback/scale-down toxic traffic) — **first**, 2) RCA post mortem (blameless), 3) fix detection (alert gap), 4) fix/improvement backlog. Incident = 'reliable blame-free process', not chaos." },
    { q: "On-call alert le aane ke design?", a: "AlertManager routing + escalation pages, `for` duration (drain false positives), on-call rotation, runbook per alert, WL/RL balance. Honest answer: alert → runbook → automatic fix (self-healing) — best alerts are ones auto-fix." },
    { q: "SPIKE traffic (sale) kaise manage?", a: "Autoscaler limits + pre-warn (prepare: HPA min/max), capacity check + LB, keda (Azure) event-driven. On misuse: traffic shaping/rate limiter + fallback features. Aadhi java: 'prepared slack' vs 'reactive snapshot'." }
  ],
  29: [
    { q: "DeployTrack architecture explain (interview ready)?", a: "Monorepo → GitHub Actions (CI) build+scan → GHCR artifacts → AKS (Azure) ya docker-compose staging → Terraform (VNet/NSG/AKS) bootstrap → Prometheus/Grafana monitoring → Key Vault secrets. 3-tier: API + PostgreSQL + Redis." },
    { q: "Planning me TIME-estimate kaise dete ho?", a: "Break down: infra (Terraform) 2d, CI/CD 3d, app containerization 2d, monitoring/alerts 2d, security scan + harde 2d ≈ 11-12d. Add buffer (20%). Never 'one-liner estimate' — components list interview me impress karta hai." }
  ],
  30: [
    { q: "Capstone complete hone ke baad kaise sell karte ho resume me?", a: "Numbers: 'CI pipeline 30→5 min, zero-downtime deploys, 99.9% AKS uptime, cost -40% via autoscaler/spot'. Tech stack line + link (GitHub repo) — proof > claims." },
    { q: "Iski cost-optimization ka 1-2 idea?", a: "1) Cluster/ASG autoscaler (idle off), 2) spot instances for stateless, 3) log/artifact retention lifecycle, 4) `az cost` budgets + resource tags. Ye 'balancing deliver vs spend' philosophy manager interview me poochaata hai." }
  ],
  31: [
    { q: "Ye course me tumne Azure ka use kiya, AWS me shift kaise karoge?", a: "Concepts 1:1 — bus paws: `az group create` ≈ `aws resource-groups`, NSG ≈ SG, AKS ≈ EKS/GKE, Blob ≈ S3, Key Vault ≈ Secrets Manager. Terraform provider switch azurerm→aws — same `.tf`. Ye 'cloud-agnostic' answer hi interview ka point hai." },
    { q: "Azure DevOps (Pipelines) vs GitHub Actions — kaunsa choose?", a: "Same YAML concepts. Choose by: repo homes (GitHub → Actions), Azure ecosystem heavy (→ ADO Pipelines), on-prem agent needs (→ ADO self-hosted). Dono ko jano, response 'tools are interchangeable, knowledge is concept' — wahi HR appreciate karta hai." },
    { q: "Multi-cloud kyun/kyun nahi?", a: "Baneful: avoidance of lock-in, best-of-breed. Cost: operational complexity, team skills, cost mgmt. Answer: 'single cloud first, multi cloud when business justifies' — matured, tick yes in architecture interview." }
  ],
  32: [
    { q: "GitOps explain karo (interview ke liye)?", a: "Kaam (source of truth) Git me, drift fix automatic by reconciler (ArgoCD/Flux pulls). Pehla define ka: 'Everything defined-as-code, Git is single source of truth, apply + self-heal'. Quote CD vs GitOps: CD pushes, GitOps pulls — safer se less credential blast radius." },
    { q: "ArgoCD app-sync fail kyun ho sakta hai + fix?", a: "1) Manifest yaml syntax error → patch git, 2) cluster unreachable → kubecontext/network, 3) CRD missing → install CRD, 4) image tag nahi mila → registry creds (secret). Debug: `argocd app get APP` + `argocd app logs`; fix in Git then sync." },
    { q: "Rollback GitOps me kaise karta hai?", a: "Rollback = Git history pe commit/revert (revert karo, phir auto-sync). ArgoCD me `argocd app rollback` for instant/unsafe; proper way: revert PR → pipeline re-deploy. Isliye GitOps = 'Git me undo karte ho, cluster manage itself'." }
  ],
  33: [
    { q: "Service mesh kyun need hui? Direct problems?", a: "Per-service logic duplication (retry, timeout, TLS, tracing) + observability. Mesh injects **sidecar** (Envoy) — network problems solved at data plane, app code untouched. Interview answer: 'business logic vs infrastructure: split'." },
    { q: "mTLS kaise kaam karta hai + kyun secure?", a: "Service 'S' aur destination D dono ke certificate exchange + apart verify. Istio auto-rotate + authorization (L7). Eavesdropping + impersonation dono block. Fortify answer: 'identity-based, not network-IP-based security'." },
    { q: "Canary Istio me kaise implement?", a: "VirtualService weight splits traffic: v1 90%, v2 10% → metrics (error rate, p99) threshold pass → weight 50 → 100. Rollback = weight 100-v1. Istiod config change, pods ko restart nahi karna padta — seamless." }
  ],
  34: [
    { q: "CI me scanning layers rank — kis order me?", a: "1) gitleaks/trivy-repo (secrets) 2) SAST (Semgrep) 3) SCA (deps: OWASP-dependency-check) 4) container scan (Trivy image) 5) IaC scan (checkov/tfsec). Failure = build fail. Senior answer: 'fail-fast, cost-optimized, per-layer ownership'." },
    { q: "SAST vs DAST vs SCA — ek line difference?", a: "SAST: static code analysis (file se), DAST: running app attack simulation (runtime me), SCA: vulnerable dependencies (versions). Online-offline, white-box vs black-box vs inventory. Match: 'code quality, runtime behavior, supply chain'." },
    { q: "Scanner ne false positive diya — process?", a: "Triage: verify severity + scope, exploitability. Legit → fix. False → suppress with justification (timestamp + owner + reason, no blanket ignore). Audit trail isliye: security = 'documented decisions not noise'." }
  ],
  35: [
    { q: "Repo me secret aagaya (committed). Proper fix?", a: "1) Ban: revoke/rotate key abhi. 2) git filter-repo / history scrub + force-push 3) gitleaks pre-commit guard. Secret galat treatment: log me leak → rotate + log scrub, hash revoke single lease. Koi backup (lokal commit) check karo." },
    { q: "Key Vault vs HashiCorp Vault — kya difference?", a: "KV: cloud-native, managed, key/secret/cert rotation + RBAC (Azure). Vault: self-hosted platform: KV + dynamic (per-lease, short-lived) + encryption-as-a-service + multi-cloud. Cloud → KV; multi-cloud/compliance → Vault. Answer: 'control vs managed trade-off'." },
    { q: "Secret rotation bina downtime kaise?", a: "Dual-write phase: app reads old+new; deploy new version uses new, then old decommission. Auto-rotation (KV expires/Version), versioned read APIs. Kubernetes: ESO syncs from Vault — update sensitive data, pods re-inject (annotation). 'Zero-downtime rotation' = orchestration discipline." }
  ],
  36: [
    { q: "Operator vs plain manifests — kab use?", a: "Operator = custom controller for domain apps (backup, DB cluster, mesh) — watches CRs + reconciles state automatically (self-heal). Use jab complex lifecycle/skills chahiye; plain YAML for static apps. Interview: 'CRD = config; operator = desired-state engine'." },
    { q: "RBAC interview example — sahi se design?", a: "Least privilege: app-deployer (create deploy+svc in apps ns), security-role (read + policy in system ns), view-only (monitor). ServiceAccount per workload + no cluster-admin for devs. Is open boundary ki: 'role-based, namespace-scoped, bindings narrow'." },
    { q: "HPA vs KEDA — kya difference?", a: "HPA: CPU/memory/prometheus metrics, scale by threshold on pods. KEDA: event-driven (queue length, kafka lag, cron) + scale-to-zero. Serverless jobs → KEDA; steady-state web → HPA. Senior: 'demand-driven vs event-driven scaling'." }
  ],
  37: [
    { q: "Policy as Code explain (3 lines)?", a: "Infra/k8s rules declared as code (OPA/Kyverno) pele resources. Enforce: admission webhook → ingress. 'Prevent drift' (deny 'latest' tag, require owner labels) vs 'detect' (gate/kube-audit). Interview: 'guardrails-as-code, canary of policies via Git review'." },
    { q: "OPA Rego vs Kyverno — app me select karn?", a: "OPA/Rego: general-purpose policy engine (cloud + k8s + CI), writing Rego = steeper learning. Kyverno: k8s-native YAML-declared policies, mutation(a) + generate + validate simple. Choose: k8s-only → Kyverno; enterprise-multichannel → OPA/Rego." },
    { q: "'latest' image tag deny karne ka practical reason?", a: "Non-reproducible + kanji image drift. `:latest` update means not knowing exactly what runs → rollback impossible. Policy: require immutable tag (git sha) at deploy; tag latest sirf convenience. Kyverno `verify-images` digest validation." }
  ],
  38: [
    { q: "IDP (Internal Developer Platform) — problem kya solve + explain?", a: "Developer sprawl (documentation scattered, infra config sprawl) → 'Golden Paths' = self-service templates (Backstage scaffolder) + single portal (catalog + docs + actions). DevOps = 'platform team enables, not bottleneck'. Answer: 'standardization without force, self-service with guardrails'." },
    { q: "Backstage 'catalog' kya rakhta hai?", a: "Entity yaml (catalog-info.yaml): service metadata, ownership (team), API docs, dependencies — TechDocs wala docs portal. Catalog = 'org's living inventory of services' — discovery for new hires, decommission tracking. Interview: 'source-of-truth for what we run'." },
    { q: "Golden Path template design principle?", a: "Opinionated (few choices, proven stack), automated (scaffolder → CI/CD + cloud resource provisioned), documented, guards (policy + SLO checked). Principle: 'make the right thing the easy thing'; developer time-to-first-deploy days → minutes." }
  ],
  39: [
    { q: "FinOps 3 phases batayein?", a: "Inform (visibility: usage/cost) → Optimize (rightsize, spot, remove idle) → Operate (govern: budgets, anomaly alerts, shared accountability). Interview: 'cost is not a side effect — a product decision, continuous cycle, not once-a-quarter'." },
    { q: "Kubecost / cost-per-namespace kaise measure?", a: "Aggregate metrics (CPU/RAM used × node cost + storage + LB) → label mapping namespace/team. Show dashboard: top spenders, idle resources, rightsizing suggestions. Answer: 'unit-economics per squad — makes cost a developer responsibility'." },
    { q: "Budget breach hone par kya?", a: "Alert (email/webhook) → auto-actions fallback (pause dev, scale-down, spot switch) → incident process to investigate anomaly. Never just kill prod; 'responsive not reactive' optimization strategy." }
  ],
  40: [
    { q: "Chaos engineering explain + benefit?", a: "Intentional failure injection (kill pods, network delay, CPU pressure) in controlled env to find weaknesses. Practicing deterministically → steady-state hypothesis (SLOs stand). Benefit: 'break it in test so it doesn't break in prod' + confidence to already fail failover." },
    { q: "Litmus/Bring chaos: experiment ke 4 stages?", a: "Steady-state (baseline metrics) → hypothesis (inject stress: e.g. pod-delete → expect rescheduling) → inject (fault) → verify/learn (did SLO survive?). Document findings + improve. Is repeating: 'bake chaos into release pipeline (game day)'." },
    { q: "Production hi me chaos kyun nahi karte?", a: "Only after: guardrails (SLO alerts, kill-switch), blast-radius limit (2% pods, single AZ), rollback/red-team readiness, business buy-in. 'Canary chaos' — start small (staging → prod-edge), business continuity first." }
  ],
  41: [
    { q: "RTO RPO simple interview definition?", a: "RTO = time to restore service (say 2h), RPO = max data-loss tolerance (say 15min). Trade-off: tighter = costlier (storage, active/active). Equation: 'business up-time vs data loss — measure then design', recovery strategy (backup, warm standby, active-active) shapes both." },
    { q: "Velero vs Azure Site Recovery (ASR)?", a: "Velero: k8s-native backup/restore of cluster+etcd volumes (app-layer), BYO storage, schedules. ASR: Azure VMs/app replication to secondary region (failover: infra-level, 1+ hr). Combined: 'ASR infra + Velero app data' — layered DR." },
    { q: "DR plan test credibility — kaise dar dikhao?", a: "Restore in a drill (RTO measured), failover/failback drill (ASR test-failover uses clone), check data integrity (RPO ≤ target), update runbook + train staff. If it's not tested it's a story — interview ask: 'what's your DR evidence?'" }
  ],
  42: [
    { q: "Multi-cloud architecture — kya trade-off real-world me?", a: "Resilience: run app in AZURE + AWS, DNS/$ GSLB failover between. But: 2x ops, networking/storage heterogeneity, skills, cost. Pragmatic: 'single-cloud primary, multi-cloud for DR/data-residency/customer requirement' — never multi-cloud just to sound cool." },
    { q: "Portability: Terraform multi-provider kaise?", a: "Same module, provider block switches (azurerm↔aws↔google), use cloud-agnostic resource names + variables. OCI/CNCF components (K8s, Prometheus, KEDA) are portable; proprietary services (Blob vs S3 SDKs) are not — abstract with interfaces. Interview point: 'abstraction layer = strategy not accident'." },
    { q: "Multi-cloud identity (single sign-in) design?", a: "Identity broker (Entra ID + federation to AWS IAM/Google), SCIM sync groups, role mapping centralized. Avoid separate identity stores (operational mess). Principle: 'one directory, many clouds, consistent policies'." }
  ],
  43: [
    { q: "Serverless vs containers — selection criteria?", a: "Serverless: short-lived event-driven, unpredictable traffic, low ops, per-invocation cost → fine for async/HTTP spikes. Containers: long-running services, heavy compute, stateful, need control. Interview: 'not either/or — mixed (functions for bursts, containers for steady base)'." },
    { q: "Azure Durable Functions — fan-out/fan-in pattern?", a: "Orchestrator function splits job into N parallel activities (fan-out), waits all, aggregates results (fan-in). State saved (checkpoint), retries/durable. güncel interview answer: 'coordination logic in code, not in infra, with exactly-once semantics'." },
    { q: "KEDA scale-to-zero me cold-start problem kaise handle?", a: "Scale-down minimal (minReplicas 1), warm pool, or event pre-warn. Cold start: DNS/TLS warm, container pre-pull, functions Fast-by-design. Answer highlights 'cold start = latency tax — plan your scale floor'." }
  ],
  44: [
    { q: "MLOps kya + standard practice?", a: "ML lifecycle automation: experiment tracking (MLflow), data/feature pipeline, model registration + versioning, CI/CD for training + serving, monitoring (drift detection) + retrain. Difference DevOps: 'model is not code — data + version + evaluation gates'. Interview: 'reproducibility + governance for ML'." },
    { q: "Model drift detection — kyun + kaise?", a: "Data drift (input distribution) & concept drift (input→output relation). Detect: statistical tests (PSI, KS), shadow monitoring, fresh metric comparing to baseline. Response: retrain on new data / alert + rollback. Answer: 'production model is only as good as its monitoring'." },
    { q: "Model serving — online vs batch?", a: "Online: REST/gRPC inference (FastAPI/Triton), low latency. Batch: offline periodic (spark/airflow), cost-efficient. Choose by SLA: real-time features → online; recommendation/fraud scoring overnight → batch. Interview: 'scaling + latency + cost define the path'." }
  ],
  45: [
    { q: "DataOps vs DevOps — kya same? (interview)", a: "Same principles (versioning, CI/CD, monitoring) but artifacts = data pipelines (ELT/dbt models, schemas) + data quality (tests, freshness, lineage). dbt = 'Terraform for the warehouse'. Answer: 'data pipeline as code with contracts + alerting'." },
    { q: "dbt model test failure — CI me gate?", a: "dbt test (not_null, unique, accepted_values) + custom tests, run in CI with fresh data, gate deploy of downstream models. 1 broken model fails pipeline → no bad data propagates. Interview: 'data quality as continuous checkout, same as code'." },
    { q: "ETL vs ELT — modern flow?", a: "ETL: extract→transform→load (transform before warehouse, heavy). ELT: extract→load raw→transform in warehouse (Scale: MPP SQL engines, dbt on top, schema evolution friendly). Chose by: data size+price → modern = ELT dominant." }
  ],
  46: [
    { q: "API Gateway — responsibility list (interview ready)?", a: "AuthN/AuthZ (JWT/OAuth token validation), rate limiting/quota, routing+versioning, caching, request transformation, observability (logging, metrics), security (WAF). 'Backend façade' — clients see gateway not services. Principle: 'edge concern centralization ≠ business logic'." },
    { q: "Microservices resilience patterns — kaunsa kab?", a: "Retry (transient, exponential backoff+jitter), Timeout (circuit breaker if frequent), Circuit Breaker (fail fast when downstream broken), Bulkhead (isolate resources), RateLimit (protect consumers), Saga (distributed transaction across services). Answer: 'map pattern to failure mode'." },
    { q: "API versioning policies — truly backward compatible kaise?", a: "SemVer: breaking → major bump, add `?v=` or Accept header; never mutate existing semantics. Deprecate via sunset header + analytics. 'Version in URI = contract visible; evolve = additive-first'." }
  ],
  47: [
    { q: "p99 latency interview me explain?", a: "99% requests complete ≤ X ms — tail latency, worst-case user experience. Response: monitoring p50/p95/p99 + why not p999 (rare noise). Improve: caching, parallelism, connection-pool, jitter-retry, left tail. 'Users feel p99, not p50' — the classic quote." },
    { q: "k6 / load test — how to find bottle bottleneck?", a: "Ramp-up stages (10→100→500 VU), measure: throughput, latency, error rate, RRM utilization. Watch p99 ↑ before CPU 100% → queueing/contention; watch CPU 100% first → CPU-bound. Then scale vertically/horizontally, tune app, retest. 'Load test = prove headroom before demand'." },
    { q: "Caching strategy (Redis) — invalidation ke types?", a: "Write-through (write both, consistent, slower), write-behind (write cache, async DB — risk of loss), cache-aside (app first checks cache, miss → DB + set). TTL short for volatile. Pitfall: thundering herd on TTL expiry → use lock/stale-while-revalidate." }
  ],
  48: [
    { q: "Supply chain attack kya + famous example?", a: "Compromised build-time dependency/tool injects malicious code into artifact (e.g. SolarWinds). Attack vector: registry image, package (npm/pypi), CI runner creds. Defense: SBOM, signed artifacts (cosign), SLSA levels, verified images admission, scanning. Interview: 'trust, but verify the pipeline'." },
    { q: "SBOM kya + kyun chahiye?", a: "List of all components and versions in a software (CycloneDX/SPDX, generated by syft/scorpio). Critical: know what's vulnerable after CVE disclosure (log4shell — 'are we affected?'). 'Zip' audit: transmit SBOM with artifact, check against policy (policy as code)." },
    { q: "cosign + Kyverno verify-images — kya chain banata hai?", a: "Sign images (keyless with GitHub OIDC) on CI → Kyverno webhook verifies signature before admission → unsigned = blocked. Result: 'only our pipeline's artifacts can run in cluster'. Interview: 'immutable provenance + runtime enforcement'." }
  ],
  49: [
    { q: "Zero Trust principles (Hinglish answer ready)?", a: "Never trust, always verify: identity everywhere (MFA/CA), least privilege access, microsegmentation, continuous authentication (conditional access risk-based), device posture check, monitor suspicious. 'Perimeter is gone — identity + policy define security'." },
    { q: "Entra ID Conditional Access — real scenario?", a: "Policy: high-risk sign-in → block/require MFA; admin roles → +PIM (just-in-time); locations → block. Combined with Sentinel analytics → automatic responses. 'Trust decisions data-driven: user risk, device, location, behavior'." },
    { q: "Sentinel SIEM vs Grafana — difference (common confusion)?", a: "Sentinel: security-special logging + SIEM (detection rules, threat intelligence, incidents + SOAR) — 'evaluate suspicious events'. Grafana: operational metrics/dashboards. Overlap: both ingest logs but intent differs (security ops vs reliability)." }
  ],
  50: [
    { q: "Grand Capstone sab kuch combine — interview story?", a: "Story: GitOps (ArgoCD) deploy → service mesh Istio mTLS + canary → policy (Kyverno deny latest, verify cosign) → secrets (Vault/KeyVault) → monitoring (Prometheus + Grafana SLOs + budgets FinOps) → chaos (Litmus game day) → DR (Velero RPO ≤15m) → multi-cloud portability. 'A platform, not a pile of tools'." },
    { q: "Agar koi tool nahi hai, tum kaise infer karte? (senior metris)", a: "Understand trade-offs from first principles: kya problem is tool solves, kya design invariants need. Search + POC + compare (KPI-matrix), docs + community, ask vendor. Interview answer 'tool-agnostic thinking scores higher than tool memorization'." },
    { q: "50 din bad tumhare production-scale habits kya?", a: "Define SLIs/SLOs first, alert on budget; design for failure (chaos); everything code (GitOps, policy, infra); everything observed; cost-aware by default; security at every layer. 'The operating discipline is the product of DevOps maturity' — that's the hiring signal." }
  ]
};

// Tricky questions across topics — string reasoning repeated the selected concern samne laake.
window.TRICKS = [
  { day: 2, q: "`rm -rf /` aur `rm -rf /*` me kya antar?", a: "`rm -rf /` modern GNU rm **dupo root guard** (fail), `rm -rf /*` sirf root ke children (files) delete — wo guard bypass hota hai aur system todo sakta hai. Kabhi `echo /` test pakka banawo — isliye scripts me `${VAR}` never samaatal ke bina." },
  { day: 3, q: "`chmod 777` kabhi kyun nahi?", a: "777 = duniya ko read+write+execute file ke saath — koi bhi tamper/delete kar sake. Proper: files 644, executable 755, private 600/700. 777 dikha do → interview me red flag." },
  { day: 5, q: "DNS TTL badha ke performance improve ki, ab IP badalna hai — kya karenge?", a: "Pehle TTL 60s karo (24-48h cache expire hone do), phir IP update, phir 2-3 din baad TTL wapas long. Direct TTL-high me IP change = clients 24h tak purana IP try karte rehte hain. Ye 'DNS cutover' classic prod drill hai." },
  { day: 6, q: "Rebase ke baad `git push` kyun reject hota hai, aur fix kya?", a: "Rebase ne commits ka hash badal diya, remote apni history se mismatch → non-fast-forward reject. Sochne ka man: `git push --force-with-lease` (apni branch), kabhi `--force` shared branch pe nahi. Exactly ye question senior interviews me aata hai." },
  { day: 15, q: "`docker build` do baar — pehli 5m, dusri 30s? Kyun?", a: "Layer caching. COPY package.json (rabari kam change) install deps → cache hit. Lekin agar COPY . . phele hi ho (every edit invalidates), deps re-install har baar → sab kuch slow. Isliye Dockerfile order = dependencies pehle, code baad." },
  { day: 18, q: "log-ktos liveness probe galat set kiya to kya hota hai?", a: "App slow/loading (not dead) par liveness fail → pod restart-loop → requests fail tyme zara update. Liveness = 'is process stuck', readiness = 'is it ready for traffic'. Sirf kuch sane allow. Probe tuning prod me sabse zyada site-ops lessons deta hai." },
  { day: 22, q: "Kisi ne Azure portal se manual resource badal diya, Terraform kya karega?", a: "State vs actual mismatch = **drift**. `terraform plan` diff dikhayega (attempt to recreate/change). Manual edits pasand nahi — lock (no portal edits), remote state + policy prevent drift. Interview: 'drift = reality vs code mismatch' bab aur mitigation banao." },
  { day: 24, q: "Prometheus me 2000 unique user_id labels pair hokar memory kaise khata hai?", a: "Har unique label value ek **series** — user_id as label = 10M+ series = TSDB memory explosion + queries seedhi kali. High-cardinality (user/request) labels ke series na rakho — logs/traces me le jaao. 5-year jaisa metric design asli quality." },
  { day: 26, q: "Trivy scan clean hai to sab vuln-free? (interview trap)", a: "Nahi — sirf **known keyed image-level CVEs** at scan time. Zero-day / runtime / source-logic vuln (wo SAST/DAST) / deprecated image unscan ko miss ho jaata hai. Answer: layered scanning (SAST+SCA+DAST+runtime) + ITSVs, single tool = weakness." },
  { day: 27, q: "Error budget 0 hai aur feature ship hona hai — kya?", a: "SLO me error budget = 'release freeze' principle → feature **nhi** jayega jab tak budget wapas na aaye (reliability priority). Alternative: rollback capacity + feature-flag behind risk mitigated — par formally release freeze hi correct answer." },
  { day: 32, q: "ArgoCD sync koi button se nahi, Git se karta hai — phir 'sync' option kya hai?", a: "Sync = Git se cluster tak apply (reconciler pulled it in). Git me commit + push → auto-sync (if enabled) ya manual sync button (still reads from Git, not manual config). Interview point: 'operator applies what Git says — never what a human types'." },
  { day: 33, q: "Sidecar proxy kya hota hai ek line me?", a: "App ka companion container jo incoming/outgoing traffic intercept karke mesh functions (mTLS, retry, metrics) apply karta hai — app ka code bilkul waise hi rehta hai. Performance par asar: ~1-3% overhead, isliye mesh choice = feature vs cost trade-off." },
  { day: 36, q: "CustomResource (CR) delete kiya — operator ka kya hota?", a: "Finalizer handle order: CR delete → operator's reconcile cleanup logic (backup, remove resources) then finalizer release, CR fully gone. Bina finalizer ke orphan resources rah sakte hain. Interview: 'finalizer = lifecycle guarantee of custom resource'." },
  { day: 39, q: "Spot instance pe 'termination notice' kya?", a: "Cloud sends pre-warning (2 min) before reclaim. App should: graceful shutdown, drain, reschedule (node pool handling). Cost-effective + resilient = 'stateless workloads tolerate spot churn' — kubernetes eviction policy." },
  { day: 41, q: "RPO 0 possible hai? (trap question)", a: "True zero = no data loss only with active-active replication + all writes synced — extremely costly/failure windows still exist (replication lag). Practically not 0; common answer 'only with hot standby + synchronous replication, and even then replication is not instant'. Be honest." },
  { day: 43, q: "Durable Functions orchestration state kitna me rehta hai — memory heavy to nahi?", a: "Orchestrator is stateless between checkpoints — state (function history) stored in storage (Azure Table) & replayed on wake; memory usage low. This is why orchestrator code must be deterministic (no random/DateTime.Now in logic)." },
  { day: 47, q: "DB query slow — developer blame cache nahi karta, senior kaise sochta?", a: "Form a plan: EXPLAIN (full scan?), missing index → add; N+1 → join/fetch; connection pool tuning; cache only after measuring. Never just 'add Redis' — always measure first (slow query log → fire line)." }
];