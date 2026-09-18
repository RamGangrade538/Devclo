# Day 35: Secrets Management — Vault, SOPS, External Secrets, Managed KMS

> Secrets = keys, passwords, tokens, certs. Kabhi commit nahi, kabhi image me bake nahi, kabhi `.env` me hardcode nahi. Central store + RBAC + rotation + Kubernetes integration.

## Overview | Parichay

Day 20 me K8s Secrets the (base64 — weak). Day 34 me leak hote dekhe. Is din: **real-world secrets architecture** — 4 leading options:
1. **Azure Key Vault / AWS Secrets Manager** (managed — corporate default)
2. **Vault (HashiCorp)** — dynamic secrets, encryption-as-a-service
3. **SOPS + age/KMS** — encrypted files in Git (GitOps-friendly)
4. **External Secrets Operator + CSI Driver** — K8s pods ko secrets auto-sync

## What You'll Learn | Aaj Ki Seekh

- [ ] Secrets lifecycle: create, inject, rotate, revoke, audit
- [ ] Azure Key Vault + RBAC + managed identity (no app secrets!)
- [ ] Vault: KV v2, dynamic DB creds, transit
- [ ] SOPS: edit encrypted YAML in Git + age keys
- [ ] External Secrets Operator (ESO) — SecretStore multi-provider
- [ ] Rotation strategies + secret zero: runtime lookup pattern
- [ ] Secret zero = "first secret wali bhi secret nahi" — workload identity/PKI

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart LR
    DEV["Developer
    (no secrets!)"] -->|Workload Identity / OIDC| VAULT{"Secret Store
    Key Vault / Vault / AWS SM"}
    SUB["K8s Pod
    (ESO + csi driver)"] -->|auth via serviceaccount| VAULT
    APP["App Runtime"] -->|"read (Vault API / init container dig uploaded)"| SUB
    CI["CI Pipeline"] -->|"OIDC jailer role, never static PAT"| VAULT
    VAULT -->|rotation|| ROT["App: fetch fresh on start / token-based on call"]
```

ASCII:
```
App → (metadata service / vault agent) → store → value
No .env at runtime. No keys in git. Rotation seamless.
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Azure Key Vault + workload identity (best practice on Azure)
az keyvault create -g rg -n kv-devopsdemo --sku standard
az keyvault secret set --vault-name kv-devopsdemo --name DB_PWD --value 'S3cret!'

# pod gets identity → role assignment
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <oidc-identity-oid> \
  --scope /subscriptions/.../providers/Microsoft.KeyVault/vaults/kv-devopsdemo

# 2. Vault (dev local)
vault server -dev
export VAULT_ADDR=http://127.0.0.1:8200
vault kv put secret/app DB_PWD='S3cret!'
vault kv get secret/app
vault kv put secret/app DB_PWD='NewS3cret!'   # rotation = write + bump version
vault kv metadata get secret/app               # versions history

# 3. SOPS + age (git friendly)
age-keygen -o key.txt          # save key securely / ci secret
export SOPS_AGE_KEY_FILE=$PWD/key.txt
sops -e --input-type yaml secrets.yaml > secrets.enc.yaml   # encrypt
sops -d secrets.enc.yaml                                     # decrypt
git commit secrets.enc.yaml                                  # commit ENCRYPTED only

# 4. External Secrets Operator — K8s native
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/.../..yaml
cat > store.yaml << 'EOF'
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata: { name: kv-store }
spec:
  provider:
    azure:
      vaultUrl: "https://kv-devopsdemo.vault.azure.net"
      authType: WorkloadIdentity
EOF
cat > ext.yaml << 'EOF'
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: db-pwd-external }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: kv-store, kind: SecretStore }
  target: { name: db-pwd-secret, creationPolicy: Owner }
  data:
    - secretKey: DB_PWD
      remoteRef:
        key: DB_PWD
EOF
kubectl apply -f store.yaml -f ext.yaml
kubectl get secret db-pwd-secret -o jsonpath='{.data.DB_PWD}' | base64 -d
```

## Real-Life Example | Industry Me

**Key rotation without app restart (pattern):**
```
App reads secret at runtime → Vault/KV → change in vault → notification/webhook
  → app re-reads (or App Configuration service / Vault agent renew) → new value flows
Release team to app dev: "tumhen secret value never dikhega, bas interface milega"
```
**Build-vs-runtime secret split:**
```
BUILD secrets (registry creds, NPM/AZ tokens)  → CI OIDC/official agents, scoped
RUNTIME secrets (DB pwd, API keys, certs)      → workload identity, scoped to pod
```
**Secret Zero problem:** pehla secret kaise safe? → Cryptographically issued identity (OIDC/Azure Managed Identity) — no long-lived static root. Find: `vault auth enable oidc`, `az aks ... enable oidc-issuer`.

## Practice Exercise | Abhi Karein

1. Key Vault: secret create + get from CLI
2. Vault dev: KV put/get + version history dekho
3. Vault dynamic DB creds (if demo db): `vault read database/creds/myrole` → rolling
4. SOPS: encrypt/decrypt + commit encrypted yaml + git diff check no plaintext
5. ESO on k8s: SecretStore + ExternalSecret → pod env me secret mount
6. Review your day-20 secrets — kya woh mere bas hardcoded the? Is method se karo

## Quick Notes | Yaad Rakho

```
- Secrets: NEVER in code/git/image/.env (even private repo). Central store always
- Azure KV: RBAC (Key Vault Secrets User/Officer), workload identity (no app creds)
- Vault: dynamic secrets (DB creds auto), transit encryption, versioning, audit
- SOPS: encrypt-in-git yaml — GitOps friendly; decrypt at sync time
- ESO/CSI: K8s pods ke liye auto-sync from Key Vault/Vault/SM — kube-native
- Rotation: write new version + re-read at runtime; audit via vault audit log / KV diagnostics
- Secret zero: use OIDC/workload identity to bootstrap, never a static "master" env
- Revoke: delete version / expire — no clients hold value; they fetch fresh
```

**Agla:** K8s Advanced — Operators, CRDs, RBAC, HPA, Vertical Pod Autoscaler.