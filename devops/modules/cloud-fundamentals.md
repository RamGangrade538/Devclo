# ☁️ Cloud Fundamentals — AWS / Azure / GCP Concepts

> **Hinglish:** Cloud = dusre ke data center me apne servers/DB/network **on-demand** le lo (jab chahiye, jitna chahiye, payment for what you use). Ye module cloud ke cross-provider concepts samjhata hai — regions, VPC, compute, storage, database, IAM, autoscaling — jo AWS/Azure/GCP sab pe apply hote hain.

## 📖 Overview — Ye Topic Kya Hai

Pehle company ke paas apne racks hote the (on-prem). Aaj se **cloud providers** (AWS, Azure, GCP) datacenters duniya bhar me rakhte hain aur tum unse servers, storage, databases, networking — sab kuch **API/console se on demand** le sakte ho, **seconds me** scale kar sakte ho, aur sirf use hui cheez ka pay karte ho.

Concepts mostly **same but naam alag** — AWS ka VPC = Azure VNet = GCP VPC; AWS EC2 = Azure VM = GCP Compute Engine; AWS S3 = Azure Blob = GCP GCS; AWS IAM = Azure RBAC/AD = GCP IAM. Ye module ka focus wo core concepts hai jo kabhi bhi change nahi hote.

## 🟢 Beginner — Shuruaat yahan se

- **Regions & Availability Zones** — data kahin kinna; AZ = independent failure bunale.
- **VPC/VNet basics** — apna private network, subnets me divide.
- **Compute** — VM banana (EC2/VM/GCE), SSH karna, instance types.
- **Object storage** — S3/Blob/GCS — files + backup + static website.
- **Console + CLI chalao** — pehla resource banao (billing careful).

## 🟡 Intermediate — Ab design karo

- **VPC deep dive** — subnets (public/private), routing tables, IGW, NAT Gateway.
- **Load balancers** — traffic distribute; TLS termination.
- **Database + DNS** — managed DBs, records, failover.
- **IAM** — users, roles, policies, least privilege.
- **Security groups + NACLs** — layered access control.
- **Autoscaling** — traffic ke hisaab se instances badhna/ghatna.
- **Monitoring & logging basics** — CloudWatch/Azure Monitor/GCP ops.

## 🔴 Advanced — Pro bano

- **Serverless** — Functions/Lambda — bina infra manage kiye.
- **Queues & Pub/Sub** — async decoupling (SQS/SNS, Service Bus, Pub/Sub).
- **Containers on cloud** — ECS/EKS, AKS, GKE — managed K8s.
- **Multi-region & DR** — replicated data, failover regions.
- **Cost optimization & tagging** — budget, rightsizing.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Regions** — cloud provider ke geographic data centers.
- [ ] **Availability Zones** — ek region ke andar isolated datacenters.
- [ ] **VPC/VNet** — tumhara private virtual network.
- [ ] **Subnets** — VPC ka chhota part; public/private.
- [ ] **Routing tables** — traffic kis subnet/se kaise jaye.
- [ ] **Internet Gateway (IGW)** — VPC se public internet ka darwaza.
- [ ] **NAT Gateway** — private resources "bahar bhejo, andar mat aane do".
- [ ] **Load balancers** — traffic ko multiple instances me de do.
- [ ] **Compute (VM)** — virtual machine: CPU/RAM/disk jispe app chalta hai.
- [ ] **Virtual machines** — on-demand servers; sizes upgrade karte ho.
- [ ] **Object storage** — flat file storage (S3/Blob); unlimited scale.
- [ ] **Block storage** — VM se jude disks (EBS/disks).
- [ ] **Databases** — managed SQL/NoSQL (RDS, Azure SQL, Cloud SQL).
- [ ] **DNS** — cloud pe domain records (Route53/Cloud DNS).
- [ ] **IAM** — identity + permissions; kiska kya karne ka access.
- [ ] **Security groups** — per-instance allow/deny rules.
- [ ] **Autoscaling** — load ke hisaab se instances auto badho/ghatao.
- [ ] **Monitoring** — metrics, alarms, dashboards.
- [ ] **Logging** — central logs; audit + debug.
- [ ] **Queues** — async jobs; producer/consumer decouple.
- [ ] **Pub/Sub** — event broadcast (SNS/PubSub).
- [ ] **Serverless / Functions** — code chalao bina server manage kiye.
- [ ] **Containers** — VM se halka; managed K8s (EKS/AKS/GKE).
- [ ] **Elasticity vs scalability** — scale (up/down) vs elastic (auto).
- [ ] **Tenancy / cloud models** — public, private, hybrid.
- [ ] **IaaS / PaaS / SaaS** — infra/platfom/software as service tiers.
- [ ] **Pay-as-you-go** — use karo, usi ka pay; savings plans.
- [ ] **Tagging** — resources pe labels; cost allocation ke liye.
- [ ] **Multi-region** — data same region me rakhna (compliance/latency).
- [ ] **Free tier / sandbox** — practice ke liye free resources.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| AWS / Azure / GCP consoles | Cloud dashboards | Resources dekhne + pehla setup |
| CLI (az/aws/gcloud) | Terminal se cloud | Automation + IaC (Terraform) ke saath |
| Terraform / OpenTofu | IaC | Cloud infra code se banane ke liye |
| CloudShell | Browser terminal + creds | Quick commands, bina local setup |
| Free-tier sandbox | Practice accounts | Risk-free learning ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First VM:** Free tier VM banao, SSH karo, ek hello web server lagao, fir delete karo (billing clean).
- [ ] **Lab 2 — VPC Design:** Public subnet (web) + private subnet (db) banao, routing tables aur security groups correct karo.
- [ ] **Lab 3 — Storage + Backup:** Object storage bucket banao, lifecycle policy lagao, versioning chalu karo.
- [ ] **Lab 4 — IAM Least Privilege:** Ek IAM user banao sirf specific read access ke saath; over-permission test karo.
- [ ] **Lab 5 — Auto-Scaling:** Load balancer + health check + autoscaling setup; load badha kar see scaling hoti hai.
- [ ] **Project — Three-Tier Setup (CLI/IaC):** Web + app + db architecture cloud pe banao, public/private isolation ke saath.

## 🔗 Related Topics

- [🏗️ Infrastructure as Code](../modules/iac.md)
- [💰 FinOps / Cloud Cost](../modules/finops-cost.md)
- [🌩️ Advanced Cloud](../modules/advanced-cloud.md)
- [🗄️ Databases](../modules/databases.md)
- [Azure Networking (VNet/NSG)](../topics/azure-vnet.md)
- [Azure Core Services](../day-23-azure-core-services.md)