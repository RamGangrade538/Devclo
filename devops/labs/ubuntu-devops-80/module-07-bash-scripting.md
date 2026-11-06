# Module 7 — Bash Scripting

> **Hinglish:** Bash script = repeat hone wala kaam ek file me. Is module me shebang, variables, arguments, conditions, loops, functions, error handling, logging, aur cron seekhoge — sab chhote-chhote scripts se.

**Prerequisite:** Ubuntu terminal. Module 1-6 complete ho to behtar.
**Setup:** `mkdir -p ~/devops-lab/{scripts,logs,notes,files}`
**Rule:** Har script `chmod +x` karke `./script.sh` se chalao; `bash script.sh` bhi chalega.

---

## Task 43: First Bash Script

**Scenario:** Deployment ke waqt ek clear message print karna hai — kaunsa app, kaunsa environment, kis time.

**Command plan:**
```bash
cat > ~/devops-lab/scripts/hello.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "Deploying sample-app"
echo "Environment: staging"
echo "Time: $(date -Is)"
EOF
chmod +x ~/devops-lab/scripts/hello.sh
~/devops-lab/scripts/hello.sh
```

**Verification:**
- Output me "Deploying sample-app", environment, aur ISO timestamp ho.
- `echo $?` = `0`.
- `ls -l` me script executable (`-rwxr-xr-x`) ho.

**Note:** `#!/usr/bin/env bash` shebang portable hai. `set -euo pipefail` production scripts ka safety belt hai: error pe rukna, undefined variable pakadna, pipe failure pakadna.

---

## Task 44: Variables and Arguments

**Scenario:** Ek hi script se multiple apps deploy karne hain. App ka naam command-line argument se lo; na diya jaye to default `demo` use karo.

**Command plan:**
```bash
cat > ~/devops-lab/scripts/app-name.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
APP_NAME="${1:-demo}"
APP_ENV="${2:-staging}"
echo "App: $APP_NAME"
echo "Env: $APP_ENV"
echo "Arg count: $#"
EOF
chmod +x ~/devops-lab/scripts/app-name.sh
~/devops-lab/scripts/app-name.sh
~/devops-lab/scripts/app-name.sh payments production
```

**Verification:**
- Bina argument: `App: demo`, `Env: staging`, `Arg count: 0`.
- Do arguments: `App: payments`, `Env: production`, `Arg count: 2`.

**Note:** `$0` = script name, `$1`/`$2` = args, `$#` = count, `$@` = all args. `${1:-default}` = value ya default. Quotes use karo: `"$1"`, taaki spaces safe rahein.

---

## Task 45: Conditional Logic

**Scenario:** Script config file read karegi — lekin pehle check karo file exist karti hai. Missing file pe crash ke bajaye clear error do.

**Command plan:**
```bash
cat > ~/devops-lab/scripts/check-file.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
FILE="${1:-$HOME/devops-lab/app/config/app.conf}"
if [[ -f "$FILE" ]]; then
  echo "OK: file exists -> $FILE"
  head -n 3 "$FILE"
elif [[ -d "$FILE" ]]; then
  echo "It is a directory, not a file -> $FILE"
  exit 2
else
  echo "ERROR: file not found -> $FILE" >&2
  exit 1
fi
EOF
chmod +x ~/devops-lab/scripts/check-file.sh
~/devops-lab/scripts/check-file.sh; echo "exit=$?"
~/devops-lab/scripts/check-file.sh /tmp/no-such-file; echo "exit=$?"
~/devops-lab/scripts/check-file.sh /tmp; echo "exit=$?"
```

**Verification:**
- Existing file: content ki pehli 3 lines + `exit=0`.
- Missing file: error `stderr` pe + `exit=1`.
- Directory: message + `exit=2`.

**Note:** `[[ -f ]]` file, `[[ -d ]]` directory, `[[ -x ]]` executable. `>&2` error ko stderr pe bhejta hai — logging aur CI ke liye important.

---

## Task 46: Loops

**Scenario:** Multiple log files scan karni hain — har file ka naam aur line count print karo.

**Command plan:**
```bash
mkdir -p ~/devops-lab/logs
printf 'INFO one\nERROR db\n' > ~/devops-lab/logs/app.log
printf 'WARN disk\nINFO ok\n' > ~/devops-lab/logs/system.log
cat > ~/devops-lab/scripts/loop-logs.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob
for file in "$HOME"/devops-lab/logs/*.log; do
  lines=$(wc -l < "$file")
  errors=$(grep -c "ERROR" "$file" || true)
  echo "$(basename "$file"): lines=$lines errors=$errors"
done
EOF
chmod +x ~/devops-lab/scripts/loop-logs.sh
~/devops-lab/scripts/loop-logs.sh
```

**Verification:**
- Har `.log` file ke liye ek line print ho.
- `app.log` ke liye `lines=2 errors=1`, `system.log` ke liye `errors=0`.
- Koi file na ho to loop silently skip ho (nullglob), error na de.

**Note:** `for f in *` glob use karo, `ls` output parse mat karo. `grep -c` zero matches pe exit 1 deta hai — `|| true` se script nahi rukta.

---

## Task 47: Functions and Exit Codes

**Scenario:** Service healthy hai ya nahi — reusable function banao jo success/failure status return kare, aur caller exit code handle kare.

**Command plan:**
```bash
cat > ~/devops-lab/scripts/functions-exit.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

check_service() {
  local svc="$1"
  if systemctl is-active --quiet "$svc"; then
    echo "UP: $svc"
    return 0
  else
    echo "DOWN: $svc"
    return 1
  fi
}

main() {
  local failed=0
  for svc in ssh nginx; do
    check_service "$svc" || failed=1
  done
  return "$failed"
}

if main; then
  echo "overall_exit=0"
else
  echo "overall_exit=$?"
fi
EOF
chmod +x ~/devops-lab/scripts/functions-exit.sh
~/devops-lab/scripts/functions-exit.sh
```

**Verification:**
- `ssh` ke liye `UP:` (installed ho to).
- `nginx` installed ho to `UP:`, warna `DOWN:`.
- Koi bhi down ho to `overall_exit=1`, sab up ho to `0`.

**Note:** `return` function se value/status deta hai; `exit` poora script band karta hai. `local` variables ko function ke andar rakhta hai. `set -e` ke saath `check_service || failed=1` failure ko handle karta hai.

---

## Task 48: Error Handling and Logging

**Scenario:** Script ko production jaisa banao — strict mode, errors ka log, aur failure pe clear exit code. Output terminal + file dono me jaye.

**Command plan:**
```bash
cat > ~/devops-lab/scripts/safe-copy.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
LOG_FILE="$HOME/devops-lab/logs/safe-copy.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="[$(date -Is)] $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

trap 'log "ERROR: command failed at line $LINENO (exit=$?)"' ERR

SRC="${1:-}"
DEST="${2:-}"
[[ -n "$SRC" ]] || { log "ERROR: source argument missing"; exit 2; }
[[ -f "$SRC" ]] || { log "ERROR: source not found -> $SRC"; exit 3; }

log "Copying $SRC -> $DEST"
mkdir -p "$DEST"
cp "$SRC" "$DEST"/
log "SUCCESS: copied $(basename "$SRC")"
EOF
chmod +x ~/devops-lab/scripts/safe-copy.sh
~/devops-lab/scripts/safe-copy.sh ~/devops-lab/logs/app.log ~/devops-lab/backups; echo "exit=$?"
~/devops-lab/scripts/safe-copy.sh /tmp/no-such-file ~/devops-lab/backups; echo "exit=$?"
tail -n 5 ~/devops-lab/logs/safe-copy.log
```

**Verification:**
- Success case: `SUCCESS: copied app.log`, `exit=0`, file backup folder me ho.
- Missing source: `ERROR: source not found`, `exit=3`.
- Log file me timestamp ke saath dono entries hon.

**Note:** `trap ... ERR` unexpected failure log karta hai. Expected errors ke liye explicit check + `exit N` better hai. Secrets ko log mat karo.

---

## Task 49: Schedule a Cron Job

**Scenario:** Health report har 5 minute me automatically chale. Cron schedule banao aur verify karo — bina existing crontab udaaye.

**Command plan:**
```bash
systemctl is-active cron
mkdir -p ~/devops-lab/logs
chmod +x ~/devops-lab/scripts/health-report.sh
crontab -l 2>/dev/null || true
(
  crontab -l 2>/dev/null || true
  echo "*/5 * * * * $HOME/devops-lab/scripts/health-report.sh >> $HOME/devops-lab/logs/cron.log 2>&1"
) | crontab -
crontab -l
sudo systemctl status cron --no-pager | head -n 5
```

**Verification:**
- `crontab -l` me `*/5 * * * *` wali line dikhe.
- Purani entries preserve rahein (overwrite nahi hui).
- `cron` service active ho.
- 5-10 min baad `~/devops-lab/notes/` me naya report aur `logs/cron.log` me output ho.

**Note:** Cron ka environment minimal hota hai — script/command ke absolute paths use karo, `$HOME` cron me set ho sakta hai par safe rehne ke liye full path likho. Cleanup: `crontab -e` se line hatao; `crontab -r` poora crontab delete karta hai (mat use karo bina soche).

---

## Task 50: Server Health Script

**Scenario:** Ek job-ready health script banao jo CPU, memory, disk, aur services check kare; threshold cross ho to warning de aur non-zero exit kare (monitoring/CI me use ho sake).

**Command plan:**
```bash
cat > ~/devops-lab/scripts/server-health.sh <<'EOF'
#!/usr/bin/env bash
set -uo pipefail

DISK_THRESHOLD="${DISK_THRESHOLD:-80}"
MEM_THRESHOLD="${MEM_THRESHOLD:-90}"
SERVICES="${SERVICES:-ssh nginx}"
failed=0

echo "=== Server Health: $(hostname) @ $(date -Is) ==="

load=$(awk '{print $1}' /proc/loadavg)
cpus=$(nproc)
echo "Load(1m)=$load CPUs=$cpus"

mem_used=$(free | awk '/^Mem:/ {printf "%d", $3/$2*100}')
echo "Memory used=${mem_used}%"
if (( mem_used >= MEM_THRESHOLD )); then
  echo "WARN: memory above ${MEM_THRESHOLD}%"; failed=1
fi

disk_used=$(df / | awk 'NR==2 {gsub("%","",$5); print $5}')
echo "Disk used=${disk_used}%"
if (( disk_used >= DISK_THRESHOLD )); then
  echo "WARN: disk above ${DISK_THRESHOLD}%"; failed=1
fi

for svc in $SERVICES; do
  state=$(systemctl is-active "$svc" 2>/dev/null || true)
  echo "Service $svc=$state"
  [[ "$state" == "active" ]] || failed=1
done

if (( failed == 0 )); then
  echo "RESULT: HEALTHY"
else
  echo "RESULT: ATTENTION REQUIRED"
fi
exit "$failed"
EOF
chmod +x ~/devops-lab/scripts/server-health.sh
DISK_THRESHOLD=1 ~/devops-lab/scripts/server-health.sh; echo "exit=$?"
~/devops-lab/scripts/server-health.sh; echo "exit=$?"
```

**Verification:**
- Normal run me `RESULT: HEALTHY` aur `exit=0` (agar services up hain).
- `DISK_THRESHOLD=1` run me disk warning + `exit=1`.
- Output me load, memory %, disk %, aur har service ka state ho.

**Note:** ye script cron/CI/monitoring se call kar sakte ho. Real production me thresholds environment se lo, aur alerting ke liye exit code + log use karo. `set -e` intentionally nahi hai — hume saare checks chalane hain.

---

## Module 7 Done — Checklist

- [ ] First script + shebang + executable banaya.
- [ ] Positional arguments aur defaults use kiye.
- [ ] `if/elif/else` se file existence check ki.
- [ ] `for` loop se multiple files process kiye.
- [ ] Function + return/exit code use kiya.
- [ ] `set -euo pipefail` + logging + trap lagaya.
- [ ] Cron job safely install/verify kiya.
- [ ] CPU/mem/disk/service health script banaya.

**Next:** [Module 8 — Deployment Projects](module-08-deployment-projects.md)
