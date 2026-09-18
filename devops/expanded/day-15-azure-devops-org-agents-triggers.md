# Day 15 — Azure DevOps Org, Agent Pools & Triggers (DevClo Expanded)

## Overview | Parichay

Azure DevOps ka asli track yahan se shuru hota hai. Aaj tumhare paas ek strong **structure** banega: karma ka karni wala org + project + repo, pipeline kon-si **machine (agent)** par chalega, aur pipeline **kab chalegi (triggers)**. Ye foundation clear hua to aage ke 5 din (CI, secrets, Docker, CD, rollback) sab isi ke upar khade honge. Day 8 waala CI/CD concept ab real tool me convert hoga.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Azure DevOps ki services samjho: Boards, Repos, Pipelines, Artifacts, Test Plans
- [ ] Org → Project → Repo → Branch ki hierarchy create karo
- [ ] GitHub repo ko Azure Pipelines se connect karo (both directions)
- [ ] Agent pools samjho: Microsoft-hosted vs Self-hosted vs **Managed DevOps Pools**
- [ ] CI triggers likho: branch filters, path filters, PR triggers, schedules
- [ ] Pipeline triggers (pipeline ke pool kiya hua pipeline) + webhooks use karo
- [ ] Variables aur variable groups me fark samjho, secret `$()` syntax seekho
- [ ] Permissions ka map banao: repo, pipeline, approvals, project admin
- [ ] `az devops` CLI se org/project manage karo
- [ ] FREE tier me first YAML pipeline chalake 2-env skeleton banao

---

## Full Topic (LEARN) | Puri Detail

### 1. Azure DevOps Kya Hai — 5 Services Ka Suit

Ek hi platform par poori DevOps toolchain. Har service ki apni job:

| Service | Kaam | Day |
|---------|------|-----|
| **Azure Boards** | Backlog, sprints, Kanban (agile planning) | — |
| **Azure Repos** | Git repos (GitHub jaise, private free) | Aaj |
| **Azure Pipelines** | CI/CD, YAML ya classic editor | Day 16+ |
| **Azure Artifacts** | Pakage feeds (npm/nuget), Universal Packages | Day 18 |
| **Azure Test Plans** | Manual + exploratory testing | — |

**Hierarchy (2026):** Azure DevOps **Organization** (aapka tenant-level container, billing isi par) → **Project** (team ka workspace) → **Repos/Pipelines/etc.** sab project ke andar. Ek admi ko FREE tier me **5 orgs**, har org me unlimited private projects + Pipelines ka **1800 min/month Microsoft-hosted** free minate milte hain — practice ke liye perfect.

### 2. Org + Project Create (CLI + Portal)

Portal: `dev.azure.com` → Create organization → Create project. CLI se bhi (2026-standard):

```bash
az login
az devops configure --defaults organization=https://dev.azure.com/YourOrg project=DevCloProj
az devops project create --name DevCloProj --source-control git --visibility private
az repos create --name my-ci-app --organization https://dev.azure.com/YourOrg
# YAML pipeline banao (repo me azure-pipelines.yml)
az pipelines create --name "CI-Build" --repository-type tfsgit --yaml-path azure-pipelines.yml
```

### 3. GitHub Se Connection

Do raaste hain — dono real production me istemal hote hain:
- **GitHub <-> Azure Pipelines:** `dev.azure.com` me **Project Settings → Pipelines → Service connections → GitHub**. GitHub app install karte ho (OAuth/integration), phir cloud-hosted pipelines GitHub repos ke commits par trigger ho sakti hain.
- **GitHub Actions se ADO:** koi rok nahi — GitHub repo me `azure-devops` CLI tasks bhi chal sakte hain (dono CI/CD engines ek saath).
- **Service connections (pura detail Day 19):** Pipelines ko Azure subscription/AKS/ACR se jodne ka bridge. 2026 me **workload identity federation** preferred hai — SPN ki jagah short-lived tokens, no long-lived secrets.

### 4. Agents: Pipeline Kahan Chalegi

Pipeline kisi virtual machine par chalti hai. Woh machine = **agent**.

| Type | Kya hai | Pros | Cons |
|------|---------|------|------|
| **Microsoft-hosted** | Azure ka prebuilt VM (~2GB disk, common tools pre-installed) | Setup 0, scale auto, free min | No custom tools, shared infra, 30 min/job |
| **Self-hosted** | Apni VM/on-prem, agent software install | Full control, corporate network access, caching persistent | Tumhe patch/scale karna, machine up rahni chahiye |
| **Managed DevOps Pools** | Microsoft-hosted **custom** agents (2023+, GA) | Custom image, pre-warm VMs, auto-scaling, apne Azure subscription me | Slight cost |

Agent kya chahiye batana: `pool:` block me. Free tier me `ubuntu-latest` default:

```yaml
pool:
  vmImage: ubuntu-latest            # Microsoft-hosted
# --- ya ---
pool:
  name: my-lockerrunners.pool       # self-hosted / Managed DevOps Pool
  demands: - agent.os -equals Linux
```

**2026 note:** Microsoft-hosted images ab YAML me `-windows` tags (e.g. `windows-latest-2026`) ke sath rolling updates aate hain. Pin karna ho to exact `ubuntu-26.04` image bhi de sakte ho. Managed DevOps Pools = "Azure-hosted agents bilkul apne jaise, kharche + Azure subscription me".

### 5. Triggers — Pipeline Kab Chalegi

Har trigger ka alag use-case hai. Ye portion interview me eliye important + INC-501 ticket isi par based hai.

```yaml
trigger:                          # CI trigger — branch + path filters
  branches:
    include: [main, develop, "release/*"]
    exclude: ["feature/experiment-*"]
  paths:
    include: [src, "*.md"]        # sirf in paths me change par chale
    exclude: [docs, *.md]
```
- **CI trigger (default):** `trigger:` ki blog ke saath nayi commit push hote hi pipeline chalti hai. Bina trigger ke default = main branch. `none` write karke band kar sakte ho.
- **PR triggers:** `pr:` block PR khulte/update hote hi build. **Batch** push (`batch: true`) chaal sakte ho taaki multiple commits se ek hi build chale.
- **Schedules:** cron `cron: "0 2 * * *"` + `timezone: "Asia/Kolkata"` + `branches:`. Midnight nightly build rate-liye common.
- **Pipeline triggers:** kisi doosri pipeline ke khatam hone par chalo (`resources.pipelines.pipeline` + `trigger: none` tarah ka pipeline gejas use ho sakta hai).
- **Webhooks:** GitHub webhook → Azure Pipelines; ya kisi doosri system (e.g. app ya ticket) se REST API se run trigger.

### 6. Variables — Values Aur Secrets

| Cheez | Syntax | Matlab |
|-------|--------|--------|
| **Macro/compile-time** | `$() ` | Runtime par text-replacement. Secret me bhi use hota hai |
| **Template/compile-time** | `${{ }}` | Pipeline **compile hote waqt** evaluate — matlab value tab hi lock ho jati hai |
| **env: mapping** | `env: MY_VAR: $(var)` | Environment variable ko task/script me bhejo |
| **Variable groups** | Library saudagar se linked | Multiple pipelines me same vars; secrets store karta hai |
| **Azure CLI/Key Vault linked** | Type: Key Vault | KV secret <- variable group <- `$(secret)` (Day 17/20) |

```yaml
variables:
  buildNumber: $[counter(variables['Build.BuildId'], 0)]   # runtime expression
  appName: 'devclo-app'
  ${{ if eq(variables['Build.SourceBranchName'], 'main') }}:   # compile-time if
    envName: 'prod'
- group: shared-vars          # library variable group
```

### 7. Permissions Map

| Resource | Permissions | Kiske paas |
|----------|-------------|------------|
| Repo | Read, Contribute, Branch protection | Users, Sorga builders |
| Pipeline | View, Queue, Edit, Administer, Approvals | Project admin + Guardians |
| Environments | View, Manage approvals, Manage gates | Release manager (Day 19) |
| Variable groups | View, Administrator, User | Ops/security |
| Project | Admin/Contributor/Reader roles | Admins team lead |

---

## Sample Pipeline | Trigger Filters Demo

```yaml
# azure-pipelines.yml — Day 15: trigger filters ka demo
# Hinglish comments: har trigger category ko try karo.

trigger:                              # CI trigger — hamesha top par
  branches:
    include:
      - main
      - develop
      - "release/*"
    exclude:
      - "feature/experiment-*"
  paths:
    include:
      - src
      - azure-pipelines.yml           # pipeline file change par bhi chale
    exclude:
      - docs
      - "*.md"

pr:                                   # PR trigger — pull request build
  branches:
    include: [main]
  autoCancel: true

schedules:                            # nightly build — Indian time
  - cron: "0 2 * * 1-5"               # Mon-Fri 2:00 AM UTC
    displayName: Nightly-build
    branches:
      include: [main]
    always: true                      # koi change nahi phir bhi chale

pool:
  vmImage: ubuntu-latest

variables:
  envName: dev

steps:
  - script: |
      echo "Trigger type: $(Build.Reason)"          # IndividualCI / PullRequest / Schedule...
      echo "Source branch: $(Build.SourceBranch)"
      echo "Build ID: $(Build.BuildId)"
      echo "Commit SHA: $(Build.SourceVersion)"
    displayName: "Show build context"
  - script: echo "Pipeline ready. Kal: CI build + test + artifact"
    displayName: "Self-check"
```

**Try karo:** 1) `docs/readme.md` me push karo → pipeline NAHI chalni chahiye (path exclude). 2) `src/app.js` me push karo → pipeline chalti hai. 3) `develop` par push → trigger include. Ye hi INC-501 ka asli test hai.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command/Task | Kaam |
|--------------|------|
| `az devops configure --defaults organization=... project=...` | Default org/project set karo |
| `az devops project create --name DevClo --visibility private` | Project banao |
| `az repos create --name my-app` | Repo banao |
| `git remote add origin https://dev.azure.com/<org>/<proj>/_git/<repo>` | Azure Repo se connect |
| `az pipelines create --name CI --yaml-path azure-pipelines.yml` | YAML pipeline register |
| `az pipelines run --name CI` | Pipeline manually chalao |
| `az pipelines runs show --id <runid>` | Run ka status |
| `az repos ref list` | Branch/tag list (trigger branch verify) |
| `~/myagent/run.sh` | Self-hosted agent shuru |

---

## Practice Lab | Abhi Karein

1. `dev.azure.com` par FREE tier org banao (naam: `devclo-<yourname>`).
2. Project banao: name `DevCloProj`, visibility **private**, source-control **Git**.
3. `az devops configure` se CLI ko isi org/project par point karo.
4. Azure Repos me ek repo banao (`my-ci-app`), locally connect karke `src/app.js` + `azure-pipelines.yml` push karo.
5. Upar wala Sample YAML pipeline create karo (`az pipelines create`).
6. `docs/readme.md` me ek line add karke push karo → run **nahi** chale — verify.
7. `src/app.js` me change push karo → run chale, logs me trigger type dekho.
8. `develop` branch banao, push karo → run chale (trigger includes develop).
9. Schedule ke liye azure-pipelines.yml me cron block add karke push karo, web UI me "Schedules" tab check karo.
10. Library (variable groups) me ek group `shared-vars` banao with `appName=devclo`, apne pipeline me `- group:` se include karo aur `$(appName)` print karo.
11. Self-hosted agent optional: `az pipelines agent pool create --name mypool --type private` + agent download/run karke pool online dikhao.
12. **Expected result:** 20 min me koi bhi repo de do, pipeline trigger configure + verify ho; CLI se full org manage ho.

---

## Incidents / Tickets | Real Practice

### INC-501 · Pipeline Not Triggering
- **Situation:** Developer pushed code to `develop` branch lekin CI build chala hi nahi. Ye chuppi production deploys ko rok rahi thi.
- **Investigate:**
  ```bash
  az pipelines runs list --status completed --top 10 -o table   # kya last run?
  az pipelines show --name CI -o json --query '[trigger,pipeline}'  # trigger config
  git branch --show-current && git rev-parse --short HEAD        # kaunsa branch/commit
  ```
  Web: Pipeline → check **"Last run config"** aur repo ke "Branches" aur YAML trigger block padho.
- **Root cause:** Pipeline ka `trigger:` block **main** par likha tha `(branches: include: [main])`, jabki commit `develop` par hua. Path filter se bhi ho sakta tha (code `src/` feel path me `apps/` me tha).
- **Fix:** Trigger me `develop` add karo:
  ```yaml
  trigger:
    branches:
      include: [main, develop]
    paths:
      include: [src, azure-pipelines.yml]
  ```
- **Verify:** `develop` par push karo → Pipeline Runs me naya run turant dikhe (IndividualCI reason). `az pipelines runs list` me entry confirm.
- **Blast radius | Prevent:** Trigger nahi chalna = stale code qa/prod me jayega (bad deploy risk). Hamesha `Build.Reason` log karo, CI ko repo event se uttejana do (webhook verify), aur release branch list + trigger block ko ek hi jagah (`trigger.yaml`) version karo taki drift na ho. "Notification dene ka kaam trigger, nahi to koi reminder nahi manenge."

### INC-502 · Agent Offline / Missing
- **Situation:** Pipeline "No agent could be found in pool 'mypool'...." error de rahi hai. Dev team ke builds ruk gaye.
- **Investigate:**
  ```bash
  az pipelines agent pool list -o table
  az pipelines agent list --pool-name mypool -o table     # enabled? status: online/offline
  systemctl status vstsagent*                             # self-hosted agent service
  journalctl -u vstsagent* -n 50                          # agent logs
  ```
- **Root cause:** Self-hosted agent ka VM reboot ho gaya tha aur service auto-start disabled thi; ya Microsoft-hosted quota **1800 free min/month** khatam ho gayi thi `(az devops pipelines` billing check).
- **Fix:** Service enable karo: `systemctl enable --now vstsagent.<org>.<pool>.<name>`; ya pool YAML me `vmImage: ubuntu-latest` (MS-hosted) par switch/validate; quota khatam ho to billing plan badhao ya Managed DevOps Pools par migrate karo.
- **Verify:** `az pipelines agent list --pool-name mypool` → `status: online`, phir manual run `az pipelines run --name CI` → green.
- **Blast radius | Prevent:** Whole org ke CI/CD ruk sakte hain — single point of failure. Agent ko systemd service + health-check (agent ka heartbeat API) se monitor karo, self-hosted agents ko at-least 2 racks pe daalo, aur Managed DevOps Pools me auto-scale + pre-warm VMs use karo to 0 maintenance + guaranteed pooled capacity.

---

## Interview Corner | Sawal-Jawab

1. **Q: CI trigger aur PR trigger me kya farak hai?** A: CI trigger `push` par chalta hai (commit ke baad), PR trigger `pull request` khulne/update par (code review ke pehle build). Dono `trigger:` aur `pr:` blocks se control hote hain, `autoCancel` se purani PR builds cancel kar sakte ho.
2. **Q: Microsoft-hosted vs self-hosted agent — kaunsa kab?** A: Microsoft-hosted = zero-maintenance, pre-tools, common build ke liye; self-hosted/Managed DevOps Pools = proprietary toolchains, corporate network/VNet access, persistent caches, and hardware-level builds karne ho tab.
3. **Q: `$(var)` aur `${{ var }}` me kya farak hai?** A: `$()` runtime par text-substitution hota hai (value execution waqt milti hai, secrets ko bhi demand kar sakte ho); `${{ }}` compile-time par evaluate hota hai — matlab pipeline YAML parse hote hi value lock. Compile-time logic (`${{ if eq(...) }}`) template branching ke liye use hota hai.
4. **Q: Variable group me secret kaise store karta hai?** A: Library → Variable group → "secret" toggle. Secret variables logs me kabhi nahi aate (masked), aur sirf `$()` reference se use hote hain. Variable groups pipelines ke beech shared vars ka ek riy-set hain.
5. **Q: Pipeline kab trigger nahi hoti? (silent failure)** A: Branch/commit mismatch, path exclude me code hona, `trigger: none` hona, webhook/service connection invalid hona, ya repo ki branch protection me yaml block. Debug: `az pipelines runs list` + trigger block review + manual `az pipelines run` to isolate trigger vs code issue.

---

## Quick Notes | Yaad Rakhna

- Hierarchy: **Org → Project → Repo → Branch → Pipeline** — fixed chain.
- Har pipeline ek **agent** par chalti hai: Microsoft-hosted / self-hosted / Managed DevOps Pools.
- Trigger = **branch filters + path filters + PR + schedule + pipeline + webhook** — sab combine kar sakte ho.
- Path filter aapki superpower hai: sirf changed code ke liye build (monorepo me zaroori).
- `$()` runtime, `${{ }}` compile-time — secret logs me mask, print kabhi mat karo.
- Variable groups Library se share hote hain; Key Vault linked group = premium (Day 17).
- Permissions hamesha **least privilege** — approver alag role, viewer alag role.