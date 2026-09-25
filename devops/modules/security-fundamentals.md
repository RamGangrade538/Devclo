# 🔐 Security Fundamentals — CIA, IAM, Encryption, Network Security

> **Hinglish:** Security sabki responsibility hai — DevSecOps ke liye base of security fundamentals samjho: CIA triad, authentication/authorization, IAM/RBAC, least privilege, MFA, encryption/TLS, vulnerability management, aur threat modeling. Ye module woh bedrock hai.

## 📖 Overview — Ye Topic Kya Hai

Security ka maqsad data/access ko protect karna: **CIA triad** — **Confidentiality** (sirf authorized log dekh), **Integrity** (data galat na ho), **Availability** (system up rahe). Ek attack teeno ko target kara.

Core building blocks: **Authentication** (kaun ho?) vs **Authorization** (kya kar sakta hai?) — dono alag. **IAM** (cloud me ye manage) → **RBAC** (roles-based). **Least privilege** — minimum access. **MFA** — extra protection. **Encryption** — at rest (data stored) aur in transit (TLS/HTTPS). Certificates/PKI — identification ka system. Vulnerability management — scanning + patching ka loop. Threat modeling — pehle se attacks sochna.

## 🟢 Beginner — Shuruaat yahan se

- CIA triad — example se samjho (e.g., banking data).
- Authentication vs authorization — difference.
- Passwords/SSH keys/MFA basics.
- HTTPS/TLS kya protect karta hai — `curl -v` me certificate dekh.

## 🟡 Intermediate — Ab role banao

- **IAM users/groups/roles/policies** — least privilege setup.
- **RBAC vs ABAC** — access decision methods.
- **Encryption at rest vs in transit** — dual layer.
- **Certificates & PKI** — trust chain, expires.
- **Vulnerability scanning** — Trivy/Nessus basics.
- **Security groups/network policies** — micro-segmentation.

## 🔴 Advanced — Pro bano

- **Threat modeling** — STRIDE model, attack trees.
- **Zero Trust** — never trust, always verify.
- **Security logging & monitoring** — audit trails, SIEM.
- **Key management (KMS)** — keys rotate, HSM.
- **Compliance basics** — SOC2, ISO27001, GDPR.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **CIA triad** — confidentiality + integrity + availability.
- [ ] **Authentication** — kaun hai (login, token).
- [ ] **Authorization** — kya kar sakta hai (permissions).
- [ ] **IAM** — identity + access management.
- [ ] **RBAC** — roles ke through access.
- [ ] **ABAC** — attributes (time, location) ke through access.
- [ ] **Least privilege** — minimum access; jitna zaroori.
- [ ] **MFA** — extra factor (OTP, TOTP, hardware key).
- [ ] **Secrets management** — passwords/keys safely.
- [ ] **Encryption** — data ko encode karke unreadable banana.
- [ ] **Encryption at rest** — stored data encrypted.
- [ ] **Encryption in transit** — moving data encrypted (TLS).
- [ ] **TLS** — HTTPS de encryption.
- [ ] **Certificates** — public key + identity.
- [ ] **Key management** — keys generate/rotate/store (KMS/HSM).
- [ ] **Security groups** — network-level allow/deny.
- [ ] **Network policies** — service-level traffic rules.
- [ ] **Vulnerability management** — scan → triage → fix loop.
- [ ] **Threat modeling** — attacks pehle se sochna.
- [ ] **Security logging** — logs jo attacker trace kare.
- [ ] **Access reviews** — periodic entitlement check.
- [ ] **Password policy / phishing awareness** — human layer.
- [ ] **Zero trust** — har request verify.
- [ ] **Audit trails** — who did what when.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| AWS IAM / Azure AD | Identity | Cloud access management |
| HashiCorp Vault | Secrets | Secrets centralized |
| Trivy | Vuln scanner | Images/filesystem scanning |
| OpenSCAP / Lynis | System audit | Server hardening checks |
| Wireshark / tcpdump | Network analysis | Network security debug |
| KMS / cloud KMS | Key management | Encryption keys |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — IAM Playground:** User banao + least-privilege policy + test over/under access.
- [ ] **Lab 2 — TLS Inspection:** `openssl` se cert chain dekho, expiry, letsencrypt rotate.
- [ ] **Lab 3 — Scan + Fix:** Trivy se 5 images scan karo, critical fix karke re-scan.
- [ ] **Lab 4 — Threat Model:** Apne app ka STRIDE threat model banao (table).
- [ ] **Project — Security Checklist:** Kbhi nahi list — IAM, network, secrets, scanning, logging — apne deployment pe apply karo.

## 🔗 Related Topics

- [🛡️ DevSecOps](../modules/devsecops.md)
- [🗝️ Secrets Management](../modules/secrets-management.md)
- [🪪 IAM](../modules/iam.md)
- [🔐 Advanced Security / Supply Chain](../modules/supply-chain-security.md)
- [DevSecOps (Shift-Left)](../topics/devsecops.md)
- [TLS, Certificates & PKI](../topics/tls-certificates-pki.md)