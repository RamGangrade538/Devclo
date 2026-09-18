# Deep Dive: HTTP & REST APIs — Web Ki Andar Ki Baat

> **Kaha ka hai:** Day 5 (networking) + Day 46 (API gateways) ka foundation. Har tool (curl, browser, kubectl, cloud APIs) HTTP use karta hai — **ye samjhe bina DevOps nahi**.

---

## 1. HTTP Basics — Client Request, Server Response

```
Client (browser/curl) ──── Request ────►  Server
Client ◄─── Response ────────          (nginx, API, LB)
```

Request + response dono me **line + headers + body**:

```
POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer <token>
Content-Length: 42

{"name":"dev","role":"devops"}
```

```
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store

{"id": 7, "status": "created"}
```

```bash
# Curl se dekho — verbose sab dikhata hai
curl -v https://example.com
```

---

## 2. HTTP Methods — Table Yaad Rakho

| Method | Matlab (Idempotent?) | REST Ka Use |
|--------|----------------------|-------------|
| `GET` | Read (YES) | Read resource |
| `POST` | Create (NO) | Create/search/fx |
| `PUT` | Full replace (YES) | Replace resource |
| `PATCH` | Partial update (YES) | Update fields |
| `DELETE` | Delete (YES) | Delete resource |
| `HEAD` | Headers only (YES) | Check existence |
| `OPTIONS` | Allowed methods | CORS preflight |

> **Idempotent** = same request dobara bhejo → same result. Retry-pura safed banata hai. POST **nahi** idempotent — isliye retry pe duplicate create ho sakta hai (isliye `Idempotency-Key` header).

---

## 3. Status Codes — 5 Groups, Bhoolna Mat

| Group | Meaning | Common Codes |
|-------|---------|--------------|
| **1xx** | Informational | 100 Continue |
| **2xx** | Success | 200 OK, 201 Created, 204 No Content |
| **3xx** | Redirect | 301 Moved Permanently, 302 Found, 304 Not Modified |
| **4xx** | Client error (tumhari galti) | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests |
| **5xx** | Server error (meri galti) | 500 Internal, 502 Bad Gateway, 503 Unavailable, 504 Gateway Timeout |

**CI/CD-important:**
- `401` vs `403` — 401 no auth, 403 wrong permissions
- `429` = rate-limited (backoff!) — `Retry-After` dekhna
- `500` vs `502` vs `503` vs `504` — 502 = upstream bad, 503 = overloaded (LB check), 504 = upstream timeout

---

## 4. Headers Jinhe Reliance Hai

| Header | Role |
|--------|------|
| `Host` | Kya virtual server pe jaa rahe ho (vhost/SNI) |
| `Content-Type` | Body type (`application/json`) |
| `Authorization` | Credentials/token |
| `Cache-Control` | Caching (no-store / max-age / must-revalidate) |
| `X-Request-Id` / `traceparent` | Tracing correlation (SRE) |
| `Retry-After` | Rate-limit ya maintenance se bhi |
| `Location` | Redirect/create ke baad resource URL |

**Security headers (site aur API dono pe jaane dono):**
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## 5. REST API Design — Consistent Contract

**Resource = noun, method = verb:**
```
GET    /users            → list
POST   /users            → create
GET    /users/:id        → one
PUT    /users/:id        → replace
PATCH  /users/:id        → update
DELETE /users/:id        → delete
GET    /users/:id/orders → nested sub-resource
```

Good design checkpoints (interview me poocha jata hai):
1. **Naming:** plural nouns, lowercase, kebab-case
2. **Versioning:** `/v1/`, `Accept: application/vnd.api+json`
3. **Pagination:** `?page=2&limit=50` → response: `total`, `pages`
4. **Filtering/Sorting:** `?status=active&sort=-created_at`
5. **Errors:** consistent shape
   ```json
   { "error": { "code": "VALIDATION_ERROR", "message": "email invalid" } }
   ```
6. **Idempotency:** POST create pe `Idempotency-Key` support
7. **HATEOAS (optional polish):** response me next actions ke links

---

## 6. Caching — Cache-Control, ETag, 304

| Header | Matlab |
|--------|--------|
| `Cache-Control: max-age=300` | CDN/browser 5 min stale |
| `Cache-Control: no-store` | Bila cache (auth/admin) |
| `ETag: "abc123"` | Version fingerprint |
| `If-None-Match: "abc123"` | Conditional request → 304 |

```bash
curl -I https://example.com/           # ETag/Cache-Control dekh
```

**Pitfall:** stale data — cache key = URL+query me sensitive data nahi; cache purge on publish (invalide).

---

## 7. HTTPS & SNI — `curl https` Ke Andar

- **TLS handshake** → certificate verify → encrypted channel (detail: [TLS & PKI](../topics/tls-certificates-pki.md))
- **SNI:** Hostname certificate select karta hai (ek IP pe multiple domains)
- Expired/self-signed certs curl `-k` se bypass — production me **kabhi nahi**

```bash
curl -I https://example.com           # response headers
curl --max-time 5 -sS URL             # timeout backdoor
curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" URL   # latency check!!
```

**Health-check standard:**
```bash
curl -fsS http://localhost:8000/healthz || exit 1
# Load balancer/kubernetes probes isi se kaam karte hain
```

---

## 8. API Debugging Tools

```bash
curl -v URL
curl -X POST -H "Content-Type: application/json" -d '{"n":1}' URL
# jq — JSON parse
curl -s https://api.github.com/repos/anomalyco/opencode | jq -r '.name,.stargazers_count'
# headers only
curl -I URL
```

**Browser devtools:** Network tab — status code, timing waterfall, headers, preview. Sab API calls wahin dekh sakte ho.

---

## 9. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **API 502/504** | Upstream down/timeout | Check backend health, LB timeouts, upstream logs |
| **401 vs 403 confusion me sit** | Auth ok but access nahi | Audit IAM/role; 401=token, 403=permission |
| **Secret auth header unexpectedly leaked** | `curl -v` se logger me | Sensitive header logging off; token short-lived |
| **"Cookies" CORS error** | Cross-origin | `OPTIONS` preflight pe `Access-Control-*` headers |
| **Slow API but response ok** | Timein p99 badha | jq timing + trace + DB query ana |
| **Browser cache purani data** | Stale ETag/max-age | bump `Cache-Control: max-age=0, must-revalidate` ya ETag |

---

## 10. Interview Questions — HTTP & REST

| Question | Strong Answer |
|----------|---------------|
| "GET vs POST?" | GET=read/idempotent, POST=create/non-idempotent. Params GET=query, POST=body. |
| "401 vs 403?" | 401 = not authenticated; 403 = authenticated but no permission. |
| "Idempotency kyun zaroori?" | Retry-safe; POST pe duplicate create se bachne ke liye Idempotency-Key. |
| "502 vs 503?" | 502 = upstream bad response; 503 = server available nahi (overload/maintenance). |
| "Cache-Control no-store vs max-age?" | no-store=never cache; max-age=seconds temp cache. Sensitive data no-store. |
| "REST resource naming?" | Plural nouns, verbs in methods, `/v1/users/:id`, consistent error shape. |
| "SNI kya?" | TLS handshake me client hostname bhejta hai — one IP many certs/vhosts. |
| "Health endpoint design?" | `/healthz` returns 200 + no auth-dependent logic; separate `/readyz` for readiness. |

---

## 11. Hands-On Lab

```bash
# 1. Bas line 06 practice
ENDP=https://api.github.com

# 2. Methods + status
curl -sS -o /dev/null -w "GET %{http_code}\n" $ENDP
curl -sS -X POST $ENDP/zen -o /dev/null -w "POST %{http_code}\n"

# 3. API to real service — JSON response
curl -s https://api.github.com/repos/anomalyco/opencode/tags \
  | jq -r '.[].name ' | head    # jq installed na ho to: python3 -m json.tool

# 4. Latency + headers
curl -sS -o /dev/null -w "code=%{http_code} time=%{time_total}s\n" https://example.com
curl -I https://example.com

# 5. REST resource lookup
curl -s https://jsonplaceholder.typicode.com/users/1 | jq '.name'
curl -s "https://jsonplaceholder.typicode.com/users?limit=2"

# 6. Health-check pattern
curl -fsS https://example.com || echo "down"
```

---

## 12. Summary | Yaad Rakho

1. Request/Response = start line + headers + body
2. Methods: GET(read), POST(create), PUT/PATCH(update), DELETE; idempotency matlab retry-safe
3. 2xx success · 3xx redirect · 4xx client · 5xx server
4. `curl -sS -w "%{http_code}"`, `-I` headers, `jq` parse
5. REST: plural nouns, `/vN/`, verb=method, consistent errors
6. Caching: `Cache-Control`, ETag, 304
7. Health: `curl -fsS /healthz` — k8s/LB isi se check karta
8. Security headers + secrets auth header pe log nahi

---
**Related:** [Day 5](../day-05-networking-fundamentals.md) · [DNS Deep Dive](../topics/dns-explained.md) · [Load Balancing](../topics/load-balancing-reverse-proxy.md) · [API Gateways](../topics/api-gateways.md) · [Microservices](../topics/microservices-patterns.md)