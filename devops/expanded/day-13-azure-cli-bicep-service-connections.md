# Day 13 — Azure CLI + Bicep + Service Connections (DevClo Expanded)

## Overview | Parichay

Aaj tarah automation ka — portal click karna band. `az` CLI se direct resources, **Bicep** se declarative infra (ARM ka modern replacement), aur CI/CD ko Azure access dene ke liye service connections (ab Workload Identity — bina secrets ke). Ye Day 14 ke Project 2 ka direct prep hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Azure CLI advanced — `--query`, `-o table/json/tsv`, JMESPath
- [ ] `az group/vm/network/storage` full CRUD
- [ ] Bicep — parameters, resources, modules
- [ ] `az deployment group create` + validate + what-if
- [ ] Service Principal vs Managed Identity
- [ ] Workload Identity Federation — secret-free CI/CD
- [ ] Azure DevOps service connections
- [ ] Error debug — `az deployment group show`, `--debug`

---

## Full Topic (LEARN) | Puri Detail

### 1. CLI Advanced — Queries & Output

```bash
az group list -o table | json | jsonc | tsv | yaml

# JMESPath --query
az group list --query "[0].name" -o tsv                      # single value
az vm list --query "[?contains(name,'web')].{Name:name,IP:publicIps}" -o table
az vm list --query "length(@)" -o tsv                        # count
az vm show -g RG -n VM --query "networkProfile.networkInterfaces[0].id" -o tsv

# Capture + loop
for vm in $(az vm list -g RG --query "[].name" -o tsv); do
  az vm show -g RG -n "$vm" --query "{N:name,I:publicIps}" -o table
done
```

### 2. Bicep — ARM Ka Modern Form (2026 Standard)

| ARM JSON | Bicep |
|----------|-------|
| Verbose | Short, readable |
| `"copy"` | `for` loop |
| `"condition"` | `if` |
| No modules | Native modules |
| Huge files | ~50% smaller |

```bicep
// main.bicep
param location string = resourceGroup().location
param vmName string

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'myVNet'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [{ name: 's', properties: { addressPrefix: '10.0.1.0/24' } }]
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2024-07-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: { vmSize: 'Standard_B2s' }
    osProfile: {
      computerName: vmName
      adminUsername: 'azureuser'
      linuxConfiguration: {
        disablePasswordAuthentication: true
      }
    }
    storageProfile: {
      imageReference: { publisher: 'Canonical', offer: '0001-com-ubuntu-server-jammy', sku: '22_04-lts-gen2', version: 'latest' }
    }
    networkProfile: { networkInterfaces: [{ id: nic.id }] }
  }
}

output vmId string = vm.id
```

**Deploy:**
```bash
az deployment group validate -g myRG --template-file main.bicep
az deployment group what-if -g myRG --template-file main.bicep     # preview
az deployment group create -g myRG --template-file main.bicep \
  --parameters vmName=myVM
az deployment group show -g myRG --name main --query "properties.error" -o json
az deployment operation group list -g myRG --name main \
  --query "[?properties.provisioningState=='Failed']" -o table
az bicep build --file main.bicep          # → ARM JSON compile
```

**Modules (reuse):**
```bicep
module vmModule 'modules/vm.bicep' = {
  name: 'vmDeploy'
  params: { vmName: 'myVM' }
}
```

### 3. Service Principals + Workload Identity (2026)

```bash
# Old way — secret (expires!)
az ad sp create-for-rbac --name "cicd-sp" --role contributor --scopes /subscriptions/{sub-id}
# → appId, password (1 year!), tenant

# 2026: Managed Identity + federation (NO SECRETS)
az identity create -n cicdIdentity -g myRG

az identity federated-credential create \
  --name github-federation --identity-name cicdIdentity -g myRG \
  --issuer "https://token.actions.githubusercontent.com" \
  --subject "repo:myorg/myrepo:ref:refs/heads/main"

# GitHub Actions mein az CLI OIDC login karta hai — koi secret nahi
az role assignment create \
  --assignee $(az identity show -n cicdIdentity -g myRG --query principalId -o tsv) \
  --role Contributor --scope /subscriptions/{sub-id}/resourceGroups/myRG
```

| Feature | Secret-based SPN | Workload Identity |
|---------|------------------|-------------------|
| Secret | Ya, expiry/rotation | Nahi |
| Security | Leak risk | OIDC token |
| 2026 | Legacy | **Standard** |

### 4. Azure DevOps Service Connections

- **Classic:** SPN create karo → Project Settings → Service Connections → New → Azure Resource Manager → paste appId/secret/tenant.
- **2026 (Workload Identity):** Service Connections → New → Azure Resource Manager → **Workload Identity Federation (OIDC)** → pick subscription → Grant. Issuer `vstoken.dev.azure.com/{org}` + subject `sc://{org}/{proj}/{conn}`.

### 5. Error Debug Patterns

```bash
# Validate → What-if → Deploy (CI best practice)
az deployment group validate -g RG --template-file main.bicep --parameters vmName=x
az deployment group what-if -g RG --template-file main.bicep
az deployment group create ... --debug        # full trace

# Common errors
az vm list-usage -l eastus -o table           # QuotaExceeded check
# ResourceNotFound → dependency/dependsOn
```

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|--------------|
| `az group list --query "[0].name" -o tsv` | Query output |
| `az vm list --query "[].{Name:name,IP:publicIps}" -o table` | Projected table |
| `az deployment group create -g RG --template-file main.bicep` | Deploy Bicep |
| `az deployment group validate -g RG --template-file main.bicep` | Validate |
| `az deployment group what-if -g RG --template-file main.bicep` | Preview |
| `az deployment group show -g RG --name n --query "properties.error"` | Errors |
| `az ad sp create-for-rbac --name n --scopes /sub` | SPN (legacy) |
| `az identity create -n n -g RG` | Managed identity |
| `az identity federated-credential create ...` | Federation |
| `az role assignment create --assignee id --role r --scope s` | RBAC |
| `az bicep build --file main.bicep` | Compile to ARM |

---

## Practice Lab | Abhi Karein

**1.** `az group create -n labDay13 -l eastus`.

**2. Bicep:** `main.bicep` with VNet + NSG (AllowSSH port 22) + outputs `vnetId`, `nsgId`.

**3.** `az bicep build --file main.bicep` → generates `.json`.

**4.** `az deployment group validate -g labDay13 --template-file main.bicep`.

**5.** `az deployment group what-if -g labDay13 --template-file main.bicep` → "No changes" ya resources to create.

**6.** `az deployment group create -g labDay13 --template-file main.bicep -o table`.

**7.** Verify: `az deployment group list -g labDay13 -o table`; `az network vnet/nsg list -g labDay13 -o table`.

**8. Legacy SPN:** `az ad sp create-for-rbac --name labSPN --role contributor --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/labDay13` — Note appId/password/tenant.

**9. 2026 federation:** `az identity create -n labIdentity -g labDay13` + `az identity federated-credential create ... github ...`.

**10. Break it:** Parameter galat type (`vmName=123`) → observe `properties.error` → fix → redeploy succeed.

**11.** Cleanup: `az group delete -n labDay13 --yes --no-wait`.

---

## Incidents / Tickets | Real Practice

### INC-405 · Deployment Failed

- **Situation:** `az deployment group create` error — deployment failed.
- **Investigate:**
```bash
az deployment group show -g RG --name main --query "properties.error" -o json
az deployment operation group list -g RG --name main --query "[?properties.provisioningState=='Failed']" -o table
```
- **Root cause:** Param type mismatch (vmName=123 string nahi) ya quota (VM size limit `az vm list-usage`).
- **Fix:** Parameters ko sahi type do; quota ke liye Azure portal support request ya chhota size use karo.
- **Verify:** Deployment "Succeeded".
- **Blast radius | Prevent:** CI mein `validate` + `what-if` gates; Bicep strong params (`@description/@minLength`).

### INC-406 · Service Connection Expired

- **Situation:** Azure DevOps pipeline fail — "expired service connection".
- **Investigate:** Project Settings → Service Connections → status; `az ad sp credential list --id <app-id> -o table`.
- **Root cause:** SPN secret expire (default 1 year).
- **Fix:** Permanent — Workload Identity Federation:
```bash
az identity create -n cicdIdentity -g myRG
az identity federated-credential create \
  --name ado-federation --identity-name cicdIdentity \
  --issuer "https://vstoken.dev.azure.com/{org}" \
  --subject "sc://{org}/{proj}/{conn}"
# Service connection ko workload identity mode pe switch karo
```
- **Verify:** Pipeline rerun → success, no secret.
- **Blast radius | Prevent:** Workload identity default; secret expiry alert (Monitor).

---

## Interview Corner | Sawal-Jawab

**Q1: Bicep vs ARM JSON?** — Same output (ARM JSON), Bicep readable/short, modules native, ~50% smaller. Microsoft officially Bicep recommend karta hai; `az bicep build` compiles.

**Q2: Workload Identity Federation?** — Secret-free CI/CD access. OIDC token (GitHub/ADO) → Azure validates → RBAC role. No secrets to rotate. 2026 standard.

**Q3: `--query` kaise?** — JMESPath over JSON. `"[].name"` = names, `"[0].name"` = first. `-o tsv` single value capture ke liye (variables).

**Q4: validate vs what-if?** — Validate = template valid? What-if = actual resource changes preview (create/update). Dono CI gate ke roop mein.

**Q5: SPN vs Managed Identity?** — Internal Azure resources → Managed Identity (secret-free, Azure managed). External CI/CD → Workload Identity Federation. Legacy secret SPN rotate karo.

---

## Quick Notes | Yaad Rakhna

- `--query` JMESPath + `-o tsv` = variable capture
- Bicep > ARM JSON — 2026 standard
- validate → what-if → create — CI/CD gate
- Workload Identity = no secrets, OIDC
- SPN secret = 1 year expiry pressure
- Deployment errors: `... show --query "properties.error"`
- Bicep `@secure()` params for secrets
- `az bicep build` compile hoti hai ARM mein