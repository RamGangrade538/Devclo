#!/usr/bin/env python3
"""Mini log analyzer for the lab.

Reads a JSON-lines log file and prints a summary: totals, level counts,
error rate, top services, top client IPs, slow requests, and a sample of
errors. This is the same shape of analysis you would do in Kibana.

Usage: loganalyze.py <file.json> [--errors N] [--slow-ms N]
"""
import argparse
import json
import sys
from collections import Counter, defaultdict


def load(path):
    events = []
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--errors", type=int, default=5)
    ap.add_argument("--slow-ms", type=int, default=2000)
    args = ap.parse_args()

    events = load(args.file)
    if not events:
        print("no events found in %s" % args.file)
        return 1

    levels = Counter(e.get("level", "?") for e in events)
    services = Counter(e.get("service", "?") for e in events)
    ips = Counter(e.get("client_ip", "?") for e in events)
    paths = Counter(e.get("path", "?") for e in events)
    errors = [e for e in events if e.get("level") == "ERROR"]
    slow = sorted((e for e in events if e.get("duration_ms", 0) >= args.slow_ms),
                  key=lambda e: e.get("duration_ms", 0), reverse=True)
    by_service_errors = Counter(e.get("service", "?") for e in errors)

    total = len(events)
    print("=" * 60)
    print("LOG ANALYSIS REPORT : %s" % args.file)
    print("=" * 60)
    print("total events      : %d" % total)
    print("error rate        : %.2f%%  (%d errors)" % (100.0 * len(errors) / total, len(errors)))
    print()
    print("-- level distribution --")
    for lvl, cnt in levels.most_common():
        bar = "#" * max(1, int(40 * cnt / total))
        print("  %-6s %6d  %-42s %.1f%%" % (lvl, cnt, bar, 100.0 * cnt / total))
    print()
    print("-- top services --")
    for svc, cnt in services.most_common(5):
        err = by_service_errors.get(svc, 0)
        print("  %-12s total=%-5d errors=%-5d (%.1f%%)" % (svc, cnt, err, 100.0 * err / cnt))
    print()
    print("-- top client IPs --")
    for ip, cnt in ips.most_common(5):
        print("  %-16s %d requests" % (ip, cnt))
    print()
    print("-- top paths --")
    for p, cnt in paths.most_common(5):
        print("  %-24s %d" % (p, cnt))
    print()
    print("-- slowest requests (>= %dms) --" % args.slow_ms)
    for e in slow[:5]:
        print("  %6dms  %-8s %-24s %s" % (e.get("duration_ms", 0),
                                           e.get("service", "?"),
                                           e.get("path", "?"), e.get("msg", "")))
    print()
    print("-- sample errors (first %d) --" % args.errors)
    for e in errors[:args.errors]:
        print("  [%s] %-9s trace=%s" % (e.get("ts", "")[:19], e.get("service", "?"),
                                         e.get("trace_id", "")[:12]))
        print("        msg=%s path=%s status=%s" % (e.get("msg"), e.get("path"),
                                                    e.get("status")))
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
