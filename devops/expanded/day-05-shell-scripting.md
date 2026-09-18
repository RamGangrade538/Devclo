# Day 05 — Shell Scripting & Automation (DevClo Expanded)

## Overview | Parichay
Jo kaam tum hathon se baar-baar karte ho use automate karo — yahi automation bandhan hai. Day 5 me tum production-grade `set -euo pipefail` scripts, cron vs systemd timers ka senior choice, text tools (awk/sed/jq) aur monitoring/alert scripts banaoge — INC-105 (permission denied) aur INC-106 (memory high) tickets ke saath.

## What You'll Learn | Aaj Ki Seekh
- [ ] `set -euo pipefail` — production script ka standard
- [ ] `trap`, exit codes, `$?` — error handling
- [ ] Variables, arrays, if/for/while/case, functions, string ops, globbing
- [ ] Text tools: `grep awk sed cut sort uniq tr xargs jq`
- [ ] **cron vs systemd timers** (senior choice) + cron PATH gotchas
- [ ] log rotation, monitoring scripts (CPU/disk/mem/port + webhook alert)
- [ ] Idempotency (script baar-2-chalne pe safe) + `shellcheck` lint
- [ ] INC-105 aur INC-106 ka full ticket flow

## Full Topic (LEARN) | Puri Detail

### 1. Production Script Skeleton
```bash
#!/usr/bin/env bash
set -euo pipefail        # -e: error pe exit | -u: unset var pe fail | -o pipefail: pipeline me fail
trap 'echo "[ERROR] line $LINENO: $?"' ERR    # fail hone pe dikhao

readonly LOG=/var/log/health/check.log
LOGIN_ROLE="${ROLE:-devops}"     # :- = default value; REQUIRED="${VAR:?set karo}"
```
- `$?` = last command ka exit code (0 = success).
- `||` continue-on-fail, `&&` chain, `;` hamesha.
- Idempotent: script 50 baar chale to bhi same safe result — hamesha state check karo (e.g. file exists to skip, service active to restart only if needed).

### 2. Variables, Arrays, Conditionals
```bash
NAME="devops"
arr=(web api db)                      # array
for svc in "${arr[@]}"; do echo "$svc"; done
if [[ -f /etc/nginx/nginx.conf ]]; then echo "exists"; fi
case "$1" in start|stop|restart) echo "action: $1";; *) exit 1;; esac
greeting() { echo "Hello $1"; }       # function
```
- String ops: `${VAR#prefix}` (remove prefix), `${VAR%suffix}` (remove suffix), `${VAR//a/b}` (replace all).
- Globbing: `*.log`, `[a-f]*`, `${VAR:-default}`, `${!PRE}` (indirection). Quote always.

### 3. Text Tools — The Daily Weapons
| Tool | Kaam |
|------|------|
| `grep 'pattern' -E -i -r` | filter lines |
| `awk '{print $1}'` `awk 'NR>1'` `awk -F, '{print $2}'` | columns/fields |
| `sed 's/old/new/g'` `sed -i` `sed -n '10,20p'` | substitute/extract |
| `cut -d: -f1 /etc/passwd` | field cut |
| `sort -rn` `uniq -c` | sort/count unique |
| `tr 'a-z' 'A-Z'` | translate |
| `xargs -I{} cmd {}` | bulking args |
| `jq '.field' file.json` `jq '.[].name'` | JSON manipulation |

Common pipeline: `ps aux | awk '{print $4}' | sort -rn | head -1` = max %mem.

### 4. cron vs systemd timers (Senior Choice)
| Feature | cron | systemd timer |
|---------|------|----------------|
| Logs | email/maa me khud | **journald** (`journalctl -u x.timer`) |
| Missed runs | - | `Persistent=true` (catch-up) |
| Dependencies | nahi | `Requires=`/`After=` |
| Precision | - | `OnCalendar=*-*-* 04:00:00`, `OnBootSec=`, `OnUnitActiveSec=` |
| On-demand triggering | - | `systemctl start x.timer` |

**cron gotchas**: PATH chhota (`/usr/bin`, `/bin` only) → `python3` nahi milega; `.bashrc` loaded nahi; env vars missing. Fix: script me `#!/usr/bin/env bash` + export PATH ya full paths.
Cron line: `0 4 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1`.

### 5. Monitoring + Alert Script
```bash
#!/usr/bin/env bash
set -euo pipefail
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
MEM=$(free | awk '/Mem/{print int($3/$2*100)}')
DISK=$(df / | awk 'NR==2{print $5}' | tr -d '%')
[ "$CPU" -gt 85 ] && curl -fsS -H "Content-Type: application/json" \
  -d "{\"text\":\"CPU $CPU% on $(hostname)\"}" "$SLACK_WEBHOOK"
echo "$(date) cpu=$CPU mem=$MEM disk=$DISK" >> /var/log/health/check.log
```
Check porrei: max 1 min, low overhead, alert deduplicate (state file), secrets never hardcoded (env/`${VAR:?}`).

### 6. shellcheck + Testing
- **shellcheck** = shell lint (`shellcheck script.sh`) — 0 errors target: quotes, unused vars, `-u` conflicts.
- `bash -n script.sh` syntax check; `bash -x` trace.
- Temp: `mktemp -d`; cleanup `trap 'rm -rf "$TMP"' EXIT`.

### 2026 Notes
Bash 5.2 default; `jq` 1.7+; systemd ~257 timers with monotonic `OnBootSec` + calendar mixed; `crontab -e` still works everywhere but kubernetes/container world me cronjob managed. **Timers preferred in systemd systems**; cloud scheduling (Azure Automation / vm cron) alternate.

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `set -euo pipefail` | fail-fast script mode |
| `trap '...' ERR` / `EXIT` | error/cleanup hook |
| `echo $?` | last exit code |
| `grep -E 'a.*b' -c` | count matches |
| `awk '{print $NF}'` | last column |
| `sed -i 's/foo/bar/g' f` | in-place replace |
| `jq -r '.services[].name'` | json value extract |
| `crontab -l` / `crontab -e` | list / edit cron |
| `systemctl list-timers` | active timers |
| `systemd-analyze calendar "*-*-* 04:*"` | timer spec validate |
| `shellcheck script.sh` | lint |
| `bash -x script.sh` | trace debug |
| `mktemp -d` | safe temp dir |
| `curl -fsS -d '{}' $URL` | alert/webhook send |

## Practice Lab | Abhi Karein
1. `health-check.sh` banao with `set -euo pipefail` (upar wala skeleton).
2. `chmod +x health-check.sh`; `bash -n health-check.sh` (syntax), `shellcheck health-check.sh` (lint 0 errors banaliyo).
3. Script me CPU, mem, disk check add karo; `echo` se log karo.
4. Crashed-error handling: ek galat command script me daal ke `set -e` ka behavior dekh (`echo "hi"; some_garbage`).
5. `trap 'echo FAILED line:$LINENO' ERR` se trace karo ki fail kahin se aaya.
6. Array + loop: `services=(nginx cron ssh)` pe `systemctl is-active` loop banao.
7. `awk '{print $1}' /etc/passwd | sort | uniq -c` — users count.
8. `jq` test: `echo '{"app":"web","ports":[80,443]}' | jq '.ports[0]'`.
9. **cron gotcha**: `crontab -e` me `* * * * * /home/ubuntu/health-check.sh`; log file me check karo — PATH miss ho to kya karna hai.
10. **Timer version**: `/etc/systemd/system/health-check.service` + `.timer` banao (`OnCalendar=*-*-* *:00:00`), `systemctl enable --now health-check.timer`; `systemctl list-timers` me dikhna chahiye.
11. Idempotency: script 3 baar chaalao — logs duplicacy to? State check add karo.
12. `backup.sh`: `tar -czf backup-$(date +%F).tar.gz /var/www/app` + rotation (7 din purane delete).

## Incidents / Tickets | Real Practice

### INC-105 · Permission Denied (Service User)
- **Situation:** Web app (nginx worker) logs fail: `Permission denied` writing `/var/www/app/storage/logs/app.log`. Deployment ka ci job bhi sama path pe fail.
- **Investigate:**
  ```bash
  ls -l /var/www/app/storage /var/www/app/storage/logs
  id www-data                       # kaunsa user service chal raha
  namei -l /var/www/app/storage/logs/app.log   # poora path perms chain
  ps -ef | grep nginx | grep -v grep   # worker ka actual user
  ```
- **Root cause:** Naya deploy `sudo tar` se path `/var/www/app` root ke 755 me bana, `storage/logs` `root:root 644` ho gaya — nginx worker `www-data` hai, write nahi kar sakta. Namei se pata chala `/` se /var/www tak ek bhi dir me `www-data` write missing.
- **Fix:**
  ```bash
  sudo chown -R www-data:www-data /var/www/app/storage
  sudo chmod -R 775 /var/www/app/storage
  sudo setfacl -R -m u:www-data:rwx /var/www/app/storage      # ACL variant
  sudo umask 0022   # future shells ke liye consistency
  sudo systemctl restart nginx
  ```
- **Verify:** `sudo -u www-data touch /var/www/app/storage/logs/test.log` ✓; app logs ab likh rahe hain; nginx error log me permission denied band.
- **Blast radius | Prevent:** Whole app down (logging broken = no observability) ≈ all users. Prevent: Deploy pipeline me ownership step (`chown` before start), init stage script, storage dir perms idempotent, ACL-based team access, docs me umask/ownership contract.

### INC-106 · Memory High (OOM risk)
- **Situation:** `worker-ml-01` pe OOM killer messages a rahe hain, pods/processes kill ho rahe hain. App runs heavy ML batch. Uptime + mem graph show uptrend.
- **Investigate:**
  ```bash
  free -m
  top -b -n1 | head -20
  cat /proc/<pid>/status | grep -E 'VmRSS|VmSize|VmSwap'
  dmesg | grep -i -E 'oom|killed' | tail -20
  ps aux --sort=-%mem | head
  ```
- **Root cause:** ML app batch job memory **leak** — har batch iteration me retained refs (cache) badta ja raha hai; RSS 6GB → system 8GB RAM pe OOM. Pehle warning alert 75% aaya tha kisi ne action nahi liya.
- **Fix:**
  ```bash
  # 1. Restart policy (systemd) — crash pe auto come-back up
  sed -i '/\[Service\]/a Restart=on-failure\nRestartSec=5\nMemoryMax=7G' \
    /etc/systemd/system/ml-worker.service.d/override.conf
  systemctl daemon-reload && systemctl restart ml-worker.service
  # 2. App fix: batch cache clear between runs (code change — fix leak)
  # 3. Alert threshold tune: 75% warn now, 85% page, OOM should never fire
  ```
- **Verify:** `systemctl status ml-worker` active; `free -m` < 80% after heavy batch; no new `dmesg | grep -i oom`; RSS dibeash down after restart (leak-controlled runs).
- **Blast radius | Prevent:** Entire node unstable — other services on same node collaterally killed (batch processing blocked ~ 1 hr). Prevent: bounded cgroups MemoryMax, restart policy, leak regression test, memory trend alert (not just threshold), and monitoring which metrics set by every batch service.

## Interview Corner | Sawal-Jawab

**Q: `set -euo pipefail` har script me kyun?**
A: `-e` = koi command fail to script ruk jaye (silent continue nahi); `-u` = unset variable pe turant fail (typo bug pakdo); `pipefail` = pipeline me beech wali fail command ka exit code visible (nahi to `cmd1|cmd2` me sirf last ka dikhta). Foreground script ye safety net deti hai — production me garbage deploy nahi.

**Q: cron vs systemd timer — senior choice batao?**
A: Timer preferred: logs journald me (rotated centrally), missed runs `Persistent=true` se catch-up, dependencies, granular scheduling (`OnCalendar`+`OnUnitActiveSec`), uniform `systemctl` management. Cron tab use karna bhi likhit chalta hai but PATH gotchas aur log sprawl pay hota hai.

**Q: Idempotency kya hai script me?**
A: Script jo **baar-2 chalao to same result** — safe re-run. Implementation: check-karo-phir-karo (file exists? service already active? already-running skip), state comparison, `|| true` on harmless steps, toujours non-destructive default (backup before overwrite). Idempotent scripts hi scheduling/retry me confident banaati hain.

**Q: `awk '{print $2}'` vs `sed -n 's/x/y/'` kab use karo?**
A: awk = **structured/tabular** (columns, arithmetic, conditions `NR>1`); sed = **line/regex substitution** (`s///`, range extract). Jq JSON ke liye. Example: `ps aux | awk '$3>50 {print $2}'` (column-based condition) vs `sed -i 's/localhost/10.0.0.5/' config`. Dono milte jaate hain — team preference, par mental split yahi hai.

**Q: OOM situation me sabse pehle kya check?**
A: `dmesg | grep -i oom` — kaunse process killed, kis node pe; `free -m` + `top %mem` + `/proc/<pid>/status` RSS trend. Phir identity: process leak hai, kam RAM, ya cgroup limit? Fix: stop 1 process (if batch), start restart policy, then investigate app cache/refs. OOM = detection-too-late hai, alert threshold pehle honi chahiye.

## Quick Notes | Yaad Rakhna
- `set -euo pipefail` + `trap ERR` = production script ka dharma
- Timer > cron on systemd systems (logs, persist, schedule)
- awk columns, sed replace, jq JSON, grep filter — ek me ek
- Every script idempotent banao; `|| true` carefully
- `shellcheck` 0 errors = mergeable script
- Restart policy + MemoryMax cgroup = OOM se bachav
- Webhook alert: `curl -fsS -d '{"text":"..."}' $URL` — secrets env se, kabhi hardcode nahi