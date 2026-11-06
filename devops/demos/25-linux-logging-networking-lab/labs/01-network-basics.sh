#!/usr/bin/env bash
# Lab 01 - Network basics: interfaces, addresses, routes, loopback, ARP.
# Run:  bash labs/01-network-basics.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 01 - Network Basics (address, gateway, loopback, neighbours)"

step "1.1 Interfaces aur unke IPs (brief + detailed)"
cmd ip -br addr
note "short = -brief. 'lo' = loopback, 'UP' = up, yaad rakho 127.0.0.1/8 khud ke liye hai."
cmd ip addr show

step "1.2 Link state (UP/DOWN) aur MAC address"
cmd ip -br link

step "1.3 Routing table -> default gateway kaunsa hai"
cmd ip route
note "default via X.Y.Z.W = gateway. 'src' = is machine ka IP jo bahar jaata hai."

step "1.4 Default route ka interface aur source IP"
cmd ip route get 1.1.1.1
note "'ip route get' batata hai kernel kisi specific destination ke liye kaunsa path lega."

step "1.5 Loopback check (localhost = 127.0.0.1)"
cmd ping -c 3 -W 2 127.0.0.1

step "1.6 Hostname se IP (name resolution - /etc/hosts + DNS)"
cmd getent hosts example.com
cmd hostname -I
note "getent = resolver ka 'official' tarika (NSS: hosts + dns + ldap sab try karta hai)."

step "1.7 ARP / neighbour table (same LAN ke doosre machines)"
cmd ip neigh
note "ARP = IPv4 ka 'kaun kaun sa IP kis MAC ke peeche hai' book. IPv6 me iska naam NDP hai."

step "1.8 Interface counters (bytes in/out, errors, drops)"
cmd ip -s link show lo

step "1.9 External connectivity (ICMP ping)"
if ping -c 2 -W 2 1.1.1.1 >/dev/null 2>&1; then
  cmd ping -c 2 -W 2 1.1.1.1
  ok "ICMP reachability confirmed"
else
  warn "Internet ICMP blocked (common in cloud/VPN). Neeche IP-only test chalega."
fi

step "1.10 Hostname ka IP aur TCP port dono ek saath check"
cmd getent hosts example.com

cat <<'EOF'

NOTES:
  ip -br addr            = one line per interface (IP + state)
  ip addr show           = full detail (MAC, flags, MTU, netmask)
  ip route               = routing table (gateway, default route)
  ip route get <dst>     = exact path kernel will take
  ip -br link            = link layer state + MAC
  ip neigh               = ARP/NDP cache (who is where)
  ping                   = ICMP reachability (layer 3 test)
  getent hosts <name>    = resolver lookup (respects /etc/hosts first)

  Quick recap of the 4 layers you debug:
    L3 address  -> ip addr / ping      (kya machine reachable hai?)
    L4 port     -> ss / nc / curl      (service sun rahi hai?)
    L7 protocol -> curl -v / dig       (baat samajh rahi hai?)
EOF
