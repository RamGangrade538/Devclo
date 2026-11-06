#!/usr/bin/env bash
# Score card: check each lab produced the expected artifacts.
# Run:  bash verify.sh
set -u
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./lab-common.sh

PASS=0
FAIL=0

check() {  # check <description> <test command...>
  local desc=$1; shift
  if "$@" >/dev/null 2>&1; then
    printf '  %s[PASS]%s %s\n' "$C_GREEN" "$C_RESET" "$desc"
    PASS=$((PASS + 1))
  else
    printf '  %s[FAIL]%s %s\n' "$C_RED" "$C_RESET" "$desc"
    FAIL=$((FAIL + 1))
  fi
}

section "Lab 12 - Score Card"

echo "A. Networking"
check "interfaces & routes dikhte hain"            bash -c "ip -br addr | grep -q lo && ip route"
check "loopback reachable"                          bash -c "ping -c1 -W2 127.0.0.1"
check "listening sockets milte hain"                bash -c "ss -tln | head -3"
check "DNS resolve hota hai"                        bash -c "getent hosts example.com"
check "HTTP status codes milte hain"                bash -c "curl -s -o /dev/null -w '%{http_code}' https://example.com"
check "network namespace bana sakta hain"           bash -c "unshare --user --map-root-user --net true"
check "namespace me bridge + veth ban sakte hain"   bash -c "unshare --user --map-root-user --net bash -c 'ip link add br0 type bridge && ip link add v0 type veth peer name v1'"
check "namespace me iptables chal jaata hai"        bash -c "unshare --user --map-root-user --net --mount bash -c 'mount -t tmpfs tmpfs /run 2>/dev/null; iptables -L -n'"
check "raw socket capture (CAP_NET_RAW)"            bash -c "unshare --user --map-root-user --net bash -c 'ip link set lo up; python3 -c \"import socket; socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3)).close()\"'"

echo "B. Logging"
check "journalctl entries padh sakte hain"           bash -c "journalctl -n 1 --no-pager"
check "logger entry journal me jaata hai"            bash -c "logger -p user.info -t lab-verify probe && sleep 1 && journalctl -t lab-verify -o cat --no-pager | grep -q probe"
check "systemd-cat journal me likhta hai"            bash -c "systemd-cat -t lab-verify echo probe2 && sleep 1 && journalctl -t lab-verify -o cat --no-pager | grep -q probe2"
check "syslog file readable hai"                    bash -c "head -1 /var/log/syslog"
check "facility/severity levels sath me"            bash -c "logger -p local0.err -t lab-verify errprobe && sleep 1 && journalctl -t lab-verify -p err -o cat --no-pager | grep -q errprobe"
check "remote syslog ship (UDP)"                    bash -c "cd '$LAB_DIR' && timeout 20 bash labs/09-central-logging.sh >/dev/null 2>&1 && grep -q COLLECTED '$LAB_WORK/central/collector.log'"
check "logrotate config dry-run hota hai"           bash -c "cd '$LAB_DIR' && bash labs/10-logrotate.sh >/dev/null 2>&1 && ls '$LAB_WORK/logrotate/logs/' | grep -q 'app.log'"
check "log analysis script chalta hai"              bash -c "python3 '$LAB_DIR/apps/loganalyze.py' '$LAB_WORK/logs/app-events.json' | grep -q 'LOG ANALYSIS REPORT'"

echo "C. Artifacts"
check "app log (text) bana"                         test -s "$LOG_DIR/app-events.log"
check "app log (JSON) bana"                         test -s "$LOG_DIR/app-events.json"
check "access log bana"                             test -s "$LOG_DIR/access.log"
check "central collector log bana"                  test -s "$CENTRAL_DIR/collector.log"
check "transcripts folder bana"                     test -d "$LAB_WORK/transcripts"

TOTAL=$((PASS + FAIL))
printf '\n  %sTOTAL: %d/%d checks passed%s\n' "$C_BOLD" "$PASS" "$TOTAL" "$C_RESET"
if [ "$FAIL" -eq 0 ]; then
  printf '  %sLAB COMPLETE - sab checks pass%s\n' "$C_GREEN" "$C_RESET"
else
  printf '  %s%s check(s) failed - upar ka output dekho%s\n' "$C_YELLOW" "$FAIL" "$C_RESET"
fi
cat <<'EOF'

NEXT STEP (interview + production readiness):
  - Incident drill (labs/12-troubleshoot-drill.sh) se playbook yaad rakho
  - Har layer ka ek command nikal lo: DNS=dig, PORT=ss, APP=curl -v, LOG=journalctl
  - Central logging (lab 09) ka concept ELK (Day 25) se jod do:
    app -> shipper -> parse -> store -> visualize
EOF
exit 0
