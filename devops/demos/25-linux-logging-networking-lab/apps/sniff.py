#!/usr/bin/env python3
"""Mini packet sniffer (a tiny tcpdump) for the lab.

Uses a raw AF_PACKET socket, so it needs CAP_NET_RAW - which you get inside
`unshare --user --map-root-user --net` without being root on the host.

Usage:  sniff.py [-i IFACE] [-c COUNT] [-A] [--port N] [--host IP]
"""
import argparse
import socket
import struct
import sys
import time

TCP_FLAGS = [(0x01, "F"), (0x02, "S"), (0x04, "R"), (0x08, "P"),
             (0x10, "A"), (0x20, "U")]


def decode_flags(flag_byte):
    out = []
    for bit, ch in TCP_FLAGS:
        if flag_byte & bit:
            out.append(ch)
    return "".join(out) if out else "."


def parse(pkt):
    if len(pkt) < 14:
        return None
    eth_type = struct.unpack("!H", pkt[12:14])[0]
    if eth_type != 0x0800:          # IPv4 only
        return None
    ip = pkt[14:]
    if len(ip) < 20:
        return None
    ihl = (ip[0] & 0x0F) * 4
    proto = ip[9]
    src = socket.inet_ntoa(ip[12:16])
    dst = socket.inet_ntoa(ip[16:20])
    total_len = struct.unpack("!H", ip[2:4])[0]
    payload = ip[ihl:total_len] if total_len <= len(ip) else ip[ihl:]
    if proto == 6 and len(payload) >= 20:          # TCP
        sport, dport = struct.unpack("!HH", payload[:4])
        doff = (payload[12] >> 4) * 4
        flags = payload[13]
        return dict(transport="TCP", sport=sport, dport=dport, src=src,
                    dst=dst, flags=decode_flags(flags), data=payload[doff:])
    if proto == 17 and len(payload) >= 8:          # UDP
        sport, dport, ulen = struct.unpack("!HHH", payload[:6])
        return dict(transport="UDP", sport=sport, dport=dport, src=src,
                    dst=dst, flags="", data=payload[8:ulen])
    return dict(transport="IP-%d" % proto, sport=0, dport=0, src=src,
                dst=dst, flags="", data=payload)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--iface", default="lo")
    ap.add_argument("-c", "--count", type=int, default=10)
    ap.add_argument("-A", "--ascii", action="store_true",
                    help="print payload as ascii")
    ap.add_argument("--port", type=int)
    ap.add_argument("--host")
    args = ap.parse_args()

    try:
        sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
        sock.bind((args.iface, 0))
        sock.settimeout(5)
    except PermissionError:
        print("PermissionError: CAP_NET_RAW chahiye. "
              "Namespace me chalao ya root se.", file=sys.stderr)
        return 1
    except OSError as exc:
        print("cannot open interface %s: %s" % (args.iface, exc), file=sys.stderr)
        return 1

    print("# sniffing on %s (max %d packets)" % (args.iface, args.count))
    seen = 0
    try:
        while seen < args.count:
            try:
                raw = sock.recv(65535)
            except socket.timeout:
                print("# timeout - no more packets")
                break
            info = parse(raw)
            if not info:
                continue
            if args.port and args.port not in (info["sport"], info["dport"]):
                continue
            if args.host and args.host not in (info["src"], info["dst"]):
                continue
            ts = time.strftime("%H:%M:%S") + ".%03d" % int((time.time() % 1) * 1000)
            line = "%s %s:%d > %s:%d [%s] len=%d" % (
                ts, info["src"], info["sport"], info["dst"], info["dport"],
                info["flags"], len(info["data"]))
            print(line)
            if args.ascii and info["data"]:
                text = info["data"].decode("utf-8", "replace")
                for row in text.splitlines():
                    print("      " + row)
            seen += 1
    except KeyboardInterrupt:
        pass
    finally:
        sock.close()
    print("# done: %d packets" % seen)
    return 0


if __name__ == "__main__":
    sys.exit(main())
