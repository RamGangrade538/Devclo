# Day 18 — Docker + ACR in Azure Pipelines (DevClo Expanded)

## Overview | Parichay

Day 9 ka multi-stage Docker knowledge ab pipeline me ghusega. Aaj tum CI ko **container-native** banate ho: code → lint/test → **docker build → Trivy scan → ACR push (commit-SHA tag)** → artifact. Ye image registry (ACR) aage CD ka fuel hai. Yahan ek hi rule hai: **`latest` kabhi prod ke liye nahi, har image ka unique karne wala tag (commit SHA) ho**. Isi din supply-chain security (SBOM, cosign) ki shuruaat bhi hogi.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] CI me docker build karo with BuildKit + caching
- [ ] ACR (Azure Container Registry) create/login push/pull karo
- [ ] **Service connection** se ACR login (SPN/Managed Identity/workload federation)
- [ ] Tagging karo: `$(Build.BuildId)`, commit SHA, semver — `latest` avoid
- [ ] Trivy scan pipeline me daalo (fail alta critical)
- [ ] SBOM generate + cosign signing (supply-chain security)
- [ ] Artifacts/downstream env me image pull karo
- [ ] ACR Tasks (registry-side build como alternativa) samjho
- [ ] Retention policy — image cleanup
- [ ] Universal Packages/feeds vs container registry fark samjho

---

## Full Topic (LEARN) | Puri Detail

### 1. Docker Build in Pipeline — Design

CI me dono wajah: (a) **build engine** — `docker buildx build` ke `--target` multi-stage se size small + fast; (b) **security** — signed/scanned image hi push. 2026 pattern: **BuildKit default**, `docker/buildx` task ya plain `docker` task, cache mount (`type=cache`).

```yaml
# .dockerignore (repo me) — context chhota karo, bacha vit hi context bheja
node_modules
.git
coverage
*.log
```

```yaml
# Pipeline steps — multi-stage build + tag
- task: Docker@2
  inputs:
    containerRegistry: 'acr-connection'        # service connection naam
    repository: 'devclo-api'
    command: 'build'
    Dockerfile: 'Dockerfile'
    buildContext: '.'
    tags: |
      $(Build.SourceVersion)          # commit SHA (short form)
      $(Build.BuildId)
    arguments: '--target runtime'     # multi-stage target select
```

### 2. ACR + Service Connection / Workload Identity

```bash
az group create --name devclo-rg --location eastus
az acr create --name devcloacr$RANDOM --resource-group devclo-rg --sku Basic \
  --admin-enabled false
az acr login --name devcloacr$RANDOM     # local dev login
# Pipeline ke liye: pehle service connection banao:
az acr status  --name devcloacr$RANDOM   # verify
az acr show --name devcloacr$RANDOM --query loginServer -o tsv   # loginServer value
```

**Service connection** = pipeline ↔ Azure service bridge. 2026 me **2 auth modes**:
- **Workload identity federation (recommended)** — SPN hota hai par koi long-lived secret nahi; short-lived OIDC tokens se federated credential. SPN secret expiry wala `INC-406` (Day 13) isi se solve hota hai.
- **Service principal (legacy)** — client secret; expiry + rotation pain.

Azure DevOps UI: Project Settings → Service connections → New → **Azure Container Registry** → workload identity → subscription + resource group select karo. `containerRegistry: 'acr-connection'` isi reference karta hai.

### 3. Tagging Strategy — `latest` Wale Trap Se Bacho

| Tag | Use-case | Kyon |
|-----|----------|------|
| `$(Build.SourceVersion)` (SHA) | **Unique + traceable** — kaunsa commit se woh image | "konsa code deploy hua" prove hota hai |
| `$(Build.BuildId)` | Unique monotonic ID, pipeline link | artifact ↔ run mapping |
| `$(Build.SourceBranchName)-sha` | env-level marker | environment tracking |
| semver (`1.4.2`) | release/customer version | changelog/support ke liye |
| `latest` | Local dev/practice sirf | Prod me "unknown what's inside" — never |

Har prod code ka asli proof: `git rev-parse --short HEAD` == image tag == deployed reference.

### 4. Trivy Scan in Pipeline — Supply-Chain Gate

```yaml
# Scan before push — fail on HIGH/CRITICAL
- task: TrivyTask@1
  inputs:
    imageRef: '$(ACR_LOGIN)/devclo-api:$(Build.SourceVersion)'
    severityThreshold: 'HIGH,CRITICAL'
    exitCode: '1'            # 1 = fail build agar HIGH+ mile
    ignoreUnfixed: 'false'
  displayName: 'Trivy image scan (gate)'
# ya 2026-latest: CLI se (better output control)
- script: |
    docker run --rm aquasec/trivy image \
      --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed \
      --format table "$(ACR_LOGIN)/devclo-api:$(Build.SourceVersion)"
  displayName: 'Trivy via CLI'
```

- **SBOM:** `trivy image --format cyclonedx -o sbom.json` → CycloneDX/SPDX format; upload karke evidence rakho.
- **Signing (cosign):** keyless nil-us pura — `cosign sign --key ...` registry par artifact attestation banaata hai; ACR par sign verify `cosign verify`. 2026: container supply-chain (SLSA level) interviews ka hot topic.

### 5. Push + Downstream Pull

```yaml
- task: Docker@2
  inputs:
    containerRegistry: 'acr-connection'
    repository: 'devclo-api'
    command: 'push'
    tags: $(Build.SourceVersion)
# CD (Day 19) me:
- task: Kubernetes@1 / HelmDeploy@0   # same ACR image reference lo
```

**ACR Tasks** (registry-side builds): YAML pipeline ki jagah ACR ko batao ki `build.yml` chalao — source commit par registry khud image banati hai. Useful jab registry hi single CI engine; par multi-stage/doorho gating ke liye pipeline better.

### 6. Retention + Package Feeds

- **ACR retention:** lifecycle policy se old images purge karo (cost control):
  ```bash
  az acr task create --name cleanup ...   # scheduled retention
  ```
- **Azure Artifacts Universal Packages** (jar/npm binaries) vs ACR (container images) — dono alag scopes. `PublishPipelineArtifact`/`PublishBuildArtifacts` task artifacts logs/tests ki jagah; Universal Packages distributable binaries ke liye.

---

## Sample Pipeline | Example YAML

```yaml
# azure-pipelines.yml — Day 18: docker build + scan + ACR push (commit-SHA tag)
# Hinglish comments. Copy-paste: change repo+ACR names.

trigger:
  branches:
    include: [main]

variables:
  ACR: 'devcloacr12.azurecr.io'        # apne ACR ka loginServer
  IMAGE_REPO: 'devclo-api'
  IMAGE_TAG: $(Build.SourceVersion)    # commit SHA tag

pool:
  vmImage: ubuntu-latest

steps:
- checkout: self

- script: docker version --format '{{.Server.Version}}'     # BuildKit present?
  displayName: 'Check docker'

- task: Docker@2
  displayName: 'Build image'
  inputs:
    containerRegistry: 'acr-connection'       # service connection (workload identity)
    repository: $(IMAGE_REPO)
    command: 'build'
    Dockerfile: 'Dockerfile'
    buildContext: '.'
    arguments: '--target runtime'             # multi-stage
    tags: '$(IMAGE_TAG)'

- script: |
    docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      aquasec/trivy image --severity HIGH,CRITICAL --exit-code 1 \
      "$(ACR)/$(IMAGE_REPO):$(IMAGE_TAG)" --ignore-unfixed
  displayName: 'Trivy scan (fail on HIGH/CRITICAL)'

- script: |
    docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      aquasec/trivy image --format cyclonedx \
      "$(ACR)/$(IMAGE_REPO):$(IMAGE_TAG)" > sbom.json
    ls -la sbom.json
  displayName: 'Generate SBOM'

- task: Docker@2
  displayName: 'Push to ACR'
  inputs:
    containerRegistry: 'acr-connection'
    repository: $(IMAGE_REPO)
    command: 'push'
    tags: '$(IMAGE_TAG)'

- script: |
    echo "### Image tagged for CD:"
    echo "$(ACR)/$(IMAGE_REPO):$(IMAGE_TAG)"
    echo "### Commit: $(Build.SourceVersion)"
  displayName: 'Output SHAtag'
```

**Chalao → expected:** build multi-stage se runtime image banti hai, Trivy HIGH/CRITICAL 0 milne par hi push hota hai (scan fail kiya to step red), ACR me `devclo-api:<sha>` registered, aur `az acr repository show-tags --name <acr> --repository devclo-api -o tsv` me SHA tag dikhta hai.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command/Task | Kaam |
|--------------|------|
| `az acr create --name <acr> --sku Basic` | ACR registry banao |
| `az acr login --name <acr>` | Registry se login (docker pull/push) |
| `az acr show --name <acr> --query loginServer -o tsv` | loginServer value nikalo |
| `az acr repository show-tags --name <acr> --repository <img>` | Tags verify |
| `az acr repository list --name <acr>` | Repos list |
| `docker buildx build --target runtime -t img:tag` | Multi-stage BuildKit build |
| `TrivyTask@1` / `trivy image --exit-code 1 --severity HIGH,CRITICAL` | Scan gate |
| `trivy image --format cyclonedx -o sbom.json` | SBOM generate |
| `cosign sign/verify` | Image sign/attest |
| `Docker@2 build/push` | Pipeline me build+push task |

---

## Practice Lab | Abhi Karein

1. Day 16 ka app lo + multi-stage `Dockerfile` (builder → runtime, non-root user) banao (Day 9 style).
2. ACR create karo: `az group create` + `az acr create --sku Basic --admin-enabled false`.
3. Azure DevOps me service connection banao (type: Azure Container Registry, **workload identity**) — name `acr-connection`.
4. Pipeline YAML copy karke `IMAGE_TAG`/`ACR` apne values se badlo; push karo.
5. Run dekho: build → Trivy scan → SBOM → push (agar scan red to step fail, image nahi push hoti).
6. Push hone ke baad `az acr repository show-tags` se us image ka **SHA tag** verify karo.
7. `<sha>` tag ka map banao: `git rev-parse HEAD` se milao — same SHA = same image (immutability prove karo).
8. Trivy ko dry-run: known vulnerable base image (`python:3.9-slim` simple) build karke scan par HIGH fail dekho.
9. SBOM file ko pipeline artifact ya separate storage me publish karo (evidence trail).
10. ACR me ek doosra tag `$(Build.BuildId)` bhi add karo, retention ke liye lifecycle policy socho/`az acr manifest list` dekho.
11. `latest` tag prod me kyun not: ek `latest` build karke agr CD wahi reference kare to kya galat hoga — notes me likho.
12. **Expected result:** CI scanned + SHA-tagged + ACR pushed; `docker run` se image start hoti hai; supply-chain trail (scan+SBOM) ready.

---

## Incidents / Tickets | Real Practice

### INC-507 · Docker Build Fails in Pipeline
- **Situation:** Local me `docker build` chalta hai, pipeline me `#20 [build 4/6] RUN npm install ...` par error: "could not resolve" / "failed to solve".
- **Investigate:**
  ```bash
  az pipelines runs log --id <runid> | grep -iE "error|failed to solve|RUN |step "
  # Dockerfile line mapping:
  grep -nE "RUN|COPY|FROM" Dockerfile
  docker build --progress=plain --no-cache -t img:diag . 2>&1 | tail -40   # local reproduce
  ```
- **Root cause:** Pipeline build context me **wrong path / .dockerignore missing → lock file cache miss** (network blip) ya RUN step me bi-base package registry unavailable; hota hai jab context me `node_modules` bhar raha hota hai (build slow + restore fail).
- **Fix:**
  - `.dockerignore` banao: `node_modules`, `.git`, logs.
  - Dependencies layer caching rakho: `COPY package*.json .` → `RUN npm ci` → phir `COPY . .` (Day 9 pattern).
  - Registry outcome ke liye `arguments: '--network host'`/buildx cache, nahi to buildKit parallel steps ke liye timeout badao.
- **Verify:** `docker build --no-cache` 2 baar → stable; pipeline rebuild green; image ACR me SHA tag ke saath.
- **Blast radius | Prevent:** Build fail = image nahi banti = CD blocked. Base image pin + lock file + `npm ci` + .dockerignore + reproducible builds (Day 17) — aur if registry slow, Azure Artifacts/private registry mirror. "Local chal raha hai" kabhi CI ka kayl nahi — CI ka meaning bhi reproducible environment hai.

### INC-508 · Artifact Missing on Download
- **Situation:** CD stage `DownloadPipelineArtifact@2` par "Artifact 'devclo-web' could not be found" error — hota hai jab build successfully gaya but artifact mimetype mismatch ya path galat.
- **Investigate:**
  ```bash
  az pipelines artifact list --run-id <runid> -o table     # publish queued? naam?
  az pipelines runs show --id <runid> --query '[stages[*].jobs[*].tasks[*]]' -o json
  grep -nE "PublishBuildArtifacts|PathtoPublish|ArtifactName" azure-pipelines.yml
  # workspace me path exist?
  find . -maxdepth 2 -type d           # 'dist' ya 'target' kahan bana?
  ```
- **Root cause:** `PathtoPublish: 'dist'` bata raha tha par build code ne output `dist/` me nahi, `build/` me banaya (script path mismatch); ya stage `dependsOn` galat → download stage **pehle** chal gaya artifact se pehle.
- **Fix:** Ontology ko bharoso ke saath set karo:
  ```yaml
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: '$(Build.SourcesDirectory)/dist'   # absolute path
      ArtifactName: 'devclo-web'
      publishLocation: 'Container'
  ```
  CD stage me `dependsOn: Build` likhna na bhoolo.
- **Verify:** Naya run → artifact publish log; `az pipelines artifact list` me name dikha; download stage exits 0.
- **Blast radius | Prevent:** Missing artifact = CD silent-single (deploys old/wrong version). Publish task se pehle path validation step (`test -d $(Build.SourcesDirectory)/dist`), artifact naming convention versioned (`devclo-web-$(Build.SourceVersion)`), aur CD download ko pipeline artifact (not build) se bind karo. Retention policy se bhi check: default 30 days, prod ke liye zyada rakhoge.

---

## Interview Corner | Sawal-Jawab

1. **Q: Multi-stage build pipeline me kyun?** A: Builder stage (deps/SDK) se runtime artifact nikalta hai — runtime image chhota (~100MB v/s 1GB), no build tools ka attack surface (distroless/non-root), cache-friendly layers. Dockerfile me `FROM` multiple, `--target` se CI me control.
2. **Q: Commit SHA tagging kyun, `latest` kyun nahi?** A: SHA = unique + immutable + traceable (git commit ↔ image ↔ deploy). `latest` mutable hota hai — kaunsa code nahi pata; prod rollback improbable. Practice me tag: sha + buildId + (semver for releases).
3. **Q: ACR login pipeline me kaise?** A: Service connection (workload identity federation — short-lived OIDC tokens, no long-lived SPN secrets, 2026-recommended). `azureCLI`/`Docker@2` task connection ko `containerRegistry:` me reference karta hai. Local: `az acr login`.
4. **Q: Trivy scan kiska kaam karta hai — pipeline me kahan?** A: Image banne ke **baad**, push se **pehle** — HIGH/CRITICAL vulnerabilities par build fail (exit code + severity threshold). Isse vulnerable image kabhi registry me nahi jaati. SBOM device se babu kib bias ko hamare surakshit karta hai.
5. **Q: Supply-chain security kya cover karta hai?** A: Scan (Trivy/Snyk) + SBOM (components list) + signing (cosign/SLSA) + pinned base + minimal runtime image. ACR/container registry tampered detection: cosign verify. Ye hi 2026 interviews ka "CI me security" block hai.

---

## Quick Notes | Yaad Rakhna

- Build → **scan gate** → push: vulnerable image kabhi ACR me nahi.
- Tag hamesha unique: **commit SHA/BuildId**; `latest` sirf local dev.
- Service connection = workload identity federation (no long-lived secrets).
- `.dockerignore` + layers order = fast + reliable build.
- SBOM + cosign = supply-chain evidence.
- ACR Tasks bhi ek option; pipeline gating ke liye behtar.
- Artifact publish path absolute, dependsOn set — INC-508 jaise misses se bacho.