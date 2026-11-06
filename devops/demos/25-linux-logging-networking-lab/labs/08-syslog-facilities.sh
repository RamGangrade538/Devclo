#!/usr/bin/env bash
# Lab 08 - Traditional syslog: files, facilities, severities, rsyslog rules.
# Run:  bash labs/08-syslog-facilities.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 08 - Syslog (rsyslog, /var/log files, facilities & severities)"

step "8.1 Kaunse syslog files hain?"
cmd bash -c "ls -lh /var/log/*.log 2>/dev/null | head -12"
note "syslog/messages = sab kuch · auth.log = login/sudo · kern.log = kernel · cron.log = cron"

step "8.2 rsyslog chal raha hai?"
cmd bash -c "systemctl is-active rsyslog 2>/dev/null || echo 'rsyslog not running'"
cmd bash -c "grep -vE '^\s*#|^\s*$' /etc/rsyslog.conf | head -15"
note "Ye sirf READ hai - company ka config kabhi modify nahi hota."

step "8.3 Facility aur Severity ka concept"
cat <<'EOF'
  Facility = 'kaunsa subsystem' bhej raha hai
    0 kern   1 user   2 mail   3 daemon   4 auth   5 syslog
    6 lpr    7 news   8 uucp   9 cron   10 authpriv  11 ftp
    16-23 local0 .. local7     <-- custom apps yahan use karte hain

  Severity = 'kitna serious' (0 = sabse serious)
    0 emerg  1 alert  2 crit  3 err  4 warning  5 notice  6 info  7 debug

  Format: <PRI>TIMESTAMP HOSTNAME TAG[PID]: MESSAGE
  PRI = facility*8 + severity   (local0.info = 16*8+6 = 134)
EOF

step "8.4 Apni facility (local0) se entry likho"
cmd logger -p local0.info -t lab-course "lab: local0.info entry"
cmd logger -p local0.warning -t lab-course "lab: local0.warning entry"
cmd logger -p local0.err -t lab-course "lab: local0.err entry"
note "logger -p local0.info = facility local0 + severity info."

step "8.5 Usi entry ko 3 jagah dhoondo (journal / syslog file / our file)"
cmd bash -c "journalctl -t lab-course -o cat --no-pager | tail -3"
cmd bash -c "grep 'lab-course' /var/log/syslog 2>/dev/null | tail -3 || echo '/var/log/syslog not readable'"
cmd bash -c "grep 'lab-course' /var/log/kern.log 2>/dev/null | tail -2 || echo 'not in kern.log'"

step "8.6 Apni syslog file me likho (app-specific log, best practice)"
mkdir -p "$LOG_DIR"
RULE_FILE="$LAB_WORK/rsyslog-lab.conf"
cat > "$RULE_FILE" <<EOF
# Apni app ke logs alag file me (production me yehi pattern hai)
local0.*    $LOG_DIR/lab-app.log
EOF
cmd bash -c "cat $RULE_FILE"
note "Ye rule system me apply nahi kiya gaya - sirf concept dikhane ke liye."
note "Production me: /etc/rsyslog.d/50-lab.conf me likh kar 'systemctl restart rsyslog'."

step "8.7 Apna application log file banao (rotation ke liye tayyar)"
cmd bash -c "python3 $LAB_DIR/apps/logapp.py --lines 25 --file $LOG_DIR/lab-app.log --json $LOG_DIR/lab-app.json"
cmd bash -c "head -3 $LOG_DIR/lab-app.log"
cmd bash -c "head -1 $LOG_DIR/lab-app.json | python3 -m json.tool | head -12"

step "8.8 Syslog file me live dekhna (tail -f) - 6 second demo"
( tail -f /var/log/syslog 2>/dev/null > "$LAB_WORK/syslog_follow.txt" & echo $! > "$LAB_WORK/syslog_follow.pid" )
sleep 1
logger -p local0.info -t lab-course "live syslog line 1"
logger -p local0.info -t lab-course "live syslog line 2"
sleep 2
kill "$(cat "$LAB_WORK/syslog_follow.pid")" 2>/dev/null
cmd bash -c "grep 'lab-course' $LAB_WORK/syslog_follow.txt | tail -3"
note "tail -f = naye lines aate hi dikhaata hai. Ctrl+C se niklna."

step "8.9 grep/awk se level-wise counting (log analysis ka base)"
cmd bash -c "awk '{print \$2}' $LOG_DIR/lab-app.log | sort | uniq -c | sort -rn"
note "lab-app.log ka format: <ts> <LEVEL> <service> <msg>"

step "8.10 Auth log - kaun login hua (security use case)"
cmd bash -c "grep -E 'Accepted|Failed|session opened' /var/log/auth.log 2>/dev/null | tail -5 || echo 'auth.log not readable (sudo chahiye)'"
note "Security audits me auth.log ka 'Failed password' count top 10 IPs nikala jaata hai."

step "8.11 dmesg - kernel ring buffer"
cmd bash -c "dmesg 2>/dev/null | tail -5 || echo 'dmesg restricted (sudo chahiye)'"
note "dmesg = kernel messages. OOM kills, disk errors, NIC link down - sab yahan."

step "8.12 Journal vs Syslog file - kab kaunsa?"
cat <<'EOF'
  journalctl  = live, structured, filter-friendly, rotation automatic, per-user
  /var/log/*  = archive, grep-friendly, rsyslog rules se route, long-term, ship karna easy
  dmesg       = kernel only, ring buffer (boot tak ka, memory me)

  Production rule of thumb:
    App ka log file (JSON) -> Filebeat/Fluent Bit se central collector
    System logs (auth/syslog) -> rsyslog remote rule se central collector
    Journald -> live debugging + journalctl queries
EOF

cat <<'EOF'

NOTES:
  logger -p local0.info -t TAG "msg"   = facility.severity + tag
  logger -f file.log "msg"              = message file se bhejo
  logger -n host -P 514 "msg"           = remote syslog server (agla lab!)
  logger -n host -P 514 -T "msg"        = same but TCP
  /etc/rsyslog.d/*.conf                 = extra rules (company me touch mat karo)
  tail -f /var/log/syslog               = live follow
  grep -c 'Failed password' auth.log    = security counting
  dmesg | tail                          = kernel ring buffer

  Dono systems ek hi entry kaise bante hain?
    app -> logger -> /dev/log -> rsyslog -> (a) /var/log/syslog  (b) journald
    Isi liye journal me bhi dikhta hai aur syslog file me bhi.
EOF
