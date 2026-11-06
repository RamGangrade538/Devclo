# Lab 09: Deployment Scripts & Automation Basics

## Objective
Write a safe Bash deployment script with variables, checks, logging, and proper permissions.

## Prerequisites
Completed Labs 01-08. Work in `~/linux-labs/scripts/`

## Concepts to know
- Shebang `#!/usr/bin/env bash`
- Variables
- `if [ -d ... ]` checks
- `mkdir -p`, `cp`, `chmod`
- Logging with `echo` + timestamps
- `set -e` (exit on error) use carefully
- Script must be executable

## Step-by-step commands
```bash
cd ~/linux-labs/scripts

# Create a simple deployment script
cat > deploy_app.sh << 'EOF'
#!/usr/bin/env bash

# Simple safe deployment script for lab
APP_NAME="demo-app"
SRC_DIR="$HOME/linux-labs/deployment/src"
DEST_DIR="$HOME/linux-labs/deployment/$APP_NAME"
LOG_DIR="$HOME/linux-labs/logs"
LOG_FILE="$LOG_DIR/deploy_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$DEST_DIR" "$LOG_DIR"

echo "[$(date)] Starting deployment of $APP_NAME" | tee -a "$LOG_FILE"

if [ ! -d "$SRC_DIR" ]; then
  echo "[$(date)] ERROR: Source dir $SRC_DIR does not exist" | tee -a "$LOG_FILE"
  echo "[$(date)] Creating sample source..." | tee -a "$LOG_FILE"
  mkdir -p "$SRC_DIR"
  echo "<h1>Demo App Deployed</h1>" > "$SRC_DIR/index.html"
  echo "console.log('Demo App');" > "$SRC_DIR/app.js"
fi

echo "[$(date)] Copying files..." | tee -a "$LOG_FILE"
cp -v "$SRC_DIR"/* "$DEST_DIR"/ 2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] Setting permissions..." | tee -a "$LOG_FILE"
find "$DEST_DIR" -type f -name "*.sh" -exec chmod 700 {} \;
find "$DEST_DIR" -type f ! -name "*.sh" -exec chmod 644 {} \;
find "$DEST_DIR" -type d -exec chmod 755 {} \;

echo "[$(date)] Deployment completed. Files in $DEST_DIR" | tee -a "$LOG_FILE"
ls -lh "$DEST_DIR" | tee -a "$LOG_FILE"
echo "[$(date)] Log: $LOG_FILE" | tee -a "$LOG_FILE"
EOF

# Make executable for owner only (safe)
chmod 700 deploy_app.sh

# Run script
./deploy_app.sh

# Check logs
ls -lh ~/linux-labs/logs/
cat ~/linux-labs/logs/deploy_*.log | tail -30
```

## Command explanations (Hinglish)
| Part | Explanation |
|---|---|
| `#!/usr/bin/env bash` | Shebang — script kis shell se run hoga batata hai. |
| `VAR="value"` | Variable assign (spaces around = nahi hone chahiye). |
| `$VAR` | Variable expand. |
| `mkdir -p` | Safe create. |
| `if [ ! -d "$SRC_DIR" ]; then ... fi` | Condition check. |
| `tee -a` | Output screen + file me append karta hai. |
| `cp -v` | Verbose copy. |
| `find ... -exec chmod ... \;` | Har matched file par command run karta hai. |
| `chmod 700` | Only owner can read/write/execute. |
| `date +%Y%m%d_%H%M%S` | Timestamp for unique log names. |
| `./script.sh` | Current directory se run (needs execute permission). |

## Expected output
Script creates dirs, copies files, sets permissions, shows log file path.

## Verification & Troubleshooting
- **Permission denied:** `chmod 700 deploy_app.sh` then run
- **"command not found":** Check shebang and run with `bash deploy_app.sh` as fallback
- **No files copied:** Check `~/linux-labs/deployment/src/` exists (script creates if missing)

## Real-world DevOps/Azure use case
Automate artifact copy to release dir, set correct perms, log deployments on Linux app servers/VMs.

## Practice tasks
1. Modify script to count files copied and log count
2. Add check: if source empty, log warning
3. Make a backup copy of script to `~/linux-labs/scripts/backup/`

**Solutions idea:**
```bash
mkdir -p ~/linux-labs/scripts/backup
cp deploy_app.sh ~/linux-labs/scripts/backup/
```
For counting: use `find "$DEST_DIR" -type f | wc -l` and log it.
