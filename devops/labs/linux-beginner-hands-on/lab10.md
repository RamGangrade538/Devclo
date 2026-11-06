# Lab 10: Application Deployment (Mini-Project)

## Objective
Deploy a simple sample app using a Bash script, set appropriate permissions, generate logs, and simulate `systemctl` style service management (safe lab version).

## Prerequisites
Labs 01-09 complete. Work in `~/linux-labs/deployment/`

## What we'll build
A tiny static app (`index.html`, `app.js`) deployed by script with proper perms, logged, and managed by a helper script mimicking start/stop/status.

> We will **not** modify real system services. We use user-space helpers in `~/linux-labs/`.

## Step-by-step commands

### 1) Create app source
```bash
cd ~/linux-labs/deployment
mkdir -p src
cat > src/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Linux Labs Demo App</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>Deployed via Linux Hands-On Labs</h1>
  <p>This is a safe lab deployment demo.</p>
  <script src="app.js"></script>
</body>
</html>
EOF

cat > src/app.js << 'EOF'
// Demo app
console.log("Demo app loaded successfully");
EOF

cat > src/README.md << 'EOF'
Demo app for Linux labs
EOF

ls -lh src/
```

### 2) Create deployment script
```bash
cat > ~/linux-labs/scripts/deploy_full.sh << 'EOF'
#!/usr/bin/env bash
APP="webapp"
SRC="$HOME/linux-labs/deployment/src"
DEST="$HOME/linux-labs/deployment/releases/$(date +%Y%m%d_%H%M%S)_$APP"
LOG="$HOME/linux-labs/logs/deploy_full_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$DEST" "$HOME/linux-labs/deployment/releases" "$HOME/linux-labs/logs"

echo "[$(date)] DEPLOY START app=$APP" | tee -a "$LOG"
cp -rv "$SRC"/* "$DEST"/ 2>&1 | tee -a "$LOG"
# Set perms
find "$DEST" -type f -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.md" | xargs -r chmod 644
find "$DEST" -type d | xargs -r chmod 755
echo "[$(date)] PERMS APPLIED" | tee -a "$LOG"
ln -sfn "$DEST" "$HOME/linux-labs/deployment/current"
echo "[$(date)] SYMLINK UPDATED: current -> $DEST" | tee -a "$LOG"
echo "[$(date)] DEPLOY DONE" | tee -a "$LOG"
ls -la "$HOME/linux-labs/deployment/current" | tee -a "$LOG"
EOF
chmod 700 ~/linux-labs/scripts/deploy_full.sh
~/linux-labs/scripts/deploy_full.sh
```

### 3) Create a service-like helper (mimics systemctl idea)
```bash
cat > ~/linux-labs/scripts/webappctl.sh << 'EOF'
#!/usr/bin/env bash
ACTION="$1"
PIDFILE="$HOME/linux-labs/deployment/webapp.pid"
LOGF="$HOME/linux-labs/logs/webapp.log"
DOCROOT="$HOME/linux-labs/deployment/current"

case "$ACTION" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Already running (PID $(cat $PIDFILE))"
      exit 0
    fi
    echo "Starting webapp (python3 http.server on 8081)"
    (cd "$DOCROOT" && python3 -m http.server 8081 >> "$LOGF" 2>&1 & echo $! > "$PIDFILE")
    sleep 2
    echo "Started. PID $(cat $PIDFILE). URL: http://127.0.0.1:8081"
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "RUNNING PID $(cat $PIDFILE)"
    else
      echo "NOT RUNNING"
    fi
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      kill $(cat "$PIDFILE") 2>/dev/null && rm -f "$PIDFILE"
      echo "Stopped"
    else
      echo "Not running"
    fi
    ;;
  logs)
    tail -n 20 "$LOGF" 2>/dev/null || echo "No logs yet"
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    ;;
esac
EOF
chmod 700 ~/linux-labs/scripts/webappctl.sh
```

### 4) Run and test
```bash
# Start app
~/linux-labs/scripts/webappctl.sh start

# Check status
~/linux-labs/scripts/webappctl.sh status

# Check logs
~/linux-labs/scripts/webappctl.sh logs

# Test from curl
curl -s http://127.0.0.1:8081/ | head -5

# Stop
~/linux-labs/scripts/webappctl.sh stop
~/linux-labs/scripts/webappctl.sh status
```

## Command explanations (Hinglish)
| Concept | Explanation |
|---|---|
| Releases pattern | `releases/<timestamp>_app/` rakho, `current` symlink point karo (easy rollback) |
| `ln -sfn` | Symlink force update (`-f`) without following issues (`-n`) |
| `python3 -m http.server` | Quick local web server for testing (lab only) |
| PID file | Process ID save karke start/stop/status track karte hain |
| `kill -0 PID` | Process exist/check karta hai (actually kill nahi karta) |
| `systemctl` idea | Production me `systemctl start/stop/status` use hota hai — yahan mimic kiya |

> **Note:** `systemctl` modify karne ki zaroorat nahi hai. Ye helper sirf concept samjhane ke liye hai.

## Expected output
Deployment creates timestamped release, updates `current` symlink, app runs on 8081, curl returns HTML.

## Verification & Troubleshooting
- **Port already in use:** `ss -tlnp | grep 8081` then stop old process or use different port
- **curl connection refused:** Check app started, wait 2s
- **Permission issues:** Ensure scripts are `700`, files `644`
- **Symlink wrong:** `ls -la ~/linux-labs/deployment/current`

## Real-world DevOps/Azure use case
Blue/green or simple releases with symlink (`current`), logging, permissions — common pattern. On Azure VMs use real `systemd` units for production services.

## Practice tasks (with solutions)
1. Deploy again and see new release folder created
2. Check `ls -la deployment/current` points to latest
3. View deploy log and webapp log
4. Write a small rollback note: how would you point `current` to older release?

**Solutions:**
```bash
~/linux-labs/scripts/deploy_full.sh
ls -lt ~/linux-labs/deployment/releases/ | head -3
ls -la ~/linux-labs/deployment/current
ls -lh ~/linux-labs/logs/deploy_full_* | tail -2
# rollback idea: ln -sfn <older-release-path> ~/linux-labs/deployment/current
```
