#!/usr/bin/env bash
# Lab 05 - Firewalls: iptables inside a private namespace + host ufw (read-only).
# Run:  bash labs/05-firewall-rules.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 05 - Firewall (iptables in namespace, ufw on host)"

step "5.1 Host ka firewall status (READ-ONLY - kuch change nahi hota)"
if command -v ufw >/dev/null 2>&1; then
  if need_root; then
    cmd ufw status verbose
  else
    cmd bash -c "ufw status verbose 2>&1 | head -3"
    note "Full output ke liye: sudo ufw status verbose"
  fi
fi

step "5.2 iptables ki current chains (namespace me - safe)"
if unshare --user --map-root-user --net --mount bash -c \
   'mount -t tmpfs tmpfs /run 2>/dev/null; iptables -L -n -v' >/dev/null 2>&1; then
  cmd bash -c "unshare --user --map-root-user --net --mount bash -c 'mount -t tmpfs tmpfs /run 2>/dev/null; iptables -L -n -v | head -12'"
  ok "iptables namespace me available"
else
  warn "iptables namespace me nahi chal raha - is part ko skip karo"
fi

step "5.3 Apna firewall demo: ek 'fake server' aur uspe 2 rules (namespace me - host firewall touch nahi hota)"
cmd bash -c "$(cat <<'EOS'
unshare --user --map-root-user --net --mount bash -c '
mount -t tmpfs tmpfs /run 2>/dev/null
ip link set lo up
PORT=18099
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
echo "--- baseline: request chal rahi hai?"
curl -sS -m 3 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/
echo "--- rule add: block port $PORT"
iptables -A INPUT -p tcp --dport $PORT -j DROP
iptables -L -n -v | grep -E "Chain INPUT|dpt:" | head -5
echo "--- ab request kya hota hai? (timeout = DROP)"
curl -sS -m 4 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/ ; echo "curl_exit=$?"
echo "--- counters: kitne packets drop hue"
iptables -L -n -v | grep -E "dpt:" | head -3
echo "--- rule delete karo -> traffic wapas"
iptables -D INPUT -p tcp --dport $PORT -j DROP
curl -sS -m 3 -o /dev/null -w "http_code=%{http_code}\n" http://127.0.0.1:$PORT/
kill $SRV 2>/dev/null
'
EOS
)"

step "5.4 Rule order ka matlab (chain me pehla match jeetta hai)"
cmd bash -c "unshare --user --map-root-user --net --mount bash -c 'mount -t tmpfs tmpfs /run 2>/dev/null; iptables -A INPUT -p tcp --dport 19999 -j ACCEPT; iptables -A INPUT -p tcp --dport 19999 -j DROP; iptables -L -n -v --line-numbers | head -10'"

step "5.5 Host iptables rules dekhna (read-only, root chahiye)"
if need_root; then
  cmd bash -c "iptables -L -n -v | head -15"
  cmd bash -c "iptables -L -n -v | grep -i drop | head -10"
  note "Deny all + allow ssh = typical default posture. Apne host pe ye mat badlo."
else
  warn "Root nahi hai - skip. Command: sudo iptables -L -n -v"
fi

step "5.6 ufw rules ka concept (apply mat karo - company system hai)"
cat <<'EOF'

UFW COMMAND CHEAT SHEET (sirf padhne ke liye - apply karna aapki marzi):
  sudo ufw status verbose          # rules + default policy
  sudo ufw allow 22/tcp           # SSH (HAMESHA pehle - warna lock ho jaoge)
  sudo ufw allow 80/tcp 443/tcp    # web
  sudo ufw deny 3306/tcp          # DB bahar se band
  sudo ufw enable                  # firewall ON
  sudo ufw reload                  # rules reload

  ORDER OF OPERATIONS (production rule):
    1) ufw allow 22/tcp    2) ufw allow 80,443/tcp    3) ufw enable
    SSH ko pehle kholna = apne aap ko bahar se lock nahi hona.

  Docker note: ufw ke saath docker ke iptables rules ko bypass kar sakte hain -
  production me DOCKER-USER chain dekho.
EOF

cat <<'EOF'

NOTES:
  iptables -A INPUT -p tcp --dport 8080 -j DROP   = rule add (append)
  iptables -D INPUT ...                           = rule delete
  iptables -L -n -v                               = list + counters (kitne packets)
  iptables -I INPUT 1 ...                         = insert at top (priority)
  -n = numeric (no DNS) · -v = verbose counters

  3 aksar: ACCEPT (jaane de) · DROP ( chup-chaap phenko ) · REJECT (ICMP bhejke batao)
  Production me: default DROP + explicit ACCEPT (least privilege).

  Failure signatures:
    connection refused (exit 7) = port band / service nahi chal raha
    timeout (exit 28)          = firewall DROP ya blackhole route
    "no route to host"         = L3 route hi nahi hai
EOF
