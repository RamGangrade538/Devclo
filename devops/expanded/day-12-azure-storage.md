# Day 12 — Azure Storage (DevClo Expanded)

## Overview | Parichay

Azure Storage = cloud ka hard drive — files, backups, logs, images. Par sirf store karna nahi; access control, redundancy, security sab matter karta hai. Aaj: storage accounts (LRS/ZRS/GRS), blob tiers, SAS tokens, AzCopy, private endpoints, RBAC access. Interview me storage ke yehi sawal aate hain.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Storage account redundancy — LRS/ZRS/GRS/RA-GRS
- [ ] Blob types + access tiers (Hot/Cool/Cold/Archive)
- [ ] Auth methods — account keys vs SAS vs Entra RBAC
- [ ] SAS tokens — scope, expiry, permissions
- [ ] Azure CLI — blob upload/download/list
- [ ] AzCopy — bulk transfer
- [ ] Private endpoints — public lock karo
- [ ] Security — key rotation, deny public, immutability

---

## Full Topic (LEARN) | Puri Detail

### 1. Redundancy Options

| Type | Copies | Locations | Use Case |
|------|--------|-----------|----------|
| **LRS** | 3 | 1 datacenter | Dev, non-critical |
| **ZRS** | 3 | 3 zones (1 region) | Prod HA |
| **GRS** | 6 | 2 regions | DR |
| **RA-GRS** | 6+ | 2 regions + read secondary | DR + reads |

**2026: prod minimum ZRS; LRS = datacenter failure = data loss.**

Storage account name = unique DNS: `myacct.blob.core.windows.net`.

### 2. Blob Types + Access Tiers

| Type | Use |
|------|-----|
| Block Blob | Files/images/backups (common) |
| Append Blob | Logs |
| Page Blob | VHD disks |

| Tier | Access | Cena | Use |
|------|--------|------|-----|
| Hot | Frequent | $ store / cheap access | Active |
| Cool | 30+d | $$ | 90-day retention |
| Cold | 90+d | $$$ | 180-day retention |
| Archive | 180+d | cheap store, $$$ access, hours retrieval | Compliance |

```bash
az storage account create -n myacct -g myRG -l eastus --sku Standard_ZRS --kind StorageV2 --access-tier Hot
```

### 3. Authentication — 3 Ways

| Method | Matlab | Use |
|--------|--------|-----|
| Account Keys | Full access | Dev only, rotate |
| SAS | Scoped + expiry | External sharing |
| Entra RBAC | Role-based, auditable | **Prod (recommended)** |

```bash
az storage account keys list --account-name myacct -o table
```

**SAS token:**
```bash
# Key-based SAS
az storage blob generate-sas --account-name myacct --container-name c --name f \
  --permissions rwdl --expiry 2026-12-31 --full-uri

# 2026: User Delegation SAS (Entra-based, no account key exposure)
az storage blob generate-sas --account-name myacct --container-name c --name f \
  --permissions rwdl --expiry 2026-12-31 --auth-mode login --full-uri
```

| SAS perm | Matlab |
|----------|--------|
| r | read |
| w | write |
| d | delete |
| l | list |

Best practice: shortest expiry, least privilege.

### 4. CLI Blob CRUD

```bash
az storage container create --name c -n myacct --auth-mode login
az storage blob upload -c c -n f --file ./f.txt -n myacct --auth-mode login
az storage blob download -c c -n f --file ./out.txt -n myacct --auth-mode login
az storage blob list -c c -n myacct --auth-mode login -o table
az storage blob delete -c c -n f -n myacct --auth-mode login
az storage blob set-tier -c c -n f --tier Cool -n myacct
```
`--auth-mode login` = Entra (recommended); account keys prod me nahi.

### 5. AzCopy — Bulk Data

```bash
wget https://aka.ms/downloadazcopy-v10-linux && tar -xvf azcopy_linux_amd64_*.tar.gz
sudo cp azcopy_linux_amd64/azcopy /usr/local/bin/

azcopy copy './data/*' 'https://acct.blob.core.windows.net/c?${SAS}' --recursive
azcopy copy 'https://acct.blob.core.windows.net/c?${SAS}' './downloads' --recursive
azcopy sync './local' 'https://acct.blob.core.windows.net/c?${SAS}' --delete-destination true
azcopy list 'https://acct.blob.core.windows.net/c?${SAS}'
```

### 6. Private Endpoints — Lockdown

```bash
az network private-endpoint create -g myRG --name storagePE \
  --vnet-name myVNet --subnet mySubnet \
  --private-connection-resource-id $(az storage account show -n myacct --query id -o tsv) \
  --group-id blob --connection-name blobConn

az network private-dns zone create -g myRG -n privatelink.blob.core.windows.net
az network private-dns vnet-link create --zone-name privatelink.blob.core.windows.net \
  -g myRG --virtual-network myVNet
```
**2026: prod mein private endpoint mandatory + public deny.**

### 7. Security Hardening

```bash
az storage account update -n myacct --default-action Deny          # only private/PE
az storage blob service-properties delete-policy update -n myacct --enable true --days-retained 14
az storage account keys renew -n myacct --key key1                 # rotation
az storage account network-rule add -n myacct --ip-range 203.0.113.0/24
```

### 8. Connection Strings

```bash
az storage account show-connection-string -n myacct -g myRG --query connectionString -o tsv
```
Python: `BlobServiceClient.from_connection_string(os.environ["AZURE_STORAGE_CONNECTION_STRING"])`.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `az storage account create -n name -g RG -l loc --sku Standard_ZRS` | Storage create |
| `az storage account keys list -n name` | Keys dekho |
| `az storage container create --name c -n acct --auth-mode login` | Container create |
| `az storage blob upload/download/list/delete` | Blob CRUD |
| `az storage blob generate-sas ...` | SAS generate |
| `az storage account update -n name --default-action Deny` | Public deny |
| `azcopy copy src dst --recursive` | Bulk copy |
| `azcopy sync src dst` | Only changed files |
| `az network private-endpoint create ...` | Private endpoint |

---

## Practice Lab | Abhi Karein

**1.** `az group create -n labDay12 -l eastus`.

**2.** `az storage account create -n labstorage$(date +%s) -g labDay12 -l eastus --sku Standard_ZRS --kind StorageV2 --min-tls-version TLS1_2`.

**3.** `SA=$(az storage account list -g labDay12 --query "[0].name" -o tsv)`, `az storage container create --name mycontainer -n $SA --auth-mode login`.

**4.** `echo "Hello Azure Storage!" > testfile.txt`, upload blob.

**5.** `az storage blob list -c mycontainer -n $SA --auth-mode login -o table`, download + `cat`.

**6. SAS:** generate `--permissions r --expiry 2026-12-31 --full-uri`; `curl "$SAS"` works.

**7.** (Optional VNet from Day 11) Private endpoint + private DNS zone.

**8.** `az storage account update -n $SA --default-action Deny`; verify blob list still works (private endpoint se).

**9.** `azcopy copy './testfile.txt' 'https://...?${SAS}'` + `azcopy list`.

**10.** Cleanup: `az group delete -n labDay12 --yes --no-wait`.

---

## Incidents / Tickets | Real Practice

### INC-403 · Storage Permission Denied

- **Situation:** App blob upload kar rahi hai → "403 Server failed to authenticate".
- **Investigate:**
```bash
az storage blob list -c c -n acct --auth-mode login
echo $SAS_TOKEN | cut -d'?' -f2 | tr '&' '\n' | grep se     # expiry?
```
- **Root cause:** SAS expired ya wrong scope (sirf `r` diya, `w` chahiye tha).
- **Fix:** Regenerate SAS with proper perms + expiry, least privilege:
`az storage blob generate-sas ... --permissions rw --expiry <near-short>`.
- **Verify:** Upload with new SAS succeeds.
- **Blast radius | Prevent:** Prod mein RBAC (`Storage Blob Data Contributor`) prefer; SAS monitoring + short expiry; automate rotation.

### INC-404 · App Can't Resolve Storage (DNS)

- **Situation:** App se storage resolve nahi — "Name or service not known".
- **Investigate:**
```bash
nslookup acct.blob.core.windows.net
az network private-endpoint list -g RG -o table
az network private-dns zone list -g RG -o table
```
- **Root cause:** Private endpoint hai but private DNS zone VNet se linked nahi; public access deny → DNS resolve fail.
- **Fix:**
```bash
az network private-dns zone create -g RG -n privatelink.blob.core.windows.net
az network private-dns vnet-link create --zone-name ... -g RG --virtual-network myVNet
```
- **Verify:** `nslookup acct.blob.core.windows.net` → private IP.
- **Blast radius | Prevent:** IaC (Bicep/Terraform) mein endpoint + DNS zone + link ek saath; module boundary mein bundle.

---

## Interview Corner | Sawal-Jawab

**Q1: LRS/ZRS/GRS?** — LRS 1 datacenter, ZRS 3 zones (1 region), GRS do regions (DR), RA-GRS + read secondary. Prod ZRS minimum.

**Q2: SAS vs RBAC?** — SAS = temporary scoped access (external sharing). RBAC = auditable role assignment (internal/prod). 2026: RBAC prefer, SAS sirf jab RBAC possible nahi.

**Q3: Private endpoint?** — Storage ko VNet ke andar private IP; public access band; traffic Azure backbone pe. Prod mandatory.

**Q4: Blob tier kaise chuno?** — Hot (frequent), Cool (30d), Archive (180d storage cheap, retrieval hours). Cost vs access pattern.

**Q5: AzCopy vs CLI?** — CLI = individual ops/automation; AzCopy = GBs/TBs bulk, multi-threaded, resumable.

---

## Quick Notes | Yaad Rakhna

- Redundancy: LRS/ZRS/GRS — prod ZRS minimum
- SAS scoped + short expiry; RBAC prefer prod mein
- Private endpoint + `--default-action Deny` = prod lockdown
- AzCopy = bulk transfer standard
- Tiers: Hot/Cool/Cold/Archive cost-access tradeoff
- Account keys = full access — rotate, never expose
- `--auth-mode login` = Entra auth
- Soft delete enable (14 days) — accidental delete recovery