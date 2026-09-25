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

### Capstone ka maksad — 50 din ka ek system me

Ye din alag-alag tool ki list nahi hai — **integration** ka din hai. 50 days me tumne har capability ek isolation me seekhi (CI alag, monitoring alag, DR alag) — asli DevOps me ye sab **ek connected system** ka part hote hain jahan ek ka output doosre ka input hai: CI jo build+sign karta hai wahi GitOps ko manifest update deta hai, cluster jo run karta hai wahi Prometheus ko metrics deta hai, Kubecost jo bill dikhata hai wahi budget alert bhi deta hai. Capstone ka educational point: **"glue" me hi asli engineering hai** — tools connect karte waqt boundaries, credentials, failure modes milte hain (prod me kya hota hai jab ArgoCD down ho, alerts kaise aate hain, rollback kaise hota hai). Portfolio angle: interview me "50 tools ka list" nahi chalta — **ek system with rationale** chalta hai ("maine X isliye choose kiya kyunki Y"). To is day ka output = working platform + decision log + evidence (screenshots, runbooks).

### Reference architecture — kyun ye components

Upar wali architecture ko tod ke samjho, har line ka "kyun":

| Layer | Component | Rationale (kyun yahi) |
|---|---|---|
| Source/CI | GitHub Actions, pinned SHA | code → artifact, gates (test/lint/scan), OIDC |
| Supply chain | trivy + syft + cosign | Day 48 — signed, SBOM'd images only |
| GitOps | ArgoCD + kustomize overlays | desired state in Git; drift detect; env promotion |
| Runtime | AKS + Kyverno + ESO + Istio | policy admission, secretless, mTLS/traffic |
| Observability | Prom/Tempo/Loki + Grafana + SLO | measure everything; error budgets |
| FinOps/Spend | Kubecost + Azure budgets | cost visibility day-1 se (Day 39) |
| DR/Chaos | Velero/ASR + Litmus gameday | tested recovery, not paper (Day 40-41) |
| Security ops | Defender + Sentinel | detect/respond (Day 49) |

Note: kuch cheezein **jaan-bujh kar chhoti** rakhi gayi hain (single cluster, simple app) — capstone me scope > perfection; par layers ki **order aur boundaries** sahi honi chahiye. "Everything as code" yahan dikhna chahiye: infra = Terraform, cluster config = GitOps, policy = Kyverno YAML, secrets = sealed/ESO, pipelines = workflow files — clicks = 0.

### Multi-env strategy — dev/staging/prod kaise alag hain

Pattern: ek **base** (common manifests: deployment, service, probes, limits, networkpolicy) + har env ka **overlay** (sirf farak: image tag, replicas, resource sizes, enabled features). Kustomize se: `base/` + `overlays/{dev,staging,prod}` — same YAML, parameterized. Farak: **dev** = 1 replica, chhota, non-prod data, aggressive scale-down; **staging** = prod jaisa (3 replicas, same policies) — wahan load test + DR drill; **prod** = 5 replicas, SLI/SLO monitors, canary via Istio, strictest policy. Secrets env-wise (different Key Vault scopes). ArgoCD me **ek Application per env** (App-of-Apps pattern) — sync status = env health. Drift: Git me jo likha wahi chalna chahiye; kisi ne kubectl se manually patch kiya to Argo **self-heal** wapas laata hai — ye GitOps ka core value hai. Bonus: image tag update = CI ka ek commit → auto-promote staging → approval se prod (progressive delivery).

### CI/CD gates — quality ka darwaza

Pipeline ka job sirf build nahi — **quality ka gate** hai. Order (fail-fast chhota se mehnga): (1) unit tests, (2) **lint** (golangci-lint — style+bugs), (3) **SAST/SCA** (code + dependencies vuln), (4) build image (multi-arch, distroless — chhoti attack surface), (5) **trivy image scan** (HIGH/CRITICAL = exit 1 → build fail), (6) **SBOM (syft) + cosign sign** (Day 48), (7) **commit updated manifest** to GitOps repo (tag = `$GITHUB_SHA` — traceability), (8) ArgoCD sync staging → smoke tests → manual/prod canary. Har gate non-zero exit = pipeline rokti hai — **enforcement > discipline** (yaad rakho Day 04 ka exit code wala lesson — wahi yahan 20 gate lag chuki hai). Rollback: GitOps me image tag revert = Argo sync = rollback — 1 commit. Key metrics track karo: lead time, deploy frequency, change fail rate, MTTR (DORA) — capstone report me dikhana.

### Observability + SLO — RED, budgets, alerts

Run karne ke baad "chal raha hai" prove karne ke liye: **metrics** (Prometheus — RED per service: rate, errors, duration percentiles), **traces** (Tempo — ek request ka journey across services), **logs** (Loki — correlate via labels/trace-id). Grafana me **SLO dashboard**: availability 99.95%, latency p99 < X; **error budget** = kitna failure afford hai — budget burn rate alerts (fast burn = page, slow burn = ticket). Alert rules me runbook link compulsory (Day 27) — bina runbook alert noise hai. Dashboard ka set: (1) golden signals per app, (2) cluster health, (3) Kubecost per namespace, (4) CI/CD health, (5) security posture (Defender score). Interview me: "monitoring kya doge ek naye service ko?" → RED + SLO + structured logs + traces + runbook-linked alerts — 5 cheezein.

### Security + spend + DR wiring — end-to-end

Ek platform me teeno **side-rails** (features ke saath chalte hain): **Security**: Kyverno policies (no `:latest`, limits required, verify-images ghcr.io/* only — admission gate), ESO se secrets Key Vault se (workload identity — Day 35), Defender posture + Sentinel rules (unusual sign-in, key use), network policies default-deny (Day 49). **Spend**: Kubecost per namespace + Azure budget alert 80/90/100% + right-sizing review (Day 39) — "platform without cost control = open cheque". **DR/Resilience**: Velero daily backup GRS blob + SQL geo-replica + Front Door failover plan + **gameday** (Litmus pod-kill → kya HPA/self-heal karta hai? → SQL failover drill → runbook update — Day 40-41). Sawaal interview me: "bade system me sabse pehle kya?" → answer: SLO + backup + budget alerts (visibility trio) — kyunki inke bina tum andhe, andhe system nahi scale kar sakte.

### Deliverables — kaise present karo (interview/portfolio)

Capstone ki real value presentation me hai — **evidence-based** portfolio:

1. **Architecture doc** — diagram + per-decision rationale ("chose ArgoCD over Flux because...", trade-offs likho).
2. **Working repo** — workflows, overlays, policies, Terraform — public ya demo link; clean README (setup steps + architecture mermaid).
3. **Evidence pack**: CI pipeline screenshots (gates passing), ArgoCD 3-env sync, Grafana SLO dashboards, Kubecost savings, signed image `cosign verify` output, Kyverno rejecting unsigned pod.
4. **DR/gameday report**: date, experiments, actual RTO/RPO vs target, findings + fixes — ye report hi 90% candidates ke paas nahi hoti.
5. **30-60s walkthrough video/gif** + 1-page demo guide (kitna bhi bana ho, dikhana aana chahiye).

Interview me isko **STAR/story** banao: "system tha jo X tha; maine Y integrate kiya Z reason se; result: deploy time 30min → 4min, p99 improved X%, bill Y% kam". Yehi 50 din ka final output hai — tool list nahi, **system + judgment + proof**. Congrats — ab Interview Corner me 200+ questions isi foundation pe hain.

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