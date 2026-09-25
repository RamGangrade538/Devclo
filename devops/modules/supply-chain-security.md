# 🔏 Software Supply Chain Security

> **Hinglish:** Tumhara code sirf tumhara nahi — usme dependencies ka bhi liability hai. Supply-chain attack = attacker dep package pakad leta hai, aur tum usse **trust** kar liya. Ye module SBOM, SLSA, signing, provenance, dependency pinning, aur attacks ke bare me hai.

## 📖 Overview — Ye Topic Kya Hai

Modern software **hazaaron chhote packages** ke upar banta hai (npm, PyPI, Maven, base images). Inme se koi bhi compromise ho → tumhara app bhi. Isliye utna zyada focus: **dependency confusion** (tumhara private package, public me attacker ne same name daal diya), **typosquatting**, **dep pinning na hona**, **leaked secrets**, **container escape**.

Defenses: **SBOM** (deps ki full list), **SLSA** (build integrity levels), **provenance** (build records), **artifact/image signing** (cosign), **dependency pinning + lockfiles**, **scans** (SCA), **runtime security** (admission rules, notification), **scanning secrets** early.

## 🟢 Beginner — Shuruaat yahan se

- SBOM kya hai + syft se apne app ka SBOM banaao.
- Lockfile/deps pinning ka fayda samjho.
- Dep scan (Trivy/Snyk) se CVEs dekh.
- Signature concept: private key vs attestation.

## 🟡 Intermediate — Ab protect karo

- **Dependency pinning + lockfiles** enforced.
- **SBOM generate in CI + store with artifacts**.
- **Image/artifact signing** (cosign) + verify.
- **SLSA levels** — integrity ke strict levels.
- **Runtime scans + admission policy** — unsigned refuse.

## 🔴 Advanced — Pro bano

- **Full provenance chain** — attestations, digests.
- **Policy-as-code** — registry admit only signed/verified.
- **Secret leakage detection** — repos/pre-commit.
- **Container escape concepts** — read-only, seccomp.
- **Incident handling for supply chain** (e.g., log4j).

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Zero Trust** — never trust blindly, verify.
- [ ] **SBOM** — dependency inventory.
- [ ] **SLSA** — software supply chain levels (integrity).
- [ ] **Software provenance** — build ka auditable record.
- [ ] **Artifact signing** — artifacts sign + verify.
- [ ] **Image signing** — container images cosign.
- [ ] **Secure CI/CD** — pipelines hardened.
- [ ] **Dependency pinning** — exact versions, no float.
- [ ] **Dependency confusion** — private package hijack risk.
- [ ] **Secret leakage** — tokens in git detection.
- [ ] **Container escape concepts** — isolation/boundary of container kab toot sakti.
- [ ] **Runtime security** — runtime detect + respond.
- [ ] **Admission policies** — K8s pe signing rules.
- [ ] **Kubernetes security** — RBAC, network, policy.
- [ ] **Supply-chain attacks** — typo-squatting, deprecated.
- [ ] **Hash/digest verification** — content identity.
- [ ] **Public registry risk** — npm/PyPI pollution.
- [ ] **Lockfiles** — reproducible known deps.
- [ ] **Attestations** — build claims (who, how).
- [ ] **Registry admission control** — unknown refuse.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use karo |
|---|---|---|
| syft | SBOM generation | Deps inventory |
| cosign | Sign + verify | Artifact authenticity |
| Trivy / Grype | Image deps scan | Vulnerabilities |
| Renovate / Dependabot | Dependency updates | Pin + update deps |
| Kyverno / Sigstore | Admission + trust | Policy on cluster |
| Gitleaks | Secret scan | Credentials leak |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — SBOM Everywhere:** App ki SBOM banao, generate in CI, artifact ke saath store karo.
- [ ] **Lab 2 — Sign + Verify:** cosign keypair, image sign, push, tamper karke verify fail demo.
- [ ] **Lab 3 — Pinning Drill:** Lockfile enable karo; package.json me `^` vs exact diff samjho.
- [ ] **Lab 4 — Dependency Confusion:** Apne local registry me package daal na — private vs public priority sekho.
- [ ] **Project — Trusted Pipeline:** Build → SBOM → scan → sign → push → cluster admission policy (sirf signed allowed).

## 🔗 Related Topics

- [🛡️ DevSecOps](../modules/devsecops.md)
- [🐳 Docker & Containers](../modules/docker-containers.md)
- [⚙️ CI/CD](../modules/cicd.md)
- [Supply Chain Security](../topics/supply-chain-security.md)
- [Day 48 — Supply Chain Security](../day-48-supply-chain-security.md)