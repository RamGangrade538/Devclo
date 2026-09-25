# Day 35: Secrets Management — Vault, SOPS, External Secrets, Managed KMS

> Secrets = keys, passwords, tokens, certs. Kabhi commit nahi, kabhi image me bake nahi, kabhi `.env` me hardcode nahi. Central store + RBAC + rotation + Kubernetes integration.

## Overview | Parichay

Day 20 me K8s Secrets the (base64 — weak). Day 34 me leak hote dekhe. Is din: **real-world secrets architecture** — 4 leading options:
1. **Azure Key Vault / AWS Secrets Manager** (managed — corporate default)
2. **Vault (HashiCorp)** — dynamic secrets, encryption-as-a-service
3. **SOPS + age/KMS** — encrypted files in Git (GitOps-friendly)
4. **External Secrets Operator + CSI Driver** — K8s pods ko secrets auto-sync

### Secrets lifecycle — create se revoke tak

Secret ka full journey: **create → store (central) → inject (runtime, not build) → rotate → revoke → audit**. Har step ka rule simple hai: create **least privilege** ke saath (sirf authorized log); value **kabhi log/commit/image me nahi**; inject app runtime pe env/file ke roop me; rotate = naya version + purana expire; revoke = turant invalid; audit = kaun, kab, kahan padha (access logs). Sabse weak link aksar **inject** step hota hai — `.env` file ya hardcoded variable — isliye is din ka poora architecture isi ek step ko production-grade banata hai.

Lifecycle ke har step pe ek sawal poochho:
- **Create** — kitne log secret bana sakte hain? (least privilege)
- **Inject** — secret value kahan milti hai? (runtime, not build/image)
- **Rotate** — naya version kon chala ke purana expire karta hai?
- **Revoke/audit** — kaise invalid + kaunne kab padha (logs)?

### Char options — kab kaunsa

| Option | Best for | Trade-off |
|--------|----------|-----------|
| Azure Key Vault / AWS SM | Cloud-native teams | Managed + RBAC ready, thoda vendor lock-in |
| HashiCorp Vault | Multi-cloud, dynamic secrets | Powerful, par operate khud karna |
| SOPS + age | GitOps file secrets | Simple, no server — rotation semi-manual |
| ESO/CSI Driver | K8s pod delivery | Kube-native sync — store phir bhi chahiye |

Golden pattern: **store ek chahiye, delivery mechanism alag ho sakta hai** — Key Vault + ESO ek hi system me combos common hain.

### Vault ki khaas baat — dynamic secrets aur transit

KV store to kahin bhi milta hai (Key Vault bhi KV hai) — Vault ke 2 edge features: **dynamic secrets** (DB creds on-demand, TTL 1 ghanta — leak ho bhi gaya to expiry ke baad bekaar) aur **transit engine** (app ko encryption API, keys khud Vault me rehti hain). Bonus: versioning + audit log + policy (Vault ka apna RBAC system). Gotcha: Vault self-hosted karo to **unseal + HA + backup** ka bojh aap pe — chhoti team ke liye managed KV (Key Vault) zyada practical.

Vault ke 3 engines important:
- **KV v2** — versioned static secrets with audit trail
- **Database engine** — on-demand DB creds, TTL + rolling
- **Transit** — data encryption API (keys Vault me, ciphertext app me)

### SOPS — Git me encrypted secret files

Flow: `age-keygen` (private key CI/cluster ke secrets me, repo me kabhi nahi) → `sops -e secrets.yaml > secrets.enc.yaml` → commit **encrypted file hi**. File ka structure plain rehta hai, sirf **keys/values encrypted** — isliye diff review bhi ho jata hai (kya badla dekh sakte ho). GitOps ke saath perfect: ArgoCD sync pe decrypt ho ke apply. Gotcha: file add/rename pe careful raho (`.sops.yaml` rules), aur **key rotation** ki process pehle se socho. Compare: Sealed Secrets = per-secret CR; SOPS = per-file — dono valid, choice context pe.

SOPS ke 3 golden rules:
- **Private key kabhi repo me nahi** — CI/secrets manager me, decryption sirf runtime
- **`.sops.yaml`** me file-level rules — kuan aur kaise encrypt hoga
- Rotation: naya age key banao → file re-encrypt → commit, server pe dual-key period

### Kubernetes delivery — ESO aur CSI Driver

Day-20 wala `kubectl apply` Secret **base64 encoding hai, encryption nahi** — koi bhi with RBAC plaintext padh sakta hai, aur Git me commit ho gaya to risk permanent hai. Sahi pattern: **External Secrets Operator** (ESO) external store se padh ke **native Secret object** bana de (with `refreshInterval` auto-renew) — pods ko store ka pata hi nahi. Ya **Secrets Store CSI Driver**: secret direct mount, CR object me store hi nahi hota. Auth without static creds: **Workload Identity / ServiceAccount + OIDC** — wahi secret-zero ka answer hai.

ESO ka k8s flow ek line me: `SecretStore` (provider + auth) → `ExternalSecret` (remote key ka mapping) → refresh interval pe native Secret update. SecretStore environment-scoped rakho (`prod` ka store prod namespace tak) — secret blast radius chhota rah.

### Rotation aur secret zero — bootstrapping ka sawal

Rotation do tareeke se: 1) app **runtime pe re-read** kare (Vault agent, App Configuration refresh, ya webhook), 2) **short-TTL dynamic creds** jinki renewal hi rotation. Dono me point same — `restart` ke bina secret badle. **Secret zero** sawal: pod ko pehle secret lene ke liye creds chahiye — ye pehli credential kahan se? Answer: **cryptographic identity** (OIDC/JWT, Azure Managed Identity, ServiceAccount tokens) — koi long-lived "master password" nahi. Golden line: **"the first secret should not be a secret"** — yani identity-based ho, koi static key se nahi.

### Gotchas aur interview angle

Common blunders: base64 ko encryption samajhna; private repo me `.env` commit ("private hai to safe hai" — galat, git history permanent hai); image me `ENV` secret (docker history expose hota hai); rotation sirf documentation me (planning me kiya hua kabhi execute hi nahi hota). Interview starter: **"secret leak ho gaya, kya karoge?"** → pehle revoke/rotate (risk band), phir leak trace + root cause, phir process fix (gitleaks pre-commit + push protection + central store). Frame: prevention > detection > response.

Ek quick audit question khud se poochho: "mera DB password agar GitHub pe aa jaye to chaar log kitne jagah use karte hain?" — agar jawab "12 jagah" hai to central store + role-based access ka fayda turant dikh jayega. Secrets central hone se rotation ka ek hi true source rehta hai.

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