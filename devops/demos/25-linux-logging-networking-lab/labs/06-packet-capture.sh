#!/usr/bin/env bash
# Lab 06 - Packet capture: our own mini-sniffer (no root) + tcpdump (root).
# Run:  bash labs/06-packet-capture.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

section "Lab 06 - Packet Capture (tcpdump + apna raw-socket sniffer)"

step "6.1 Capture tools inventory"
cmd bash -c "command -v tcpdump || echo 'tcpdump: not installed (sudo apt install tcpdump)'; command -v tshark || echo 'tshark: not installed (optional)'"

step "6.2 Host interface pe capture (root chahiye - optional)"
if need_root; then
  cmd bash -c "timeout 6 tcpdump -i any -c 5 -nn 2>&1 | head -10"
else
  note "Host pe raw sockets root hi le sakta hai. Kabhi chahiye to:"
  note "  sudo tcpdump -i any -c 20 -nn port 80"
  note "Bina root ke hum niche APNA sniffer likh ke packets dekhenge."
fi

step "6.3 NAMESPACE me capture (root ki zaroorat nahi) - TCP 3-way handshake"
cmd bash -c "$(cat <<'EOS'
unshare --user --map-root-user --net bash -c '
ip link set lo up
PORT=18077
python3 "'"$LAB_DIR"'/apps/sniff.py" -i lo -c 10 --port $PORT > /tmp/lab_sniff.txt 2>&1 &
SNIFF=$!
sleep 1.5
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
curl -sS -m 3 -o /dev/null -w "curl http_code=%{http_code}\n" http://127.0.0.1:$PORT/
sleep 1.5
kill $SNIFF $SRV 2>/dev/null
sleep 0.5
echo "----------------- CAPTURED PACKETS -----------------"
cat /tmp/lab_sniff.txt
'
EOS
)"

step "6.4 Handshake ka matlab (SYN / SYN-ACK / ACK)"
cat <<'EOF'

  1) client -> server   [S]      SYN       "maine connection maanga"
  2) server -> client   [SA]     SYN,ACK   "theek hai, mera bhi ready hai"
  3) client -> server   [A]      ACK       "confirm, ab data bhejta hoon"
  4) client -> server   [PA]     PSH,ACK   "GET / HTTP/1.1 ... actual data"
  5) server -> client   [PA]     PSH,ACK   "HTTP/1.1 200 OK"

  Flags: S=SYN · A=ACK · P=PSH · F=FIN · R=RST · U=URG
  [SA] dikhta hai = server ne SYN+ACK bheja = handshake ka beech.
  Half-open / SYN flood: bahut S, ACK nahi -> DoS ka sign.

  Duplicates? 'lo' (loopback) pe har packet 2 baar dikhta hai - normal hai.
  Real NIC pe ek baar dikhega.

  tcpdump filters (production me jo use hote hain):
    tcp port 80            = sirf port 80
    host 10.0.0.5          = ek specific IP
    src host X and dst port Y
    not tcp port 22        = SSH chhod ke sab
    -A                     = payload ASCII (HTTP headers/body)
    -nn                    = seedhe IP:port (no DNS)
    -c 20                  = 20 packets ke baad ruk jao
    -w file.pcap           = pcap file (Wireshark me khulega)
    -Z root                = privilege drop mat karo (namespace me zaroori)

  Wireshark:
    sudo tcpdump -i any -w /tmp/cap.pcap -s 0 port 80
    wireshark /tmp/cap.pcap
    ya offline:  tcpdump -r cap.pcap -nn -A
EOF

step "6.5 HTTP payload capture (headers + body visible)"
cmd bash -c "$(cat <<'EOS'
unshare --user --map-root-user --net bash -c '
ip link set lo up
PORT=18078
python3 "'"$LAB_DIR"'/apps/sniff.py" -i lo -c 6 -A --port $PORT > /tmp/lab_sniff2.txt 2>&1 &
SNIFF=$!
sleep 1.5
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
curl -sS -m 3 -o /dev/null http://127.0.0.1:$PORT/ >/dev/null
sleep 1.5
kill $SNIFF $SRV 2>/dev/null
sleep 0.5
grep -a -E "GET|HTTP|Host|User-Agent|hello" /tmp/lab_sniff2.txt | head -10
'
EOS
)"
note "Yahi hai 'plain-text protocol' ka risk - HTTP payload bina encryption dikhta hai."

step "6.6 TCP state machine par ek nazar (SYN_RECV / ESTABLISHED)"
cmd bash -c "$(cat <<'EOS'
unshare --user --map-root-user --net bash -c '
ip link set lo up
PORT=18079
python3 "'"$LAB_DIR"'/apps/sniff.py" -i lo -c 12 --port $PORT > /tmp/lab_sniff3.txt 2>&1 &
SNIFF=$!
sleep 1.5
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
curl -sS -m 3 -o /dev/null http://127.0.0.1:$PORT/ >/dev/null
sleep 1.5
kill $SNIFF $SRV 2>/dev/null
sleep 0.5
awk "{print \$3, \$4, \$5}" /tmp/lab_sniff3.txt | sort | uniq -c | sort -rn | head -8
'
EOS
)"
note "Flags ka distribution = kitne SYN, kitne ACK, kitne PSH."

cat <<'EOF'

NOTES:
  Apna sniffer likhna (lab me):
    s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
    s.bind(("lo", 0))   # AF_PACKET = raw ethernet frames
    pkt = s.recv(65535) # IP header 14 bytes offset se start, TCP uske 20 bytes aage

  Layers:
    Ethernet (14B: src/dst MAC + ethertype) -> IP (20B: src/dst IP, proto)
    -> TCP (src/dst port, flags, seq/ack) -> payload (HTTP bytes)

  Security note: production me capture sensitive hota hai - traffic me password/
  token dikh sakte hain. Capture files ko restricted storage me rakho aur
  delete kar do jab kaam ho jaye.
EOF
