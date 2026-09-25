# Deep Dive: GitOps — ArgoCD & Flux, Declarative Delivery Done Right

> **Standalone deep dive:** Git = single source of truth; operator (ArgoCD/Flux) cluster ko Git ke desired state pe continuously sync karta hai. Manual `kubectl atax` = khaatarnaak.

---

## 1. GitOps — Core Principles (the "5 Ws")

| Principle | Meaning |
|-----------|---------|
| **Declarative** | Whole system described in Git (infra + config + policy) |
| **Git = source of truth** | Desired state versioned, reviewed (PR), audited (log) |
| **Automated sync** | Operator reconciles cluster → Git (no human clicks) |
| **Continuous reconciliation** | Drift detected + corrected (self-heal) |
| **Observability + verification** | Health checks, sync status, feedback loops |

**Mental model:** Git is the **control plane of the cluster's config**. Day-to-day ops = merge PRs; rollback = revert PR; audit = git history.

---

## 2. Pull vs Push — Why GitOps Wins Security

```
PUSH model (traditional):                        PULL model (GitOps):
CI has cluster credentials ------------>        Cluster has Git READ access only
│                                              │
kubectl apply (CI token = WRITE)               ArgoCD/Flux polls git (SENTINEL READ)
│                                              │
If CI/agent compromised → attacker             If cluster compromised → attacker
can deploy ANYTHING (full write)               CANNOT write to Git — no backdoor
```
- CI never gets cluster **write** creds; ArgoCD/Flux holds a ro token scoped to git
- Git repo protected separately: branch protection + signed commits + code review
- Multi-cluster from one Git — no per-cluster admins

---

## 3. Core Concepts (ArgoCD & Flux side by side)

| Concept | ArgoCD | Flux |
|---------|--------|------|
| Core CR | `Application` | `GitRepository` + `Kustomization` |
| **Source** | `source: repoURL/path/targetRevision` | GitRepository.point at repo + branch |
| **Sync** | `syncPolicy.automated` (prune, selfHeal) | Kustomization.prune + reconcileInterval |
| **Rollback** | Revert Git commit (or `rollback`) | Revert Git commit |
| **Multi-app** | App-of-Apps (Application children) + ApplicationSets | Kustomization per env; HelmReleases |
| **Secrets** | SealedSecrets / SOPS+kms | SOPS (natively built-in) |
| **UI** | Excellent (web UI) | CLI + tekton UI; optional web |
| **Health** | Node/Deployment resource state → health bars | kstatus/native |
| **Drift** | selfHeal diffs desired=continuous | Prune + drift detection |

**ArgoCD object:** `Application` = { source (git/path/branch) → destination (cluster+ns) + syncPolicy }.
**Flux object:** `GitRepository` (source) + `Kustomization` (how to apply: path, previous, prune, dependsOn).

---

## 4. ArgoCD Deep — App, Project, Sync, Health, Notifications

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-prod
spec:
  project: production                    # RBAC-scoped project
  source:
    repoURL: https://github.com/x/gitops-repo
    targetRevision: main
    path: apps/myapp/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp
  syncPolicy:
    automated:
      prune: true                        # remove deleted resources
      selfHeal: true                     # revert manual drifts
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
  health: {}                              # health checks
```

```bash
# CLI
argocd app create myapp-prod --repo <git> --path apps/myapp/overlays/prod --dest-namespace myapp --dest-server https://kubernetes.default.svc
argocd app sync myapp-prod            # force sync
argocd app get myapp-prod             # status + health
argocd app diff myapp-prod            # see drift
argocd app rollback myapp-prod 3      # rollback to revision 3
argocd appset list                    # ApplicationSets (per-env generator)
```

**App-of-Apps** pattern (repo of repos):
```
argocd/
├── bootstrap.yaml   # the "app of apps" — children
├── apps/
│   ├── app-dev.yaml
│   ├── app-prod.yaml
└── ...
```
```bash
# ApplicationSet — git generator produce an Application per env in ./envs/*/
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: myapps }
spec:
  generators:
    - git:
        repoURL: https://github.com/x/gitops-repo
        revision: main
        directories:
          - path: envs/*
  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/x/gitops-repo
        targetRevision: main
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
```

---

## 5. Deployment Strategies via GitOps

| Strategy | Git change needed | Downtime |
|----------|-------------------|----------|
| **Rolling update** | image tag update | 0 |
| **Blue-green** | switch `service → blue/green selector` | 0 |
| **Canary (Istio/Argo Rollouts)** | change weighted dest (VirtualService/rollout) | 0 |
| **Recreate** | change replicaSet tag (dev) | brief |

**Argo Rollouts** (blue-green & canary natively): a `Rollout`-type CR injected into deployment, with `AnalysisTemplate`; it runs canary metrics (e.g., Prometheus) and auto-promotes/aborts.

---

## 6. Secrets in GitOps — 3 Approaches

| Approach | How | Honest trade-off |
|----------|-----|------------------|
| **Sealed Secrets** | seal on push to repo → controller unseals in-cluster | Controllers in cluster decrypt (key stays in cluster) |
| **SOPS + age/KMS+Vault** | file stored encrypted; decrypted at sync (Kustomization `decryption.provider: sops`) | Key in KMS/Vault; Git stays readable-safe |
| **External Secrets (ESO)** (Day 35) | store secret ref in Git; value fetched from KV at runtime | Recommended when you have KV |

```yaml
# SOPS decrypt at sync (Flux)
kind: Kustomization
metadata: { name: apps }
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age
```
```bash
sops -e --age <pubkey> secrets.yaml > secrets.enc.yaml   # commit this
```

---

## 7. Multi-Environment + Multi-Cluster Management

```yaml
# ArgoCD Applications per env (or ApplicationSet generator)
- apps/prod:  kustomization overlays/prod → cluster-prod (via cluster secret / argo node)
- apps/staging: overlays/staging → cluster-staging
Flux: one GitRepository + multiple Kustomizations with dependsOn
```
**Cluster management at scale**: ArgoCD "managed 100 clusters" via HTTPS cluster creds registered in Argo; across clouds (AKS/EKS/GKE) — one pane + one GitOps repo. Combined with **GitOps multi-cluster registry** (fleet pattern) for version policy.

---

## 8. Real-World Industry Pattern — "GitOps Delivery at scale"

```
Release flow (e.g., 3-tier on 3 clusters):
1. Developer merges PR (code) → CI builds + tests + scans + signs → pushes image (Day 48)
2. CI updates manifest image-tag in gitops-repo for staging (or auto)
3. ArgoCD/Flux sees change → auto-sync → staging deploy
4. QA passes → same commit update in prod branch (or ApplicationSet new path)
5. Prod cluster syncs; ArgoCD health green; Kanary (if canary) gradual
6. Rollback = `git revert ./apps/prod` → auto rollback (selfHeal) → cluster back
7. Every release = merge request + audit log — compliance easy (evidence)
```

---

## 9. Interview Questions — GitOps

| Question | Strong answer |
|----------|---------------|
| "GitOps kya hai?" | Git = desired state; operator continuously reconciles cluster to it. PR=deploy, revert=rollback, log=audit. Pull model. |
| "ArgoCD vs Flux?" | Both do same; ArgoCD has richer UI + App-of-Apps + ApplicationSet; Flux integrates SOPS natively and is lighter; choose by team workflow. |
| "Pull vs Push?" | Push gives CI/agent cluster write creds (attack surface). Pull: cluster agent only READs Git; Git PR/mech protects writes. |
| "selfHeal kya?" | Operator resets cluster to Git state even if someone manually edited resource — drift removed (unless sync revert). |
| "Secrets kahan store karein GitOps me?" | SOPS-encrypted (age/KMS), SealedSecrets, External Secrets → KV at runtime. Value kabhi plaintext me Git me nahi. |
| "Rollback kaise?" | Revert/Rollback commit → sync reintroduces previous state (immutable tag = reliable). |
| "Multi-env kaise manage?" | Overlays per env (kustomize) + per-env Application (or ApplicationSet generator) pointing to separate clusters/namespaces. |
| "Argo Rollouts kya?" | Canary & blue-green deployment via `Rollout` CR with metrics-based promotion (AnalysisTemplate). |
| "Cluster compromised how impact?" | Agent can read git + apply — no write to git; OpSec prevents creds there; once detected → revoke, kill agent, redeploy from git. |

**Related:** [Day 32](../day-32-gitops-argocd-flux.md) · [Policy as Code](../topics/policy-as-code.md) · [Secrets](../topics/secret-management.md) · [Multi-cloud](../topics/multicloud-patterns.md)