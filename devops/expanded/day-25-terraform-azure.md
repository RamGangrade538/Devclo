# Day 25 — Terraform + Azure (DevClo Expanded)

## Overview | Parichay

Day 22 me IaC ki jhalak mili — aaj **Terraform full-track** hai: HCL syntax, lifecycle (`init` → `plan` → `apply` → `destroy`), **remote state + locking**, `azurerm` provider v4, modules, workspaces aur plan reading. End me infra tumhare repo me versioned milega aur `state = secret` wali baat samajh aayegi. Day 26 me state drift, import aur HPA/KEDA hogi.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] IaC principles — declarative, versioned, reviewable infra
- [ ] HCL: resource, variable, output, data source, locals, module
- [ ] `terraform init/validate/plan/apply/destroy` — full lifecycle with flags
- [ ] Plan reading: `+ create`, `~ update`, `-/replace`, `- destroy` meanings
- [ ] Remote state: azurerm backend (storage account), state locking
- [ ] `azurerm` provider v4 + Azure Verified Modules (AVM) + tags
- [ ] Workspaces → dev/prod state separation
- [ ] 2026: OpenTofu, `terraform test`, policy as code (OPA/Checkov)

---

## Full Topic (LEARN) | Puri Detail

### 1. Why IaC | Manual Console = Anarchy

IaC: infra definition code me files (`.tf`) — yuddh git me store hota hai, changes PR me review hote hain, environments reproducible, no "someone created it in portal". Declarative: tum "kya do" batate ho, Terraform diff karke "kya karna hoga" decide karta hai.

### 2. HCL File Structure | Project Layout

```
infra/
├── main.tf          # resources (RG, VNet, AKS, KeyVault)
├── variables.tf     # inputs
├── outputs.tf       # deploy ke baad values
├── providers.tf     # terraform block + provider
├── modules/         # reusable nested modules
└── envs/
    ├── dev.tfvars
    └── prod.tfvars
```

```hcl
# providers.tf
terraform {
  required_version = ">= 1.9"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"          # provider v4
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "tfstatebackenddev"    # globally unique
    container_name       = "tfstate"
    key                  = "dev/terraform.tfstate" # env per key
  }
}

provider "azurerm" {
  features {}
}
```

```hcl
# variables.tf
variable "env" {
  description = "environment name"
  type        = string
  default     = "dev"
}

variable "location" {
  type    = string
  default = "East US"
}

variable "tags" {
  type = map(string)
  default = {
    owner = "devops-team"
    cost  = "week-4"
  }
}
```

```hcl
# main.tf — RG + vnet + subnet + AKS
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.env}-devclo"
  location = var.location
  tags     = var.tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.env}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "aks" {
  name                 = "snet-aks"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-${var.env}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "dk-${var.env}"
  kubernetes_version  = "1.29"     # pin, don't default drift

  default_node_pool {
    name       = "systempool"
    node_count = 2
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "calico"
  }

  tags = var.tags
}

output "aks_kubeconfig_command" {
  value = "az aks get-credentials -g ${azurerm_resource_group.main.name} -n ${azurerm_kubernetes_cluster.aks.name}"
}

output "cluster_id" {
  value = azurerm_kubernetes_cluster.aks.id
}
```

### 3. Lifecycle Commands | Asli Gyan

```bash
terraform init          # providers + backend download, .terraform dir
terraform fmt           # code formatting (CI check)
terraform validate      # syntax + internal consistency
terraform plan -out=tfplan   # dry-run: exact changes (no apply!)
terraform apply tfplan       # apply exact plan
terraform apply -auto-approve  # no prompt (CI me used)
terraform plan -var-file=envs/dev.tfvars   # per-env inputs
terraform show tfplan     # plan details readable
terraform destroy -auto-approve  # delete everything (careful!)
```

`terraform apply` ke pehle **hamesha plan** dekho. In CI: plan stage (review) → apply stage (auto / approval gates).

### 4. Plan Reading | Changes Ko Samjho

| Symbol | Matlab |
|--------|--------|
| `+ create` | Resource naya banega (new infra) |
| `~ update in-place` | Resource modify (tags, size, count) — no recreate |
| `-/+ destroy then create` | **Replace** — Terraform recreate karega (danger: downtime, data loss agar not handled) |
| `- destroy` | Resource hataya jayega (removed from config) |

`~ resource "azurerm_kubernetes_cluster"` for most AKS field changes → **replace** (node pool) ya update (tags). Alert zyada plan show `-/+` on states.

### 5. Remote State + Locking | Risky Hot File

State (`terraform.tfstate`) = source of truth of real infra. Local = high risk (multi-user conflicts, loss, secrets). **Remote backend (azurerm)**: state blob + automatic **lock** (Lease) → do logi apply simultaneously block hota hai ("state has been locked"). Lock stale ho to manually release (carefully) — `terraform force-unlock <lock-id>`.

Why "state = secret": state me IPs, IDs, storage keys, sometimes secrets — never commit to git, encrypt blob, limit access (Contributor only infra team).

### 6. Modules + Data Sources | Reuse Aur Reference

**Data source** = existing Azure resource padho (use without managing):

```hcl
data "azurerm_resource_group" "existing" {
  name = "rg-existing"
}
```

**Module** = reusable block (AVM azurerm_kubernetes_cluster module, `terraform-azurerm-modules/...`). Versioned source. Tags, variables pass hoti hain.

```hcl
module "aks" {
  source  = "Azure/aks/azurerm"
  version = "~> 8.0"            # Azure Verified Module (AVM)
  resource_group_name = azurerm_resource_group.main.name
  ...
}
```

### 7. Workspaces | Environments Alag

`terraform workspace new dev; terraform workspace new prod` — same config, alag state (`key` backend me `<ws>/terraform.tfstate`). Better: separate `backend "azurerm"` with different key per env + tfvars. Workspace is quick for env separation; in prod prefer **separate config root / folders** (dev vs prod isolation, stronger).

### 8. Tags & Naming | Cost Aur Finding

Tags (`owner`, `cost`, `team`, `env`) = cost allocation + non-reproducibility death. Naming: lowercase, prefix-per-env (`rg-dev-devclo`), no special chars mostly. Cost management ab IaC me hi.

### 9. 2026 Notes | Latest Kya Hai

- **OpenTofu** (Linux Foundation fork) — Terraform OSS dual-license parbaat, `tofu` binary, same HCL. 2025-26 me many orgs dual-run. Leap: Terraform 1.x still mainstream.
- **`terraform test`** — unit/integration tests in HCL (`*.tftest.hcl`, run verify/assert). 2026 standard for infra testing.
- **Policy as code** — OPA/Sentinel/Checkov/GCP: policies in CI (e.g., "tags required", "no public IPs") gate plan. `terraform plan` + `tfmask`.
- **azurerm v4** — long deprecations removed, backend API updated, resource renames → upgrade = read CHANGELOG first.
- **AVM (Azure Verified Modules)** — борг approved, versioned, tested modules prefer plain copy-paste.
- **State encryption** — blob encryption at rest; also `terraform plan -refresh-only`.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `terraform init` | Providers/backend/modules prepare |
| `terraform validate` | Syntax/consistency check (fast feedback) |
| `terraform fmt -check` | CI me formatting gate |
| `terraform plan -out=tfplan` | Review changes before apply |
| `terraform show tfplan` | Plan detail readable |
| `terraform apply tfplan` | Exact planned changes |
| `terraform state list` | State me resources |
| `terraform outputs` | Output values |
| `terraform workspace list / new dev` | Environments |
| `terraform force-unlock <ID>` | Stale lock release (careful!) |

---

## Practice Lab | Abhi Karein

1. **Setup:** Azure login `az login`; create state RG + storage using portal/CLI:
```bash
az group create -n rg-tfstate -l eastus
az storage account create -n tfstbackend01 -g rg-tfstate -l eastus --sku Standard_LRS
az storage container create -n tfstate --account-name tfstbackend01
```
2. **Init with backend:** `terraform init` (backend + azurerm v4 downloaded; init retries backend state locking).
3. **Write** `main.tf` + `variables.tf` + `outputs.tf` (upar wale examples, RG+VNet+AKS minimal — ya sirf RG + VNet pehle test).
4. `terraform fmt && terraform validate` → "Success! The configuration is valid."
5. `terraform plan` → AKS resource create show `+`.
6. **Apply:** `terraform apply -var="env=dev" -auto-approve` (2-5 min AKS). Verify portal → RG `rg-dev-devclo` + cluster.
7. `terraform state list` → saare resources. `kubectl get nodes` (with kubeconfig from output).
8. **Second apply — no changes:** `terraform plan` → "No changes". Idempotency proof.
9. **Workspaces:** `terraform workspace new dev`, then `terraform apply` — note state key change (backend same storage, `dev/terraform.tfstate`).
10. **Outputs:** `terraform output` → cluster id + kubeconfig command.
11. **Validate state lock (multi-user test with a second terminal):** run apply in both — second one errors with state locked.
12. **`terraform destroy`** (AKS deletion, verify cost cleanup) — ya enum yaha stop. Notes + screenshot.

---

## Incidents / Tickets | Real Practice

### INC-701 · terraform apply Failed

- **Situation:** CI me `terraform apply` fails — stage red, prod infra not updating. Error: `Error: creating/updating Resource Manager (Compute/VirtualMachines) ... performing CreateOrUpdate: unexpected status 400: ... Virtual Machine couldn't be created (availability set/zones in use)`.
- **Investigate (order):** 1) `terraform validate` → passes. 2) `terraform plan` → shows resource `-/+` (replace) unexpected. 3) Full error from log — 400 with `Conflict`/zone mismatch. 4) `az vm show` / portal → the existing VM uses `availability_zones`, config me ab `zones` list chhota — replace. 5) `terraform state list` to relate.
- **Root cause:** Dev ne portal me VM ko zone-1 me rakha tha, config me `zones = []`/availability set conflict. Replace = Azure rename constraint; apply failed with 400 because in-place upgrade path blocked.
- **Fix:** Align config with real resource (add correct `zones`) ya deliberate replace:
```bash
terraform state rm azurerm_virtual_machine.this
# recreate: ensure app data elsewhere, don't just rm state (dangerous!)
# Proper: fix config to match, plan shows ~ update, apply
```
Fix proper — not state rm. 400 → zones → update zones list → `terraform apply`.
- **Verify:** `terraform apply` green. `kubectl get nodes` / VM wit proper properties. `terraform plan` now shows no regress.
- **Blast radius | Prevent:** CD completely blocked (new prod changes could not). Detect faster: plan stage in PR (review changes before apply), `tflint`/checkov for invalid props. Prevent: no manual portal edits (day 26 topic), approval on prod apply, module version pinned.

### INC-702 · State Locked

- **Situation:** Pipeline apply jaldi fail hua: `Error: Error acquiring the state lock ... state is locked by another process` — 20 min baad bhi. `Lock Info` me `ID: xxx`, `Who: <agent>`.
- **Investigate:** 1) `terraform plan` → same lock error (not just one). 2) Identify lock holder: storage blob lease. `az storage blob show --account-name tfstb --container-name tfstate --name dev/terraform.tfstate --lease-status` → `Leased`. 3) Check if another pipeline/operator actually running (CI queue, terminals). If someone legitimately applying — **wait**.
- **Root cause:** Previous pipeline stage crashed/killed mid-apply (agent timeout) → stale lock (lease) not released. No one actively applying.
- **Fix (careful, last option):**
```bash
# verify truly stale first: no active runs anywhere
terraform force-unlock <LOCK-ID>
```
Then `terraform plan` — lock re-acquired fine. **Never force-unlock while someone applies.**
- **Verify:** `terraform apply` succeeds. Future: pipeline `on_failure: cleanup` / backend `lock_timeout` (e.g., 10m) so locking times out gracefully: `terraform init -backend-config="lock_timeout=10m"`.
- **Blast radius | Prevent:** deploys blocked cluster-wide (all infra changes stuck). Detect faster: pipeline notification "state lock held > X", lock-holder ID in alert. Prevent: proper locking discipline (never cancel mid-apply), lock_timeout, autouse CI single apply path.

---

## Interview Corner | Sawal-Jawab

**Q1: terraform state kya hai aur kyun sensitive?**
State = mapping config → real resources (IDs, metadata, encrypted secrets sometimes). Sensitive because it may contain storage keys, endpoints, passwords. Never commit; remote backend + RBAC restrict; state = single source of truth for Terraform (not the cloud directly).

**Q2: State lock kyun hota hai aur kab worth force-unlock?**
Lock prevents simultaneous applies corrupting state (blob lease). If a legit run is in progress — wait; if verified stale (no active apply/agent died) → `terraform force-unlock <ID>`. Always check first; force-unlock blindly = two applies racing = corruption.

**Q3: plan me `-/+` (replace) kya mean hota hai — risk kya?**
Terraform can't modify resource in place (rename constraints, immutable props like VM size some) → destroy-then-recreate. Risk: downtime, data loss. Mitigate: verify data independent, `lifecycle { create_before_destroy = true }` or use `prevent_destroy` for critical. Review any replace in plan heavily.

**Q4: `terraform import` vs state rm/mv?**
Import: adopt existing (non-Terraform) resource into state + config so Terraform manages it going forward. `state rm` removes from state (resource stays in cloud) — used when ready to abandon resource; `state mv` moves resource in state (module renames). Import + plan to align config is safe approach for drift.

**Q5: OpenTofu vs Terraform 2026 — kya story?**
OpenTofu: community fork of TF OSS (BSL change fallout), `tofu` CLI, HCL-compatible, some init: workspaces, parallel test improvements. Many orgs run dual/provider parity. Choose based on team + support; concepts 100% transferable. Both fine for CV.

---

## Quick Notes | Yaad Rakhna

- Terraform is declarative: tum desired state define karo, tool diff karke apply karta hai.
- **Always plan before apply**; read `+/-` symbols. `-/+` = replace = risk.
- State is secret + source of truth — remote azurerm backend mandatory, never commit.
- State locking automatic with backend; stale lock → force-unlock after verification.
- `variables.tf` + `tfvars` + `workspaces` = per-env config without code duplication.
- Tags = cost & ownership; naming prefix per env.
- Plan-stage CI (PR comment) + policy checks = infrastructure as code at senior level.

---

**Kal:** State import/drift, DR/backup, HPA/KEDA scaling aur Cluster Autoscaler.