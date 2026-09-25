# 🏗️ Infrastructure as Code — Terraform, OpenTofu, Pulumi, CloudFormation

> **Hinglish:** Infra (VMs, networks, DBs, load balancers) ko **click karne se nahi, code ke through** manage karo — Terraform code se cloud resources banao/modify/delete karo, taaki sab versioned, reviewable aur reproducible ho. Ye hi hai "Infrastructure as Code (IaC)".

## 📖 Overview — Ye Topic Kya Hai

Pehle infra console pe manually click-click karke banaya jata tha — speed slow, mistakes adhik, aur "kaunse server konse resource" kisi ko yaad nahi. **IaC** iska uttar hai: infrastructure ko **code** (`.tf`, `.bicep`, YAML) me likho, Git me version karo, PR se review karo, plan/apply se safely apply karo. Ab tumhare paas **reproducible, auditable, automated** infra hai.

**Terraform** (aur uska open-source fork **OpenTofu**) — provider-based (AWS/Azure/GCP anywhere), **declarative**: tum **desired state** likhke dete ho, tool difference (drift) ko apply karta hai. Parallel: CloudFormation (AWS-only), Pulumi (real languages), Bicep (Azure). Ansible bhi config-orchestration me use hota hai par Terraform infra provisioning ka king hai.

## 🟢 Beginner — Shuruaat yahan se

- Terraform install + `terraform init` pehla provider.
- Ek resource banao (example: storage bucket / resource group) — `plan`, `apply`, `destroy`.
- Variables + outputs — config banai parametrize.
- `terraform validate` + `fmt`.

## 🟡 Intermediate — Ab real infra likho

- **State** kya hai, kyon zaroori, local vs remote (backend).
- **State locking** — do log ek saath apply na karein.
- **Modules** — reusable chunks; code DRY.
- **Data sources** — existing resources read karna.
- **Workspaces / environments** — dev/stage/prod.
- **Import & drift** — existing resources ko terraform me lao; changes track karo.

## 🔴 Advanced — Pro bano

- **Dependency graph & parallel apply** — resource ordering.
- **Remote backends (S3/Azurerm/GCS + locking)** — team collaborate.
- **CI/CD me terraform** — plan in PR, apply on merge (multi-env).
- **Policy-as-code** — sentinel/OPA se infra guardrails.
- **Multi-provider + multi-account** — org-level landing zones.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Infrastructure as Code** — infra ko code se manage; versioned, reproducible.
- [ ] **Declarative vs imperative** — tum kya chaho (declarative) vs kaise karo (imperative).
- [ ] **Terraform** — cross-provider IaC tool (HCL).
- [ ] **OpenTofu** — Terraform ka open-source fork.
- [ ] **CloudFormation** — AWS-native IaC (YAML/JSON).
- [ ] **Pulumi** — IaC in real languages (TS/Python/Go).
- [ ] **Ansible** — config/provisioning + IaC-ish (imperative-ish, agentless).
- [ ] **Providers** — tool to cloud API ka bridge (AWS/Azure/GCP).
- [ ] **Resources** — code-me-declared infra object.
- [ ] **Data sources** — existing infra ko read karna.
- [ ] **Variables** — inputs; type + default.
- [ ] **Outputs** — apply ke baad nikali jane wali values.
- [ ] **Modules** — reusable resource bundles.
- [ ] **State** — real-world infra ka map (JSON file).
- [ ] **Remote state** — state ko shared storage pe (team).
- [ ] **State locking** — simultaneous apply se bachav.
- [ ] **Workspaces** — ek config, multiple environments.
- [ ] **Import** — existing resource ko state me lao.
- [ ] **Drift** — actual infra vs desired change; plan detect karta hai.
- [ ] **Plan** — "kya hoga" bina chhue preview.
- [ ] **Apply** — plan ko execute; resources create/update.
- [ ] **Destroy** — resources delete karna.
- [ ] **Dependency graph** — resources ka order; parallel safe parts.
- [ ] **HCL syntax** — `resource "type" "name" { key = val }`.
- [ ] **terraform init / validate / fmt** — setup + health.
- [ ] **Backends** — state kahan store (local/s3/azurerm).
- [ ] **Sensitive data in state** — secrets state me hain, secure backend chahiye.
- [ ] **Policy as code (OPA/Sentinel)** — infra ki rules enforce.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Terraform | IaC (HCL) | Cross-cloud infra code |
| OpenTofu | Open TF fork | Open-source preference |
| AWS CloudFormation | AWS IaC | AWS-only stacks |
| Azure Bicep | Azure IaC | Azure-native |
| Pulumi | IaC in code | Programmatic infra |
| tflint / tfsec / checkov | Linters/security | CI me infra quality gates |
| terraform-docs | Docs generation | Maintainable module docs |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First Resource:** Solve infra on cloud: resource group/bucket banao, variables/outputs ke saath, destroy karo.
- [ ] **Lab 2 — Two-Resource Stack:** VM + VNet/security group ek saath; dependency graph samjho.
- [ ] **Lab 3 — Module Reuse:** Ek `vnet` mini-module banao, 2 jagah use karo; count/for_each try karo.
- [ ] **Lab 4 — Remote State + Locking:** Backend pe state migration karo, two-terminal locking test karo.
- [ ] **Lab 5 — Drift & Import:** Resource bahar se badlo, `plan` drift dikhao; `terraform import` se state me lao.
- [ ] **Project — Env-Isolated Infra:** dev/stage/prod workspaces ke saath full 3-tier infra (vnet + app + db) code me.

## 🔗 Related Topics

- [☁️ Cloud Fundamentals](../modules/cloud-fundamentals.md)
- [🤖 Ansible & Config Management](../modules/config-management.md)
- [🔁 GitOps](../modules/gitops.md)
- [IaC & Terraform Deep Dive](../topics/what-is-iac.md)
- [Day 22 — Terraform (Azure IaC)](../day-22-terraform-azure-iac.md)