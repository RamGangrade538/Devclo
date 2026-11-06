# Lab Tasklist — Linux Logging + Networking

Har step ko **haath se** karo, output padho, phir tick karo.
Transcript har lab ke `work/transcripts/` me save hota hai.

---

## Block 0 — Setup

- [ ] `bash labs/00-preflight.sh` — machine ka capability check pass hua
- [ ] Samjho: root hai ya nahi? Kaunse commands missing hain? Internet/DNS chal raha hai?

## Block 1 — Networking basics

- [ ] `bash labs/01-network-basics.sh`
  - [ ] Apna IP, gateway, subnet note karo
  - [ ] `ip route get 1.1.1.1` se path dekha
  - [ ] `ip neigh` me ARP entry dekhi
- [ ] `bash labs/02-ports-and-sockets.sh`
  - [ ] Apne app ka listening socket `ss -tlnp` me dekha
  - [ ] ESTABLISHED socket live capture kiya
  - [ ] UDP listener banaya aur compare kiya
- [ ] `bash labs/03-dns-and-http.sh`
  - [ ] `dig` se A, MX, TXT records nikale
  - [ ] `curl -v` me handshake trace padha
  - [ ] 2xx/4xx/5xx status codes khud generate karke dekhe
  - [ ] `curl -w` se timing breakdown nikala (dns/connect/ttfb/total)

## Block 2 — Networking advanced

- [ ] `bash labs/04-netns-topology.sh` ⭐
  - [ ] client ns se server ns tak HTTP call 200 ke saath pass hua
  - [ ] `traceroute` me 2 hops dikhe
  - [ ] Server ki access log me client ka IP (10.10.0.10) dikha
  - [ ] Samjho: veth = container ka NIC, bridge = docker0, ip_forward = router
- [ ] `bash labs/05-firewall-rules.sh`
  - [ ] DROP rule ke baad request **timeout** hui (exit 28)
  - [ ] `iptables -L -v` counters me dropped packets dekhe
  - [ ] Rule delete karte hi traffic wapas aaya
- [ ] `bash labs/06-packet-capture.sh`
  - [ ] `[S]` → `[SA]` → `[A]` → `[PA]` handshake live dekha
  - [ ] HTTP headers payload me decode kiye
  - [ ] tcpdump filters likhne ki practice ki

## Block 3 — Logging core

- [ ] `bash labs/07-journal-logging.sh`
  - [ ] `logger` aur `systemd-cat` dono se entry likhi
  - [ ] Tag + priority + time-window se filter kiya
  - [ ] `-o json-pretty` output dekha (ELK yahi padhta hai)
  - [ ] `journalctl -f` se live entry pakdi
- [ ] `bash labs/08-syslog-facilities.sh`
  - [ ] `logger -p local0.err` se facility+severity samjha
  - [ ] Same entry journal + /var/log/syslog dono me dhoondi
  - [ ] `tail -f` se live follow kiya
  - [ ] `auth.log` me login entries dekhi

## Block 4 — Logging advanced

- [ ] `bash labs/09-central-logging.sh` ⭐
  - [ ] App namespace se UDP (5514) aur TCP (5515) dono se ship kiya
  - [ ] Collector log me JSON events aaye
  - [ ] Shipped logs se level/trace_id nikaala
  - [ ] Samjho: app → shipper → collector → store (ELK skeleton)
- [ ] `bash labs/10-logrotate.sh`
  - [ ] `-d` dry run me plan dekha, phir `-f` se asli rotation ki
  - [ ] `.1` / `.2.gz` files bani
  - [ ] `copytruncate` vs `postrotate` ka fark samjha
- [ ] `bash labs/11-log-analysis.sh`
  - [ ] Level-wise count table banayi
  - [ ] Error rate % nikala
  - [ ] Top talker IPs aur status code distribution nikale
  - [ ] Trace-ID se request journey correlate ki
  - [ ] `loganalyze.py` ka full report dekha

## Block 5 — Capstone incident drill

- [ ] `bash labs/12-troubleshoot-drill.sh` ⭐
  - [ ] Round 1: wrong port → `ss` se sahi port dhoondha
  - [ ] Round 2: crash → journal me crash entry dekhi → restart kiya
  - [ ] Round 3: DNS failure → `--resolve` se prove kiya ki app theek hai
  - [ ] Round 4: firewall DROP → counters dekhe → rule hatai
  - [ ] Incident report template fill karke likha (apne words me)

## Block 6 — Wrap up

- [ ] `bash run-all.sh` — saare labs ek saath (transcripts save)
- [ ] `bash verify.sh` — score card me **sab checks pass**
- [ ] `bash cleanup.sh` — processes band + artifacts saaf
- [ ] Apna ek-page cheatsheet bana (README ke last section se copy karke customize karo)

---

## Self-assessment (bina dekhe)

1. Site down hai. Pehle 3 commands kya chalayenge?
2. `curl` exit 7 vs exit 28 me kya fark hai aur kya matlab hai?
3. `logger` aur `systemd-cat` me kya difference hai?
4. `journalctl -p err` vs `grep ERROR app.log` — kab kaunsa?
5. Log rotation na ho to kya hoga?
6. Trace-ID kya karta hai?
7. ELK pipeline ke 5 steps?
8. `ss -tlnp` me kya dikhta hai?

<details>
<summary>Answers (khud check karne ke baad dekho)</summary>

1. `dig <name>` → `ping`/`ip route` → `ss -tlnp` (phir `curl -v`, phir logs)
2. exit 7 = connection refused (service down/wrong port) · exit 28 = timeout (firewall DROP/blackhole)
3. `logger` → /dev/log → rsyslog → syslog file + journal · `systemd-cat` → seedha journald (bypass rsyslog)
4. `-p err` system-wide priority filter (journal ke liye) · `grep` app ke apne file ke liye
5. Disk bhar jayega, purane logs delete/rotate nahi honge, audit trail khatam
6. Ek request ke saare related log lines ko jodne ke liye (correlation ID)
7. generate → ship → parse → store → visualize
8. Kaun kaunse TCP ports sun rahe hain aur kaunsa process, backlog, address

</details>
