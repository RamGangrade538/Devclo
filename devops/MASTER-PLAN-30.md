# DevClo 2027 — Master Plan (Day-wise Syllabus + Practice + Platform Engineering)

> Ye file tumhare study notes ke **60 incident scenarios** ko day-wise practice me map karta hai.
> Har day: **LEARN** (full detail + 2026-latest) → **LAB** → **TICKETS** (realistic incidents) → **DONE WHEN**.
> End me: **Platform Engineering Track (Day 31-40)** + **5-year experience cheat sheet**.
> Existing `CURRICULUM.md` = concepts/roadmap; ye file = har day ka **topics full detail + practice plan**.

---

## How To Use (har day ka loop)

1. **LEARN** (45 min) → is file ka Day section + us topic ka `day-NN-*.md` (existing docs me detail).
2. **LAB** (60 min) → existing docs ka "Practice Exercise" khud karo (bina solution dekhe).
3. **TICKET** (30 min) → us day ke incident ko ticket ki tarah handle karo:
   `Ticket/Alert → Investigate (real commands) → Root cause → Fix → Verify → 2-line resolution → Close`
4. **COMMIT** (5 min) → GitHub repo me push (portfolio).
5. **NOTES** (5 min) → "kya expect tha / kya hua / kaise fix kiya" likho.

**Golden rule:** Ticket tabhi close hai jab resolution comment likha ho, jaise:
> *"Root cause: Service selector didn't match pod labels. Corrected deployment, verified HTTP 200, monitoring confirms recovery."*

**"5-saal" wala mindset:** Har ticket me 3 cheezein bhi sochna — (a) **blast radius** (kitne users affected), (b) **how to detect faster** (kya alert/monitor chahiye), (c) **how to prevent** (kya permanent fix/pipeline gate). Yehi seniority hai.

---

## Syllabus At A Glance (Day 1-40)

| Phase | Days | Focus |
|-------|------|-------|
| **Phase 1** | 1-7 | Linux + Networking + Git + Shell |
| **Phase 2** | 8-14 | Docker + Azure Fundamentals (VM/VNet/NSG/Storage/CLI/IAM-RBAC) |
| **Phase 3** | 15-20 | Azure DevOps (Repos, Pipelines/CI, CD + GitOps) |
| **Phase 4** | 21-27 | Kubernetes/AKS + Monitor + Key Vault + Terraform |
| **Phase 5** | 28-30 | End-to-End Azure DevOps -> AKS Project |
| **Phase 6** | 31-40 | **Platform Engineering Track** (IDP, Backstage, DevEx, SRE, FinOps, Security) |

---

# PHASE 1 — Linux + Networking + Git + Shell (Day 1-7)

## Day 1 — Linux Fundamentals & Operations

**LEARN (full + latest)**
- Filesystem: FHS, `/proc /sys /dev /tmp /var`, symlink vs hardlink, mount + `/etc/fstab`, LVM basics
- Permissions: rwx octal, umask, ACL (`getfacl/setfacl`), setuid/setgid/sticky bit, `chown/chmod`
- Users/groups: `/etc/passwd`, shadow, group, sudoers, `useradd/usermod`, password policy (`chage`)
- Processes: `ps`, `top`, signals, process states (R/S/D/Z), zombie/orphan, cgroups v2
- Systemd (latest): units, drop-ins, `systemctl`, timers, journald, targets
- Disk/health: `df -h -i`, `du`, `iostat`, `lsof`, **inode full** (real gotcha), swap, `systemd-analyze`
- 2026: kernel 6.x, systemd ~257, cgroups v2 default, Azure Linux/WSL2

**LAB** — 1 VM (Multipass/WSL2/cloud): 20 core commands, deploy user + ACLs, systemd timer.

**TICKETS**
- `INC-101 · CPU 95%` -> `top -b -n1`, `ps aux --sort=-%cpu` -> root cause: naya deploy me busy-wait loop -> fix code + restart via systemd.
- `INC-102 · Disk 100%` -> `df -h`, `du -sh /var/log/*` -> root cause: nginx log me logrotate nahi -> add `logrotate`, clean + verify.

**DONE WHEN** — `systemctl status` clean, disk <80%, 20 core commands bina soch likhe.

## Day 2 — Networking + Services

**LEARN (full + latest)**
- IP/CIDR, public vs private vs loopback, subnet math
- Ports/sockets: `ss -lntp`, LISTEN vs ESTABLISHED, ephemeral ports
- HTTP: methods, status codes (301/403/404/500/502/503), headers, `curl -I -v`
- DNS: `dig`, `nslookup`, `/etc/resolv.conf`, A/CNAME/TTL, DNS resolution order
- Firewall 2026: `ufw`/`firewalld`/`nftables`, rules ordering, zones
- Connectivity: `ping`, `traceroute/mtr`, `nc -vz`, packet path

**LAB** — 2 VMs: connectivity lab + ufw block test + port checker script (`ss -lntp` + `nc`).

**TICKETS**
- `INC-103 · Nginx service down` -> `systemctl status nginx`, `journalctl -xe` -> root cause: config typo/port bind fail -> `nginx -t`, fix, restart.
- `INC-104 · Port 8080 already in use` -> `ss -lntp` -> root cause: purana java process port hold kar raha -> stop old, app bind karke verify.

**DONE WHEN** — koi bhi connectivity problem 5 commands me trace ho jaye.

## Day 3 — Git + GitHub (Full Workflow)

**LEARN (full + latest)**
- 3 areas (working/index/HEAD), `git log --oneline --graph`, **reflog** (sabse undervalued)
- Branching: GitFlow vs **Trunk-Based** (2026 standard), short-lived feature branches
- `merge` vs `rebase` vs `cherry-pick`, `stash`, `squash`, signed commits (GPG)
- GitHub: PRs, reviewers, **branch protection**, CODEOWNERS, `git blame`, tags/releases
- 2026: **merge queue**, conventional commits, `git worktree`

**LAB** — 3 feature branches, conflict create + resolve, PR + review, tag, reflog recovery.

**TICKETS**
- `INC-201 · Merge conflict` -> both branches padho -> resolve -> build+test -> merge.
- `INC-202 · Wrong branch deployed` -> `git log` prod vs feature -> root cause: CI ne `develop` build kiya, not `main` -> correct ref se rebuild.

**DONE WHEN** — merge conflict khud resolve + `git reflog` se deleted branch recover.

## Day 4 — Git Troubleshooting (senior-level aaj hi)

**LEARN (full + latest)**
- `reset --soft/--mixed/--hard`, `revert`, reflog recovery, `filter-repo` (history rewrite)
- Secret leaks: `gitleaks`, `trufflehog`, history se secret hatao + **rotate karo**
- Security: branch protection, required checks, `.gitignore/.gitattributes`, CI secrets scanner
- Deployment mapping: git SHA -> tag -> image -> env (prove karke, "konse code ka deploy")

**LAB** — fake secret commit -> detect -> history remove -> rotate -> CI gate add.

**TICKETS**
- `INC-203 · Secret committed` -> remove history (`filter-repo`), **rotate credential**, gitleaks/pre-commit gate, document.
- `INC-204 · Revert bad deployment` -> `git revert <sha>` -> pipeline redeploy -> curl verify.

**DONE WHEN** — secret leak drill + revert drill, dono documented.

## Day 5 — Shell Scripting + Automation

**LEARN (full + latest)**
- `set -euo pipefail` (production standard), `trap`, exit codes, `$?`
- Variables, arrays, if/for/while/case, functions, string ops, globbing
- Text tools: `grep awk sed cut sort uniq tr xargs jq`
- **cron vs systemd timers** (senior choice), log rotation, cron PATH gotchas
- Monitoring scripts (CPU/disk/mem/port + alert/webhook), idempotency, `shellcheck` lint

**LAB** — `health-check.sh` + `backup.sh` (tar+gzip+retention) + timer + alert.

**TICKETS**
- `INC-105 · Permission denied` -> `ls -l`, `id`, `namei -l` -> root cause: service `www-data` chal raha, dir `root` ki -> chown/umask fix.
- `INC-106 · Memory high` -> `free -m`, `top`, `/proc/<pid>/status`, OOM in dmesg -> root cause: app leak -> restart policy + tuning.

**DONE WHEN** — script `set -euo pipefail` clean + `shellcheck` 0 errors.

## Day 6 — SSH, Logs & Deep Debugging

**LEARN (full + latest)**
- SSH keys (ed25519), perms 600, `ssh-keygen`, `~/.ssh/config`, `ssh-keyscan`
- `sshd_config`, password auth off, `fail2ban`, key rotation
- Logs: `journalctl -u -f -n -k`, syslog/rsyslog, logrotate, app log dirs
- Debug chain: `systemctl -> journalctl -> app log -> stack trace/timestamps -> correlation`

**LAB** — hardened SSH + ek incident ko 3 alag logs se correlate karo.

**TICKETS**
- `INC-107 · SSH not working` -> sshd running? port? key 600? firewall? `auth.log` -> fix.
- `INC-108 · Log investigation` -> `journalctl -u app -f`, stack trace + timestamps -> root cause: cron job + DB timeout overlap -> fix schedule.

**DONE WHEN** — SSH 30 sec me debug + kisi service ke logs se root cause nikalna aata hai.

## Day 7 - PROJECT 1: Server Health & Automation

Combine Days 1-6: health-check script (CPU/disk/mem/ports/logs) + systemd service + alert + logrotate.

**TICKETS** (project ke andar hi milein)
- `INC-109 · Process issue` -> zombie/defunct/orphan process, port takeover -> identify + `Restart` policy.
- `INC-110 · DNS/network issue` -> `dig`, `/etc/resolv.conf`, curl external -> fix resolver.

**DONE WHEN** — script server ke saare Linux tickets catch karti hai, 1-command setup, GitHub pe push.
---

# PHASE 2 — Docker + Azure Fundamentals (Day 8-14)

## Day 8 — Docker Fundamentals

**LEARN (full + latest)**
- Image vs Container vs Layer, union FS, copy-on-write, immutable infra
- `docker run/logs/inspect/exec/stop/rm`, `-rm -it -d -p -v -e`, volume vs bind mount
- Images: pull/push/tag, digest, exit codes, HEALTHCHECK, restart policies
- Networking: bridge (default), host, none, user-defined networks, container-name = DNS
- 2026: rootless Docker, BuildKit default, compose v2, containerd, `docker scout` (SBOM), image signing

**LAB** — Flask/Node app containerize: build, run, logs, exec, cleanup.

**TICKETS**
- `INC-301 · Container exits immediately` -> `docker logs`, inspect `ExitCode` -> root cause: wrong ENTRYPOINT/CMD or missing file -> fix image/volume.
- `INC-302 · Port conflict` -> host port busy -> map `8080:80`.

**DONE WHEN** — koi bhi app run/expose/debug kar sakte ho.

## Day 9 — Dockerfile, Builds & Optimization

**LEARN (full + latest)**
- Dockerfile: FROM/RUN/COPY vs ADD, ENTRYPOINT vs CMD, ENV/ARG, EXPOSE, HEALTHCHECK
- **Multi-stage builds** (classic senior skill): builder -> runtime, distroless
- Layer caching (deps pehle, code baad), `.dockerignore`, build cache mounts
- Security: non-root user, read-only FS, drop capabilities, Trivy scan, SBOM
- 2026: BuildKit, `docker buildx`, bake, multi-arch builds

**LAB** — app image 900MB -> ~100MB multi-stage, non-root, Trivy clean.

**TICKETS**
- `INC-303 · Image build fails` -> build log -> root cause: `apt-get install` w/o `apt-get update`, ya ARG missing -> fix layers.
- `INC-304 · Wrong env var` -> `docker inspect` env vs `.env` -> root cause: `DB_HOST=localhost` -> fix.

**DONE WHEN** — optimized + secure image, build logs se error identify.

## Day 10 — Compose, Networks & Registries

**LEARN (full + latest)**
- compose.yml: services, volumes, networks, depends_on (healthcheck-based), restart, env_file, profiles
- Registry: Docker Hub, **ACR** (Azure Container Registry), private repos, auth/login
- Tagging convention: commit-SHA, semver; image pull secret (k8s me)
- Multi-container debug: `docker compose ps/logs`, service DNS, port mapping

**LAB** — full-stack (app + postgres + redis + nginx) compose + ACR push/pull.

**TICKETS**
- `INC-305 · Container can't reach DB` -> networks -> root cause: app bridge vs DB host network -> align networks/service DNS.
- `INC-206 · PR conflict blocks pipeline` -> rebase main -> resolve -> re-run CI.

**DONE WHEN** — full stack one-command up/down + network issue debug.

## Day 11 — Azure Fundamentals + VM/VNet/NSG

**LEARN (full + latest)**
- Azure hierarchy: tenant -> subscription -> RG -> resources; regions + availability zones
- **Entra ID** (puraana Azure AD): users, groups, service principals, managed identities
- VM: sizes, disks (temp disk gotcha), boot diagnostics, SSH, cloud-init
- VNet: address space, subnets, **peering**, NSG (rule priority/ordering)
- 2026: Azure Verified Modules (AVM), Azure Linux VMs, VMSS

**LAB** — portal + az CLI dono se: VM + VNet + NSG (SSH/80 allow, baaki deny).

**TICKETS**
- `INC-401 · VM unreachable` -> VM state? NSG? IP? boot diagnostics -> root cause: NSG port 22 block ya VM deallocated.
- `INC-402 · NSG blocking 443` -> `az network nsg rule list` -> rule ordering -> fix + test.

**DONE WHEN** — VM + lockdown NSG create/delete + NSG precedence explain.

## Day 12 — Azure Storage

**LEARN (full + latest)**
- Storage account redundancy: LRS/ZRS/GRS/RA-GRS; blob types; access tiers
- Auth: account keys, **SAS tokens** (scope+expiry), Entra RBAC, connection strings
- CLI: `az storage blob upload/download`, AzCopy, private endpoints
- Security: key rotation, deny public access, immutability, network rules

**LAB** — `az storage` blob CRUD + SAS generate/expire + AzCopy.

**TICKETS**
- `INC-403 · Storage permission denied` -> SAS scope/expiry -> root cause: SAS expired/wrong scope -> least-privilege regenerate.
- `INC-404 · App can't resolve storage (DNS)` -> private endpoint + private DNS zone missing -> add.

**DONE WHEN** — blobs bina portal az CLI se manage hote hain.

## Day 13 — Azure CLI + ARM/Bicep + Service Connections

**LEARN (full + latest)**
- `az login`, account/group/vm/network/storage, `--query/-o table/json`
- **Bicep** (ARM ka modern form, 2026 preference): .bicep -> `az deployment group create`
- Service principal (app registration), **workload identity federation** (SPN ki jagah, no more secrets)
- `az devops` extension, error: `az deployment group show`, `--debug`

**LAB** — RG + VM + Storage bina console, az CLI + Bicep se.

**TICKETS**
- `INC-405 · Deployment failed` -> `az deployment group show` -> root cause: param type mismatch / quota.
- `INC-406 · Service connection expired` -> SPN secret expired -> workload identity federation switch.

**DONE WHEN** — full infra az/Bicep se + deployment errors troubleshoot.

## Day 14 — IAM/RBAC + PROJECT 2: VM Stack via CLI

**LEARN (full + latest)**
- **RBAC roles**: Owner/Contributor/Reader + custom roles; **scope**: sub/RG/resource
- AKS/KeyVault/Storage built-in roles; least privilege
- **PIM** (Privileged Identity Management), conditional access, managed identity vs SPN
- Load Balancer + App Gateway: health probes, backend pools
- PROJECT 2: pure CLI -> RG + VNet/subnet + NSG + VM(nginx) + Storage + LB, locked-down

**TICKETS**
- `INC-407 · RBAC access denied` -> `az role assignment list` -> root cause: role sub pe hai, RG pe nahi -> correct scope.
- `INC-408 · LB health probe failing` -> backend unhealthy -> app port mismatch -> fix target/probe.

**DONE WHEN** — PROJECT 2 script GitHub pe + scope check pehle role dene se.

---

# PHASE 3 — Azure DevOps (Day 15-20)

> CI/CD logic GitHub Actions/Jenkins (CURRICULUM wale) se 90% same hai — yahan **Azure DevOps** ka full track.

## Day 15 — Azure DevOps Org, Agent Pools & Triggers

**LEARN (full + latest)**
- Org/project/Boards/**Repos/Pipelines**, GitHub <-> Azure Pipelines connections
- Agents: Microsoft-hosted vs self-hosted, agent pools, **Managed DevOps Pools** (Azure-hosted custom)
- Triggers: CI (branch/path filters), PR triggers, schedules, pipeline triggers, webhooks
- Variables: variable groups, secrets (`$()`), library, azure-pipelines.yml
- Permissions: repo, pipeline, approvals, project admin

**LAB** — Azure DevOps FREE tier: org + repo + first YAML pipeline + 2-env skeleton.

**TICKETS**
- `INC-501 · Pipeline not triggering` -> commit develop pe, trigger main pe -> fix trigger/branch, verify webhook.
- `INC-502 · Agent offline/missing` -> pool status, agent logs -> MS-hosted quota ya self-hosted agent down -> fix.

**DONE WHEN** — naya repo milne par 20 min me CI trigger chalu.

## Day 16 — Azure Pipelines: CI (Build + Test + Artifact)

**LEARN (full + latest)**
- YAML: stages/jobs/steps, checkout, conditions, dependsOn, templates
- Tasks: script, powershell, package managers, cache
- Build: restore -> compile -> test -> **publish artifact**; env setup, tool version pinning
- Logs reading: task logs, `##vso[logissue]`, exit codes (retry vs investigate)

**LAB** — app CI: lint + test + artifact + template reuse (green).

**TICKETS**
- `INC-503 · Build failed` -> logs -> root cause: SDK/tool version mismatch -> pin version.
- `INC-504 · Dependency failure` -> lock file missing / feed unreachable -> use lock + cache.

**DONE WHEN** — pipeline as code (repo me yaml), templates ke sath.

## Day 17 — CI Quality: Env Vars & Secrets

**LEARN (full + latest)**
- Test gates: coverage thresholds, lint fail-fast, matrix builds
- **Secret vs non-secret**: `$()` vs `${{ }}` vs `env:`, masking, never print
- Variable groups linked to **Key Vault**, precedence rules
- Caching: agent-level vs task-level, deterministic builds (same SHA = same output)

**LAB** — secrets 3 tarike (literal, variable group, Key Vault) + masking test.

**TICKETS**
- `INC-505 · Test fails randomly` -> isolate flaky (order dep / missing test DB) -> fix properly (re-run mat karo).
- `INC-506 · Wrong env var in wrong stage` -> override/scope -> fix.

**DONE WHEN** — secrets kabhi log me nahi + deterministic builds.

## Day 18 — Docker + ACR in Azure Pipelines

**LEARN (full + latest)**
- Docker build in CI: ACR task, login via service connection / workload federation
- Tagging: `$(Build.BuildId)`, commit SHA; avoid `latest` for prod
- Push to ACR, pull in other env; ACR Tasks
- Image scan: Trivy/Snyk/Defender in pipeline, SBOM, cosign signing
- Artifacts: PublishBuildArtifacts, retention, Universal Packages/feeds

**LAB** — pipeline: image build + scan + push ACR + commit-SHA tag.

**TICKETS**
- `INC-507 · Docker build fails in pipeline` -> specific RUN step -> base/context issue -> fix.
- `INC-508 · Artifact missing on download` -> publish path/retention/name -> fix task inputs.

**DONE WHEN** — pipeline scanned+signed image ACR me push karti hai.

## Day 19 — CD + Environments + Gates

**LEARN (full + latest)**
- Multi-stage YAML: dev -> QA -> prod with **approvals**
- Deployment strategies: **rolling, blue/green, canary**; deployment groups
- Gates: health check, monitor/API gate, wait duration, rollout failure detect
- Service connection to **AKS** (kubeconfig), kubectl/helm tasks
- GitOps intro: pull model, ArgoCD/Flux (deep dive Day 32)

**LAB** — multi-stage CD dev->prod + approvals + AKS deploy + failing rollout drill.

**TICKETS**
- `INC-509 · Deployment failed at stage` -> CD connection / app health after deploy -> check service connection + readiness.
- `INC-510 · Secret failed in CD` -> service connection SPN expired / Key Vault ref broken -> rotate + verify.

**DONE WHEN** — prod deploy needs approval + gate, rollback by design.

## Day 20 — Rollback + Secrets + Key Vault Intro

**LEARN (full + latest)**
- Rollback strategy: revert vs rollback vs fix-forward; `kubectl rollout undo`
- Secrets mgmt: **Key Vault** (secrets+certs+keys), RBAC vs access policy, soft-delete/purge
- App config: Key Vault references in App Service / AKS CSI driver
- Managed identity (no secrets in code)

**LAB** — bad V2 deploy -> auto-detected -> rollback V1 -> verify -> postmortem.

**TICKETS**
- `INC-511 · Production API 500 after deploy` -> investigation -> **rollback decision** -> verify -> blameless postmortem.
- `INC-512 · Secret rotation` -> rotate in Key Vault -> app continues working (via reference/MSI) -> verify.

**DONE WHEN** — rollback drill end-to-end + secrets Key Vault me, code me nahi.

---

# PHASE 4 — K8s/AKS + Ops + Terraform (Day 21-27)

## Day 21 — Kubernetes Fundamentals + kubectl

**LEARN (full + latest)**
- Architecture: control plane (api-server, etcd, scheduler, controller-mgr) + nodes (kubelet, kube-proxy, CRI)
- Pods, Deployments, ReplicaSets, Services, Namespaces
- kubectl: get/describe/logs/events/port-forward/exec
- Workloads: Deployment vs StatefulSet vs DaemonSet vs Job/CronJob
- 2026: Gateway API (GA), sidecar containers, in-place pod resize, Karpenter/NAP

**LAB** — AKS cluster (az aks create) ya local (kind/k3d): first Deployment + Service.

**TICKETS**
- `INC-601 · CrashLoopBackOff` -> `kubectl logs --previous`, exit code -> root cause: app crash/config mount -> fix.
- `INC-602 · ImagePullBackOff` -> `kubectl describe pod` -> wrong tag / private ACR w/o pull secret -> fix + create docker-registry secret.

**DONE WHEN** — describe pod padhke reason nikalo, events nahi dekhe to work hi nahi hai.

## Day 22 — Scheduling, Probes & Limits

**LEARN (full + latest)**
- requests/limits (CPU/memory), QoS classes, eviction, taints/tolerations, nodeSelector/affinity
- Readiness vs Liveness probes (paths, ports, initialDelay, timeout)
- Namespaces + resource quotas/limit ranges
- OOMKilled, pod Pending analysis

**LAB** — deploy with probes + limits; break probe -> observe restart/502.

**TICKETS**
- `INC-603 · OOMKilled` -> `kubectl describe`, `kubectl top pod` -> root cause: limit too low / leak -> tune + fix app.
- `INC-604 · Readiness probe failing` -> probe path/port -> / vs /health -> fix probe.

**DONE WHEN** — probes + limits ka pura lifecycle explain + debug.

## Day 23 — Services, Ingress, DNS & Networking

**LEARN (full + latest)**
- Service types: ClusterIP, NodePort, LoadBalancer; Endpoints/EndpointSlices; selectors/labels
- **Ingress + Gateway API** (config controllers, ingress class, TLS)
- CoreDNS, service DNS (service.namespace.svc), network policies, kube-proxy

**LAB** — app exposed via Service + Ingress + TLS; NetworkPolicy deny-all->allow.

**TICKETS**
- `INC-605 · Service not accessible` -> `kubectl get endpoints` -> root cause: **selector mismatch (labels)** -> fix.
- `INC-606 · Ingress failure` -> ingress class/annotations/cert -> fix ingressClassName.

**DONE WHEN** — pod->service->ingress->internet path troubleshoot kar sakte ho.

## Day 24 — Azure Monitor + Key Vault on AKS

**LEARN (full + latest)**
- Azure Monitor: metrics, Log Analytics (KQL), alerts, Container Insights
- Prometheus in Azure (managed service), Grafana, actionable alert design
- Key Vault + AKS: CSI Secrets Store driver, workload identity (no hardcoded secrets)
- KQL basics: table names, `where/timespan/take/summarize`

**LAB** — AKS metrics + KQL query + alert rule + app reads secret from Key Vault via CSI.

**TICKETS**
- `INC-607 · Monitor alert CPU>90%` -> alert -> pod/app/deploy -> recent rollout -> fix + tune alert.
- `INC-608 · Key Vault access denied on AKS` -> MSI/identity role + access policy -> grant.

**DONE WHEN** — alert -> investigate -> root cause chain complete.

## Day 25 — Terraform + Azure

**LEARN (full + latest)**
- IaC principles, HCL: resources, variables, outputs, data sources, modules
- `terraform init/validate/plan/apply/destroy`, state + locking (remote azurerm backend)
- azurerm provider v4, Azure Verified Modules (AVM), tags, workspaces
- Plan reading: changes meaning (create/update/replace/re-destory)
- 2026: OpenTofu mention, `terraform test`, policy as code (Sentinel/OPA)

**LAB** — RG + VNet + AKS via Terraform, remote state, 2 workspaces (dev/prod).

**TICKETS**
- `INC-701 · terraform apply failed` -> `terraform validate` + error -> provider/param/state -> fix.
- `INC-702 · State locked` -> backend lock -> verify safe -> release/force-unlock carefully.

**DONE WHEN** — infra versioned, plan padhte ho, state = secret samajhte ho.

## Day 26 — Terraform State, Drift, DR & Scaling

**LEARN (full + latest)**
- State: import, `terraform state list/show/rm/mv`, refresh vs plan drift
- Drift management: `terraform plan` shows unexpected -> import/reconcile; prevent with policy + pipeline
- DR: backup (redundancy), restore drill, multi-region design, business continuity
- Scaling: HPA (metrics server), **KEDA** (event-driven: queue/HTTP), Cluster Autoscaler, NAP/Karpenter

**LAB** — thrift simulate (portal me resource change) -> `terraform plan` detect drift -> import; HPA stress test.

**TICKETS**
- `INC-703 · State drift` -> plan shows changes -> root cause: manual portal changes / deleted disk -> import + reconcile.
- `INC-704 · HPA not scaling` -> no requests.cpu -> HPA can't compute -> add requests + verify.

**DONE WHEN** — drift manage + HPA aur KEDA dono se scale karate ho.

## Day 27 — Full AKS Troubleshooting Day

**LEARN (full + latest)**
- Node: `kubectl describe node`, node NotReady (kubelet/disk), CNI issues
- App: CrashLoop, ImagePull, OOM, Pending (again — ab full chain)
- Config: ConfigMap/Secret mount, stale pods, rollout stuck
- Incident mindset: alert -> isolate layer (node/cluster/app/dep) -> fix -> verify -> prevent

**LAB** — "broken cluster" challenge: 5 hidden issues, har ek ko dig karo.

**TICKETS**
- `INC-611 · Node NotReady` -> describe node -> kubelet stopped/disk pressure -> restart/free.
- `INC-612 · ConfigMap stale` -> env cached / mount not refreshed -> rollout restart.
- `INC-613 · Rollout stuck` -> `kubectl rollout status`, events -> maxUnavailable/readiness -> fix strategy.

**DONE WHEN** — kisi bhi pod/node issue ko investigative flow se solve karte ho, guess nahi.

---

# PHASE 5 — End-to-End Azure DevOps -> AKS Project (Day 28-30)

## Day 28 — Project Setup: Infra + App

**Project name:** `DeployTrack` (deployments track karne wala app + full DevOps infra).

- App: simple Flask/Node API + frontend (repo me).
- Terraform: RG, VNet, **ACR**, **AKS**, **Key Vault**, Log Analytics.
- Azure DevOps: org + project + repo + service connections (ACR + AKS via workload identity).
- Local dev: compose up, tests green.

**DONE WHEN** — infra code-push karta hai, 1 command me recreate hota hai.

## Day 29 — Project Build: CI/CD Pipeline

- Multi-stage pipeline: lint -> test -> docker build -> ACR push (commit-SHA tag) -> deploy dev -> approvals -> deploy prod.
- K8s manifests: Deployment + Service + Ingress + ConfigMap + Secret(from Key Vault CSI).
- Deployment: blue/green with Ingress weight switching.
- GitOps step: optionally point ArgoCD at gitops repo for prod.

**DONE WHEN** — push-to-main se prod tak zero-manual deployment.

## Day 30 — Project Verify + Operate + Document

- Monitoring: Azure Monitor alert (CPU/error rate), Log Analytics KQL dashboard, Grafana.
- Drill: bad V2 deploy -> health probe fail -> auto rollback -> postmortem.
- README: architecture diagram, pipeline proof, alert screenshots, incidents handled.
- Purana Naukri resume + portfolio GitHub public.

**DONE WHEN** — project ko koi bhi interview me 10 min me explain karte ho.

---

# PHASE 6 — Platform Engineering Track (Day 31-40)

> Ye Phase = DevOps se **Platform Engineer** banana — IDP, Backstage, DevEx, SRE, FinOps, Security.
> Yehi woh topics hain jo "5-saal experience" level par distinguish karte hain.

## Day 31 — Platform Engineering Fundamentals

**LEARN (full + latest)**
- Platform Engineering kya hai: paved-road / golden-path, IDP (Internal Developer Platform), internal cloud
- Platform as a Product (consumers = developers), API-first, self-service
- Drift reduction, cognitive load (CUP) for dev teams
- CNCF Platform Engineering maturity model; CNOE (CNCF) reference
- Platform team vs stream-aligned vs enabling teams (Team Topologies)

**LAB** — apne org ke liye "developer persona + frustrations + platform scope" 1-pager.

**DONE WHEN** — "IDP vs CI/CD tool vs portal" me farak explain.

## Day 32 — Backstage (IDP) Build

**LEARN (full + latest)**
- Backstage: Software Catalog, TechDocs, Scaffolder (templates), Plugins
- catalog-info.yaml, entities, System/Component/API, locations
- Scaffolder: template -> input -> files template -> action to GitHub/Azure
- Golden path template: microservice boilerplate + CI + Helm + monitoring links

**LAB** — Backstage install (container), catalog add 3 services, 1 template se new service na banao.

**DONE WHEN** — Backstage me 3 entities + 1 working scaffolder template.

## Day 33 — Self-Service IaC + Golden Path

**LEARN (full + latest)**
- Terraform module registry: versioned modules (AVM), reusability, golden modules
- Policy check: OPA/Checkov in CI, private module registry
- CAPE: Infrastructure-Provisioning flow; environment promotion (dev->qa->prod) as templates
- Cloud budgets/quotas first-class; cost-labels by default

**LAB** — "jira ticket -> plan -> deploy VM/app via club portal" mini-platform (module + pipeline + policy).

**DONE WHEN** — dev ko infra ka ticket bina console ke milta hai.

## Day 34 — DevEx + DORA Metrics

**LEARN (full + latest)**
- DORA four keys: deployment frequency, lead time, MTTR, change-failure rate
- Measure: Git provider APIs -> metrics dashboard (e.g., GitHub/Azure DevOps Analytics)
- DevEx: happiness, flow state, feedback cycles; DX Core 4
- Feedback loops: PR time, build time, environment wait time, on-call burden

**LAB** — apne repo ki DORA metrics nikalo (script se) + 2 improvement suggestions.

**DONE WHEN** — "deploy frequency = X, lead time = Y" bol sakte ho — numbers ke saath.

## Day 35 — GitOps at Scale

**LEARN (full + latest)**
- ArgoCD: apps, ApplicationSets, SyncPolicy, SyncWindows, notifications
- Flux: Kustomization, HelmReleases, OCIRepository, notification controller
- GitOps at scale: repo-per-env vs app-of-apps, multi-cluster, progressive delivery (Argo Rollouts / Flagger: canary + analysis)
- Secrets in GitOps: SOPS, sealed-secrets, ESO (External Secrets Operator)

**LAB** — multi-cluster (kind x2) ArgoCD, app-of-apps, canary w/ metrics gate, SOPS.

**DONE WHEN** — cluster crash -> GitOps se app auto-restored (self-heal prove).

## Day 36 — Multi-Cluster + Fleet Management

**LEARN (full + latest)**
- Why multi-cluster: isolation, DR, region, tenant
- Fleet patterns: hub-spoke, GitOps managers (Flux/ArgoCD), Cluster API, Fleet
- AKS Fleet Manager, azure-arc connected clusters, GitOps configs
- Multi-tenant to security: namespaces, NetworkPolicies, quota, tenant-level audits

**LAB** — 2 clusters ek GitOps manager se manage; failover demo (traffic switch).

**DONE WHEN** — cluster policy/security/backlog centrally enforce karte ho.

## Day 37 — SRE for Platforms

**LEARN (full + latest)**
- SLI/SLO/error budget; burn rate alerting; availability legend; risk (latency failures)
- SLO targets for platform services (CI uptime, deploy success rate, portal latency)
- Incident mgmt journey: detection -> triage -> mitigation -> resolution -> blameless postmortem -> action items
- On-call: rotations, playbooks, severity definitions, status pages

**LAB** — platform SLO doc (1 service ke liye) + 1 runbook + burn-rate alert kholo.

**DONE WHEN** — error budget exhaustion ka decision (freeze vs ship) justify karte ho.

## Day 38 — Advanced Observability (OpenTelemetry)

**LEARN (full + latest)**
- OTel: traces, metrics, logs (pillars), auto-instrumentation, SDKs/exporters
- Correlated signals: trace->log->metric; RED vs USE
- Prometheus/Grafana deep: PromQL, alerts, Grafana dashboards as code (jsonnet/dashboard-as-code)
- Trace sampling, cardinality control, tail-based sampling; Loki/Tempo

**LAB** — app ko OTel se instrument karo, traces->logs->metrics correlated, 1 dashboard-as-code.

**DONE WHEN** — "kahan kya hua" doosre ke help ke bina — telemetry se.

## Day 39 — FinOps + Platform Cost

**LEARN (full + latest)**
- FinOps lifecycle: Inform -> Optimize -> Operate (FINOS/CNCF)
- Cost observability: tags/labels, budgets+alerts per team/app/env, unit economics (cost per deploy, per user)
- Optimization: right-sizing, reservations (savings plans), spot, autoscale, idle cleanup
- Platform cost: chargeback/showback, target incentives

**LAB** — AKS cost view (kubecost/ARM cost analysis + labels), budget alert, idle resource report.

**DONE WHEN** — "ye app cost/hour kitna" calculate + plan batao optimize.

## Day 40 — Platform Security + Finishing Move

**LEARN (full + latest)**
- Zero trust: identity as boundary, workload identity, conditional access
- Supply chain: SBOM, SLSA, cosign (sign/verify), scanner gates (Trivy/Snyk), secrets scanning
- Policy: Kyverno/OPA (deny tags, limits, external images)
- Compliance: Azure Policy, Defender for Cloud, CRI (Container Runtime) Dashboard, ISO/NIST basics

**GRAM CAPSTONE** — ek "platform" demo: golden template + CI + GitOps + SLO + cost + security policy, saath documentation + 5-min demo exec-style.

**DONE WHEN** — portfolio me ek senior-platform story ready.

---

# APPENDIX A — Topic-wise Practice Bank (60 Tickets)

### Linux (10) — Day 1-7
1. CPU high (INC-101)  2. Disk full (INC-102)  3. Service down (INC-103)  4. Port conflict (INC-104)
5. SSH failure (INC-107)  6. Permission denied (INC-105)  7. Memory high (INC-106)  8. Process issue (INC-109)
9. Log investigation (INC-108)  10. DNS/network issue (INC-110)

### Git (5) — Day 3-4, 10
1. Merge conflict (INC-201)  2. Wrong branch (INC-202)  3. Secret committed (INC-203)
4. Revert deployment (INC-204)  5. PR conflict (INC-206)

### Docker (5) — Day 8-10
1. Container exits (INC-301)  2. Image build failure (INC-303)  3. Port issue (INC-302)
4. Network issue (INC-305)  5. Env var issue (INC-304)

### CI/CD (10) — Day 15-19
1. Pipeline trigger (INC-501)  2. Agent failure (INC-502)  3. Build failure (INC-503)  4. Dependency (INC-504)
5. Test failure (INC-505)  6. Env var (INC-506)  7. Docker build in pipeline (INC-507)  8. Artifact (INC-508)
9. Deployment failure (INC-509)  10. Secret failure (INC-510)

### Azure (10) — Day 11-14, 24
1. VM unreachable (INC-401)  2. NSG issue (INC-402)  3. Storage permission (INC-403)  4. DNS (INC-404)
5. Deployment failure (INC-405)  6. Service connection (INC-406)  7. RBAC (INC-407)  8. LB health probe (INC-408)
9. Monitor alert (INC-607)  10. Key Vault (INC-608)

### Kubernetes/AKS (12) — Day 21-27
1. CrashLoopBackOff (INC-601)  2. ImagePullBackOff (INC-602)  3. OOMKilled (INC-603)  4. Readiness probe (INC-604)
5. Service not accessible (INC-605)  6. Ingress (INC-606)  7. Node NotReady (INC-608)  8. ConfigMap (INC-609)
9. Rollout stuck (INC-610)  10. HPA (INC-704)

### Extras (8) — Day 20, 25-27
1. Rollback (INC-511)  2. Secret rotation (INC-512)  3. Terraform apply failed (INC-701)  4. State locked (INC-702)
5. State drift (INC-703)

---

# APPENDIX B — "5-Saal Experience" Distillation (Sr-Level Checklist)

Har phase ka **senior difference** — medium level engineer vs 5-saal engineer:

| Area | 1-saal engineer | 5-saal engineer |
|------|-----------------|-----------------|
| Tickets | "Command do, fix karo" | Root cause + prevent + postmortem |
| Deploy | Pipeline chalti hai to happy | Help check gates, rollback by design, blast radius |
| Linux | Commands yaad | `strace`, perf, cgroups, boot-kernel debug |
| Azure | Services pehchanta | Cost, RBAC, network architecture, identity design |
| K8s | pod debug | Cluster-level, multi-cluster, GitOps, capacity |
| Terraform | apply karta | Modules, state design, policy, platform | 
| Observability | Dashboards | SLOs, burn-rate, telemetry |
| Communication | Fix batata hai | DORA metrics, docs, playbooks, mentoring |

---

# APPENDIX C — Verification (Weekly Rubric)

- **Week 1 (D1-7):** Linux 20 commands, merge conflict, health-check script live, SSH debug 30s.
- **Week 2 (D8-14):** multi-stage image <150MB, compose full stack, VM+NSG via CLI, RBAC scope.
- **Week 3 (D15-20):** multi-stage pipeline dev->prod approvals, Key Vault secrets, rollback drill done.
- **Week 4 (D21-27):** pod debug 5 scenarios, Terraform remote state, HPA, 5-incident challenge.
- **Phase 6 (D31-40):** Backstage catalog + golden template, DORA numbers, SLO doc, cost report.

---

*Ye plan `CURRICULUM.md` (Day-wise concepts) + existing `day-NN-*.md` lab files ke saath pair karo.
Har day ka practice ticket = apni journey ka proof (GitHub pe documented). All the best! 🚀*
