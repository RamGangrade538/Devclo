# Day 06 — SSH, Logs & Deep Debugging (DevClo Expanded)

## Overview | Parichay
Production me koi kaam nahi bina SSH ke, aur koi incident nahi bina logs ke. Day 6 me tum hardened SSH (ed25519 keys, password auth off, fail2ban) aur log-debugging chain master karoge: `systemctl → journalctl → app log → stack trace/timestamps → correlation`. INC-107 (SSH not working) aur INC-108 (log investigation) isi day ke asli exams hain.

## What You'll Learn | Aaj Ki Seekh
- [ ] SSH keys: `ed25519`, `ssh-keygen`, perms 600/644, `ssh-keyscan`
- [ ] `~/.ssh/config` — aliases/host-specific settings
- [ ] `sshd_config` hardening: password auth off, protocol, key rotation
- [ ] `fail2ban` + fail login protection
- [ ] logs: `journalctl -u -f -n -k`, syslog/rsyslog, logrotate, app log dirs
- [ ] Debug chain: systemctl → journalctl → app log → stack trace → timestamps → correlation
- [ ] INC-107 aur INC-108 ticket ka full flow

## Full Topic (LEARN) | Puri Detail

### 1. SSH Key-Based Auth
- Generate: `ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519` (ed25519 = fast + secure; RSA 3072 ok but slower).
- Private key: `chmod 600 ~/.ssh/id_ed25519`; public: `chmod 644 ~/.ssh/id_ed25519.pub`.
- Copy: `ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host` (ya manual append `~/.ssh/authorized_keys`).
- Test: `ssh -v user@host` (debug), `ssh -vv` = connection detail too verbose.
- `ssh-keyscan host >> ~/.ssh/known_hosts` = host key pre-fetch (scripts/automation — fingerprint trust).
- **`~/.ssh/config`** — life-saver:
  ```
  Host web1
      HostName 10.0.1.5
      User deploy
      IdentityFile ~/.ssh/id_ed25519
      Port 22
      ServerAliveInterval 30
  ```
  Ab `ssh web1` karlo. Multi servers: `Host *.prod` patterns.

### 2. sshd Hardening
- `/etc/ssh/sshd_config` line-by-line pro tip:
  ```
  Port 22                       # (ya non-standard 22022 — obscure, not security)
  PermitRootLogin no
  PasswordAuthentication no
  PubkeyAuthentication yes
  AllowUsers deploy ci-admin
  MaxAuthTries 3
  LoginGraceTime 30
  ```
- Changes ke baad: `sshd -t` (test config) fir `systemctl reload ssh` — **never restart** live SSH drops risk (reload doesn't kill open sessions).
- **Key rotation**: naye key pair → `authorized_keys` me add → verify login → old key remove. Seniors key "expiry date" document karte hain.
- **fail2ban**: `apt install fail2ban`; config `[sshd] enabled = true, maxretry = 5, bantime = 3600`; `journalctl -u fail2ban`; `fail2ban-client status sshd`.

### 3. Logs Ecosystem
| Source | Kanha | Kaise dekhein |
|--------|-------|----------------|
| Systemd services | journald | `journalctl -u app.service` |
| Kernel | journald | `journalctl -k -b` |
| Syslog apps | `/var/log/syslog` | `tail -f /var/log/syslog` |
| App custom | `/var/log/app/` (e.g. `/var/log/nginx/`) | `tail -f app.log` |
| Auth | `/var/log/auth.log` | grep sshd |

`journalctl` power: `-u`, `-f` (follow), `-n 100` (lines), `--since "2 hours ago"`, `--until "date"`, `-k` (kernel), `-p err` (priority), `--no-pager`. `journalctl -f -u app` = live app log tail.

### 4. logrotate
- Daily rotation + compression + retention:
  ```
  /var/log/myapp/*.log {
      daily
      rotate 7
      compress
      delaycompress
      missingok
      notifempty
      copytruncate            # app ko reopen karne ki zaroorat nahi
  }
  ```
  Placement: `/etc/logrotate.d/myapp`; test: `logrotate -f -d /etc/logrotate.d/myapp` (dry-run), `logrotate -f` force.
- **Gotcha**: logrotate pehle `kill -USR1`/reopen signal ki zaroorat adhik? `copytruncate` ya `postrotate` — senior remember karte hain.

### 5. Debug Chain — Incident Correlation
Pattern (senior's flow):
1. `systemctl status app` — state + last log snippet.
2. `journalctl -u app -n 200 --since "1 hour ago"` — service-level logs.
3. App log dir (`/var/log/app-*/`) ka fresh log — `tail -f`, check secrets never printed.
4. **Stack trace + timestamps**: errors ke around '만' timestamp vs known event (cron ran, purge cleared, deploy time). Correlation: "cron job X ran at 03:00 = DB timeout spikes 03:05 = app OOM spikes after".
5. Cross-correlate: `journalctl -u app -f` ek window me, syslog dusre pane me; match timestamps.

### 6. SSH Troubleshooting Order (30-sec debug)
```
host reachable?  ping / nc -vz host 22
sshd running?    systemctl status sshd | ss -lntp | grep 22
key perms?       ls -la ~/.ssh; chmod 600 keys
auth logs?       tail -30 /var/log/auth.log | grep ssh
config valid?    sudo sshd -t
verbose?         ssh -vvv user@host
firewall?        ufw status | grep 22
```

### 2026 Notes
OpenSSH 9.x, `ed25519` default + `ssh-keygen -a 100` KDF rounds standard; `PasswordAuthentication no` = PCI/security baseline; SSH CA + short-lived certs (cert-auth) for fleet management; fail2ban vs Syncthing alternatives (fail2ban still universal). Azure Linux VMs: managed-identity-based SSH via Azure Bastion — password auth off.

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `ssh-keygen -t ed25519 -a 100` | secure key pair |
| `ssh-copy-id user@host` | public key push |
| `ssh -vvv user@host` | full debug connect |
| `chmod 600 ~/.ssh/id_ed25519` | private key perms |
| `ssh-keyscan host >> known_hosts` | host keys pre-load |
| `sshd -t` | sshd config test |
| `systemctl reload ssh` | safe config load |
| `journalctl -u app -f -n 100` | service log tail |
| `journalctl -k -b` | kernel boot log |
| `tail -f /var/log/syslog` | syslog follow |
| `logrotate -d /etc/logrotate.d/x` | dry-run rotate |
| `fail2ban-client status sshd` | banned list |
| `hostname; uptime` | quick state |

## Practice Lab | Abhi Karein
1. `ssh-keygen -t ed25519 -a 100` naya key pair banao (comment: `your@email`).
2. `chmod 600 ~/.ssh/id_ed25519` + `chmod 644 ~/.ssh/id_ed25519.pub`.
3. **Second VM** (ya apna cloud VM) pe `ssh-copy-id` se public key install.
4. Password login band karo: `sshd_config` me `PasswordAuthentication no`, `sshd -t`, `systemctl reload ssh`. Ab password se login fail hona chahiye — key se chalta rahe.
5. `~/.ssh/config` me 2 aliases banao (e.g. `web1`, `db1`), `ssh web1` se login karo bina IP likhe.
6. `ssh -vvv web1` — handshake ke key exchange line dhoondo.
7. `ssh-keyscan web1 >> ~/.ssh/known_hosts` — fingerprint check karo.
8. `journalctl -u ssh -n 20` — accepted/failed login lines dekho.
9. `journalctl -u <systemd-service> -f` chalao aur us service ko restart karo — live logs dekho.
10. `logrotate` dry-run apne app log ke liye: `logrotate -d /etc/logrotate.d/nginx`.
11. `fail2ban` install karo, `fail2ban-client status sshd` se banned IP check karo (agar ho mata).
12. Ek fake incident: app service crash karo (`systemctl stop`), phir `journalctl -u <unit> --since "5 min ago"` se timeline reconstruct karo.

## Incidents / Tickets | Real Practice

### INC-107 · SSH Not Working
- **Situation:** `deploy@web-02` pe SSH timeout — deployment CLI fail hona shuru. On-call me ssh username typo? No wait, ek hi command... `user@bastion` se `web-02` pe connect ni ho pata. Devs panicked sab SSH trying.
- **Investigate:**
  ```bash
  ping -c3 web-02                          # layer3
  nc -vz web-02 22                         # layer4 port
  ssh -vvv -i ~/.ssh/id_ed25519 deploy@web-02   # verbose connect
  # (console login / cloud CLI se)
  systemctl status sshd
  ss -lntp | grep 22
  sudo tail -50 /var/log/auth.log         # sshd messages
  sudo ufw status | grep 22
  sudo sshd -t
  ```
- **Root cause:** Cloud VM ke **NSG/security group** me `22` inbound rule accidentally overwritten — (ya host-level ufw default deny me 22/22 not added). setup kisi config change (Terraform apply) me rule sequence reorder ho gayi. SSH Fail: connection black-hole (port filtered — nc silent) — auth.log me kuch nahi (firewall log).
- **Fix:**
  ```bash
  # cloud side: inbound tcp/22 allow from bastion/admin IP (least privilege)
  # host side:
  sudo ufw allow from 10.0.0.10 to any port 22 proto tcp
  sudo ufw reload && sudo ufw status verbose
  # verify sshd is up:
  systemctl is-active sshd
  ```
- **Verify:** `nc -vz web-02 22` → open; `ssh deploy@web-02` → login success; `systemctl status sshd` active.
- **Blast radius | Prevent:** All operators/apps (50+ admin sessions) locked out from server — RPO drift. Prevent: **cloud-consolidated inbound rules (NSG) as source of truth**, host-ufw secondary; SSH via bastion; automated connectivity test (nc) every 5 min; config review checklist before Terraform production apply.

### INC-108 · Log Investigation (Cron + DB Timeout Overlap)
- **Situation:** `analytics-api.service` periodically fail: "connection refused" / "DB timeout" — random hours. Uptime looks fine, one min high latency. Team suspects DB down.
- **Investigate:**
  ```bash
  journalctl -u analytics-api -f --since "3 hours ago" | tail -200
  grep -n "$(date +%F)" /var/log/analytics-api/error.log | tail -50
  grep -iE 'timeout|connection refused|error' /var/log/analytics-api/*.log | tail
  journalctl -u cron --since "today" | grep -iE 'report|analytics|pg_dump'
  # timestamps:
  awk '{print $1, $2}' /var/log/analytics-api/error.log | sort | uniq -c | sort -rn | head
  systemctl status postgresql   # DB actually up?
  ```
- **Root cause:** **Cron job** (`03:00` daily report, heavy SQL) overlap with **analytics-api** batch DB timeout window. Analytics runs `pg_dump`/aggregation at exact same time — Postgres connection pool exhaust; app gets `FATAL: remaining connection slots reserved`. Timestamps correlate minute-perfect: cron start 03:00, app failures 03:00-03:04 daily.
- **Fix:**
  ```bash
  # 1. Move analytics cron to non-peak (e.g. 02:00)
  crontab -e   # 0 2 * * * /opt/report.sh
  # 2. App: connection pool retry/backoff (code)
  # 3. DB: raise max_connections OR pool limit (tuning)
  sed -i 's/max_connections = 100/max_connections = 150/' /etc/postgresql/*/main/postgresql.conf
  systemctl restart postgresql
  ```
- **Verify:** 3-4 din log scan: `grep -c 'remaining connection slots' /var/log/analytics-api/error.log` → 0; visualization: app error graph flat during cron window.
- **Blast radius | Prevent:** Periodic 4-min outage for analytics API — impacts reporting pipeline + dashboards (30 internal users); prevent: scheduled XOR resource calendars, alert on pool-shortage not just connection fail, health-check to catch the pattern (anomaly detection), peer-review of cron schedules.

## Interview Corner | Sawal-Jawab

**Q: SSH key vs password — production me kya aur kyon?**
A: Key-only (password off): password brute-force nahi hoga, key = 600 perms ke private file pe, rotate/may revoke keys, long PK secure. Password auth off = industry standard (PCI). Alag-se bastion/jump host + audit = added security.

**Q: journalctl ke 5 flags jo tum roz use karte ho?**
A: `-u` (unit), `-f` (follow/live), `-n` (lines), `--since`/`--until` (window), `-p` (priority err/warning), `-k` (kernel). Combine: `journalctl -u app -f -n 200 --since "2 hours ago"` — incident me default window.

**Q: logrotate kya karta hai aur config me `copytruncate` kya hai?**
A: Logs ko time/size se rotate (rename), compress (`gzip`), retention (`rotate 7`), old delete — disk full nahi leta. `copytruncate` = file ko copy + truncate karta hai, app ko restart/reload ki zaroorat nahi (bina-downtime rotation).

**Q: Debug chain "systemctl → journalctl → app log" — kaise?**
A: (1) `systemctl status X` = unit state + last fairy few lines, (2) `journalctl -u X --since` = managed logs (start failures, exit codes, OOM adjacent), (3) app log dir = actual error stack traces, exactly timestamped. Correlation: match timestamp windows across layers — one event, three signals. Pattern dedup → root cause.

**Q: SSH "Connection timed out" vs "Permission denied" — farak?**
A: **Timeout** = network path blocked (firewall drop/NSG, host unreachable) — request nahi pahunchta; **Permission denied** = server pahuncha par auth fail (wrong key, perms 644, not in authorized_keys). Debug: timeout → `ping/nc/firewall`; denied → `auth.log`, `chmod 600`, `ssh -vvv`. Ye ek senior interview favorite hai — bolna chahiye.

## Quick Notes | Yaad Rakhna
- ed25519 keys, `chmod 600` private, password auth off
- `sshd -t` + `systemctl reload ssh` (restart nahi)
- `journalctl -u -f -n --since` = one-stop log view
- `copytruncate` = downtime-free rotations
- Fail2ban maxretry=5, bantime=1h
- Timestamp correlation = incident ka DNA
- 30-sec SSH debug: ping → nc → verbose → auth.log → sshd -t