# Day 50: GRAND CAPSTONE — Production-Grade DevOps Platform (Everything Combined)

> Abhi 50 din poore — sab kuch ek saath use karke ek REAL platform banao: DeployTrack 2.0 — monitoring, GitOps, multi-env, security gates, spend control, DR. Ye capstone industry-level project hai — job me yehi dikhaya jayega.

## Overview | Parichay

Goal: from Day 0-49 kitne tools milke ek system banate hain. Ye reference architecture:
```
Source+CI (GitHub Actions)
  → Build+sign+SBOM (Day 48) → image registry
  → GitOps (ArgoCD, Day 32)  → AKS (Day 18-20)
  → policy (Kyverno) + secrets (KV) + mesh (Istio)
  → Observability (Prom/Grafana/Tempo) + SRE SLO
  → Spend (Kubecost) + DR (Velero/ASR) + Security (Sentinel)
```
Multi-env: prod/staging/dev via kustomize overlays; everything Git + code — no clicks.

## What You'll Learn | Aaj Ki Seekh

- [ ] Full reference architecture diagram (components list + rationale)
- [ ] Multi-env GitOps layout (drift check on each env)
- [ ] CI/CD full flow with quality gates (test→lint→security→image→deploy)
- [ ] Secret/Policy/Observability wiring
- [ ] Delivery Dashboard (perf/cost/SLO) — demonstrate with real screenshots (Dashboard snapshots to report)
- [ ] Runbook + DR drill + postmortem
- [ ] Present as portfolio / demo guide

## Diagram | Full Reference Architecture

```mermaid
flowchart TB
    DEV["Developer (Git)"] -->|PR| CI["CI: GitHub Actions
    lint→test→SAST→SCA→build→trivy→sign(SBOM)"]
    CI -->|push image| REG["Registry (ACR/GHCR) + scan-on-push"]
    CI -->|"update manifest (deploytrack/overlays)"| GIT["GitOps Repo"]
    GIT -->|reconcile| ARGO["ArgoCD (prod+staging)"]
    ARGO -->|sync| AKS["AKS (zonal, autoscaler)
    policies(Kyverno) · secrets(ESO) · mesh(Istio)"]
    AKS --> OBS["Prometheus/Tempo/Loki → Grafana
    SLO dashboards + alerts"]
    COST["Kubecost / Cost Mgmt (budget)"] -.wait.?.- AKS
    DR["Velero(blob)+SQL-geo → DR region
    Front Door failover"] -.- AKS
    SEC["Sentinel SIEM / Defender for Cloud"] -.- AKS
```

## Stage 1 | Repository Layout (GitOps)

```
devops-capstone/
├── apps/
│   └── deploytrack/
│       ├── base/          # kustomization (shared)
│       │   ├── deployment.yaml   (limits, probes, securityContext)
│       │   ├── service.yaml
│       │   ├── configmap.yaml    (env: APP+ELASTICLEVEL)
│       │   ├── sealed-secret.yaml   (encrypted)
│       │   └── networkpolicy.yaml   (default-deny, allow-api)
│       └── overlays/
│           ├── dev/       # overlays: name+image tag, small replicas
│           ├── staging/   # 3 replicas, sentinel enabled
│           └── prod/      # 5 replicas, SLI monitors, istio canary
├── terraform/            # infra (azure)
│   ├── modules/          (day 42: vnet/aks/kv/acr/monitor — portable)
│   └── envs/{dev,staging,prod}/main.tf
├── .github/workflows/    # ci.yaml & security.yaml & deploy-gitops.yaml
├── values-argocd/        # App of Apps + env Applications
```

## Stage 2 | CI Pipeline (with gates)

```yaml
# .github/workflows/ci.yaml
name: ci
on: { push: { branches: [main] } }
jobs:
  test-and-build:
    runs-on: ubuntu-latest
    permissions: { id-token: write, contents: read, packages: write }
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683   # SHA pin
      - uses: actions/setup-go@<sha>
      - run: go test ./...
      - run: golangci-lint run                     # lint gate
      - run: trivy fs . --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed
      - uses: docker/build-push-action@<sha>       # multi-arch, distroless
        with: { tags: "ghcr.io/x/deploytrack:$GITHUB_SHA" }
      - run: |
          trivy image ghcr.io/x/deploytrack:$GITHUB_SHA --severity HIGH,CRITICAL --exit-code 1
          syft ghcr.io/x/deploytrack:$GITHUB_SHA -o spdx-json > sbom.spdx.json
          cosign sign ghcr.io/x/deploytrack:$GITHUB_SHA          # keyless/OIDC
      - name: update-gitops
        uses: <action to commit kustomization image tag to overlays/staging> 
```

## Stage 3 | GitOps + Multi-env Rollout

```bash
# base/networkpolicy — default deny; service allows only from gateway
kubectl apply -k apps/deploytrack/overlays/staging   # or Argo does it

# ArgoCD App-of-Apps:
cat > apps-of-apps.yaml << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: deploytrack-apps }
spec:
  project: default
  source:
    repoURL: https://github.com/x/devops-capstone
    path: values-argocd
  destination: { server: https://kubernetes.default.svc }
  syncPolicy: { automated: { selfHeal: true, prune: true } }
EOF
# dev/staging/prod = separate Applications in values-argocd/ with overlay path
```
**Rollout test (canary via Istio, Day 33):** weight 95/5 on prod → monitor p99/error → promote.

## Stage 4 | Observability + SLO + Alerts (SRE)

```yaml
# monitoring: kube-prometheus-stack + Tempo + Loki (helm) Day 24-27
cat > slo.yaml << 'EOF'
groups:
- name: slo
  rules:
  - record: job:http_req_duration_p99
    expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{namespace="prod"}[5m])) by (le))
  - alert: ErrorBudgetBurn
    expr: |
      sum by (ap) (rate(http_requests_total{status=~"5.."}[1h])) /
      sum by (ap) (rate(http_requests_total[1h])) > 14.4 * (1-0.9995)
    for: 5m
    labels: { severity: critical }
```
Grafana: RED dashboards per service + `produce` drill-downs; alert routing → PagerDuty/Slack (runbooks link).

## Stage 5 | Security & Spend Wiring (Day 48/49/39)

```
Kyverno policies: require limits, no latest, verify-images (allow ghcr.io/x/*)   Day 37/48
ESO: SecretStore → Azure Key Vault → workload identity                             Day 35
Defender for Cloud: posture + recommendations; Sentinel: SIEM rules+MFA alerts    Day 49
Kubecost/OpenCost: cost per ns; Azure budget $ threshold → alert                   Day 39
```

## Stage 6 | DR & Gameday (Day 40-41)

```
Backup: Velero daily to GRS blob + SQL geo-replica; test restore
Gameday script:
  1. steady state dashboards (p99/err/frontdoor)
  2. chaos: pod-kill (Litmus) → deploy recovers?
  3. chaos: SQL-primary failover → geo replica failover
  4. Front Door endpoint fail → activate DR (staging restore path)
  5. results → runbook updates + SLO (re-)calculate
```

## Deliverables | Show the World

1. **Architecture doc** (this diagram + rationale per decision)
2. **CI/CD flow video/gif** (screenshots: pipeline greens, gates)
3. **Dashboards screenshots** (SLO, RED, Kubecost, cost budget, Sentinel alert)
4. **DR gameday report** (what broke, what fixed, evidence)
5. **GitOps repo** public (workflows + policy + overlays visible)
6. **30-60s tour** — README + clean demo

That's your **portfolio project ready** — packages Day 0-49 knowledge into one working system, job interview me dikhao.

## Practice Exercise | Final Check

1. [ ] All 50 day visual boxes ticked? (progress 100%)
2. [ ] Capstone repo builds green: 3 services, gates pass, signed+scanned
3. [ ] ArgoCD shows 3 envs; rollback demo works (revert commit)
4. [ ] Grafana SLO/dashboard screenshot saved
5. [ ] Gameday report + postmortem sample in repo /docs
6. [ ] README shows architecture (mermaid) + how-to-run

## Quick Notes | Yaad Rakho

```
- Everything = code: infra(Terraform), clusters(GitOps), policy(Kyverno), pipelines(YAML), secrets(KV)
- Gates > discipline: test/lint/security/sign in CI; policy at admission
- Environments = overlays; deploy = merge + auto-sync (GitOps)
- SRE = measure (SLO) + alert budgets, not just dashboards
- Cost & security run alongside features (FinOps, supply-chain)
- DR tested (gameday), not paper (Day 40/41)
- Present with evidence: screenshots, runbooks, gate results
CONGRATULATIONS — 50-day DevOps engineer. Ab interviews: portfolio + concepts (interview corner!) 🎉
```

**Next:** Interview Corner (web `#interviews`) — 200+ questions across all 50 days + tricky section. Good luck!