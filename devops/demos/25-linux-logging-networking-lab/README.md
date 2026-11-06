# Lab: Linux Logging + Networking — Complete Hands-On Practice

> **Ye ek practice lab hai** — DevOps curriculum ke Day 5 (Networking) aur
> Day 25 (ELK Logging) ke concepts ko **haath se** kar ke sikhaane ke liye.
> Company ke already-installed Linux machine par bhi safe chalega: system ki
> koi config file modify nahi hoti, root ki zaroorat nahi (optional hai).

---

## Kya seekhoge (What You'll Learn)

**Networking side**
- [ ] Interface, IP, subnet, gateway, route table (`ip addr`, `ip route`, `ip route get`)
- [ ] Ports aur sockets (`ss -tlnp`, TCP states, UDP vs TCP)
- [ ] DNS records + resolution (`dig`, `getent`, NXDOMAIN/SERVFAIL)
- [ ] HTTP semantics (methods, status codes, `curl -v/-I/-w` timing)
- [ ] **Apna network banana** — network namespaces + veth + bridge + static routing + `ip_forward`
- [ ] Firewall (`iptables` rules + counters, `ufw` concepts) — aur **timeout vs refused** ka fark
- [ ] Packet capture (raw socket sniffer + `tcpdump` filters, TCP 3-way handshake)

**Logging side**
- [ ] journald: `logger`, `systemd-cat`, `journalctl` (tag, priority, time, unit, JSON output, live follow)
- [ ] Syslog: facilities/severities, `/var/log/*`, rsyslog rules, `dmesg`
- [ ] **Centralized logging**: app namespace → syslog over TCP/UDP → collector (rsyslog)
- [ ] Log rotation (`logrotate`: size/daily, compress, copytruncate vs postrotate, notifempty)
- [ ] Log analysis (`grep`/`awk`, level counts, error rate, top talkers, trace-id correlation)
- [ ] **Incident drill**: 4 failure modes diagnose karna (wrong port, crash, DNS, firewall)

---

## Rules (company machine par bhi safe)

| Rule | Detail |
|---|---|
| Koi install nahi | Sab tools already hote hain; missing ho to script skip kar deta hai |
| System config touch nahi | `/etc/rsyslog.conf`, `/etc/logrotate.d`, `ufw`, host `iptables` — **sirf padhe jaate hain** |
| Root optional | 90% cheezein bina sudo; sudo wale steps (host `tcpdump`, `ufw status`) skip ho jaate hain |
| Network changes sandboxed | Har firewall/bridge change apne **private namespace** me hota hai (`unshare`) |
| Saara output local | `work/` folder — aapke logs, transcripts, pcap files |
| Cleanup easy | `bash cleanup.sh` — processes band + artifacts saaf |

---

## 0. Setup (2 min)

```bash
cd /home/ubuntu/Desktop/DevClo/devops/demos/25-linux-logging-networking-lab
bash labs/00-preflight.sh      # machine ka capability check
```

Preflight batata hai: kaunse commands hain, root hai ya nahi, namespace ban sakte ho ya nahi,
DNS/HTTP chal raha hai ya nahi, aur kaunse ports free hain.

---

## 1. Networking labs

### Lab 01 — Network basics (10 min)
```bash
bash labs/01-network-basics.sh
```
Interfaces, IPs, gateway, loopback, ARP/neighbour table, `ip route get`.
**Aaj ka seekh:** har machine ka ek **address** (IP) aur ek **raasta** (route) hota hai.

### Lab 02 — Ports & sockets (12 min)
```bash
bash labs/02-ports-and-sockets.sh
```
Apna HTTP service chalao, `ss -tlnp` se dekho, request bhejo aur **ESTABLISHED** socket pakdo,
UDP vs TCP compare karo.
**Aaj ka seekh:** port = service ka darwaza; TCP me 4 states hain (LISTEN/ESTABLISHED/TIME_WAIT/CLOSE_WAIT).

### Lab 03 — DNS + HTTP (12 min)
```bash
bash labs/03-dns-and-http.sh
```
`dig` se A/CNAME/MX/TXT records, `dig` se failure (NXDOMAIN/SERVFAIL),
`curl -v` se poori journey (DNS→TCP→TLS→request→response), status codes 2xx→5xx,
`curl -w` se DNS/TCP/TTFB timing.
**Aaj ka seekh:** naam (DNS) → IP, phir port (TCP), phir bhasha (HTTP).

### Lab 04 — **Network namespaces: apna network banao** (20 min) ⭐
```bash
bash labs/04-netns-topology.sh
```
Root ki zaroorat nahi. Ye script ek private network stack banata hai aur usme:

```
client ns (10.10.0.10)
      |  veth
   bridge br0 (10.10.0.1)   <- "hub"
      |  veth
 router ns (10.10.0.30 | 10.10.1.1)   <- ip_forward=1
      |  veth
 server ns (10.10.1.20)  <- HTTP app yahan
```

Client se server tak **do hops** me HTTP call, `traceroute` se path, `ss` se sunne wala process,
aur server ke access log me client ka IP (`10.10.0.10`) — proof ki traffic sach me usi path se gaya.
**Aaj ka seekh:** container/pod/VM ka real networking yahi hai (veth + bridge + routes).

### Lab 05 — Firewall (12 min)
```bash
bash labs/05-firewall-rules.sh
```
Namespace me `iptables` rule add → request **timeout** ho jaati hai → counters me packets dikhte hain
→ rule delete → traffic wapas. Plus `ufw` ke commands aur "SSH pehle kholo" wala golden rule.
**Aaj ka seekh:** timeout (exit 28) ≠ refused (exit 7) — yeh distinction incident solving me sabse important hai.

### Lab 06 — Packet capture (12 min)
```bash
bash labs/06-packet-capture.sh
```
`apps/sniff.py` — apna raw-socket sniffer (AF_PACKET, bina root ke) — TCP handshake live packets me
dekhna: `[S] → [SA] → [A] → [PA]`. HTTP payload ASCII me (`GET / HTTP/1.1`, `Host:` headers).
Plus `tcpdump` filters cheatsheet (root wala part optional).
**Aaj ka seekh:** TCP reliable handshake karta hai; UDP nahi karta.

---

## 2. Logging labs

### Lab 07 — journald / journalctl (15 min)
```bash
bash labs/07-journal-logging.sh
```
`logger` aur `systemd-cat` se entries, tag/priority/time/unit se filter, `-o json-pretty` (structured —
yehi Filebeat/ELK me jaata hai), live `journalctl -f`, `--disk-usage`.
**Aaj ka seekh:** journal = binary, structured, filter-friendly, auto-rotating.

### Lab 08 — Syslog (rsyslog) (15 min)
```bash
bash labs/08-syslog-facilities.sh
```
Facilities (local0..local7) aur severities (0..7), `logger -p local0.err`, same entry journal + `/var/log/syslog`
dono me kaise aati hai, apni app-specific log file, `tail -f` live follow, `auth.log` security use,
`dmesg` kernel buffer.
**Aaj ka seekh:** ek message 3 jagah ja sakta hai — app file, syslog file, journal.

### Lab 09 — **Centralized logging over the network** (20 min) ⭐
```bash
bash labs/09-central-logging.sh
```
Ek namespace = "app server" (10.20.0.2), doosri taraf = "collector" (rsyslog, UDP 5514 + TCP 5515):

```
app ns  --UDP/TCP syslog-->  collector (rsyslog)  -->  collector.log
```

App se `logger -n <ip> -P 5515 -T`, aur apne JSON logs ship karna, phir collector me se
`trace_id`/`level` nikalna. Production-grade rsyslog config (TLS, disk queue, omfwd relay) bhi dikhaya gaya.
**Aaj ka seekh:** yahi ELK ka skeleton hai — app → shipper → collector → store.

### Lab 10 — Log rotation (12 min)
```bash
bash labs/10-logrotate.sh
```
Apna `logrotate` config (system ka touch nahi), `-d` dry run vs `-f` real rotation,
compress + delaycompress, `copytruncate` vs `create`+`postrotate` (data loss ka fark),
`notifempty`, `dateext`, `maxsize`, aur storage math (50MB/day × 30 days × 10 servers).
**Aaj ka seekh:** bina rotation logs disk bhar dete hain — retention policy zaroori hai.

### Lab 11 — Log analysis (15 min)
```bash
bash labs/11-log-analysis.sh
```
`grep -c` counts, `awk | sort | uniq -c | sort -rn` frequency tables, error-rate %, service-wise error
breakdown, top talker IPs, status code distribution, slow requests, **trace-id correlation**, aur
`apps/loganalyze.py` se full report (levels, top services, top IPs, slowest, error samples).
**Aaj ka seekh:** raw line → frequency table → decision.

### Lab 12 — **Incident drill** (20 min) ⭐
```bash
bash labs/12-troubleshoot-drill.sh
```
4 rounds, har round me **same playbook**: DNS → reachability → port → app → firewall → logs.

| Round | Failure | Signature | Fix |
|---|---|---|---|
| 1 | service galat port pe | `curl` exit 7 (refused) | `ss -tlnp` se sahi port dhundha |
| 2 | process crash | exit 7 + port empty | journal me crash entry → restart |
| 3 | DNS NXDOMAIN/SERVFAIL | naam resolve nahi | `--resolve` se proof ki app theek hai |
| 4 | firewall DROP | exit 28 (timeout) | `iptables -L -v` counters → rule hatao |

End me ek incident-report template (severity, layers, root cause, evidence, prevention).

---

## 3. Run everything + score

```bash
bash run-all.sh              # saare labs, transcript ke saath
bash run-all.sh --quick      # slow namespace labs skip
bash run-all.sh 04 07        # sirf selected labs
bash verify.sh               # score card (checks pass/fail)
bash cleanup.sh              # saaf karo (--all se work/ bhi udega)
```

Transcript: `work/transcripts/*.log`

---

## Time budget

| Block | Labs | Time |
|---|---|---|
| Networking | 01, 02, 03 | ~35 min |
| Networking advanced | 04, 05, 06 | ~45 min |
| Logging core | 07, 08 | ~30 min |
| Logging advanced | 09, 10, 11 | ~45 min |
| Capstone | 12 | ~20 min |
| **Total** | 13 labs | **~3 hours** |

Chhota version (1 ghanta): `00` → `01` → `02` → `07` → `08` → `12`

---

## Folder structure

```
25-linux-logging-networking-lab/
├── README.md                  # ye file (step-by-step guide)
├── TASKLIST.md                # tick-off checklist
├── lab-common.sh              # shared helpers (colors, pick_port, kill_pid)
├── run-all.sh                 # saare labs chalao + transcripts
├── verify.sh                  # score card
├── cleanup.sh                 # saaf karo
├── apps/
│   ├── httpapp.py             # HTTP service jo request log karta hai
│   ├── logapp.py              # plain/JSON log generator + syslog shipper
│   ├── loganalyze.py          # log analysis report generator
│   └── sniff.py               # raw-socket packet sniffer (bina root)
├── labs/
│   ├── 00-preflight.sh        # machine capability check
│   ├── 01-network-basics.sh
│   ├── 02-ports-and-sockets.sh
│   ├── 03-dns-and-http.sh
│   ├── 04-netns-topology.sh   # apna 3-tier network
│   ├── 05-firewall-rules.sh
│   ├── 06-packet-capture.sh
│   ├── 07-journal-logging.sh
│   ├── 08-syslog-facilities.sh
│   ├── 09-central-logging.sh  # remote syslog collector
│   ├── 10-logrotate.sh
│   ├── 11-log-analysis.sh
│   └── 12-troubleshoot-drill.sh
└── work/                      # runtime output (git-ignored)
    ├── logs/  central/  logrotate/  transcripts/
```

---

## Cheatsheet (ek page)

```
=== NETWORKING ===
ip -br addr                # interface + IP (short)
ip route                   # routing table + default gateway
ip route get 1.1.1.1       # exact path kernel lega
ip neigh                   # ARP/NDP cache
ss -tlnp                   # TCP listeners + process
ss -tan state established  # live connections
ss -s                      # socket stats
dig <name> +short          # DNS -> IP
dig <name> +noall +answer  # DNS + TTL
getent hosts <name>        # resolver check (hosts + dns)
curl -v                    # full handshake trace
curl -I                    # headers only
curl -w '%{http_code}'     # status code
curl -w '%{time_*}'        # dns/connect/starttransfer/total
curl --resolve host:port:ip  # DNS bypass
traceroute -n <ip>         # hops
tcpdump -i any -nn -c 20 "tcp port 80"
unshare -Urn               # private netns (no root)
ip link add br0 type bridge / ip link add v0 type veth peer name v1
ip link set v0 netns <PID> / nsenter -t <PID> -n <cmd>
sysctl -w net.ipv4.ip_forward=1
iptables -A INPUT -p tcp --dport 8080 -j DROP
iptables -L -n -v           # rules + counters

=== LOGGING ===
logger -p local0.info -t TAG "msg"      # syslog entry
systemd-cat -t TAG echo "msg"           # direct journal entry
logger -n host -P 5514 "msg"            # UDP ship
logger -n host -P 5515 -T "msg"         # TCP ship
journalctl -t TAG / -p err / -u UNIT
journalctl --since "1 hour ago" / -f / -o json-pretty
journalctl --disk-usage / --vacuum-size=200M
tail -f /var/log/syslog | grep PATTERN
logrotate -d -f -s <state> <conf>       # dry run
grep -c "ERROR" file / awk '{print $2}' file | sort | uniq -c | sort -rn
dmesg | tail                             # kernel buffer

=== FAILURE SIGNATURES ===
curl exit 6  = DNS fail          curl exit 7  = connection refused
curl exit 28 = timeout (firewall) curl exit 35 = TLS error
HTTP 502 = upstream down        HTTP 504 = upstream timeout
```

---

## Related (curriculum se)

- `devops/day-05-networking-fundamentals.md` — networking theory (DNS/HTTP/firewall)
- `devops/day-25-elk-logging-stack.md` — ELK pipeline (generate→ship→parse→store→visualize)
- `devops/demos/24-prometheus-grafana/` — metrics + dashboards (lab 09 ka production version)
- `devops/modules/linux.md`, `devops/modules/networking.md` — quick reference

---

**Ye lab safe hai:** system config modify nahi hota, network changes sandboxed hain,
aur saara output `work/` me rehta hai. Cleanup: `bash cleanup.sh`.
