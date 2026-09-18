# Day 09 — Dockerfile, Builds & Optimization (DevClo Expanded)

## Overview | Parichay

Dockerfile likhna easy hai — **optimized Dockerfile** likhna trade hai. Aaj seekhenge multi-stage builds (900MB → 100MB), layer caching, security hardening, BuildKit features, aur production-grade Dockerfiles. Ye Day 8 ka senior upgrade hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Dockerfile instructions — FROM, RUN, COPY vs ADD, ENV, ARG, EXPOSE
- [ ] ENTRYPOINT vs CMD practical difference
- [ ] Multi-stage builds — builder → runtime pattern
- [ ] Layer caching — deps pehle, code baad
- [ ] `.dockerignore` kyu zaroori
- [ ] Security — non-root user, read-only FS, drop caps, Trivy SBOM
- [ ] BuildKit — cache mounts, secrets, SSH forwarding
- [ ] `docker buildx` multi-arch builds
- [ ] 2026 — BuildKit default, bake files

---

## Full Topic (LEARN) | Puri Detail

### 1. Dockerfile Instructions

```dockerfile
FROM python:3.12-slim          # base (pehli line)
ARG NODE=18                    # build-time (image mein nahi)
ENV PYTHONUNBUFFERED=1         # runtime (image mein hai)
WORKDIR /app
COPY requirements.txt .        # COPY preferred
ADD archive.tar.gz /app        # auto-extract (rare use)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*      # cleanup same layer
RUN addgroup --system ag && adduser --system --ingroup ag user
USER user                      # non-root!
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1
ENTRYPOINT ["python"]
CMD ["app.py"]
```

**ENTRYPOINT vs CMD:**

| Pattern | `docker run img` | `docker run img arg` |
|---------|------------------|----------------------|
| CMD only | `python app.py` | `arg` overrides |
| ENTRYPOINT+CMD | `python app.py` | `python arg` |

### 2. Multi-Stage Builds — Senior Skill

```dockerfile
# ❌ 900MB — sab kuch ek image mein
FROM node:20
COPY . .
RUN npm ci && npm run build
CMD ["node", "dist/server.js"]

# ✅ ~120MB — builder → runtime
FROM node:20 AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

```dockerfile
# Go — ~10MB (distroless)
FROM golang:1.22 AS builder
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
CMD ["/server"]
```

### 3. Layer Caching

```dockerfile
# ❌ code pehle → har change par deps reinstall
COPY . .
RUN pip install -r requirements.txt

# ✅ deps pehle → code change = sirf last layer
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

**Cache mount (BuildKit):**
```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
```

### 4. `.dockerignore`

```dockerignore
.git
node_modules
.env
.env.*
__pycache__
*.pyc
.venv
*.md
Dockerfile
```
Impact: 500MB build context → 2MB.

### 5. Security Hardening

| Practice | Kaise |
|----------|-------|
| Non-root | `USER appuser` in Dockerfile + `--user` flag |
| Read-only FS | `docker run --read-only` |
| Drop caps | `docker run --cap-drop ALL --cap-add NET_BIND_SERVICE` |
| Scan | Trivy / docker scout |
| Secrets | BuildKit `--mount=type=secret` |
| Pin base | `FROM python:3.12.1-slim-bookworm` (specific) |

### 6. Trivy

```bash
trivy image --severity HIGH,CRITICAL myapp:1.0
trivy config Dockerfile          # misconfiguration scan
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:1.0   # CI gate
```

### 7. BuildKit + buildx (2026)

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
RUN --mount=type=ssh git clone git@github.com:private/repo.git
```

```bash
docker buildx create --name mybuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
docker buildx ls
```

**Docker Bake (declarative, 2026):**
```hcl
group "default" { targets = ["app"] }
target "app" {
  dockerfile = "Dockerfile"
  tags = ["myreg/app:latest"]
  platforms = ["linux/amd64", "linux/arm64"]
}
```
```bash
docker buildx bake --push
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `docker build -t name .` | Build from Dockerfile |
| `docker build -f Dockerfile.prod -t name .` | Custom Dockerfile |
| `docker build --no-cache -t name .` | Fresh build |
| `docker build --build-arg X=y -t name .` | Build-time arg |
| `trivy image --severity HIGH,CRITICAL name` | Vulnerability scan |
| `trivy config Dockerfile` | Dockerfile lint/misconfig |
| `docker history image` | Har layer ka size |
| `docker buildx create --use` | Multi-arch builder |
| `docker buildx build --platform amd64,arm64 -t name .` | Cross-arch build |
| `docker scout cves image` | Docker CVE scanner |

---

## Practice Lab | Abhi Karein

**1.** `mkdir docker-optimize && cd docker-optimize` — Flask `app.py` (`/` → "Optimized Docker Image!", `/health` → OK) + `flask==3.1.*`.

**2. Naive Dockerfile** (`FROM python:3.12`, `COPY . .`, `RUN pip install`), build `myapp:naive`, note size ~1GB+.

**3. Optimized multi-stage Dockerfile:**
```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```
Build `myapp:optimized` → ~130MB. Compare sizes (`docker images ... --format "{{.Size}}"`).

**4. Layers:** `docker history myapp:optimized`.

**5. Scan:** `trivy image --severity HIGH,CRITICAL myapp:optimized`.

**6. Run:** `docker run -d -p 5000:5000 --name opt myapp:optimized`; `curl localhost:5000`; `docker exec opt whoami` (non-root check).

**7. `.dockerignore`:** add `.git`, `__pycache__`; retime build — faster.

**8. Cache mount test:** BuildKit Dockerfile with `--mount=type=cache,target=/root/.cache/pip`; rebuild twice — 2nd much faster.

**9. Cleanup:** `docker stop opt && docker rm opt && docker rmi myapp:naive myapp:optimized`.

---

## Incidents / Tickets | Real Practice

### INC-303 · Image Build Fails

- **Situation:** Build error — `pip: command not found` / `apt-get: not found`.
- **Investigate:** `docker build -t myapp . 2>&1 | tail -20` — konsa RUN step fail.
- **Root cause:** `apt-get install` bina `apt-get update` (package index khali), ya `pip` on non-python base, ya multi-stage `--from` galat.
- **Fix:**
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```
- **Verify:** Clean `docker build`.
- **Blast radius | Prevent:** Hadolint CI mein — build se pehle Dockerfile issues catch.

### INC-304 · Wrong Environment Variable

- **Situation:** App me `DB_HOST=localhost` but DB alag container hai.
- **Investigate:** `docker inspect app --format='{{range .Config.Env}}{{println .}}{{end}}'` + `docker exec app env | grep DB`.
- **Root cause:** Dockerfile mein `ENV DB_HOST=localhost` hardcode; container ke andar localhost = khud ka container.
- **Fix:** Override runtime: `docker run -e DB_HOST=dbcontainer app` ya Compose `env_file`.
- **Verify:** `docker exec app env | grep DB_HOST` correct.
- **Blast radius | Prevent:** Dockerfile mein hardcoded env/secrets mat rakho; runtime config = `.env`/secret manager.

---

## Interview Corner | Sawal-Jawab

**Q1: Multi-stage build?** — Multiple FROM: build stage (compiler/npm) aur runtime stage (sirf artifacts). Final image chhota (900→100MB) + build tools prod image mein nahi.

**Q2: Layer caching?** — Har instruction layer; unchanged layers cached. `COPY requirements.txt` pehle, `COPY . .` baad — code change par deps cached rehti.

**Q3: `.dockerignore` kyu?** — Build context chhota (`.git`, `node_modules`, `.env` skip), build fast, secrets image mein nahi.

**Q4: Non-root user kyun?** — Container compromise par attacker ko host root nahi milega. CIS Docker Benchmark requirement.

**Q5: BuildKit?** — 2026 default builder: parallel builds, cache mounts, secret mounting (image mein secret nahi), SSH forwarding. `docker buildx` = multi-arch wrapper.

---

## Quick Notes | Yaad Rakhna

- Multi-stage: builder mein build, runtime mein sirf artifacts
- Caching: deps pehle COPY, code baad — build 10x fast
- `.dockerignore` mandatory — `.git`, `node_modules`, `.env`
- `USER <nonroot>` = CIS benchmark security
- Trivy CI mein HIGH/CRITICAL par exit-1 gate
- Cache mounts se pip/npm reuse hota hai across builds
- `docker history` se badi layers dhundo aur optimize karo
- ENTRYPOINT = fixed binary, CMD = default args