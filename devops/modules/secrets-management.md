# 🗝️ Secrets Management — Passwords, Tokens, Keys in Control

> **Hinglish:** Secret = jiska leakage = breach (passwords, API keys, tokens, certs). Secrets ko code/config se alag, **centralized vault** me rakha jata hai — rotation, short-lived credentials, encryption. Ye module Vault, cloud secret managers, aur K8s Secrets cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Sabse common leak: developer ne `DB_PASSWORD` `.env`/Git repo me daal diya. **Secrets management** = secrets ko **centralized, encrypted, permissions-controlled** jagah me rakhna, aur apps ko runtime me securely dena (dynamic, short-lived).

Tools: **HashiCorp Vault** (industry standard — dynamic secrets, lease), **cloud secret managers** (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager), **K8s Secrets** (base64 — encrypt/access control), **External Secrets/SecretsStore** (cloud → K8s sync), kubeseal/SOPS (Git me encrypted). Concepts: rotation, encryption at rest/transit, dynamic short-lived creds, least privilege, audit.

## 🟢 Beginner — Shuruaat yahan se

- Secrets vs config — kaunsa kya hai.
- `.env` + `.gitignore` — minimum discipline.
- Cloud secret manager me ek secret store + read karo.
- K8s Secret — base64 me dekho kyun weak hai.

## 🟡 Intermediate — Ab vault use karo

- Vault install + unseal + basic KV put/get.
- App ke liye Vault policy (least privilege).
- **Dynamic secrets** — DB creds short-lived.
- **Rotation** — manual + automatic.
- External Secrets Operator — K8s me sync.

## 🔴 Advanced — Pro bano

- **Encryption transit/rest** — full encryption chain.
- **Audit + access control** — vault audit logs.
- **Auto-unseal + HA Vault** — production setup.
- **Secrets lifecycle** — gen → store → rotate → revoke.
- **App auth methods** — K8s service accounts integration.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Secrets vs configuration** — config public, secrets never.
- [ ] **Secret rotation** — kabhi kabhi creds badlo.
- [ ] **Encryption at rest** — stored secrets encrypted.
- [ ] **Encryption in transit** — transport secure (TLS).
- [ ] **Dynamic secrets** — on-demand short-lived creds.
- [ ] **Short-lived credentials** — expiry; breach impact kam.
- [ ] **HashiCorp Vault** — central secrets platform.
- [ ] **Cloud secret managers** — Secrets Manager, Key Vault.
- [ ] **Kubernetes Secrets** — K8s object (base64, needs hardening).
- [ ] **External Secrets** — cloud secrets to K8s sync.
- [ ] **Least privilege** — har app sirf apne zaroori rights.
- [ ] **Leases / TTL** — dynamic creds ka time-bound lease.
- [ ] **Audit logs** — who accessed which secret.
- [ ] **Unseal / seal** — vault encryption state.
- [ ] **Encryption-as-a-service** — data encrypt via API.
- [ ] **Versioning** — secret history/staging.
- [ ] **Not in Git** — repo me secrets manna hi mat.
- [ ] **Fallback/backup** — secrets recovery (emergency access).

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| HashiCorp Vault | Secrets platform | Dynamic + centralized |
| AWS Secrets Manager / Azure Key Vault | Cloud secrets | Managed cloud |
| SOPS / age | Encrypted files | Git-ready encrypted config |
| Sealed Secrets (bitnami) | K8s encrypted secrets | Git-based GitOps |
| External Secrets Operator | K8s sync | Cloud → cluster |
| gitleaks | Leak detection | Pre-commit scan |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Vault 101:** Dev server (`-dev`), unseal, KV put/get, token use.
- [ ] **Lab 2 — Dynamic DB Creds:** PostgreSQL engine, dynamic user 30s lease, DB me login — credible demo karo.
- [ ] **Lab 3 — Rotation:** Secret rotate karo + app reload/auto-detect.
- [ ] **Lab 4 — External Secrets:** Vault/secrets-manager → K8s Secret sync; pod me mount karke verify karo.
- [ ] **Project — Secret-First App:** App ko bina env-secret (sab vault se) chalao; rotation drill karo.

## 🔗 Related Topics

- [🔐 Security Fundamentals](../modules/security-fundamentals.md)
- [🛡️ DevSecOps](../modules/devsecops.md)
- [☸️ Kubernetes](../modules/kubernetes.md)
- [Secrets Management](../topics/secret-management.md)
- [Day 35 — Secrets Management](../day-35-secrets-management.md)