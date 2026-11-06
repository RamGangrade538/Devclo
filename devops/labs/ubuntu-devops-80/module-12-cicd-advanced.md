# Module 12 — CI/CD and Advanced DevOps

> **Hinglish:** Ab automation ka final step: code push hote hi test/build ho, Docker image publish ho, aur server pe deploy ho — bina manually SSH kiye. End me ek capstone jo poora pipeline prove karega.

**Prerequisite:** Modules 1-11, GitHub repo, Docker, ek Linux test server (Azure VM ya local VM).
**Safety:** CI secrets ko repo me kabhi commit na karo. Production deploy ke liye environment protection/approval use karo.

**Setup:** Apne Git repo me app aur workflows add karo:
```bash
cd ~/devops-lab/git-lab
mkdir -p .github/workflows docker-app
cp ~/devops-lab/docker-app/Dockerfile ~/devops-lab/docker-app/index.html docker-app/
cp ~/devops-lab/scripts/*.sh scripts/ 2>/dev/null || true
git add .github docker-app scripts
git status
```

---

## Task 77: Build a GitHub Actions Pipeline

**Scenario:** Har push/PR pe shell scripts ka syntax aur lint check ho — galat script main branch me na jaye.

**Command plan:**
```bash
cd ~/devops-lab/git-lab
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  shell-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install shellcheck
        run: sudo apt-get update && sudo apt-get install -y shellcheck

      - name: Bash syntax check
        run: |
          find . -name '*.sh' -not -path './.git/*' -print0 |
            while IFS= read -r -d '' f; do
              echo "bash -n $f"
              bash -n "$f"
            done

      - name: ShellCheck
        run: |
          find . -name '*.sh' -not -path './.git/*' -print0 |
            xargs -0 shellcheck
EOF
git add .github/workflows/ci.yml
git commit -m "Add CI workflow for shell scripts"
git push
```

**Verification:**
- GitHub → **Actions** tab me `CI` workflow run dikhe.
- Run green ho (ya intentional lint error par red, taaki pata chale pipeline kaam karta hai).
- `git push` ke baad workflow automatically trigger ho.
- PR open karne pe bhi workflow chale.

**Troubleshoot:** Workflow run hi na ho = YAML indentation/path galat (`on:` key). ShellCheck warning = `shellcheck -x`/severity tune karo, warning ko ignore karne ke liye `# shellcheck disable=SC...` (justified ho tab). `permissions: contents: read` least privilege hai.

---

## Task 78: Build and Publish a Docker Image

**Scenario:** Main branch pe merge hone par Docker image build ho aur GitHub Container Registry (GHCR) me publish ho — versioned tag ke saath.

**Command plan:**
```bash
cd ~/devops-lab/git-lab
cat > .github/workflows/docker-publish.yml <<'EOF'
name: Build and Publish Image

on:
  push:
    branches: [main]
    tags: ["v*"]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=tag
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./docker-app
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
EOF
git add .github/workflows/docker-publish.yml
git commit -m "Publish Docker image to GHCR"
git push
```

**Verification:**
- Actions me `Build and Publish Image` run green ho.
- GitHub profile → **Packages** me image dikhe.
- Tags me `main`, `sha-<commit>`, aur `latest` hon.
- Local se pull karo:
  ```bash
  docker pull ghcr.io/<owner>/<repo>:latest
  docker run --rm -p 8085:80 ghcr.io/<owner>/<repo>:latest
  curl -I http://localhost:8085/
  ```

**Note:** GHCR image name lowercase hona chahiye. `${{ github.repository }}` me uppercase ho to workflow me lowercase step add karo:
```yaml
- name: Lowercase image name
  run: echo "IMAGE_NAME=${GITHUB_REPOSITORY,,}" >> "$GITHUB_ENV"
```
Public package ke liye pull bina login ke ho sakta hai; private ke liye `docker login ghcr.io -u <user> -p <PAT>` (read:packages). `GITHUB_TOKEN` action ke andar automatic hai — PAT ki zaroorat nahi.

---

## Task 79: Automate Deployment

**Scenario:** CI image publish hone ke baad test server pe automatically deploy ho — pull, old container replace, health check. Secrets GitHub me rakho, workflow me nahi.

**Command plan:**
```bash
cd ~/devops-lab/git-lab
cat > .github/workflows/deploy.yml <<'EOF'
name: Deploy to Test Server

on:
  workflow_run:
    workflows: ["Build and Publish Image"]
    types: [completed]
  workflow_dispatch:

permissions:
  contents: read
  packages: read

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -euo pipefail
            IMAGE="ghcr.io/${{ github.repository }}:latest"
            docker pull "$IMAGE"
            docker stop devclo-web 2>/dev/null || true
            docker rm devclo-web 2>/dev/null || true
            docker run -d --name devclo-web --restart unless-stopped -p 8080:80 "$IMAGE"
            sleep 2
            curl -fsS http://localhost:8080/ >/dev/null
            echo "Deploy OK: $IMAGE"
EOF
git add .github/workflows/deploy.yml
git commit -m "Add automated deployment workflow"
git push
```

**GitHub secrets setup:**
- `DEPLOY_HOST` = test server IP/hostname
- `DEPLOY_USER` = SSH user
- `DEPLOY_SSH_KEY` = private key (deploy key), **not** your personal key
- Server pe Docker installed ho; GHCR private ho to `docker login` configured ho.

**Verification:**
- `Build and Publish Image` success ke baad `Deploy to Test Server` trigger ho.
- Server pe `docker ps` me naya `devclo-web` container `Up` ho.
- `curl http://<server-ip>:8080/` app response de.
- Deploy fail ho to Actions logs me SSH/health-check line dikhe.

**Note:** Third-party actions ko version/SHA pin karo. Production me `latest` ki jagah immutable SHA tag deploy karo, approval environment lagao, aur rollback ke liye previous image tag rakho. Deploy key ko sirf required server tak restrict karo.

---

## Task 80: End-to-End Capstone

**Scenario:** Ek application ko build, test, containerize, Azure pe deploy, monitor, aur document karo. Ye tumhara portfolio project hai — interview me end-to-end explain karna.

**Deliverables:**
```text
devclo-capstone/
├── app/                 # static app ya small API
├── docker-app/
│   ├── Dockerfile
│   └── index.html
├── scripts/
│   ├── deploy.sh
│   └── health-report.sh
├── .github/workflows/
│   ├── ci.yml
│   ├── docker-publish.yml
│   └── deploy.yml
├── docs/
│   ├── architecture.md
│   ├── runbook.md
│   └── screenshots/
└── README.md
```

**Command plan (phase-wise):**
```bash
# 1) Repo + app
mkdir -p ~/devops-lab/capstone && cd ~/devops-lab/capstone
git init -b main
mkdir -p app docker-app scripts docs/screenshots .github/workflows
cp ~/devops-lab/docker-app/{Dockerfile,index.html} docker-app/
cp ~/devops-lab/scripts/{deploy.sh,health-report.sh,server-health.sh} scripts/ 2>/dev/null || true
printf '# DevClo Capstone\n\nEnd-to-end DevOps project: CI -> image -> deploy -> monitor.\n' > README.md
git add . && git commit -m "Initialize capstone project"

# 2) CI: shell checks + docker build (module 12 workflows copy karo)
# 3) Image publish to GHCR (Task 78)

# 4) Azure infra
RG=devclo-capstone-rg
LOC=eastus
VM=devclo-capstone-vm
az group create -n "$RG" -l "$LOC"
az vm create -g "$RG" -n "$VM" \
  --image Ubuntu2204 --admin-username azureuser \
  --generate-ssh-keys --size Standard_B1s --public-ip-sku Standard
az vm open-port -g "$RG" -n "$VM" --port 8080 --priority 110
PUBLIC_IP=$(az vm show -d -g "$RG" -n "$VM" --query publicIps -o tsv)

# 5) Server bootstrap (Docker)
ssh "azureuser@$PUBLIC_IP" 'sudo apt update && sudo apt install -y ca-certificates curl && curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker azureuser'
# logout/login ya newgrp ke baad Docker use karo

# 6) Deploy via GitHub Actions (Task 79) with secrets:
#    DEPLOY_HOST=$PUBLIC_IP, DEPLOY_USER=azureuser, DEPLOY_SSH_KEY=<deploy private key>

# 7) Verify
curl -I "http://$PUBLIC_IP:8080/"
ssh "azureuser@$PUBLIC_IP" 'docker ps; docker logs --tail 20 devclo-web; df -h /; free -h'

# 8) Monitor
az monitor metrics list --resource "$(az vm show -g "$RG" -n "$VM" --query id -o tsv)" \
  --metric "Percentage CPU" --interval PT5M --aggregation Average -o table

# 9) Document + cleanup
git add docs README.md && git commit -m "Add architecture and runbook"
git push -u origin main
az group delete -n "$RG" --yes --no-wait
```

**Acceptance criteria (sab tick hone chahiye):**
- [ ] `git push` se CI workflow automatically chale aur green ho.
- [ ] Docker image GHCR me immutable tag ke saath publish ho.
- [ ] Deploy workflow image ko test server pe pull karke container replace kare.
- [ ] Public URL se app response mile (`200 OK`).
- [ ] Health check fail ho to deploy job fail ho (silent failure na ho).
- [ ] Rollback runbook me previous image tag ke saath likha ho.
- [ ] Monitoring screenshot + CPU metric evidence docs me ho.
- [ ] Azure resources cleanup ho gaye (`az group exists` = false).
- [ ] README me architecture diagram, setup steps, aur troubleshooting ho.

**Runbook me ye likho:**
1. Deploy kaise hota hai (push → CI → image → deploy).
2. Health check kaise verify kare (`curl`, `docker ps`).
3. Rollback kaise kare (previous SHA image pull + run).
4. Common failures (SSH, GHCR auth, port, NSG) aur fix.
5. Cost/cleanup steps.

**Note:** Capstone ka goal perfect app nahi — **reliable pipeline + evidence + documentation** hai. Screenshots, workflow run links, aur runbook interview me sabse zyada value dete hain.

---

## Module 12 Done — Checklist

- [ ] CI workflow push/PR pe chalta hai.
- [ ] Docker image GHCR me publish hoti hai.
- [ ] SSH-based automated deploy kaam karta hai.
- [ ] Deploy health check ke bina success nahi hota.
- [ ] Capstone ke saare acceptance criteria complete hain.
- [ ] Azure resources cleanup kiye.

**Roadmap complete!** Ab apna capstone repo, CI run links, aur runbook portfolio me rakho.
