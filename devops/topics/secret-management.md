# Deep Dive: Secret Management — Key Vault, Vault, SOPS, External Secrets (ESO)

> **Kaha ka hai:** Day 35 ka gahra version. Secrets never in git/image/.env — central store, RBAC, rotation, audit, K8s integration. "Secret zero" = first secret via identity, not a static master credential.

---

## 1. Secrets Lifecycle & Anti-Patterns

**Lifecycle:** create → inject → rotate → revoke + **audit** every step.
**Anti-patterns to kill:**
```
❌ .env committed        ❌ base64 k8s secret = plaintext  ❌ bake config into image
❌ same password all env  ❌ long-lived PAT/static SP       ❌ secret in logs/CI output
❌ "trust me, private repo" — repos leak/forks  ❌ root key in Vault UI plain
```

---

## 2. The 4 Leading Approaches

| Approach | Good when | How |
|----------|-----------|-----|
| **Managed KMS/KV** (Azure Key Vault / AWS SM / GCP Secret Mgr) | corporate default; native cloud RBAC/managed identity | REST API, RBAC, rotation policies, audit logs |
| **HashiCorp Vault** | dynamic secrets (short-lived DB creds), encryption-as-a-service, multi-cloud, self-managed | KV v2, database engine, transit engine, PKI, dynamic creds |
| **SOPS + age/KMS** | GitOps-friendly; keep secrets in repo encrypted | file encrypted (age/PGP/KMS); decrypt at sync |
| **External Secrets Operator** | K8s native: sync from KV/Vault/AWS → Secrets | `SecretStore` (provider+auth) + `ExternalSecret` → generates k8s Secret |

Use them together: KV for storage + ESO for K8s + SOPS for repo configs + Vault optional for dynamic.

---

## 3. Azure Key Vault — Managed Secret Central

```bash
az keyvault create -g rg -n kv-<uniq> --sku standard
az keyvault secret set --vault-name kv-x -n DB_PWD --value 'S3cret!'
az keyvault secret show --vault-name kv-x -n DB_PWD --query value -o tsv
az keyvault secret set --vault-name kv-x -n DB_PWD --value 'New!'
# versioning: every set = new version; apps get latest (or pin version)
```
- **Access:** RBAC data-plane roles: `Key Vault Secrets User` (read), `Officer` (write), plus Azure Policy to enforce.
- **Identity:** Workload identity / managed identity — app has no own secret to store ("secret zero" solved).
- **Rotation:** auto-rotation for certs/secrets; alerts on expiry; audit: `az monitor activity-log list`.
- **Types:** Secrets, Keys (encryption), Certificates (X.509 lifecycle).

---

## 4. HashiCorp Vault — Dynamic Secrets

```bash
vault server -dev
export VAULT_ADDR=http://127.0.0.1:8200
# KV v2
vault kv put secret/app DB_PWD='S3cret!'
vault kv get -version=2 secret/app      # versioned
# Dynamic DB credentials (Postgres example) — creds time-boxed, auto-rotate!
vault secrets enable database
vault write database/config/pg \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://root:root@pg:5432/postgres" \
  allowed_roles="app"
vault write database/roles/app \
  db_name=pg \
  creation_statements="CREATE ROLE \"{{name}}\" LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'"
# App fetch:
vault read database/creds/app          # -> username/password with TTL (not permanent!)
```
- **Dynamic creds:** no more "password in the code"; lease auto-expires → rotation by lease, not manual.
- **Encryption as service:** `vault transit encrypt/decrypt` — data encrypted in transit, decrypted on demand (apps never hold master key).
- **Secret zero:** apps authenticate via **OIDC/Kubernetes auth** (JWT from service account) — no initial static token.

---

## 5. SOPS — Encrypted Files for GitOps

```bash
brew install sops    # or: go install go.mozilla.org/sops/v3/cmd/sops@latest
age-keygen -o key.txt   # or use KMS: aws kms / azure keyvault
export SOPS_AGE_KEY_FILE=$PWD/key.txt

sops -e --yaml secrets.yaml > secrets.enc.yaml      # encrypt (keeps plaintext out of git)
git add secrets.enc.yaml && git commit               # commit ENCRYPTED
sops -d secrets.enc.yaml                             # decrypt locally
```
- **Usage in GitOps:** Flux Kustomization `decryption.provider: sops` + `secretRef` for the age key → encrypted config in git, decrypted at apply time.
- **Audit:** encrypted version differences reviewable in PR! (`sops --decrypt | diff`)

---

## 6. External Secrets Operator (ESO) — K8s Native

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore            # points to provider + auth (workload identity!)
metadata: { name: kv }
spec:
  provider:
    azure:
      vaultUrl: "https://kv-x.vault.azure.net"
      authType: WorkloadIdentity
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: db-pwd-ext }
spec:
  refreshInterval: 1h        # auto-resync rotation
  secretStoreRef: { name: kv, kind: SecretStore }
  target:
    name: db-pwd            # k8s Secret name generated
    creationPolicy: Owner
  data:
    - secretKey: DB_PWD
      remoteRef: { key: DB_PWD }
```
- Controller watches ExternalSecret → continuously updates `db-pwd` Secret from KV → pods mount updated value at restart (or via CSI driver for in-place).
- **refreshInterval** → rotation without app redeploy: app re-reads file (mounted for sidecar reload).
- Cross-cloud: AWS SM, GCP SM, Vault, 1Password — same operator.

---

## 7. CSI Driver Alternative — In-Place Secret Mounting

```yaml
volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: "kv-app-creds"   # maps KV refs
# Pod sees refreshed content on disk w/o restart (csi sync)
```

---

## 8. Rotation & Secret Zero — Design Rules

```
Rotation rules:
  - Use KV/CSI "refreshInterval" — no app restart for many cases
  - Dynamic DB creds (Vault) — lease TTL rotation automatic
  - Certs (Public/Private CA) — auto-issue + expire in <90d
  - Audit: every read tracked (KV diagnostics/vault audit) — helps incident response

Secret Zero rules:
  - Bootstrap via cloud identity: AKS workload identity / managed identity / OIDC
  - In GitOps: sealed/sops file's key handled by KMS + identity, never in repo
  - CI gets OIDC token (actions) — scope to needed secrets only
  - NEVER long-lived: rotate static keys, use short TTL dynamic
```

---

## 9. Interview Questions — Secrets

| Question | Strong answer |
|----------|---------------|
| "Secret ko securely store kahan?" | KV/SM/Vault with RBAC + rotation + audit; SOPS for git; ESO for k8s. |
| "Secret zero kya?" | First secret wali bhi secret nahi: bootstrap via workload identity/OIDC/managed identity instead of a static "master" credential. |
| "Dynamic DB creds (Vault) se fayda?" | Creds time-boxed (TTL) + auto-rotation; no permanent password sitting in tools; revocation instant. |
| "SOPS kahan useful?" | GitOps configs: secrets commit-encrypted, decrypt at apply; diff reviewable. |
| "ESO vs CSI driver?" | Both sync KV→k8s; ESO: object-managed + refreshInterval; CSI: in-place file mount, app reads updated. |
| "Rotation without restart?" | KV/CSI refresh, Vault dynamic lease, certs auto-renew — app re-reads; design apps to be value-fetch-late. |
| "Audit kaise?" | KV diagnostics logs, Vault audit log, ADC identity sign-in logs — lifecycle full recording. |
| "Vector: .env committed?" | False. Use env-replacement at deploy from KV (workload identity), not literal secrets. |

**Related:** [Day 35](../day-35-secrets-management.md) · [GitOps](../topics/gitops-argocd.md) · [DevSecOps](../topics/devsecops.md) · [Supply Chain](../topics/supply-chain-security.md)