#!/usr/bin/env python3
"""Tiny log-generating app used by the lab.

Writes to three places so students can compare log styles:
  1. plain text file   (human readable, grep-friendly)
  2. JSON file        (structured, one object per line)
  3. remote syslog    (UDP or TCP to a collector) - optional

Usage:
  logapp.py --lines 50 --file out.log --json out.json
  logapp.py --lines 20 --ship 10.20.0.1 --port 5515 --proto tcp
"""
import argparse
import json
import os
import random
import socket
import sys
import time
from datetime import datetime, timezone

LEVELS = ["INFO", "INFO", "INFO", "INFO", "WARN", "INFO", "ERROR"]
SERVICES = ["payment", "order", "auth", "inventory", "shipping"]
PATHS = ["/", "/api/orders", "/api/pay", "/health", "/login", "/api/user"]
IPS = ["10.0.0.11", "10.0.0.12", "192.168.1.50", "172.16.0.9", "203.0.113.7"]
MESSAGES = [
    "request completed",
    "db connection pool at 80% capacity",
    "upstream timeout after 30s",
    "user login successful",
    "retrying request attempt=2",
    "cache miss, falling back to db",
    "payment declined by upstream",
    "rate limit applied",
]


def iso_ts():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def build_event(i, level=None, service=None):
    return {
        "ts": iso_ts(),
        "level": level or random.choice(LEVELS),
        "service": service or random.choice(SERVICES),
        "trace_id": "%032x" % random.getrandbits(128),
        "client_ip": random.choice(IPS),
        "method": random.choice(["GET", "GET", "POST", "PUT"]),
        "path": random.choice(PATHS),
        "status": random.choice([200, 200, 200, 201, 400, 404, 500, 502]),
        "duration_ms": random.randint(3, 4200),
        "msg": random.choice(MESSAGES),
        "seq": i,
    }


def send_syslog(host, port, proto, lines):
    payload = []
    for ev in lines:
        payload.append("<13>1 %s %s %s - - - - %s" % (
            ev["ts"], os.uname().nodename, ev["service"],
            json.dumps(ev)))
    blob = ("\n".join(payload) + "\n").encode()
    if proto == "tcp":
        with socket.create_connection((host, port), timeout=5) as s:
            s.sendall(blob)
    else:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.sendto(blob, (host, port))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lines", type=int, default=20)
    ap.add_argument("--file")
    ap.add_argument("--json")
    ap.add_argument("--ship", help="collector host")
    ap.add_argument("--port", type=int, default=5514)
    ap.add_argument("--proto", choices=["tcp", "udp"], default="udp")
    ap.add_argument("--level")
    ap.add_argument("--service")
    ap.add_argument("--sleep", type=float, default=0.0)
    ap.add_argument("--stdout", action="store_true")
    args = ap.parse_args()

    events = []
    for i in range(1, args.lines + 1):
        ev = build_event(i, args.level, args.service)
        events.append(ev)
        if args.file:
            with open(args.file, "a") as fh:
                fh.write("%s %-5s %-10s %s\n" % (
                    ev["ts"], ev["level"], ev["service"], ev["msg"]))
        if args.json:
            with open(args.json, "a") as fh:
                fh.write(json.dumps(ev) + "\n")
        if args.stdout:
            print(json.dumps(ev))
        if args.sleep:
            time.sleep(args.sleep)

    if args.ship:
        try:
            send_syslog(args.ship, args.port, args.proto, events)
            print("shipped %d events to %s:%d/%s" % (
                len(events), args.ship, args.port, args.proto))
        except OSError as exc:
            print("ship failed: %s" % exc, file=sys.stderr)
            return 1
    print("generated %d events" % len(events))
    return 0


if __name__ == "__main__":
    sys.exit(main())
