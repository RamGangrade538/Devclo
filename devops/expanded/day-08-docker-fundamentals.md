# Day 08 — Docker Fundamentals (DevClo Expanded)

## Overview | Parichay

Aaj se Phase 2 start — Docker + Azure. Docker ne DevOps ki duniya badal di; "meri machine pe chal raha hai" waali bahas khatam. Containers se app ka environment fix hota hai — laptop ho ya cloud. Aaj day ka focus: images, containers, layers, networking, volumes, aur 2026 ki latest changes.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Docker vs VM — containerization vs virtualization
- [ ] Docker architecture — CLI, daemon, images, containers, registry
- [ ] Image vs Container vs Layer — union FS, copy-on-write
- [ ] `docker run/logs/inspect/exec/stop/rm` + flags `-rm -it -d -p -v -e`
- [ ] Volumes vs bind mounts — data persistence
- [ ] Networking — bridge, host, none, user-defined
- [ ] HEALTHCHECK, restart policies, exit codes
- [ ] 2026 — rootless Docker, BuildKit default, Compose v2, docker scout, image signing

---

## Full Topic (LEARN) | Puri Detail

### 1. Container vs VM

| Feature | VM | Container |
|---------|-----|-----------|
| OS | Har ek ka Guest OS | Host kernel share |
| Size | GBs | MBs |
| Boot | Minutes | Seconds |
| Isolation | Strong (hypervisor) | Medium (process) |
| Portability | Hard | Anywhere chale |

**2026:** containerd Docker ka default runtime hai (Kubernetes bhi yahi use karta hai).

### 2. Docker Architecture

```
CLI → daemon (dockerd) → images/containers → registry (Hub/ACR/GHCR)
```

- **Image:** Read-only blueprint (recipe) ka layers stacked hota hai.
- **Container:** Image ka running instance (writable layer on top).
- **Registry:** Image store (Docker Hub public, ACR/GHCR private).
- **Layer:** Har Dockerfile instruction ek layer — cached hoti hai.

### 3. Core Commands

```bash
docker build -t myapp:1.0 .                 # image build
docker run -d -p 8080:80 --name web nginx   # detach + port map
docker run -it ubuntu bash                  # interactive shell
docker run --rm alpine echo "hi"            # auto-delete on exit
docker run -v /host/path:/app -e DB_HOST=x nginx  # bind mount + env
docker run -v mydata:/var/lib/mysql mysql   # named volume
docker ps / docker ps -a                    # running / all containers
docker stop/start/restart web               # lifecycle
docker logs -f --tail 100 web               # live logs
docker exec -it web bash                    # inside container
docker inspect web --format='{{.State.ExitCode}}'
docker system prune -a                      # nuclear cleanup
```

### 4. Volume vs Bind Mount

| Type | Jahan hai | Use Case |
|------|-----------|----------|
| Named Volume | `/var/lib/docker/volumes/` | DB data, persistent |
| Bind Mount | Host path | Dev hot-reload, config |
| tmpfs | RAM only | Secrets, temp |

```bash
docker volume create mydata
docker run -v mydata:/var/lib/mysql mysql
```

### 5. Networking

Container name = DNS name **only in user-defined networks**:

```bash
docker network create mynet
docker run -d --name db --network mynet postgres
docker run -d --name app --network mynet myapp
docker exec app ping db     # resolves! (default bridge pe nahi hota)
```

### 6. HEALTHCHECK & Restart Policies

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1
```

```bash
docker inspect --format='{{.State.Health.Status}}' web   # healthy/unhealthy
docker run -d --restart unless-stopped nginx  # no|always|unless-stopped|on-failure:N
```

### 7. Exit Codes

| Code | Matlab |
|------|--------|
| 0 | Success |
| 1 | App crash |
| 127 | Command not found |
| 137 | OOM killed (128+9) |
| 143 | SIGTERM (128+15) |

### 8. 2026 Updates

| Feature | Matlab |
|---------|--------|
| Rootless Docker | Bina root ke daemon — security best practice |
| BuildKit | Default builder — cache mounts, secrets |
| Compose v2 | `docker compose` (plugin), `-compose` binary deprecated |
| docker scout | SBOM + CVE scan built-in |
| Image signing | cosign-based content trust |

```bash
docker info | grep -i rootless
docker scout cves myapp:1.0          # scan CVEs
docker sbom myapp:1.0                # SBOM generate
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `docker build -t name:tag .` | Image build |
| `docker run -d -p 8080:80 nginx` | Run detached, port map |
| `docker run -it ubuntu bash` | Interactive shell |
| `docker run --rm alpine echo hi` | Run + auto-delete |
| `docker ps` / `docker ps -a` | Running / all containers |
| `docker logs -f container` | Live logs |
| `docker exec -it container bash` | Inside container |
| `docker stop/rm container` | Stop / delete |
| `docker rmi image` | Image delete |
| `docker system prune -a` | Clean everything unused |
| `docker inspect container` | Full metadata |
| `docker network create mynet` | User-defined network |
| `docker volume create mydata` | Named volume |
| `docker scout cves image` | Vulnerability scan |

---

## Practice Lab | Abhi Karein

**1. Project banao:** `mkdir docker-lab && cd docker-lab`

**2. `app.py` banao:** Flask app (`/` returns "Hello Docker!", `/health` returns "OK", bind `0.0.0.0:5000`), `requirements.txt` mein `flask==3.1.*`.

**3. Dockerfile:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

**4. Build:** `docker build -t flask-demo:1.0 .` → `docker images flask-demo` (expected ~130MB).

**5. Run + test:**
```bash
docker run -d -p 5000:5000 --name myflask flask-demo:1.0
curl http://localhost:5000        # Hello Docker!
docker logs myflask
docker exec -it myflask bash      # ls /app, whoami
```

**6. Volume (bind mount):** `docker run -d -p 5001:5000 -v $(pwd):/app --name myflask-dev flask-demo:1.0` — code changes live dikhenge.

**7. Networking:** `docker network create labnet`; run `postgres:16-alpine` + app on `labnet`; `docker exec app ping db` resolves.

**8. Health check:** `docker inspect --format='{{.State.Health.Status}}' myflask`.

**9. Cleanup:**
```bash
docker stop myflask myflask-dev db app && docker rm myflask myflask-dev db app
docker rmi flask-demo:1.0 && docker network rm labnet && docker system prune -f
```

---

## Incidents / Tickets | Real Practice

### INC-301 · Container Exits Immediately

- **Situation:** `docker run` kiya, but container turant band — `docker ps` mein nahi dikhta.
- **Investigate:** `docker ps -a`, `docker inspect <c> --format='{{.State.ExitCode}}'`, `docker logs <c>`.
- **Root cause:** Wrong ENTRYPOINT/CMD ya missing file (e.g., `CMD ["python","app.py"]` but `app.py` image mein copy hi nahi hua).
- **Fix:** Dockerfile mein `COPY . .` add/verify karke rebuild.
- **Verify:** `docker run -d` → `docker ps` Running → `curl` se 200.
- **Blast radius | Prevent:** CI mein `hadolint` Dockerfile lint + build test before push taaki deployed image hamesha run ho.

### INC-302 · Port Conflict

- **Situation:** `docker run -p 80:80 nginx` → "port is already allocated".
- **Investigate:** `sudo ss -lntp | grep :80` (kaun host process?) + `docker ps` (purana container?).
- **Root cause:** Host nginx/apache port 80 pe ya koi purana container bhi 80 map hai.
- **Fix:** `sudo systemctl stop nginx` ya `docker run -p 8080:80 nginx`.
- **Verify:** `curl http://localhost:8080` → nginx response.
- **Blast radius | Prevent:** Host port registry/documentation rakho; multi-container ke liye Compose use karo (ports conflict managed).

---

## Interview Corner | Sawal-Jawab

**Q1: Image aur Container mein farak?** — Image read-only blueprint (layers), container uska running instance with writable layer. Ek image se kitne bhi containers.

**Q2: CMD vs ENTRYPOINT?** — CMD override ho sakta hai `docker run img newcmd`; ENTRYPOINT fixed hai (sirf args add hote). Combo: `ENTRYPOINT ["python"]` + `CMD ["app.py"]`.

**Q3: Volume vs bind mount?** — Volume Docker-managed (`/var/lib/docker/volumes`), portable/backup-friendly. Bind mount host path — dev hot-reload, host dependency.

**Q4: Exit code 137?** — 128+9 = SIGKILL → OOM killed. Memory limit exceed (fix: `-m 512m` ya app memory).

**Q5: Rootless Docker kyun?** — Container compromise hone par attacker ko host root nahi milega. 2026 default recommendation.

---

## Quick Notes | Yaad Rakhna

- Image = blueprint, Container = running instance (writable layer)
- `-d` detach, `-p` port map, `-it` interactive, `-v` volume, `-e` env
- User-defined network mein container name = DNS (hamesha use karo)
- Exit 137 = OOM — memory debug karo
- 2026: BuildKit default, rootless recommended, docker scout for scanning
- `docker inspect` sabse useful debug command hai
- `docker system prune -a` = nuclear cleanup (careful!)