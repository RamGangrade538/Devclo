# Day 23 — Services, Ingress, DNS & Networking (DevClo Expanded)

## Overview | Parichay

Aaj podse traffic ka raasta seekhoge: **Services** (ClusterIP/NodePort/LoadBalancer), **Ingress/Gateway API**, **CoreDNS**, network policies aur kube-proxy. Ye din "pod → service → ingress → internet" ka full mental model banayega. Aaj ke tickets ka root cause mostly **label/selector mismatch** hi hota hai — isliye selector ka confidence is day ka real output hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Service types: ClusterIP vs NodePort vs LoadBalancer — kab kya
- [ ] Selectors aur labels ka Service↔Pod connection
- [ ] Endpoints / EndpointSlices — Service ka real targeting
- [ ] Ingress — path/host-based routing, ingressClassName, TLS
- [ ] Gateway API (GA-2026): GatewayClass, Gateway, HTTPRoute — naya standard
- [ ] CoreDNS aur service DNS naming (`service.namespace.svc.cluster.local`)
- [ ] NetworkPolicies — default allow → deny-all → selectiv allow
- [ ] kube-proxy (iptables/IPVS) aur external traffic paths (externalTrafficPolicy)

---

## Full Topic (LEARN) | Puri Detail

### 1. Service | Pods Ka Payback

Pods ephemeral hain (IP change hota rehta hai). Service = stable virtual IP + port + DNS naam jo pods ke pool ko point karta hai. Service define hota hai **selector se** — label match karne wale saare pods iske targets.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP        # default — cluster ke andar hee
  selector:
    app: web             # ← yehi pods ko capture (mismatch = INC-605!)
  ports:
  - port: 80             # service ka port
    targetPort: 8080     # pod container ka port
```

**Types ka table:**

| Type | As access karein | Use Case |
|------|------------------|----------|
| **ClusterIP** | Cluster ke andar (internal) — `web:80`, ya kisi pod se | Microservice internal comms |
| **NodePort** | `nodeIP:30xxx` (3N range 30000-32767) | TLS/cluster pehi access, testing |
| **LoadBalancer** | Cloud LB (Azure LB) → public IP | Public apps |

LoadBalancer type par AKS ek Azure external (or internal) load balancer + public IP banata hai:

```bash
kubectl get svc web -o wide          # EXTERNAL-IP column dekho
kubectl get endpoints                # Service ke liye real pod IPs
```

`kubectl get endpoints` me IP har pod change pe update hota hai. EndpointSlices (new) zyada granular: `kubectl get endpointslices`.

### 2. Ingress | Smart Router

Ingress = Layer-7 router (HTTP/HTTPS): `host.example.com/app` → service A, `/api` → service B, with TLS termination. Kubernetes me **ingress controller** (nginx/contour/alb) install karna padta hai — Ingress resource sirf definition hai.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx      # ← controller ko batata hai (forgot = INC-606)
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: api
            port:
              number: 80
```

2026 me **Gateway API (GA)** iska successor hai — role-based (cluster team = Gateway, app team = HTTPRoute), portable, header-based routing, weighted backends (A/B testin native).

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
spec:
  parentRefs:
  - name: dev-gateway
  hostnames: ["app.example.com"]
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api
      port: 80
    - name: api-v2
      port: 80
      weight: 10      # canary 10%
```

### 3. DNS | CoreDNS — Service Ka Naam

CoreDNS automatic: control-plane me ek deployment, service `kube-dns` par. Naming convention: `service.namespace.svc.cluster.local`. Short form works same namespace: `web`. Other namespace: `web.default.svc.cluster.local`.

```bash
kubectl exec -it some-pod -- nslookup web.default.svc.cluster.local
kubectl run dns-test --image=busybox --rm -it -- nslookup web
```

CoreDNS config: ConfigMap `kube-system/coredns`. Pod hi DNS me insert nahi hota (Service hoti hai) — isliye `hostNetwork` pods ko service nahi milti.

### 4. NetworkPolicies | Firewall Inside Cluster

Default: **allow all**. Policy likhne par only allowed traffic flows (ingress/egress ke saath selector). AKS me **Azure CNI** per-pod IP + policy (via Calico/Hubble) support karta hai.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: web
spec:
  podSelector: {}          # saare pods
  policyTypes: ["Ingress"]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-only
  namespace: web
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 8080
```

### 5. kube-proxy | Traffic Mechanic

Kube-proxy rules banata hai: davis (iptables) ya IPVS mode → Service ClusterIP packets → pod IP. `kubectl describe node` → IPVS enabled ya nahi. Traffic **even-spread**: kube-proxy random backend pick. `externalTrafficPolicy: Cluster` (default, SNAT — source IP lost) vs `Local` (source IP preserve, but ek node pe traffic imbalance).

### 6. 2026 Notes | Latest Kya Hai

- **Gateway API v1.2/v1.3 stable** — Ingress ko replace karne ki sahi road; implementation: NGINX, Envoy (Gloo/Contour), Azure Application Gateway/ALB, Istio.
- **Multi-cluster Mesh** (GMC) — Gateway API se cross-cluster traffic.
- **In-place Service IP sticky** / IPVS improvements; `ipFamilyPolicy` dual-stack stable.
- **Service Discovery** via mDNS/headless services nahi badla — but `*.svc.cluster.local` wildcard (ServiceImport me) ab multi-cluster aur permit.
- **Topology-aware routing** (`topology.kubernetes.io/zone`) — nodes/zone ke andar traffic daalo, latency bachao.
- **IPv4/IPv6 dual-stack** ab default supported. **Ingress v1** no more beta APIs.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `kubectl get svc -A` | Saare services + type + cluster IP + external IP |
| `kubectl get endpoints <svc>` | Selector match hue real pod IPs — selector mismatch yahan dikhega |
| `kubectl describe svc <svc>` | Selector + endpoints section |
| `kubectl get endpointslices -l kubernetes.io/service-name=<svc>` | New granular endpoints |
| `kubectl get ingress -A` + `describe` | Routing rules, class, TLS secret |
| `kubectl exec -it test -- nslookup <svc>.<ns>` | DNS resolution verify |
| `kubectl get networkpolicy -A` | Cluster policies list |
| `kubectl get svc web -o yaml` | Pura spec — type/selector/ports/externalTrafficPolicy |

---

## Practice Lab | Abhi Karein

1. Cluster banao (kind/k3d). Deployment `web` (replicas 3, containerPort 8080 — ek simple node/nginx image) apply karo.
2. **Service create:** ClusterIP service `web` (port 80 → targetPort 8080). `kubectl apply -f svc.yaml`
3. **Endpoints check:** `kubectl get endpoints web` → 3 pod IPs. **Sabse important step.**
4. **DNS testinh:** `kubectl run dnstest --image=nginx --rm -it -- curl web:80` → HTTP 200.
5. **Fake selector mismatch:** Service selector `app: websWrong` karke nayi service apply karo → `kubectl get endpoints wrong-svc` → `<none>` (ein exercise for INC-605).
6. **LoadBalancer:** `kubectl patch svc web -p '{"spec":{"type":"LoadBalancer"}}'` (kind par use port 8080+).
7. **Ingress controller (kind):** `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml`, wait `kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller`.
8. **Ingress create** `web-ingress.yaml` (host `web.local`, path `/`, ingressClassName nginx). Add `/etc/hosts` mapping.
9. **TLS test (optional):** self-signed secret + ingress TLS. `curl -k https://web.local`
10. **NetworkPolicy:** default deny-all + allow-only-frontend apply. `kubectl run other --image=nginx --rm -it -- curl api` → timeout; frontend pod se → 200.
11. `kubectl get svc,ingress,networkpolicy,endpoints -A` — poori topology screenshot.
12. Cleanup.

---

## Incidents / Tickets | Real Practice

### INC-605 · Service Not Accessible

- **Situation:** `checkout-svc` Create hui thi, apps `curl` me `Could not resolve host` ya connection timeout. Ready pods deng — Service endpoint empty.
- **Investigate:** `kubectl get pods -n prod -l app=checkout` → pods Running (3/3). `kubectl get endpoints checkout-svc -n prod` → **`<none>`** (myal sabse bada clue). `kubectl describe svc checkout-svc` → Endpoints section empty, Selector shows `app: check-out`. Now `kubectl get pods --show-labels` → pods have `app: checkout`.
- **Root cause:** Service ka **selector mismatch** — YAML me `app: check-out` (hyphen) while deployment pods par label `app: checkout`. Labels ko match nahi → endpoints empty → Service ka koī target nahi → traffic kisi ko nahi milta.
- **Fix:** `kubectl patch svc checkout-svc -n prod -p '{"spec":{"selector":{"app":"checkout"}}}'` (yanki `kubectl edit`). Service ab selector ko match.
- **Verify:** `kubectl get endpoints checkout-svc` → 3 IPs. `kubectl run test --image=curl --rm -it -- curl checkout-svc:80/health` → 200. **Golden rule: Service troubleshoot → sabse pehle `kubectl get endpoints`.**
- **Blast radius | Prevent:** Poora checkout flow was down (purchase nahi ho raha). Detect faster: endpoint count alert (Service with 0 endpoints > 5 min). Prevent: selector+label ek hi source of truth (Helm template se label value ek var), yaml linting, CI job `kubectl get endpoints` assert.

### INC-606 · Ingress Failure (404 / default backend)

- **Situation:** Domain `api.company.com` se SSL dead, /mainit basic (NGINX default backend "404 Not Found"). Pods + Service running.
- **Investigate:** `kubectl get ingress -A` → resource hai. `kubectl describe ingress api-ingress` → **Rules columns; Class column?** Ingress resource me `ingressClassName` nahi. `kubectl get ingressclass` → controller installed hai (nginx). `kubectl get pods -n ingress-nginx` → ingress controller running.
- **Root cause:** Ingress resource me `ingressClassName: nginx` missing (ya annotation purana `kubernetes.io/ingress.class`). Without class, controller match nahi karta → koī rule apply nahi → default backend 404. DNS host bhi redirect-set-host mismatch ho sakta tha (but yahan root cause class hi).

**Fix:** `kubectl edit ingress api-ingress` → add `spec.ingressClassName: nginx`. Annotations (rewrite-target) verify karo. `kubectl get ingress api-ingress` me CLASS column ab nginx dikhaye.
- **Verify:** `curl -sI https://api.company.com/v1/health` → 200. `kubectl get ingress -o wide` → Classes listed. TLS secret correct path (`secretName`) bhi kabhi kabhi hona — `kubectl get secret app-tls` type `kubernetes.io/tls`.
- **Blast radius | Prevent:** Pure API public route down — sab external clients (integrations, apps). Detect faster: ingress controller Prometheus metrics (4xx/5xx trend + owner alert), external uptime check. Prevent: chart me mandatory `ingressClassName`, gateway API me parentRefs ek jagah.

---

## Interview Corner | Sawal-Jawab

**Q1: ClusterIP vs NodePort vs LoadBalancer — kab use karte ho?**
ClusterIP (default) — cluster andar internal; NodePort — cluster IP kisi bhi node par public (3N, testing/pre-dev); LoadBalancer — cloud LB (Azure), production public; Ingress ek hi entry se multiple Service (layer-7). Kubernetes Service types layer se zyada use-case decision.

**Q2: Service se endpoints kyu empty hai?**
Selector ka pod labels se match nahi ho raha (typo, ename), ya pods ready nahi (readiness). Debug: `kubectl get pods --show-labels`, `kubectl describe svc` (show selector), `kubectl get endpoints`.

**Q3: Ingress aur Gateway API (HTTPRoute) me kya difference hai?**
Ingress: namespace-level resource, single shared class field, no per-route authn. Gateway API: Gateway (cluster-level, infra owner) + HTTPRoute (app owner) — separation-of-concerns, header/weight-based routing, portability, multi-team safe. 2026 me naya = Gateway API.

**Q4: NetworkPolicy default behavior kya hai?**
No policy = allow all. Jaise hi koi pod matlab policy select karta hai, whitelist semantics apply. Production me default namespace deny-all + service-to-service allow-pattern recommended.

**Q5: kube-proxy kya karta hai? Service IP ka traffic pod tak kaise pahunchta hai?**
kube-proxy har node pe service IPs ko iptables/IPVS rules me convert karta hai: dol CNI whodst karta hai. Request node → kube-proxy rule → pod (any ready backend). AKS Azure CNI per-pod IP deta hai to in-cluster routing direct.

---

## Quick Notes | Yaad Rakhna

- Service ↔ Pod connection **label selector** hi hai — mismatch = empty Endpoints = traffic dead. Kubectl get endpoints ispe first command.
- Service types ladder: ClusterIP → NodePort → LoadBalancer (public entry).
- Ingress = layer-7 router, ingress-class key hai; Gateway API is the 2026 standard — HTTPRoute ke saath.
- CoreDNS: `service.namespace.svc.cluster.local` — app se DB connect `postgres:5432` nahi IP se.
- NetworkPolicy default allow-all hota hai — deny-by-default design karo.
- EndpointSlices — naya may scale wala mechanism.
- Security: TLS via ingress; secrets `secretName`.

---

**Kal:** Azure Monitor, KQL, Container Insights aur Key Vault + CSI + workload identity.