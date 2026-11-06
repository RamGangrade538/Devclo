#!/usr/bin/env bash
# Lab 09 - Centralized logging: app namespace ships logs over the network to a
#          syslog collector (rsyslog) - the mini version of ELK/Beats.
# Run:  bash labs/09-central-logging.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs

if [ "${LAB_NS:-}" != "1" ]; then
  exec env LAB_NS=1 unshare --user --map-root-user --net --mount bash -c '
    mount --make-rprivate / 2>/dev/null
    mount -t tmpfs tmpfs /run 2>/dev/null
    ip link set lo up
    exec bash "$0" "$@"
  ' "$0" "$@"
fi

banner_lab
section "Lab 09 - Centralized Logging (syslog shipper + collector)"

COLLECT="$CENTRAL_DIR/collector.log"
CONF="$CENTRAL_DIR/rsyslog-collector.conf"
mkdir -p "$CENTRAL_DIR"
rm -f "$COLLECT"

step "9.1 Collector config banao (rsyslog = syslog server)"
cat > "$CONF" <<EOF
global(workDirectory="$CENTRAL_DIR")
module(load="imudp")
module(load="imtcp")
input(type="imudp" port="5514" address="0.0.0.0")
input(type="imtcp" port="5515" address="0.0.0.0")
template(name="LabFmt" type="string"
        string="COLLECTED %TIMESTAMP% host=%HOSTNAME% tag=%syslogtag% %msg%\\n")
action(type="omfile" file="$COLLECT" template="LabFmt")
EOF
cmd bash -c "cat $CONF"

step "9.2 Collector start karo (UDP 5514 + TCP 5515)"
rsyslogd -n -f "$CONF" -i "$CENTRAL_DIR/rsyslog.pid" > "$CENTRAL_DIR/rsyslog.out" 2>&1 &
RSYS=$!
sleep 2
cmd bash -c "ss -ulnp 'sport = :5514'; ss -tlnp 'sport = :5515'"

step "9.3 Apna 'app server' namespace banao (10.20.0.2) aur usse bridge se jodo"
APP_PID=""
unshare -n sleep 900 >/dev/null 2>&1 &
APP_PID=$!
sleep 0.3
cmd bash -c "
ip link add br0 type bridge
ip addr add 10.20.0.1/24 dev br0
ip link set br0 up
ip link add app0 type veth peer name app1
ip link set app0 master br0
ip link set app0 up
ip link set app1 netns $APP_PID
nsenter -t $APP_PID -n ip link set lo up
nsenter -t $APP_PID -n ip addr add 10.20.0.2/24 dev app1
nsenter -t $APP_PID -n ip link set app1 up
nsenter -t $APP_PID -n ip route add default via 10.20.0.1
"
ok "app namespace pid=$APP_PID"

step "9.4 App namespace se collector tak ping (network up hai?)"
cmd bash -c "nsenter -t $APP_PID -n ping -c 2 -W 2 10.20.0.1"

step "9.5 UDP ship - logger se remote syslog"
cmd bash -c "nsenter -t $APP_PID -n logger -n 10.20.0.1 -P 5514 -p local0.info -t payment-service 'order 42 shipped via UDP'"
sleep 1
cmd bash -c "cat $COLLECT"

step "9.6 TCP ship - logger se remote syslog (reliable)"
cmd bash -c "nsenter -t $APP_PID -n logger -n 10.20.0.1 -P 5515 -T -p local0.warning -t payment-service 'order 43 slow, shipped via TCP'"
sleep 1
cmd bash -c "cat $COLLECT"

step "9.7 Apna app se structured JSON logs ship karo (real-world pattern)"
cmd bash -c "nsenter -t $APP_PID -n python3 $LAB_DIR/apps/logapp.py --lines 12 --ship 10.20.0.1 --port 5515 --proto tcp --service payment"
sleep 1
cmd bash -c "tail -3 $COLLECT"

step "9.8 Collector me kya kya aaya - quick stats"
cmd bash -c "wc -l < $COLLECT | xargs echo 'total lines:'"
cmd bash -c "grep -c 'order 42' $COLLECT | xargs echo 'order 42 entries:'"
cmd bash -c "grep -o 'tag=[^ ]*' $COLLECT | sort | uniq -c | sort -rn"

step "9.9 JSON payload me se field nikaalo (structured logs ka faayda)"
cmd bash -c "grep -o '{.*}' $COLLECT | head -2 | python3 -c '
import sys, json
for line in sys.stdin:
    ev = json.loads(line)
    print(\"%-6s %-9s %s\" % (ev[\"level\"], ev[\"service\"], ev[\"msg\"]))
'"

step "9.10 UDP vs TCP - kaunsa kab? (production me TCP/RELP use karo)"
cat <<'EOF'
  UDP (5514) : fast, no guarantee. 1 packet lost = wo log gayab. VPN/DMZ me common.
  TCP (5514/5515): reliable, ordered, thoda slow. Production me yahi default.
  RELP : TCP + ack/retry - best, thoda extra config.

  Security: plain syslog = plaintext (koi bhi beech me padh sakta hai).
    Production: TLS (rsyslog gtls module), ya VPN/专线, ya syslog over TLS port 6514.

  Logs me KABHI secrets mat likho: password, token, card number, PII.
EOF

step "9.11 Production-grade rsyslog config (concept)"
cat <<'EOF'
  # /etc/rsyslog.d/10-remote.conf  (server side = collector)
  module(load="imtcp")
  input(type="imtcp" port="6514" StreamDriver.Name="gtls"
        StreamDriver.Mode="1" StreamDriver.AuthMode="x509/name"
        StreamDriver.PermittedPeers="10.20.0.0/24")
  action(type="omfwd" target="siem.company.com" port="6514" protocol="tcp")

  # client side = shipper (har app server)
  module(load="omfwd")
  action(type="omfwd" target="collector.company.com" port="6514"
         protocol="tcp"
         Template="ForwardFormat"
         action.resumeRetryCount="-1"
         queue.type="LinkedList"
         queue.filename="fwdQueue")   # <-- disk queue: collector down ho to bhi logs safe
EOF

step "9.12 Cleanup"
kill "$APP_PID" 2>/dev/null
kill "$RSYS" 2>/dev/null
sleep 1
ok "app namespace + collector stopped"
note "Collected logs save rahe hain: $COLLECT"

cat <<'EOF'

NOTES:
  logger -n <collector> -P 5514 "msg"   = UDP ship
  logger -n <collector> -P 5515 -T "msg" = TCP ship
  rsyslogd -n -f <conf> -i <pidfile>     = foreground collector (lab me)
  module(load="imtcp") / (load="imudp")  = receivers
  action(type="omfile" file=...)          = likho file me
  action(type="omfwd" target=...)         = doosre server me bhejo (relay)

  Real ELK me same concept:
    app -> Filebeat/Fluent Bit (shipper) -> Logstash (parse) -> Elasticsearch -> Kibana
    yahan:  app -> syslog/TCP -> rsyslog (collector) -> collector.log

  Disk queue = production ka must-have (collector down, logs buffer me safe).
EOF
