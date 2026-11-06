#!/usr/bin/env bash
# Lab 10 - Log rotation with logrotate (own config, no system changes).
# Run:  bash labs/10-logrotate.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

LOGF="$ROTATE_DIR/logs/app.log"
CONF="$ROTATE_DIR/logrotate.conf"
STATE="$ROTATE_DIR/state/logrotate.status"

section "Lab 10 - Log Rotation (logrotate)"

step "10.1 System ka logrotate config dekho (READ-ONLY)"
cmd bash -c "head -20 /etc/logrotate.conf"
cmd bash -c "ls /etc/logrotate.d | head -8"
note "Company ka config: padho, chhedho mat."

step "10.2 Apna log file + config banao"
cmd bash -c "python3 $LAB_DIR/apps/logapp.py --lines 400 --file $LOGF --json $ROTATE_DIR/logs/app.json"
cat > "$CONF" <<EOF
$LOGF {
    size 5k
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0644 $(id -un) $(id -gn)
}
EOF
cmd bash -c "cat $CONF"

step "10.3 Dry run - kya hoga bina kuch kiye? (-d = debug, no changes)"
cmd logrotate -d -f -s "$STATE" "$CONF"

step "10.4 Asli rotation chalao (-f = force)"
cmd logrotate -f -s "$STATE" "$CONF"

step "10.5 Result dekho - rotated files bani hain?"
cmd bash -c "ls -lh $ROTATE_DIR/logs/"

step "10.6 Compressed file me kya hai?"
cmd bash -c "zcat $ROTATE_DIR/logs/app.log.2.gz 2>/dev/null | head -3 || ls $ROTATE_DIR/logs/"

step "10.7 'copytruncate' vs 'create + postrotate' - dono ka fark"
cat <<'EOF'
  copytruncate : file copy karke truncate (rename nahi) - app ka file handle nahi toota
                 BUT: jo app likh raha tha, uski 1-2 lines lost ho sakti hain
                 Use when: app file handle hold karta hai (most apps)

  create + postrotate: file rename karke nayi file banao, phir app ko signal bhejo
                 (postrotate script me: systemctl reload nginx)
                 ZERO data loss - but app ko reload karna padta hai

  Production me nginx/app ke liye: create + postrotate (systemctl reload)
  Simple app logs ke liye: copytruncate
EOF

step "10.8 Signal-based rotation demo (postrotate) - apna 'service'"
cat > "$ROTATE_DIR/postrotate.sh" <<'EOS'
#!/bin/bash
echo "[postrotate] app ko HUP signal bheja gaya (reopen log file)"
EOS
chmod +x "$ROTATE_DIR/postrotate.sh"
cat > "$CONF2" <<EOF
$LOGF {
    size 5k
    rotate 2
    compress
    missingok
    notifempty
    create 0644 $(id -un) $(id -gn)
    postrotate $ROTATE_DIR/postrotate.sh
}
EOF
cmd logrotate -f -s "$STATE" "$CONF2"
cmd bash -c "ls -lh $ROTATE_DIR/logs/ | head -6"

step "10.9 'daily' + 'dateext' + 'maxsize' options"
cat > "$CONF3" <<EOF
$LOGF {
    daily
    rotate 7
    dateext
    maxsize 1M
    compress
    missingok
    notifempty
    copytruncate
}
EOF
cmd logrotate -d -f -s "$STATE" "$CONF3"
note "daily = roz rotate · maxsize = size limit override (file badi ho jaye to bhi rotate)."

step "10.10 Rotate ke baad naye logs wahi likhte hain?"
cmd bash -c "python3 $LAB_DIR/apps/logapp.py --lines 5 --file $LOGF"
cmd bash -c "tail -2 $LOGF"

step "10.11 'notifempty' proof - empty file rotate nahi hota"
: > "$ROTATE_DIR/logs/empty.log"
cat > "$CONF4" <<EOF
$ROTATE_DIR/logs/empty.log {
    size 1k
    rotate 3
    missingok
    notifempty
    copytruncate
}
EOF
cmd logrotate -f -s "$STATE" "$CONF4"
cmd bash -c "ls $ROTATE_DIR/logs/ | grep empty"
note "notifempty ke bina empty file bhi rotate ho jati - unnecessary churn."

step "10.12 Rotation ka real-world rule"
cat <<'EOF'
  size 50M / daily      = kab rotate karna
  rotate 14             = kitni purani files rakhein (2 hafte)
  compress              = gzip (disk bachta hai, CPU lagta hai)
  delaycompress         = .1 ko chhod ke compress (tools turant padh sakein)
  missingok             = file na ho to error mat do
  notifempty            = khaali file mat ghumao
  copytruncate          = app ka file handle na toota
  create 0644 user grp  = nayi file permissions
  postrotate            = app ko reload signal
  sharedscripts/postrotate - dono: script ek hi baar chale (multiple logfiles)

  STORAGE MATH:
    50MB/day * 30 days * 10 servers = 15GB uncompressed
    compress (~10x) + rotation 14 days  ->  ~500MB-1GB per server
    Isi liye retention policy + ILM zaroori hai.
EOF

cat <<'EOF'

NOTES:
  logrotate -d -f -s <state> <conf>   = dry run (kuch nahi hota, plan dikhta hai)
  logrotate -f -s <state> <conf>      = force rotation
  /etc/logrotate.d/<app>.conf         = system config (root)
  Apna test: -s <state file> + apna log path = root ke bina bhi safe test

  Rotation strategies:
    size / daily / hourly / weekly
    rotate N = N-1 purani files rakho (current file ka count alag)
    dateext  = app.log-20261022 (timestamped, collision-free)
EOF
