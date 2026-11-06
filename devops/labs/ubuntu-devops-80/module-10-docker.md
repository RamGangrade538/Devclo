# Module 10 — Docker

> **Hinglish:** Docker app ko uske dependencies ke saath ek box (container) me pack karta hai — "mere laptop pe chalta tha" problem khatam. Is module me install, run, inspect, build, volume, network, env, compose, aur troubleshooting seekhoge.

**Prerequisite:** Ubuntu VM (recommended), internet, `sudo`.
**Safety:** `docker` group membership root ke barabar powerful hai. Unknown images/containers production pe mat chalao. `docker system prune` destructive ho sakta hai — pehle `-a`/`--volumes` ka effect samjho.

---

## Task 62: Install and Verify Docker

**Scenario:** Ubuntu pe official Docker Engine install karo (snap nahi), service enable karo, aur hello-world se verify karo.

**Command plan:**
```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run hello-world
sudo usermod -aG docker "$USER"
newgrp docker
docker run hello-world
docker version
docker compose version
```

**Verification:**
- Dono `hello-world` runs "Hello from Docker!" print karein.
- `docker version` me Client + Server version dikhe.
- `docker compose version` plugin version dikhaye.
- `docker info` bina permission error ke chale.

**Troubleshoot:** `permission denied /var/run/docker.sock` = group change ke baad logout/login (ya `newgrp docker`). `Cannot connect` = `sudo systemctl status docker`. Official docs apne Ubuntu version ke liye verify karo — commands version-dependent hain.

---

## Task 63: Run Your First Container

**Scenario:** Nginx container ko port 8080 pe expose karo aur HTTP response verify karo. Host pe nginx install kiye bina.

**Command plan:**
```bash
docker run -d --name devclo-nginx -p 8080:80 nginx:alpine
docker ps
docker port devclo-nginx
curl -I http://localhost:8080/
curl -sS http://localhost:8080/ | head -n 5
```

**Verification:**
- `docker ps` me container `Up` state me ho, port `0.0.0.0:8080->80/tcp`.
- `curl -I` me `HTTP/1.1 200 OK` aaye.
- HTML me "Welcome to nginx!" dikhe.
- Host pe port 80 use nahi hua.

**Note:** `-d` detached, `-p host:container`, `--name` fixed naam. Container band: `docker stop devclo-nginx`; delete: `docker rm devclo-nginx`.

---

## Task 64: Inspect Containers and Images

**Scenario:** Container chal raha hai par behaviour samajhna hai — logs, config, image layers, aur resource usage dekho.

**Command plan:**
```bash
docker ps
docker ps -a
docker logs --tail 20 devclo-nginx
docker inspect devclo-nginx | head -n 40
docker inspect -f '{{.State.Status}} {{.NetworkSettings.IPAddress}}' devclo-nginx
docker image ls
docker image history nginx:alpine | head -n 15
docker stats --no-stream devclo-nginx
```

**Verification:**
- `docker logs` me nginx access/error logs dikhein.
- `docker inspect` JSON me image, state, network, mounts ho.
- `image history` layers + sizes dikhaye.
- `docker stats` CPU/memory/network usage dikhaye.

**Note:** `docker inspect` ka `-f` Go template powerful hai. `docker stats --no-stream` ek snapshot deta hai (live ke liye `--no-stream` hatao).

---

## Task 65: Build a Docker Image

**Scenario:** Apni static website ka Docker image banao. Dockerfile likho, build karo, run karo, aur custom response verify karo.

**Command plan:**
```bash
mkdir -p ~/devops-lab/docker-app
cd ~/devops-lab/docker-app
cat > index.html <<'EOF'
<!doctype html>
<html><head><title>DevClo Docker</title></head>
<body><h1>Built with Docker</h1><p>Image: devclo-web:v1</p></body></html>
EOF
cat > Dockerfile <<'EOF'
FROM nginx:alpine
LABEL maintainer="devclo-lab"
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
EOF
docker build -t devclo-web:v1 .
docker image ls devclo-web:v1
docker run -d --name devclo-web -p 8081:80 devclo-web:v1
sleep 1
curl -sS http://localhost:8081/ | grep 'Built with Docker'
docker inspect -f '{{.State.Health.Status}}' devclo-web
```

**Verification:**
- `docker build` successfully complete ho.
- `devclo-web:v1` image list me dikhe.
- `curl` custom HTML me "Built with Docker" dikhaye.
- Health status `healthy` (thoda time lag sakta hai).

**Note:** Layer caching ke liye rarely-changing steps upar rakho. `COPY . .` se pehle `.dockerignore` banao (`.git`, `node_modules`, logs, secrets). Base image tag pin karo.

---

## Task 66: Persistent Volumes

**Scenario:** Container delete hone ke baad bhi data bacha rahe. Bind mount use karke lab directory ko nginx ke web root pe mount karo.

**Command plan:**
```bash
mkdir -p ~/devops-lab/docker-data
cat > ~/devops-lab/docker-data/index.html <<'EOF'
<h1>Persistent data survives container restart</h1>
EOF
docker run -d --name devclo-volume -p 8082:80 -v ~/devops-lab/docker-data:/usr/share/nginx/html:ro nginx:alpine
sleep 1
curl -sS http://localhost:8082/
docker rm -f devclo-volume
docker run -d --name devclo-volume-2 -p 8082:80 -v ~/devops-lab/docker-data:/usr/share/nginx/html:ro nginx:alpine
sleep 1
curl -sS http://localhost:8082/
docker inspect -f '{{json .Mounts}}' devclo-volume-2
```

**Verification:**
- Pehle aur doosre container dono me same custom HTML dikhe.
- Container delete karne ke baad bhi host file maujood ho.
- `docker inspect` me mount source/destination + `ro` mode dikhe.

**Note:** Bind mount host path ko container me jodta hai. Named volume (`-v devclo-data:/data`) Docker-managed hota hai. Database data ke liye volumes use karo, container filesystem ke bharose mat raho.

---

## Task 67: Container Networking

**Scenario:** Do containers ko ek custom network pe chalao taaki wo naam se ek doosre ko reach kar sakein (service discovery).

**Command plan:**
```bash
docker network create devclo-net
docker run -d --name devclo-net-web --network devclo-net nginx:alpine
docker run --rm --network devclo-net alpine:3.20 sh -c 'wget -qO- http://devclo-net-web | head -n 3'
docker network inspect devclo-net
docker network ls
```

**Verification:**
- `docker network inspect` me dono containers attached hon.
- Alpine container `devclo-net-web` ko hostname se reach kare aur nginx HTML laaye.
- `docker network ls` me `devclo-net` bridge network dikhe.

**Note:** Default bridge network me automatic DNS resolution nahi hota; user-defined network me container name = DNS name. Production me service discovery ke liye custom networks/compose use karo.

---

## Task 68: Environment Variables

**Scenario:** App ko environment (`staging`/`production`) container ko runtime pe batao — image ke andar hardcode na karo.

**Command plan:**
```bash
docker run --rm -e APP_ENV=staging -e APP_PORT=8080 alpine:3.20 sh -c 'echo "env=$APP_ENV port=$APP_PORT"'
docker run -d --name devclo-env -e APP_ENV=staging nginx:alpine
docker exec devclo-env printenv APP_ENV
docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' devclo-env | grep APP_ENV
docker exec devclo-env sh -c 'echo "runtime=$APP_ENV"'
```

**Verification:**
- `--rm` run `env=staging port=8080` print kare.
- `docker exec ... printenv` = `staging`.
- `docker inspect` me `APP_ENV=staging` dikhe.
- Image ke andar value hardcoded na ho (run-time se aayi).

**Note:** Env vars `docker inspect` me plaintext dikhte hain — **secrets ke liye mat use karo**. Secrets ke liye Docker secrets / vault / cloud secret manager. `.env` file compose ke saath use kar sakte ho, par git me commit na karo.

---

## Task 69: Docker Compose

**Scenario:** Multi-container app (nginx + redis) ko ek YAML file se launch karo. `docker compose` se lifecycle manage karo.

**Command plan:**
```bash
mkdir -p ~/devops-lab/compose-lab
cd ~/devops-lab/compose-lab
cat > compose.yaml <<'EOF'
services:
  web:
    image: nginx:alpine
    ports:
      - "8083:80"
    depends_on:
      - cache
  cache:
    image: redis:7-alpine
    command: ["redis-server", "--save", "", "--appendonly", "no"]
EOF
docker compose up -d
docker compose ps
sleep 1
curl -I http://localhost:8083/
docker compose exec cache redis-cli ping
docker compose logs --tail 20
docker compose down
docker compose ps
```

**Verification:**
- `docker compose ps` me `web` aur `cache` dono `running` hon.
- `curl -I localhost:8083` = `200 OK`.
- `redis-cli ping` = `PONG`.
- `docker compose down` ke baad containers gone, network removed.

**Note:** Compose project name directory se aata hai. `depends_on` sirf start order hai, readiness nahi — healthchecks better hain. Production me `restart:` policy, resource limits, aur pinned image tags add karo.

---

## Task 70: Container Troubleshooting

**Scenario:** Container start hoke turant exit ho raha hai. Exit code, logs, aur config inspect karke root cause nikalo — blind restart mat karo.

**Command plan:**
```bash
docker run --name devclo-broken alpine:3.20 sh -c 'echo "starting"; echo "fatal: config missing" >&2; exit 3'
docker ps -a --filter name=devclo-broken
docker inspect -f 'status={{.State.Status}} exit={{.State.ExitCode}} error={{.State.Error}}' devclo-broken
docker logs devclo-broken
docker inspect devclo-broken | grep -A5 -i 'state'
docker run --name devclo-bad-image devclo-web:does-not-exist; echo "run_exit=$?"
docker rm -f devclo-broken 2>/dev/null || true
docker rm -f devclo-bad-image 2>/dev/null || true
```

**Verification:**
- Broken container `Exited (3)` state me ho.
- `docker logs` me "fatal: config missing" dikhe.
- `docker inspect` me `exit=3`, `error=` blank/clear ho.
- Missing image run non-zero exit + pull error de.

**Debug checklist:**
1. `docker ps -a` — exit code dekho (137 = OOM/kill, 127 = command not found, 126 = permission).
2. `docker logs <name>` — app error.
3. `docker inspect` — `State.Error`, `Config.Env`, `Mounts`, `Cmd`.
4. `docker events` / `docker stats` — live behavior.
5. Port conflict = `docker port` + `ss -tlnp`.
6. OOM = `docker inspect -f '{{.State.OOMKilled}}' <name>`.

---

## Module 10 Done — Checklist

- [ ] Docker official repo se install + verify kiya.
- [ ] Nginx container run + HTTP verify kiya.
- [ ] Containers/images inspect kiye.
- [ ] Custom Dockerfile se image build kiya.
- [ ] Bind mount se data persist kiya.
- [ ] Custom network pe containers connect kiye.
- [ ] Env vars runtime pe pass kiye.
- [ ] Docker Compose se multi-container app chalaya.
- [ ] Failing container ka exit code/logs se root cause nikala.

**Next:** [Module 11 — Azure](module-11-azure.md)
