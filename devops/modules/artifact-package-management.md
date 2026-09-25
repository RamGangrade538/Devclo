# 📦 Artifact & Package Management

> **Hinglish:** Build ke baad jo banti hai — jar, wheel, npm package, docker image — usko **store + version + distribute** karna hi artifact management hai. Ye content isliye zaroori hai kyunki har company ek "artifactory/nexus" chalati hai aur builds wahi se uthate hain.

## 📖 Overview — Ye Topic Kya Hai

Software ka build output **artifact** hota hai. Usse store karne ki jagah **artifact repository** (JFrog Artifactory, Sonatype Nexus, GitHub Packages) hai — jaise code ke liye Git, waise artifacts ke liye repo. Ye repo builds ko reproducible banata hai, immutable versions deta hai, aur dependency resolution me madad karta hai.

Docker images ka registry alag (DockerHub, GHCR, ACR/ECR), package repos alag (npm, PyPI, Maven Central) — sab "repositories" hain par format alag. Versioning (semver), artifact promotion (dev → stage → prod), immutable artifacts (kabhi overwrite nahi) — ye core ideas hain.

## 🟢 Beginner — Shuruaat yahan se

- Artifact vs source code — farak.
- apna **Maven/npm/pip** project kholo, dekorho deps kahan se aati hain.
- Simple artifact upload/download in GitHub Packages.
- DockerHub/GHCR se image push/pull.

## 🟡 Intermediate — Ab manage karo

- **Versioning (semver)** — `1.2.3`, how `^`, `~` prefix kaam karta hai.
- **Dependency resolution & lockfiles** — `package-lock.json`, `poetry.lock`.
- **Private repositories** — apne internal packages store karo.
- **Retention & cleanup** — purane artifacts hatao, storage save.
- **Promotion** — artifact ko dev→qa→prod "promote" karna (metadata toggle).

## 🔴 Advanced — Pro bano

- **Immutable artifacts** — same version dobara overwrite nahi; reproducibility.
- **Provenance & SBOM attach** — artifact ke saath dependencies ka list.
- **Signing** — artifacts sign karna, tampering detect.
- **Cache/proxy repos** — internet se deps coordinate karna.
- **Multi-repo strategy** — APT/YUM/Docker/Helm repos, remote-cache.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Artifact repositories** — build outputs store/version/distribute ki jagah.
- [ ] **Docker registries** — container images ki repo (GHCR, DockerHub, ACR/ECR).
- [ ] **Package repositories** — npm, Maven, PyPI, NuGet — language packages.
- [ ] **Versioning** — releases ki naming; `1.0.0`, `2.3.1-beta`.
- [ ] **Artifact promotion** — artifact ko environments ke beech bhejna (dev→prod).
- [ ] **Immutable artifacts** — ek baar push, dobara overwrite nahi — trust.
- [ ] **Dependency management** — deps kahan se, kaise lock hoti hain.
- [ ] **Semver (semantic versioning)** — `MAJOR.MINOR.PATCH` rules.
- [ ] **Range/prefix selectors** — `^1.0.0`, `~1.2`, `>=`.
- [ ] **Lockfiles** — pakka deps versions; reproducible builds.
- [ ] **Registry auth** — private repos ke liye tokens/credentials.
- [ ] **Retention policies** — purane/untouched artifacts clean karo.
- [ ] **Provenance** — artifact kahan se, kis commit se bana.
- [ ] **SBOM** — artifact ki dependency list (supply-chain visibility).
- [ ] **Artifact signing** — signature verify; trusted hi chale.
- [ ] **Homebrew/Helm charts** — app package formats (Helm = K8s packages).
- [ ] **Proxy/cache repos** — public deps ka local cache (fast + safe).
- [ ] **Maven coordinates** — `group:artifact:version` — kya kahin se milega.
- [ ] **npm / PyPI packaging** — package.json / setup.py ke basics.
- [ ] **Docker manifest/tag immutability** — tags vs digests (`sha256:`).
- [ ] **CI/CD me artifacts** — build → publish → consume in deploy stage.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| JFrog Artifactory | Universal artifact repo | Multi-format enterprise |
| Sonatype Nexus | Universal repo manager | Self-hosted, stable |
| GitHub Packages | In-repo packages | GitHub ecosystem |
| Docker Hub / GHCR / ACR / ECR | Container registries | Images store/distribute |
| npm, Maven, PyPI, NuGet | Language registries | Packages resolve karne ke liye |
| Helm (chartmuseum) | K8s package repo | Charts distribute karne ke liye |
| sigstore/cosign | Signing + provenance | Artifacts ko sign karna |
| syft/grype | SBOM + vuln scan | Artifacts ki deps list + scan |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Publish to GitHub Packages:** Ek tiny npm/python package banao, GitHub Packages pe publish karo, install karke use karo.
- [ ] **Lab 2 — Docker Registry Flow:** Image banao, GHCR/ACR pe push karo, digest note karo, saat `pull` karke verify karo.
- [ ] **Lab 3 — Retention + Cleanup:** Purane tags delete karna seekho; retention policy set karo.
- [ ] **Lab 4 — Lockfile Story:** `npm install` se lockfile banao, setup from scratch me reproducibly install hote dekh.
- [ ] **Project — CI Publish Pipeline:** CI me build → version bump → sign → push → SBOM generate ka flow banao.

## 🔗 Related Topics

- [⚙️ CI/CD](../modules/cicd.md)
- [🐳 Docker & Containers](../modules/docker-containers.md)
- [📜 Software Supply Chain Security](../modules/supply-chain-security.md)
- [🔀 Git & Version Control](../modules/git-version-control.md)
- [Helm — K8s Package Manager](../topics/helm-charts.md)
- [Day 11 — Build Tools (Maven & Gradle)](../day-11-build-tools-maven-gradle.md)
- [Day 12 — Artifact Management](../day-12-artifact-management-and-repositories.md)