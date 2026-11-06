#!/usr/bin/env bash
# Clean up everything the lab created (only inside this lab directory).
# Run:  bash cleanup.sh
set -u
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./lab-common.sh

section "Cleanup"

kill_lab_apps
pkill -f "rsyslogd -n -f $CENTRAL_DIR" 2>/dev/null
pkill -f "$LAB_DIR/apps/sniff.py" 2>/dev/null
ok "lab processes stopped"

if [ "${1:-}" = "--all" ]; then
  rm -rf "$LAB_WORK"
  ok "work/ directory removed (logs + transcripts)"
else
  find "$LAB_WORK" -mindepth 1 -maxdepth 1 -not -name transcripts -exec rm -rf {} + 2>/dev/null
  ok "work/ artifacts cleared (transcripts rakhe hain - --all se puri directory jayegi)"
fi

echo "  Company system par koi change nahi hua:"
echo "    - /etc/rsyslog.conf, /etc/logrotate.d, ufw, iptables  (sirf padhe gaye)"
echo "    - system ke apne /var/log files me sirf aapke 'logger' entries aaye"
echo "    - apne namespace ke andar hi firewall/network changes hue"
