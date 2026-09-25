# 🌐 Networking — Fundamentals & Troubleshooting

> **Hinglish:** Sabse common interview + real-life bug hai networking. Tumhara app "response hi nahi de raha" — iska matlab network ka koi layer fail ho raha hai. Ye module bataata hai OSI model, IP, DNS, HTTP, TLS, load balancers, aur diagnose kaise karna hai.

## 📖 Overview — Ye Topic Kya Hai

Networking wo dhaaga hai jo saare systems ko jodta hai — app to server, server to database, user to website. DevOps engineer ko network isliye samajhna hai kyunki **har deployment, every microservice call, har monitoring setup — sab network ke upar** chalta hai.

Ham cover karenge: OSI model (7 layers — samjo, yaad rakhna zaroori hai), TCP/IP, IP addressing aur CIDR, subnets, routing, NAT, DNS, DHCP, TCP vs UDP, HTTP/HTTPS, TLS/SSL, ports aur sockets, load balancing, reverse proxy, firewalls/security groups, VPN, SSH, aur troubleshooting commands (`ping`, `traceroute`, `dig`, `nslookup`, `nc`, `tcpdump`).

Ek mindset yaad rakho: **network me har problem layer-by-layer** hota hai — cabal/dns/TCP/app. Isliye tools layer-wise check karte hain.

## 🟢 Beginner — Shuruaat yahan se

- **IP address + port** — device ka pata + app ka darwaza.
- **DNS** — domain name ko IP me kaun badlta hai, `dig` se check karo.
- **HTTP** — request/response, methods (GET/POST/PUT/DELETE), status codes (200, 404, 500…).
- **ping, curl, traceroute** — "kya upar hai?", "kya respond kar raha hai?", "kahan ruk raha hai?".

## 🟡 Intermediate — Ab asli kaam karo

- **CIDR/subnets** — IPs ka range kaisa split hota hai, `192.168.1.0/24` ka matlab.
- **TCP handshake + UDP** — connection-based vs fast-lossy; kab kaunsa.
- **Firewalls / security groups / NACLs** — kya andar/baahar jaa sakta hai.
- **Reverse proxy + load balancer** — traffic ka distribution (Nginx, ALB/NLB).
- **curl -v** se full HTTP journey (DNS → TCP → TLS → request → response) dekhna.

## 🔴 Advanced — Pro bano

- **TLS/SSL handshake** — certificates, trust chain, `openssl s_client`.
- **WebSockets, keep-alive, HTTP/2** — long-lived connections aur performance.
- **Network troubleshooting stack** — `tcpdump`/`wireshark` se packet catch, MTU issues, DNS TTL, split-horizon.
- **VPN + private connectivity** — on-prem se cloud secure link.
- **IPv6 vs IPv4** — address exhaustion aur dual-stack.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **OSI model** — 7 layers (Physical→Application); troubleshooting ke liye layer-wise socho.
- [ ] **TCP/IP model** — practical version of OSI; internet isi pe chalta hai.
- [ ] **IP addresses** — IPv4 (`192.168.1.5`) vs IPv6; device ki identity.
- [ ] **CIDR** — IP ka range likhne ka tarika; `/24` = 256 addresses.
- [ ] **Subnets** — bade network ko chhote logical parts me todna; cheezein alag karo.
- [ ] **Routing** — packets ka sahi jalan; router hast 1: kisi aur network ko jaane wala traffic.
- [ ] **NAT** — private IP ka public se translation; ghar ke internet isi se chalta hai.
- [ ] **DNS** — naam ko IP me todna; future me most common debugging area.
- [ ] **DHCP** — devices ko IP automatically allot karna.
- [ ] **TCP vs UDP** — TCP = reliable ordered (web); UDP = fast-no-guarantee (video, DNS).
- [ ] **HTTP / HTTPS** — web request protocol; HTTPS = encrypted.
- [ ] **TLS/SSL** — encryption in transit; certificates + handshake.
- [ ] **Ports** — app ka "darwaza" (80 http, 443 https, 22 ssh, 5432 postgres).
- [ ] **Sockets** — IP + port ka pair; ek running connection ki identity.
- [ ] **Load balancing** — traffic ko multiple servers me baatna.
- [ ] **Reverse proxy** — server ki taraf ka proxy; user ke saamne daal deta hai (Nginx, CDN).
- [ ] **Forward proxy** — user side ka proxy; corporate internet me use hota.
- [ ] **Firewalls** — rule-based traffic filter (allow/deny IP/port).
- [ ] **Security groups** — cloud me virtual firewall (per resource).
- [ ] **Network ACLs** — subnet-level allow/deny rules.
- [ ] **VPN** — public internet pe encrypted private tunnel.
- [ ] **SSH** — secure remote terminal; keys se auth.
- [ ] **HTTP status codes** — 2xx ok, 3xx redirect, 4xx client, 5xx server (5xx = tumhare infra ki problem).
- [ ] **WebSockets** — two-way real-time connection (chat, live dashboards).
- [ ] **IPv4 vs IPv6** — 32-bit vs 128-bit addresses.
- [ ] **Network troubleshooting** — layer by layer jaakar breakage find karna.
- [ ] **ping** — ICMP se check: "device up hai ya nahi".
- [ ] **traceroute** — packet ka jalan har hop pe batata hai.
- [ ] **dig / nslookup** — DNS queries; "ye domain kya resolve karta hai".
- [ ] **nc (netcat)** — port open/test karna; raw TCP chhanakna.
- [ ] **tcpdump** — live packets capture; deep network debugging.
- [ ] **MTU / MSS** — packet size limits; `ping -M do` se test.
- [ ] **Latency / RTT** — packet jane-aane ka time.
- [ ] **Bandwidth vs latency** — kitna data per second vs kya delay.
- [ ] **IDLE connections / keep-alive** — reuse connection, fast performance.
- [ ] **SNI / virtual hosts** — ek IP pe multiple domains/sites serve karna.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| curl | HTTP CLI client | API test, download, debug headers |
| dig / nslookup | DNS lookup | DNS resolve check karne ke liye |
| ping / traceroute | Reachability + path | "Kya upar hai, jalan kahan?" |
| tcpdump / Wireshark | Packet capture/analyze | Deep network debugging |
| nc / telnet | Port test | "Ye port open hai?" check |
| openssl | TLS toolkit | Certificate + TLS handshake dekhna |
| Nginx / HAProxy | Reverse proxy + LB | Traffic distribute karne ke liye |
| ip / ss | Network config + sockets | Linux pe network state dekhna |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Website Journey:** `curl -v https://google.com` chalao — DNS, TCP, TLS, request, response sab steps dekh lo.
- [ ] **Lab 2 — DNS Detective:** `dig` se google/any-domain ka IP dhoondo; apne computer ka nameserver dekho.
- [ ] **Lab 3 — Port Test:** `nc -zv <server> 443` se port open check karo; closed port pe kya hota hai dekho.
- [ ] **Lab 4 — Nginx Reverse Proxy:** Ek local app pe Nginx reverse proxy lagao, request headers bhejo, log dekho.
- [ ] **Lab 5 — TLS Inspection:** `openssl s_client -connect google.com:443` se certificate chain examine karo.
- [ ] **Project — Mini LB Setup:** 2 backend servers + 1 Nginx LB, health checks lagao, ek backend banda kar ke traffic automatically dusre pe jata hai ya nahi dekho.

## 🔗 Related Topics

- [🧱 DevOps Fundamentals](../modules/devops-fundamentals.md)
- [🔐 Security Fundamentals](../modules/security-fundamentals.md)
- [📄 YAML & JSON](../modules/yaml-json.md)
- [DNS Kaise Kaam Karta Hai](../topics/dns-explained.md)
- [Load Balancing & Reverse Proxy](../topics/load-balancing-reverse-proxy.md)
- [HTTP & REST API Basics](../topics/http-rest-api-fundamentals.md)
- [TLS, Certificates & PKI](../topics/tls-certificates-pki.md)
- [Day 5 — Networking Fundamentals](../day-05-networking-fundamentals.md)