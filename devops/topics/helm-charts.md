# Deep Dive: Helm — Kubernetes Package Manager (Charts, Values, Templates, Lifecycle)

> **Standalone deep dive:** Helm = "npm/apt for Kubernetes": package all your manifests as a **Chart**, parameterized with `values.yaml`, templated by Go templates — clean upgrades/rollbacks.

---

## 1. Why Helm (vs raw kubectl apply)

```
kubectl apply -f pods.yaml   → 2 files, no param, no rollback story, env forks
Helm chart:
  - template + values  → same chart reused per env (dev/prod) with different values
  - upgrade/rollback    — helm history (revisions) one-command rollback
  - release = deployed state (release name + version in cluster)
  - dependency + reuse: community charts (Bitnami, Helm Hub — careful supply chain! Day 48)
```

---

## 2. Chart Anatomy

```
myapp-chart/
├── Chart.yaml            # name, version, description, dependencies
├── values.yaml           # default values (parameters)
├── values-dev.yaml       # overrides per env (used via -f)
├── templates/
│   ├── deployment.yaml   # {{- template... }} Go templates
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl      # named templates (labels, fullname) — DRY
│   └── NOTES.txt         # release notes shown to user
└── charts/               # vendored dependencies (or use repositories)
```

```yaml
# Chart.yaml
apiVersion: v2
name: deploytrack
version: 1.0.0
appVersion: "1.16.0"
dependencies:
  - name: postgresql
    version: 15.4.1
    repository: https://charts.bitnami.com/bitnami
```
```yaml
# values.yaml
image:
  repository: ghcr.io/myorg/deploytrack
  tag: "1.2.3"
replicaCount: 3
resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits: { cpu: "1", memory: 1Gi }
service:
  port: 8080
ingress:
  enabled: true
  host: deploytrack.example.com
env: prod
```
```yaml
# templates/deployment.yaml (Go template)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "deploytrack.fullname" . }}
  labels: {{- include "deploytrack.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels: {{- include "deploytrack.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels: {{- include "deploytrack.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          ports: [ { containerPort: 80 } ]
          resources: {{- toYaml .Values.resources | nindent 12 }}
          env:
            - name: ENV
              value: {{ .Values.env | quote }}
            {{- if .Values.featureToggle.enabled }}
            - name: FEATURE
              value: "on"
            {{- end }}
```
`{{-` trims whitespace; `include`/`nindent` used in `_helpers.tpl` to keep labels consistent — essential for label selectors won't drift.

---

## 3. Lifecycle Commands

```bash
helm create myapp-chart                       # scaffold
helm lint myapp-chart                          # sanity check
helm template myapp-chart                      # render to YAML (validate!)
helm install release-name ./myapp-chart -f values-prod.yaml -n prod
helm upgrade release-name ./myapp-chart -f values-prod.yaml --set image.tag=1.3.0
helm list -A
helm history release-name                      # revisions
helm rollback release-name 2                   # one-command rollback
helm uninstall release-name -n prod
helm repo add bitnami https://charts.bitnami.com/bitnami
helm dependency update ./myapp-chart
```
```
Revision 1 v1.0.0   install
Revision 2 v1.3.0   upgrade (+image tag) 
Revision 3 broken!  → helm rollback 2  → back to working release, status 'superseded'
```

---

## 4. Best Practices & Gotchas

```
✅ Chart.yaml semantic version; bump on change (use release notes + GitOps tags)
✅ values in Git (GitOps): charts versioned, values by env (overlays) — Day 32 diff/PR
✅ immutable tags (image.tag=sha) — reproducibility; --atomic to auto-rollback failed upgrades
✅ resources required (limit/request) — policy anyway (Kyverno Day 37)
✅ secrets via values? NO — External Secrets/SOPS (Day 35) not plaintext values
✅ `helm template` + `kubeconform/kubeval` in CI to validate render (catch typos early)
✅ keep chart under test (helm unittest, k3s/kind integration in CI)
⚠️ 'latest' tag + mutable → reproducibility broken
⚠️ template whitespace/helper drift (label mismatch breaks selectors)
⚠️ CRDs inside chart: use `crd-install` hook / separate (charts upgrade won't manage them well)
⚠️ supply chain: chart repos = external deps → pin/check versions (Day 48)
```

---

## 5. GitOps + Helm (ArgoCD / Flux)

```
ArgoCD: path = chart dir with values (or HelmRelease to external repo) — 'helm' source type:
   source: { chart: "deploytrack", repoURL: ..., targetRevision, helm: { valueFiles: [values-prod.yaml] } }
Flux: HelmRepository + HelmRelease (Chart spec) — sync desired version; auto helium for patch
Values-per-env = overrides per overlay; syncing = declare in Git → operator applies
```

---

## 6. Real-World — "DeployTrack" as Helm chart

```
Structure: deploytrack-chart/ (template + values)
  deploy: App + postgres (dependency) + ingress + hpa + service
Repo layout: 
  apps/deploytrack/chart (chart source) 
  envs/{dev,staging,prod}/values-{env}.yaml   (replica, image tag, DB, labels)
CI: 
  1) helm template -f envs/staging/values-staging.yaml → build verify (echo) 
  2) push chart to OCI registry (helm push) or GitOps reads repo path
  3) ArgoCD syncs → release deploytrack-staging
Rollback demo: image.tag regression → git revert → ArgoCD selfHeal → previous release
```

---

## 7. Interview Questions — Helm

| Question | Strong answer |
|----------|---------------|
| "Helm kya?" | Kubernetes package manager: chart (template+values) → release (deployed state with revision). Param per env, upgrade/rollback one-command. |
| "Chart structure?" | Chart.yaml (metadata/deps), values.yaml (defaults), templates/ (YAML + Go template), _helpers.tpl (labels DRY), NOTES.txt. |
| "Rollback?" | `helm history` → `helm rollback <rel> <rev>` — version returns previous manifest set (superseded revision). |
| "values override?" | `-f values-<env>.yaml`, `--set`, `--set-file`; precedence via flags; Git shows versions. |
| "template helpers kyu?" | Labels/fullname defined once — selectors stay consistent (drift breaks service→pod link). |
| "Helm in GitOps?" | ArgoCD/Flux: chart source in Git + per-env values; `helm template` rendered & applied by operator; desired state in Git. |
| "Secrets?" | Never in values (plaintext); External Secrets/SOPS/Vault — chart references secret name, values hold refs not secrets. |
| "CRD handling?" | Prefer separate install/manage; charts with CRDs have upgrade limitations. |
| "Supply chain?" | Chart deps = external → pin versions/verify; scan chart repos/OCI registry; provenance (Day 48). |

**Related:** [Day 32](../day-32-gitops-argocd-flux.md) · [K8s Advanced](../day-36-kubernetes-advanced-operators-rbac.md) · [GitOps Deep](../topics/gitops-argocd.md) · [DevSecOps](../topics/devsecops.md)