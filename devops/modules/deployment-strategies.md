# 🚀 Deployment Strategies — Risk ko Control Karna

> **Hinglish:** Naya version 100% users pe ek saath daal diya — aur wo crash? Disaster! Deployment strategies ka kaam: **risk chhota karke** version roll out karna — chhote batches, quick rollback, A/B testing, zero-downtime.

## 📖 Overview — Ye Topic Kya Hai

Deployment strategy = **"naya version kaise live karein"** ka plan. Jaise jaise apps complex hoti hain, "sab ek saath restart karke baad me khair" kaam nahi karta. Har strategy ka trade-off hota hai: speed vs risk vs infra cost.

Kon kya selection: **Recreate** (simple, downtime), **Rolling** (zero downtime, gradual), **Blue/Green** (immediate switchback, extra cost), **Canary** (real traffic % pe test), **A/B** (user segment, feature testing), **Shadow** (mirror traffic, not served), **Feature flags** (code-level toggle, not deploy). Plus **progressive delivery** — deploy + metrics gati ke basis pe auto-progress.

## 🟢 Beginner — Shuruaat yahan se

- Recreate vs rolling — difference + downtime concepts.
- Blue/Green diagram Banao — two environments, switch.
- Canary — small % traffic pe test.
- K8s `strategy: RollingUpdate` YAML dekho.

## 🟡 Intermediate — Ab implement karo

- **Rolling update parameters** — maxUnavailable, maxSurge.
- **Blue/Green with LB switching** — cutover/rollback steps.
- **Canary with weighted traffic** — K8s service/istio traffic split.
- **Feature flags** — kill switch, canary code path.
- **Rollback vs roll-forward** — kab kya strategiya choose kare.

## 🔴 Advanced — Pro bano

- **A/B testing** — product decisions pe; teesra metric (conversion).
- **Shadow deployment** — request mirroring, dark testing.
- **Progressive delivery (Argo Rollouts / Flagger)** — automated gated rollouts.
- **Multi-bubble/canary analysis** — metrics compare (latency, errors).
- **Database migrations ke saat deployment order.**

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Recreate** — purana sab band + naya start; saadha but downtime.
- [ ] **Rolling deployment** — pod-by-pod/instance-by-instance replace; zero downtime.
- [ ] **Blue/Green** — two versions live; LB switch; fast rollback.
- [ ] **Canary** — naye version par thoda traffic; watch; fir 100%.
- [ ] **A/B testing** — do versions users ko; conversion decide.
- [ ] **Shadow deployment** — traffic copy run, output kisi ko nahi dikhta.
- [ ] **Feature flags** — runtime toggle; feature ko deploy se alag karo.
- [ ] **Progressive delivery** — automated gates: health → traffic % → full.
- [ ] **Rollback** — pehli vala version wapas lao.
- [ ] **Roll-forward** — age ko ek patch release bhejkar fix karo.
- [ ] **Argo Rollouts / Flagger** — progressive deployment controllers.
- [ ] **maxSurge / maxUnavailable** — rolling speed controls.
- [ ] **Zero downtime** — traffic bina break ke replace.
- [ ] **Traffic splitting** — naye instance pe % traffic bhejna.
- [ ] **Ramp-up** — % gradually badhna.
- [ ] **Health checks after deploy** — verify, tabhi aage.
- [ ] **Deployment automation** — reash to gates + metrics.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| K8s RollingUpdate | Built-in strategy | Default deployment upgrade |
| Argo Rollouts | Advanced progressive | Canary/BlueGreen + analysis |
| Flagger | Progressive delivery | Istio/Linkerd traffic policies |
| LaunchDarkly / Flagsmith | Feature flags | Runtime toggles |
| Istio / Linkerd | Traffic split + metrics | Canary weight control |
| Cloud deploy / deploment controllers | Cloud CD strategies | Managed rollout |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Rolling on K8s:** v1 deploy → v2 rollout (maxSurge/maxUnavailable) → status watch karo → rollback.
- [ ] **Lab 2 — Blue/Green:** Two deployments + service switch; cutover aur rollback dono demo.
- [ ] **Lab 3 — Canary Weights:** Istio (ya service mesh) se 10% traffic naye version pe bhejo, metrics compare karo.
- [ ] **Lab 4 — Feature Flag:** Ek flag se feature on/off karo deploy ke bina.
- [ ] **Project — Progressive Pipeline:** Argo Rollouts + analysis lagao — deploy naye version pe health gate fail hote hi auto-rollback.

## 🔗 Related Topics

- [⚙️ CI/CD](../modules/cicd.md)
- [☸️ Kubernetes](../modules/kubernetes.md)
- [🪢 Service Mesh](../modules/service-mesh.md)
- [Deployment Strategies](../topics/deployment-strategies.md)
- [Day 19 — Deployments & Services](../day-19-kubernetes-deployments-services.md)