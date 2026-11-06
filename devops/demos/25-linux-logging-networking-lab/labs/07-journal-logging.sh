#!/usr/bin/env bash
# Lab 07 - systemd-journald: writing and querying the structured log.
# Run:  bash labs/07-journal-logging.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 07 - journald / journalctl (systemd ka structured log)"

step "7.1 Journald zinda hai?"
cmd bash -c "systemctl is-active systemd-journald 2>/dev/null || echo 'journald not running'"
cmd bash -c "journalctl -n 2 --no-pager 2>&1 | tail -3"

step "7.2 Apna pehla entry likho - logger (syslog se journal tak)"
cmd logger -p user.info -t lab-course "Day-1 lab: first journal entry"
cmd systemd-cat -t lab-course echo "Day-1 lab: entry via systemd-cat (direct journal)"
note "logger = /dev/log se rsyslog tak. systemd-cat = seedha journald tak."

step "7.3 Tag se filter (sirf apne entries)"
cmd journalctl -t lab-course --no-pager -n 10

step "7.4 Priority se filter (sirf warnings+)"
cmd logger -p user.warning -t lab-course "disk usage 85% - warning"
cmd logger -p user.err -t lab-course "db connection failed - error"
cmd bash -c "journalctl -t lab-course -p warning --no-pager -o short-iso | tail -4"
note "Tag + priority dono saath filter karna sabse precise hai."
note "Clock skew notice: kabhi-kabhi purane boot ki entries nayi dikhti hain - timestamp aur 'now' me farak = NTP/clock issue. Isi liye --since use karo."

step "7.5 Severity levels ka hierarchy (0..7)"
cat <<'EOF'
  0 emerg    1 alert    2 crit     3 err
  4 warning  5 notice   6 info     7 debug
  journalctl -p err     = sirf 0..3 (error aur usse bade)
  journalctl -p warning = 0..4
  journalctl -p info     = 0..6
  journalctl -p debug    = sab
EOF

step "7.6 Time filters"
cmd bash -c "journalctl --since '10 minutes ago' --no-pager | tail -5"
cmd bash -c "journalctl --since '1 hour ago' --until '30 minutes ago' --no-pager | tail -5"
cmd bash -c "journalctl --since today --no-pager | wc -l"

step "7.7 Unit / process se filter"
cmd bash -c "journalctl -u ssh -n 3 --no-pager 2>&1 | tail -4"
cmd bash -c "journalctl _PID=\$\$ --no-pager -n 3 2>&1 | tail -4"
note "_PID / _UID / _COMM = journal ke extra fields (structured metadata)."

step "7.8 Structured output - JSON me dekho (yehi ELK me jaata hai)"
cmd bash -c "journalctl -t lab-course -o json-pretty --no-pager -n 1"

step "7.9 Output formats"
cmd bash -c "journalctl -t lab-course -o short-iso --no-pager -n 3"
cmd bash -c "journalctl -t lab-course -o cat --no-pager -n 3"
note "short = human friendly · cat = sirf message · json = machine ke liye (ELK/filebeat)."

step "7.10 Live follow (real-time monitoring) - 8 second ka demo"
( journalctl -t lab-course -f --no-pager > "$LAB_WORK/journal_follow.txt" 2>&1 & echo $! > "$LAB_WORK/journal_follow.pid" )
sleep 1
logger -p user.info -t lab-course "live entry 1"
logger -p user.info -t lab-course "live entry 2"
sleep 2
kill "$(cat "$LAB_WORK/journal_follow.pid")" 2>/dev/null
cmd bash -c "tail -5 $LAB_WORK/journal_follow.txt"
note "journalctl -f = tail -f for system logs. Live incident dekhte waqt yehi chalta hai."

step "7.11 Journal ki health - kitni jagah bhari hai?"
cmd bash -c "journalctl --disk-usage"
cmd bash -c "journalctl --list-boots | tail -3"
note "--disk-usage = space used. --vacuum-size=200M se trim kar sakte ho (root chahiye)."

step "7.12 Ek 'application' ka service-level logging (systemd-cat + unit)"
cmd bash -c "systemd-cat -t payment-service echo 'payment order_id=42 status=failed reason=timeout'"
cmd bash -c "systemd-cat -t payment-service echo 'payment order_id=43 status=ok'"
cmd bash -c "journalctl -t payment-service -o cat --no-pager -n 5"
note "Production me har service apna tag use karti hai - filter karna easy hota hai."

step "7.13 Real service ka journal (systemd units)"
cmd bash -c "journalctl -u systemd-journald --no-pager -n 3 2>&1 | tail -4"
cmd bash -c "journalctl --since today -p err --no-pager | tail -8"
note "Real incidents: pehle yahi dekha jaata hai - 'aaj system me kya errors aaye'."

cat <<'EOF'

NOTES:
  logger -p user.info -t TAG "msg"   = syslog style entry
  systemd-cat -t TAG echo "msg"      = seedha journal
  journalctl -t TAG                   = tag filter
  journalctl -p err                   = priority filter (0..3)
  journalctl --since "1 hour ago"    = time window
  journalctl -u UNIT                  = unit ka log
  journalctl _PID=1234                = metadata field se filter
  journalctl -f                       = follow (live)
  journalctl -o json-pretty           = structured (ELK/filebeat yahi padhta hai)
  journalctl --disk-usage             = kitna space liya
  journalctl --vacuum-size=200M       = trim (root)

  journald vs syslog:
    journald = binary, structured, indexed, per-user, rotation automatic
    syslog   = text files, grep-friendly, long-term storage, rsyslog rules
    Production me dono: journald (live/debug) + syslog file (ship/archive)
EOF
