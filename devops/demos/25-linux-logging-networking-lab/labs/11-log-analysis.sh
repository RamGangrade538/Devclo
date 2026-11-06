#!/usr/bin/env bash
# Lab 11 - Log analysis: from raw lines to an incident report.
# Run:  bash labs/11-log-analysis.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

JSON="$LOG_DIR/app-events.json"
TXT="$LOG_DIR/app-events.log"
ACCESS="$LOG_DIR/access.log"
PORT_HTTP="$(pick_port)"

section "Lab 11 - Log Analysis (grep / awk / python)"

step "11.1 Realistic logs generate karo (structured + text + access log)"
rm -f "$JSON" "$TXT" "$ACCESS"
cmd bash -c "python3 $LAB_DIR/apps/logapp.py --lines 500 --file $TXT --json $JSON"
cmd bash -c "python3 $LAB_DIR/apps/httpapp.py --host 127.0.0.1 --port $PORT_HTTP --access-log $ACCESS --app-log $JSON & sleep 1
for i in \$(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:$PORT_HTTP/; curl -s -o /dev/null http://127.0.0.1:$PORT_HTTP/status/500; done
kill %1 2>/dev/null" 2>/dev/null || true
note "access log (nginx/combined style) + JSON event log dono ready hain."

step "11.2 Quick grep - kitne ERROR?"
cmd bash -c "grep -c ERROR $TXT"
cmd bash -c "grep -c '\"level\": \"ERROR\"' $JSON"

step "11.3 Level-wise counting (awk + sort + uniq)"
cmd bash -c "awk '{print \$2}' $TXT | sort | uniq -c | sort -rn"

step "11.4 Error rate %"
cmd bash -c "awk '{if (\$2==\"ERROR\") e++} END{printf \"errors=%d total=%d error_rate=%.2f%%\\n\", e, NR, 100*e/NR}' $TXT"

step "11.5 Service-wise error breakdown (jo service sabse zyada fail ho rahi hai)"
cmd bash -c "grep ERROR $TXT | awk '{print \$3}' | sort | uniq -c | sort -rn"

step "11.6 Top client IPs (access log se)"
cmd bash -c "awk '{print \$1}' $ACCESS | sort | uniq -c | sort -rn | head -5"
note "Real me yehi 'top talker' analysis DDoS/bandwidth abuse pakadta hai."

step "11.7 Status code distribution (nginx style)"
cmd bash -c "awk '{print \$9}' $ACCESS | sort | uniq -c | sort -rn | head -6"

step "11.8 Slow requests (access log se, >1ms dikha raha hai)"
cmd bash -c "awk '{gsub(/ms/,\"\",\$NF); if (\$NF+0 > 1) print \$NF\"ms \"\$7\" \"\$9}' $ACCESS | sort -rn | head -5"
note "JSON log me duration_ms field directly hota hai - structured logs me filter karna aasan."

step "11.9 Trace ID se puri journey nikalo (correlation)"
TRACE=$(grep -m1 ERROR "$JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['trace_id'])")
note "trace_id = $TRACE"
cmd bash -c "grep '$TRACE' $JSON | python3 -c '
import sys, json
for line in sys.stdin:
    e = json.loads(line)
    print(\"%-6s %-9s %-14s %s\" % (e[\"level\"], e[\"service\"], e[\"path\"], e[\"msg\"]))
'"
note "Yahi Kibana me 'trace_id search' karke karte hain - pichla din ka topic."

step "11.10 Time window - sirf last 10 minute ke errors"
cmd bash -c "journalctl -p err --since '10 minutes ago' --no-pager | tail -5"

step "11.11 Full analyzer report (python)"
cmd bash -c "python3 $LAB_DIR/apps/loganalyze.py $JSON"

step "11.12 Live alerting pattern: tail -f + grep + count"
( tail -f "$JSON" 2>/dev/null | grep --line-buffered '\"ERROR\"' > "$LAB_WORK/live_errors.txt" & echo $! > "$LAB_WORK/live.pid" )
sleep 1
python3 "$LAB_DIR/apps/logapp.py" --lines 8 --json "$JSON" --level ERROR --service payment >/dev/null
sleep 1
kill "$(cat "$LAB_WORK/live.pid")" 2>/dev/null
cmd bash -c "wc -l < $LAB_WORK/live_errors.txt | xargs echo 'live errors captured:'"
note "Real me isi pattern ko 'promtail/promtail alerts' ya 'filebeat -> elastic alert' me use karte hain."

step "11.13 Log-level filter ka standard set (jab koi 'kuch to galat hai' bole)"
cat <<'EOF'
  grep -i "error\|fatal\|panic"      = level + keyword
  grep -v "^$" | sort | uniq -c        = duplicate spam detection
  awk '{print $NF}' | sort -u           = distinct last fields
  grep -c "Failed password" auth.log   = security counter
  cut -d' ' -f1 | sort | uniq -c       = per-minute/per-hour volume
  jq/grep '"level":"ERROR"'            = structured filter (jq nahi hua to python)
EOF

cat <<'EOF'

NOTES:
  grep -c "ERROR" file            = kitni lines match
  grep -n "ERROR" file            = line number ke saath
  grep -v PATTERN                 = exclude
  awk '{print $2}' | sort | uniq -c | sort -rn   = frequency table
  awk '$NF+0 > 2000'               = numeric filter (thoda advanced)
  tail -f file | grep --line-buffered PATTERN   = live filter
  jq '.level' file.json            = structured (jq install nahi hua to python3 -m json.tool)

  Real ELK me ye sab Kibana me dashboard/alert ban jata hai:
    "ERROR count per 5 min > 20" -> PagerDuty/Slack alert
EOF
