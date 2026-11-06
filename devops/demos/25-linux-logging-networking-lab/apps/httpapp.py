#!/usr/bin/env python3
"""Small HTTP server used by the networking lab.

Endpoints:
  /                -> 200 hello
  /health          -> 200 {"status":"ok"}
  /slow?ms=2000    -> 200 after a delay (to observe sockets in ESTAB state)
  /status/<code>   -> returns that HTTP status code
  /boom            -> raises -> 500

Every request is written to the access log (combined-ish format) and to an
app log (JSON) so the logging labs have real traffic to analyse.
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ACCESS_LOG = None
APP_LOG = None


def iso_ts():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def log_access(line):
    if ACCESS_LOG:
        with open(ACCESS_LOG, "a") as fh:
            fh.write(line + "\n")


def log_app(ev):
    if APP_LOG:
        with open(APP_LOG, "a") as fh:
            fh.write(json.dumps(ev) + "\n")


class Handler(BaseHTTPRequestHandler):
    server_version = "LabApp/1.0"
    protocol_version = "HTTP/1.1"

    def _respond(self, code, body=b"", ctype="text/plain"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _handle(self):
        start = time.time()
        parsed = urlparse(self.path)
        path = parsed.path
        code = 200
        try:
            if path == "/":
                self._respond(200, b"hello from lab app\n")
            elif path == "/health":
                self._respond(200, json.dumps({"status": "ok"}).encode(),
                              "application/json")
            elif path == "/api/orders":
                if self.command == "POST":
                    code = 201
                    self._respond(201, json.dumps({"id": 42, "sku": "1"}).encode(),
                                  "application/json")
                else:
                    self._respond(200, json.dumps({"orders": [1, 2, 3]}).encode(),
                                  "application/json")
            elif path == "/api/pay":
                code = 200
                self._respond(200, json.dumps({"payment": "ok"}).encode(),
                              "application/json")
            elif path == "/login":
                code = 200
                self._respond(200, json.dumps({"token": "lab-token"}).encode(),
                              "application/json")
            elif path == "/slow":
                ms = int(parse_qs(parsed.query).get("ms", ["2000"])[0])
                time.sleep(ms / 1000.0)
                self._respond(200, b"slow response\n")
            elif path.startswith("/status/"):
                code = int(path.rsplit("/", 1)[1])
                self._respond(code, b"status %d\n" % code)
            elif path == "/boom":
                raise RuntimeError("kaboom")
            else:
                code = 404
                self._respond(404, b"not found\n")
        except Exception as exc:  # noqa: BLE001
            code = 500
            try:
                self._respond(500, b"internal error\n")
            except Exception:  # noqa: BLE001
                pass
            log_app({"ts": iso_ts(), "level": "ERROR", "service": "labapp",
                     "msg": "unhandled exception: %s" % exc, "path": path})
        finally:
            dur = int((time.time() - start) * 1000)
            log_access('%s - - [%s] "%s %s HTTP/1.1" %d %dB %dms' % (
                self.client_address[0], self.log_date_time_string(),
                self.command, self.path, code, 0, dur))
            log_app({"ts": iso_ts(),
                     "level": "ERROR" if code >= 500 else
                              ("WARN" if code >= 400 else "INFO"),
                     "service": "labapp", "client_ip": self.client_address[0],
                     "method": self.command, "path": path, "status": code,
                     "duration_ms": dur, "msg": "request handled"})

    do_GET = _handle
    do_POST = _handle
    do_PUT = _handle
    do_DELETE = _handle
    do_HEAD = _handle

    def log_message(self, fmt, *a):  # silence stderr noise
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--access-log")
    ap.add_argument("--app-log")
    ap.add_argument("--ready-file", help="file touched when listening")
    args = ap.parse_args()

    global ACCESS_LOG, APP_LOG
    ACCESS_LOG = args.access_log
    APP_LOG = args.app_log

    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    if args.ready_file:
        with open(args.ready_file, "w") as fh:
            fh.write("%s pid=%d\n" % (iso_ts(), os.getpid()))
    print("lab app listening on %s:%d (pid %d)" % (args.host, args.port, os.getpid()),
          flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


if __name__ == "__main__":
    sys.exit(main())
