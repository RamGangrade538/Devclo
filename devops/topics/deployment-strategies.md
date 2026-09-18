# Deep Dive: Deployment Strategies — Zero-Downtime Aur Rollback Ka Science

> **Kaha ka hai:** Day 8 (CI/CD) + Day 19 (K8s rollout) + Day 32/33 (GitOps/mesh) ka joint. Jo engineer **deploy strategies padh ke select** karta hai, wahi 'senior' hai. Ye table-answer hi interview me score karta hai.

---

## 1. Pehle Buniyaad — "deploy = risk"

Har deploy me do cheezein badalti hain: **code** + **risk**. Strategy chunna = risk ko areas me manage karna:

| Factor | Strategy Ko Kaise Shape Karta |
|--------|-------------------------------|
| Downtime tolerance | Recreate (30s) vs Rolling/Blue Green (0) |
| Rollback speed | Need instant? → Blue-Green / feature flag |
| Traffic risk | New version bharosa → canary % |
| Cost | Blue-green ke extra resources chahiye |
| State (DB) | Schema migration edge case — saari strategies pe |

---

## 2. Strategies Ki Table — Master Chart

| Strategy | Kaisa | Downtime | Rollback | Risk | Cost |
|----------|-------|----------|----------|------|------|
| **Recreate** | kill old → start new | **Yes** | Git revert | High (impact) | Low |
| **Rolling** | swap N-at-a-time | **No** | Continue rolling back | Low | Low |
| **Blue/Green** | 2 env, switch traffic | **No** | Switch back (DNS/LB) | Low | **High (idle env)** |
| **Canary** | x% traffic → new, watch, ramp | **No** | Stop ramp / reverse | **Medium** (mixed version) | Low-med |
| **Shadow** | new recv copy, dono process | No (users unaffected) | Nano — never serves real | **Low risk, high value** | Med (dual run) |
| **Feature flags** | code present, kill switch | No | Toggle off | **Low** | Low (tooling) |
| **Ramped/canary on mesh** | Istio/Argo progressive | No | Weight reset | Med | Med |

---

## 3. Rolling Update — Har Day Ka Bass

K8s default; app versions ek-dam jaldi:

```yaml
# deployment.yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1        # ek pod kam allowed
      maxSurge: 1              # ek extra pod allowed
```

```
Old 3 pods ─► new pod up (ready) → old pod down → ... repeat
```

```bash
kubectl set image deploy backend backend=ghcr.io/u/app:v2
kubectl rollout status deploy backend
kubectl rollout undo deploy backend     # wapas v1
```

**Pros:** zero-downtime, no extra infra, cheap. **Cons:** old+new mixed during swap — DB/schema incompatible version harmless to populate if careful.

**DB/Migrations watch:** "expand-contract" — migration pehle (add column), deploy code (new reads new field), phir old column drop (phaadi). IS matrix:
```
migration (expand) → deploy app → old code version removed → contract (drop)
```

---

## 4. Blue-Green — Same, Switch the Switch

```
          ┌─> v1 "blue" (old)  ──┐
Users ──► LB ──                 │
          └─> v2 "green" (new) ─┘
          1. Green ready + smoke test
          2. LB DNS → green (instant cutover)
          3. Blue on standby → rollback = switch back
```

**K8s (double Deployment/Service floating):**
```bash
# blue + green deployments, ek service se label switch
kubectl label deploy backend color=green
kubectl patch svc backend -p '{"spec":{"selector":{"app":"backend","color":"green"}}}'
```

**Pros:** instant switch back (sec), trivially test new env. **Cons:** +100% infra idle, DB dual-write/app issues khte (DB hi shared hota). Use jab critical + cost tolerable (bank, health).

---

## 5. Canary — Pahle Thodi, Phir Poori

```
v1 ●●●●●●●●●  (90%)
v2 ●●         (10%) → metrics ok? → 50% → 100%
                       else → back to 0%
```

**K8s natively:** two Deployments + Service (na v1/v2 weight nahi leta easily) — isliye mesh ya Argo Rollouts use hota hai.

**Istio VirtualService:**
```yaml
spec:
  http:
    - match: [ { headers: { x-canary: { exact: "new" } } } ]   # header-based
      route: [ { destination: { host: app, subset: v2 } } ]
    - route:
      - destination: { host: app, subset: v1, weight: 90 }
      - destination: { host: app, subset: v2, weight: 10 }
```

**Argo Rollouts (analysis steps):**
```yaml
strategys:
  canary:
    steps:
      - setWeight: 10
      - pause: { duration: 5m }
      - analysis:
          templates:
            - templateName: error-rate     # Prometheus query gate
      - setWeight: 50 ... setWeight: 100
```

**Pros:** real-user validation, rollback cheap. **Cons:** mixed versions, need good metrics, multi-version DB compat. Best jab mTLS/observability mature ho.

---

## 6. Shadow — Pahle Copy, Bad Mein Khaak

```
Real traffic
  ├──► v1 (real user saamne)
  └──► v2 (copy — siraf log/metrics, real response nahi)
```

- v2 ko real request ka **copy** bhejo, uska response **file nahi** — sirf galt toggle A/B/number dekh
- Perfect for: latency preview, crash detect, caching check
- Cost: double compute + safe observability infra
- **Combined** with canary often used in v1→v2 rollout.

**Use case:** "new caching layer kya lagta hai latency pe" → shadow 24h, produce compare → phir canary.

---

## 7. Feature Flags — Code Ready, Toggle Se Unlock

```python
if feature.is_on("new_checkout"):
    v2.flow()
else:
    v1.flow()
```

| Jagah | Toggle | Rollback |
|-------|--------|----------|
| Code | Unlaunchiroku/FeatureHub | `OFF` → instantly old path |
| Metrics/logs | Kill switch observed | Instant |

**Pros:** code long-term merge (trunk-based), instant per-user/% rollout, A/B testing.
**Cons:** testing matrix (flag on/off), flag sprawl (expire old flags!).

---

## 8. Progressively Weight + Observability Gates (Argo Rollouts)

Real prod gate pattern:

```
1. Rollout v2 at 10% (12 min real traffic)
2. Analysis: prometheus "error_rate > 1%" OR "p99 > 400ms"
3. Pass → 50% (24h) → 100%
4. Fail → auto rollback to 100% v1 + alert
```

**SLO-based release** = yehi hai senior/advanced DevOps ki baat. (Reference: [GitOps](../topics/gitops-argocd.md), [Service Mesh](../topics/service-mesh-explained.md), [SRE/Observability](../topics/observability.md))

**Rollback quality check (interview):**
- Kanha fast? Blue-green < canary < rolling < recreate
- Kanha risk? Mixed versions: canary > rolling; downtime: recreate only
- `kubectl rollout undo` — saved `revision-history`

---

## 9. Real-World Scenarios & Fixes

| Scenario | Wrong Choice | Right |
|----------|--------------|-------|
| **Zero-downtime, few extra env cost ok** | Recreate/Rolling | Blue-Green |
| **Low cost, zero-downtime needed** | Blue-Green (double) | Rolling + DB expand/contract |
| **Risk highest (payment)** | 100% cut | Canary w/ metric gates (5-10%) |
| **Instant rollback hota nahi (DB incompat)** | Any naive | Feature flags + expansion-contraction |
| **New latency feature to check** | Canary | Shadow first |
| **CI me autoscaling kaa speed** | Blue-green heavy | Rolling to main, mesh-weighted canary prod |

---

## 10. Interview Questions — Deployment Strategies

| Question | Strong Answer |
|----------|---------------|
| "Rolling vs Blue/Green vs Canary?" | Rolling=swap pods gradual (low cost, mixed); Blue-Green=full switch (instant rollback, +infra); Canary=%-traffic validated by metrics (real-user, mixed versions). |
| "Kab canary karte ho?" | High-risk changes, observability ready, mesh/Argo Rollouts available; metric gates (error 1%, p99). |
| "Zero-downtime kaise?" | Rolling/canary/blue-green + readiness probes + LB switch; but **DB schema** bhi care — expand/contract. |
| "Rollback plan?" | Blue-green=switch DNS; canary=stop ramp; rolling=`kubectl rollout undo` / Git revert (GitOps). Prefer automated (Argo/rollout auto). |
| "Blue-green DB kaise?" | DB shared; do app versions one DB → write both compatible (migrate contract); rollback no schema revert needed. |
| "maxUnavailable/maxSurge?" | Rolling tolerance: at-most N pods down, at-most N extra surge. |
| "Feature flags kaunse nature?" | Toggle at runtime, trunk-based deploy, instant rollback, phir flag cleanup. |
| "SLO-gated release?" | Release to % only if SLOs healthy (error budget); auto revert on breach. |

---

## 11. Hands-On Lab

```bash
# 1. Rolling update demo (minikube/kind ya local k8s)
cat > app.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: { name: web, labels: { app: web } }
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 1, maxSurge: 1 }
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: nginx:1.25
          ports: [ { containerPort: 80 } ]
          readinessProbe: { httpGet: { path: /, port: 80 } }
EOF
kubectl apply -f app.yaml
kubectl get deploy web -w

# 2. Rolling swap
kubectl set image deploy web web=nginx:1.26
kubectl rollout status deploy web
kubectl rollout history deploy web
kubectl rollout undo deploy web
```

**GitOps canary (if Argo/Mesh available):** Istio VirtualService weight-split + `kubectl apply` — details Day 33.

---

## 12. Summary | Yaad Rakho

1. **Recreate** (downtime ok, cheap) → **Rolling** (zero-downtime, cheap, mixed) → **Blue/Green** (instant rollback, +idle env) → **Canary** (metrics-gated %) → **Shadow** (observe-real-copy) → **Feature flags** (instant kill switch)
2. DB: expand-contract migration; mixed versions = DB compatible
3. Canary = SLO gates (error rate, p99) + auto revert
4. Rollback priority: blue-green > canary/flag > rolling
5. `kubectl rollout undo` + revision history
6. SLO-gated progressive delivery = advanced DevOps skill
7. Strategy chune ka formula: **downtime tolerance × rollback speed × cost × risk**

---
**Related:** [Day 8](../day-08-cicd-concepts-and-pipelines.md) · [Day 19](../day-19-kubernetes-deployments-services.md) · [GitOps](../topics/gitops-argocd.md) · [Service Mesh](../topics/service-mesh-explained.md) · [Observability](../topics/observability.md)