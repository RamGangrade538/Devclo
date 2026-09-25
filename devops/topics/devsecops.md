# Deep Dive: DevSecOps — Shift-Left Security (SAST, DAST, SCA, SBOM, Secrets, Supply Chain)

> **Standalone deep dive:** DevSecOps = security ko **development ke har stage** me le ana — pipeline gate banake, OS/mainframe alag nahi. "Security sabka kaam" — shift-left philosophy.

---

## 1. DevSecOps — What and Why

**Traditional Security ("Shifting Right"):**
```
[Dev] → [Build] → [Test] → [Stage] → [Prod] → 🔒 Security (bahut late!)
                                            ↑
                                      Vulnerabilities yahan milti hain
                                      → fix = costly + slow
```

**DevSecOps ("Shift-Left"):**
```
🔒Scout  🔒Lint     🔒Scan    🔒Test    🔒Deploy    🔒Monitor
[Dev] → [Build] → [Test] → [Stage] → [Prod] → [Runtime]
   ↑       ↑         ↑        ↑         ↑          ↑
 SCA/     SAST     DAST     Image    Infra      Runtime
 pipes    secrets   +SAST   scan     scan       scanning
          leak                +sign    (Trivy)   (Trivy
                                          on k8s)
```
**Benefits:** Bugs jaldi fail (cheap to fix) · Compliance built-in · Auditable supply chain · Security team = enabler not blocker.

---

## 2. Security Tools Map (Jo kab use karna hai)

| Stage | Category | Tools | What it finds |
|-------|----------|-------|---------------|
| **IDE** | Lint/SAST | Snyk Code, SonarLint, Semgrep | Bugs in code as you type |
| **Commit** | Secret scanning | gitleaks, trufflehog | Hardcoded passwords/tokens |
| **CI (code)** | SAST | SonarQube, Semgrep, Checkmarx, Snyk | Code vulnerabilities (SQLi, XSS) |
| **CI (deps)** | SCA | Snyk, OWASP Dependency-Check, Trivy, Grype | Vulnerable libraries, licenses |
| **CI (container)** | Image scan | Trivy, Anchore, Grype, Docker Scout | OS+app image CVEs |
| **Test** | DAST | OWASP ZAP, Burp Suite, Acunetix | Runtime bugs (SQLi, auth bypass) |
| **IaC** | SCA/kics | Checkov, tfsec, KICS | Misconfig Infra (open SGs) |
| **Runtime** | Continuous scan | Trivy-operator, Sysdig, Falco | Runtime anomalies, drift |
| **Supply chain** | Signing/SBOM | cosign, syft, Dependabot/SLSA | Provenance, tamper, license |

**Rule-of-thumb 80/20:** Trivy (image+FS+deps) + gitleaks (secrets) + Checkov (IaC) + Semgrep/SonarQube (SAST) + ZAP (DAST) + cosign/syft (supply chain) covers 90% of teams.

---

## 3. SAST vs SCA vs DAST — Clear Difference

| | **SAST** | **SCA** | **DAST** |
|--|---------|---------|-----------|
| **Kya check** | Aapka source code | Third-party dependencies | Running app (go-cli) |
| **Kab** | Static — code pe (early) | Build/CI (deps resolve) | Runtime (deployed) |
| **Kaise** | Parse AST, taint analysis | Compare lock files → CVE DBs | Send malicious requests |
| **False positives** | Medium | Low | Medium |
| **Coverage** | Only app code | Libraries/transitive deps | Live behavior, auth flows |
| **Example find** | Unescaped SQL → SQLi | `log4j <= 2.14` → RCE | CRUD auth bypass |
| **Fixing cost** | Cheapest (early) | Medium | Costliest (late) |

**Trinity in pipeline:** SAST (code) + SCA (deps) + DAST (runtime) — teeno zaroori.

---

## 4. Secret Scanning — gitleaks

```bash
# Install
go install github.com/gitleaks/gitleaks/v8@latest   # or brew/docker

# Scan repo (local)
gitleaks detect --source . --verbose

# Scan only diff (pre-commit style)
gitleaks protect --staged --verbose

# Pre-commit hook — block secrets
cat .pre-commit-config.yaml
```
```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```
```yaml
# gitleaks.toml — custom rules (Azure creds example)
[[rules]]
id = "azure-storage-key"
description = "Azure Storage Account Key"
regex = '''(?i)(accountkey|account_key)\s*[:=]\s*["']?[a-zA-Z0-9+/=]{88}'''
secret-group = 1
```

**Industry standard:** GitHub secret scanning + push protection (free), GitLab secret detection, gitleaks in CI gate.

---

## 5. Container Image Scanning — Trivy (Star-Standard)

```bash
# Scan image
trivy image myapp:1.0.0

# Scan with severity/gates
trivy image --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed myapp:1.0.0

# Scan filesystem (app deps, not container)
trivy fs ./app --severity CRITICAL

# Scan repo (deps + misconfig)
trivy repo <github-url>

# Scan Kubernetes cluster
trivy k8s cluster

# SBOM generation
trivy image --format cyclonedx --output sbom.cdx.json myapp:1.0.0
```

**CI gate example (GitHub Actions):**
```yaml
- name: Trivy Scan
  run: |
    trivy image --severity HIGH,CRITICAL \
      --exit-code 1 --ignore-unfixed ${{ env.IMAGE }}
```

**Vulnerability triage reality:**
```
Base OS CVEs → aur update distroless/ubi-minimal
App deps CVEs → e.g. log4j 2.16 → upgrade ASAP
Transitive deps → SCA/policy engine
```
**Note:** 1000s of base-image CVEs dikhenge. Gate only on **critical/high + exploitable** (use `--vuln-type os,library` and `--ignore-status wontfix`).

---

## 6. IaC Scanning — Checkov (Misconfig)

```bash
# Scan Terraform/Azure
checkov -d . --framework terraform

# Specific directory with bc (Bicep/Azure ARM)
checkov --directory . --framework terraform,bicep
```

**Checkov catches:**
```
- Storage account: allow_blob_public_access = true  → FAIL
- NSG rule: access = Allow + source = 0.0.0.0/0     → FAIL
- VM: no diagnostics settings                      → FAIL
- AKS: RBAC disabled, no network_policy            → FAIL
- Key Vault: disable_public_network_access = false → FAIL
```

```bash
# CI gate
checkov -d . --skip-check CKV_AZURE_1 --quiet --compact --soft-fail
```
**Practice:** Terraform plan → `terraform plan -out=plan.tfplan` → `checkov -f plan.tfplan`.

---

## 7. SBOM & Software Supply Chain — syft + cosign + SLSA

**SBOM (Software Bill of Materials) = "what's inside" list.**
```bash
# Generate SBOM (SPDX/CycloneDX)
syft myapp:1.0.0 -o spdx-json > sbom.spdx.json
syft dir:./app -o cyclonedx-json > sbom.cdx.json

# Verify image signature
cosign verify --key cosign.pub myapp:1.0.0

# Sign image in CI (Keyless — OIDC, no keys to store!)
cosign sign ghcr.io/myorg/myapp:1.0.0

# Attach SBOM + scan attestation to image
cosign attest --predicate sbom.spdx.json --type spdx ghcr.io/myorg/myapp:1.0.0
```

**Supply Chain Threats (SolarWinds/3CX style):**
```
Dependency confusion → pin exact versions + private registry
Typo-squatting          → scan deps, provenance
Compromised CI runner   → pin action/container digest
Compromised base image  → sign + scan + use distroless
```
**SLSA levels:** L0 (none) → L4 (fully attested provenance, hermetic build). Target L3: signed provenance + reproducible.

**GitHub trusted publishing / OIDC:** no static PATs, use OIDC tokens — cloud providers verify issuer.

---

## 8. Runtime Security — Falco + Trivy-operator

```bash
# Install Falco (daemonset) — anomalie-by-default (syscalls)
falco

# Alert example — "Package management process spawned in container"
- rule: Package Management Process Executed
  desc: "Detects package management process executed in container"
  condition: >
    spawned_process and container and
    (proc.name in (apk, apt, dpkg, yum, dnf, rpm))
  output: >
    "Package management process executed in container (user=%user.name
    event=%evt.type cmd=%proc.cmdline)"
  priority: WARNING

# Trivy-operator — continuous cluster scanning
kubectl apply -f https://github.com/aquasecurity/trivy-operator/releases/.../trivy-operator.yaml
kubectl get vulnerabilityreports --all-namespaces
```

---

## 9. DevSecOps in Practice (Pipeline Reference)

```yaml
# .github/workflows/security.yml
name: Security Gates
on: [push, pull_request]

jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: gitleaks detect --source . --verbose --exit-code 1

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config auto --error

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: trivy fs . --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed

  image:
    runs-on: ubuntu-latest
    needs: [sca]
    steps:
      - uses: docker/build-push-action@v5
        with: { tags: "ghcr.io/myorg/myapp:latest" }
      - run: |
          trivy image --severity HIGH,CRITICAL \
            --exit-code 1 --ignore-unfixed ghcr.io/myorg/myapp:latest
          syft ghcr.io/myorg/myapp:latest -o spdx-json > sbom.spdx.json
          cosign sign ghcr.io/myorg/myapp:latest
```

**Gate logic (koi fail → block deploy):**
```
✓ secrets scan pass
✓ SAST criticals = 0
✓ SCA criticals = 0 (or waivered with ticket)
✓ image criticals = 0
✓ signature + SBOM attached
→ PROCEED to CD
```
**Separate "fail-block" vs "informational":** allowlist/waiver process (`security.md` per repo), never silently disable.

---

## 10. Secrets Management — Never in Repo

| Approach | Rating | Notes |
|----------|--------|-------|
| Files in repo / `.env` committed | ❌ NEVER | Even "private" repos leak later |
| Environment in CI | ⚠️ OK for CI | Rotate, use OIDC over static PAT |
| Azure Key Vault / AWS Secrets Manager | ✅ Prefer | RBAC, rotation, auditing built-in |
| Vault (HashiCorp) | ✅ | Dynamic secrets, encryption-as-a-service |
| SOPS + age/KMS in GitOps | ✅ | Encrypted-in-repo, decrypted at apply |

```bash
# Key Vault (Azure) — get secret in pipeline
az keyvault secret show --vault-name kv-prod --name DB_PASSWORD --query value -o tsv

# SOPS (encrypt file in repo, decrypt on apply)
sops -e secrets.yaml > secrets.enc.yaml
sops -d secrets.enc.yaml
```
**Rotation:** Key Vault auto-rotate managed identities; never bake into image.

---

## 11. Interview Questions — DevSecOps

| Question | Strong Answer |
|----------|---------------|
| "Shift-left kya hai?" | Security tools se jaana: IDE linting → commit hooks → CI SAST/SCA → build image scan → deploy DAST → runtime. Bug early = penny, late = crore. |
| "SAST vs DAST vs SCA?" | SAST = static code review (early, medium FP); DAST = runtime black-box attack (late, costliest); SCA = dependency CVE check against DB. |
| "Trivy me emergency gate kaise?" | `trivy image --severity HIGH,CRITICAL --exit-code 1` in CI → non-zero fails pipeline. Use `--ignore-unfixed` + waiver process. |
| "Image CVEs hi rahe to?" | Distroless/scratch base, filter base vs library, `--ignore-status wontfix/` no-fix for un-exploitable, separate waivers. |
| "SBOM kya aur kyun?" | BOM of packages+versions in image; compliance (EO, NTIA), vulnerability triage, supply-chain auditability. Generators: syft, trivy, cyclonedx tools. |
| "Cosign kya karta hai?" | Sign container image (key or keyless/OIDC) → verify before pull -> supply-chain integrity. `cosign verify --key pub.pem img:tag`. |
| "Secret scan kaise hota hai?" | Regex + entropy rules (gitleaks, GitHub secret scanning/push protection); CI gate + pre-commit hook; rotate any leak instantly. |
| "IaC misconfig scan?" | Checkov/TFsec/KICS against Terraform/Bicep; e.g. open port 22, storage public access, missing encryption. `plan` file bhi scan kar sakte ho. |
| "Runtime security?" | Falco (syscall rules: reverse shells, package mgmt), Trivy-operator (continuous reports), admission controller (Kyverno) to block non-distroless images. |
| "SLSA kya hai?" | Supply-chain Levels for Software Artifacts: L0→L4 signs/attests provenance (building, source, dependencies) — trust your artifacts chain. |
| "Zero trust registry kya hota hai?" | Allowlist registries (private mirror), container signing required, no `latest` from internet — puller has to trust source. |
| "Failure — gate ek image ko rok de to kya?" | 1) check report 2) fix+upgrade 3) waive with owner approval if unavoidable, with expiry 4) re-scan+promote. Never bypass silently. |

---

## 12. Hands-On Lab (Google `gcr.io/distroless` + Trivy)

```bash
# 1. Trivy install
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 2. Scan a known-ok base (distroless) vs full-OS image — compare CVE count
trivy image gcr.io/distroless/static-debian12:nonroot
trivy image ubuntu:22.04

# 3. Scan your own app image
trivy image --severity HIGH,CRITICAL --ignore-unfixed myapp:1.0

# 4. Secret test
git init sd-nothing
echo 'password=dGhpcyBpcyBhIHNlY3JldCFfdG9fYXR0YWNrXzgz' > sd-nothing/.env
gitleaks detect --source sd-nothing --report-path report.json --exit-code 1 || echo "BLOCKED"

# 5. SBOM + sign
syft myapp:1.0 -o spdx-json > sbom.spdx.json
cosign keygen   # then cosign sign / verify

# 6. IaC scan
terraform plan -out=plan.tfplan
checkov -f plan.tfplan --framework terraform --quiet
```

---

## 13. Summary | Yaad Rakho

1. **Shift-left = security har stage pe** — IDE → Commit → CI → Build → Deploy → Runtime
2. **SAST (code) + SCA (deps) + DAST (runtime) = trinity** — teeno alag problems
3. **Secret scanning:** gitleaks + GitHub push protection + pre-commit; rotate leaked instantly
4. **Trivy:** image/fs/repo/k8s scanning; gate `--exit-code 1 --severity HIGH,CRITICAL`
5. **Checkov/TFsec:** IaC misconfig before apply (open SGs, public storage)
6. **SBOM + Sign:** syft (generate) + cosign (verify/sign) — supply-chain integrity, SLSA L3
7. **Runtime:** Falco syscall rules, Trivy-operator continuous reports
8. **Secrets:** Key Vault/Vault/SOPS — never committed, never in image
9. **Gate design:** fail on criticals with waiver process; don't disable silently
10. **Keyless signing (OIDC):** no static keys to leak — GitOps + GitHub + Azure best practice

---
**Related:** [Day 17](../day-17-container-images-optimization.md) · [Day 26](../day-26-devsecops-security.md) · [CI/CD Deep Dive](../topics/cicd-explained.md) · [Observability](../topics/observability.md)