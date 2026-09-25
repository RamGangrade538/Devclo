# Deep Dive: systemd & Service Management — Java App Ko 24×7 Kaise Rakhte Hain

> **Standalone deep dive:** Production me **rarely** `./app &` chalti hai — sab kuch **systemd service** hota hai. Ye ek must-know skill hai har interview me.

---

## 1. systemd Kya Hai — "PID 1"

Linux boot hone ke baad **first process = systemd** (`PID 1`). Ye saare services ko start/stop/restart/status/restart-bhai-ke-bahane manage karta hai.

```bash
ps -p 1      # => /sbin/init  (symlink to systemd)
systemctl --version
journalctl --disk-usage
```

**Sab common commands:**
```bash
systemctl start nginx      # abhi start
systemctl stop nginx       # abhi stop
systemctl restart nginx    # stop + start (brief downtime)
systemctl reload nginx     # config re-load (bina downtime!)
systemctl status nginx     # status + logs
systemctl enable nginx     # boot pe auto-start
systemctl disable nginx    # boot pe auto-start band
systemctl restart nginx --no-block
```

> **Interview favorite:** "restart vs reload?" — Restart = process kill+spawn (downtime). Reload = `SIGHUP` bhejta hai, config reload hoti hai bina connection drop (nginx, sshd, postfix).

---

## 2. Service Ka Anatomy — Unit File

Ek service = `.service` file in `/etc/systemd/system/` (ya `/lib/systemd/system/`).

```ini
[Unit]
Description=DeployTrack Backend API
After=network.target postgresql.service
Wants=postgresql.service
RequiresMountsFor=/data

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/deploytrack
ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
ExecStartPre=/opt/deploytrack/scripts/migrate.sh
Restart=on-failure
RestartSec=5
EnvironmentFile=/etc/deploytrack.prod.env
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

| Directive | Matlab |
|-----------|--------|
| `After=` | Ye services pehle start hon |
| `Wants=` | Soft dependency (fail toh bhi chalega) |
| `Requires=` | Hard dependency (fail toh ye bhi na chale) |
| `Type=simple` | ExecStart directly run hota hai (default) |
| `Type=forking` | Daemon spawn karta hai, parent exits (old style) |
| `Restart=on-failure` | Crash pe auto-restart — **production mai zaroori** |
| `RestartSec=5` | Restart ke beech 5s gap (crash-loop protection) |
| `EnvironmentFile=` | Env vars file se (secrets bina hard-code) |
| `LimitNOFILE` | Open-file limit badao (high traffic) |

**File rakhne ke baad:**
```bash
sudo systemctl daemon-reload    # naya unit read karo
sudo systemctl enable --now deploytrack   # enable + start
sudo systemctl status deploytrack
```

---

## 3. `Restart=` Modes — Interview Table

| Mode | Behaviour | Kab Use |
|------|-----------|---------|
| `no` | Kabhi auto-restart nahi (default) | Batch jobs |
| `on-success` | Sirf clean exit pe restart | — |
| `on-failure` | Non-zero exit/crash pe restart | **Normal apps** |
| `on-abnormal` | Signal/timeout se crash pe | — |
| `on-abort` | Unclean signal pe | — |
| `always` | Exit code ignore, hamesha restart | **Must-alive daemons** |

```bash
# Test crash-restart:
sudo systemctl start deploytrack
sudo pkill -f uvicorn
sleep 8
systemctl status deploytrack   # => automatically restarted, active (running)
```

---

## 4. Logs — `journalctl` (DevOps Ka Sabse Use Hota Command)

```bash
journalctl -u deploytrack                 # is service ke saare logs
journalctl -u deploytrack -n 100          # last 100 lines
journalctl -u deploytrack -f              # live follow (tail -f jaisa)
journalctl -u deploytrack --since "1 hour ago"
journalctl -u deploytrack -p err          # sirf errors
journalctl --since yesterday | grep ERROR
journalctl --vacuum-size=200M             # purane logs clean (disk bharcha se bachao)
```

**Production pattern — app logs journal me, par disk ko tightly control karo** (journal vacuum + limit):
```bash
journalctl --disk-usage          # kitna space
journalctl --rotate              # current file rotate
```

---

## 5. Timers — Cron ka Modern Barkha

`systemd` timers cron replace kar sakte hain (monotonic se calendar, overlapping protection):

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Nightly DB backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
# Service jo timer chalayegi:
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers
```

| Timer Option | Matlab |
|--------------|--------|
| `OnCalendar=` | Cron jaisa schedule (min/hour/day/month) |
| `OnBootSec=` | Boot ke x second baad |
| `OnUnitActiveSec=` | Last trigger ke baad x seconds (interval) |
| `Persistent=true` | Missed time (system off tha) pe jald chal jaye |
| `RandomizedDelaySec=` | Random delay — **thundering herd se bachne** |

---

## 6. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **Service crash-loop** | `Restart` hi hi nahi tha | `Restart=on-failure` + `RestartSec=5` + alert |
| **Boot pe service nahi chalti** | `enable` nahi kiya | `systemctl enable --now <svc>` |
| **Port 80 "permission denied"** | Non-root, user service | `setcap cap_net_bind_service=+ep $(readlink -f $(which python3))` ya nginx proxy |
| **Env secrets service me** | Hardcoded in unit | `EnvironmentFile=` / `LoadCredential=` |
| **Logs kahi nahi mil rahe** | App stdout deta hai | journal se, ya `StandardOutput=append:/var/log/app.log` |
| **Too many open files** | Default 1024 | `LimitNOFILE=65535` |
| **Cron job skip ho gaya** | System off tha | `Persistent=true` timer |
| **Service "failed" — koi exit code nahi** | ExecStart path galt | `systemctl cat <svc>`, test binary manually |
| **systemd-networkd DNS issue** | `resolv.conf` overwritten | `resolvectl status` |

**Debug karna:**
```bash
systemctl show deploytrack | grep -i exec  # kaunsa command + args
systemd-analyze verify /etc/systemd/system/deploytrack.service
systemd-analyze blame                    # boot kaun slow
systemd-analyze critical-chain           # kotour slider
```

---

## 7. Containers + systemd — Kaha Se Knit Hote Hain

- **K8s:**: pod restart policy = systemd ke `Restart` ka hi concept
- **Docker:** `--restart=always` ≈ `Restart=always`; docker restart policy ya systemd dono se chalta hai, double se dhyan rakho
- **App me:** Python/Node/Java app ko **bina supervisor nginx+uvicorn mode** me chalao to production me systemd hi use karte hain (ya container orchestrator)

```bash
# Docker restart options (systemd ka sabak naya)
docker run -d --restart=on-failure:5 --name app myapp
docker update --restart=always app
```

---

## 8. Interview Questions — systemd

| Question | Strong Answer |
|----------|---------------|
| "PID 1 (init) kya script hai production me?" | systemd — boot se saari services, logs, timers, sockets manage karta hai. |
| "restart vs reload?" | Restart = stop+start (downtime); Reload = SIGHUP → config reload bina connection drop. |
| "Service crash pe auto-start kaise?" | `Restart=on-failure` + `RestartSec` (crash-loop se bachne) + alert (uptime/liveness). |
| "environment variables app ke liye kaise?" | `EnvironmentFile=` unit me — secrets alag file me, permissions 600. |
| "App ke logs kahan?" | journal — `journalctl -u <svc> -f`. Dedicated file chahiye to syslog + logrotate. |
| "Cron ke jagah systemd timer kyun?" | Calendar + persistent (missed runs) + overlap protection + logs centralized. |
| "Service crash-loop/quick restart me kya?" | `RestartSec` + exponential backoff + health-check + alert — fail-fast + notify pattern. |
| "'Failed to start' — kaise debug karenge?" | `systemctl status`, `journalctl -u -p err -n 50`, `systemd-analyze verify`, ExecStart manually run. |

---

## 9. Hands-On Lab

```bash
# 1. Apni service banado (root ya sudo)
cat > /tmp/devopslab.service <<'EOF'
[Unit]
Description=DevOps Lab Demo
After=network.target

[Service]
Type=simple
ExecStart=/bin/sh -c 'while true; do echo "tick $(date)"; sleep 5; done'
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/devopslab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now devopslab

# 2. Verify
systemctl status devopslab --no-pager
journalctl -u devopslab -f        # Ctrl+C se exit

# 3. Crash test
sudo systemctl restart devopslab
sudo pkill -f "while true"
sleep 8
systemctl is-active devopslab     # active!

# 4. Stop + disable
sudo systemctl disable --now devopslab
sudo rm /etc/systemd/system/devopslab.service
sudo systemctl daemon-reload
```

---

## 10. Summary | Yaad Rakho

1. `systemctl start/stop/restart/reload/enable/disable/status`
2. Unit = `[Unit] [Service] [Install]` — Description, ExecStart, Restart, EnvironmentFile
3. `Restart=on-failure` + `RestartSec=5` = production survival
4. Logs = `journalctl -u <svc>` — `-f` follow, `-p err` errors
5. Cron → **systemd timers** (`OnCalendar`, `Persistent`, `RandomizedDelaySec`)
6. `daemon-reload` matlab **naya/changed unit read** karna
7. Secrets = `EnvironmentFile` abhi, credentials bina unit hard-code
8. Containers me review: docker `--restart` ≈ systemd `Restart`

---
**Related:** [Day 3](../day-03-linux-users-permissions-processes.md) · [Day 13](../day-13-advanced-shell-scripting-automation.md) · [Linux Storage](../topics/linux-storage-sysadmin.md) · [Linux Permissions](../topics/linux-permissions.md)