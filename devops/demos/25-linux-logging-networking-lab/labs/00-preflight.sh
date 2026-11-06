#!/usr/bin/env bash
# Lab 00 - Preflight: check what this machine can run before starting.
# Run:  bash labs/00-preflight.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 00 - Preflight (is machine pe kya kya chalega?)"

step "0.1 System identity"
cmd bash -c "uname -a"
cmd bash -c "cat /etc/os-release | head -3"
cmd bash -c "echo user=\$(whoami) uid=\$(id -u) groups=\$(id -Gn | tr ' ' ',')"

step "0.2 Privileges (root hain ya nahi?)"
if [ "$(id -u)" -eq 0 ]; then
  ok "root - saare labs chalenge (including raw packet capture)"
else
  note "Non-root user. Ye sab CHALEGA bina sudo ke:"
  note "  - network namespaces (unshare --user --map-root-user --net)"
  note "  - apna bridge/veth/router banana"
  note "  - iptables rules apne namespace me"
  note "  - journalctl / syslog / logrotate (apni files par)"
  note "  - apna syslog collector (high port 5514/5515)"
  warn "Ye root chahiye (skip ho jayenge ya 'sudo' se chalenge):"
  warn "  - host-level tcpdump (lab 06) -> sudo bash labs/06-packet-capture.sh"
  warn "  - ufw / iptables on the real host (lab 05b) -> sudo ufw status"
  warn "  - /var/log ke restricted logs (auth.log) -> sudo tail"
fi

step "0.3 Required commands inventory"
MISSING=0
for c in ip ss ping dig curl nc tcpdump traceroute logger journalctl \
         systemd-cat rsyslogd logrotate python3 unshare nsenter \
         iptables ufw lsof dmesg; do
  if command -v "$c" >/dev/null 2>&1; then
    printf '    %-14s %s\n' "$c" "$(command -v "$c")"
  else
    printf '    %-14s %s\n' "$c" "MISSING"
    MISSING=$((MISSING + 1))
  fi
done
note "$MISSING command(s) missing - unavailability se lab gracefully skip hota hai."

step "0.4 Can we create private network namespaces (lab 04 ka dil)?"
if unshare --user --map-root-user --net true 2>/dev/null; then
  ok "unshare + netns allowed"
  if unshare --user --map-root-user --net --mount bash -c \
       'mount -t tmpfs tmpfs /run 2>/dev/null; iptables -L -n >/dev/null 2>&1 && echo iptables_ok || echo iptables_fail' \
       2>/dev/null | grep -q iptables_ok; then
    ok "namespace ke andar iptables bhi chalega (firewall lab)"
  else
    warn "namespace ke andar iptables nahi chal raha (lab 05 ka firewall part skip hoga)"
  fi
else
  warn "unshare allowed nahi hai - lab 04 skip hoga (corporate policy ho sakti hai)"
fi

step "0.5 Journald / syslog ki health"
cmd bash -c "systemctl is-active systemd-journald 2>/dev/null || echo 'journald unit inactive'"
cmd bash -c "journalctl -n 1 --no-pager 2>&1 | tail -2"
cmd bash -c "systemctl is-active rsyslog 2>/dev/null || echo 'rsyslog inactive'"

step "0.6 Syslog files - kya readable hai?"
cmd bash -c "ls -l /var/log/syslog /var/log/auth.log /var/log/kern.log 2>&1 | head -5"
cmd bash -c "grep -c . /var/log/syslog 2>/dev/null || echo 'syslog not readable by this user'"

step "0.7 Port availability (ye ports lab me use honge)"
for p in 18080 18081 5514 5515 8080; do
  if ss -tln "sport = :$p" | grep -q LISTEN; then
    warn "port $p already in use - script us port ko skip kar sakta hai"
  else
    ok "port $p free"
  fi
done

step "0.8 Internet reachability (DNS + outbound)"
if dig +short +time=2 +tries=1 example.com >/dev/null 2>&1; then
  ok "DNS working"
else
  warn "DNS nahi chal raha (corporate DNS/proxy ho sakta hai) - lab 03 ka dig part skip"
fi
if curl -sS --max-time 5 -o /dev/null https://example.com 2>/dev/null; then
  ok "HTTPS outbound working"
else
  warn "Outbound blocked / proxy required"
fi

step "0.9 Work directory"
cmd bash -c "ls -ld $LAB_WORK $LOG_DIR $CENTRAL_DIR $ROTATE_DIR"
note "Saara lab output yahan likha jaata hai - company ke system files touch nahi hote."

cat <<'EOF'

RUN ORDER (recommended):
  00-preflight.sh              -> ye file (ek baar)
  01-network-basics.sh         -> addresses, routes, loopback
  02-ports-and-sockets.sh      -> ss, TCP states, live service
  03-dns-and-http.sh           -> dig, curl, status codes
  04-netns-topology.sh         -> apna 3-tier network (namespaces)
  05-firewall-rules.sh         -> iptables + ufw
  06-packet-capture.sh         -> tcpdump + handshake analysis
  07-journal-logging.sh        -> journalctl / logger / systemd-cat
  08-syslog-facilities.sh      -> syslog files, facilities, severity
  09-central-logging.sh        -> remote syslog collector (2 namespaces)
  10-logrotate.sh              -> log rotation + compression
  11-log-analysis.sh           -> awk/grep/python log analysis
  12-troubleshoot-drill.sh     -> full "site down" incident drill
  verify.sh                    -> score card

Har lab safe hai: naya process banata hai, apne hi namespace me rehta hai,
aur apne work/ directory me files likhta hai. Company ke system config
(/etc/rsyslog.conf, /etc/logrotate.d, firewall) KABHI modify nahi hota.
EOF
