# Deep Dive: Load Balancing & Reverse Proxy — Traffic Ko Banta Hai

> **Kaha ka hai:** Day 5 (network) + Day 16/21 (compose/K8s) + Day 46 (API). Production me **app sirf ek server pe nahi chalti** — load balancer ke peeche. Ye DevOps ka core architecture skill hai.

---

## 1. Kya Problem Solve Karti Hai?

| Problem | LB Kaise |
|---------|----------|
| 1 server zyada traffic se mar gaya | Request spread across N servers |
| Server crash | Health-check → ise skip, baaki pe daalo |
| Zero-downtime deploy | Naya pod alive → LB traffic shift |
| Scaling | Add nodes, LB khud pe distribute kare |
| Single SSL/tls handling | TLS termination ek jagah (centralize) |

**Terms:** *Server pool (upstreams)*, *VIP/entry IP*, *health check*, *sticky session*, *weight*.

---

## 2. L4 vs L7 — Interview Ka Sabse Zyada Poocha Jaane Wala

| | **L4 (Transport)** | **L7 (Application)** |
|---|---|---|
| Kaunsa info dekhti | TCP/IP, port | HTTP path/headers/host |
| Speed | Fast (packet level) | Slower (must read req) |
| Features | Minimal | Routing by URL, caching, TLS, auth, rate-limit |
| Examples | AWS NLB, kube-proxy, nginx-stream, HAProxy tcp | AWS ALB, nginx http, Kong, Envoy |
| Use | TCP/UDP, high-perf | HTTP APIs, microservices |

```
L4: client --SYN--> LB --chosen server-- TCP passthrough
L7: client --GET /api/users--> LB (reads path) --> api-server pod
```

**Real usage:** L7 LB/S SLB pahle path-based route karta hai, phir us upstream pe L4-type TCP connection.

---

## 3. Load Balancing Algorithms

| Algorithm | Kya Karta Hai | Kab |
|-----------|---------------|-----|
| **Round-robin** | Sabko ek-ek turn | Default, even load |
| **Least connections** | Sabse kam active conn wale ko | Long-lived conn (websockets) |
| **Weighted** | Strong servers ko zyada | Uneven capacity |
| **IP hash** | Same client → same server | Sticky/session |
| **Consistent hash** | Keys (cache) same server | Redis-like caching |

```nginx
# nginx weighted round-robin
upstream api {
    server 10.0.1.10 weight=3;
    server 10.0.1.11 weight=1;
}
```

---

## 4. Health Checks — LB Ki Jigir

- **TCP check:** connect kar sakta hai?
- **HTTP check:** `GET /healthz` returns 200?
- **Deep check (readiness):** DB/queue dependency bhi check (k8s readiness probe)

```nginx
# nginx active health (ngx_http_healthcheck module ya open source me pass/fail)
server 10.0.1.10 max_fails=3 fail_timeout=30s;
```

```yaml
# k8s readiness (LB traffic tab tak nahi)
readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3
```

> **Golden:** readiness ≠ liveness. Readiness = "traffic do", liveness = "pod ko kill karo agar stuck". Dono alag.

---

## 5. Reverse Proxy — Sabse Pehli Entry, Certificate Khud Sambhalta

**Reverse proxy** = server side me ek entry jo backend services ko route karta hai, nginx/haproxy commonly.

```
Client → 443 → [Nginx: TLS, rate-limit, routing] → Flask/Golang/Node/php-fpm
```

**Kya karta hai:**
1. **TLS termination** (SSL cert ek jagah)
2. **Static files serve** (fast, app ko offload)
3. **Compression** (gzip), **caching**, **rate limiting**
4. **Microservice routing** (`/api/* → svc-a`, `/web/* → svc-b`)
5. **Client headers:** X-Forwarded-For/Proto/Host add

Nginx config skeleton (detail: [Nginx topic](../topics/nginx-web-server.md)):
```nginx
server {
  listen 80;
  server_name app.example.com;
  location / {
    proxy_pass http://api_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 6. Cloud LB — Azure/AWS/GCP (Concepts 1:1)

| Azure | AWS | Role |
|-------|-----|------|
| Azure LB (L4) | NLB/ALB | Distribute |
| **Application Gateway (L7)** | ALB | Path+header routing, WAF |
| **Front Door** | CloudFront | Global/edge + SSL + caching |
| Azure CDN | CloudFront | Static edge cache |
| Traffic Manager | Route53 | DNS-based global failover |

```
azure/profile -> FrontDoor -> [AppGateway -> apps] in region A
                          `-> [AppGateway -> apps] in region B (DR)
```

**Key flags interview me:**
- LB health probe ka timeout/interval tuning (fast failover)
- Sticky sessions (`session affinity`) — jinhe backend state hai uske liye, stateless apps me no.
- **Cross-zone/multi-AZ:** LB aur servers alag AZ me.

---

## 7. K8s Service Types — Kon LB Kaha Deti Hai

| Service | Load | Kaise |
|---------|------|-------|
| `ClusterIP` | Cluster internal LB | kube-proxy/iptables |
| `NodePort` | Node pe port → pod | Static port per node |
| `LoadBalancer` | Cloud LB → NodePort | Azure LB ingress |
| `Ingress` (L7) | Host/path routing | nginx/traffic-director |
| `Service mesh` | Sidecar LB | Istio/Envoy |

```
Client → Cloud LB :443 → Ingress-nginx → Service svc-a → Pods (round-robin)
```

---

## 8. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **LB uncovers unhealthy server late** | Probe slow/interval large | Health timeout 3s, interval 10s, executable; fail_timeout tune |
| **"Too many redirects"** | HTTPS loop nginx ↔ LB | Check X-Forwarded-Proto; nginx unencrypted internal, LB TLS — set scheme correctly |
| **Session lost on refresh** | Sticky nahi | enable session affinity (ya app stateless banavo) |
| **All traffic ek node pe** | Least-conn algorithm + health | Weight/least-connections; scale out |
| **Scale pod count badh but users nahi milte** | LB/Ingress discovery interval | Service selector correct, readiness probe, Ingress backend config |
| **WebSocket disconnect** | LB timeout | `proxy_read_timeout 3600s` / LB idle timeout badao |
| **Slow first request after deploy** | Cold start | Pre-warm, rolling (minReady), LB warmup |

**Debug tools:**
```bash
dig +short app.example.com            # VIP/edge IP
curl -sS -o /dev/null -w "%{http_code} %{time_connect}s\n" https://app
kubectl get svc,ep,ingress
sudo ss -tlnp | grep 443              # LB port pe kaun listen kar raha
```

---

## 9. Interview Questions — Load Balancing

| Question | Strong Answer |
|----------|---------------|
| "L4 vs L7 LB?" | L4=TCP/IP fast, L7=HTTP aware (path/host/header, TLS, caching). Use both — L7 route, fast L4 teletype. |
| "Round-robin vs least-conn?" | RR=even turn; least-conn=long-lived conn wale se. WebSockets/streams me least-conn. |
| "Health check kya karta?" | Unhealthy server ko remove karta hai — TCP/HTTP/deep probe; readiness vs liveness. |
| "Zero-downtime deploy LB ke saath?" | Rolling: new server healthy → traffic shift; probe gate. Blue-green: LB switch whole pool. |
| "Reverse proxy vs LB?" | LB = distribution + resilience; reverse proxy = routing + TLS + caching + rate-limit (nginx both). |
| "Sticky session kab?" | Jinhe server-side state hai (cart/session); stateless me avoid (sticky = scaling pain). |
| "Provider LB vs K8s ingress?" | Layer: cloud LB (edge/traffic) + ingress (L7 routing/cluster) + service (intra). Sabka role alag. |
| "502/504 behind LB?" | 502=upstream bad response; 504=upstream timeout. 70% of 5xx = upstream not LB. |

---

## 10. Hands-On Lab

```bash
# 1. Docker me 2 backend + 1 nginx LB demo
mkdir -p ~/lblab && cd ~/lblab
cat > index.html <<'EOF'
<body style="font-family:sans-serif"><h1>BACKEND 1</h1></body>
EOF
mkdir b1; mv index.html b1/; cp -r b1 b2; sed -i 's/BACKEND 1/BACKEND 2/' b2/index.html
cat > docker-compose.yml <<'EOF'
services:
  b1: { image: nginx:alpine, volumes: ["./b1:/usr/share/nginx/html:ro"] }
  b2: { image: nginx:alpine, volumes: ["./b2:/usr/share/nginx/html:ro"] }
  lb:
    image: nginx:alpine
    volumes: ["./lb.conf:/etc/nginx/conf.d/default.conf:ro"]
    ports: ["8080:80"]
    depends_on: [b1, b2]
EOF
cat > lb.conf <<'EOF'
upstream pool { server b1:80; server b2:80; }
server { listen 80;
  location / { proxy_pass http://pool; }
}
EOF
docker compose up -d
for i in 1 2 3 4 5 6; do curl -s localhost:8080 | grep -o 'BACKEND [0-9]'; done
# 2. Kill one backend — health/fails nginx
docker compose stop b1
curl -s localhost:8080 | grep -o 'BACKEND [0-9]'   # sab FIRST b2 hogi
docker compose restart b1; docker compose down
```

---

## 11. Summary | Yaad Rakho

1. LB = distribution + fault tolerance + zero-downtime deploy
2. L4 = TCP/IP (fast); L7 = HTTP-aware (routing/TLS/cache) — dono layers use karo
3. Algorithms: RR, least-conn, weighted, IP-hash — scenario pe choose
4. Health checks: TCP/HTTP/deep; readiness (traffic) vs liveness (restart aala)
5. Reverse proxy (nginx/HAProxy): TLS, static, routing, X-Forwarded-*
6. K8s: Service=LB, Ingress=L7, mesh=sidecar LB — layers ka chain
7. Sticky sessions → stateless apps = best scaling
8. Debug: `curl -w`, `dig`, `kubectl get svc/ep/ingress`, `ss -tlnp`

---
**Related:** [Day 5](../day-05-networking-fundamentals.md) · [HTTP & REST](../topics/http-rest-api-fundamentals.md) · [Nginx](../topics/nginx-web-server.md) · [Azure VNet](../topics/azure-vnet.md) · [API Gateways](../topics/api-gateways.md)