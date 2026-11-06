#!/usr/bin/env bash
# Lab 12 - Incident drill: "site is down" - jaan-boojhkar 4 alag failure modes
#          diagnose karna hai, har baar SAME playbook follow karna hai.
# Run:  bash labs/12-troubleshoot-drill.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

APP="$LAB_DIR/apps/httpapp.py"
section "Lab 12 - Incident Drill ('site down' - 4 rounds, 1 playbook)"

cat <<'EOF'

THE PLAYBOOK (har round me isi order me jao):
  1. DNS       -> dig / getent        (naam hi resolve ho raha hai?)
  2. REACHABLE -> ping / ip route     (host tak pahunch rahe ho?)
  3. PORT      -> ss -tlnp            (service sun rahi hai?)
  4. APP       -> curl -v / curl -w   (protocol level pe kya hota hai?)
  5. FIREWALL  -> iptables/ufw        (block to nahi?)
  6. LOGS      -> journalctl / app log (kya hua exactly?)
  Failure signature se seedha guess:
     exit 7  (refused) = service down / wrong port
     exit 28 (timeout)  = firewall DROP / blackhole route
     NXDOMAIN           = DNS problem
     502/504            = app ya upstream problem
EOF

# ---------------------------------------------------------------- Round 1
section "ROUND 1 - Service galat port pe chal rahi hai (config error)"
PORT_OK="$(pick_port)"; PORT_BAD="$(pick_port)"
python3 "$APP" --host 127.0.0.1 --port "$PORT_OK" --access-log "$LOG_DIR/access.log" --app-log "$LOG_DIR/app.log" >/dev/null 2>&1 &
R1_PID=$!
sleep 1.5
step "Customer report: 'app is down'"
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT_BAD/ ; echo curl_exit=\$?"
step "1) DNS layer (localhost - skip)  2) Reachability"
cmd bash -c "ping -c 2 -W 2 127.0.0.1 | tail -2"
step "3) Port check - kaun sun raha hai?"
cmd bash -c "ss -tlnp | grep -E ':($PORT_OK|$PORT_BAD)\b'"
ok "ROOT CAUSE: service $PORT_OK pe hai, client $PORT_BAD pe jaa raha hai (config mismatch)"
step "Fix: sahi port use karo"
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT_OK/health"
kill_pid $R1_PID

# ---------------------------------------------------------------- Round 2
section "ROUND 2 - Service crash ho gayi (process dead)"
PORT2="$(pick_port)"
python3 "$APP" --host 127.0.0.1 --port "$PORT2" --access-log "$LOG_DIR/access.log" --app-log "$LOG_DIR/app.log" >/dev/null 2>&1 &
R2_PID=$!
sleep 1.5
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT2/health"
step "Ab app ko crash karte hain (simulated)"
kill -9 $R2_PID 2>/dev/null
systemd-cat -t lab-app echo "app process died unexpectedly (SIGKILL simulated) - restarting"
sleep 1
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT2/ ; echo curl_exit=\$?"
step "3) Port check - ab koi nahi sun raha"
cmd bash -c "ss -tlnp | grep -E ':$PORT2\b' || echo 'nothing listening on $PORT2'"
step "6) LOGS - kya bola?"
cmd bash -c "journalctl -t lab-app -o cat --no-pager | tail -3"
ok "ROOT CAUSE: process dead tha (port open nahi) - logs me crash entry mili"
step "Fix: app restart"
python3 "$APP" --host 127.0.0.1 --port "$PORT2" --access-log "$LOG_DIR/access.log" --app-log "$LOG_DIR/app.log" >/dev/null 2>&1 &
R2B_PID=$!
sleep 1.5
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT2/health"
kill_pid $R2B_PID

# ---------------------------------------------------------------- Round 3
section "ROUND 3 - DNS hi galat hai (NXDOMAIN)"
step "1) DNS layer - naam resolve hota hai ya nahi?"
cmd bash -c "dig app.company.invalid +noall +comments +answer | head -6"
cmd bash -c "getent hosts app.company.invalid || echo 'getent: no such host'"
step "2) Service to chal rahi hai (proof)"
PORT3="$(pick_port)"
python3 "$APP" --host 127.0.0.1 --port "$PORT3" >/dev/null 2>&1 &
R3_PID=$!
sleep 1.5
cmd bash -c "curl -sS -m 3 -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:$PORT3/health"
step "DNS bypass karke same call (curl --resolve = host ko IP se map karo)"
cmd bash -c "curl -sS -m 3 --resolve app.company.test:$PORT3:127.0.0.1 -o /dev/null -w 'http_code=%{http_code}\n' http://app.company.test:$PORT3/health"
ok "ROOT CAUSE: app theek hai, DNS resolve nahi ho raha (NXDOMAIN = naam exist nahi karta, SERVFAIL = resolver ne upar se jawab nahi mila)"
kill_pid $R3_PID

# ---------------------------------------------------------------- Round 4
section "ROUND 4 - Firewall ne packets drop kar diye (timeout)"
cmd bash -c "$(cat <<'EOS'
unshare --user --map-root-user --net --mount bash -c '
mount -t tmpfs tmpfs /run 2>/dev/null
ip link set lo up
PORT=18088
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
echo "--- before firewall:"
curl -sS -m 3 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/
echo "--- firewall rule add (DROP):"
iptables -A INPUT -p tcp --dport $PORT -j DROP
echo "--- after firewall (timeout = DROP, refused nahi!):"
curl -sS -m 4 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/ ; echo "curl_exit=$?"
echo "--- firewall counters:"
iptables -L -n -v | grep dpt:
echo "--- fix: rule hatao"
iptables -D INPUT -p tcp --dport $PORT -j DROP
curl -sS -m 3 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/
kill $SRV 2>/dev/null
'
EOS
)"
ok "ROOT CAUSE: firewall DROP (timeout vs refused - yahi difference hai)"

section "INCIDENT REPORT template (ye copy karke use karo)"
cat <<'EOF'

  INCIDENT: <short title>
  SEVERITY: P1 / P2 / P3
  STARTED : <time>
  SCOPE   : <kaun affected - users / region / service>
  SYMPTOM : <user ne kya dekha>
  LAYERS  : DNS[ok/fail] | REACHABLE[ok/fail] | PORT[ok/fail] | APP[ok/fail] | FW[ok/fail]
  ROOT CAUSE: <ek line me>
  EVIDENCE : <journalctl/curl/iptables ka output>
  FIX     : <kya kiya>
  PREVENTION: <monitoring/alert jo isse pakadega>

  Rule: ek time me ek hypothesis test karo. "Sab kuch badal dete hain" = incident
  lambaa. Layer by layer, evidence ke saath.
EOF

cat <<'EOF'

NOTES (signature cheat sheet):
  curl exit 7  = connection refused  -> service down / wrong port / process dead
  curl exit 28 = timeout             -> firewall DROP / wrong route / no response
  curl exit 6  = could not resolve   -> DNS problem
  curl exit 35 = TLS error           -> certificate problem
  HTTP 502     -> bad gateway (upstream service down)
  HTTP 504     -> gateway timeout (upstream slow)
  HTTP 503     -> service overloaded / maintenance
  ss -tlnp empty for the port = service hi nahi chal rahi

  Journal vs app log:
    journalctl -t <service>  = service ke apne messages (start/stop/crash)
    app log file             = request-level detail (kaun, kya, kitna time)
EOF
