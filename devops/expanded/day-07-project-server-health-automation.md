# Day 07 — PROJECT 1: Server Health & Automation (DevClo Expanded)

## Overview | Parichay
Aaj no-new-concept — Day 1-6 sab kuch **ek production-ready project** me tod-na tod ke jodna hai: ek `health-check` script jo CPU/disk/mem/ports/logs check kare, systemd service + timer se scheduled chale, alerts bheje, aur logrotate se logs controlled rahe. Isi project ke andar INC-109 (process/zombie) aur INC-110 (DNS) tickets milein — sab kuch GitHub pe push karna (portfolio, portfolio, portfolio).

## What You'll Learn | Aaj Ki Seekh
- [ ] Health-check script: CPU, disk (space+inode), memory, ports, critical services, log errors
- [ ] `set -euo pipefail` + idempotency + `shellcheck` clean
- [ ] systemd **service + timer** — schedule, journald integration, alert webhook
- [ ] logrotate config for script logs (retention + compression)
- [ ] Alerting: Slack/Teams webhook via `curl`
- [ ] INC-109: zombie/defunct/orphan process + port takeover — identify + restart policy
- [ ] INC-110: DNS/resolver issue — `dig`, `/etc/resolv.conf`, external curl — fix
- [ ] 1-command setup (install script) + documentation + GitHub push

## Full Topic (LEARN) | Puri Detail

### 1. Project Architecture
```
/opt/server-health/
├── health-check.sh        # checks + decides (exit code 0/1/2)
├── install.sh             # 1-command setup: user, dirs, systemd, timer, logrotate
├── config.env           # thresholds, endpoints, webhook — secret-free defaults
└── reports/               # logs output
```
System design:
- Script har 5 min (`OnCalendar=*:00/5`) timer se chale; output journald me (free logs!) + file me.
- Alert rule: check fail → webhook POST with JSON; deduplication via state file (agar pichla alert 30 min pehle bheja to dubaar mat bhejo — alert fatigue senior soch).
- Exit codes: 0=OK, 1=WARN, 2=CRIT (explains for monitoring tools).

### 2. health-check.sh (Core)
```bash
#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
[ -f /opt/server-health/config.env ] && . /opt/server-health/config.env
ALERT_STATE=/var/run/server-health.alerted

fail() {  # CRIT
  echo "CRIT: $*"
  [ "${ALERT_WEBHOOK:-}" ] && curl -fsS -m 10 -H 'Content-Type: application/json' \
    -d "{\"text\":\"[CRIT] $(hostname): $*\"}" "$ALERT_WEBHOOK" || true
  touch "$ALERT_STATE"; exit 2
}
warn() { echo "WARN: $*"; exit 1; }   # dedupe log only
ok()  { rm -f "$ALERT_STATE"; echo "OK: all healthy"; exit 0; }

CPU=$(top -bn1 | awk '/Cpu\(s\)/ {print 100-$8}')
MEM=$(free -m | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
DISK=$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')
INODE=$(df -i / | awk 'NR==2{gsub(/%/,"",$5); print $5}')
PORT_OPEN=$(ss -lnt | grep -c ':80 ')
[ "$CPU"  -le "${ALERT_CPU:-85}"  ] || fail "CPU ${CPU}% > ${ALERT_CPU:-85}%"
[ "$MEM"  -le "${ALERT_MEM:-85}"  ] || warn "MEM ${MEM}% > ${ALERT_MEM:-85}%"
[ "$DISK" -le "${ALERT_DISK:-80}" ] || fail "DISK ${DISK}% > ${ALERT_DISK:-80}%"
[ "$INODE" -le "${ALERT_INODE:-90}" ] || fail "INODES ${INODE}% > ${ALERT_INODE:-90}%"
[ "$PORT_OPEN" -ge 1 ] || fail "port 80 not listening"
ok
```
Checklist spread: services (`systemctl is-active nginx`), log error grep (`grep -c 'ERROR' /var/log/app/error.log`) — systemd timer itself tracks staleness.

### 3. systemd Service + Timer
`/etc/systemd/system/server-health.service`:
```ini
[Unit]
Description=Server health checks
After=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/server-health/health-check.sh
TimeoutStartSec=30
```
`/etc/systemd/system/server-health.timer`:
```ini
[Unit]
Description=Run health check every 5 min

[Timer]
OnCalendar=*:00/5
Persistent=true
RandomizedDelaySec=30

[Install]
WantedBy=timers.target
```
```bash
systemctl daemon-reload
systemctl enable --now server-health.timer
systemctl list-timers server-health.timer
journalctl -u server-health.service -n 10      # reports journald me
```

### 4. Logrotate for Reports
`/etc/logrotate.d/server-health`:
```
/var/log/server-health/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```
`logrotate -d /etc/logrotate.d/server-health` dry-run then `logrotate -f`.

### 5. 1-Command Setup (install.sh)
```bash
#!/usr/bin/env bash
set -euo pipefail
sudo mkdir -p /opt/server-health/reports /var/log/server-health
sudo useradd -r -d /opt/server-health serverhealth || true
sudo cp health-check.sh config.env /opt/server-health/
sudo chown -R serverhealth:serverhealth /opt/server-health /var/log/server-health
sudo cp server-health.service server-health.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo cp server-health.logrotate /etc/logrotate.d/server-health
sudo systemctl enable --now server-health.timer
sudo logrotate -f /etc/logrotate.d/server-health || true
systemctl is-active server-health.timer
```
Run: `bash install.sh` — bas. Idempotent ✓.

### 6. DONE criteria (Day 7 ka "DONE WHEN")
Script saare Linux tickets catch karti hai (process, port, disk, mem); install ek command; GitHub pe pushed with README (architecture, install steps, alerting config, incident logs).

### 2026 Notes
systemd timer `Calendar=` with `*:00/5` minutes; journald is default log sink; alert webhooks to **Slack workflows / Teams / PagerDuty integrations** standard; `curl` alert via generic webhook; health checks as systemd oneshot are standardized for VM fleets; Pre-scaled cloud agents (Azure Monitor / VM Insights) external alternative.

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `systemctl enable --now server-health.timer` | schedule one shot |
| `systemctl list-timers` | active timers verify |
| `systemctl start server-health.service` | run manuaally |
| `journalctl -u server-health.service -f` | check results |
| `logrotate -f /etc/logrotate.d/server-health` | force rotate |
| `bash -n health-check.sh` / `shellcheck health-check.sh` | validate/lint |
| `top -bn1`, `free -m`, `df -h`, `df -i` | metrics inputs |
| `ss -lntp` | port checks |
| `curl -fsS -d '{}' $WEBHOOK` | alerting |
| `git push` | portfolio proof |

## Practice Lab | Abhi Karein
1. `/opt/server-health/` structure banao (health-check.sh, config.env, install.sh).
2. Script likho with `set -euo pipefail` + `export PATH` line (timer ke liye PATH must).
3. Checks: CPU, MEM, DISK, INODE, port 80, `systemctl is-active nginx/cron`.
4. Deduplication state file (`/var/run/server-health.alerted`) implement karo.
5. `shellcheck health-check.sh` → 0 errors; `bash -n` syntax pass.
6. Service + Timer units banao (oneshot + `OnCalendar=*:00/5`).
7. `systemctl daemon-reload; systemctl enable --now server-health.timer`; `systemctl list-timers` me confirm.
8. `journalctl -u server-health.service -n 5` — "OK: all healthy" report.
9. Alert test: threshold temporary karo (`ALERT_CPU=1`), run karo, webhook/state file dupped alert (2nd run) verify.
10. Logrotate config lar, dry-run, force-rotate, `.1.gz` file verify.
11. INC-109 aur INC-110 tickets solve karo (niche).
12. GitHub repo: script + README + incident resolutions push; portfolio commit log banao.

## Incidents / Tickets | Real Practice

### INC-109 · Process Issue (Zombie + Port Takeover)
- **Situation:** Health check ne bola: "port 80 not listening" aur ek worker file server timing out intermittently. Manually `ps` me multiple `defunct` (zombie) processes dikh rahe hain. Naya worker deploy hone ke baad purana `worker-http` abhi bhi port 8081 pakde hua hai.
- **Investigate:**
  ```bash
  ps aux | grep -c 'defunct'                       # zombie count
  ps -e -o stat,pid,ppid,cmd | grep -w Z          # zombie list + parent
  ss -lntp | grep -E ':80|:8081'                   # kaun port pe
  upc/dis -p <pid> -o ppid,stat,etime
  journalctl -u worker-http --since "1 hour ago" | tail -40
  cat /proc/<pid>/stat | awk '{print $3}'          # state (Z = zombie)
  ```
- **Root cause:** Parent worker daemon ko signals properly handle nahi karta — backends crash-avoid me workers spawn/reap nahi karte (bug), zombie accumulate. Z+ 50 count pe system has memory+pid eating. Aur purana `worker-http v2` (manual nohup) port 8081 hold; naya systemd worker 8081 pe bind karke crash-loop.
- **Fix:**
  ```bash
  # 1. Kill zombie parent ko reap karne ke liye (parent ko TERM → init adopt)
  pkill -15 -f '^/opt/worker/bin/worker.*v2' || true
  sleep 5
  pkill -9 -f '^/opt/worker/bin/worker.*v2' || true
  sleep 2
  ps -e -o stat,cmd | grep -w Z | wc -l          # 0 chahiye
  # 2. Port release: aankh se fata purana
  PID=$(ss -lntp | grep ':8081' | grep -oP 'pid=\K[0-9]+' | head -1)
  [ -n "$PID" ] && kill -15 "$PID" || true
  # 3. Restart policy + service config (prevent)
  # /etc/systemd/system/worker-http.service.d/override.conf:
  # [Service]
  # Restart=on-failure
  # RestartSec=5
  # TimeoutStopSec=20
  systemctl daemon-reload && systemctl restart worker-http
  ```
- **Verify:** `ps -e -o stat,cmd | grep -w Z | wc -l` = 0; `ss -lntp | grep 8081` = naya worker LISTEN; `curl localhost:8081/health` → 200; health check report shows OK both tasks.
- **Blast radius | Prevent:** Web workerration intermittent, file access timeout (1000s internal users). Prevent: reap handling code fix (memory backpressure), `Restart=on-failure`, never manual process, systemd only; monitor zombie count + port per service; health check alert project already.

### INC-110 · DNS / Network Issue
- **Situation:** Server `report-agg-03` par jobs fail: external API calls `Connection timed out` / `getaddrinfo` failed; internal endpoints respond. Region pe other VMs fine. User thinks "network down".
- **Investigate:**
  ```bash
  cat /etc/resolv.conf                       # DNS servers
  dig @8.8.8.8 payments-api.example.com      # external recursion
  dig payments-api.example.com +short        # configured resolver se kya?
  nslookup payments-api.example.com          # fallback check
  curl -m 10 -I https://api.weather.gov       # external HTTP path
  ip route; systemctl status systemd-resolved # routing + resolver state
  ping -c3 8.8.8.8                           # internet layer3 (bypass DNS)
  ```
- **Root cause:** `/etc/resolv.conf` me galat nameserver (`168.63.129.16` Azure ka right — kisi ne `10.0.5.5` internal stub override kar diya, ya file stale entry rakh diya; external queries ab fail). systemd-resolved stub pe manual file overwrite → local resolution broken; internal IPs direct working — external DNS fail.
- **Fix:**
  ```bash
  # Restore correct upstream via systemd-resolved (cloud convention)
  sudo snap set system resolv-conf symlink-managed false 2>/dev/null || true
  # proper way (Ubuntu + cloud-init):
  sudo systemctl restart systemd-resolved
  # jaise registrar /etc/resolv.conf wapas symlink:
  sudo ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
  # Azure: ensure DHCP → right DNS (168.63.129.16 pair, private DNS zones)
  cat /run/systemd/resolve/resolv.conf
  ```
  Verify: `dig example.com +short` external A works; job rerun success.
- **Verify:** `dig payments-api.example.com` (not +short fallback) returns IP in <10 ms; `curl -m 10 https://api.weather.gov -I` → `200`; scheduled job logo, 0 timeouts.
- **Blast radius | Prevent:** Reports/ETL stuck — schedules pile up (data warehouse pipeline delayed few hours; ~40 consumers affected). Prevent: resolv.conf is managed artifact (cloud-init/netplan) — no manual edits; external connectivity check in health script (`curl -m10`), journalctl resolver errors; alerts on getaddrinfo-error spike; change-management on network config.

## Interview Corner | Sawal-Jawab

**Q: Health-check script me "set -euo pipefail" kyo rakhna chahiye?**
A: `-e` fail-fast, `-u` unset var sa thoda error, `pipefail` pipeline ki hara error pakdo — script ka result "exit code" hi monitoring ka signal hai. Alert logic exit codes pe depend karti hai (0/1/2), isliye script poori fail state me nahi bus fall hokar PAGING mat karo.

**Q: systemd oneshot service + timer kya advantage deta hai bina cron ke?**
A: Journald logs centralized (no maalik file), `Persistent=true` se missed runs catch-up, schedule = calendar+monotonic mixed, dependency `After=network-online.target`, uniform systemctl — aur restart/status/каля peer. Cron ki gateway me port PATH/env issues accumulate.

**Q: Zombie process ka real danger kya?**
A: Zombie apne aap CPU nahi khaata, par **process table entry** + parent's resources hold karta hai. 100s zombies → PID exhaustion, slow fork, system instability. "Zombie pop karo" nahi — **parent fix karo**; `kill -9` parent se init reap kar leta hai.

**Q: Alerts deduplicate karna zaroori hai kyu?**
A: Alert fatigue = real incident me log drowned. Dedup: state file / last-sent timestamp — same CRIT 30 min me ek baar bhejo, recovery par "resolved" bhejo. Monitoring seniors isi design ko PagerDuty/WEBHOOK escalation se compare karte hain.

**Q: DNS fail aur network fail — ek VM par kaise differentiate?**
A: Isolate layers: `ping 8.8.8.8` (layer 3 external), `dig @8.8.8.8 example.com` (bypassing resolvers — resolver test), `dig example.com +short` (resolver path), `curl -I https://external` (full HTTP path). Agar direct IP curl works + dig @8.8.8.8 works lekin default dig fail → **resolver/config bug hai, network nahi**. Exercise: internal-only host, external timeout → contrast, timestamps.

## Quick Notes | Yaad Rakhna
- Health script exit codes (0/1/2) = monitoring contract
- `OnCalendar=*:00/5` timer + `Type=oneshot` = 5-min check loop
- Zombie = parent bug; fix parent, kill parent only for reap
- Port conflict: `ss -lntp` → PID → kill/override → restart policy
- DNS vs network: `dig @8.8.8.8` isolates resolver vs path
- Dedupe alerts (state file) — na alert fatigue
- install.sh idempotent ho → 1 command = production recreate