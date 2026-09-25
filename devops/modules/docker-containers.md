# 🐳 Docker & Containers

> **Hinglish:** Docker app ko "**package with everything**" banata hai — jo tumhare laptop pe chalta hai, wahi production me bhi chalta hai. Containers halke, fast, isolated hain. Ye module Dockerfile, images, volumes, networks, compose, optimization aur security cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

**Container** = app + uski dependencies (libraries, runtime, config) ko ek portable package me bundle karna, jo **same OS kernel** share karta hai lekin processes isolated rakhta hai. Ye VM se isliye behtar hai — VM har cheez (OS bhi) bundle karta hai (bhari), container sirf app, use Package karne ke liye context hota hai.

**Docker** iska industry standard hai. `Dockerfile` = image banane ki recipe, `docker build` = image banao, `docker run` = container chalao, volumes = data persist, networks = containers connectivity, registries = images share, and `docker compose` = multi-container apps (app + db + redis) ek file me.

## 🟢 Beginner — Shuruaat yahan se

- `image` vs `container` — blueprint vs running instance.
- Basic commands: `build`, `run`, `ps`, `exec`, `logs`, `stop`, `rm`.
- Pehla Dockerfile: simple node/python app image banao.
- `docker compose` se 2-3 services (app+db) chalana.
- Volumes (`-v`) se data persist karna.

## 🟡 Intermediate — Ab production ka socho

- **Layer caching** — Dockerfile order = fast builds; `apt`/`npm` cache pehle.
- **Multi-stage builds** — build stage + slim runtime stage (size ghatao).
- **Networking** — bridge/host/custom networks, expose ports, `--network`.
- **Env vars & configs** — runtime config inject karo.
- **Compose networking** — services ek dusre ko service name se access karo.
- **Healthchecks** — `HEALTHCHECK` se container ki "ji huzoor" state.

## 🔴 Advanced — Pro bano

- **Image optimization** — minimize layers, distroless/alpine, size budget.
- **Container security** — run as non-root, read-only fs, `--cap-drop`, Trivy scan.
- **Image signing + provenance** — supply-chain trust.
- **Docker socket & security** — daemon mount risk samjho.
- **OCI concepts** — runtime spec, containerd, buildah/podman.
- **BuildKit & caching** — advanced build features.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Containers** — app + deps ka isolated bundle, OS kernel shared.
- [ ] **Images** — read-only template; containers iske copies hain.
- [ ] **Dockerfile** — image banane ki step-by-step recipe.
- [ ] **Docker build** — Dockerfile se image banana.
- [ ] **Docker run** — image se container start karna.
- [ ] **Docker networking** — containers apas me + bahar se connect ho.
- [ ] **Docker volumes** — data persist (container delete pe data bachao).
- [ ] **Container lifecycle** — create → start → run → stop → remove.
- [ ] **Container registries** — images share/pull ki jagah (GHCR/ACR).
- [ ] **Multi-stage builds** — build tools use karke runtime image slim.
- [ ] **Image optimization** — layers kam, size chhota, cache smart.
- [ ] **Container security** — non-root, read-only, vuln scanning.
- [ ] **Docker Compose** — multi-container app ek YAML me.
- [ ] **OCI concepts** — open standard for container images/runtime.
- [ ] **Layer caching** — unchanged steps reuse; fast incremental builds.
- [ ] **Entrypoint vs CMD** — kya process chale image start pe.
- [ ] **Docker exec** — running container ke andar command chalao.
- [ ] **Ports & EXPOSE** — kaunsa port bahar open hoga.
- [ ] **Healthcheck** — container "up/failed" state machine.
- [ ] **docker logs** — container ke andar ki output.
- [ ] **.dockerignore** — build context me junk na le jao.
- [ ] **Tags vs digests** — mutable tag vs immutable sha.
- [ ] **Docker volumes vs bind mounts** — docker-managed vs host path.
- [ ] **Container join/network isolation** — kam access = secure.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Docker Engine | Container runtime + CLI | Local dev + testing |
| Docker Compose | Multi-container local orchestration | Dev environments |
| Podman/Docker alternates | Rootless containers | Secure/no-socket environments |
| Hadolint | Dockerfile linter | Best-practice check |
| Trivy | Image vulnerability scanner | CI me security gate |
| Dive | Image layer inspector | Size/core analysis |
| BuildKit | Modern build engine | Fast parallelized builds |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First Image:** Node/Python hello app ka Dockerfile banao, build, run, port forward, logs dekho.
- [ ] **Lab 2 — Compose Stack:** app + redis/nginx compose me daalo, named volume lagao, restart karke data persist dekho.
- [ ] **Lab 3 — Slim It Down:** Apne image ka size dekh, multi-stage + chhote base se ghatana try karo (report before/after).
- [ ] **Lab 4 — Security Hardening:** Trivy se image scan karo, non-root user pe switch karo, read-only fs test karo.
- [ ] **Project — Micro App:** 3-container production-style app banao (proxy + app + db), healthchecks + networks segregated ke saath.

## 🔗 Related Topics

- [🚢 Kubernetes](../modules/kubernetes.md)
- [📦 Artifact & Package Management](../modules/artifact-package-management.md)
- [🛡️ DevSecOps](../modules/devsecops.md)
- [Containers vs VMs](../topics/containers-vs-vms.md)
- [Day 15 — Docker Fundamentals](../day-15-docker-fundamentals.md)
- [Day 16 — Docker Compose](../day-16-docker-compose-multicontainer.md)
- [Day 17 — Image Optimization & Security](../day-17-container-images-optimization.md)