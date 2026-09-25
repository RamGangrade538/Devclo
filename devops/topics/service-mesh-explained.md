# Deep Dive: Service Mesh — Istio, Envoy, Linkerd (Traffic, Security, Observability)

> **Standalone deep dive:** Network control bina app-code change: mTLS, retries, timeouts, canary, tracing — sab mesh layer me.

---

## 1. Why a Mesh? — The Problem it Solves

Microservices (30 services) need, in *each* service: timeout, retry, circuit breaker, TLS, auth policy, tracing, metrics. Doing that in every app = duplication + inconsistent. **Mesh moves those to a proxy layer.**

```
Without mesh (n x m code):                With mesh (sidecar proxy):
srv A: httpclient(timeout, retry, tls)    pod = [app + envoy sidecar]
srv B: same...                            envoy does: retry/tls/routing + emits metrics
                     ── more services = more duplicated brittle code ──
```

---

## 2. Architecture — Control Plane & Data Plane

| Plane | Tools | Responsibility |
|-------|-------|----------------|
| **Data plane** | Envoy proxies (sidecars) | Fast-path: route, load-balance, retry, mTLS, metrics per request |
| **Control plane** | istiod | Config distribution (XDS), cert issuance, service discovery |
| **Ingress/Egress** | Gateway / Sidecar | North-south (LB), east-west (internal); route to external too |

**Traffic:**
```
Client → Gateway (Envoy, L7) → pod-sidecar A → mTLS → pod-sidecar B → app B
Config (VirtualService/DestinationRule) pushed by istiod (XDS with mTLS/SPIFFE)
```

---

## 3. Core Objects (Istio)

| Object | What it does |
|--------|--------------|
| `VirtualService` | Host-based routing: headers, weight, retries, timeouts, fault-injection (A/B testing, canary, shadowing) |
| `DestinationRule` | Subset (version pools), load balancing algo, connectionPool (limits), TLS settings (ISTIO_MUTUAL) |
| `Gateway` | Ports/hosts exposed at edge (in.../ingressgateway) |
| `ServiceEntry` | Register external (non-mesh) endpoints |
| `PeerAuthentication` | mTLS mode per namespace (STRICT/PERMISSIVE/DISABLE) |
| `AuthorizationPolicy` | Allow/deny at L7 (paths, methods, principals) — default-deny pattern |

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: myapp-vs }
spec:
  hosts: ["myapp.example.com"]
  gateways: [app-gw]
  http:
    - match: [ { headers: { "x-canary": { exact: "true" } } } ]
      route: [ { destination: { host: myapp, subset: v2 } } ]
    - route:
        - destination: { host: myapp, subset: v1 }
          weight: 90
        - destination: { host: myapp, subset: v2 }
          weight: 10
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: connect-failure,retriable-status-codes
      timeout: 10s
```
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata: { name: deny-all }        # zero trust default
spec: { rules: [] }
---
kind: AuthorizationPolicy
metadata: { name: allow-billing-admin }
spec:
  action: ALLOW
  rules:
    - when:
        - key: request.auth.claims[roles]
          values: ["billing:admin"]
      to:
        - operation:
            methods: ["PUT"]            # L7 path-based RBAC
            paths: ["/api/billing/*"]
```

---

## 4. Security — mTLS & SPIFFE, Zero Trust

- **mTLS (mutual TLS):** both sides verify certs; **automatic** in a mesh (enabled via PeerAuthentication STRICT). Identity = SPIFFE (service account) — workload identity, rotated automatically.
- **SPIFFE** = standard for workload identity (`spiffe://cluster.local/ns/<ns>/sa/<sa>`); certs issued by istiod, rotated; no manual certs.
- **AuthorizationPolicy** = L7 RBAC (who can call what path). Start **default-deny**, then allow explicit.

```
Workload A identity: spiffe://cluster.local/ns/prod/sa/myapp
  → mTLS with B; B enforces authz (only principal X allowed on path /create)
```

---

## 5. Traffic Management — Canary & Resilience

CANARY example (progressive delivery):
```
Release v2 → VirtualService weight 5% → monitor p99/error via Prometheus
→ apply weight 100 (or auto via Argo Rollouts + AnalysisTemplate metrics)
Rollback = set weight 0 / revert commit (GitOps) — seconds, no code change
```
RESILIENCE in mesh (instead of app-framework):
```
retries(exponential backoff) + timeout(5s) + circuit-breaker(DestinationRule) + 
fault-injection(chaos: 500 or delay) → verify app handles gracefully (Day 40 synergy)
```

---

## 6. Observability Without Instrumentation

Sidecar automatically emits:
```
METRICS: envoy_request_duration, requests_total (per service/route) → Prometheus
TRACES:  distributed traces with span (journal) → Jaeger/Tempo/Zipkin (bina SDK!)
ACCESS LOGS: structured per-request
```
Kiali = interactive graph (nodes healthy/unhealthy, traffic flows, "canary split visual").

---

## 7. Linkerd — the "Boring" Alternative

| Feature | Istio | Linkerd |
|---------|-------|---------|
| Data plane language | Envoy (C++/Go) | Rust (linkerd2-proxy) — lean |
| Install complexity | higher (many CRDs) | `linkerd install` — 3 cmd |
| Feature set | richest (gateway, authz L7, fault) | enough (retries, timeouts, mTLS; ServiceProfiles) |
| Footprint/resources | heavier | minimal (~2 cores / node) |
| Best for | complex L7 needs, enterprise | simplicity-first, K8s-only, low overhead |

- **ServiceProfile** = per-service spec (retries/timeouts via OpenAPI), not VirtualService
- Built-in golden-metric dashboards (tap command)
- good "default mesh" for teams starting with mesh concepts

---

## 8. When to Use / NOT Use a Mesh

**Use when:** many services (10+), polyglot teams (one solution), strict zero-trust needs (compliance), canary-heavy release.
**Skip when:** tiny monolith, single-service, "app in a VM" — cost/ops overhead not worth it.
**Gateways vs API Management:** north-south external entry (APIM/Kong) still useful; mesh handles east-west + some ingress. Both combine fine.

---

## 9. Interview Questions — Service Mesh

| Question | Strong answer |
|----------|---------------|
| "Service mesh kya?" | Sidecar proxy (data plane) + control plane: traffic routing, mTLS, observability — decoupled from app code. |
| "Istio architecture?" | istiod (control: XDS + certs) + Envoy sidecars (data). Gateway for ingress. |
| "mTLS kaise?" | mutual cert verify via SPIFFE identity; PeerAuthentication STRICT auto-enables; no app change. |
| "Canary kaise karein?" | VirtualService weight 90/10 (or Argo Rollouts w/ AnalysisTemplate) → observe → promote/rollback by setting weight 0. |
| "VirtualService vs DestinationRule?" | VS = routing rules (headers/weight/retry/timeout); DR = subset pools, LB policy, connection, TLS mode. |
| "Observability bina code?" | Envoy emits metrics + spans per request; Kiali graph; traces to Jaeger/Tempo with no SDK. |
| "Istio vs Linkerd vs Envoy?" | Envoy=data-plane proxy; Istio=full control+mTLS+authz+gateway; Linkerd=lighter Rust sibling. |
| "Zero trust kaise madad?" | default-deny AuthorizationPolicy + mTLS + SPIFFE workload identity = per-request verified. |
| "Mesh vs API gateway?" | Gateway = external edge (auth, rate limit, TLS termination); mesh = internal east-west; can overlap. |

**Related:** [Day 33](../day-33-service-mesh-istio-linkerd.md) · [Observability](../topics/observability.md) · [Microservices](../topics/microservices-patterns.md) · [API Gateways](../topics/api-gateways.md)