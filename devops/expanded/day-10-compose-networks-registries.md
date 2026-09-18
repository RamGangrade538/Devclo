# Day 10 — Compose, Networks & Registries (DevClo Expanded)

## Overview | Parichay

Ek container chalana easy hai — real app mein DB, cache, frontend sab alag containers. Docker Compose se ek command mein poora stack up/down. Aaj: Compose v2, service DNS networking, ACR (Azure Container Registry), tagging strategy, multi-container debugging. Docker ka aakhri day — kal se Azure.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] `compose.yml` — services, volumes, networks, depends_on
- [ ] Environment vars — env_file, secrets, interpolation
- [ ] Healthcheck-based `depends_on` (Compose v2)
- [ ] Multi-container networking — service DNS, custom networks
- [ ] Registries — Docker Hub, ACR, GHCR — login/push/pull
- [ ] Tagging convention — commit-SHA, semver, avoid `latest`
- [ ] Multi-container debug — `compose ps/logs`, service inspection
- [ ] Profiles — dev vs prod

---

## Full Topic (LEARN) | Puri Detail

### 1. Compose Kya Hai + 2026

YAML file jo full stack define karti hai — `docker compose up` = sab start. **2026: `docker-compose` (hyphen) deprecated — `docker compose` (plugin) use karo.**

### 2. compose.yml — Full Example

```yaml
services:
  app:
    build: .
    ports: ["5000:5000"]
    environment:
      DB_HOST: postgres          # service name = DNS
      REDIS_HOST: redis
    env_file: [.env]
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:5000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks: [frontend, backend]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U admin"]
      interval: 10s
      retries: 5
    networks: [backend]

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb
    volumes: [redisdata:/data]
    networks: [backend]

volumes:
  pgdata:
  redisdata:

networks:
  frontend:
  backend:
```

### 3. Environment Variables — 4 Ways

| Method | Use Case |
|--------|----------|
| `environment:` | Dev non-secret |
| `env_file:` | `.env` file |
| `secrets:` | Docker secrets |
| `${VAR}` | Interpolation from `.env` |

```bash
# .env (root level, repo mein commit mat karo!)
DB_PASSWORD=supersecret123
```

### 4. Networking — Service DNS + Tier Isolation

Compose automatic default network banata hai; service name = DNS. Custom networks se multi-tier isolation:

```
frontend net: nginx ↔ app
backend net:  app ↔ postgres/redis
nginx sirf app tak, DB internet se protected
```

```bash
docker compose exec app ping postgres     # resolves
docker network ls
docker network inspect <name>
```

### 5. Volumes & Profiles

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data        # named (persist)
  - ./src:/app/src                         # bind (hot-reload)
debug:
  image: busybox
  profiles: ["debug"]                      # sirf debug flag se chale
  command: ["sleep","infinity"]
```
```bash
docker compose up
docker compose --profile debug up
```

### 6. Registries — Push/Pull (ACR focus)

```bash
docker login                              # Docker Hub
docker tag app:1.0 myuser/app:1.0 && docker push myuser/app:1.0
docker pull nginx:latest

# ACR (2026 production choice)
az acr create -g myRG -n myregistry --sku Basic
az acr login --name myregistry
docker tag app:1.0 myregistry.azurecr.io/app:1.0
docker push myregistry.azurecr.io/app:1.0
az acr build --registry myregistry --image app:1.0 .    # cloud build

# GHCR
echo $CR_PAT | docker login ghcr.io -u USER --password-stdin
docker push ghcr.io/myorg/app:1.0
```

### 7. Image Tagging Strategy

| Tag | Use Case |
|-----|----------|
| `latest` | **NEVER in prod** — unpredictable |
| `1.2.3` (semver) | Releases |
| `<short-sha>` | CI/CD traceability + rollback |

```bash
GIT_SHA=$(git rev-parse --short HEAD)
docker build -t reg.azurecr.io/app:$GIT_SHA .
docker push reg.azurecr.io/app:$GIT_SHA
# rollback = purana SHA deploy
```

### 8. Multi-Container Debug

```bash
docker compose ps
docker compose logs -f --tail 50 app
docker compose exec app bash
docker compose exec postgres psql -U admin -d myapp
docker compose config                       # resolved yaml
docker compose top
docker compose run app python -c "..."    # one-off
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `docker compose up -d` | Sab services background start |
| `docker compose down` | Stop + delete containers/networks |
| `docker compose down -v` | + volumes delete (data loss!) |
| `docker compose ps` | Status |
| `docker compose logs -f app` | Live logs |
| `docker compose exec app bash` | Inside container |
| `docker compose build` | Rebuild images |
| `docker compose config` | Resolved YAML |
| `az acr login --name reg` | ACR login |
| `az acr build --registry reg --image app:1.0 .` | ACR cloud build |
| `docker tag src:tag dst:tag` | Rename/tag |
| `docker push reg/image:tag` | Push registry |

---

## Practice Lab | Abhi Karein

**1.** `mkdir compose-lab && cd compose-lab; mkdir app`

**2. app/app.py** — Flask + Redis counter (reads `REDIS_HOST` env; `/` increments + returns count; `/health` OK). `app/requirements.txt`: `flask==3.1.*`, `redis==5.0.*`. **app/Dockerfile**: `python:3.12-slim`, copy requirements first, `COPY . .`, `CMD ["python","app.py"]`.

**3. compose.yml:**
```yaml
services:
  app:
    build: ./app
    ports: ["5000:5000"]
    environment: [REDIS_HOST=redis]
    depends_on:
      redis: { condition: service_healthy }
  redis:
    image: redis:7-alpine
    healthcheck: { test: ["CMD","redis-cli","ping"], interval: 10s, retries: 5 }
    volumes: [redisdata:/data]
volumes:
  redisdata:
```

**4.** `docker compose up -d` → status via `docker compose ps`.

**5.** `curl localhost:5000` 3 baar → counter 1,2,3.

**6.** DNS test: `docker compose exec app ping redis`; `docker compose exec app python -c "import redis;print(redis.Redis(host='redis').ping())"` → True.

**7.** Debug: `docker compose logs --tail 10 app`, `docker compose config`.

**8.** Optional ACR: `az acr create/login`, tag with SHA, push.

**9.** Test `down` (data survives) vs `down -v` (counter reset — volume gone).

**10.** Cleanup: `docker compose down -v && docker system prune -f`.

---

## Incidents / Tickets | Real Practice

### INC-305 · Container Can't Reach DB

- **Situation:** App se DB nahi mil raha — "Connection refused".
- **Investigate:** `docker compose ps`, `docker compose logs app`, `docker compose exec app env | grep DB`, `docker compose exec app ping postgres`.
- **Root cause:** `DB_HOST=localhost` set hai — localhost = khud ka container. Ya DB doosre network pe hai.
- **Fix:** Compose mein `DB_HOST: postgres` (service name); dono ko same custom network daalo.
- **Verify:** `docker compose exec app ping postgres` resolves + app connects.
- **Blast radius | Prevent:** Service names as hostnames + healthcheck-based `depends_on` — DB ready hone tak app wait kare.

### INC-206 · PR Conflict Blocks Pipeline

- **Situation:** CI pending kyunki PR me merge conflict.
- **Investigate:** `git status` (conflict files), `git log --oneline -5`.
- **Root cause:** Feature branch purani, main pe same files change hue.
- **Fix:**
```bash
git fetch origin && git rebase origin/main
# resolve conflicts manually
git add . && git rebase --continue && git push --force-with-lease
```
- **Verify:** PR conflict cleared, pipeline green.
- **Blast radius | Prevent:** Short-lived branches (<2 days), daily `git pull --rebase`.

---

## Interview Corner | Sawal-Jawab

**Q1: `depends_on` with `condition: service_healthy` kyu?** — Simple depends_on sirf start wait karta hai; healthy condition tab tak app wait kare jab tak DB packages ready nahi — "connection refused" startup errors bachte hain.

**Q2: Service name DNS kaise?** — Compose har service ko user-defined bridge network pe name se register karta hai → `DB_HOST=postgres` resolves to container IP. Sirf user-defined networks mein.

**Q3: ACR vs Docker Hub?** — Hub public; prod mein ACR/GHCR — private, RBAC, private endpoints, geo-replication, content trust. Azure se integrated.

**Q4: `latest` prod mein kyu nahi?** — Unpredictable, rollback mushkil. Semver/commit-SHA = specific, reproducible, rollback-friendly.

**Q5: `down` vs `down -v`?** — `down` sirf containers+networks; `-v` volumes bhi delete — data loss! Prod mein `-v` mat lagao.

---

## Quick Notes | Yaad Rakhna

- `docker compose` (space) = 2026 standard; `-compose` binary deprecated
- Service name = DNS — `DB_HOST=postgres`, never localhost
- `depends_on` + `service_healthy` = graceful startup order
- ACR prod registry: `az acr create` → `az acr login` → `docker push`
- Never `latest` in prod — commit-SHA/semver
- Custom networks = tier isolation (frontend/backend)
- `down -v` = data loss!
- Profiles: `--profile debug up` for optional tools