# Module 8 — Deployment Projects

> **Hinglish:** Ab tak ke sab skills ko jodkar ek real deployment banao: directory layout, sample app, deploy script, least-privilege ownership, systemd service, aur rollback. Ye module interview me "tumne deploy kaise kiya?" ka jawab banega.

**Prerequisite:** Modules 1-7 complete. Ubuntu VM + `sudo`.
**Safety:** `/srv/devclo-app` lab ke liye hai; kisi aur app ki directory mat use karo. Service port `8080` use karega.

**Setup:**
```bash
sudo mkdir -p /srv/devclo-app/{app,config,logs,scripts,releases}
sudo chown -R "$USER":"$USER" /srv/devclo-app
mkdir -p ~/devops-lab/notes
```

---

## Task 51: Application Directory Layout

**Scenario:** Deployment ke liye production-style layout banao: code, config, logs, scripts, aur versioned releases alag. Isse rollback aur debugging easy hoti hai.

**Command plan:**
```bash
sudo mkdir -p /srv/devclo-app/{app,config,logs,scripts,releases}
sudo chown -R "$USER":"$USER" /srv/devclo-app
cd /srv/devclo-app
find . -maxdepth 2 -type d | sort
ls -ld app config logs scripts releases
```

**Verification:**
- Paanch directories exist karein: `app`, `config`, `logs`, `scripts`, `releases`.
- `ls -ld` me owner tumhara user ho (task 54 me badlega).
- `releases/` abhi khaali ho.

**Note:** `current` symlink baad me latest release ko point karega. Isse service ka path fix rehta hai aur rollback sirf symlink change ban jata hai.

---

## Task 52: Create a Sample App

**Scenario:** Ek chhota HTTP app banao jo response de. Shell script Python ke built-in web server ko wrap karegi — port aur static files configurable.

**Command plan:**
```bash
cd /srv/devclo-app/app
cat > index.html <<'EOF'
<!doctype html>
<html><head><title>DevClo App</title></head>
<body><h1>DevClo sample app is running</h1><p>Version: v1.0.0</p></body></html>
EOF
cat > app.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-8080}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")" && pwd)}"
echo "DevClo app starting: dir=$APP_DIR port=$PORT"
exec python3 -m http.server "$PORT" --directory "$APP_DIR"
EOF
chmod +x app.sh
PORT=8081 ./app.sh >/tmp/devclo-app-test.log 2>&1 &
TEST_PID=$!
sleep 1
curl -sS http://localhost:8081/ | head -n 5
kill -TERM "$TEST_PID"
cat /tmp/devclo-app-test.log
```

**Verification:**
- `curl` HTML me "DevClo sample app is running" dikhaye.
- Script log me `dir=/srv/devclo-app/app port=8081` ho.
- `kill` ke baad port 8081 free ho (`ss -tlnp | grep 8081` khaali).

**Note:** `exec` se Python shell script ki jagah leta hai — systemd ko correct PID milta hai. App state-less hai; logs journal me jayenge.

---

## Task 53: Write a Deployment Script

**Scenario:** Naya release deploy karna automate karo: version argument, release directory copy, `current` symlink update, aur deployment log. Script ko sudo se chalao.

**Command plan:**
```bash
cat > /srv/devclo-app/scripts/deploy.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:?usage: deploy.sh <version>}"
BASE="/srv/devclo-app"
SRC="$BASE/app"
REL="$BASE/releases/$VERSION"

[[ -d "$SRC" ]] || { echo "ERROR: app source missing" >&2; exit 2; }
mkdir -p "$REL"
cp -a "$SRC"/. "$REL"/
ln -sfn "$REL" "$BASE/current"
chown -R devcloapp:devcloapp "$REL" 2>/dev/null || true
echo "$(date -Is) deployed version=$VERSION release=$REL" | tee -a "$BASE/logs/deploy.log"
readlink -f "$BASE/current"
EOF
chmod +x /srv/devclo-app/scripts/deploy.sh
sudo /srv/devclo-app/scripts/deploy.sh v1.0.0
ls -l /srv/devclo-app/current
cat /srv/devclo-app/logs/deploy.log
```

**Verification:**
- `/srv/devclo-app/releases/v1.0.0/` me `app.sh` + `index.html` hon.
- `current` symlink `releases/v1.0.0` ko point kare.
- `deploy.log` me timestamp + version ho.

**Note:** Same version dobara deploy karo to existing release overwrite hoga. Production me immutable releases (`v1.0.0-<git-sha>`) better hain. `cp -a` permissions/timestamps preserve karta hai.

---

## Task 54: Apply Least-Privilege Ownership

**Scenario:** Service ko root ki zaroorat nahi. Ek dedicated system user `devcloapp` banao; app read-only ho, logs sirf required access ke saath.

**Command plan:**
```bash
id devcloapp 2>/dev/null || sudo useradd --system --user-group --home-dir /srv/devclo-app --shell /usr/sbin/nologin devcloapp
sudo chown -R devcloapp:devcloapp /srv/devclo-app/app /srv/devclo-app/releases
sudo chown root:devcloapp /srv/devclo-app/config /srv/devclo-app/scripts
sudo chown -R root:devcloapp /srv/devclo-app/logs
sudo chmod 750 /srv/devclo-app /srv/devclo-app/app /srv/devclo-app/releases /srv/devclo-app/config /srv/devclo-app/scripts
sudo chmod 770 /srv/devclo-app/logs
sudo chmod 640 /srv/devclo-app/app/index.html
sudo chmod 750 /srv/devclo-app/app/app.sh /srv/devclo-app/scripts/deploy.sh
sudo find /srv/devclo-app -maxdepth 2 -printf '%M %u:%g %p\n' | sort
id devcloapp
```

**Verification:**
- `id devcloapp` system user dikhaye (`nologin` shell).
- App files owner `devcloapp`, config/scripts `root:devcloapp`.
- `index.html` mode `640`, `app.sh`/`deploy.sh` `750`.
- `/srv/devclo-app` `750` — sirf owner/group traverse kar sake.

**Note:** Service user ko root-owned script chalane ki zaroorat nahi; sirf read/execute chahiye. `chmod 777` se isolation khatam ho jata hai. Deploy script ab `sudo` se chalega.

---

## Task 55: Create a systemd App Service

**Scenario:** Sample app ko systemd se run karo — dedicated user, fixed working directory, auto-restart. Boot pe start ho.

**Command plan:**
```bash
sudo systemctl stop devclo-app 2>/dev/null || true
sudo tee /etc/systemd/system/devclo-app.service >/dev/null <<'EOF'
[Unit]
Description=DevClo Sample Application
After=network.target

[Service]
Type=simple
User=devcloapp
Group=devcloapp
WorkingDirectory=/srv/devclo-app/current
Environment=PORT=8080
Environment=APP_DIR=/srv/devclo-app/current
ExecStart=/srv/devclo-app/current/app.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now devclo-app
systemctl status devclo-app --no-pager
curl -sS http://localhost:8080/ | head -n 5
sudo journalctl -u devclo-app -n 15 --no-pager
```

**Verification:**
- Service `active (running)` aur `Enabled: yes`.
- `curl localhost:8080` HTML response de.
- Journal me `DevClo app starting` line ho.
- `ss -tlnp | grep 8080` me python/app process ho.

**Troubleshoot:** `status=203/EXEC` = path/executable issue. `status=200/CHDIR` = `WorkingDirectory` access issue. `Permission denied` = parent dirs me `x` check karo (`namei -l /srv/devclo-app/current/app.sh`). Port busy = `ss -tlnp | grep 8080`.

---

## Task 56: Verify and Roll Back

**Scenario:** v1.0.1 deploy karo, verify karo, phir problem aane pe v1.0.0 pe rollback karo — bina code badle, sirf symlink + restart.

**Command plan:**
```bash
sudo sed -i 's/Version: v1.0.0/Version: v1.0.1/' /srv/devclo-app/app/index.html
sudo /srv/devclo-app/scripts/deploy.sh v1.0.1
sudo systemctl restart devclo-app
sleep 1
curl -sS http://localhost:8080/ | grep 'Version:'
sudo journalctl -u devclo-app -n 5 --no-pager
```
**Rollback:**
```bash
sudo ln -sfn /srv/devclo-app/releases/v1.0.0 /srv/devclo-app/current
sudo systemctl restart devclo-app
sleep 1
curl -sS http://localhost:8080/ | grep 'Version:'
readlink -f /srv/devclo-app/current
sudo journalctl -u devclo-app -n 5 --no-pager
```

**Verification:**
- Deploy ke baad curl `Version: v1.0.1` dikhaye.
- Rollback ke baad curl `Version: v1.0.0` dikhaye.
- `readlink -f current` correct release path bataye.
- Service dono baar `active (running)` rahe.

**Note:** Rollback tabhi kaam karta hai jab purana release directory preserved ho. Real production me deploys immutable rakho, smoke test ke baad traffic badhao, aur rollback ko runbook me likho.

---

## Module 8 Done — Checklist

- [ ] Production-style directory layout banaya.
- [ ] Sample HTTP app create aur test kiya.
- [ ] Versioned deploy script likha.
- [ ] Dedicated service user + least-privilege ownership lagaya.
- [ ] systemd app service banaya aur verify kiya.
- [ ] Deploy + rollback successfully kiya.

**Next:** [Module 9 — Git and GitHub](module-09-git-github.md)
