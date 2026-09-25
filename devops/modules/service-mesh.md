# 🪢 Service Mesh — mTLS, Traffic, Observability for Services

> **Hinglish:** Service mesh = services ke beech **network layer ka super-agent** — TLS (mTLS), traffic split, retries, observability, auth — bina app code change kiye. Ye module Istio/Linkerd: sidecar, virtual service, destination rule concepts cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Jab services badh jaati hain, har service ko TLS/Retry/metrics **khud implement** karna padta hai. **Service mesh** ye functionality **sidecar proxy** (envoy) ke through inject karta hai — app code **touch nahi karna** padta.

Components: **data plane** (sidecars — traffic carry), **control plane** (policy + config — Istiod/Linkerd). Features: **mTLS** (encrypted + authenticated service-to-service), **traffic management** (routing, mirroring, circuit breakers), **observability** (metrics, tracing per-hop), **security** (authn/authz on mesh), **retries/timeouts**, **mTLS for legacy** (autencryted for old workloads), **east-west traffic** control (services ke beech, vs north-south ingress/egress). Note: mesh add complexity + resource — small scale pe zaroori nahi.

## 🟢 Beginner — Shuruaat yahan se

- Data plane vs control plane — diagram.
- Sidecar proxy kya hai.
- mTLS vs normal TLS — mutual auth.
- Istio/Linkerd flavor — kab kaun.

## 🟡 Intermediate — Ab mesh daalo

- Mesh namespace install + sidecar injection on/off.
- mTLS strict mode + peer auth.
- Traffic split — canary routing via VirtualService.
- Retries + timeouts + circuit breaker policy.

## 🔴 Advanced — Pro bano

- **Authorization policies** — services access control.
- **Tracing across mesh** — per-hop distributed trace.
- **Mirroring (shadow traffic)** — test prod copy.
- **Mesh performance** — sidecar resource impact measure.
- **Mutual model trade-offs** — mesh vs non-mesh hybrid.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Service mesh** — network layer for service comms.
- [ ] **Sidecar proxy** — per-pod envoy container.
- [ ] **Data plane** — proxies carrying traffic.
- [ ] **Control plane** — config/policy manager.
- [ ] **mTLS** — mutual TLS (both sides verify).
- [ ] **Traffic management** — routing/control.
- [ ] **Canary / traffic splitting** — % to new version.
- [ ] **Circuit breaker** — failure isolation.
- [ ] **Retries/timeouts on mesh** — resilience per-hop.
- [ ] **VirtualService** — route rules.
- [ ] **DestinationRule** — load-balance + TLS settings.
- [ ] **Authorization policy** — who can call whom.
- [ ] **Observability per hop** — metrics + tracing.
- [ ] **Ingress/egress** — north-south boundary.
- [ ] **East-west traffic** — inter-service.
- [ ] **Service identity** — SPIFFE identities.
- [ ] **Ambient / sidecar-less** — modern mesh modes.
- [ ] **Mesh resource overhead** — latency/memory cost.
- [ ] **Envoy** — the proxy engine.
- [ ] **Pain of no mesh** — duplicated TLS/logic per app.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Istio | Full-featured mesh | Rich traffic/security |
| Linkerd | Lightweight mesh | Simplicity + perf |
| Consul service mesh | Service discovery + mesh | Hybrid/multi-cloud |
| Envoy proxy | The data plane | Platform gateway |
| Kiali / Grafana | Mesh visual/obs | Dashboards |
| OpenTelemetry | Tracing std | Distributed traces |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Mesh 101:** Istio/Linkerd install on kind; inject sidecar, `istioctl proxy-status` check.
- [ ] **Lab 2 — mTLS Strict:** PeerAuthentication strict; unannotated call fail, annotated pass.
- [ ] **Lab 3 — Canary Split:** 2 deployments; VirtualService 90/10 split; traffic observe.
- [ ] **Lab 4 — Authz Policy:** Deploy blueprint deny; allow GET specifically; test call.
- [ ] **Lab 5 — Tracing:** Jaeger + OTEL in mesh; trace api → order → payment per-hop.

## 🔗 Related Topics

- [☸️ Kubernetes](../modules/kubernetes.md)
- [🧩 Service Architecture](../modules/service-architecture.md)
- [📡 Observability](../modules/observability.md)
- [Service Mesh (Istio/Linkerd)](../topics/service-mesh-explained.md)
- [Day 33 — Service Mesh (Istio/Linkerd)](../day-33-service-mesh-istio-linkerd.md)