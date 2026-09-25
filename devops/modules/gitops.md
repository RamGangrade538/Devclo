# 🔁 GitOps — Git as Source of Truth

> **Hinglish:** GitOps ka matlab: **Git repo = final authority**. Jo bhi config/architecture repo me likha hai, wahi cluster/cloud me hona chahiye — aur ek controller (Argo CD / Flux) ise **continuously reconcile** karta hai (drift milne pe auto-fix). Ab deploys koi SSH se nahi karta; PR merge = deploy.

## 📖 Overview — Ye Topic Kya Hai

Puraana deploy: logs kholo, kubectl apply karo, kaun janta tha kya change hua? **GitOps** isko seedha karta hai:
- **Git = source of truth** — desired state (Deployments, Services, configs) repo me YAML.
- **Declarative** — tum state likh dete ho, controller maintain karta hai.
- **Reconciliation loop** — agent (Argo CD/Flux) cluster reality ko repo se compare karta hai; mismatch pe auto-sync (selfHeal).
- **Pull-based deployment** — cluster khud repo se pull karta hai (no one has cluster creds locally — secure!).
- **Drift detection** — "kisi ne manually badal diya" → controller detect + align.

## 🟢 Beginner — Shuruaat yahan se

- Argo CD local cluster pe install karo.
- Ek **app repo** (config) banao — deployments/services YAML.
- Argo CD me App banao, sync (auto) karo.
- Devs change + PR → merge → deploy hote dekho.

## 🟡 Intermediate — Ab patterns banao

- **Application vs Environment repositories** — kaunsa config kahan.
- **Sync policies** — auto-sync, selfHeal, prune.
- **Rollbacks** — repo ke purane commit pe revert → cluster revert.
- **Multi-environment** — dev/stage/prod via separate branches or dirs.
- **App of Apps / ApplicationSets** — bade repo ka management.

## 🔴 Advanced — Pro bano

- **Progressive delivery ke saath GitOps** — canary/BlueGreen control.
- **Kustomize + Helm integration in Argo/Flux.**
- **Sealed Secrets / SOPS** — secrets bhi Git-safe.
- **Multi-cluster fleet management** — ek control se sab clusters.
- **GitOps for Terraform (Crossplane / TF controllers).**

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Git as source of truth** — desired state repo me hi hota hai.
- [ ] **Declarative infrastructure** — "kya" likho (state), controller execution.
- [ ] **Reconciliation** — controller desired vs actual compare + fix.
- [ ] **Desired vs actual state** — repo jo kehta hai vs jo hai.
- [ ] **Pull-based deployment** — cluster pull karta hai (secure, no push creds).
- [ ] **Drift detection** — manual changes controllers auto-fix karta hai.
- [ ] **Environment repositories** — per-env config separated.
- [ ] **Application repositories** — app specs config.
- [ ] **App of Apps** — root repo se bahut apps manage.
- [ ] **ApplicationSet** — kai clusters/envs pe apps generate.
- [ ] **Sync / Auto-sync** — config to cluster apply karna.
- [ ] **SelfHeal** — drift turant correct.
- [ ] **Prune** — repo se hata diya toh cluster me bhi delete.
- [ ] **Rollback by commit** — revert commit = revert cluster.
- [ ] **Argo CD** — K8s GitOps controller pop.
- [ ] **Flux** — CNCF GitOps tool (reconciliation).
- [ ] **Helm/Kustomize inside GitOps** — complex configs Git-able.
- [ ] **Sealed secrets / SOPS** — secrets encrypted repo me.
- [ ] **Access security** — pull model: cluster repo only; creds kam.
- [ ] **Git review = change approval** — PR review hi deployment gate.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Argo CD | K8s GitOps controller | App config Git se sync |
| Flux | GitOps toolkit (CNCF) | Timed reconciliation, multi-cluster |
| Kustomize | Config overlays | Env variants Git-friendly |
| Helm | Charts | Package complex apps |
| Sealed Secrets / SOPS | Encrypted secrets | Secrets safely in Git |
| Crossplane | GitOps for infra | Terraform-like IaC in K8s |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First GitOps App:** Local cluster pe Argo CD, ek app repo sync karo (manual + auto).
- [ ] **Lab 2 — SelfHeal Demo:** Cluster me pod imagen manual change karo/delete karo — controller use fix karte dekho.
- [ ] **Lab 3 — Rollback Drill:** Bad commit push karo, repo me revert karo, cluster rollback hote dekho.
- [ ] **Lab 4 — 2 Env Pattern:** dev + prod apps same repo ke different dirs me sync karo.
- [ ] **Project — Full GitOps Flow:** App repo + config repo + PR review + auto-sync selfHeal + rollback = mini internal platform.

## 🔗 Related Topics

- [🚢 Kubernetes](../modules/kubernetes.md)
- [🐳 Docker & Containers](../modules/docker-containers.md)
- [🛠️ Platform Engineering](../modules/platform-engineering.md)
- [GitOps: ArgoCD & Flux](../topics/gitops-argocd.md)
- [Day 32 — GitOps: ArgoCD & Flux](../day-32-gitops-argocd-flux.md)