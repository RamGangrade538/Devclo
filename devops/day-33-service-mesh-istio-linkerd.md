📚 Topic 33: Service Mesh Deep Dive — mTLS, Canary # Day 33: Service Mesh — Istio & Linkerd (Traffic, Security, Observability) Traffic Control
✅ Prerequisite-checklist: (review Day 32 GitOps if needed)

## Overview | Parichay

> Service mesh = microservices ke beech **network ko programmatically control** karna — bina app code me changes. mTLS, retries, canary, tracing — sab mesh level pe.

## Overview | Parichay

15 microservices har ek ko apne me retry/timeout/auth likhne chahiye? No. **Service mesh** ek layer (control plane + data plane) inject karta hai jo:
- **Traffic** — routing, canary, retries, timeouts, failover
- **Security** — automatic mTLS, authorization (RBAC policy)
- **Observability** — metrics (Prometheus), traces (Jaeger/Tempo), access logs bina code ke

Istio = feature-rich (Envoy), Linkerd = lightweight (Rust data plane, easiest). Ingress/Egress bhi mesh se.

### Service mesh kyun — retry har service me mat likho

Microservices badhne ke saath har service me **retry, timeout, TLS, logging** likhna padta hai — 15 services x 4 concerns = 60 jagah same code, same bug. **Service mesh** ye sab ek **network layer** pe le aata hai: app sirf business logic likhe, networking policies mesh enforce kare. Kab use karo: service count badh gaya, mTLS chahiye, canary chahiye — 2-3 services pe manual bhi ho jata hai; mesh justified hai jab **consistency + scale ka pressure** ho. Analogy: har ghar ka apna guard nahi — society ka ek trained guard hi sab doors pe lagta hai.

### Sidecar proxy pattern — har pod ka bodyguard

**Data plane** = har pod ke saath ek **Envoy sidecar** container. Saara incoming/outgoing traffic proxy ke through jata hai (iptables redirect) — app ko lagta hai seedha call ho rahi hai, par proxy beech me sab pakad leta hai: route, encrypt, count, log. Fayda: **language-agnostic** (Java, Python, Go — sab ko same treat). Gotcha: sidecar extra resource khaata hai (CPU/memory requests dena padta hai), aur injection ke baad pod restart hota hai — production me `PodDisruptionBudget` ke saath rollout karo.

Sidecar inject hone ke baad traffic ka flow samjho:
```
Client app --> Envoy sidecar --> mTLS/route --> Envoy sidecar --> server app
        (app client ko poora path nahi dikhta — mesh manage karta hai)
```
Iskey liye app code `localhost` jaise calls karta chalta hai — par traffic actually proxy se nikla — ye "transparent proxy" pattern hai.

### Control plane vs data plane — istiod aur Envoy

Mesh ke do hisse: **data plane** = Envoy proxies jo actual packets forward karte hain; **control plane** = `istiod` jo proxies ko **certificates + config** (VirtualService, policies) distribute karta hai — out-of-band. Proxy config ko **pull** karta hai, isliye istiod down ho to existing traffic chill chalta rehta hai (data plane independent). Ye separation interview me common sawal hai: "traffic kaun route karta hai? Envoy. Envoy ko route kaun batata hai? istiod via xDS protocol."

### Traffic management — VirtualService, DestinationRule, Gateway

Teen CRs ka division yaad rakho: **Gateway** = ingress darwaza (kaunse host/port bahar se dikhte hain); **VirtualService** = routing rules (match → route, weight, headers, retries/timeouts); **DestinationRule** = destination ki policy (subsets jaise v1/v2, connection pool, mTLS mode). Sabse bada confusion: VS batata hai **"kahan bhejo"**, DR batata hai **"wahan pe kya policy"** — dono milkar canary, AB, aur circuit-breaker sab possible banate hain.

### Canary aur weighted routing — zero downtime release

Classic flow: naya version `v2` deploy karo par sirf **10% traffic** do; error/latency monitor; sahi dikhe to 100% — `VirtualService` me `weight: 90/10` + `DestinationRule` me `subsets` label match. Header-based match bhi on hai: sirf Chrome users ko pehle v2 (pre-validation). Fail pe weight 0 — **seconds me rollback, image rebuild nahi**. Gotcha: mesh canary **traffic-level** hai; app ke andar feature flags **logic-level** — dono alag tools hain, confuse mat karo.

```yaml
# VirtualService — 90/10 canary
- route:
  - destination: {host: myapp, subset: v1}
    weight: 90
  - destination: {host: myapp, subset: v2}
    weight: 10
```

Canary ka poora loop bata sakoge — ye interview ka favourite topic hai:
```
deploy v2 (subset) -> VS weight 90/10 -> monitor (Kiali/Prom)
   -> stable: weight 0/100 -> v1 delete
   -> fail: weight 100/0 -> v1 wapas (image rebuild nahi)
```
Timeouts/retries bhi `VirtualService` me `retries` + `timeout` fields se set hote hain — app code change nahi.

### mTLS aur zero-trust — mesh ka security layer

Mesh install hote hi **saara east-west traffic encrypt** ho jata hai (`PeerAuthentication` mode STRICT) — matlab pod-to-pod communication ab plaintext nahi; spoofing/miTM hat gaya. Upar **AuthorizationPolicy** se L7 allow/deny: "sirf frontend → payments service"; safest pattern = **default deny-all** phir explicit allow (zero-trust). Note: mTLS **service identity** deta hai (ServiceAccount se linked), IP-based trust nahi — pod change hone pe bhi policy valid rehti hai. Ingress pe TLS termination gateway level pe hota hai.

### Observability — bina code change ke

Har request ke liye **golden metrics** (QPS, error rate, latency) proxy se hi milti hain — app me instrumentation add karne ki zaroorat nahi. **Kiali** = service graph + health (red edges = errors), **Jaeger/Tempo** = distributed traces (Envoy ke spans), **Prometheus** = metrics scrape. Getting-started sabse easy: Kiali graph se turant dikhta hai kaun kis se baat kar raha hai aur kahan slow hai — yahi mesh ka asli ROI hai, jaane se pehle system samajhna.

Mesh observability vs app observability ka fark:
- **App metrics** — business events (orders, cart) — app instrumentation se
- **Mesh metrics** — network health (routing, retries, TLS) — proxy se hi
- Distributed traces dono ko jorte hain (span chain) — distributed systems me must

### Istio vs Linkerd — kab kaunsa

**Linkerd**: install minutes me (Rust data plane — halka), golden metrics built-in, kam knobs — pehli baar mesh wali team ke liye best. **Istio**: feature-rich (advanced traffic mangling, extensibility, multi-cluster), par complexity aur Envoy ka resource overhead zyada — bade enterprises ke liye. Choose on **requirement + team skill**, fashion se nahi. Interview ke liye 2 one-liners: Linkerd = simplicity, Istio = power.

Quick selection:
- **Pehli baar mesh, chhoti team** → Linkerd (install + golden metric built-in, mTLS by default)
- **Advanced traffic mangling (header/weight/mirroring), multi-cluster** → Istio
- **Confusion ho to** → dono ko demo/cluster pe try karke decide karo

Common gotcha sabka: proxy ka 5-10% latency overhead aur ek nayi layer jise team ko samajhna hai — isliye **phase-wise rollout** karo (pehle sirf critical paths), poore mesh me ek din me mat ghusedo.

## What You'll Learn | Aaj Ki Seekh

- [ ] Sidecar proxy pattern + Envoy
- [ ] Control plane (istiod) vs data plane (Envoy sidecars)
- [ ] VirtualService + DestinationRule + Gateway (Istio)
- [ ] mTLS zero-trust + PeerAuthentication/AuthorizationPolicy
- [ ] Canary/Weighted routing — zero downtime release
- [ ] Linkerd quick alternative

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart TD
    CLIENT["Client / Ingress"]
    subgraph MESH["K8s Cluster (Mesh)"]
        subgraph SVC1["myapp Service A"]
            A1["Pod-A v1"]
            A1B["sidecar Envoy"]
            A2["Pod-A v2 (canary 10%)"]
            A2B["sidecar Envoy"]
        end
        subgraph SVC2["billing Service B"]
            B1["Pod-B"]
            B2B["sidecar Envoy"]
        end
        OBS["istiod
        (cert + config)"]
    end
    CLIENT -->|"ingress gateway"| A1
    CLIENT -->|"10% weight"| A2
    A1B -.mTLS TLS-| B2B
    A2B -.mTLS.- B2B
    A1B --- OBS
    B2B --- OBS
```

ASCII:
```
Client → IngressGW → [v1 90% / v2 10%] → Billing service (mTLS encrypted, retries)
             istiod issues certs + distributes VirtualService/DestinationRule config
             Envoy sidecar per pod: routes, metrics, traces — app code = untouched
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Install Istio
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled

# 2. Ingress gateway (external traffic door)
cat > gateway.yaml << 'EOF'
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: app-gw
spec:
  selector:
    istio: ingressgateway
  servers:
    - port: { number: 80, name: http, protocol: HTTP }
      hosts: ["myapp.example.com"]
EOF

# 3. VirtualService — traffic rules (canary!)
cat > vs.yaml << 'EOF'
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: myapp-vs }
spec:
  hosts: ["myapp.example.com"]
  gateways: [app-gw]
  http:
    - match:
        - headers: { user-agent: { prefix: "Chrome" } }
      route:
        - destination:
            host: myapp
            subset: v2
    - route:
        - destination: { host: myapp, subset: v1 }
          weight: 90
        - destination: { host: myapp, subset: v2 }
          weight: 10
EOF

# 4. DestinationRule — pools + mTLS
cat > dr.yaml << 'EOF'
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata: { name: myapp-dr }
spec:
  host: myapp
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    connectionPool:
      tcp: { maxConnections: 100 }
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
EOF

# 5. Authorization (zero-trust: default deny)
cat > auth.yaml << 'EOF'
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata: { name: deny-all }
spec:
  rules: []
EOF

# 6. Observability (demo profile): dashboards + Jaeger
kubectl port-forward svc/kiali -n istio-system 20001:20001
# http://localhost:20001 → Kiali graph, traces, health

# 7. Canary test: deploy myapp v2, split 90/10, hammer ab, watch Kiali
for i in $(seq 1 100); do curl -s http://localhost/ > /dev/null; done
istioctl dashboard kiali
```

**Linkerd (simpler) alternative:**
```bash
linkerd install | kubectl apply -f -
linkerd check
kubectl annotate ns default linkerd.io/inject=enabled
# No VirtualService — Use ServiceProfiles for retries/timeouts. Golden metric dashboards built-in.
```

## Real-Life Example | Industry Me

**Billing service me bug fix:** billing v2 expected 100% sooner, but:
1. v2 ko 5% canary mile → monitor error rate + latency (Kiali + Prometheus)
2. User-agent header match Chrome → Chrome users pe v2 pre-validate
3. Sab theek → `kubectl apply` new DestinationRule, v2 → 100%
4. Kuch galat → weight 0 ya old tag wapas — **seconds me, code nahi change**

`mTLS` = k8s me install hone ke baad **saara east-west traffic encrypted** — zero-trust default, security team khush.

## Practice Exercise | Abhi Karein

1. Istio (demo) install + namespace inject
2. 2-version sample app (v1/v2 different text) deploy
3. Gateway + VirtualService: header-based + weighted routing
4. mTLS check: `istioctl peer-authentication` ya `kubectl exec` pods traffic — verify encrypted (`istioctl authz check`)
5. Kiali graph me traffic flow dekho
6. Load test (hey/ab) + dashboards (Istio metrics) check
7. Linkerd install + same app — compare simplicity

## Quick Notes | Yaad Rakho

```
- Sidecar Envoy proxy per pod = data plane; istiod = control plane
- VirtualService (traffic rules) + DestinationRule (pool/mTLS) + Gateway (ingress)
- Header match + weight = canary/ABrouting without code change
- AuthorizationPolicy = L7 policy (default-deny pattern)
- mTLS: PeerAuthentication (meshwide) + ISTIO_MUTUAL = zero-trust
- Kiali/Jaeger: graph + traces bina instrumentation ke
- Linkerd = simplest; Istio = most features; choose by team skill/cost
```

**Agla:** Security scanning tools (Trivy, Snyk, SAST/DAST) — images & code gates.