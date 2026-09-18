# Deep Dive: Multi-Cloud & Cloud-Agnostic Architecture — Portability, Terraform, Abstractions

> **Kaha ka hai:** Day 42 ka gahra version. "Runs on any cloud" is engineering discipline, not luck: containers → k8s → Terraform modules → service abstractions → OTel. Trade-offs (complexity/latency) first, then strategy.

---

## 1. Why Multi-Cloud (honest reasons)

| Reason | When justified | Anti-reason |
|--------|---------------|-------------|
| Resilience (last-resort DR) | DR for critical systems | "buy insurance we never test" |
| Best-of-breed PaaS | specific PaaS uniquely stronger | flitting between 3 providers |
| Negotiation/avoid lock-in | real switching cost reduction | "marketing says multi" |
| Compliance/geography | data residency per region | — |
| Cost | spot/zones differ | complexity rarely cheaper |

**Reality check:** single cloud + **portable discipline** = same business benefit for 10x less complexity. Multi-cloud is advanced, not default.

---

## 2. Portability Ladder

```
L0  Docker images          — compute portable
L1  K8s manifests (helm)   — orchestration portable (AKS/EKS/GKE)
L2  Terraform modules      — infra definitions portable (per-provider backend)
L3  Service abstractions   — blob/queue/secrets via standard interfaces
L4  Provider-agnostic SDK  — Dapr / Go Cloud / abstractions for full app portability
```
Aim L2-L3 realistically; L4 rarely worth it except strategic workloads.

---

## 3. Standard Interfaces (the L2-L3 backbone)

| Concern | Standard interface | Azure | AWS | GCP |
|---------|--------------------|-------|-----|-----|
| Object storage | S3 API (compatible) | Blob (S3-compat via ADLS), MinIO on AKS | S3 | GCS S3-compat |
| Queue/messaging | Kafka protocol | Event Hubs (Kafka endpoint) | MSK | Pub/Sub (Kafka via Confluent) |
| Relational DB | PostgreSQL | Azure Database for PG | RDS PG | Cloud SQL |
| Identity | OIDC (federated) | Entra OIDC | IAM OIDC | Workload Identity (OIDC) |
| Secrets | Key Vault API / Vault | Key Vault | SM/Parameter Store | Secret Manager; Vault everywhere |
| Observability | OTel → Prom/Grafana/Tempo | Azure Monitor works w/ OTel | — | — |

Write against the interface (boto3/S3, kafka-python, postgres driver, otel-exporters) → swap cloud by config, not by rewrite.

---

## 4. Terraform Multi-Provider (same module, conditionally)

```hcl
# modules/web/main.tf — provider-agnostic inputs
variable "cloud" { type = string }
variable "location" { type = string }

locals {
  is_azure = var.cloud == "azure"
}

resource "azurerm_linux_web_app" "this" {
  count = local.is_azure ? 1 : 0
  name                = "web-${var.app_name}"
  resource_group_name = var.rg
  location            = "eastus"
  service_plan_id     = var.plan_id_azure
}

resource "aws_lambda_function" "this" {
  count      = local.is_azure ? 0 : 1
  function_name = "web-${var.app_name}"
  runtime    = "python3.11"
  handler    = "app.handler"
}
```
```
Strategy: shared module with count/conditional per provider + input 'cloud'
  → same repo, two environments, one plan. GitOps by environment. 
State: per-provider backend (S3/Azure Storage/tfr) fine — separate per env.
```
Tools: Terraform (multi-provider), Pulumi (programmatic multi-cloud, strong typing), OpenTofu (OSS Terraform fork).

---

## 5. Application Abstractions — Config, Storage, Source

```python
# config.py — driver pattern
import os
STORAGE = os.getenv("STORAGE_DRIVER", "s3")
if STORAGE == "s3":
    import boto3; client = boto3.client("s3", endpoint_url=os.getenv("S3_ENDPOINT"))
else:
    from azure.storage.blob import BlobServiceClient
    client = BlobServiceClient(conn_str=os.getenv("AZURE_CONN"))
client.upload(...)
```
Env := env-var switch `STORAGE_DRIVER=azure|s3|gcs`.

**Twelve-Factor** (the cloud-agnostic bible earlier days!) — config from env, build/release/run separated, stateless, backing services.

---

## 6. Abstraction Runtimes (Level 4, optional)

| Tool | What | When |
|------|------|------|
| **Dapr** | sidecar building-blocks how: state, pub/sub, secrets, HTTP/gRPC APIs — same API on any cloud & Kubernetes/local | strategic medium complexity |
| **Go Cloud (gocloud.dev)** | consistent Go APIs (blob/docstore/runtimevar) | Go-only codebases |
| **Vapor/Quarkus/etc.** | polyglot | languages vary |
| **Kubernetes itself** | the portable substrate | defaults: k8s is already cloud-neutral |

---

## 7. Multi-Cloud Strategy Patterns

| Pattern | Description |
|---------|-------------|
| **Active-Active (regions+clouds)** | both serve / DNS steering; complexity high; strong DR claim, cost ~2x |
| **Active-Passive DR** | primary cloud; full stack + preloaded waiting in 2nd cloud (GitOps ready); flip on outage |
| **Spl Inter-Cluster** | separate domains use different clouds yet talk through standard API/mesh |
| **"Portable single cloud"** | single active cloud, all abstractions standard — easy to flee later |

**Shared practices:** GitOps (all envs from one repo), OTel exporters, OpenID identity federation, Terraform modules, Chaos/GameDay across both, FinOps across both bill systems.

**Resilience more granular:** prefer **multi-region same cloud** (ZRS/geo-replication, cheaper, simpler) over multi-cloud DR unless reasons exist.

---

## 8. Interview Questions — Multi-Cloud

| Question | Strong answer |
|----------|---------------|
| "Multi-cloud kab worth it?" | DR for critical, real lock-in risk, region/regulatory, best-PaaS needs. Otherwise single-cloud + portable discipline. |
| "Portability levels?" | DR: containers → k8s → tf modules → service abstractions → SDK-abstraction. L2-L3 pragmatic. |
| "Terraform multi?" | Shared modules with count/conditional per provider + `cloud` var; per-env state/build via GitOps. |
| "Standard interfaces?" | S3-ish storage, Kafka-protocol queue, PostgreSQL DB, OIDC identity, OTel observability — write to interface not to SDK. |
| "Lock-in kya commits you?" | Provider-proprietary APIs/paas-locked features, SDK-specific code, IAM flow, inter-zone data, provider integrations. Audit checklist. |
| "Multi-region vs multi-cloud?" | Multi-region simpler, cheaper, geo-tolerant; multi-cloud extra resilience but complexity/cost. Choose by risk tolerance. |
| "Pulumi vs Terraform?" | TF: declarative HCL, huge ecosystem. Pulumi: imperatively coded (TS/Py/Go/C#), typed, testable. Both multi-provider. |

**Related:** [Day 42](../day-42-multicloud-patterns.md) · [GitOps](../topics/gitops-argocd.md) · [DR](../topics/disaster-recovery-backup.md) · [FinOps](../topics/finops-cloud-cost.md)