# Deep Dive: DNS — Internet Ki Phonebook Poori Samajh

> **Kaha ka hai:** Day 5 (Networking) ka gahra version. Har `curl`, `ssh`, `ping` ke peeche DNS ka hi kaam hai. Bina DNS ke internet kaam hi nahi karega.

---

## 1. Overview | Parichay

**DNS (Domain Name System)** = Internet ka distributed phonebook. Computers IP addresses (`20.190.139.19`) pe baat karte hain, lekin humans domain names (`devops.com`) yaad rakhte hain. DNS ka kaam: **name → IP mapping** karna, globally, reliably, fast.

**Why it matters:** Har web request, email, API call, container registry pull, Kubernetes service discovery — sab DNS se start hota hai. Agar DNS toota → sab toota.

**Core concepts:**
- **Hierarchical** — root → TLD (.com, .org) → domain → subdomain
- **Distributed** — koi single server nahi; millions of servers globally
- **Cached** — har level pe caching hoti hai (TTL based) for speed
- **UDP port 53** primary, TCP for large responses/zone transfers

---

## 2. Poora Flow Step-by-Step | `curl example.com` Jab Tum Type Karte Ho

```text
1. Browser check karta hai: local OS cache (etc/hosts, browser cache)
2. Agar nahi mila → OS asks configured **recursive resolver** (usually ISP/8.8.8.8/1.1.1.1)
3. Resolver apna cache check karta hai → hit? return answer
4. Miss? Resolver **Root Server** (.) se poochta hai: ".com ka authoritative kaun?"
5. Root → `.com` TLD nameservers ka IP deta hai
6. Resolver → `.com` TLD se poochta hai: "example.com ka authoritative kaun?"
7. TLD → `example.com` ke authoritative nameservers (ns1.example.com) ka IP deta hai
8. Resolver → authoritative nameserver se poochta hai: "example.com ka A record kya?"
9. Authoritative → final answer: `192.0.2.1` (ya CNAME/ALIAS)
10. Resolver → answer cache karta hai (TTL seconds ke liye) → OS/browser ko return
11. Browser → IP pe TCP connection banata hai → HTTP request bhejta hai
```

**Time:** Typically **20-100ms** (cached: <1ms). Cold lookup = 5-10 round trips.

---

## 3. DNS Record Types — Interview Ready Table

| Type | Purpose | Example | Notes |
|------|---------|---------|-------|
| **A** | IPv4 address | `example.com. 300 IN A 192.0.2.1` | Sabse common |
| **AAAA** | IPv6 address | `example.com. 300 IN AAAA 2001:db8::1` | Modern, dual-stack me dono chahiye |
| **CNAME** | Alias (canonical name) | `www.example.com. 300 IN CNAME example.com.` | **Root domain (@) pe CNAME allowed nahi** (RFC) — use ALIAS/ANAME (provider-specific) |
| **MX** | Mail exchanger | `example.com. 300 IN MX 10 mail.example.com.` | Priority (lower = higher pref); multiple for redundancy |
| **TXT** | Arbitrary text | `example.com. 300 IN TXT "v=spf1 include:_spf.google.com ~all"` | SPF, DKIM, DMARC, domain verification |
| **NS** | Nameserver delegation | `example.com. 300 IN NS ns1.provider.com.` | Zone delegation; glue records chahiye for child zones |
| **SOA** | Start of Authority | `example.com. 3600 IN SOA ns1 hostmaster 2024010101 7200 3600 1209600 3600` | Zone metadata: serial, refresh, retry, expire, minimum TTL |
| **PTR** | Reverse DNS | `1.2.0.192.in-addr.arpa. 300 IN PTR example.com.` | IP → name; email deliverability ke liye critical |
| **SRV** | Service location | `_sip._tcp.example.com. 300 IN SRV 10 5 5060 sip.example.com.` | Protocol-specific (K8s, SIP, LDAP) |
| **CAA** | CA Authorization | `example.com. 300 IN CAA 0 issue "letsencrypt.org"` | Kaun SSL certificate issue kar sakta hai |

**Pro tip:** `dig example.com ANY` → sab records ek saath (but rate-limited).

---

## 4. TTL (Time To Live) — Cache Ka Game

- **TTL = seconds** record cache rehta hai. `300` = 5 min, `3600` = 1 hour, `86400` = 24 hours.
- **Low TTL (60-300s):** Fast propagation during migrations, failover. Cost: more queries.
- **High TTL (1-24h):** Fewer queries, fast resolve. Cost: changes slow propagate.
- **Strategy:** Migration se **pehle** TTL 60s karo → wait old TTL expire → change IP → 2-3 din baad TTL wapas badhao.

**Real incident:** Company ne IP change kiya TTL 86400 ke saath → 24 ghante tak users purana IP pe gaye → downtime. Fix: TTL kam karo **pehle**.

---

## 5. DNS Tools — Hands-On Commands

```bash
# dig — King of DNS debugging
dig example.com                    # Default A record
dig example.com AAAA               # IPv6
dig example.com MX                 # Mail servers
dig example.com TXT                # SPF/DKIM/etc
dig example.com NS                 # Nameservers
dig example.com SOA                # Zone info
dig @8.8.8.8 example.com           # Specific resolver se query
dig +trace example.com             # Full delegation chain (root→TLD→auth)
dig +short example.com             # Sirf IP output (scripting ke liye)
dig +nocmd +nocomments +noquestion +nostats +noauthority +noadditional example.com  # Clean output

# nslookup — Simple interactive
nslookup example.com
nslookup -type=MX example.com
nslookup example.com 8.8.8.8       # Specific server

# host — Clean, fast
host example.com
host -t MX example.com

# getent — System resolver (uses /etc/nsswitch.conf)
getent hosts example.com
getent ahosts example.com          # IPv4 + IPv6 dono

# Debugging DNSSEC
dig +dnssec example.com
dig +cdflag example.com            # Checking disabled (bypass validation)
```

**Pro workflow for debugging:**
```bash
# 1. Check local resolution
getent hosts example.com

# 2. Query specific resolver (bypass local cache)
dig @8.8.8.8 example.com

# 3. Trace full chain
dig +trace example.com

# 4. Check authoritative directly
dig @ns1.example.com example.com

# 5. Verify TTL
dig example.com | grep -A1 "ANSWER SECTION"
```

---

## 6. Common DNS Issues & Troubleshooting

| Symptom | Likely Cause | Check Command | Fix |
|---------|--------------|---------------|-----|
| `curl` works by IP, fails by domain | DNS resolution broken | `dig example.com` / `nslookup example.com` | Fix resolver, check `/etc/resolv.conf` |
| Intermittent resolution | Multiple resolvers, one broken | `dig @8.8.8.8 example.com` vs `dig @1.1.1.1` | Standardize resolver, remove bad one |
| `SERVFAIL` | Authoritative down / DNSSEC fail | `dig +dnssec example.com` | Check auth servers, DNSSEC config |
| `NXDOMAIN` | Domain doesn't exist / typo | `dig example.com` | Check spelling, domain registration |
| Slow resolution | High latency resolver / no cache | `time dig example.com` | Use closer resolver (1.1.1.1, 8.8.8.8), enable local cache (systemd-resolved, dnsmasq) |
| Email not delivering | Missing/incorrect MX, no PTR | `dig MX example.com`, `dig -x <mail_ip>` | Add MX, set PTR with cloud provider |
| Subdomain not working | Missing NS/CNAME at parent | `dig sub.example.com NS` | Add delegation at parent zone |
| `CNAME` at root not working | RFC violation | `dig @8.8.8.8 example.com CNAME` | Use ALIAS/ANAME (Cloudflare, Route53, Azure DNS support) |

---

## 7. Advanced: DNS in Kubernetes & Cloud

**Kubernetes (CoreDNS):**
- Cluster-internal DNS: `service.namespace.svc.cluster.local`
- Pods resolve via `/etc/resolv.conf` → `nameserver 10.96.0.10` (CoreDNS)
- `ndots:5` default → 5 dots se kam wale names search domains me try hote hain (latency!)
- Fix: `dnsConfig: { options: [{name: ndots, value: "1"}] }` in pod spec

**Cloud DNS (Azure/AWS/GCP):**
- **Azure DNS:** Global anycast, alias records (point to Azure resources directly), DNSSEC
- **Route53:** Latency/geo routing, health checks, alias to ALB/CloudFront
- **Cloud DNS:** Low latency, DNSSEC, managed zones

**Split-horizon DNS:** Internal users get private IPs, external get public. Implement via:
- Azure Private DNS Zones (linked to VNet)
- Route53 Private Hosted Zones (VPC associated)
- CoreDNS `hosts` plugin / `rewrite` plugin

---

## 8. Security: DNS Hijacking, Cache Poisoning, DNSSEC

- **DNSSEC:** Cryptographic signatures on records → prevents spoofing. Enable at registrar + authoritative.
- **DoH (DNS over HTTPS) / DoT (DNS over TLS):** Encrypt queries → ISP can't see/snoop.
- **Cache poisoning:** Attacker injects fake records → resolver caches wrong IP. DNSSEC + random source ports + 0x20 encoding mitigates.
- **Domain hijacking:** Registrar account compromise → change NS records. Enable **registry lock**, 2FA, monitor NS changes.

---

## 9. Real-World Scenario: Zero-Downtime Migration

**Scenario:** `app.company.com` migrate from old IP `1.2.3.4` to new `5.6.7.8`.

**Step-by-step:**
```bash
# 1. Current TTL check
dig app.company.com          # Suppose TTL=3600 (1h)

# 2. Lower TTL to 60s (do this 24h before migration)
# At DNS provider: edit record → TTL=60

# 3. Wait 1h (old TTL expire) → verify new TTL active
dig app.company.com          # Should show TTL=60

# 4. Add new IP alongside old (both A records) — OR switch if single
# At provider: add 5.6.7.8, keep 1.2.3.4 temporarily

# 5. Verify both resolve
dig app.company.com          # Should show both IPs

# 6. Switch traffic (if using LB/Cloud) → monitor

# 6. After 24-48h stable → remove old IP

# 7. Raise TTL back to 3600/86400
```

**Key rule:** **Never change IP and TTL at same time.** TTL kam karo pehle, wait, then IP change.

---

## 10. Quick Interview Cheatsheet

| Question | Short Answer |
|----------|--------------|
| DNS port? | UDP 53 (primary), TCP 53 (zone transfer, large responses) |
| Root servers kitne? | 13 logical (A-M), each anycast → hundreds physical |
| Recursive vs Authoritative? | Recursive = client ke liye resolve karta hai (cache karta); Authoritative = zone ka final answer deta hai |
| CNAME at root? | RFC 1912/2181: **Not allowed** — use ALIAS/ANAME (provider-specific) |
| TTL kya hai? | Time-to-live in seconds; cache duration |
| `dig +trace` kya karta hai? | Root se start karke full delegation chain dikhata hai |
| Split-horizon DNS? | Internal vs external different answers (private vs public IPs) |
| DNSSEC kya karta hai? | Records sign karta hai → authenticity prove karta hai |
| PTR record kahan use hota? | Reverse DNS (IP → name); email servers check karte hain |
| CoreDNS `ndots` issue? | Pods me 5 dots se kam names search domains me try karte hain → latency; fix: `ndots:1` |

---

## 11. Practice Lab (Try in Terminal)

```bash
# 1. Basic lookup
dig google.com
dig google.com +short

# 2. Trace full path
dig +trace google.com

# 3. Query specific resolver
dig @1.1.1.1 google.com
dig @8.8.8.8 google.com

# 4. All record types
dig google.com ANY

# 5. Reverse DNS
dig -x 8.8.8.8

# 6. Check TTL
dig google.com | grep -A5 "ANSWER SECTION"

# 7. Verify DNSSEC
dig +dnssec google.com

# 8. Test from different locations (using online tools)
# https://dnschecker.org / https://www.whatsmydns.net
```

---

## 12. Summary | Yaad Rakho

1. **DNS = name → IP**; hierarchical, distributed, cached
2. **Record types:** A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA — sabke use case yaad rakho
3. **TTL = cache time**; migration se pehle kam karo (60s), baad me badhao
4. **Tools:** `dig` (king), `nslookup` (simple), `host` (fast), `getent` (system)
5. **Troubleshooting:** IP works/domain fails = DNS issue; check resolver, authoritative, TTL
6. **K8s:** CoreDNS, `ndots` latency fix, split-horizon via Private DNS
7. **Security:** DNSSEC, DoH/DoT, registry lock
8. **Real skill:** Zero-downtime migration = TTL management + verification

---
**Related:** [Day 5](../day-05-networking-fundamentals.md) · [Day 23 Azure Networking](../topics/azure-vnet.md) · [Interview Corner](../web/assets/interviews.js)