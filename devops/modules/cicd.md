# ⚙️ CI/CD — Pipelines, Build, Test, Deploy

> **Hinglish:** CI/CD wo engine hai jo "code likha" se le kar "production me live" tak ka pura journey **automate** karta hai. Ye module pipeline concepts (jobs, stages, artifacts, secrets) + major tools (GitHub Actions, Jenkins, GitLab CI, Azure DevOps, Argo CD) cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Manual deploy = slow + error-prone. **CI (Continuous Integration)** = jab bhi code push/merge ho, automatically **build + test** chalao — issue jaldi pakdo. **CD (Continuous Delivery/Deployment)** = ready software ko **automatically release/deploy** karo — ideally without manual button.

Ek **pipeline** in sab steps ka automation hai: source se code uthao → build karo → test karo → package karo → artifacts store karo → deploy karo → sample/verify. Har step **isolated** chalta hai (agent/runner me), taaki reproducible ho. Pipeline bhi **code** hai (`.github/workflows`, `Jenkinsfile`, `.gitlab-ci.yml`, `azure-pipelines.yml`) — git me versioned, review hoti hai.

## 🟢 Beginner — Shuruaat yahan se

- Pipeline ki "journey" samjho: build → test → package → release → deploy.
- GitHub Actions pe pehli pipeline — `.github/workflows/ci.yml`.
- Jobs vs stages — parallel job vs sequence stages kya hoti hai.
- `echo`/`run` steps, logs dekhna, manual run/retry.

## 🟡 Intermediate — Real pipelines likho

- **Env vars & secrets** — config alag, secrets encrypted.
- **Triggers** — push, PR, schedule (cron), manual `workflow_dispatch`.
- **Artifacts** — build ke output ko store karke next job/night use karo.
- **Approval gates** — production deploy se pehle manual approve.
- **Parallel jobs + caching** — speed up build.
- **Matrix builds** — multiple OS/versions pe run.

## 🔴 Advanced — Pro bano

- **Deployment strategies in pipeline** — blue-green, canary, rolling.
- **Packaging + versioning** — docker image `sha`/`tag`, semver, SBOM attach.
- **Security in pipeline** — secret scanning, SAST/SCA steps, supply-chain (SLSA).
- **GitOps CD** — Argo CD/Flux (repo = source of truth), sync policies.
- **Self-hosted runners/agents** — on-prem compute, labels.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Pipeline** — automated steps jo code ko shippable banati hain.
- [ ] **Jobs** — ek independent work unit (build job, test job).
- [ ] **Stages** — jobs ka logical sequence (build → test → deploy).
- [ ] **Agents/runners** — jaha pipeline ka kaam chalta hai (VM/container).
- [ ] **Artifacts** — build ke generated files (binaries, images) jo aage use hote hain.
- [ ] **Build** — source code se runnable/package banana.
- [ ] **Test** — automated tests (unit, integration, e2e) pipeline me.
- [ ] **Package** — build output ko versioned artifact (npm pack, docker build).
- [ ] **Release** — tested artifact ko publish/ready-mark karna.
- [ ] **Deployment** — artifact ko environment me live karna.
- [ ] **Approval gates** — sensitive stages pe manual/auto approval.
- [ ] **Environment variables** — pipeline configs (paths, options).
- [ ] **Secrets** — passwords/tokens pipeline vaults me, never in yaml plaintext.
- [ ] **Pipeline triggers** — push/PR/schedule/tag — kab pipeline chale.
- [ ] **Webhooks** — external events pipeline ko jalana (e.g., repo event).
- [ ] **Parallel jobs** — independent jobs ek saath chalao; fast.
- [ ] **Pipeline caching** — deps cache karo taaki rebuild fast ho.
- [ ] **Deployment strategies** — kaise deploy karna hai (rolling, canary…).
- [ ] **CI vs CD** — CI = integrate+test; CD = release+deploy delivery.
- [ ] **GitHub Actions YAML** — `.github/workflows/*.yml`.
- [ ] **Jenkinsfile** — pipeline-as-code Jenkins syntax.
- [ ] **GitLab CI** — `.gitlab-ci.yml`; runners, stages, rules.
- [ ] **Azure Pipelines** — YAML/multi-stage, environments/gates.
- [ ] **Argo CD / Flux** — GitOps based CD for Kubernetes.
- [ ] **Retry & failure handling** — failed step retry, continue-on-error.
- [ ] **Timeouts & concurrency** — stuck jobs se bachna, race avoid.
- [ ] **Dependency caching strategies** — lockfiles, layer cache.
- [ ] **SBOM in pipeline** — build ke saath dependency list attach karna.
- [ ] **Policy/manual gates** — production ka access control.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| GitHub Actions | Cloud CI/CD + YAML | GitHub repos ke liye default |
| Jenkins | Self-hosted orchestrator | Custom/enterprise setups |
| GitLab CI | Built-in pipelines | GitLab me sab kuch |
| Azure DevOps Pipelines | YAML + MS ecosystem | Azure + Windows teams |
| Argo CD / Flux | GitOps CD | Kubernetes delivery |
| jq / shell / docker | Pipeline helpers | Steps me actual kaam karne ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Hello Pipeline:** GitHub Actions me simple CI banai jo source lint + test kare.
- [ ] **Lab 2 — Artifact Flow:** Build job se artifact store karo, deploy job me download karo.
- [ ] **Lab 3 — Secrets + Env:** Secrets store karo, `printenv` me mask check karo, env-specific config banao.
- [ ] **Lab 4 — Parallel + Cache:** Matrix over node/python versions, dependencies cache lagao, timing compare karo.
- [ ] **Lab 5 — Approvals + Trigger:** Production job me manual approval gate + `workflow_dispatch` trigger lagao.
- [ ] **Project — Mini Delivery Pipeline:** Src → test → docker build → push → canary deploy ka end-to-end pipeline banao.

## 🔗 Related Topics

- [🚀 Deployment Strategies](../modules/deployment-strategies.md)
- [📦 Artifact & Package Management](../modules/artifact-package-management.md)
- [🛡️ DevSecOps](../modules/devsecops.md)
- [CI/CD vs CD Explained](../topics/cicd-explained.md)
- [GitHub — Actions & Collaboration Hub](../topics/github-actions-deep.md)
- [Day 8 — CI/CD Concepts & Pipelines](../day-08-cicd-concepts-and-pipelines.md)
- [Day 9 — GitHub Actions](../day-09-github-actions.md)
- [Day 10 — Jenkins Pipeline](../day-10-jenkins-pipeline.md)