# Deep Dive: Nginx — Reverse Proxy, Web Server Aur Ingress

> **Kaha ka hai:** Day 16 (compose) + Day 21 (K8s ingress) + Day 13 (admin) ka asli engine. Nginx duniya ki sabse zyada used web server/reverse proxy hai — har cloud, har ingress, har LB stack me. Ye topic usse asli-pro power tak le jata hai.

---

## 1. Nginx Kya Hai — Three-in-One

| Mode | Kya karta |
|------|-----------|
| **Web server** | Static files serve (HTML/JS/图片), fast |
| **Reverse proxy** | Requests ko backend apps (Gunicorn/Node/php-fpm) pe route |
| **Load balancer** | Upstream group me distribute + health |
| **(Plugins)** | TLS, caching, rate-limit, auth, gzip, HTTP/2/3 |

**vs Apache:** Nginx = event-driven (1 process, thousands conn), Apache = process/thread per conn. Nginx memory-slim, concurrency king.

---

## 2. Setup + Default Files

```bash
sudo apt install nginx -y
sudo systemctl enable --now nginx
curl -I localhost                    # 200 OK
nginx -t                             # config syntax check (before reload!)
sudo nginx -s reload                 # config reload (session-safe)
```

**File layout (Debian/Ubuntu):**
```
/etc/nginx/
 ├── nginx.conf                # main config
 ├── sites-available/          # +1 enabled approach
 ├── sites-enabled/            # symlinks to available
 ├── conf.d/                   # global extra configs
 └── modules-enabled/          # modules
```

---

## 3. Basic Server Block — "Virtual Host"

```nginx
server {
    listen 80;
    server_name app.example.com;      # hostname (vhost/SNI)

    root /var/www/app;                # path for static
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Location matching (priority):**
```
location = /exact      (exact match highest)
location ^~ /static/   (prefix, stop regex)
location ~ \.php$      (regex — case sensitive)
location ~* \.jpg$     (regex — case insensitive)
location /             (prefix fallback)
```

---

## 4. Reverse Proxy + UPSTREAM (The Real Hammer)

```nginx
upstream api {
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    keepalive 32;                      # reuse connections
}

server {
    listen 443 ssl;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_http_version 1.1;        # keepalive for upstream
    }

    location / {                       # static frontend
        root /var/www/app;
        try_files $uri /index.html;    # SPA fallback
    }
}
```

**Zaroori headers:** app ko batana ki client asli IP hai (X-Forwarded-For, Proto) — log/probes wahan lagte hain.

**Gunicorn/uvicorn ko main dhyan:** `proxy_pass http://127.0.0.1:8000;` — Gunicorn itself is WSGI; nginx handles clients.

---

## 5. TLS Best Practices (Nginx)

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;   # HTTP → HTTPS force
}

server {
    listen 443 ssl;
    http2 on;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256";
    ssl_session_cache shared:SSL:10m;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**Automated cert (certbot):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.example.com
# auto-renew cron: certbot renew --dry-run
```

---

## 6. Security & Limits — Production Lockdown

```nginx
# Rate limiting (per IP)
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;
location /login {
    limit_req zone=login burst=10 nodelay;
}

# Size limits (DoS mitigation)
client_max_body_size 10m;
client_body_timeout 10s;

# Security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

**Access control (basic):**
```bash
# htpasswd style (apache2-utils provide)
printf "devops:%s\n" "$(openssl passwd -apr1 'DevClo#123')" > /etc/nginx/.htpasswd
```
```nginx
location /admin {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

---

## 7. Caching & Compression (Perf)

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml;

# microcache (API responses)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=core:10m max_size=1g inactive=60m;
location /cacheable {
    proxy_cache core;
    proxy_cache_valid 200 60s;
    add_header X-Cache-Status $upstream_cache_status;   # HIT/MISS dekhna
}
```

---

## 8. Nginx As K8s Ingress (Plus Real Setup)

Popular: **ingress-nginx** (nginx under the hood) / **NGINX Ingress Controller**:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.example.com]
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend: { service: { name: api-svc, port: { number: 80 } } }
          - path: /
            pathType: Prefix
            backend: { service: { name: web-svc, port: { number: 80 } } }
```

```
Request → Cloud LB → Ingress-nginx (routes by host/path) → Service → Pod
```

---

## 9. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **"502 Bad Gateway"** | upstream down/refused | Check backend port up, `proxy_pass` URL, upstream container/log |
| **"413 Request Entity Too Large"** | upload default 1m | `client_max_body_size 50m;` |
| **"worker_connections are not enough"** | Too few worker conn | `worker_connections 4096; worker_processes auto;` |
| **Too many files open** | Log/CF ulimit | `worker_rlimit_nofile 8192;` + sysctl |
| **Weird X-Forwarded-For in logs** | app/SLX headers wrong | Set closer `X-Real-IP`, `real_ip_header` trust |
| **Nginx doesn't start after edit** | Config syntax error | `nginx -t` FIRST, then `systemctl reload nginx` |
| **Slow static** | gzip/expiry off | `gzip on`, `expires 7d`, caching |
| **Loop redirect / too many redirects** | HTTPS segment conflict | Correct external source: `X-Forwarded-Proto` + set scheme |

**Debug commands:**
```bash
nginx -t                               # config validta test
sudo nginx -s reload
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
curl -H "Host: app.example.com" localhost   # vhost routing test
```

---

## 10. Interview Questions — Nginx

| Question | Strong Answer |
|----------|---------------|
| "Nginx vs Apache?" | Nginx event-driven = high concurrency low memory; Apache = process-per-conn. Nginx default HP users. |
| "Location match priority?" | `=` exact → `^~` prefix → `~`/`~*` regex → `/` prefix; order matlab important nahi, spec ka priority. |
| "Reverse proxy headers?" | X-Real-IP, X-Forwarded-For (client IP), X-Forwarded-Proto. App ke logs/policies inhi se. |
| "502 common cause + fix?" | Upstream down/timeout/URL galt. Check port, upstream host, `proxy_read_timeout`. |
| "How to limit req/IP?" | `limit_req_zone` + `limit_req` zone (rate + burst). |
| "HTTPS force?" | 301 redirect block + certbot; HTTP/2, TLS1.2/1.3 only. |
| "Nginx + Gunicorn stack?" | Nginx = client edge (static, TLS, rate-limit, proxy); Gunicorn = Python WSGI app; nginx forwards `/` upstream. |
| "Hot reload?" | `nginx -s reload` — worker reload bina conn drop (safety: run `nginx -t` first). |

---

## 11. Hands-On Lab

```bash
# 1. Static site
mkdir -p ~/nglab/site && cd ~/nglab
echo '<h1>Nginx Lab</h1>' > site/index.html

# 2. Docker nginx + custom config
cat > server.conf <<'EOF'
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  location / { try_files $uri /index.html; }
}
EOF
docker run -d --name ng -p 8080:80 -v $PWD/site:/usr/share/nginx/html:ro \
  -v $PWD/server.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine
curl -s localhost:8080

# 3. Reverse-proxy demo (backend = python http)
python3 -m http.server 9000 & sleep 1
cat > proxy.conf <<'EOF'
server {
  listen 80;
  location / {
    proxy_pass http://host.docker.internal:9000;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
EOF
docker run -d --name ngp --add-host host.docker.internal:host-gateway \
  -p 8081:80 -v $PWD/proxy.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine
curl -s localhost:8081/ | grep -o "9000"    # backend served!

kill %1
docker rm -f ng ngp
```

---

## 12. Summary | Yaad Rakho

1. Nginx = web server + reverse proxy + LB + TLS
2. `nginx -t` → `nginx -s reload` (config change protocol)
3. Server block = vhost (server_name), location = routing priority
4. Proxy headers: Host, X-Real-IP, X-Forwarded-For/Proto
5. TLS: certbot + TLS1.2/1.3 + HSTS; HTTP→HTTPS 301
6. Security: rate-limit (`limit_req`), size limits, security headers
7. `gzip`, caching (`proxy_cache`), `expires` — perf trinity
8. K8s Ingress-nginx: same concept, YAML managed

---
**Related:** [Day 16](../day-16-docker-compose-multicontainer.md) · [Day 21](../day-21-week-3-review-challenge.md) · [Load Balancing](../topics/load-balancing-reverse-proxy.md) · [TLS & PKI](../topics/tls-certificates-pki.md) · [HTTP & REST](../topics/http-rest-api-fundamentals.md)