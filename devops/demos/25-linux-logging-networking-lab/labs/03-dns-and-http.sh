#!/usr/bin/env bash
# Lab 03 - DNS resolution + HTTP semantics (methods, status codes, curl internals).
# Run:  bash labs/03-dns-and-http.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lab-common.sh"
ensure_dirs
banner_lab

APP="$LAB_DIR/apps/httpapp.py"
PORT="${LAB_PORT:-$(pick_port)}"
READY="$LAB_WORK/app3.ready"

section "Lab 03 - DNS (phonebook) + HTTP (bhasha)"

step "3.1 DNS: A record (IPv4)"
cmd dig example.com A +short

step "3.2 DNS: full answer + TTL (cache kitni der)"
cmd dig example.com A +noall +answer

step "3.3 DNS: CNAME (alias)"
cmd dig www.github.com CNAME +short

step "3.4 DNS: MX (mail servers)"
cmd dig example.com MX +short

step "3.5 DNS: TXT (SPF/DKIM/verification)"
cmd dig example.com TXT +short

step "3.6 DNS: multiple resolvers try karo (kabhi ek server slow hota hai)"
cmd dig example.com +short
note "dig @1.1.1.1 / @8.8.8.8 = specific resolver pucho. +trace = root se poora walk."

step "3.7 DNS failure kaise dikhta hai (NXDOMAIN)"
cmd dig this-domain-really-does-not-exist-xyz123.invalid +noall +comments +answer
note "status: NXDOMAIN = naam exist nahi karta. SERVFAIL = resolver ne upar se answer nahi mila."

step "3.8 /etc/hosts - local override (name -> IP, DNS se pehle)"
cmd grep -E "localhost|^127" /etc/hosts
note "hosts file DNS se PEHLE padha jaata hai - local testing ka classic tarika."

step "3.9 HTTP server start (port $PORT) with request logging"
rm -f "$READY"
python3 "$APP" --host 127.0.0.1 --port $PORT --access-log "$LOG_DIR/access.log" --app-log "$LOG_DIR/app.log" --ready-file "$READY" >"$LAB_WORK/app3.out" 2>&1 &
APP_PID=$!
for _ in $(seq 1 40); do [ -f "$READY" ] && break; sleep 0.1; done
ok "app running (pid $APP_PID)"

step "3.10 curl -v : poori journey (DNS -> TCP -> TLS -> request -> response)"
cmd curl -sv "http://127.0.0.1:$PORT/" -o /dev/null 2>&1 | head -25
note "verbose me dikhta hai: 'Trying 127.0.0.1:PORT' = TCP, '* Connected' = handshake done."

step "3.11 curl -I : sirf headers (body nahi)"
cmd curl -sI "http://127.0.0.1:$PORT/health"

step "3.12 curl -w : status code + timing breakdown"
cmd curl -sS -o /dev/null \
  -w 'http_code=%{http_code} dns=%{time_namelookup}s tcp=%{time_connect}s ttfb=%{time_starttransfer}s total=%{time_total}s\n' \
  "http://127.0.0.1:$PORT/health"
note "dns=tcp ka fark = connection overhead. ttfb=total ka fark = server processing."

step "3.13 Status codes - 2xx / 3xx / 4xx / 5xx"
for code in 200 201 301 400 401 403 404 500 502 503; do
  printf '  GET /status/%-4s -> %s\n' "$code" \
    "$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/status/$code")"
done

step "3.14 HTTP methods (GET / POST / PUT / DELETE)"
cmd curl -sS -o /dev/null -w 'GET    -> %{http_code}\n' "http://127.0.0.1:$PORT/api/orders"
cmd curl -sS -o /dev/null -w 'POST   -> %{http_code}\n' -X POST -d 'sku=1' "http://127.0.0.1:$PORT/api/orders"
cmd curl -sS -o /dev/null -w 'PUT    -> %{http_code}\n' -X PUT -d 'sku=2' "http://127.0.0.1:$PORT/api/orders/1"
cmd curl -sS -o /dev/null -w 'DELETE -> %{http_code}\n' -X DELETE "http://127.0.0.1:$PORT/api/orders/1"

step "3.15 404 vs 500 - server ki galti ya client ki?"
cmd curl -sS "http://127.0.0.1:$PORT/no-such-page" -o /dev/null -w 'unknown path -> %{http_code}\n'
cmd curl -sS "http://127.0.0.1:$PORT/boom" -o /dev/null -w 'boom endpoint -> %{http_code}\n'
note "4xx = client ki galti, 5xx = server ki galti. Dono me logs me alag level use karo."

step "3.16 Connection refused vs timeout (do alag failure modes)"
cmd bash -c "curl -sS -o /dev/null -w 'code=%{http_code}\n' --max-time 3 http://127.0.0.1:19999/ ; echo curl_exit=\$?"
note "curl exit 7 = connection refused (port band). exit 28 = timeout (firewall/blackhole)."

step "3.17 Access log me sab requests dikh rahe hain?"
cmd tail -8 "$LOG_DIR/access.log"

kill_pid $APP_PID

cat <<'EOF'

NOTES:
  dig <name> +short      = sirf IP (script me best)
  dig <name> +noall +answer  = TTL + record type
  dig @<resolver>        = specific DNS server
  host <name>            = short human output
  getent hosts <name>    = resolver check (hosts + dns)
  curl -v                = full handshake trace
  curl -I                = headers only
  curl -w '%{http_code}'  = status code for pipelines
  curl -w '%{time_*}'    = DNS/TCP/TTFB/total timings

  Status codes:
    2xx = success (200 ok, 201 created)
    3xx = redirect (301 permanent, 302 temporary)
    4xx = client error (400 bad req, 401 unauth, 403 forbidden, 404 not found)
    5xx = server error (500 internal, 502 bad gateway, 503 unavailable, 504 timeout)

  curl exit codes (automation me bohot kaam aate hain):
    6 = DNS fail · 7 = connection refused · 28 = timeout · 35 = TLS error
EOF
