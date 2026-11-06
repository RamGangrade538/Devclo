#!/usr/bin/env bash
# Lab 02 - Ports, sockets and the four TCP states.
# Run:  bash labs/02-ports-and-sockets.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

APP="$LAB_DIR/apps/httpapp.py"
PORT="${LAB_PORT:-$(pick_port)}"
ACCESS="$LOG_DIR/access.log"
APPLOG="$LOG_DIR/app.log"
READY="$LAB_WORK/app.ready"

section "Lab 02 - Ports & Sockets (ss, TCP states, UDP)"

step "2.1 Start ek real HTTP service (port $PORT) with logging on"
rm -f "$READY"
python3 "$APP" --host 127.0.0.1 --port $PORT --access-log "$ACCESS" --app-log "$APPLOG" --ready-file "$READY" >"$LAB_WORK/app.out" 2>&1 &
APP_PID=$!
for _ in $(seq 1 40); do [ -f "$READY" ] && break; sleep 0.1; done
ok "app running (pid $APP_PID) - ready file: $READY"
note "logs: $ACCESS  |  $APPLOG"

step "2.2 LISTEN sockets - kaun kaunse ports pe sun raha hai"
cmd bash -c "ss -tlnp | head -15"
note "'t' = TCP, 'l' = listening, 'n' = numeric (no DNS lookup), 'p' = process."
note "Poora list dekhne ke liye: ss -tlnp   (is machine pe bohot services chal rahe hain)"

step "2.3 Sirf hamare app ka port filter karo"
cmd ss -tlnp "sport = :$PORT"

step "2.4 Request bhejo aur phir ESTABLISHED socket dekho"
( curl -s "http://127.0.0.1:$PORT/slow?ms=3000" >/dev/null & ) &
sleep 1
cmd ss -tnp state established "( sport = :$PORT or dport = :$PORT )"
note "connection tab 'ESTAB' dikhta hai jab tak response nahi aata."

step "2.5 Connection ke baad - CLOSE_WAIT / TIME_WAIT samjho"
sleep 3
cmd ss -tan state time-wait | head -5
note "TIME_WAIT = client ne band kiya, server ko 2MSL wait karna hai (RFC 1122)."

step "2.6 Socket states ka summary (kitne kis state me)"
cmd ss -s

step "2.7 UDP socket (connectionless - koi state machine nahi)"
python3 -c "
import socket
s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.bind(('127.0.0.1',18081))
print('UDP listener bound on 127.0.0.1:18081')
input()
" >/dev/null 2>&1 &
UDP_PID=$!
sleep 1
cmd ss -ulnp "sport = :18081"
kill $UDP_PID 2>/dev/null

step "2.8 Raw kernel table - /proc/net/tcp (hex port decode karo)"
cmd bash -c "head -3 /proc/net/tcp | awk '{print \$2, \$3, \$4}'"
note "ports hex me hote hain: 18080 decimal = 46A0 hex."

step "2.9 Netstat style view (ss -tlnpe = extra columns)"
cmd ss -tlnpe

step "2.10 Cleanup"
kill_pid $APP_PID
ok "app stopped"

cat <<'EOF'

NOTES:
  ss -tlnp              = TCP listening + kaun process
  ss -tan state established   = live connections
  ss -s                  = socket statistics summary
  ss -ulnp               = UDP listeners (UDP me connection state nahi hota)
  /proc/net/tcp         = kernel ka raw table (hex ports)

  TCP 4 states:
    LISTEN      = server sun raha hai (accept queue me connections)
    ESTABLISHED = dono taraf data flow ho raha hai
    TIME_WAIT   = local side ne band kiya (short wait, port reuse ke liye)
    CLOSE_WAIT  = remote band kar chuka, humne abhi nahi kiya (leak ka sign!)

  Port checklist (yaad rakho):
    20/21 FTP · 22 SSH · 25 SMTP · 53 DNS · 80 HTTP · 443 HTTPS
    3306 MySQL · 5432 Postgres · 6379 Redis · 8080/9090 app ports
EOF
