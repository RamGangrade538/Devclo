# Day 35 — GitOps at Scale (DevClo Expanded — Platform Engineering)
## Overview | Parichay

GitOps = git declared state, operator syncs cluster, drift auto-heals. Aaj ise **scale** karte hain: single app se **hazaron apps, multiple clusters**. ArgoCD (apps, ApplicationSets, SyncPolicy, SyncWindows, notifications) aur Flux v2 (Kustomization, HelmRelease, OCIRepository) dono flesh mein. App-of-apps, multi-cluster, progressive delivery (Argo Rollouts + Flagger canary gui), aur secrets in GitOps (SOPS, SealedSecrets, ESO). Real manifests + commands. 5-saal wala difference: "cluster crash → app auto-restored" prove kar sakte ho.
## What You'll Learn | Aaj Ki Seekh

- [ ] ArgoCD core: app, project, repo, sync, health
- [ ] ApplicationSet — declarative multi-app/multi-cluster
- [ ] SyncPolicy (auto + self-heal + prune) aur SyncWindows
- [ ] Notifications — ArgoCD notifications controller
- [ ] Flux v2: GitRepository, Kustomization, HelmRelease, OCIRepository
- [ ] App-of-apps pattern — git se pura cluster restore
- [ ] Progressive delivery: Argo Rollouts + Flagger canary analysis
- [ ] Secrets: SOPS, SealedSecrets, ESO (External Secrets Operator)
- [ ] Multi-cluster (hub-spoke) scaling
- [ ] Real bootstrap: kind + ArgoCD, sync app, self-heal demo
## Full Topic (LEARN) | Puri Detail
### 1. ArgoCD — pillars

```bash
kind create cluster --name argocd
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.0.0/manifests/install.yaml
kubectl port-forward svc/argocd-server -n argocd 8080:443
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```
**Application** (declarative — canonical way):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: payment-api, namespace: argocd }
spec:
  project: default
  source: { repoURL: https://github.com/myorg/gitops.git, targetRevision: main, path: apps/payment-api }
  destination: { server: https://kubernetes.default.svc, namespace: payments }
  syncPolicy:
    automated:
      prune: true          # git se hataya = cluster se hataya
      selfHeal: true       # drift revert instantly
    syncOptions: [CreateNamespace=true, ServerSideApply=true]
    retry: { limit: 5, backoff: { duration: 5s, factor: 2 } }
```
**SyncWindow** — prod pe deploy block: `syncWindows: [{ kind: deny, schedule: "0 0 * * 1", duration: 8h }]`

**Notifications** (Application annotation + ConfigMap):
```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: argocd-notifications-cm, namespace: argocd }
data:
  service.slack: { token: $slack-token }
  template.on-sync-failed: |
    message: 'App {{.app.metadata.name}} sync FAILED — {{.app.status.health.status}}'
# Application annotation:
#   notifications.argoproj.io/subscribe.on-sync-failed.slack: prod-alerts
```
### 2. ApplicationSet — many apps, one spec

`apps/*` folder = ek Application, auto-generated:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: team-apps, namespace: argocd }
spec:
  goTemplate: true
  generators:
    - git:
        repoURL: https://github.com/myorg/gitops.git
        revision: main
        directories: [{ path: apps/* }]
  template:
    metadata: { name: "{{.path.basename}}" }
    spec:
      project: default
      source: { repoURL: https://github.com/myorg/gitops.git, targetRevision: main, path: "{{.path}}" }
      destination: { server: https://kubernetes.default.svc, namespace: "{{.path.basename}}" }
      syncPolicy: { automated: { prune: true, selfHeal: true } }
```
`apps/new-service/` folder add karo → Application auto create. Yehi scale hai — spec ek jagah, apps hazar.
### 3. App-of-Apps (bootstrap)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: appsets, namespace: argocd }
spec:
  project: default
  source: { repoURL: https://github.com/myorg/gitops.git, path: appsets }
  destination: { server: https://kubernetes.default.svc }
  syncPolicy: { automated: { selfHeal: true } }
```
```
gitops/
├── appsets/            # root — sab kuch yahan se create hota hai
├── apps/               # payment-api/, notify-worker/ (Application + manifests)
└── namespaces/         # Namespace + Quota + NetworkPolicy
```
Ek apply → poora cluster restore — "cluster crash → GitOps revive" demo.
### 4. Multi-Cluster — hub-spoke

```bash
argocd cluster add kind-cluster2 --name cluster2
```
```yaml
generators:
  - git:                    # apps/* ke liye (jaise section 2)
      repoURL: https://github.com/myorg/gitops.git
      revision: main
      directories: [{ path: apps/* }]
  - list:                   # per-cluster list — hub + spoke
      elements:
        - { server: https://kubernetes.default.svc, cluster: hub }
        - { server: https://cluster2.example.com, cluster: spoke }
template:
  metadata: { name: "{{.cluster}}-{{.path.basename}}" }
  spec:
    destination: { server: "{{.server}}" }
```
### 5. Flux v2

```bash
flux bootstrap github --owner=myorg --repository=gitops --branch=main --path=./clusters/hub
```
```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata: { name: apps, namespace: flux-system }
spec: { interval: 1m, url: https://github.com/myorg/gitops, ref: { branch: main } }
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata: { name: payment-api, namespace: flux-system }
spec: { interval: 5m, path: ./apps/payment-api, prune: true, sourceRef: { kind: GitRepository, name: apps } }
---
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata: { name: prometheus, namespace: monitoring }
spec: { interval: 15m, chart: { spec: { chart: prometheus, version: "25.x", sourceRef: { kind: HelmRepository, name: prometheus-community } } } }
---
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: OCIRepository
metadata: { name: payment-api, namespace: flux-system }
spec: { interval: 5m, url: oci://ghcr.io/myorg/payment-api, ref: { tag: main } }
```
**Notifications:**

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta2
kind: Provider
metadata: { name: on-call, namespace: flux-system }
spec: { type: slack, channel: prod-alerts, secretRef: { name: slack-url } }
```
`Alert` CR (`eventSeverity: error`, `eventSources: Kustomization/HelmRelease *`) in provider se jod dete hain — flux se bhi Slack alert.
### 6. Progressive Delivery

**Argo Rollouts** — canary steps + metrics gate; metric fail → auto-rollback:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: payment-api, namespace: payments }
spec:
  replicas: 6
  selector: { matchLabels: { app: payment-api } }
  template:
    metadata: { labels: { app: payment-api } }
    spec:
      containers: [{ name: app, image: myorg/payment-api:v2.1.0 }]
  strategy:
    canary:
      steps:
        - { setWeight: 10 }
        - { pause: { duration: 1m } }
        - { setWeight: 50 }
        - analysis: { templates: [{ templateName: payment-success-rate }] }
        - { setWeight: 100 }
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: payment-success-rate }
spec:
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] >= 0.99
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: "sum(rate(http_requests_total{service=\"payment-api\",code=~\"2..\"}[1m])) / sum(rate(http_requests_total{service=\"payment-api\"}[1m]))"
```
**Flagger** — same idea: `Deployment` + `Canary` CR (`targetRef`, `service.port`, `analysis.interval/iterations/threshold`, `metrics` prometheus queries) + header-based traffic splitting (`match.headers.x-canary`); threshold breach → auto-rollback.
### 7. Secrets in GitOps

| Solution | Kaise kaam | Secret git me |
|----------|-----------|---------------|
| **SOPS** (age/KMS) | Values encrypt YAML me; decrypt on sync | Encrypted YAML |
| **SealedSecrets** | `SealedSecret` CR → controller unseals to Secret | Public-key wrapped |
| **ESO** | `ExternalSecret` → pulls from Vault/Key Vault | Reference only |

**ESO — modern default:**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata: { name: azure-kv, namespace: payments }
spec: { provider: { azureKeyVault: { authType: ManagedIdentity, vaultUrl: https://kv-payments.vault.azure.net/ } } }
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: payment-db-creds, namespace: payments }
spec: { refreshInterval: 1h, secretStoreRef: { name: azure-kv, kind: SecretStore }, target: { name: db-creds },
       data: [{ secretKey: password, remoteRef: { key: payments-db-password } }] }
```

`kubectl apply -f ./gitops/infra/eso/` (SecretStore + ExternalSecret install) → `kubectl get externalsecret -n payments` (sync state). SOPS quickstart: `sops --encrypt values/sops.yaml`.
### 8. 2026 Notes

- **ArgoCD v3** — v2.14 GA (2025); v3 plugin/source API rework in progress; upar ke manifests stable hain.
- **Flux 2.x** — GitRepository/Kustomization/HelmRelease stable; bootstrap + notifications native; OCI image-sync standard.
- **Progressive delivery**: Rollouts 1.8+, Flagger; OTel metrics in AnalysisTemplates.
- **Secrets**: ESO v0.9+ cloud standard (Azure Key Vault + managed identity common).
- **CNOE + Score spec** — GitOps platform delivery surface; Backstage plugin sync state dikhata hai.
### 9. Self-Heal Demo

`kubectl scale deploy payment-api -n payments --replicas=3` → drift → ~1-2 min me `selfHeal` wapas 6 replicas. `kubectl delete namespace payments` → `CreateNamespace` + selfHeal → poora app restore. Yehi GitOps ka proof hai.

**Safety:** hub me `automated.prune` careful — blast radius bada. AppProject `allowedNamespaces`, SyncWindows holidays, prod PR alag review. GitOps powerful = guardrails central (policy Day 33).
## Cheat-Sheet | Yaad Rakhna Commands

| Command | Purpose |
|---------|---------|
| `argocd app create my-api --repo <url> --path apps/my-api --dest-server <srv> --dest-namespace payments` | Create app |
| `argocd app sync my-api` | Manual sync |
| `argocd app get my-api` | Status + health |
| `argocd app diff my-api` | Git vs cluster drift |
| `kubectl get applications -n argocd` | List apps |
| `kubectl get applicationsets -A` | List ApplicationSets |
| `flux bootstrap github --owner=myorg --repository=gitops --path=./clusters/hub` | Flux bootstrap |
| `flux reconcile kustomization payment-api` | Force reconcile |
| `flux get kustomizations` / `helmreleases` | View resources |
| `kubectl get externalsecrets -n payments` | ESO sync state |
| `argocd cluster add kind-cluster2 --name cluster2` | Add spoke cluster |
| `sops --encrypt values/sops.yaml` | Encrypt secret file |
## Practice Lab | Abhi Karein

1. `kind create cluster --name argocd`; ArgoCD v3 install; UI/CLI login.
2. Sample app git me push; `Application` (auto+selfHeal+prune); sync; healthy verify.
3. **Drift demo**: `kubectl scale` → selfHeal reverse; namespace delete → re-create.
4. **ApplicationSet**: `apps/*` generator; 2 services → apps auto-generate.
5. **SyncWindow** (deny Sunday) + sync block verify.
6. **Notifications**: fake Slack webhook; `on-sync-failed` trigger.
7. **App-of-apps**: root app; git se pura restore demo.
8. **Argo Rollouts**: canary steps + AnalysisTemplate; bad metrics → auto-rollback.
9. **ESO**: SecretStore + ExternalSecret → `kubectl get secret` verify.
10. **Flux (bonus)**: bootstrap/GitSource; Kustomization + HelmRelease sync.
11. **Second kind cluster** + `argocd cluster add`; ApplicationSet 2 cluster pe; failover demo.
## Real Incidents | Ek "Platform" Problem
### TICKET INC-PLAT-35: "ArgoCD stuck OutOfSync — app deploy nahi ho raha cluster restart ke baad"

- **Situation**: AKS upgrade ke baad cluster restart. `payment-api` "Progressing" — deploy 8 hour stuck. Team: "GitOps broken."
- **Investigate**: `kubectl get applications` → OutOfSync + RetryExhausted; `argocd app diff` → sirf Service type different (manual cluster edit); events → CRD apiVersion mismatch after operator upgrade; controller logs → connection pool exhausted.
- **Root cause**: (1) CRD upgrade synced nahi tha — naya operator, purana CRD; (2) manual cluster edit (selfHeal off); (3) retry limit (5) chhote backoff me exhaust.
- **Fix**: CRDs apply; `selfHeal: true` re-enable; `retry.limit: 20`; manual edit git me revert; `argocd app hard-refresh` + resync.
- **Verify**: UI Synced + Healthy; pods expected replicas; curl 200; self-heal test clean.
- **Prevent**: (1) CRD upgrades through GitOps infra repo; (2) prod pe manual edits impossible; (3) high retry for busy clusters; (4) SyncFailed → alert. Discipline: merge to git, cluster kabhi manually na chodo.
## Interview Corner | Sawal-Jawab (Senior Level)

**Q1: "GitOps pull vs push — kab kya?"**
> Pull: operator (ArgoCD/Flux) git + cluster reconcile — self-heal, drift-proof, firewall-friendly, single source of truth. Push: pipeline cluster pe apply (kubectl/helm) — simple but drift-prone, no reconciliation. Platform ke liye pull; push sirf bootstrap/ephemeral edges. Pull = "git is truth, cluster is always converging."

**Q2: "App-of-apps vs repo-per-env?"**
> App-of-apps: ek root App sab Applications create — centralized, single bootstrap, git-only recovery. Repo-per-env: alag repos = isolation but duplication + coordination. Prefer: single repo + app-of-apps + kustomize overlays per env. Compliance bada ho to per-env + stricter reviews.

**Q3: "ArgoCD vs Flux — kaise choose?"**
> ArgoCD: mature UI+RBAC, rich ApplicationSets, Rollouts integration. Flux 2: GitOps Toolkit (GitRepository/Kustomization/HelmRelease/OCIRepository) — excellent OCI support, native notifications. Team + integration decide karta hai: k8s-central → ArgoCD; multi-artifact/OCI-heavy → Flux. Dono production-grade.

**Q4: "Multi-cluster GitOps design?"**
> Hub-spoke: single ArgoCD hub + ApplicationSet (git + list generators) targeting sab clusters. Central policy, one UI, one git source. Risk: hub blast radius → AppProjects, allowedNamespaces, SyncWindows, per-cluster overlays. Alternative: per-cluster GitOps — more isolation, more ops.

**Q5: "Secrets GitOps me kaise handle karte ho?"**
> Plaintext kabhi nahi. Options: SOPS (encrypt YAML, decrypt at sync), SealedSecrets (CR wrapper, controller unseals), ESO (ExternalSecret + cloud Vault — dynamic, rotation). Cloud ke liye ESO, self-managed → SOPS. Git me reference, key material Vault me, audit + rotation policy.
## Quick Notes | Yaad Rakhna

- ArgoCD: Application + AppProject + repo; sync/selfHeal/prune.
- ApplicationSet: git/list/cluster generators — multi-app/-cluster ek spec me.
- SyncPolicy auto+selfHeal+prune (careful!), SyncWindows blackout.
- App-of-apps = root → sab; cluster crash → git-only restore.
- Flux: GitRepository + Kustomization + HelmRelease + OCIRepository.
- Progressive delivery: Rollouts/Flagger — metrics-gated, auto-rollback; secrets: ESO/SOPS/SealedSecrets.
- Multi-cluster: hub-spoke + gates = blast radius control.
## Next | Aage Bolte Jaana

Multi-cluster + fleet management next — hub-spoke, AKS Fleet, Cluster API, multi-tenant security (Day 36).

[Day 36 — Multi-Cluster + Fleet Management](../expanded/day-36-multicluster-fleet-management.md)