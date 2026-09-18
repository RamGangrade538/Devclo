# Day 14 — IAM/RBAC + PROJECT 2: VM Stack via CLI (DevClo Expanded)

## Overview | Parichay

Phase 2 ka last day — aur sabse practical. IAM/RBAC matlab "kaun, kis resource pe, kya kar sakta hai" — cloud security ki foundation. Aaj: RBAC roles/scopes, custom roles, PIM, phir **Project 2** mein pure CLI se locked-down stack — RG, VNet, NSG, 2 VMs (nginx), Storage, Load Balancer. Ye Phase 3 (Azure DevOps) ke liye ready karta hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] RBAC roles — Owner/Contributor/Reader + least privilege
- [ ] RBAC scopes — subscription/RG/resource + inheritance
- [ ] Custom roles — exact actions define
- [ ] Azure service roles — AKS, Key Vault, Storage data roles
- [ ] PIM — just-in-time elevated access
- [ ] Conditional Access + Managed Identity vs SPN
- [ ] Load Balancer + App Gateway — health probes, backend pools
- [ ] PROJECT 2 — pure CLI VM stack

---

## Full Topic (LEARN) | Puri Detail

### 1. RBAC — Who + Role + Scope

```
Principal (User/Group/SPN) + Role (Permissions) + Scope (Boundary)
joe@contoso.com                 Contributor              RG: prod-rg
```

| Role | Permissions | Use |
|------|------------|-----|
| Owner | Full + assign roles | Tenant admin |
| Contributor | Full, no role assign | DevOps engineer |
| Reader | View only | Auditor |
| User Access Admin | Manage RBAC only | Security |

```bash
az role assignment create --assignee joe@contoso.com --role Contributor \
  --scope /subscriptions/{sub-id}/resourceGroups/prod-rg
az role assignment list --scope /subscriptions/{sub-id}/resourceGroups/prod-rg -o table
az role assignment delete --assignee joe@contoso.com --role Contributor --scope ...
```

### 2. Scope Hierarchy & Inheritance

```
Subscription (broadest)  →  RG  →  Resource (narrowest)
```
- Inherit downward: sub Reader = har cheez Reader
- Override at lower scope: RG Reader, resource pe Contributor
- Additive: assignments union hote hain (no deny in RBAC — Azure Policy use karo)
- **Rule: sabse narrow scope do jo fit ho**

**Custom role:**
```bash
az role definition create --role-definition '{
  "Name": "Blob Write Only",
  "Description": "Upload/create blobs, no delete",
  "Actions": [
    "Microsoft.Storage/storageAccounts/blobServices/containers/write",
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write"
  ],
  "NotActions": ["Microsoft.Storage/storageAccounts/blobServices/containers/delete"],
  "AssignableScopes": ["/subscriptions/{sub-id}"]
}'
```

### 3. Service-Specific Data Roles

| Service | Role |
|---------|------|
| AKS | Cluster Admin / RBAC Writer / RBAC Reader |
| Key Vault | Administrator / **Secrets User** / Reader |
| Storage | **Blob Data Contributor / Blob Data Reader** |
| ACR | AcrPush / AcrPull / AcrDelete |

**Note:** Control-plane `Reader` ≠ data access. Blob padhne ke liye `Storage Blob Data Reader` (data-plane role) chahiye.

### 4. PIM — Just-in-Time Admin

Normally Reader; kaam per 4 ghante activate Contributor (Eligible vs Active · time-bound 1-8h · approval · MFA mandatory · audit logged).

**2026 note:** Entra ID P2 se milta hai. Prod me standing admin access khatam karo.

### 5. Conditional Access + Identity

```
IF login AND device unmanaged AND outside corp network THEN block/MFA
```
Conditions: user/group, location, device, app, risk. **Managed Identity** (Azure-managed, no secret, auto-rotate) internal access ke liye; **Workload Identity** external CI/CD ke liye.

### 6. Load Balancer + Health Probes

| Component | Matlab |
|-----------|--------|
| Frontend IP | Clients kis IP pe aate hain |
| Backend Pool | VMs serving traffic |
| Health Probe | Unhealthy = pool se out |
| LB Rule | Frontend port → backend port |

```bash
az network public-ip create -g RG -n lbIP --sku Standard
az network lb create -g RG -n myLB \
  --frontend-ip-name lbFrontend --backend-pool-name lbBackend --public-ip-address lbIP

az network lb probe create -g RG --lb-name myLB \
  --name httpProbe --protocol Http --port 80 --path /health --interval 15 --threshold 2

az network lb rule create -g RG --lb-name myLB \
  --name httpRule --protocol Tcp --frontend-port 80 --backend-port 80 \
  --frontend-ip-name lbFrontend --backend-pool-name lbBackend --probe-name httpProbe

az network nic ip-config update -g RG --nic-name vmNic --name ipconfig1 \
  --lb-address-pools lbBackend
```

Probe states: **Healthy** (traffic jaata hai) / **Unhealthy** (pool se remove) / **Unknown**.
**Gotcha:** Probe `/health` but app sirf `/` pe → probe fail → healthy app pool se bahar.

**LB (L4) vs App Gateway (L7):** App Gateway = URL routing, TLS, WAF, cookie affinity.

---

## PROJECT 2 — VM Stack via CLI (No Portal)

### Architecture

`Internet → [LB:80] → VM1/VM2 (nginx :80) · NSG: 22 (my IP)+80 only · VNet 10.0.0.0/16 → subnet 10.0.1.0/24 · Storage (logs container)`

### Step-by-Step (script — `set -euo pipefail`)

```bash
RG="project2RG"; LOCATION="eastus"
az group create -n $RG -l $LOCATION -o table

# VNet + subnet
az network vnet create -g $RG -n projectVNet --address-prefix 10.0.0.0/16 \
  --subnet-name webSubnet --subnet-prefix 10.0.1.0/24

# NSG — SSH (my IP only) + HTTP
az network nsg create -g $RG -n webNSG
MY_IP=$(curl -s ifconfig.me)
az network nsg rule create -g $RG --nsg-name webNSG --name AllowSSH --priority 100 \
  --protocol Tcp --direction Inbound --source-address-prefixes ${MY_IP}/32 \
  --destination-port-ranges 22 --access Allow
az network nsg rule create -g $RG --nsg-name webNSG --name AllowHTTP --priority 200 \
  --protocol Tcp --direction Inbound --source-address-prefixes '*' \
  --destination-port-ranges 80 --access Allow
az network vnet subnet update -g $RG --vnet-name projectVNet \
  --name webSubnet --network-security-group webNSG

# Storage
SA="proj2storage$(date +%s)"
az storage account create -n $SA -g $RG -l $LOCATION --sku Standard_ZRS \
  --kind StorageV2 --min-tls-version TLS1_2
az storage container create -n logs -n $SA --auth-mode login

# Load Balancer
az network public-ip create -g $RG -n lbPublicIP --sku Standard
az network lb create -g $RG -n webLB \
  --frontend-ip-name lbFrontend --backend-pool-name lbBackend --public-ip-address lbPublicIP
az network lb probe create -g $RG --lb-name webLB --name httpProbe \
  --protocol Http --port 80 --path / --interval 15 --threshold 2
az network lb rule create -g $RG --lb-name webLB --name httpRule --protocol Tcp \
  --frontend-port 80 --backend-port 80 --frontend-ip-name lbFrontend \
  --backend-pool-name lbBackend --probe-name httpProbe

# 2 VMs + cloud-init nginx
for i in 1 2; do
  az network nic create -g $RG -n vm${i}Nic --vnet-name projectVNet \
    --subnet webSubnet --nsg webNSG
  az vm create -g $RG -n vm${i} --nics vm${i}Nic --image Ubuntu2204 \
    --size Standard_B2s --admin-username azureuser \
    --ssh-key-values ~/.ssh/id_rsa.pub \
    --custom-data <(cat << 'CLOUD'
#cloud-config
package_update: true
packages: [nginx]
runcmd:
  - systemctl enable nginx
  - systemctl start nginx
  - hostname > /var/www/html/index.html
CLOUD
  )
  az network nic ip-config update -g $RG --nic-name vm${i}Nic \
    --name ipconfig1 --lb-address-pools lbBackend
done

LB_IP=$(az network public-ip show -g $RG -n lbPublicIP --query ipAddress -o tsv)
curl http://$LB_IP            # vm1 / vm2 hostname
az group delete -n $RG --yes --no-wait   # cleanup
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `az role assignment create/list/delete` | RBAC manage |
| `az role definition create --role-definition '{}'` | Custom role |
| `az network lb create/probe/rule create` | LB setup |
| `az network nic ip-config update ... --lb-address-pools p` | VM → backend |
| `az network public-ip create --sku Standard` | Public IP |
| `az vm create --nics nic --custom-data f` | VM + cloud-init |
| `az network vnet subnet update --network-security-group n` | NSG attach |
| `az identity create/federated-credential` | Workload identity |
| `az ad user list --query "[].{n:displayName,e:mail}" -o table` | Entra users |

---

## Practice Lab | Abhi Karein

1. RG create → `project2RG` JSON/table response milna chahiye.
2. VNet + subnet create → verify `az network vnet list`.
3. NSG create + SSH/HTTP rules → `az network nsg rule list`.
4. Storage account (unique name, ZRS) + `logs` container.
5. LB: public IP + `webLB` + probe + rule.
6. VM1 + VM2 with cloud-init nginx (2-3 min wait).
7. Both NICs → `lbBackend` pool.
8. `curl http://$LB_IP` → VM hostname HTML (VM1 ya VM2); probe list `-o table` → Healthy.
9. Ek VM stop karke curl do → traffic VM2 pe (HA prove); NSG rules priority 100/200/65500 check karo.
10. Script file bana ke GitHub pe push; cleanup `az group delete --yes --no-wait`.

---

## Incidents / Tickets | Real Practice

### INC-407 · RBAC Access Denied

- **Situation:** User ko RG pe VMs manage karte "Access Denied".
- **Investigate:**
```bash
az role assignment list --scope /subscriptions/{sub-id}/resourceGroups/prod-rg -o table
az role assignment list --assignee user@contoso.com -o table
```
- **Root cause:** Role **subscription** pe diya but kaam RG pe; ya galat RG pe assignment hai.
- **Fix:** Correct scope pe assign karo: `az role assignment create --assignee user@... --role Contributor --scope /subscriptions/{sub-id}/resourceGroups/prod-rg`.
- **Verify:** `az role assignment list --assignee user@...` correct scope; user ab manage kar raha.
- **Blast radius | Prevent:** Least privilege; monthly Owner audit (`az role assignment list --query "[?roleDefinitionName=='Owner']"`). Scope check pehle, role baad.

### INC-408 · LB Health Probe Failing

- **Situation:** Backend VMs "Unhealthy" — koi traffic serve nahi.
- **Investigate:**
```bash
az network lb probe list -g RG --lb-name myLB -o table
az network lb show -g RG --name myLB --query backendAddressPools -o json
ssh azureuser@<vm>; curl -sI localhost:80; sudo ss -lntp | grep :80
```
- **Root cause:** App port **5000** pe bind, probe **80** pe check — port mismatch ya `/health` path existing nahi.
- **Fix:** `az network lb probe update -g RG --lb-name myLB --name httpProbe --protocol Http --port 5000 --path /health`.
- **Verify:** Probe → Healthy; `curl http://lb-ip` responds.
- **Blast radius | Prevent:** Probe path/port app spec se IaC mein pair rakho; probe failure alert (traffic loss turant pata chale); app `/health` upstream dependencies se check kare.

---

## Interview Corner | Sawal-Jawab

**Q1: RBAC scope aur inheritance?** — Scope = boundary (sub > RG > resource); roles inherit downward; assignments additive (no deny, union). Narrowest scope use karo.
**Q2: Health probe kya karta hai?** — Backend VMs ko periodic check (HTTP/TCP); N failures = unhealthy → backend pool se remove → traffic healthy VMs pe. Downtime prevent.
**Q3: PIM kyun?** — Just-in-time admin: activate (approval + MFA + timed) instead of standing admin. Audit + least privilege — standing admin khatam.
**Q4: Managed Identity vs SPN?** — MSI internal Azure (no secret, auto-rotate); SPN external CI/CD (2026: Workload Identity Federation, no secret).
**Q5: LB vs App Gateway?** — LB L4 (TCP/UDP, simple); App Gateway L7 (URL routing, TLS, WAF, cookie affinity). Web apps → App Gateway; TCP → LB.

---

## Quick Notes | Yaad Rakhna

- RBAC = Who + Role + Scope — narrowest scope do
- Roles inherit down; assignments additive
- Data roles alag: `Storage Blob Data Reader`, not `Reader`
- PIM = just-in-time — approval + MFA + timed
- Probe path/port = app ke actual se match — gotcha
- MSI internal, Workload Identity external — no secrets
- RBAC me deny nahi — Azure Policy use karo
- Project 2: `set -euo pipefail` script GitHub pe push