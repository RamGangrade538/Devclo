# DevClo 2027 - Full 50-Day DevOps Curriculum (0 to 5-Saal Experience Level)

## Table of Contents

1. [Ye Curriculum Kyun? (Problems Ye Solve Karta Hai)](#1-ye-curriculum-kyun)
2. [Course Outcomes - What You'll Be Able To Do](#2-course-outcomes)
3. [Full Day-by-Day Curriculum (Day 1 - Day 50)](#3-full-day-by-day-curriculum)
4. [Week 1: DevOps Foundations, Linux & Git](#4-week-1--day-1-7)
5. [Week 2: CI/CD, Build Tools & Scripting](#5-week-2--day-8-14)
6. [Week 3: Docker, Kubernetes & Containers](#6-week-3--day-15-21)
7. [Week 4: IaC, Cloud, Monitoring & Security](#7-week-4--day-22-28)
8. [Capstone: DeployTrack (Day 29-31)](#8-capstone-deploytrack-day-29-31)
9. [Advanced: GitOps to Grand Capstone (Day 32-50)](#9-advanced-gitops-to-grand-capstone-day-32-50)
10. [Requirements - Kya Kya Chahiye](#10-requirements)
11. [Tools: Kyun Use Karte Hain + Alternatives](#11-tools-why--alternatives)
12. [Daily Study Method - Har Day Kaise Padhe](#12-daily-study-method)
13. [Verification / Self-Assessment Rubric](#13-verification--self-assessment)
14. [Aage Kya: Certification & Career Path](#14-aage-kya)

---

## 1. Ye Curriculum Kyun? (Problems Ye Solve Karta Hai)

Ye curriculum un problems ko solve karta hai jo aaj kal software teams me aam hain:

| # | Problem | Ye Curriculum Kaise Solve Karta Hai |
|---|---------|-------------------------------------|
| 1 | **"Meri machine par chal raha tha"** - Environment mismatch | Docker/K8s (Day 15-21) - har jagah same environment |
| 2 | **Manual deployments** me time lagta hai + galtiya hoti hain | CI/CD (Day 8-14) - automated, repeatable pipelines |
| 3 | **Production crash pata nahi chalta** jab tak users complain na karein | Monitoring + Logging (Day 24-25) - proactive alerts |
| 4 | **Infra recreate karna impossible** - kisi ne console par click-klick karke banaya tha | IaC/Terraform (Day 22-23) - infra = versioned code |
| 5 | **Code na ki secrets leak** ho jate hain repo me | DevSecOps (Day 26) - secret/dependency/container scanning |
| 6 | **Deploy ke baad app down** aur rollback ka koi plan nahi | Deployment strategies + rollback (Day 8, 19, 30) |
| 7 | **Scaling impossible** - traffic badha to servers freeze | K8s autoscaling (Day 19) - HPA, replicas |
| 8 | **Team collaboration chaotically** bina version control | Git (Day 6) - branches, PRs, code review |
| 9 | **Downtime = revenue loss** - ko measure/guarantee nahi kar paate | SRE/SLO/SLI (Day 27) - reliability engineering |
| 10 | **Knowledge scattered** - koi organized roadmap nahi | Ye 50-day structured roadmap with daily labs |

**Yeh "course" nahi - ek real-world DevOps foundation hai** jisme har day ek practical lab hai, sirf theory nahi.

---

## 2. Course Outcomes

50+ din ke baad aap ye sab **hands-on** kar paoge (sirf padh ke nahi):

- [ ] Linux server ko configure, secure aur troubleshoot kar sakte ho
- [ ] Production-grade bash scripts likh sakte ho (`set -euo pipefail`, error handling, cron)
- [ ] Git workflow — branches, PRs, merge conflicts resolve
- [ ] GitHub Actions + Jenkins se full CI/CD pipeline bana sakte ho
- [ ] Har app ko Docker container mein daal sakte ho (optimized + secure images)
- [ ] Kubernetes cluster par deploy, scale, update, rollback kar sakte ho
- [ ] Azure Cloud (VM, Storage, VNet, Entra ID) + `az` CLI se manage kar sakte ho
- [ ] Terraform se Azure infra code likh kar apply/destroy kar sakte ho
- [ ] Prometheus/Grafana se monitoring dashboards bana sakte ho
- [ ] ELK stack se centralized logging set up kar sakte ho
- [ ] Saare security scans (SAST/DAST/dependency/secret) apne CI me laga sakte ho
- [ ] SLO/SLI define kar sakte ho aur incident management samajhte ho
- [ ] **DeployTrack** naam ka full project (portfolio-ready) bana loge

**Advanced (Day 32-50) ke baad — 5-saal experience level:**

- [ ] GitOps (ArgoCD/Flux) se production deployments self-heal karte hain
- [ ] Service Mesh (Istio) me mTLS, canary, weighted traffic control karte ho
- [ ] Ci me SAST/SCA/DAST + secret + IaC scanning gates laga sakte ho
- [ ] Key Vault / Vault / SOPS se secrets store + rotate + inject karte ho
- [ ] Custom Operators, CRDs, RBAC, autoscaling (HPA/KEDA) banate ho
- [ ] OPA/Kyverno se policy-as-code enforce karte ho
- [ ] Backstage jaisa Internal Developer Platform (IDP) samajhte + setup karte ho
- [ ] FinOps: cloud cost optimize + budget/alert + rightsizing karte ho
- [ ] Chaos engineering experiments se resilience verify karte ho
- [ ] Velero / Azure Site Recovery se Disaster Recovery (RTO/RPO) achieve karte ho
- [ ] Multi-cloud + Serverless/event-driven (KEDA, Durable Functions) architectures design karte ho
- [ ] MLOps + DataOps pipelines dekhbhal karte ho (MLflow, dbt)
- [ ] API gateway + microservices resilience patterns implement karte ho
- [ ] Performance engineering: load tests, caching, p99 optimization karte ho
- [ ] Supply-chain: SBOM, cosign keyless signing, SLSA, verify-images
- [ ] Zero Trust + Sentinel se cloud security operate karte ho
- [ ] **Grand Capstone** — sab kuch combine karke production platform + SLO + cost + DR + gameday

---

## 3. Full Day-by-Day Curriculum

> Every day ka complete material: `day-01-devops-culture-and-principles.md` se lekar `day-50-capstone-platform.md` tak naam files me hai + link table niche.

| Day | Week | Topic | Type | Lab / Deliverable |
|-----|------|-------|------|-------------------|
| 1 | W1 | What is DevOps? Culture, CALMS, CI/CD | Concept | 1-page proposal: team DevOps kyun adopt kare |
| 2 | W1 | Linux Filesystem & Commands | Lab | `~/devops-lab` structure + file ops |
| 3 | W1 | Users, Permissions & Processes | Lab | deploy user + permissions + services |
| 4 | W1 | Shell Scripting Basics | Lab | system-info.sh, backup.sh, health-check.sh |
| 5 | W1 | Networking Fundamentals | Lab | ports, DNS, curl, firewall lab |
| 6 | W1 | Git Fundamentals | Lab | full workflow + merge conflict + stash |
| 7 | W1 | Week 1 Review + **Challenge** | Capstone | server-setup.sh (nginx + user + firewall + cron) |
| 8 | W2 | CI/CD Concepts & Pipelines | Concept | design pipeline + .pipeline.yaml |
| 9 | W2 | GitHub Actions | Lab | ci.yml + deploy.yml live demo |
| 10 | W2 | Jenkins Pipeline | Lab | Jenkins in Docker + Jenkinsfile |
| 11 | W2 | Build Tools (Maven & Gradle) | Lab | Maven project + lifecycle |
| 12 | W2 | Artifact Management | Lab | Nexus install + push/pull + semver |
| 13 | W2 | Advanced Shell Scripting | Lab | log-analyzer, remote-deploy, monitoring scripts |
| 14 | W2 | Week 2 Review + **Challenge** | Capstone | full CI/CD pipeline (Actions + Docker + rollback) |
| 15 | W3 | Docker Fundamentals | Lab | Flask app dockerize |
| 16 | W3 | Docker Compose | Lab | full-stack app (app+db+redis+nginx) |
| 17 | W3 | Image Optimization & Security | Lab | multi-stage build 900MB→120MB + Trivy scan |
| 18 | W3 | Kubernetes Fundamentals | Lab | Minikube/kind + first Pod |
| 19 | W3 | Deployments & Services | Lab | scale, rollout, rollback, probes |
| 20 | W3 | ConfigMaps, Secrets & Volumes | Lab | config + secrets + PVC + StatefulSet |
| 21 | W3 | Week 3 Review + **Challenge** | Capstone | microservices stack on K8s |
| 22 | W4 | Terraform (IaC) | Lab | Resource Group + VNet + Storage via Terraform |
| 23 | W4 | Azure Core Services | Lab | VM, Blob Storage, Entra ID, VNet, SQL, Monitor (az CLI) |
| 24 | W4 | Prometheus & Grafana | Lab | monitoring stack + dashboards + alerts |
| 25 | W4 | ELK Logging | Lab | ES + Logstash + Kibana + Filebeat |
| 26 | W4 | DevSecOps | Lab | Bandit, Trivy, gitleaks, ZAP, security.yml |
| 27 | W4 | SRE Concepts | Lab | SLIs, SLOs, error budget, runbook, chaos |
| 28 | W4 | Week 4 Review + **Challenge** | Capstone | full infra stack (TF + monitoring + logging) |
| 29 | - | Capstone Planning | Project | DeployTrack: architecture + skeleton |
| 30 | - | Capstone Implementation | Project | full CI/CD + K8s + Terraform verified |
| 31 | Bonus | **Azure Deep Dive (Final Lecture)** | Lecture | multi-cloud clarity + Azure catalog + cost demo + roadmap |

**Weekly challenge pattern:** Har week ka aakhri din (7, 14, 21, 28) = review + combined challenge jo us week ke saare skills ek sath use karta hai.

> **Bonus (course Azure-DevOps se limited nahi):** Ye curriculum **concepts me cloud-agnostic** hai — hands-on *Azure* pe hota hai, par CI/CD, containers, IaC, monitoring, security **AWS/GCP pe same** hain. Saath me **10 Deep-Dive pages** (`topics/*.md`, chhote topics ke alag in-depth pages) aur **Interview Corner** (har day ke Q&A + tricky questions) included hain — web app me sidebar buttons se kholo.

---

### Har Day Me Kya Hai - Poori Guide (Day 1-30)

Har din ki `day-NN-topic.md` file ke andar 4 cheezein hoti hain: **Topic** (kya seekhoge), **Concept** (detail me samjhaya gaya), **Practice Lab** (jo khud karna hai), **Quick Notes** (yaad rakhne wali baatein). Ye raha har din ka ek-jhatke ka overview:

| Day | Day Ka Naam | Andar Kya Hai (Topic) | Lab me Kya Karoge |
|-----|-------------|----------------------|-------------------|
| 1 | DevOps Culture | DevOps kya hai, CALMS, CI/CD, infinity loop | 1-page proposal (DevOps kyun) |
| 2 | Linux Filesystem | FHS structure, navigation, file commands | `devops-lab` directory + find/copy |
| 3 | Linux Users/Permissions | root/regular user, rwx, chmod 755/644/600 | deployer user + file permissions |
| 4 | Shell Scripting | variables, if/else, loops, functions | system-info, backup, health-check scripts |
| 5 | Networking | IP/CIDR, ports, DNS, HTTP, curl, ufw | connectivity lab + firewall + port script |
| 6 | Git | 3 areas, branching, merge, stash | branches + conflict + tag |
| 7 | **Week 1 Capstone** | Review + sab kuch | `server-setup.sh` (full server setup) |
| 8 | CI/CD Concepts | CI vs CD, pipeline stages, deploy strategies | pipeline design + .pipeline.yaml |
| 9 | GitHub Actions | workflows, jobs, steps, secrets, matrix | ci.yml + deploy.yml (real repo par) |
| 10 | Jenkins | Master/agent, Declarative Pipeline | Jenkins in Docker + Jenkinsfile |
| 11 | Build Tools | Maven lifecycle, pom.xml, dependencies | Maven project + `mvn package` |
| 12 | Artifact Management | Nexus, semver, container registries | Nexus + push/pull + verify |
| 13 | Advanced Scripting | `set -euo`, sed/awk/jq, SSH, cron | log-analyzer + remote-deploy scripts |
| 14 | **Week 2 Capstone** | Review + sab kuch | full CI/CD pipeline (deploy+rollback) |
| 15 | Docker Fundamentals | image vs container, Dockerfile, commands | Flask app dockerize karo |
| 16 | Docker Compose | multi-container, volumes, networks | app+db+redis+nginx full stack |
| 17 | Image Optimization | multi-stage, alpine/slim, Trivy | image 900MB → 120MB + scan |
| 18 | K8s Fundamentals | architecture, pods, namespaces, kubectl | Minikube + first pod + port-forward |
| 19 | Deployments & Services | replicas, rolling update, service types, probes | scale + rollout + rollback |
| 20 | Config/Secrets/Volumes | ConfigMap, Secret, PVC, StatefulSet | config + secret + persistent DB |
| 21 | **Week 3 Capstone** | Review + sab kuch | 3 microservices on K8s + ingress |
| 22 | Terraform (Azure) | HCL, azurerm provider, state, modules | RG + VNet + Storage via terraform |
| 23 | Azure Core Services | VM, Blob, Entra ID/RBAC, VNet, SQL, Monitor | `az login` + VM + Storage + alert |
| 24 | Prometheus & Grafana | metrics, PromQL, alerting, dashboards | monitoring stack + CPU alert |
| 25 | ELK Logging | ELK components, Logstash pipeline, Kibana | Filebeat→Logstash→ES→Kibana |
| 26 | DevSecOps | SAST, DAST, Trivy, secrets scan, OWASP | security scans + security.yml |
| 27 | SRE | SLI/SLO/SLA, error budget, runbooks, chaos | SLOs + runbook + chaos test |
| 28 | **Week 4 Capstone** | Review + sab kuch | full Azure infra stack |
| 29 | Capstone Planning | DeployTrack architecture + skeleton | Flask API + tests + Dockerfile |
| 30 | Capstone Build | full DeployTrack implementation | CI/CD + K8s + Terraform + verify |
| 31 | **Bonus Lecture** | Azure Deep Dive — multi-cloud, catalog, cost, roadmap | final Azure demo + portfolio ready |

### Advanced Days | Day 32-50 (5-Saal Experience Level)

| Day | Day Ka Naam | Andar Kya Hai (Topic) | Lab me Kya Karoge |
|-----|-------------|----------------------|-------------------|
| 32 | **GitOps** | ArgoCD & Flux, pull model, self-heal, App-of-Apps | ArgoCD install + app sync + rollback |
| 33 | **Service Mesh** | Istio/Linkerd, sidecar, mTLS, canary, Kiali | Gateway + VirtualService + weighted canary |
| 34 | **Security Scanning** | SAST/SCA/DAST, gitleaks, Semgrep, ZAP | CI gates: secrets + code + deps + image + IaC |
| 35 | **Secrets Management** | Key Vault, Vault, SOPS, ESO, rotation | KV + Vault KV/dynamic + ESO sync |
| 36 | **K8s Advanced** | Operators, CRDs, RBAC, HPA/KEDA, hardening | CRD + RBAC + autoscale + NetworkPolicy |
| 37 | **Policy as Code** | OPA/Rego, Gatekeeper, Kyverno | deny 'latest', auto-limits, verify-images |
| 38 | **Platform Engineering** | IDP, Backstage, Golden Path, scaffolder | Backstage + catalog-info + template |
| 39 | **FinOps & Cost** | Inform→Optimize→Operate, Kubecost, budgets | budgets + tagging + rightsizing demo |
| 40 | **Chaos Engineering** | Litmus, Chaos Mesh, game days | pod-delete + net-delay + CPU-hog + verdict |
| 41 | **Disaster Recovery** | RTO/RPO, Velero, ASR, multi-region | Velero backup/restore + ASR test-failover |
| 42 | **Multi-Cloud** | portability, Terraform multi-provider, abstractions | same module → azure/aws plan; S3-interface |
| 43 | **Serverless & Events** | Functions, Durable, Event Grid, KEDA | queue-trigger + durable fan-out + scale-to-zero |
| 44 | **MLOps** | MLflow, model registry, serving, drift | MLflow tracking + registry + KS-drift test |
| 45 | **DataOps** | ETL/ELT, Data Factory, dbt, data contracts | dbt models + tests + freshness + CI gate |
| 46 | **API & Microservices** | APIM, resilience patterns, versioning, outbox | gateway policies + retry/breaker + idempotency |
| 47 | **Performance** | p99, caching, CDN, k6 load tests, profiling | k6 threshold + Redis cache + flame graph |
| 48 | **Supply Chain Security** | SBOM, cosign, SLSA, verify-images | syft SBOM + keyless sign/verify + Kyverno |
| 49 | **Cloud Security** | Zero Trust, Entra, Sentinel, compliance | MFA/CA policy + PIM + Sentinel rule |
| 50 | **Grand Capstone** | 50-din ka combined production platform | full platform + SLO + cost + DR + gameday |

> **Confusion ho to:** koi bhi day kholo → upar **"Overview | Parichay"** ek line me batata hai ki day kya hai, **"Practice Exercise | Abhi Karein"** batata hai ki lab me kya karna hai. Bas wahi 2 sections padhne se pata lag jayega.

---

## 4. Week 1 | Day 1-7

### Topics
DevOps culture, Linux (files, users, processes), shell scripting, networking, Git.

### Labs (har day ek)
| Day | Lab Detail |
|-----|------------|
| 1 | Infinity loop draw karo + 1-page proposal |
| 2 | Directory tree build + find/copy/append commands |
| 3 | Create `deployer` user, set 755/644/600, kill processes |
| 4 | 4 scripts: system-info, backup, health-check, user-setup |
| 5 | Ping/dig/curl lab + firewall + SSL check + port checker script |
| 6 | 3 feature branches merge + resolve conflict + tag \(+ stash |
| 7 | **Capstone:** `server-setup.sh` = nginx + deploy user + SSH + firewall + cron backup |

### Reading / Learning Material (Week 1)
- [Linux Journey](https://linuxjourney.com/) - free interactive Linux
- [Learn Shell](https://www.learnshell.org/) - interactive bash
- [Git Book (Pro Git, free)](https://git-scm.com/book/en/v2)
- [Atlassian DevOps](https://www.atlassian.com/devops) + Atlassian Git tutorials
- [ExplainShell](https://explainshell.com/) - har command samajhne ke liye
- YouTube: "DevOps in 1 hour", "Linux commands for beginners", "Git for beginners"

### Practical Examples (Week 1)
```bash
# Day 2 example - realistic usage
tail -f /var/log/nginx/access.log   # live traffic monitor (production skill!)

# Day 3 example - deploy permissions (real scenario)
sudo chmod 600 ~/deploy-key.pem
sudo chown deploy:www-data /var/www/myapp -R

# Day 5 example - troubleshooting connectivity (interview favorite)
ss -tlnp               # kaunse ports khol rahe hain
curl -I https://example.com   # headers + status

# Day 6 example - day-to-day developer loop
git checkout -b feature/x && git add . && git commit -m "x" && git push
```

---

## 5. Week 2 | Day 8-14

### Topics
CI/CD theory, GitHub Actions, Jenkins, build tools (Maven), artifact repositories, advanced scripting.

### Labs (har day ek)
| Day | Lab Detail |
|-----|------------|
| 8 | Pipeline design (draw stages + tools + gates + rollback) |
| 9 | GitHub Actions: ci.yml (lint+test+artifact) + deploy.yml (docker+ssh+approval) |
| 10 | Jenkins in Docker + Multibranch pipeline + input approval |
| 11 | Maven project: pom.xml + `mvn clean package` + shaded JAR |
| 12 | Nexus up, repositories, `mvn deploy`, docker push, checksum verify |
| 13 | log-analyzer (grep/sed/awk), remote-deploy (SSH), config-generator, monitor+alert |
| 14 | **Capstone:** full pipeline = lint + test + security + docker build + deploy + rollback |

### Reading / Learning Material (Week 2)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Jenkins Handbook](https://www.jenkins.io/doc/book/)
- [Maven in 5 minutes](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html)
- [ELI5: CI/CD Explained](https://www.redhat.com/en/topics/devops/what-is-ci-cd)
- YouTube: "GitHub Actions Full Course", "Jenkins Pipeline Tutorial", "What is Maven"

### Practical Examples (Week 2)
```yaml
# Day 9 - actions/checkout ke bina kuch nahi hota (common mistake)
- uses: actions/checkout@v4

# Day 13 - interview favorite one-liner: top 5 IPs from nginx log
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -5
```

---

## 6. Week 3 | Day 15-21

### Topics
Docker (fundamentals, compose, optimization), Kubernetes (pods, deployments, services, config/secrets/volumes).

### Labs (har day ek)
| Day | Lab Detail |
|-----|------------|
| 15 | Flask app dockerize: build, run, logs, exec, cleanup |
| 16 | `docker-compose.yml`: app + postgres + redis + nginx, network test |
| 17 | Multi-stage build (size compare) + `.dockerignore` + Trivy scan + non-root user |
| 18 | Minikube/kind up + first pod + port-forward + namespace |
| 19 | deployment.yaml + scale 3→5 + set image + rollout undo + service + probes |
| 20 | ConfigMap + Secret + PVC + MySQL StatefulSet (data survives pod delete) |
| 21 | **Capstone:** 3 microservices on K8s with ingress + probes + limits |

### Reading / Learning Material (Week 3)
- [Docker Docs](https://docs.docker.com/) (Get Started section)
- [Play with Docker](https://labs.play-with-docker.com/) - browser me practice
- [Kubernetes Basics (interactive)](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Kubernetes Official Docs](https://kubernetes.io/docs/home/)
- YouTube: "Docker Full Course", "Kubernetes Explained", "CKA Prep"

### Practical Examples (Week 3)
```dockerfile
# Day 17 - golden rule: deps pehle, code baad (caching)
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```
```bash
# Day 19 - production debugging loop (interview skill)
kubectl get events               # sabse pehle ye dekho
kubectl describe pod <pod>       # reason kya hai
kubectl logs <pod> --tail=50
```

---

## 7. Week 4 | Day 22-28

### Topics
Terraform (IaC), Azure services, Prometheus/Grafana monitoring, ELK logging, DevSecOps, SRE.

### Labs (har day ek)
| Day | Lab Detail |
|-----|------------|
| 22 | `terraform init → plan → apply → destroy` (Resource Group + VNet + Storage) + variables + remote state |
| 23 | Azure CLI lab: `az login` → VM (bootstrap nginx), Blob Storage, Entra ID/RBAC role, Monitor alert |
| 24 | Prometheus + Grafana + node-exporter: dashboard + CPU alert (>90% for 5min) |
| 25 | ELK stack: Filebeat ship → Logstash parse → ES store → Kibana query ERROR logs |
| 26 | Bandit (SAST), Trivy (container), pip-audit (deps), gitleaks (secrets), ZAP (DAST) + `security.yml` |
| 27 | Define SLIs/SLOs, calculate error budget (99.9% ≈ 43 min/mo), write runbook, chaos test |
| 28 | **Capstone:** Terraform (VNet + 2 VMs + Azure SQL + Storage) + Prometheus + ELK + CI security + deploy/rollback |

### Reading / Learning Material (Week 4)
- [Terraform Learn](https://developer.hashicorp.com/terraform/tutorials)
- [Azure Free Account + Learn](https://azure.microsoft.com/free/)
- [Microsoft Learn - AZ-900 path](https://learn.microsoft.com/training/paths/az-900-describe-cloud-concepts/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Elastic Stack Docs](https://www.elastic.co/guide/index.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google SRE Book (free PDF)](https://sre.google/sre-book/table-of-contents/)
- YouTube: "Terraform Azure Tutorial", "Azure DevOps Zero to Hero", "SRE explained"

### Practical Examples (Week 4)
```bash
# Day 22 - NEVER forget: state file = secret. Remote backend (azurerm).
terraform { backend "azurerm" { storage_account_name = "..." } }

# Day 23 - az CLI ka golden flow
az login && az group create -n rg-devops -l eastus

# Day 24 - interview PromQL one-liner
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)   # CPU %
```

---

## 8. Capstone: DeployTrack (Day 29-30)

**Project:** Web app jo deployments track karta hai + full DevOps infra.

```
deploytrack/
├── .github/workflows/     # ci.yml, build.yml, deploy-staging.yml, deploy-prod.yml
├── backend/  (Flask API)  ├── frontend/ (React)  ├── worker/  (Celery)
├── nginx/    (reverse proxy)
├── terraform/ (VNet, AKS, Azure SQL/Postgres, Storage - modules + environments)
├── k8s/       (deployments, services, ingress, configmap, secrets)
├── monitoring/ (prometheus + dashboards)
├── scripts/   (deploy, rollback, health-check, seed-data)
└── docker-compose.yml + .prod.yml + Makefile
```

**Day 29 (Planning):** architecture draw, directory structure, Flask API + tests, Dockerfile, compose up locally.
**Day 30 (Build):** CI pipelines, K8s manifests, Terraform, deploy/rollback scripts, monitoring, verification checklist.
**Day 31 (Azure Lecture):** Azure catalog deep dive, Multi-cloud, cost, roadmap, portfolio + resume ready.

**Why DeployTrack?** Ye 60-70% DevOps job expectations cover karta hai — CI/CD, containers, orchestration, IaC, observability — sab ek portfolio project me. Aage ise GitHub par public karke resume me daalo.

---

## 9. Advanced: GitOps to Grand Capstone (Day 32-50)

**Kyun advanced?** Day 0-31 me tum cheezon ko *use* karna seekhate ho. Day 32-50 me tum platform **design + operate** karte ho company-production jaisa — wahi jo 5-saal-experience DevOps engineer din-ba-din karta hai. Har day: real-world use-case, real commands, troubleshooting + interview Q&A (in-app Interview Corner me bhi).

| Week | Days | Theme | Seekhoge |
|------|------|-------|----------|
| Week 5 | 32-38 | **Advanced Ops** | GitOps, Service Mesh, Security Scanning, Secrets, K8s Advanced, Policy-as-Code, Platform Engineering |
| Week 6 | 39-45 | **Scale & Data** | FinOps, Chaos, DR, Multi-Cloud, Serverless/Events, MLOps, DataOps |
| Week 7 | 46-50 | **Architect & Secure** | API/Microservices, Performance, Supply-chain, Cloud Security, Grand Capstone |

**Grand Capstone (Day 50):** 50 din ke saare learnings ko ek production-grade platform me combine karo — GitOps deploy + service mesh + policy + secrets + CAAS monitoring + SLOs + cost budgets + DR (RPO) + gameday/chaos → ek "senior-level" portfolio story.

**Practice tip:** Advanced days ke saare commands local (Docker/Kind/K3d) ya cloud (Azure) pe chalao — bas padhna nahi. Har topic page + lab `Practice Lab` me shell ke andar chala sakte ho.

**Deep Dive Library (ab 40 topics — kuch bhi miss nahi):**
- **Linux/OS (6):** Permissions · systemd & Services · Storage & Sysadmin · Advanced Scripting (Day 13) · Python Automation · Shell (Day 4/13)
- **Networking (6):** DNS · HTTP & REST · Load Balancing & Reverse Proxy · TLS/Certificates/PKI · Nginx · Azure VNet/NSG
- **Containers & K8s (5):** Containers vs VMs · K8s Architecture · Helm · ConfigMaps/Secrets · Policy as Code
- **CI/CD & Quality (5):** CI/CD Explained · Git Advanced Workflow · Deployment Strategies · Testing Automation · GitOps
- **Cloud & IaC (5):** What is IaC · Ansible · FinOps · Multi-Cloud · Cloud Network Security
- **Observability (3):** Observability/SRE · ELK · Distributed Tracing (OpenTelemetry)
- **Security (4):** DevSecOps · Secrets Management · Supply Chain · Cloud Security
- **Architecture & Data (6):** Microservices · API Gateways · Serverless/Events · MLOps · DataOps · Performance Eng

> **Rule:** Din ke saath "deep dive" bhi padho (day page ke niche **Related** links). Bas days padhana = 50%; days + deep dives + labs + interviews = 100%, wahi 5-saal feel.

## 10. Requirements

### Hardware
- Laptop/PC: 8GB+ RAM (16GB recommended), 4+ cores, 30GB free disk
- Ye sab local/VPS quantum me chalta hai (no paid server chahiye)

### Software (sab FREE)
| Category | Tool | Kyun |
|----------|------|------|
| OS | Linux Mint/Ubuntu, ya **WSL2** (Windows) / VM | servers Linux par hain |
| Editor | VS Code + Remote-SSH/Containers extension | connect directly to servers/containers |
| Terminal | Windows Terminal / iTerm2 / default | daily use |
| Version control | Git + [GitHub](https://github.com/) account | pages, PRs, Actions |
| Container | [Docker Desktop](https://www.docker.com/products/docker-desktop/) / Docker Engine | to build/run all 30 days labs |
| Local K8s | Minikube / kind | learn K8s for free locally |
| Cloud | [Azure Free Account](https://azure.microsoft.com/free/) | $200 free credit (pahle 30 din) + 12 months popular services free |
| Azure CLI | `az` - [install karo](https://learn.microsoft.com/cli/azure/install-azure-cli) | saare Azure labs ki main tool |
| VMs (optional) | [Multipass](https://multipass.run/) / VirtualBox | practice multiple Linux servers |

### Accounts (sab FREE)
- GitHub (required) - code + Actions
- Azure Free Account (required - Day 22+) - cloud labs
- Docker Hub (optional) - public image push

### Mindset
- Har day 1-2 hours, **zinda example se sikhna**
- Bina practical ke koi day skip nahi - "do it yourself" lab yaad rahega, reading nahi
- Error = learning; har error ko log karo

---

## 11. Tools: Why & Alternatives

> Rule: Har tool ko ek **problems se solve** karne ke liye chuna hai. Isse official docs samajhne me bhi clarity milegi. Alternatives jaannvo an interview me bhi fayda.

| Tool | Yeh Curriculum Me Kyun (Problem → Solution) | Alternatives (jab kabhi switch karna) |
|------|---------------------------------------------|----------------------------------------|
| **Bash/Shell** | Har server, CI, deployment automation bash me hota hai. Server "reset hua? script chalao" | PowerShell (Windows), Python scripts, Ansible |
| **Git + GitHub** | Version control industry standard. PRs = collaboration gate | GitLab, Bitbucket, Azure DevOps |
| **GitHub Actions** | Cloud CI/CD, GitHub se integrated, free for public repos | GitLab CI, Jenkins, CircleCI, Travis |
| **Jenkins** | Self-hosted CI, enterprise me abhi bhi widespread | GitHub Actions, GitLab CI, TeamCity |
| **Maven** | Java build tool standard - lifecycle + dependency management | Gradle, sbt (Scala), npm/pip (dusri languages) |
| **Nexus** | Self-hosted artifact repo, free, multi-format | JFrog Artifactory, ACR, GHCR, Docker Hub |
| **Docker** | Image = code ka package + environment - "works on my machine" khatam | Podman (daemonless), containerd, LXC |
| **Docker Compose** | Multi-container app local dev me one-command | podman-compose, k3s (single-node) |
| **Kubernetes** | Auto scaling, self-healing, zero-downtime deploys - production container standard | Docker Swarm (simple), Nomad, ECS |
| **Minikube/kind** | Local Kubernetes free me practice | k3s, k3d, MicroK8s |
| **Terraform** | IaC multi-cloud (Azure/AWS/GCP ek hi language), no vendor lock-in | Bicep (Azure-native), CloudFormation (AWS), Pulumi, Ansible |
| **Azure** | Hamara main cloud - jobs/market me dominant, AZ-900/AZ-400 path | GCP, AWS (concepts 90% same) |
| **Prometheus** | Pull-based metrics + PromQL ecosystem standard | Azure Monitor, Datadog, Zabbix, VictoriaMetrics |
| **Grafana** | Universal dashboard (Prometheus/Azure Monitor/Loki sab) | Kibana (logs-only), Datadog dashboards |
| **ELK** | Free, full logging pipeline (ship→process→store→view) | Loki+Grafana, Splunk (paid), Graylog |
| **Bandit/Trivy/gitleaks** | FREE security scans CI me | Snyk, SonarQube, Checkmarx (paid) |
| **Jira (mention)** | Planning tool concept (CALMS) | Trello, Linear, GitHub Issues |

### Ek hi kaam ke liye ek hi category - kyun ek hi chuna?
- **Cloud:** Sirf **Azure** par focus - ek cloud deep seekho (concepts dusre cloud par 90% same hain). Azure me hamare paas AZ-900 → AZ-104 → AZ-400 ka clear certification path hai.
- **IaC:** Terraform isliye ki multi-cloud + sabse bada ecosystem. Bicep sirf Azure ke liye hai (baad me seekh sakte ho).
- **CI/CD:** Dono sikhte hain - GitHub Actions (cloud, easy) + Jenkins (self-hosted, enterprise). Ye combo interviews me strong hai.
- **Monitoring:** Prometheus pull-model scaling ke liye behtar hai (push wale nahi). Grafana sab data sources ko ek jagah dikhata hai.

---

## 12. Daily Study Method

Har din **(1-2 hours)** same pattern follow karo:

```
[1] CONCEPT  (15-20 min)   → day-NN-topic.md padho + "Basic Concepts Detail Mein"
[2] WATCH    (15 min)      → us topic ka 1 beginner video (YouTube)
[3] READ     (15 min)      → official docs ka relevant page (table upar se)
[4] LAB      (45-60 min)   → "Practice Exercise | Abhi Karein" complete karo
                            (ye sabse important hai - yahi asli learning hai)
[5] NOTES    (5 min)       → "Quick Notes" section se apne words me likho
[6] COMMIT   (5 min)       → apna kaam GitHub repo me push karo (portfolio builds)
```

**Important:**
- Pehle khud try karo, phir solution dekho
- Error aaye to: 1) kya expect tha 2) kya hua 3) kaise fix kiya - ise likho
- Daily challenge (day 7/14/21/28) ko halke me mat lo - wo final exam jaisa hai

---

## 13. Verification / Self-Assessment

Har week ke end par khud se ye poocho:

### Week 1 (Days 1-7) - "Linux + Git mastery"
- [ ] 20 core Linux commands bina soch likh sakta hoon
- [ ] Chmod 755/644/600 ka matlab turant bata sakta hoon
- [ ] Kal se deploy hota script likh sakta hoon (with error handling)
- [ ] Ping/traceroute/curl/ss se kisi bhi issue ka troubleshooting kar sakta hoon
- [ ] Merge conflict khud resolve kar sakta hoon

### Week 2 (Days 8-14) - "CI/CD mastery"
- [ ] Naya repo milne par 30 min me CI/CD pipeline laga sakta hoon
- [ ] Secrets bina expose kiye pipeline me use karna aata hai
- [ ] Jenkins pipeline input/approval + post conditions samajh aati hain
- [ ] Maven lifecycle 7 phases bakta hoon
- [ ] Artifact push/pull + semver samajhta hoon

### Week 3 (Days 15-21) - "Containers mastery"
- [ ] Kisi bhi app ko optimized Dockerfile se containerize kar sakta hoon
- [ ] docker-compose se multi-container app chalata/band karta hoon
- [ ] K8s par deployment scale/update/rollback kar sakta hoon
- [ ] Config/Secrets/Volumes ka use samajhta hoon

### Week 4 (Days 22-28) - "Cloud + Observability + Security"
- [ ] Terraform se infra banata/destroy karta hoon (Azure)
- [ ] Azure core services (VM/Blob/VNet/Entra ID) samajhta hoon + `az` CLI use karta hoon
- [ ] Prometheus/Grafana dashboard + alert bana sakta hoon
- [ ] ELK files me logs search karta hoon
- [ ] CI me security scans chalane aata hai
- [ ] SLI/SLO/error budget explain kar sakta hoon

### Final Capstone (Days 29-30)
- [ ] Poora DeployTrack project deploy hua + verified
- [ ] Har stage ka output/proof README me documented

---

## 14. Aage Kya

### Certifications (course complete hone ke baad)
| Certification | Cover karta hai | Difficulty |
|---------------|----------------|------------|
| Microsoft Certified: DevOps Engineer Expert (AZ-400) | Azure CI/CD + IaC + DevOps | Advanced |
| Microsoft Certified: Azure Administrator (AZ-104) | Azure core services | Medium |
| Microsoft Certified: Azure Fundamentals (AZ-900) | Azure basics (easy entry) | Easy |
| Certified Kubernetes Administrator (CKA) | K8s deep detail | Hard |
| Docker Certified Associate | Docker concepts | Easy-Medium |
| HashiCorp Terraform Associate | IaC | Medium |

### Roadmap next 3-6 months
1. DeployTrack ko public GitHub portfolio banao + README proper
2. AZ-900 → AZ-104 → AZ-400 exam path (in order), sath me CKA prep
3. Open source projects me contribution (labels: "good first issue")
4. Apna naya project banao (e.g. URL shortener) aur usme CI/CD + monitoring add karo
5. Communities: DevOps/Cloud meetups, Discord servers, LinkedIn networking

---

*DevClo 2027 - Full curriculum ready hai. Har day ka detail: `day-NN-topic.md` files (jaise `day-01-devops-culture-and-principles.md`). Complete roadmap: ye document. Shuru karo Day 1 se, practical lab ko kabhi skip mat karo. All the best!*