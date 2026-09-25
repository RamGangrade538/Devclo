# Deep Dive: API Gateways & Edge — APIM, Front Door, Rate Limits, WAF, Auth

> **Standalone deep dive:** The gateway is the front door of your whole backend: OAuth, throttling, caching, versioning, analytics — plus WAF + CDN in Front Door. Design the edge before clients arrive.

---

## 1. Gateway Responsibilities (the checklist)

```
AUTH        validate JWT/OAuth2 at edge (identity token, not every service!)
THROTTLE    rate-limit per key/client; quota plans; burst guard
CACHING     GET responses at edge (reduce origin load; cache keys)
ROUTING     /v1, /v2, header-based, canary/blue-green (some do)
TRANSFORM   CORS, rewrite, set headers, add trace-id
SECURITY    WAF (OWASP rules), IP allow/deny, TLS termination
OBSERVABLE  per-route metrics (latency/error/quota) → dashboards
POLICY      quick-build changes: deny path, log, transform, response shaping
```

---

## 2. Azure Inputs — APIM, Front Door, ASW til API layer

| Solution | Where | Role |
|----------|-------|------|
| **Azure Front Door** | global edge (regional) | CDN + WAF + URL routing/load-balance (origin failover), HTTPS, caching |
| **API Management (APIM)** | regional, behind Front Door | API governance: keys, quotas, versioning, policies, developer portal |
| **Application Gateway** | regional L7 LB w/ WAF | WAF + L7 LB + session/cookie affinity for backend pools |
| **Kong / Envoy Gateway** | OSS alternative | L7 routing, plugins (rate-limit, jwt, oauth) on k8s |

**Stack ordering:** Client → FrontDoor (edge CDN/WAF/failover) → APIM (API ops) → backends (mesh for internal east-west) — clean separation of concerns.

---

## 3. Auth at Edge — JWT / OAuth2 Validation

```xml
<!-- APIM policy: validate JWT (Entra ID) before backend -->
<inbound>
  <base />
  <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
    <openid-config url="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration" />
    <required-claims>
      <claim name="aud" match="all">
        <value>api://deploytrack</value>
      </claim>
    </required-claims>
  </validate-jwt>
</inbound>
```
Consumers get token from identity provider (Entra, Auth0, Keycloak) — gateway validates signature + audience; backend trusts `user claims` it receives.

---

## 4. Rate Limiting & Quotas

```xml
<rate-limit calls="60" renewal-period="60" />
<!-- or per subscription plan (token-based): -->
<quota calls="5000" renewal-period="86400" />
```
APIM subscription keys → per-app quota ("5000 calls/day free plan"); policies to differentiate tiers. Handle retry-after header + 429 responses gracefully.

---

## 5. Caching & Versioning

```xml
<!-- APIM cache -->
<cache-lookup vary-by-developer="false" />
<cache-store duration="60" />
```
```
Cache invalidation: by cache key (url+headers+params), version in path, purge via API
Versioning: /v1,/v2 with default 'v1'; OpenAPI imports per version
Deprecation: 'Sunset' header + 12-month exp + analytics; remove when usage=0
```

---

## 6. WAF — Protect from OWASP Top-10

```bash
# Front Door WAF policy (rule pack OWASP 3.x + managed rule sets)
az network front-door waf-policy create -g rg -n wafpolicy --sku Premium_AzureFrontDoor
az network front-door waf-policy managed-rules add -g rg --policy-name wafpolicy \
  --managed-rule OWASP  # blocking modes for SQLi, XSS, RFI
# +MS threat intelligence rules; custom rules for ip allow/block
```
WAF intercepts before app: SQL injection, XSS, path traversal, protocol attacks — first responder to internet abuse.

---

## 7. Observability of the Edge

- APIM: Request reporting (per API/product latency/errors/quota hits) → Log Analytics
- Front Door: metrics (request, hit ratio, origin health, geo) + diagnostics
- Add `trace-id` (W3C) at ingress so edge→app→mesh trace one line
- Alert on: error %, high latency p95, throttled-requests rate, WAF block rate

---

## 8. Interview Questions — API Gateways

| Question | Strong answer |
|----------|---------------|
| "Why gateway?" | Centralize auth/throttle/caching/versioning/observability at one controlled edge instead of per-service logic; change policies without redeploying every service. |
| "APIM vs Front Door?" | Front Door = edge: CDN/WAF/global routing/failover; APIM = API platform: subscriptions, policies, developer portal. Layered. |
| "Rate-limiting?" | per-key/plan quota policies; 429 + Retry-After; different tiers from one gateway. |
| "JWT validation where?" | At gateway — verify signature/aud/exp once, pass claims to trusted backend. |
| "Versioning strategy?" | URI or content negotiation; max N+1; deprecation header + window; contract tests at CI. |
| "WAF rules?" | OWASP managed rule sets auto-updated; managed + custom; inspect WAF logs for false positives. |
| "Edge caching invalidate?" | Cache key by url+query+auth; purge by key/version; TTL per route sensitivity (don't cache user-specific). |
| "Gateway as single point of failure?" | Pluggable − scale out; FrontDoor multi-edge; health checks + origin failover; keep golden rule 'gateway stateless'. |

**Related:** [Day 46](../day-46-api-gateways-microservices.md) · [Microservices](../topics/microservices-patterns.md) · [Service Mesh](../topics/service-mesh-explained.md) · [Cloud Security](../topics/cloud-network-security.md)