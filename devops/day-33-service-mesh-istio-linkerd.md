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