# 🛡️ DevSecOps — Security in CI/CD

> **Hinglish:** DevSecOps ka matlab security ko **pipeline ke andar** (shift-left) daalna — build hote hi SAST/DAST/SCA/container-scan/secret-scan chalao, taaki unsafe code production tak nahi pahunchta. Ye module tools + concepts ko simple Hinglish me cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Puraana way: app banata hai product team, alag security team check karti hai end pe — bahut slow + risky. **Shift-left**: security ko pipeline ke har stage pe automatic gates ke roop me daalna.

Stages:
- **SAST** — static code analysis (source pe, bina run karke) — SonarQube, Semgrep.
- **DAST** — dynamic testing (running app pe) — ZAP, Burp.
- **SCA** — dependency scan (libraries me vulns) — Snyk, Trivy, Dependabot.
- **IaC scanning** — infra code me misconfig — Checkov/Tfsec.
- **Container scanning** — images me vulns — Trivy/Grype.
- **Secret scanning** — commits me passwords — Gitleaks.
- **Outputs**: SBOM (dependency list), **signing** (image/artifact), **provenance**, aur **policy-as-code** (OPA/Kyverno) enforcement.

## 🟢 Beginner — Shuruaat yahan se

- SAST vs DAST vs SCA — farak samjho.
- Trivy se local image scan karo.
- SonarQube/Semgrep se code scan karo.
- Gitleaks se apne repo ka secret scan.

## 🟡 Intermediate — Ab pipeline me daalo

- CI me SAST + SCA + container-scan steps lagao.
- **Policy gates** — critical vuln pe pipeline fail.
- Secret scanning chalu karo (pre-commit hook/pipeline).
- SBOM generate karna (syft) + check reports.
- Container signing (cosign) basics.

## 🔴 Advanced — Pro bano

- **Policy as code** — OPA/Rego + Kyverno admission.
- **SLSA provenance** — build chain ka trust.
- **Runtime security** — admission controllers, runtime scanning.
- **Dependency pinning + confusions** — supply-chain deep.
- **Security dashboards** — risk trends, gates SLA.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Security in CI/CD** — pipeline me security gates.
- [ ] **SAST** — static analysis (bina run karke code check).
- [ ] **DAST** — dynamic black-box testing (running app).
- [ ] **SCA** — dependency composition analysis.
- [ ] **IaC scanning** — infra code me misconfig check.
- [ ] **Container scanning** — images/deps vulnerability scan.
- [ ] **Secret scanning** — passwords/keys in repo detect.
- [ ] **Dependency scanning** — libs me blocked CVEs.
- [ ] **SBOM** — software bill of materials (deps list).
- [ ] **Software supply-chain security** — full deps chain trust.
- [ ] **Image signing** — image hash sign karo (cosign).
- [ ] **Artifact signing** — binaries/artifacts sign.
- [ ] **Provenance** — build ka record (who/how/when).
- [ ] **Policy as code** — rules code se enforce (OPA/Kyverno).
- [ ] **Runtime security** — prod runtime monitoring.
- [ ] **Trivy** — vuln scanner (images/fs).
- [ ] **Snyk** — apps security platform.
- [ ] **SonarQube** — static analysis server.
- [ ] **Semgrep** — fast SAST rules.
- [ ] **Checkov** — infra scanning tool.
- [ ] **OPA / Kyverno** — policy engines.
- [ ] **Cosign** — container/artifact signing.
- [ ] **Vault** — secrets secure reduce risk.
- [ ] **Shift-left principle** — security pehle, sasta + effective.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Trivy | Image/fs/SCA scanner | Container + deps check |
| Snyk | SAST/SCA platform | Dev-friendly security |
| SonarQube | Code quality + SAST | Source analysis |
| Semgrep | Fast SAST | Rule-based scanning |
| Checkov / Tfsec | IaC scan | Infra code security |
| Gitleaks | Secret scan | Commit hook scanning |
| OPA / Kyverno | Policy engines | Admission policy |
| Cosign + syft | Signing + SBOM | Chain of trust |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Scan a Repo:** Gitleaks + Semgrep + Trivy path scan — report nikaldo, fix karo.
- [ ] **Lab 2 — CI Security Gates:** Pipeline me SAST + container-scan; critical pe gate fail demo.
- [ ] **Lab 3 — SBOM + Sign:** syft se SBOM, cosign se sign, verify karo.
- [ ] **Lab 4 — IaC Scan:** Checkov se Terraform scan; 2 misconfig fix with policy.
- [ ] **Project — DevSecOps Pipeline:** Complete: commit → SAST→ secret → build → image scan → sign → SBOM → deploy → policy gate.

## 🔗 Related Topics

- [⚙️ CI/CD](../modules/cicd.md)
- [🔐 Security Fundamentals](../modules/security-fundamentals.md)
- [📜 Supply Chain Security](../modules/supply-chain-security.md)
- [DevSecOps (Shift-Left)](../topics/devsecops.md)
- [Day 26 — DevSecOps](../day-26-devsecops-security.md)
- [Day 34 — Security Scanning Tools](../day-34-security-scanning-tools.md)