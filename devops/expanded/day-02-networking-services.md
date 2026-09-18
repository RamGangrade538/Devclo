# Day 02 — Networking, Ports & Services (DevClo Expanded)

## Overview | Parichay
Service down hai? 90% cases me root cause network hi hota hai: port closed, DNS sahi response nahi de raha, firewall rule order galat. Day 2 me tum seekhoge packet path ko trace karna, HTTP/DNS samajhna, aur firewall ko by-design lockdown karna — isi se INC-103 (nginx down) aur INC-104 (port conflict) jaisi asli tickets hal hoti hain.

## What You'll Learn | Aaj Ki Seekh
- [ ] IP/CIDR samajhna + public/private/loopback range
- [ ] Subnet math: kitne hosts, kaunsa network
- [ ] Sockets: `ss -lntp`, LISTEN vs ESTABLISHED, ephemeral ports
- [ ] HTTP methods + status codes (301/403/404/500/502/503) + `curl -I -v`
- [ ] DNS: `dig`, `nslookup`, `/etc/resolv.conf`, A/CNAME/TTL, resolution order
- [ ] Firewall: `ufw`/`firewalld`/`nftables`, rule ordering, zones
- [ ] Connectivity: `ping`, `traceroute/mtr`, `nc -vz`, packet path
- [ ] INC-103 aur INC-104 ticket ka full incident flow

## Full Topic (LEARN) | Puri Detail

### 1. IP Addressing & CIDR
- **Private ranges** (NAT ke peeche, internet pe route nahi): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. **Loopback**: `127.0.0.0/8` (localhost). Baaki sab public.
- **CIDR math**: `/24` = 256 addresses (254 usable), `/16` = 65536 (65534 usable), `/29` = 8 (6 usable — Azure subnet gotcha!). Usable hosts = `2^(32-prefix) - 2` (network + broadcast dono).
- **IPv6** ab default dual-stack hai — `::1` loopback, `fe80::/10` link-local, `2a01:...` public block. Interfaces me definiye hamara `ip -6 addr`.

### 2. Ports & Sockets
- Well-known ports: `22` SSH, `80` HTTP, `443` HTTPS, `3306` MySQL, `5432` Postgres, `6379` Redis, `27017` MongoDB.
- `ss -lntp` = **listening** sockets; `ss -tpn` = **established** connections; `ss -ltn` = port + state (bina process).
- **Ephemeral ports**: outbound connection ke liye client ko random port milta hai (~32768–60999).
- **netcat** = network swiss-knife: `nc -vz host 443` (port open?), `nc -l 9000` (test listener), `nc -zv host 1-1000` (mini port scan).

### 3. HTTP Deep
- Methods: `GET POST PUT DELETE PATCH HEAD OPTIONS`. Idempotent = `GET PUT DELETE` (repeat se same result).
- Status codes — yaad rakho ye table:

| Code | Matlab | Real cause |
|------|--------|------------|
| 301/302 | Redirect (permanent/temporary) | wrong base URL, http→https |
| 403 | Forbidden | App deny / ACL / IP block |
| 404 | Not found | Path/route galat |
| 500 | Internal server error | App exception/crash |
| 502 | Bad gateway | **Backend/upstream down** |
| 503 | Service unavailable | Overload / maintenance |
| 504 | Gateway timeout | Upstream slow/blocked |

- `curl -I url` = headers only; `curl -v url` = full handshake + TLS + request/response dump. `curl --max-time 10`, `-X POST -d '{}'`, `-H "Authorization: Bearer x"`.

### 4. DNS
- `/etc/resolv.conf` = nameservers + `search` domain. Ubuntu modern me `systemd-resolved` stub `127.0.0.53` pe hote hain.
- `dig` records: **A** = IPv4, **AAAA** = IPv6, **CNAME** = alias, **NS** = authoritative, **TTL** = cache duration.
- Resolution order: cache → `/etc/hosts` → resolvers.
- `dig example.com +short` quick; `dig +trace example.com` = pura chain (root → TLD → authoritative) — senior debugging trick.
- **Classic outage**: API calls 502 kar rahe hain → `dig api.internal` purana IP de raha hai (CNAME stale) — DNS change ke baad TTL expire nahi hua.

### 5. Firewall (2026)
- **ufw** (Ubuntu): `ufw allow 22/tcp`, `ufw deny 3306`, `ufw enable` — default deny incoming, allow outgoing.
- **firewalld** (RHEL-based): zones = trust levels; `firewall-cmd --zone=public --add-port=80/tcp --permanent`.
- **nftables** (modern iptables successor): chain/rule ordering; rules top-down = pehli matching rule jeet-ta (last `REJECT` sabko rok deta hai — isi liye order critical hai).
- Two VMs me: `ping` ok par `nc -vz` fail = firewall; dono fail = network path/DNS.

### 6. Connectivity & Path
- `ping` = ICMP (layer 3) — host up; `traceroute`/`mtr` = hop-by-hop path; `nc -vz` = TCP connect (layer 4).
- `ip route` = routing table; `ip neigh` = ARP neighbors.
- Kanha packet atka: client → gateway → (NAT) → cloud LB → NSG/security → VM → app. Har layer check order se karo.

### 7. Packet Path — Ek Incident Kaise Banta Hai
```
Client → DNS lookup → TCP connect (SYN/SYN-ACK) → TLS handshake → HTTP request → app response
```
1. **DNS fail?** Host resolve nahi hota → `curl: could not resolve host`.
2. **Port closed?** `curl: connection refused` — listener nahi hai (app down / bind fail).
3. **Firewall drop?** `curl: timed out` / nc silent — paket gira diya, koi response nahi.
4. **App layer?** TCP mil raha par HTTP 5xx — service alive, app/code me problem.
Senior approach: har layer ek hi command se — `dig` (1) → `nc -vz` (2) → `curl -v` (3) → app logs (4).

### 8. Load Balancer & Proxy Basics (Networking ka haath-paav)
- Cloud me VM ke aage **LB** (ALB/App Gateway/Load Balancer) hota hai: health probe backend pe bhejta hai.
- Agar backend unhealthy → LB us VM ko pool se nikalta hai → users ko 502/503.
- `X-Forwarded-For` header — real client IP se ho kyunki LB ke saamne ho tumhare app me raw IP nahi hota.
- Port mapping: LB `443` → backend VM `8080`; isi liye `ss -lntp` me 8080 listen dikhta hai, 443 nahi — confused mat hona.

### 2026 Notes
Kernel 6.x me `ss` replaced netstat fully; `ping` timestamps me ms; `mtr` GUI mode `mtr --report`. IPv6 default on; DNS over HTTPS local stub supported. `ufw` ab nftables backend pe chalta hai (no more iptables-legacy).

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `ip addr` / `ip route` | interfaces / routing |
| `ping -c4 host` | ICMP reachability |
| `mtr -rw host` | path + loss report |
| `ss -lntp` | listening ports + process |
| `ss -tpn` | established connections |
| `nc -vz host 443` | TCP port check |
| `curl -I -v http://host` | headers + handshake |
| `curl -s -o /dev/null -w "%{http_code}" url` | sirf status code |
| `dig example.com` / `dig +trace` | DNS query / full chain |
| `nslookup example.com` | simple DNS |
| `cat /etc/resolv.conf` | DNS config |
| `ufw status verbose` / `ufw allow 22/tcp` | firewall rules |
| `firewall-cmd --list-all` | firewalld zones |
| `vip`/`sudo nft list ruleset` | nftables rules |

## Practice Lab | Abhi Karein
Do VMs lo (Multipass: `multipass launch -n vm1 -n vm2`) ya WSL2 + cloud VM:
1. `ip addr` — har interface ka IP/CIDR note karo.
2. Ek private IP batao jo private range me ho; `172.17.x.x` docker bridge ho to bhi alag cheez karo.
3. `ss -lntp` — tina listener dikhe? (22, 53, jo service hai).
4. Doosri VM pe `nc -zv <vm1-ip> 22` → `succeeded` aana chahiye.
5. `ping -c4 <vm2-ip>` aur `mtr -rw <vm2-ip>` chalao.
6. `ufw status` → inactive; `ufw allow from <vm2-ip>` allow karo allow `ufw enable`.
7. Ab pehle jaisa `nc -zv` check karo — bina rule ke connect fail hota hai (default deny).
8. `curl -I https://example.com` → check `HTTP/2 200`.
9. `dig example.com +short` aur `dig example.com A` — record types compare karo.
10. `dig +trace example.com` — root se nikalo.
11. `curl -s -o /dev/null -w "%{http_code}\n" https://example.com/404` → `404` dikhna chahiye.
12. `ss -tpn` me apni curl connection ko dhoondo.

## Incidents / Tickets | Real Practice

### INC-103 · Nginx Service Down
- **Situation:** `payments-www-01` par website down. Users ko `connection refused` mil raha hai. `systemctl status nginx` bata raha hai service active hai par port 80 pe koi response nahi.
- **Investigate:**
  ```bash
  ssh deploy@payments-www-01
  systemctl status nginx
  journalctl -xu nginx --since "2 hours ago" | tail -40
  nginx -t                        # config syntax test
  ss -lntp | grep -E ':80|:443'
  ```
- **Root cause:** `nginx -t` me error: `nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)` — config me **server block duplicate** aa gaya tha (jaise `listen 80 default_server` do baar), ya phir naya `listen` flag galat. Nginx restart karne pe bind fail ho raha tha par private healthcheck old process pe chal rahi thi (VIP span). Asli cause: naya config deploy `include` galat directory se kiya — `/etc/nginx/sites-enabled` duplicate entry ka.
- **Fix:**
  ```bash
  sed -i '/default_server/d' /etc/nginx/sites-available/api.conf   # duplicate hatao
  nginx -t && systemctl reload nginx
  systemctl enable --now nginx
  ```
- **Verify:** `nginx -t` = `syntax is ok`; `ss -lntp | grep 80` → LISTEN; `curl -I http://localhost` → `200`.
- **Blast radius | Prevent:** Pura payment-suite frontend down (~6 lakh requests/day). Preventive: config **syntax test in CI/CD** (`nginx -t` gate), reload-not-restart, config versioned git me, monitoring port 80 TCP check (not just process alive).

### INC-104 · Port 8080 Already In Use
- **Situation:** Team poora din naya `order-api` v3 deploy kar rahi thi par app start hote hi crash — log me `BindException: Address already in use: bind 0.0.0.0:8080`. Purane service ko stop to kar diya, magic.
- **Investigate:**
  ```bash
  ss -lntp | grep 8080
  lsof -i :8080
  ps -ef | grep 8080
  systemctl list-units | grep -i order
  ```
- **Root cause:** Ek **puraana java process** (v2, nohup se chhoda hua, systemd ke bahar) abhi bhi port 8080 pakde hua tha. Jaise hi v3 start hua → port collide → crash. `ss -lntp` me woh java PID dikha jo login aadmi ka tha, kisi ko nahi pata.
- **Fix:**
  ```bash
  PID=$(ss -lntp | grep ':8080' | grep -oP 'pid=\K[0-9]+' | head -1)
  kill -15 $PID            # graceful
  sleep 3
  kill -9 $PID 2>/dev/null || true   # agar TERM pe na mane
  systemctl restart order-api
  ```
- **Verify:** `ss -lntp | grep 8080` — ab naya v3 PID LISTEN; `curl localhost:8080/health` → `200`.
- **Blast radius | Prevent:** Order placement blocked for ~30 min (bosala ~ hits/hour). Prevent: systemd `Restart=on-failure` + `TimeoutStopSec`, port conflict detection in deployment job (`ss` check gate), kabhi bhi `nohup`+manual run prod me nahi — sab systemd.

## Interview Corner | Sawal-Jawab

**Q: 502 vs 503 vs 504 — kaise differentiate karte ho?**
A: 502 = application ke **upstream/backend pe response nahi** (backend down ya wrong port); 503 = service khud overloaded/start nahi hui (maintenance); 504 = upstream ne **time me response nahi diya** (slow, blocked, timeout). Sequence: pehle `ss -lntp` backends, phir `curl`, phir upstream logs.

**Q: Port "already in use" aane pe first command kya?**
A: `ss -lntp` (ya `lsof -i :port`) — kaunsi PID listen kar rahi hai, kaunsa user/process. Phir `ps -fp <pid>` decide karo kya hai: naya deploy galat bind kar raha ya puraana process abhi bhi alive hai.

**Q: Private IP pe internet connections kyu chalti hain?**
A: NAT (Network Address Translation) — VM ka private IP hota hai, router/gateway us traffic ko apne public IP se map karta hai. Cloud won't route unstructured private IPs, isliye NAT/SNAT required hai outbound ke liye.

**Q: DNS TTL kya hai aur change ke baad users ko purana IP kyu dikh raha?**
A: TTL = seconds ek resolver record ko cache me rakh sakta hai. Change ke baad bhi sirf TTL jaise expire hoga (mins-hours) naya IP milega. Fix: migration se **pehle TTL kam** karo (300s), switch, phir TTL badha do.

**Q: ufw vs firewalld vs nftables?**
A: ufw = Ubuntu user-friendly wrapper (nftables backend ab); firewalld = RHEL/CentOS, **zones** concept (trust levels per interface); nftables = actual low-level rule engine (iptables ka modern successor). Kamparks: dev, staging, prod sab "deny by default + allow specific".

## Quick Notes | Yaad Rakhna
- `ss -lntp` = pehli network diagnosis, hamesha
- 502 = backend problem; 504 = backend slow; 503 = overload
- DNS debug: `dig +trace` = senior move
- Firewall rules top-down — pehla match jeeta hai; deny-by-default karo
- `nc -vz host port` = connection check (layer 4); `ping` = layer 3
- CIDR: hosts = `2^(32-prefix) - 2`
- CNAME/A/TTL sab `dig` se hi nikalta hai — file za ro do