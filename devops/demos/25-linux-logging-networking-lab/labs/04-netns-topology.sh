#!/usr/bin/env bash
# Lab 04 - Network namespaces: build a real 3-tier topology by hand.
#   client ns  ->  hub ns (bridge)  ->  router ns  ->  server ns (HTTP app)
# No root needed: unshare gives us a private user+net namespace (CAP_NET_ADMIN).
# Run:  bash labs/04-netns-topology.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs

# Re-exec ourselves inside a private (user + net + mount) namespace.
if [ "${LAB_NS:-}" != "1" ]; then
  exec env LAB_NS=1 unshare --user --map-root-user --net --mount bash -c '
    mount --make-rprivate / 2>/dev/null
    mount -t tmpfs tmpfs /run 2>/dev/null
    ip link set lo up
    exec bash "$0" "$@"
  ' "$0" "$@"
fi

banner_lab
section "Lab 04 - Network Namespaces (apna network khud banao)"

NS_PIDS=()
cleanup() {
  for p in "${NS_PIDS[@]:-}"; do kill "$p" 2>/dev/null; done
}
trap cleanup EXIT

nsx() { local pid=$1; shift; nsenter -t "$pid" -n "$@"; }
new_ns() {  # $1 = label -> echoes PID
  local pid
  unshare -n sleep 900 >/dev/null 2>&1 &
  pid=$!
  NS_PIDS+=("$pid")
  sleep 0.3
  echo "$pid"
}

step "4.1 Ye script ab ek PRIVATE network namespace me chal raha hai"
cmd ip -br addr
note "sirf 'lo' dikh raha hai - humne apna alag network stack bana liya."

step "4.2 Namespaces banao: client, router, server"
CLI_PID=$(new_ns client)
RTR_PID=$(new_ns router)
SRV_PID=$(new_ns server)
ok "client ns pid=$CLI_PID | router ns pid=$RTR_PID | server ns pid=$SRV_PID"

step "4.3 Hub me bridge banao aur IP do"
cmd bash -c "ip link add br0 type bridge && ip addr add 10.10.0.1/24 dev br0 && ip link set br0 up && ip -br addr show br0"
note "bridge = software switch. Isi bridge se 3 'wires' (veth) nikalenge."

step "4.4 veth pairs (virtual cables) banao aur bridge se jodo"
cmd bash -c "
set -e
ip link add c0 type veth peer name c1
ip link set c0 master br0
ip link set c0 up
ip link set c1 netns $CLI_PID

ip link add r0 type veth peer name r1
ip link set r0 master br0
ip link set r0 up
ip link set r1 netns $RTR_PID

ip link add r2 type veth peer name s0
ip link set r2 netns $RTR_PID
ip link set s0 netns $SRV_PID
echo 'veth pairs created'
"

step "4.5 Namespaces ko IP do (client / router / server)"
cmd bash -c "
set -e
nsenter -t $CLI_PID -n ip link set lo up
nsenter -t $CLI_PID -n ip addr add 10.10.0.10/24 dev c1
nsenter -t $CLI_PID -n ip link set c1 up

nsenter -t $RTR_PID -n ip link set lo up
nsenter -t $RTR_PID -n ip addr add 10.10.0.30/24 dev r1
nsenter -t $RTR_PID -n ip link set r1 up
nsenter -t $RTR_PID -n ip addr add 10.10.1.1/24 dev r2
nsenter -t $RTR_PID -n ip link set r2 up

nsenter -t $SRV_PID -n ip link set lo up
nsenter -t $SRV_PID -n ip addr add 10.10.1.20/24 dev s0
nsenter -t $SRV_PID -n ip link set s0 up
echo 'IP assignment done'
"

step "4.6 Router ko 'do-doori' bananao (IP forwarding) + routes"
cmd bash -c "
nsenter -t $RTR_PID -n sysctl -w net.ipv4.ip_forward=1
nsenter -t $CLI_PID -n ip route add default via 10.10.0.1
nsenter -t $CLI_PID -n ip route add 10.10.1.0/24 via 10.10.0.30
nsenter -t $SRV_PID -n ip route add default via 10.10.1.1
sysctl -w net.ipv4.ip_forward=1
ip route add 10.10.1.0/24 via 10.10.0.30
echo 'forwarding + routes done'
"

step "4.7 Har namespace ka apna view dekho (alag alag networks!)"
cmd bash -c "echo '### CLIENT'; nsenter -t $CLI_PID -n ip -br addr; nsenter -t $CLI_PID -n ip route"
cmd bash -c "echo '### ROUTER'; nsenter -t $RTR_PID -n ip -br addr; nsenter -t $RTR_PID -n ip route"
cmd bash -c "echo '### SERVER'; nsenter -t $SRV_PID -n ip -br addr; nsenter -t $SRV_PID -n ip route"

step "4.8 Layer 3 reachability: client -> router -> server"
cmd bash -c "nsenter -t $CLI_PID -n ping -c 2 -W 2 10.10.0.30"
cmd bash -c "nsenter -t $CLI_PID -n ping -c 2 -W 2 10.10.1.20"
note "client ne server ko 2 hops door kiya - yehi 'routing' hai."

step "4.9 Server namespace me HTTP app chalao (10.10.1.20:8080)"
nsenter -t "$SRV_PID" -n python3 "$LAB_DIR/apps/httpapp.py" \
  --host 10.10.1.20 --port 8080 \
  --access-log "$LOG_DIR/access.log" --app-log "$LOG_DIR/app.log" \
  >"$LAB_WORK/app_ns.out" 2>&1 &
sleep 1.5
cmd bash -c "nsenter -t $SRV_PID -n ss -tlnp 'sport = :8080'"

step "4.10 CLIENT se server ko call karo - full network path se"
cmd bash -c "nsenter -t $CLI_PID -n curl -sS -w '\nhttp_code=%{http_code} total=%{time_total}s\n' http://10.10.1.20:8080/health"

step "4.11 Server ne apni access log me likha (namespace ke andar ka log)"
cmd bash -c "tail -3 $LOG_DIR/access.log"
note "server ko client ka IP '10.10.0.10' dikha - proof ki traffic sach me us route se aaya."

step "4.12 Path dikhao - traceroute se hops"
cmd bash -c "nsenter -t $CLI_PID -n traceroute -n -m 5 10.10.1.20"

step "4.13 Firewall test: server ne client ko block kiya"
cmd bash -c "nsenter -t $SRV_PID -n iptables -A INPUT -s 10.10.0.10 -j DROP && echo 'rule: DROP from 10.10.0.10 added'"
cmd bash -c "time nsenter -t $CLI_PID -n curl -sS -m 4 -o /dev/null -w 'http_code=%{http_code}\n' http://10.10.1.20:8080/health"
note "timeout (exit 28) = packets blackhole ho rahe hain. Connection refused nahi hua - firewall ne drop kiya."
cmd bash -c "nsenter -t $SRV_PID -n iptables -D INPUT -s 10.10.0.10 -j DROP && echo 'rule removed'"
cmd bash -c "nsenter -t $CLI_PID -n curl -sS -m 4 -o /dev/null -w 'http_code=%{http_code}\n' http://10.10.1.20:8080/health"
ok "rule hatate hi traffic wapas aaya - firewall hi wajah thi."

step "4.14 Cleanup"
cleanup
ok "namespaces stopped"

cat <<'EOF'

NOTES:
  unshare --user --map-root-user --net  = apna private network stack (root ki zaroorat nahi)
  ip link add X type veth peer name Y   = virtual ethernet cable (2 endpoints)
  ip link add br0 type bridge           = software switch (L2)
  ip link set X master br0              = port ko bridge se jodna
  ip link set X netns <PID>             = device ko dusre namespace me bhejna
  nsenter -t <PID> -n <cmd>             = us namespace me command chalana
  sysctl -w net.ipv4.ip_forward=1       = router banana (packets aage bhejo)
  ip route add ... via <gw>              = static route (next hop)

  Real world mapping:
    namespace        -> container / pod / VM
    veth pair        -> container ka virtual NIC
    bridge           -> host ka docker0 / CNI bridge
    ip_forward=1     -> node ka kube-proxy / router role
    iptables in ns   -> network policy / security group

  Debug order yaad rakho:
    ip -br addr (IP?) -> ip route (route?) -> ping (L3) -> ss (port?)
    -> curl -v (L7) -> iptables (blocked?)
EOF
