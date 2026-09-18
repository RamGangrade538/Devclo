# Day 20 — Rollback, Secrets & Key Vault (DevClo Expanded)

## Overview | Parichay

Aaj pura Phase 3 ka "insurance policy" banata hai. Pehli half: **rollback** — jab prod 500 de, to how quickly systematically wapas jaana hai (revert vs rollback vs fix-forward, `kubectl rollout undo`). Doosri half: **secrets** — production par secrets kahaan safe rakhe: Azure **Key Vault** (RBAC vs access policies, soft-delete), App Service references, AKS CSI driver, aur managed identity. Is din ke baad tum "deploy by design = rollback by design" ke principle pe interview de sakte ho.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Rollback ke 3 options: **revert vs rollback vs fix-forward** — kab kaunsa
- [ ] `git revert` + pipeline redeploy aur `kubectl rollout undo` ka flow
- [ ] Blue-green rollback (traffic switch) ke advantage
- [ ] **Azure Key Vault**: secrets/certs/keys samjho, create/read/update/delete (CLI)
- [ ] KV auth: **RBAC vs access policy** ka fark, soft-delete/purge
- [ ] App Service me **Key Vault references** (no code change)
- [ ] AKS me **CSI Secrets Store driver** + workload identity (no secrets in code)
- [ ] Managed identity — service principal ke bina, code me koi secret nahi
- [ ] Secret rotation drill (KV rotate → app continue)
- [ ] Blameless postmortem — INC-511 style

---

## Full Topic (LEARN) | Puri Detail

### 1. Rollback Decision Framework

Production me bug mila to **privacy से 3 raaste** hain — sabka apna trade-off:

| Approach | Matlab | Kab use karo |
|----------|--------|--------------|
| **Rollback (codes pomana)** | Pichli good version/state par wapas (image/tag, `rollout undo`) | Fastest — incident me default |
| **Revert (git)** | Last commit(s) ko nahi, naya commit banao jo changes undo kare | When code change bad thi & history clean chahiye (PRs/branches) |
| **Fix-forward** | Code fix likho + hotfix deploy | Bug quick + laukta na ho; rollback mise kahin data migration blocked |

**Decision heuristic:** roll back karo agar (a) user-facing error high, (b) root cause abhi unclear, (c) fix ke jaise phasna hoga — **pehle safe state, phir investigation.** Revert sirf tab jab code-level change ko "hata" hi de sakte ho (migration/non-versioned state ka dhyan). Fix-forward tab jab rollback ka cost zyada ho (DB schema) — lekin gate me test pakka karo.

Aaj ka drill in isi order se:
```
Alert (500) → confirm bad release → Rollback (kubectl rollout undo) → verify → stable
→ phir postmortem + git revert/fix PR → pipeline deploy (clean)
```

### 2. Rollback via kubectl / Helm

```bash
# Deployment history dekho (kaunsa revision abhi hai)
kubectl rollout history deployment/devclo-prod -n prod

# Previous revision par undo — REVISION marker bhi (specific version)
kubectl rollout undo deployment/devclo-prod -n prod
kubectl rollout undo deployment/devclo-prod -n prod --to-revision=3

# Verify
kubectl rollout status deployment/devclo-prod -n prod
kubectl get pods -n prod -o wide            # new pods old image ke
kubectl get deploy devclo-prod -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'

# Helm ke saath (CD se deploy hota hai to):
helm history devclo-prod -n prod
helm rollback devclo-prod 3 -n prod         # revision 3 par wapas
# release delete/tag handle: chart resources vahi rehte
```

**Git path (pipeline-driven):**
```bash
git revert <bad-sha>          # ek naya commit ban jaata hai jo changes undo karta hai
git push origin main          # pipeline CI/CD se auto-redeploy (same artifact pipeline)
```

**Blue-green (Day 19):** sirf Ingress/Service weight/source wapsi switch → instant rollback bina pods chhile: `kubectl patch service app -n prod -p '{"spec":{"selector":{"version":"blue"}}}'` — arguably sabse safe.

### 3. Azure Key Vault — Secrets, Certs, Keys

KV ek managed HSM-adjacent store (BYOK support) — exactly do na liya: **secrets** (passwords/API keys), **certificates** (auto-renew/policy), **keys** (crypto keys/HSM). Ek KV resources pe based hi khulta hai — SKU: Standard (software) / Premium (HSM).

```bash
az keyvault create --name devclo-kv --resource-group devclo-rg --location eastus \
  --enable-rbac-authorization true        # 2026: RBAC model (pas bans)
# Keys/certs/secrets CRUD:
az keyvault secret set --vault-name devclo-kv --name db-password --value "NotMySecret!"
az keyvault secret show --vault-name devclo-kv --name db-password --query value -o tsv | whatevers
az keyvault secret list --vault-name devclo-kv -o table
az keyvault secret delete --vault-name devclo-kv --name db-password
az keyvault certificate create --vault-name devclo-kv --name app-tls \
  --policy "$(cat ~/certpolicy.json)"
```

### 4. Auth: RBAC vs Access Policies (2026)

| Model | Kya hai | 2026 status |
|-------|---------|------------|
| **Access policies** | Purana model — per-entity grants via `az keyvault access-policy` | Legacy |
| **RBAC (preferred)** | Azure RBAC roles (`Key Vault Administrator`, `Key Vault Secrets User`...) | Recommended/GA; `--enable-rbac-authorization` |

```bash
# RBAC sila do:
az keyvault set-policy --name devclo-kv \
  --permissions secrets get,list --object-id <spn>   # LEGACY
# RBAC recommended:
az role assignment create --assignee <principal-id> \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/<sub>/resourceGroups/devclo-rg/providers/Microsoft.KeyVault/vaults/devclo-kv"
```

**Soft-delete (default ON since 2020):** delete hone par secret 90 days (7-90 configurable) tak recoverable rehta hai, `--enable-purge-protection` ke sath purane nikalna bhi band. Purge = permanent. Ye aapke INC-512/J-608 jaisi recovery gamechanger hai.

```bash
az keyvault secret delete --vault-name devclo-kv --name db-password
az keyvault secret list-deleted --vault-name devclo-kv    # purged-hua we list
az keyvault secret recover --vault-name devclo-kv --name db-password   # recover!
```

### 5. App Service Key Vault References

App Service par connection string/secret ko **dinamically KV reference** se bharo — code ka kuch nahi, app restart hota he refresh:

```
DBPassword=@Microsoft.KeyVault(VaultName=devclo-kv;SecretName=db-password)
```
```bash
az webapp config appsettings set --name <app> --resource-group devclo-rg \
  --settings 'KeyVaultSecret=@Microsoft.KeyVault(VaultName=devclo-kv;SecretName=db-password)'
# MSI (managed identity) se auth — app ko KV se secret access, code me no secret!
```

### 6. AKS + CSI Secrets Store + Managed Identity

AKS pods ko KV secrets dena: **CSI Secrets Store driver** (Azure Key Vault provider) — pod mount karta hai, secrets code me nahi, disk purane refresh too possible. (2026 k8s: `secrets-store.csi.k8s.io` + `secretProviderClass` + workload identity.)

```yaml
# secretproviderclass.yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: devclo-kv-spc
  namespace: prod
spec:
  provider: azure
  parameters:
    usePodIdentity: false
    useVMManagedIdentity: false
    clientID: ""                     # workload identity ke saath empty
    keyvaultName: "devclo-kv"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
    tenantId: "<tenant-id>"
# Deployment me mount vol:
volumes:
- name: secrets
  csi:
    driver: secrets-store.csi.k8s.io
    readOnly: true
    volumeAttributes:
      secretProviderClass: "devclo-kv-spc"
```

**Managed identity (no secrets in code):** App au pod ko MSI/workload identity se KV access → code/ap=& **kabhi** credentials nahi. MSI = ke same Azure infra identity. Secret rotation KV me karo → reference/CSI se app Har update dikhta hai (often auto fault). Yehi modern application security pattern.

### 7. Rotation + Postmortem

**Rotation drill (INC-512):** KV par secret new value→ app aise bhi chalata rahe (reference refresh) → purana revoke/disable. App Service: `az webapp config appsettings set` ya restart. CSI: periodic sync ya pod restart marte hi naya secret mount.

**Blameless postmortem:** systems, not people; timeline + root cause + action items. INC-511 ke sare steps practice ke roop me karoge.

---

## Practice Lab | Abhi Karein

1. **Rollback base:** AKS (ya local kind) me `devclo-prod` deployment banao, image v1 tag (SHA tag — Day 18).
2. Comment/branch par **bad V2** deploy karo: image `devclo-api:bad-v2` (app crash/500 pe).
3. `kubectl rollout history deployment/devclo-prod -n prod` → history dekho.
4. Rollback: `kubectl rollout undo deployment/devclo-prod -n prod` → `rollout status` + `get pods` se verify (old image back).
5. `git revert` flow: bad commit revert karke push → CI/CD pipeline auto-redeploy → verify.
6. KV create karo **RBAC model** (standard sku): `az keyvault create --enable-rbac-authorization true`.
7. Secret set karo (`db-password`), `az keyvault secret show` + `list` se padho.
8. Soft-delete drill: `az keyvault secret delete` → `list-deleted` dekho → `recover` karo → `show` verify.
9. RBAC: apne principal ko `Key Vault Secrets User` role do, phir CLI se secret read — access policy wale jaisa hi, lekin RBAC audit ke saath.
10. App Service (agar ho): setting me KV reference (`@Microsoft.KeyVault(...)`) daalo + managed identity se test.
11. AKS artifacts (agar possible): SecretProviderClass + storage class va salt mount karke pod se secret file read karo (code me koi literal nahi).
12. Secret rotation: KV me value badlo → app verifies (reference/CSI) bina restart → purana secret revoke karo → app healthy.
13. **INC-511 style postmortem** likho (root cause, action items) — 10 lines.
14. **Expected result:** End-to-end: bad V2 → rollback v1 → verify; secrets KV me, code clean, RBAC+soft-delete supported; rotation drill documented.

---

## Incidents / Tickets | Real Practice

### INC-511 · Production API 500 After Deploy
- **Situation:** Naye deploy (image v2) ke 10 min baad error rate 8% → 92%, pagerAlert aaya: "5xx spike on /api". Users affected.
- **Investigate:**
  ```bash
  kubectl get deploy devclo-prod -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'
  kubectl rollout history deployment/devclo-prod -n prod
  kubectl get pods -n prod -o wide                       # CrashLoop/RestartCount
  kubectl logs -l app=devclo -n prod --tail=100 | grep -iE "500|error|panic"
  kubectl get events -n prod --sort-by=.lastTimestamp | tail -20
  # release diff: last good vs new
  git log --oneline -5 && git tag --contains $(kubectl ... image tag)
  ```
- **Root cause:** v2 me ek unhandled exception/schema change — null pointer on old rows (ids missing); CI passed (tests didn't cover prod data). Kon sa exact:
  ```
  kubectl logs <pod> -n prod | tail -30   → "TypeError: Cannot read properties of null (reading 'address')"
  ```
- **Fix (pehle safe):** **Rollback**:
  ```bash
  kubectl rollout undo deployment/devclo-prod -n prod --to-revision=<last-good>
  kubectl rollout status deployment/devclo-prod -n prod
  # phir gap fix-PR + git revert/pipeline for permanent cleanup
  git revert <bad-sha> && git push origin main
  ```
- **Verify:** Error rate dashboard → baseline; `kubectl get pods -n prod` Running; probe/health API 200; release tracking shows old SHA image deployed.
- **Blast radius | Prevent (senior):** Blast: full prod users. Detection: error-rate alert tha (5xx) — and add staged-rollout (canary/10%) + health gate, and immutable SHA tag correlation. Prevention: prod-data regression tests, `prepare_plan/release_variables` gate, post-deploy smoke tests, rollback automation (on-failure hook + Helm `--atomic`), blameless postmortem. Emergency protocol document.

### INC-512 · Secret Rotation
- **Situation:** compliance audit me bata diya: `db-password` secret ko rotate karna hai (90-day policy). App prod chal raha hai — apne rotation ko **zero-downtime** karna hai aur gold no.
- **Investigate:**
  ```bash
  az keyvault secret show --vault-name devclo-kv --name db-password --query 'attributes.updated' -o tsv
  # kaunsa consumer use kar raha hai (app setting/CSI reference):
  az webapp config appsettings list --name <app> --resource-group <rg> --query "[?name=='DBPassword']"
  kubectl get pod -n prod -l app=devclo -o jsonpath='{.spec.volumes[].name}'   # CSI mount?
  ```
- **Root cause:** Old value Kabhi expire khuda se nahi hota; consumer (app) hardcoded/config-static tha — rotate karte hi connection fail ho jayega agar app reference nahi hai. Missing: KV reference ya CSI dynamic refresh setup.
- **Fix (dual-write pattern first to be safe):** 
  1. New value KV me daalo; jahan support ho **dual-write/reference** use karo:
  ```bash
  az keyvault secret set --vault-name devclo-kv --name db-password --value "newSecret!"
  # App Service refs auto-resolve (no restart needed w/ managed identity)
  az webapp config appsettings set --resource-group <rg> --name <app> \
     --settings 'DBPassword=@Microsoft.KeyVault(VaultName=devclo-kv;SecretName=db-password)'
  # CSI pods: restart/deployment to select new version
  kubectl rollout restart deployment/devclo-prod -n prod
  ```
  2. Verify connections OK (logs no auth errors, probes 200).
  3. Old value disable/expire (stop use): set version expired or remove (only after confidence).
- **Verify:** `kubectl logs <pod> -n prod | grep -i "auth"` → clean; app health 200; KV audit (`az monitor activity-log`) me secret-get by MSI successful.
- **Blast radius | Prevent:** Secret rotation fail = full prod auth outage. Prevention: **single-source KV + references/CSI + managed identity**, no hardcoded strings in code/config; scheduled rotation job (`auto-rotate` via task/when policy); app side: short cache + retry/backoff so transient secret reads don't 500; rollback = restore old KV version. Audit trail: RBAC + soft-delete always ON.

---

## Interview Corner | Sawal-Jawab

1. **Q: Rollback vs revert ka fark?** A: Rollback = runtime ke deploy ko pichhi good version par wapas karna (traffic/image/state), no git change — fastest, incident me default (e.g. `kubectl rollout undo`). Revert = git history me naya commit that undoes the change — permanent fix wali CD. Sequence: pehle rollback (safe), phir revert/fix PR.
2. **Q: `kubectl rollout undo` kya karta hai aur kya nahi?** A: Deployment ko previous (**or `--to-revision`**) ReplicaSet template par wapas le jaata hai — pods rolling-replace hote hain purani image se. Ye **Deployment-level** hai; StatefulSet/daemon-set alag pattern, Data/schema changes undo nahi karta (isliye migrations gate + blue-green backup).
3. **Q: Key Vault me RBAC vs access policies?** A: RBAC = Azure-native role assignments (scalable, central audit, fine scope); access policies = legacy per-vault grants. 2026-recommended: RBAC (create vault with `--enable-rbac-authorization`). Both govern read/write of secrets; RBAC roles like `Key Vault Secrets User`.
4. **Q: App Service ya AKS me secrets kaise rakho — code me nahi?** A: App Service: **KV reference** in app settings (`@Microsoft.KeyVault(...)`) + managed identity. AKS: **CSI Secrets Store** + `SecretProviderClass` + workload identity — pod mount karta hai, secrets code/logs se bahar. Never hardcoded/WAR moment.
5. **Q: Soft-delete kya aur kyun?** A: KV default soft-delete ON — deleted secrets 90 days recoverable (`list-deleted` → `recover`), purge-protection blocks permanent deletion. Ye accidental deletion/rotation mishaps se recovery deta hai; audit ke saath. Secrets ke liye hamesha ON + RBAC least privlige.

---

## Quick Notes | Yaad Rakhna

- Rollback order: **undo (safe) → revert/fix (clean)** — pehle service, phir cleanup.
- `kubectl rollout undo --to-revision`, `helm rollback`, blue-green switch — teen rollback strategies.
- Data/schema = rollback muJr hai — migrations ke lie gates.
- KV = secrets/certs/keys; Standard vs Premium (HSM).
- 2026 model: **RBAC on KV**, access policies legacy; soft-delete + purge-protection default ON.
- App Service = `@Microsoft.KeyVault(...)` reference; AKS = CSI Secrets Store + workload identity.
- **Managed identity** = koi secret code me nahi; rotation KV ke andar hi, app link continues.
- Blameless postmortem: systems, not people — har incident se 1-2 action items nikaalo.