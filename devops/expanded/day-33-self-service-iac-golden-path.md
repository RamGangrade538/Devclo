# Day 33 — Self-Service IaC + Golden Path (DevClo Expanded — Platform Engineering)

## Overview | Parichay

Kal Backstage portal me templates banaye — aaj un templates ka **infra wala half** enforce karte hain: Terraform modules versioned, policy-checked, registry se share kiye jaate hain. Jagah jagah aadmi infra tickets banta hai — yahan dev khud se, bina console ke, bina approval ke infra paata hai (guardrails ke saath). Key pieces: **Terraform module registry** (private + Azure Verified Modules/AVM), **versioned golden modules** (semver, changelog), **policy as code** (OPA/Checkov in CI), **environment promotion as template** (dev→qa→prod parameterized), **cost-labels by default**. 5-saal ki skill: infra ko apni "library" se le kar **product** me badalna — reusable, tested, policy-boarded, documented.

## What You'll Learn | Aaj Ki Seekh

- [ ] Terraform module registry kaun banata hai aur kaise use hota hai
- [ ] AVM (Azure Verified Modules) — microsoft-tested standard modules
- [ ] Versioned golden module: semver + CHANGELOG + release gate
- [ ] Private module registry (Terraform Cloud / GitHub registry / custom git source)
- [ ] Policy as code: OPA (Rego) + Checkov — PR and plan gates
- [ ] Environment promotion (dev→qa→prod) as CD template
- [ ] Cost-labels/tags by default — tagging standard enforced
- [ ] CAPE flow — "jira ticket → plan → deploy" via platform
- [ ] Golden module full example (main.tf/variables/outputs)
- [ ] Backstage scaffolder me module consume karna

## Full Topic (LEARN) | Puri Detail

### 1. Terraform Module Registry

Terraform module = reusable, parameterized IaC block (`main.tf`, `variables.tf`, `outputs.tf`, `README.md`, `versions.tf`). **Registry** = versioned store.

| Registry | Who | When |
|----------|-----|------|
| **Public Terraform Registry** | HashiCorp/community | Battle-tested generic modules |
| **Private Registry** (Terraform Cloud / custom) | Your team | Org golden infrastructure |
| **Azure Verified Modules (AVM)** | Microsoft + community | Tested azurerm golden modules |
| **Git tag source** | Internal | `git::https://...?ref=v1.2.0` |

### 2. Versioned Golden Modules — quality bar

- **Semver tags** (`v1.2.0`), no `latest`/`main` refs for prod
- **CHANGELOG.md** per version — upgrade decisions data-driven
- **README.md** — inputs, outputs, examples, deprecation policy
- **CI gates** — `terraform validate`, `terraform fmt -check`, Checkov, demo apply test
- **Deprecation flow** — mark deprecated, give migration path, then delete

Consume:

```hcl
module "aks" {
  source        = "git::https://github.com/your-org/golden-modules.git//modules/aks?ref=v1.2.0"
  environment   = "dev"
  location      = "eastus"
  node_count    = 2
  network_range = "10.1.0.0/16"
  tags = {
    team = "payments", env = "dev", cost = "shared"
  }
}
```

### 3. Policy as Code — OPA (Rego) + Checkov

**Checkov** — static scan in CI (gate BEFORE apply):

```bash
checkov -d . --framework terraform --check CKV_AZURE_1,CKV_AZURE_30 --soft-fail-on-check CKV_AZURE_10
```

**OPA/Conftest (Rego)** — plan-time policy. Mandatory tags example:

```rego
package main
deny[msg] {
  resource := input.resource
  resource.type == "azurerm_resource_group"
  resource.attributes.tags["cost"] == ""
  msg := "resource group must have cost tag"
}
```

**Layers of enforcement:**
1. PR gate (Checkov + Rego) — fast feedback
2. Plan gate (`terraform plan -json` → `conftest test plan.json`) — pre-apply
3. Apply-time (org policy / Azure Policy / Sentinel)
4. Drift detection (scheduled plan) — post-deploy reality check

### 4. Private Module Registry

- **Terraform Cloud private registry** — native: `source = "app.terraform.io/myorg/modules/aks/azurerm"`
- **GitHub-hosted** — `git::https://github.com/myorg/golden-modules.git//modules/aks?ref=vX.Y.Z` (simple, fleet-proof)
- Auth via `~/.terraformrc` hostname + token

### 5. Environment Promotion as Template

Promotion = **same module, different params + gates** — not repo copies:

```
golden-modules/appservice/
  examples/
    dev.basic/        # small sku, env=dev
    qa.with-lb/       # + Load Balancer + quotas
    prod.hardened/    # + private endpoint + backup + audit
```

```bash
promote() {
  local env=$1
  terraform init -backend-config="backend.$env.tfvars"
  terraform plan -out=tf.plan -var-file="$env.tfvars"
  terraform apply tf.plan
}
```

Gates: dev auto → qa QA approval → prod change-board + runbook approval. Same code, different gates = reproducibility + governance.

### 6. Cost Labels By Default

Mandatory tags — policy enforces, resource carries:

```hcl
locals {
  required_tags = {
    team = var.team
    env  = var.environment
    cost = var.budget_code
    app  = var.app_name
  }
}
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.app_name}-${var.environment}-${var.location_short}"
  location = var.location
  tags     = merge(local.required_tags, var.extra_tags)
}
```

Cost dashboards group by tag → budget alerts per team/env → chargeback groundwork (Day 39 FinOps).

### 7. CAPE — Infrastructure Provisioning Flow

**CAPE** (Cloud Architecture/Provider/Approval/Execution) — simplified golden path:

```
Ticket/Request (portal)
  → approved (auto if within budget, manual if > threshold)
    → module version (semver locked)
      → plan (no destructive auto) → apply in target env
        → post-verify (health) → record cost & metadata
```

Dev ke liye: request → infra ready (namespace, DB, secret) — no console, no SSH. Pipeline = flow, humans = exception handle karte hain.

### 8. Sample Golden Module — main.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
  }
}

locals {
  tags = merge({
    team = var.team, env = var.environment,
    cost = var.budget_code, app = var.app_name,
    managed-by = "terraform-golden"
  }, var.extra_tags)
  rg_name = "rg-${var.app_name}-${var.environment}-${var.location_short}"
}

resource "azurerm_resource_group" "main" {
  name     = local.rg_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.app_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.vnet_cidr]
  tags                = local.tags
}

resource "azurerm_service_plan" "main" {
  name                = "plan-${var.app_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = var.plan_sku
  tags                = local.tags
}

resource "azurerm_linux_web_app" "main" {
  name                = "app-${var.app_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  tags                = local.tags
  site_config {
    always_on         = true
    health_check_path = "/health"
  }
  app_settings = var.app_settings
}

output "app_url" { value = "https://${azurerm_linux_web_app.main.default_hostname}" }
output "rg_name" { value = azurerm_resource_group.main.name }
```

### 9. 2026 Notes

- **AVM** kontinued — one-stop golden module library; preferred over raw azurerm for standard tasks.
- **OpenTofu** — Terraform fork, compatible; orgs run Checkov/OPA independent of provider.
- **Score spec / CNOE** — workload description can drive IaC golden paths; workload.yaml standardized.
- Policy engines (Kyverno/OPA) also gate the **cluster** side (Day 40); Checkov/Conftest gate the **infra-code** side.

## Practice Lab | Abhi Karein

1. `modules/appservice/` golden module banaya (sample above) — `main.tf`, `variables.tf`, `outputs.tf`, `README.md`.
2. `terraform init` + `validate` + `fmt -check` clean.
3. Local consume test — `source = "./modules/appservice"` + dev vars → `terraform plan` review.
4. Tag release `v0.1.0`; `CHANGELOG.md` likho; destroy.
5. **Checkov** run — `checkov -d . --framework terraform` — findings fix karo (or `--soft-fail` documented).
6. **OPA/Conftest**: Rego policy (tags + provider allowlist); `conftest test plan.json` — deny message debug.
7. Version-locked consume (`?ref=v0.1.0`) — pin prove karo.
8. **Promote flow**: dev → qa (approval) → prod CI stage-approval pipeline banao; same plan/apply code path.
9. Tags galat daalo → Checkov/OPA detection verify.
10. `az resource list --tag managed-by=terraform-golden` — cost-attributed resources count.
11. Backstage template (Day 32) me module ke `init` add karo — portal → infra.
12. `docs/platform-iac.md` dokument + push (portfolio).

## Real Incidents | Ek "Platform" Problem

### TICKET INC-PLAT-33: "Golden module me drift — dev ne console se infra badal diya"

- **Situation**: Prod App Service pe performance issue. Ops ne console se `sku` upgrade kiya + logging toggle. Platform report drift: `terraform plan` unexpected changes. 3 App Services affected.
- **Investigate**: `terraform plan` → `sku` change detected; `terraform state show` — actual vs desired; git history — no PR/tag for change; console activity log — manual console change confirmed.
- **Root cause**: Module input validation didn't forbid console sku change; no drift detection (plan only manual); prod RBAC too permissive — Contributor on prod RG; resource locks (`prevent_destroy`) s hi logs absent for infra.
- **Fix**: (1) Scheduled nightly `terraform plan` in CI = drift alert (unexpected diff = ticket); (2) RBAC prod → Reader-only (platform API deploy); (3) `lifecycle` config + tags cleanup; (4) sku allowlist in module variables (validation clause).
- **Verify**: `terraform apply` → state matches git; drift alert next run clean; RBAC validation pehle prod ke liye `Reader` only.
- **Prevent**: (1) Guardrails + drift-as-ticket; (2) console changes flagged (audit policy); (3) vending via platform only (no direct prod access); (4) monthly drift report in platform newsletter.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q1: "Golden module vs generic module?"**
> Golden module = org ka approved, security-tested, cost-tagged, versioned standard — "how we do infra here." Generic = public, no org policy. Golden path enforces consistency (security, cost, monitoring), reduces decision fatigue; exceptions = review. AVM = Microsoft's trusted core you wrap into your golden layer.

**Q2: "Policy as code kahan enforce karein?"**
> Layered: PR/CI (Checkov + OPA), plan gate (`plan -json` + conftest), apply-time (org/Azure Policy/Sentinel), drift scan. Rules: policies versioned, tested, allow remediation path — block without reason = revolt. Kyverno/OPA for cluster admission (Day 40) separately.

**Q3: "Versioned module registry design?"**
> Registry = storage + versioning + discovery. Private TFC registry ya GitHub `git::...?ref=vX`. Version = semver tag; CHANGELOG + README + release branch. Callers pin versions (no `latest`) — supply-chain integrity. Discoverability: golden-module list in portal/catalog.

**Q4: "Environment promotion kitne repetitive?"**
> Promotion = parameterize, not copy. Same module, env-specific vars (dev small, prod hardened); wrapper CI promotes via gates (dev auto, qa approve, prod change-board). Same plan/apply logic. Reproducible, auditable, zero drift between envs. Template this = quality at scale.

**Q5: "Cost-labels enforce kaise?"**
> Tagging standard mandatory (team/env/cost/app); enforced by Rego deny, Checkov checks, org policy. Showback first, chargeback later. FinOps dashboard groups by tag → right-size decisions, budget alerts per team. "No tag = no deploy" gate — platform's FinOps muscle.

## Quick Notes | Yaad Rakhna

- Golden module: versioned (semver), README+CHANGELOG, CI-tested (validate/Checkov/apply).
- Registry: private (TFC/GitHub) + AVM base; pin versions, no `latest` for prod.
- Policy = OPA/Checkov layers: PR, plan, apply, drift.
- Promotion = parameterized rendering + per-env gates — no repo copies.
- Cost labels: tag standard enforced → FinOps-ready (Day 39).
- CAPE flow = portal request → auto plan/approve → apply → post-verify.
- Golden module = platform's shipping product; drift = ticket, not guesswork.

## Next | Aage Bolte Jaana

Golden path ready — ab uski **adoption measure** karo: DORA metrics + developer experience (Day 34).

[Day 34 — DevEx + DORA Metrics](../expanded/day-34-devex-dora-metrics.md)