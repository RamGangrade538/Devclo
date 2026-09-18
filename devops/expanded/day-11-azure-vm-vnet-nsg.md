# Day 11 — Azure VM, VNet & NSG (DevClo Expanded)

## Overview | Parichay

Aaj se Azure — cloud ka king. VM banana, network setup, firewall rules — ye DevOps ka daily kaam hai, aur Azure CLI se poora terminal-verified chalta hai (portal nahi). Aaj: Azure hierarchy, Entra ID, VM lifecycle, VNet/subnet, NSG, cloud-init. Ye Days 12-14 ki foundation hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Azure hierarchy — tenant → subscription → RG → resources
- [ ] Entra ID (puraana Azure AD) — users, groups, SPNs
- [ ] Azure CLI — `az login/group/vm/network/storage`
- [ ] VM — sizes, disks, temp disk gotcha, boot diagnostics
- [ ] VNet — address space, subnets, peering
- [ ] NSG — rules, priority/ordering, allow/deny
- [ ] cloud-init first-boot automation
- [ ] 2026 — Azure Linux VMs, Azure Verified Modules, VMSS

---

## Full Topic (LEARN) | Puri Detail

### 1. Azure Hierarchy

```
Tenant (Entra ID directory)
  └── Subscription (billing + RBAC)
        └── Resource Group (logical grouping)
              ├── VM, VNet, Storage Account...
```

| Level | Matlab |
|-------|--------|
| Tenant | Organization directory (contoso.onmicrosoft.com) |
| Subscription | Billing unit + RBAC boundary |
| Resource Group | Logical container |
| Region/Zone | Datacenter location / fault-isolated zones |

### 2. Entra ID

**2026: "Azure AD" ka naam ab "Microsoft Entra ID" hai — purana naam mat use karo.**

| Concept | Matlab |
|---------|--------|
| User | Human identity |
| Group | Users ka collection — role once to group |
| Service Principal | App/automation identity ("machine user") |
| Managed Identity | Azure-managed, no secrets |

```bash
az ad user list --query "[].{name:displayName,email:mail}" -o table
az ad sp create-for-rbac --name "myapp-sp" --role contributor --scopes /subscriptions/{sub-id}
```

### 3. Azure CLI Basics

```bash
az login
az account set --subscription "Dev"
az configure --defaults output=table group=myRG

az group create --name myRG --location eastus -o table
az group list -o table
az group delete --name myRG --yes --no-wait
```

### 4. VM — Create, Lifecycle, Disks

```bash
az vm create -g myRG -n myVM \
  --image Ubuntu2204 --size Standard_B2s \
  --admin-username azureuser --ssh-key-values ~/.ssh/id_rsa.pub \
  --vnet-name myVNet --subnet mySubnet --nsg myNSG \
  --public-ip-sku Standard --custom-data cloud-init.txt

ssh azureuser@<public-ip>

az vm start/stop/restart/deallocate/delete -g myRG -n myVM
az vm show -g myRG -n myVM -o table
az vm get-instance-view -g myRG -n myVM
```

**Disk types:** Standard HDD (backup) / Standard SSD (dev) / Premium SSD (prod) / Ultra (DBs).
**Temp disk gotcha:** Har VM ka `/mnt/resource` temp disk hota hai — stop/deallocate par **data LOST**. Important data wahan mat rakho.

**Cloud-init (first boot):**
```yaml
#cloud-config
package_update: true
packages: [nginx, docker.io]
runcmd:
  - systemctl enable nginx
  - systemctl start nginx
  - echo "<h1>Hello from cloud-init!</h1>" > /var/www/html/index.html
```

### 5. VNet & Subnets

```bash
az network vnet create -g myRG -n myVNet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name webSubnet --subnet-prefix 10.0.1.0/24

az network vnet subnet create -g myRG --vnet-name myVNet \
  --name dbSubnet --address-prefix 10.0.2.0/24
```

**Planning example:** 10.0.0.0/16 → web 10.0.1.0/24, app 10.0.3.0/24, db 10.0.2.0/24, mgmt 10.0.4.0/24.

**Peering:**
```bash
az network vnet peering create -g myRG -n p1 -v vnet1 --remote-vnet vnet2 --allow-vnet-access
az network vnet peering create -g myRG -n p2 -v vnet2 --remote-vnet vnet1 --allow-vnet-access
# non-transitive: A↔B, B↔C ≠ A↔C
```

### 6. NSG — Firewall Rules

**Rule priority:** chhota number = high priority; pehla match wins. Default: VNet-internal allow, deny inbound internet.

```bash
az network nsg create -g myRG -n myNSG

az network nsg rule create -g myRG --nsg-name myNSG \
  --name AllowSSH --priority 100 --protocol Tcp --direction Inbound \
  --source-address-prefixes 203.0.113.0/24 --destination-port-ranges 22 --access Allow

az network nsg rule create -g myRG --nsg-name myNSG \
  --name AllowHTTP --priority 200 --protocol Tcp --direction Inbound \
  --source-address-prefixes '*' --destination-port-ranges 80 --access Allow

az network nsg rule list -g myRG --nsg-name myNSG -o table
az network nsg rule delete -g myRG --nsg-name myNSG --name AllowHTTP
```

| Field | Matlab | Example |
|-------|--------|---------|
| Priority | 100-4099, low = high | 100 |
| Direction | Inbound/Outbound | Inbound |
| Source | IP/CIDR/*/ServiceTag | 203.0.113.0/24 |
| Ports | single/range/* | 22, 80-443 |
| Access | Allow/Deny | Allow |

**2026:** Application Security Groups (ASG) IP-based rules se better.

### 7. Boot Diagnostics

```bash
az vm boot-diagnostics enable -g myRG -n myVM
az vm boot-diagnostics get-boot-log -g myRG -n myVM
az vm boot-diagnostics get-screenshot -g myRG -n myVM
```

### 8. 2026 — Azure Verified Modules (AVM)

Microsoft-maintained hardened modules (Bicep/Terraform):
```bicep
module vm 'br/public:avm/res/compute/virtual-machine:1.0.0' = {
  name: 'vmDeploy'
  params: { name: 'myVM', location: 'eastus' }
}
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `az login` | Login (browser) |
| `az account set --subscription name` | Switch sub |
| `az group create -n RG -l eastus` | RG create |
| `az vm create -g RG -n VM --image Ubuntu2204` | VM create |
| `az vm start/stop/restart/delete` | VM lifecycle |
| `az vm show -g RG -n VM -o table` | VM details |
| `az network vnet create -g RG -n V --address-prefix 10.0.0.0/16` | VNet create |
| `az network nsg create -g RG -n NSG` + `rule create` | NSG create + rules |
| `az network nsg rule list -g RG --nsg-name NSG -o table` | Rules dekho |
| `az network vnet peering create ...` | Peering setup |
| `az vm boot-diagnostics get-boot-log ...` | Boot debug |
| `az vm auto-shutdown -g RG -n VM --time 19:00` | Cost save |

---

## Practice Lab | Abhi Karein

**1.** `az group create -n labDay11 -l eastus -o table`.

**2. VNet+subnet:** `az network vnet create -g labDay11 -n labVNet --address-prefix 10.0.0.0/16 --subnet-name webSubnet --subnet-prefix 10.0.1.0/24`.

**3. NSG + rules:** allow SSH (from `$(curl -s ifconfig.me)/32`, priority 100) + allow HTTP (priority 200).

**4. cloud-init** (`nginx`, start, custom index.html). 

**5. VM create:**
```bash
az vm create -g labDay11 -n labVM --image Ubuntu2204 --size Standard_B2s \
  --admin-username azureuser --ssh-key-values ~/.ssh/id_rsa.pub \
  --vnet-name labVNet --subnet webSubnet --nsg labNSG --custom-data cloud-init.txt
```

**6. SSH + test:** `ssh azureuser@$(az vm show -g labDay11 -n labVM --query publicIps -o tsv)`; `curl localhost` inside; `curl http://<ip>` from browser.

**7. NSG verify:** `az network nsg rule list -g labDay11 --nsg-name labNSG -o table` (100 AllowSSH, 200 AllowHTTP, 65500 DenyAll default).

**8. Lifecycle:** `az vm stop` (note public IP behavior), `start`, `restart`.

**9.** `az vm auto-shutdown -g labDay11 -n labVM --time 19:00 --timezone "India Standard Time"`.

**10. Cleanup:** `az group delete -n labDay11 --yes --no-wait` + verify `az group list`.

---

## Incidents / Tickets | Real Practice

### INC-401 · VM Unreachable

- **Situation:** `ssh azureuser@<ip>` → "Connection timed out"; portal pe VM Running.
- **Investigate:**
```bash
az vm get-instance-view -g RG -n VM --query instanceView.statuses -o table
az network nsg rule list -g RG --nsg-name NSG -o table
az vm show -g RG -n VM --query publicIps -o tsv
az vm boot-diagnostics get-boot-log -g RG -n VM | tail -20
```
- **Root cause:** NSG mein port 22 allow nahi (default interconnect inbound deny) ya VM deallocated.
- **Fix:** AllowSSH rule `(MY_IP=$(curl -s ifconfig.me))/32` port 22.
- **Verify:** SSH connect hua.
- **Blast radius | Prevent:** IaC/automation create karte waqt NSG rule auto-add karo; `az vm auto-shutdown` for non-prod.

### INC-402 · NSG Blocking 443

- **Situation:** HTTPS nahi aa raha; HTTP 80 chal raha.
- **Investigate:** `az network nsg rule list -g RG --nsg-name NSG --query "[?destinationPortRanges=='443']" -o table`.
- **Root cause:** AllowHTTPS rule nahi — priority/ordering issue ya rule missing.
- **Fix:** Add rule priority 150, port 443, `*` source, Allow.
- **Verify:** `curl -I https://<ip>` → 200.
- **Blast radius | Prevent:** NSG rule PR review mein include karo; naming convention `Allow-HTTPS-All`.

---

## Interview Corner | Sawal-Jawab

**Q1: Azure hierarchy?** — Tenant (Entra directory) → Subscription (billing+RBAC) → RG (logical group) → resources. Har resource exactly ek subscription+RG mein.

**Q2: NSG priority?** — Chhota number = high priority; top-down evaluate, pehla match wins. Default 65500 deny-all inbound — matlab bina allow rule sirf VNet internal allow.

**Q3: stop vs deallocate?** — `stop` sirf OS band (compute billing jaari, IP reserved); `deallocate` releases compute (billing band, dynamic IP release). Persistent disk billing rehta hai.

**Q4: Cloud-init?** — First-boot automation (YAML): packages, runcmd, files. VM-level config — VM create ke waqt `--custom-data` pass karo.

**Q5: VNet peering?** — Private connectivity between VNets (Azure backbone), low latency, non-transitive.

---

## Quick Notes | Yaad Rakhna

- Hierarchy: tenant → subscription → RG → resource
- `az login` + `az account set` start karo
- NSG: chhota priority = pehle; deny low pe rule ordering matters
- Temp disk `/mnt/resource` = stop par data loss
- Cloud-init = first boot automation
- Peering non-transitive hai
- `az vm auto-shutdown` = cost control
- Boot diagnostics = bina console VM debug