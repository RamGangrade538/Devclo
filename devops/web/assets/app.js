"use strict";

const DAYS = [
  { num: 0,  week: -1, file: "day-00-setup-and-prerequisites.md",                  title: "Setup & Prerequisites", short: "Tools install, debug, verify", type: "setup" },
  { num: 1,  week: 1, file: "day-01-devops-culture-and-principles.md",             title: "DevOps Culture & Principles", short: "DevOps, CALMS, CI/CD", type: "concept" },
  { num: 2,  week: 1, file: "day-02-linux-filesystem-and-commands.md",             title: "Linux Filesystem & Commands", short: "ls, cd, find, mkdir, tail", type: "lab" },
  { num: 3,  week: 1, file: "day-03-linux-users-permissions-processes.md",         title: "Users, Permissions & Processes", short: "chmod, chown, ps, kill", type: "lab" },
  { num: 4,  week: 1, file: "day-04-shell-scripting-basics.md",                    title: "Shell Scripting Basics", short: "Variables, if/else, loops", type: "lab" },
  { num: 5,  week: 1, file: "day-05-networking-fundamentals.md",                   title: "Networking Fundamentals", short: "ip, ping, dig, curl, DNS", type: "lab" },
  { num: 6,  week: 1, file: "day-06-git-fundamentals.md",                          title: "Git Fundamentals", short: "add, commit, branch, merge", type: "lab" },
  { num: 7,  week: 1, file: "day-07-week-1-review-challenge.md",                   title: "Week 1 Review + Challenge", short: "server-setup.sh capstone", type: "capstone" },

  { num: 8,  week: 2, file: "day-08-cicd-concepts-and-pipelines.md",               title: "CI/CD Concepts & Pipelines", short: "Build→Test→Deploy", type: "concept" },
  { num: 9,  week: 2, file: "day-09-github-actions.md",                            title: "GitHub Actions", short: "ci.yml + deploy.yml", type: "lab" },
  { num: 10, week: 2, file: "day-10-jenkins-pipeline.md",                          title: "Jenkins Pipeline", short: "Docker + Jenkinsfile", type: "lab" },
  { num: 11, week: 2, file: "day-11-build-tools-maven-gradle.md",                  title: "Build Tools (Maven & Gradle)", short: "compile, test, package", type: "lab" },
  { num: 12, week: 2, file: "day-12-artifact-management-and-repositories.md",      title: "Artifact Management", short: "Nexus, GHCR, semver", type: "lab" },
  { num: 13, week: 2, file: "day-13-advanced-shell-scripting-automation.md",       title: "Advanced Shell Scripting", short: "awk, sed, jq, cron", type: "lab" },
  { num: 14, week: 2, file: "day-14-week-2-review-challenge.md",                   title: "Week 2 Review + Challenge", short: "Full CI/CD pipeline", type: "capstone" },

  { num: 15, week: 3, file: "day-15-docker-fundamentals.md",                       title: "Docker Fundamentals", short: "Dockerfile, build, run", type: "lab" },
  { num: 16, week: 3, file: "day-16-docker-compose-multicontainer.md",             title: "Docker Compose", short: "app + db + redis + nginx", type: "lab" },
  { num: 17, week: 3, file: "day-17-container-images-optimization.md",             title: "Image Optimization & Security", short: "multi-stage, Trivy", type: "lab" },
  { num: 18, week: 3, file: "day-18-kubernetes-fundamentals.md",                   title: "Kubernetes Fundamentals", short: "minikube, first Pod", type: "lab" },
  { num: 19, week: 3, file: "day-19-kubernetes-deployments-services.md",           title: "Deployments & Services", short: "scale, rollout, probes", type: "lab" },
  { num: 20, week: 3, file: "day-20-kubernetes-configmaps-secrets-volumes.md",     title: "ConfigMaps, Secrets & Volumes", short: "config + secrets + PVC", type: "lab" },
  { num: 21, week: 3, file: "day-21-week-3-review-challenge.md",                   title: "Week 3 Review + Challenge", short: "Microservices on K8s", type: "capstone" },

  { num: 22, week: 4, file: "day-22-terraform-azure-iac.md",                       title: "Terraform (Azure IaC)", short: "azurerm, plan, apply", type: "lab" },
  { num: 23, week: 4, file: "day-23-azure-core-services.md",                       title: "Azure Core Services", short: "VM, Blob, VNet, SQL, Monitor", type: "lab" },
  { num: 24, week: 4, file: "day-24-prometheus-grafana-monitoring.md",             title: "Prometheus & Grafana", short: "scrape, dashboards, alerts", type: "lab" },
  { num: 25, week: 4, file: "day-25-elk-logging-stack.md",                         title: "ELK Logging Stack", short: "ES + Logstash + Kibana", type: "lab" },
  { num: 26, week: 4, file: "day-26-devsecops-security.md",                        title: "DevSecOps", short: "Bandit, Trivy, gitleaks", type: "lab" },
  { num: 27, week: 4, file: "day-27-sre-concepts-reliability.md",                  title: "SRE Concepts", short: "SLI, SLO, error budget", type: "lab" },
  { num: 28, week: 4, file: "day-28-week-4-review-challenge.md",                   title: "Week 4 Review + Challenge", short: "Full Azure infra stack", type: "capstone" },

  { num: 29, week: 0, file: "capstone/day-29-capstone-planning.md",                title: "Capstone: Planning", short: "DeployTrack architecture", type: "project" },
  { num: 30, week: 0, file: "capstone/day-30-capstone-implementation.md",          title: "Capstone: Implementation", short: "Full CI/CD + K8s + Terraform", type: "project" },
  { num: 31, week: 0, file: "day-31-azure-final-lecture.md",                       title: "Azure Deep Dive (Final Lecture)", short: "Multi-cloud + quick full recap", type: "project" },

  { num: 32, week: 5, file: "day-32-gitops-argocd-flux.md",                        title: "GitOps: ArgoCD & Flux", short: "Declarative delivery, selfHeal", type: "lab" },
  { num: 33, week: 5, file: "day-33-service-mesh-istio-linkerd.md",                title: "Service Mesh (Istio/Linkerd)", short: "mTLS, canary, traffic mgmt", type: "lab" },
  { num: 34, week: 5, file: "day-34-security-scanning-tools.md",                   title: "Security Scanning Tools", short: "SAST, SCA, Trivy, ZAP", type: "lab" },
  { num: 35, week: 5, file: "day-35-secrets-management.md",                        title: "Secrets Management", short: "Key Vault, Vault, SOPS, ESO", type: "lab" },
  { num: 36, week: 5, file: "day-36-kubernetes-advanced-operators-rbac.md",        title: "K8s Advanced: Operators & RBAC", short: "CRD, HPA, KEDA, hardening", type: "lab" },
  { num: 37, week: 5, file: "day-37-policy-as-code-opa-kyverno.md",                title: "Policy as Code", short: "OPA/Rego, Kyverno admission", type: "lab" },
  { num: 38, week: 5, file: "day-38-platform-engineering-backstage.md",            title: "Platform Engineering & IDP", short: "Backstage, Golden Path", type: "concept" },

  { num: 39, week: 6, file: "day-39-finops-cloud-cost.md",                         title: "FinOps & Cloud Cost", short: "Kubecost, budgets, rightsizing", type: "concept" },
  { num: 40, week: 6, file: "day-40-chaos-engineering.md",                         title: "Chaos Engineering", short: "Litmus, game days, faults", type: "lab" },
  { num: 41, week: 6, file: "day-41-disaster-recovery-backup.md",                  title: "Disaster Recovery & Backup", short: "RTO/RPO, Velero, ASR", type: "lab" },
  { num: 42, week: 6, file: "day-42-multicloud-patterns.md",                       title: "Multi-Cloud Patterns", short: "Portability, Terraform multi", type: "concept" },
  { num: 43, week: 6, file: "day-43-serverless-event-driven.md",                   title: "Serverless & Event-Driven", short: "Functions, Durable, KEDA", type: "lab" },
  { num: 44, week: 6, file: "day-44-mlops.md",                                     title: "MLOps", short: "MLflow, drift, serving", type: "concept" },
  { num: 45, week: 6, file: "day-45-data-pipelines-dataops.md",                    title: "Data Pipelines & DataOps", short: "ELT, dbt, quality gates", type: "lab" },

  { num: 46, week: 7, file: "day-46-api-gateways-microservices.md",                title: "API Gateways & Microservices", short: "APIM, resilience patterns", type: "concept" },
  { num: 47, week: 7, file: "day-47-performance-engineering.md",                   title: "Performance Engineering", short: "caching, load tests, p99", type: "lab" },
  { num: 48, week: 7, file: "day-48-supply-chain-security.md",                     title: "Supply Chain Security", short: "SBOM, cosign, SLSA", type: "lab" },
  { num: 49, week: 7, file: "day-49-cloud-network-security.md",                    title: "Cloud & Network Security", short: "Zero Trust, IAM, Sentinel", type: "concept" },
  { num: 50, week: 7, file: "day-50-capstone-platform.md",                         title: "Grand Capstone: Full Platform", short: "50-days ka combined project", type: "capstone" },
];

const PROGRESS_KEY = "devclo-progress";
const WEEKS = [
  { key: -1, name: "Getting Started", icon: "🚀" },
  { key: 1,  name: "Week 1 — Foundations", icon: "🧱" },
  { key: 2,  name: "Week 2 — CI/CD", icon: "⚙️" },
  { key: 3,  name: "Week 3 — Docker & K8s", icon: "🐳" },
  { key: 4,  name: "Week 4 — Azure & SRE", icon: "☁️" },
  { key: 0,  name: "Capstone Project", icon: "🎯" },
  { key: 5,  name: "Week 5 — Advanced Ops", icon: "🛠️" },
  { key: 6,  name: "Week 6 — Scale & Data", icon: "📈" },
  { key: 7,  name: "Week 7 — Architect & Secure", icon: "🛡️" },
];

const TOPICS = [
  { slug: "devops-culture",        title: "DevOps Culture Deep Dive",     tag: "Day 1 · Culture",        file: "topics/devops-culture.md",        days: [1] },
  { slug: "cicd-explained",        title: "CI/CD vs CD Explained",        tag: "CI/CD",                   file: "topics/cicd-explained.md",        days: [8, 9, 10, 14] },
  { slug: "containers-vs-vms",     title: "Containers vs VMs",            tag: "Containers",              file: "topics/containers-vs-vms.md",     days: [15] },
  { slug: "kubernetes-architecture", title: "K8s Control Plane & Scheduling", tag: "Kubernetes", file: "topics/kubernetes-architecture.md", days: [18, 19] },
  { slug: "dns-explained",         title: "DNS Kaise Kaam Karta Hai",     tag: "Networking",              file: "topics/dns-explained.md",         days: [5] },
  { slug: "linux-permissions",     title: "Linux Permissions (rwx)",      tag: "Linux",                   file: "topics/linux-permissions.md",     days: [3] },
  { slug: "what-is-iac",           title: "IaC & Terraform Deep Dive",    tag: "Azure · IaC",             file: "topics/what-is-iac.md",           days: [22, 23] },
  { slug: "observability",         title: "Observability & SRE (SLI/SLO)",tag: "Monitoring · SRE",       file: "topics/observability.md",         days: [24, 25, 27] },
  { slug: "azure-vnet",            title: "Azure Networking (VNet/NSG)",  tag: "Azure",                   file: "topics/azure-vnet.md",            days: [23] },
  { slug: "devsecops",             title: "DevSecOps (Shift-Left)",       tag: "Security",                file: "topics/devsecops.md",             days: [17, 26] },
  { slug: "gitops-argocd",         title: "GitOps: ArgoCD & Flux",        tag: "GitOps",                  file: "topics/gitops-argocd.md",         days: [32] },
  { slug: "service-mesh-explained", title: "Service Mesh (Istio/Linkerd)", tag: "Mesh",                  file: "topics/service-mesh-explained.md", days: [33] },
  { slug: "secret-management",     title: "Secrets Management",           tag: "Security",                file: "topics/secret-management.md",     days: [35] },
  { slug: "policy-as-code",        title: "Policy as Code",               tag: "Security · K8s",          file: "topics/policy-as-code.md",        days: [37] },
  { slug: "platform-engineering-idp", title: "Platform Engineering & IDP",tag: "Platform",                file: "topics/platform-engineering-idp.md", days: [38] },
  { slug: "finops-cloud-cost",     title: "FinOps & Cloud Cost",          tag: "Cost",                    file: "topics/finops-cloud-cost.md",     days: [39] },
  { slug: "chaos-engineering",     title: "Chaos Engineering",            tag: "Resilience",              file: "topics/chaos-engineering.md",     days: [40] },
  { slug: "disaster-recovery-backup", title: "Disaster Recovery & Backup",tag: "Resilience",              file: "topics/disaster-recovery-backup.md", days: [41] },
  { slug: "multicloud-patterns",   title: "Multi-Cloud Patterns",         tag: "Cloud",                   file: "topics/multicloud-patterns.md",   days: [42] },
  { slug: "serverless-event-driven", title: "Serverless & Event-Driven",  tag: "Serverless",              file: "topics/serverless-event-driven.md", days: [43] },
  { slug: "mlops-basics",          title: "MLOps Basics",                 tag: "AI · ML",                 file: "topics/mlops-basics.md",          days: [44] },
  { slug: "dataops-pipelines",     title: "Data Pipelines & DataOps",     tag: "Data",                    file: "topics/dataops-pipelines.md",     days: [45] },
  { slug: "api-gateways",          title: "API Gateways",                 tag: "APIs",                    file: "topics/api-gateways.md",          days: [46] },
  { slug: "microservices-patterns", title: "Microservices Patterns",      tag: "Architecture",            file: "topics/microservices-patterns.md", days: [46] },
  { slug: "performance-engineering", title: "Performance Engineering",    tag: "Perf",                    file: "topics/performance-engineering.md", days: [47] },
  { slug: "supply-chain-security", title: "Supply Chain Security",         tag: "Security",                file: "topics/supply-chain-security.md", days: [48] },
  { slug: "cloud-network-security", title: "Cloud & Network Security",     tag: "Security · Azure",        file: "topics/cloud-network-security.md", days: [49] },
  { slug: "helm-charts",           title: "Helm — K8s Package Manager",   tag: "Kubernetes",              file: "topics/helm-charts.md",           days: [32, 36] },
  { slug: "linux-systemd-service-management", title: "systemd & Service Management", tag: "Linux", file: "topics/linux-systemd-service-management.md", days: [3, 7, 13] },
  { slug: "linux-storage-sysadmin", title: "Linux Storage & Sysadmin",     tag: "Linux",                   file: "topics/linux-storage-sysadmin.md", days: [2, 13, 47] },
  { slug: "git-advanced-workflow", title: "Git Advanced Workflow",         tag: "Git",                     file: "topics/git-advanced-workflow.md",  days: [6, 9] },
  { slug: "http-rest-api-fundamentals", title: "HTTP & REST API Basics",   tag: "Networking · APIs",       file: "topics/http-rest-api-fundamentals.md", days: [5, 46] },
  { slug: "load-balancing-reverse-proxy", title: "Load Balancing & Reverse Proxy", tag: "Networking",     file: "topics/load-balancing-reverse-proxy.md", days: [5, 16, 21, 46] },
  { slug: "tls-certificates-pki",  title: "TLS, Certificates & PKI",       tag: "Networking · Security",   file: "topics/tls-certificates-pki.md",   days: [5, 26, 49] },
  { slug: "nginx-web-server",      title: "Nginx — Web Server & Proxy",    tag: "Web · Infra",             file: "topics/nginx-web-server.md",       days: [5, 7, 13, 16, 21] },
  { slug: "config-management-ansible", title: "Ansible — Config Management", tag: "Automation · IaC",      file: "topics/config-management-ansible.md", days: [13, 22, 23] },
  { slug: "deployment-strategies", title: "Deployment Strategies",         tag: "CI/CD",                   file: "topics/deployment-strategies.md",  days: [8, 19, 32, 33] },
  { slug: "testing-and-test-automation", title: "Testing & Test Automation", tag: "Quality · CI/CD",      file: "topics/testing-and-test-automation.md", days: [8, 9, 45] },
  { slug: "distributed-tracing-opentelemetry", title: "Distributed Tracing / OpenTelemetry", tag: "Observability", file: "topics/distributed-tracing-opentelemetry.md", days: [24, 25, 47] },
  { slug: "python-automation-scripts", title: "Python for DevOps Automation", tag: "Scripting · Python", file: "topics/python-automation-scripts.md", days: [4, 13, 47] },
];

const TOPIC_GROUPS = [
  { name: "🧱 DevOps Basics",         slugs: ["devops-culture", "cicd-explained", "what-is-iac"] },
  { name: "🐧 Linux & Shell",         slugs: ["linux-permissions", "linux-storage-sysadmin", "linux-systemd-service-management", "python-automation-scripts"] },
  { name: "⚙️ Git & CI/CD",           slugs: ["git-advanced-workflow", "deployment-strategies", "testing-and-test-automation"] },
  { name: "🔗 Networking & Web",      slugs: ["dns-explained", "http-rest-api-fundamentals", "load-balancing-reverse-proxy", "tls-certificates-pki", "nginx-web-server"] },
  { name: "🐳 Containers & Docker",   slugs: ["containers-vs-vms", "kubernetes-architecture", "helm-charts"] },
  { name: "☁️ Cloud & IaC",           slugs: ["azure-vnet", "config-management-ansible"] },
  { name: "📡 Observability & SRE",   slugs: ["observability", "distributed-tracing-opentelemetry"] },
  { name: "🔐 Security & DevSecOps",  slugs: ["devsecops", "secret-management", "policy-as-code", "supply-chain-security", "cloud-network-security"] },
  { name: "🛠️ Platform & GitOps",     slugs: ["platform-engineering-idp", "gitops-argocd", "service-mesh-explained", "finops-cloud-cost"] },
  { name: "🚀 Advanced Topics",       slugs: ["chaos-engineering", "disaster-recovery-backup", "multicloud-patterns", "serverless-event-driven", "mlops-basics", "dataops-pipelines", "api-gateways", "microservices-patterns", "performance-engineering"] },
];

/* ---------- Detailed Track (Master Plan, Day 1-40) ----------
   Ye MASTER-PLAN-30.md ke 40 detailed day files hain (expanded/ folder).
   Virtual id = 1000 + n, taaki main 50-day progress se collide na ho. */
const EXP_PROGRESS_KEY = "devclo-exp-progress";
const EXP_DAYS = [
  { n: 1,  phase: 1, file: "expanded/day-01-linux-fundamentals.md",            title: "Linux Fundamentals & Operations",   short: "FHS, perms, users, processes, systemd", type: "lab" },
  { n: 2,  phase: 1, file: "expanded/day-02-networking-services.md",           title: "Networking, Ports & Services",      short: "ip, ports, DNS, curl, tcpdump, firewall", type: "lab" },
  { n: 3,  phase: 1, file: "expanded/day-03-git-github-workflow.md",           title: "Git + GitHub Full Workflow",        short: "branch, PR, rebase, tags, GitHub flow", type: "lab" },
  { n: 4,  phase: 1, file: "expanded/day-04-git-troubleshooting.md",           title: "Git Troubleshooting",               short: "secrets, revert, reset, reflog, rewrite", type: "lab" },
  { n: 5,  phase: 1, file: "expanded/day-05-shell-scripting.md",               title: "Shell Scripting & Automation",      short: "variables, loops, functions, cron, jq", type: "lab" },
  { n: 6,  phase: 1, file: "expanded/day-06-ssh-logs-debugging.md",            title: "SSH, Logs & Deep Debugging",        short: "keys, ssh config, journald, logrotate", type: "lab" },
  { n: 7,  phase: 1, file: "expanded/day-07-project-server-health-automation.md", title: "Project 1: Server Health Automation", short: "health-check.sh + systemd timer", type: "capstone" },

  { n: 8,  phase: 2, file: "expanded/day-08-docker-fundamentals.md",           title: "Docker Fundamentals",               short: "images, containers, volumes, networks", type: "lab" },
  { n: 9,  phase: 2, file: "expanded/day-09-dockerfile-builds-optimization.md", title: "Dockerfile, Builds & Optimization", short: "multi-stage, layers, cache, size", type: "lab" },
  { n: 10, phase: 2, file: "expanded/day-10-compose-networks-registries.md",   title: "Compose, Networks & Registries",    short: "multi-container, ACR/DockerHub, tags", type: "lab" },
  { n: 11, phase: 2, file: "expanded/day-11-azure-vm-vnet-nsg.md",             title: "Azure VM, VNet & NSG",              short: "vnet, subnet, NSG rules, public IP", type: "lab" },
  { n: 12, phase: 2, file: "expanded/day-12-azure-storage.md",                 title: "Azure Storage",                     short: "blobs, files, tiers, SAS, lifecycle", type: "lab" },
  { n: 13, phase: 2, file: "expanded/day-13-azure-cli-bicep-service-connections.md", title: "Azure CLI + Bicep + Service Connections", short: "az cli, bicep, service connections", type: "lab" },
  { n: 14, phase: 2, file: "expanded/day-14-iam-rbac-project-vm-stack.md",     title: "IAM/RBAC + Project 2: VM Stack",    short: "roles, managed identity, VM stack via CLI", type: "capstone" },

  { n: 15, phase: 3, file: "expanded/day-15-azure-devops-org-agents-triggers.md", title: "Azure DevOps: Org, Agents & Triggers", short: "orgs, agent pools, triggers, approvals", type: "lab" },
  { n: 16, phase: 3, file: "expanded/day-16-azure-pipelines-ci.md",            title: "Azure Pipelines: CI",               short: "build, test, artifact, YAML stages", type: "lab" },
  { n: 17, phase: 3, file: "expanded/day-17-ci-quality-env-vars-secrets.md",   title: "CI Quality: Env Vars & Secrets",    short: "variables, variable groups, Key Vault", type: "lab" },
  { n: 18, phase: 3, file: "expanded/day-18-docker-acr-in-pipelines.md",       title: "Docker + ACR in Azure Pipelines",   short: "build/push image, versioning", type: "lab" },
  { n: 19, phase: 3, file: "expanded/day-19-cd-environments-gates.md",         title: "CD + Environments + Gates",         short: "deploy, approvals, gates, blue-green", type: "lab" },
  { n: 20, phase: 3, file: "expanded/day-20-rollback-secrets-keyvault.md",     title: "Rollback, Secrets & Key Vault",     short: "rollback, secret rotation, Key Vault", type: "lab" },

  { n: 21, phase: 4, file: "expanded/day-21-kubernetes-fundamentals-kubectl.md", title: "Kubernetes Fundamentals + kubectl", short: "pods, deployments, kubectl, minikube", type: "lab" },
  { n: 22, phase: 4, file: "expanded/day-22-scheduling-probes-limits.md",      title: "Scheduling, Probes & Limits",       short: "requests/limits, probes, affinity, HPA", type: "lab" },
  { n: 23, phase: 4, file: "expanded/day-23-services-ingress-dns-networking.md", title: "Services, Ingress, DNS & Networking", short: "ClusterIP, NodePort, Ingress, DNS", type: "lab" },
  { n: 24, phase: 4, file: "expanded/day-24-azure-monitor-keyvault-aks.md",    title: "Azure Monitor + Key Vault on AKS",  short: "Container Insights, logs, secrets", type: "lab" },
  { n: 25, phase: 4, file: "expanded/day-25-terraform-azure.md",               title: "Terraform + Azure",                 short: "providers, resources, plan/apply, azurerm", type: "lab" },
  { n: 26, phase: 4, file: "expanded/day-26-terraform-state-drift-scaling.md", title: "Terraform State, Drift & Scaling",  short: "remote state, drift, modules, workspaces", type: "lab" },
  { n: 27, phase: 4, file: "expanded/day-27-aks-troubleshooting-day.md",       title: "Full AKS Troubleshooting Day",      short: "CrashLoop, ImagePull, DNS, evicted pods", type: "lab" },

  { n: 28, phase: 5, file: "expanded/day-28-project-setup-infra-app.md",       title: "Project Setup: Infra + App",        short: "repo, pipeline, infra, app scaffolding", type: "project" },
  { n: 29, phase: 5, file: "expanded/day-29-project-build-cicd-pipeline.md",   title: "Project Build: CI/CD Pipeline",     short: "full CI/CD to AKS", type: "project" },
  { n: 30, phase: 5, file: "expanded/day-30-project-verify-operate-document.md", title: "Project Verify + Operate + Document", short: "verify, monitor, runbook, docs", type: "project" },

  { n: 31, phase: 6, file: "expanded/day-31-platform-engineering-fundamentals.md", title: "Platform Engineering Fundamentals", short: "IDP, golden path, platform team", type: "concept" },
  { n: 32, phase: 6, file: "expanded/day-32-backstage-idp-build.md",           title: "Backstage (IDP) Build",             short: "catalog, templates, scaffolder", type: "lab" },
  { n: 33, phase: 6, file: "expanded/day-33-self-service-iac-golden-path.md",  title: "Self-Service IaC + Golden Path",    short: "self-service, terraform modules, guardrails", type: "lab" },
  { n: 34, phase: 6, file: "expanded/day-34-devex-dora-metrics.md",            title: "DevEx + DORA Metrics",              short: "DORA, DevEx, flow metrics", type: "concept" },
  { n: 35, phase: 6, file: "expanded/day-35-gitops-at-scale.md",               title: "GitOps at Scale",                   short: "ArgoCD, Flux, app-of-apps, multi-env", type: "lab" },
  { n: 36, phase: 6, file: "expanded/day-36-multicluster-fleet-management.md", title: "Multi-Cluster & Fleet Management",  short: "fleet, Cluster API, GitOps fleet", type: "lab" },
  { n: 37, phase: 6, file: "expanded/day-37-sre-for-platforms.md",             title: "SRE for Platforms",                 short: "SLOs, error budgets, toil, on-call", type: "concept" },
  { n: 38, phase: 6, file: "expanded/day-38-observability-opentelemetry.md",   title: "Advanced Observability & OTel",     short: "traces, metrics, logs, OTel collector", type: "lab" },
  { n: 39, phase: 6, file: "expanded/day-39-finops-cloud-cost.md",             title: "FinOps & Platform Cost",            short: "Kubecost, showback, rightsizing, budgets", type: "concept" },
  { n: 40, phase: 6, file: "expanded/day-40-platform-security-capstone.md",    title: "Platform Security & Grand Capstone", short: "policy, supply chain, capstone", type: "capstone" },
];
const EXP_PHASES = [
  { key: 1, name: "Phase 1 — Linux + Networking + Git + Shell", icon: "🧱", from: 1,  to: 7 },
  { key: 2, name: "Phase 2 — Docker + Azure Fundamentals",      icon: "☁️", from: 8,  to: 14 },
  { key: 3, name: "Phase 3 — Azure DevOps + Pipelines",         icon: "⚙️", from: 15, to: 20 },
  { key: 4, name: "Phase 4 — Kubernetes/AKS + Terraform",       icon: "🐳", from: 21, to: 27 },
  { key: 5, name: "Phase 5 — End-to-End Project",               icon: "🎯", from: 28, to: 30 },
  { key: 6, name: "Phase 6 — Platform Engineering",             icon: "🛠️", from: 31, to: 40 },
];
const PLATFORM_SLUGS = new Set([
  "gitops-argocd", "service-mesh-explained", "secret-management", "policy-as-code",
  "platform-engineering-idp", "finops-cloud-cost", "observability",
  "distributed-tracing-opentelemetry", "serverless-event-driven", "mlops-basics",
  "dataops-pipelines", "api-gateways", "microservices-patterns", "performance-engineering",
  "supply-chain-security", "cloud-network-security", "chaos-engineering",
  "disaster-recovery-backup", "multicloud-patterns", "deployment-strategies", "helm-charts",
]);
function conceptCount() { return DAYS.filter(d => d.type === "concept" && d.num > 0).length; }
function expPlatformCount() { return EXP_DAYS.filter(d => d.phase === 6).length; }
function advCount() { return DAYS.filter(d => d.num >= 32).length; }
function expCoreCount() { return EXP_DAYS.filter(d => d.phase >= 1 && d.phase <= 5).length; }
function weeksCount() { return WEEKS.filter(w => w.key !== -1).length; }
function practiceCount() { return weeksCount() + DAYS.length + expCoreCount(); }
function platformCount() { return PLATFORM_SLUGS.size + expPlatformCount() + advCount(); }
function practiceDoneCount() {
  return getProgress().filter(n => n >= 1 && n <= 50).length +
    EXP_DAYS.filter(d => d.phase <= 5 && isExpDone(d.n)).length;
}
function platformDoneCount() {
  return DAYS.filter(d => d.num >= 32 && isDone(d.num)).length +
    EXP_DAYS.filter(d => d.phase === 6 && isExpDone(d.n)).length;
}
function conDoneCount() { return DAYS.filter(d => d.type === "concept" && d.num > 0 && isDone(d.num)).length; }
function vid(n) { return 1000 + n; }
function expByFile(file) {
  const base = file.replace(/^.*\//, "").replace(/\.md$/, "");
  return EXP_DAYS.find(d => d.file.replace(/^.*\//, "").replace(/\.md$/, "") === base);
}
function getExpProgress() {
  try { return JSON.parse(localStorage.getItem(EXP_PROGRESS_KEY) || "[]"); }
  catch (e) { return []; }
}
function isExpDone(n) { return getExpProgress().includes(n); }
function toggleExpDone(n) {
  let list = getExpProgress();
  list = list.includes(n) ? list.filter(x => x !== n) : list.concat(n).sort((a, b) => a - b);
  localStorage.setItem(EXP_PROGRESS_KEY, JSON.stringify(list));
  renderSidebar();
}

const els = {
  content: document.getElementById("content"),
  navGroups: document.getElementById("navGroups"),
  footnav: document.getElementById("footnav"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  markDoneBtn: document.getElementById("markDoneBtn"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  resetBtn: document.getElementById("resetBtn"),
  sideSearch: document.getElementById("sideSearch"),
  helpBtn: document.getElementById("helpBtn"),
  paletteOverlay: document.getElementById("paletteOverlay"),
  paletteInput: document.getElementById("paletteInput"),
  paletteResults: document.getElementById("paletteResults"),
  chatInput: document.getElementById("chatInput"),
};

/* ---------- Progress ---------- */
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"); }
  catch (e) { return []; }
}
function saveProgress(list) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(list)); }
function isDone(n) { return getProgress().includes(n); }
function toggleDone(n) {
  let list = getProgress();
  list = list.includes(n) ? list.filter(x => x !== n) : list.concat(n).sort((a, b) => a - b);
  saveProgress(list);
  renderSidebar();
}
function getTaskState(n) {
  try { return JSON.parse(localStorage.getItem("devclo-day-" + n) || "[]"); }
  catch (e) { return []; }
}
function saveTaskState(n, arr) {
  localStorage.setItem("devclo-day-" + n, JSON.stringify(arr));
  if (n >= 1000) {
    const exp = n - 1000;
    if (arr.length > 0 && isAllChecked(n) && !isExpDone(exp)) toggleExpDone(exp);
    return;
  }
  if (arr.length > 0 && isAllChecked(n)) markDay(n, true);
  else if (arr.length === 0 && !hasAnyCheck(n) && isDone(n)) markDay(n, false);
}
function nextUndone() {
  const p = getProgress();
  const last = DAYS[DAYS.length - 1].num;
  const d = DAYS.find(x => x.num >= 1 && !p.includes(x.num));
  return d ? d.num : last;
}
function weekOfDay(n) { const d = DAYS.find(x => x.num === n); return d ? d.week : 0; }

/* ---------- Sidebar ---------- */
let current = -1; // -1 home, -2 help, -3 deep-dive topic, -4 interviews, -5 lab, >=0 day
let topicSlug = null;
let currentTopicSlug = null;
let currentSub = null;
let interviewDay = null;

let sbMemOpen = new Set();
function sbOpenSet() { return sbMemOpen; }
function sbToggle(key) {
  if (sbMemOpen.has(key)) sbMemOpen.delete(key); else sbMemOpen.add(key);
  renderSidebar();
}

function dayItemHTML(numLabel, title, type, active, done) {
  const item = document.createElement("div");
  item.className = "day-item" + (done ? " done" : "") + (active ? " active" : "");
  item.innerHTML = '<span class="day-num">' + numLabel + "</span>" +
    '<span class="day-label">' + title + "</span>" +
    '<span class="badge ' + type + '">' + type + "</span>" +
    '<span class="check">✓</span>';
  return item;
}

function topicSubs(slug) {
  const md = getContent("topics/" + slug + ".md");
  if (md === null) return [];
  const out = [];
  md.split(/\r?\n/).forEach(line => {
    const m = line.match(/^##\s+(.*)$/);
    if (m) out.push(m[1].trim());
  });
  return out;
}

function renderSidebar() {
  const q = (els.sideSearch.value || "").trim().toLowerCase();
  const frag = document.createDocumentFragment();
  const addGroup = (key, name, items, itemize) => {
    if (!items.length) return;
    const hasCurrent = items.some(it => it.current);
    const isOpen = sbMemOpen.has(key) || (sbMemOpen.size === 0 && hasCurrent);
    const g = document.createElement("div");
    g.className = "group" + (isOpen ? " open" : "") + (hasCurrent ? " group-current" : "");
    g.dataset.key = key;
    const title = document.createElement("div");
    title.className = "group-title";
    title.innerHTML = '<span class="group-chev">▸</span><span class="group-txt">' + name + '</span><span class="group-count">' + items.length + "</span>";
    title.setAttribute("role", "button");
    title.tabIndex = 0;
    title.addEventListener("click", () => sbToggle(key));
    title.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); sbToggle(key); } });
    const body = document.createElement("div");
    body.className = "group-body";
    items.forEach(it => body.appendChild(itemize(it)));
    g.appendChild(title);
    g.appendChild(body);
    frag.appendChild(g);
  };
  TOPIC_GROUPS.forEach(grp => {
    TOPICS.filter(t => grp.slugs.includes(t.slug)).forEach(t => {
      const subs = topicSubs(t.slug);
      if (!subs.length) return;
      const hay = ((t.title + " " + t.tag) + " " + subs.join(" ")).toLowerCase();
      if (q && !hay.includes(q)) return;
      const isCur = current === -3 && currentTopicSlug === t.slug && !isOTF(t.slug);
      const list = [{ kind: "full", cur: isCur }].concat(subs.map((label, si) => ({ kind: "sub", si: si, label: label, cur: isCur && currentSub === si })));
      addGroup("t" + t.slug, "📘 " + t.title, list, it => {
        if (it.kind === "full") {
          const f = document.createElement("div");
          f.className = "sub-item full" + (it.cur ? " active" : "");
          f.innerHTML = '<span class="sub-bullet">🔖</span><span class="sub-txt">' + escText(t.title) + ' — Full Page</span>';
          f.current = it.cur;
          f.addEventListener("click", () => loadTopic(t.slug));
          return f;
        }
        const s = document.createElement("div");
        s.className = "sub-item" + (it.cur ? " active" : "");
        s.title = it.label;
        s.innerHTML = '<span class="sub-bullet">→</span><span class="sub-txt">' + escText(it.label) + "</span>";
        s.addEventListener("click", () => loadTopic(t.slug, it.si));
        return s;
      });
    });
  });
  els.navGroups.replaceChildren(frag);
  updateProgressBar();
}

function isOTF(slug) { return slug.indexOf("otf-") === 0; }

function updateProgressBar() {
  const total = DAYS[DAYS.length - 1].num;
  const done = getProgress().filter(n => n >= 1 && n <= total).length;
  const pct = Math.round((done / total) * 100);
  els.progressText.textContent = done + "/" + total + " (" + pct + "%)";
  els.progressBar.style.width = Math.max(pct, 6) + "%";
}

els.sideSearch.addEventListener("input", renderSidebar);

/* ---------- Rendering ---------- */
function getContent(file) {
  if (window.DEVCLO_CONTENT && window.DEVCLO_CONTENT[file]) return window.DEVCLO_CONTENT[file];
  return null;
}

function renderMarkdown(md) {
  const renderer = new marked.Renderer();
  const base = renderer.listitem.bind(renderer);
  renderer.listitem = function (text, task, checked) {
    if (task) {
      return '<li style="list-style:none"><input type="checkbox" class="task-cb"' + (checked ? " checked" : "") + "> " + text + "</li>";
    }
    return base(text, task, checked);
  };
  return marked.parse(md, { renderer, gfm: true, breaks: true })
    .replace(/<a href="(day-[0-9][0-9]-[^"]+\.md)"/g, '<a href="#$1" data-internal="1"')
    .replace(/<a href="(capstone\/day-[0-9][0-9][^"]+\.md)"/g, '<a href="#$1" data-internal="1"')
    .replace(/<a href="(?:\.\.\/)?expanded\/(day-[0-9][0-9][^"]+\.md)"/g, '<a href="#expanded/$1" data-internal="1"')
    .replace(/<a href="(topics\/[^"]+\.md)"/g, (m, f) => '<a href="#' + f.replace(/^topics\//, "topic-").replace(/\.md$/, "") + '" data-internal="1"');
}

function findDayByFile(file) {
  const base = file.replace(/^.*\//, "").replace(/\.md$/, "");
  return DAYS.find(d => d.file.replace(/^.*\//, "").replace(/\.md$/, "") === base);
}

async function pipeInto(md, num, opts) {
  opts = opts || {};
  let html = renderMarkdown(md);
  const h1match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (opts.hero) {
    html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");
    html = '<h1><span class="day-tag">' + opts.hero + "</span></h1>" + html;
  } else if (h1match) {
    let title = h1match[1].replace(/^Day\s*\d+\s*[:–—-]?\s*/i, "").trim();
    html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "<h1><span class=\"day-tag\">Day " + num + "</span> " + title + "</h1>");
  }
  html = '<div class="seg-nav" id="segNav">' +
    '<span class="seg-nav-label">Go to:</span>' +
    '<a class="seg-nav-link" data-seg="learn" href="#seg-learn">📚 Learn</a>' +
    '<a class="seg-nav-link" data-seg="practice" href="#seg-practice">🧪 Practice</a>' +
    '<a class="seg-nav-link" data-seg="platform" href="#seg-platform">🛠️ Platform</a>' +
    "</div>" + html;
  els.content.innerHTML = html;
  els.content.querySelectorAll("#segNav .seg-nav-link").forEach(a => {
    a.addEventListener("click", ev => {
      ev.preventDefault();
      gotoSeg(a.dataset.seg);
    });
  });
  await afterRender(num);
}

function gotoSeg(seg) {
  if (!["learn", "practice", "platform"].includes(seg)) seg = "learn";
  window.location.hash = "seg-" + seg;
  loadStart();
  setTimeout(() => scrollToSeg(seg), 80);
}

function escText(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function afterRender(n) {
  if (n >= 0) injectDayExtras(n);
  if (n >= 0) {
    const state = getTaskState(n);
    const boxes = Array.from(els.content.querySelectorAll("input.task-cb"));
    boxes.forEach((cb, i) => {
      cb.checked = state.length > 0 ? state.includes(i) : cb.hasAttribute("checked");
    });
  }
  els.content.querySelectorAll("pre code.language-mermaid").forEach(pre => {
    const div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = pre.textContent;
    pre.closest("pre").replaceWith(div);
  });
  els.content.querySelectorAll("h2").forEach((h, i) => { if (!h.id) h.id = "td-" + i; });
  if (window.hljs) els.content.querySelectorAll("pre code").forEach(b => hljs.highlightElement(b));
  if (window.mermaid) {
    try {
      mermaid.initialize({ startOnLoad: false, theme: "light", securityLevel: "loose" });
      await mermaid.run({ nodes: els.content.querySelectorAll(".mermaid") });
    } catch (e) { console.warn("mermaid", e); }
  }
  els.content.querySelectorAll('a[data-internal="1"]').forEach(a => {
    a.addEventListener("click", ev => {
      ev.preventDefault();
      const raw = a.getAttribute("href").slice(1);
      if (raw.startsWith("topic-")) return loadTopic(raw.slice(6));
      if (raw.startsWith("expanded/")) {
        const ed = expByFile(raw);
        if (ed) return loadExpanded(ed.n);
      }
      const target = findDayByFile(raw);
      if (target) loadDay(target.num);
    });
  });
  els.content.querySelectorAll("a").forEach(a => {
    if (!a.hasAttribute("data-internal") && a.href && a.href.startsWith("http")) a.target = "_blank";
  });
}

function isAllChecked(n) {
  const boxes = els.content.querySelectorAll("input.task-cb");
  return boxes.length > 0 && Array.from(boxes).every(b => b.checked);
}
function hasAnyCheck(n) {
  return Array.from(els.content.querySelectorAll("input.task-cb")).some(b => b.checked);
}
function markDay(n, done) {
  if (done !== isDone(n)) toggleDone(n);
}
function markDoneReflect() {
  if (current < 0) return;
  const done = current >= 1000 ? isExpDone(current - 1000) : isDone(current);
  els.markDoneBtn.textContent = done ? "✓ Day Complete (Undo)" : "✓ Mark Day Complete";
}

/* ---------- Q&A + Deep-dive helpers ---------- */
function qaHTML(q, i) {
  return '<details class="qa' + (q.tricky ? " tricky" : "") + '"' + (i === 0 ? " open" : "") + ">" +
    "<summary>" + (q.tricky ? "🧩 " : "Q" + (i + 1) + ". ") + escText(q.q) + "</summary>" +
    '<div class="qa-a">' + escText(q.a).replace(/\n/g, "<br>") + "</div></details>";
}

function injectDayExtras(n) {
  const related = TOPICS.filter(t => t.days.indexOf(n) >= 0);
  const iq = (window.INTERVIEWS && window.INTERVIEWS[n]) || [];
  if (!related.length && !iq.length) return;
  const bar = document.createElement("div");
  bar.className = "day-extras";
  if (related.length) {
    const ddb = document.createElement("div");
    ddb.className = "deepdive-bar";
    ddb.innerHTML = "📚 <b>In-depth:</b> " + related.map(t =>
      '<a class="chiphref" href="#topic-' + t.slug + '" data-internal="1">' + t.title + "</a>").join(" ");
    bar.appendChild(ddb);
  }
  if (iq.length) {
    const box = document.createElement("div");
    box.className = "interview-box";
    box.innerHTML =
      '<div class="ib-head"><span class="ib-ico">🎯</span><div><b>Interview Corner — Day ' + n + "</b>" +
      '<div class="ib-sub">sawaal pehle socho, answer pe click karo</div></div>' +
      '<a class="ib-all" href="#interviews" data-internal="1">Sab Q&A &rarr;</a></div>' +
      iq.map((q, i) => qaHTML(q, i)).join("");
    bar.appendChild(box);
  }
  const h1 = els.content.querySelector("h1");
  if (h1) h1.after(bar);
}

/* ---------- Page loaders ---------- */
async function loadDay(n) {
  const d = DAYS.find(x => x.num === n);
  if (!d) return;
  current = n;
  window.location.hash = "day-" + n;
  els.footnav.hidden = false;
  els.content.classList.add("markdown-body");
  els.content.innerHTML = '<div class="loading">Loading Day ' + n + "…</div>";
  renderSidebar();
  els.markDoneBtn.style.display = "";
  markDoneReflect();
  try {
    let md = getContent(d.file);
    if (md === null) {
      const resp = await fetch("../" + d.file);
      if (!resp.ok) throw new Error("File nahi mili: " + d.file);
      md = await resp.text();
    }
    await pipeInto(md, n);
  } catch (err) {
    els.content.innerHTML = '<div class="notice">❌ ' + err.message + '</div><button class="cta" onclick="loadStart()">← Back to Home</button>';
  }
}

async function loadExpanded(n) {
  const d = EXP_DAYS.find(x => x.n === n);
  if (!d) return;
  current = vid(n);
  window.location.hash = "exp-" + n;
  els.footnav.hidden = false;
  els.content.classList.add("markdown-body");
  els.content.innerHTML = '<div class="loading">Loading Detailed Day ' + n + "…</div>";
  renderSidebar();
  els.markDoneBtn.style.display = "";
  markDoneReflect();
  try {
    let md = getContent(d.file);
    if (md === null) {
      const resp = await fetch("../" + d.file);
      if (!resp.ok) throw new Error("File nahi mili: " + d.file);
      md = await resp.text();
    }
    await pipeInto(md, vid(n), { hero: "📗 DETAILED — Day " + n + ": " + d.title });
  } catch (err) {
    els.content.innerHTML = '<div class="notice">❌ ' + err.message + '</div><button class="cta" onclick="loadStart()">← Back to Home</button>';
  }
}

async function loadHelp() {
  current = -2;
  window.location.hash = "help";
  els.footnav.hidden = false;
  els.content.classList.add("markdown-body");
  els.content.innerHTML = '<div class="loading">Loading Help…</div>';
  renderSidebar();
  try {
    let md = getContent("help-debug.md");
    if (md === null) {
      const resp = await fetch("../help-debug.md");
      if (!resp.ok) throw new Error("help-debug.md nahi mili");
      md = await resp.text();
    }
    els.markDoneBtn.style.display = "none";
    await pipeInto(md, -1, { hero: "💡 HELP & DEBUG — Jab Kuch Kaam Nahi Kar Raha" });
  } catch (err) {
    els.content.innerHTML = '<div class="notice">❌ ' + err.message + "</div>";
  }
}

/* ---------- Deep Dive (topic) pages ---------- */
async function loadTopic(slug, subIndex) {
  const isOTF = slug.startsWith("otf-");
  const t = TOPICS.find(x => x.slug === slug);
  if (!t && !isOTF) return;
  current = -3;
  topicSlug = slug;
  currentTopicSlug = slug;
  currentSub = (typeof subIndex === "number" && subIndex >= 0) ? subIndex : null;
  window.location.hash = "topic-" + slug;
  els.footnav.hidden = false;
  els.content.classList.add("markdown-body");
  els.content.innerHTML = '<div class="loading">Loading deep dive…</div>';
  els.markDoneBtn.style.display = "none";
  renderSidebar();
  if (isOTF) {
    try {
      const md = buildOTFPage(slug.slice(4));
      await pipeInto(md, -3, { hero: "✨ QUICK TOPIC — " + titleCase(slug.slice(4)) });
      scrollToSub();
      return;
    } catch (err) {
      els.content.innerHTML = '<div class="notice">❌ Auto page nahi ban paya.</div><button class="cta" onclick="App.loadStart()">← Back to Home</button>';
      return;
    }
  }
  try {
    let md = getContent(t.file);
    if (md === null) {
      const resp = await fetch("../" + t.file);
      if (!resp.ok) throw new Error(t.file + " nahi mili");
      md = await resp.text();
    }
    await pipeInto(md, -3, { hero: "📚 DEEP DIVE — " + t.title });
    scrollToSub();
  } catch (err) {
    els.content.innerHTML = '<div class="notice">❌ ' + err.message + '</div><button class="cta" onclick="App.loadStart()">← Back to Home</button>';
  }
}

function scrollToSub() {
  if (currentSub === null) return;
  const el = els.content.querySelector("#td-" + currentSub);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Interview Corner ---------- */
function interviewHTML(fl) {
  if (!window.INTERVIEWS) return '<div class="notice">❌ interviews.js load nahi hua — index.html check karo.</div>';
  const days = Object.keys(window.INTERVIEWS).map(Number).sort((a, b) => a - b);
  const chips = ['<button class="int-chip' + (fl == null ? " active" : "") + '" data-d="">All</button>']
    .concat(days.map(d => '<button class="int-chip' + (fl === d ? " active" : "") + '" data-d="' + d + '">D' + d + "</button>"));
  const part = (fl == null ? days : [fl]).map(d => {
    const qs = window.INTERVIEWS[d] || [];
    const day = DAYS.find(x => x.num === d);
    const label = day ? "Day " + d + " — " + day.title : "Day " + d;
    return qs.length ? '<div class="int-day"><div class="int-day-head">' + label + "</div>" + qs.map((q, i) => qaHTML(q, i)).join("") + "</div>" : "";
  }).join("");
  const tricky = fl == null ?
    '<div class="int-day int-tricky"><div class="int-day-head">🧩 Tricky Questions & Answers (mix across topics)</div>' +
    (window.TRICKS || []).map((t, i) => qaHTML({ q: t.q, a: t.a, tricky: true }, i)).join("") + "</div>" : "";
  return '<div class="interview-page">' +
    '<h1 style="margin:0 0 4px">🎯 Interview Corner + Tricky Q&amp;A</h1>' +
    '<p class="int-sub">Har day ke top interview sawaal + tricky questions. Answer dekho (click Q) sirf soch ke baad. Filter chip me day chuno.</p>' +
    '<div class="int-chips">' + chips.join("") + "</div>" +
    "</div>" + part + tricky;
}
function loadInterviews(dayFilter) {
  current = -4;
  interviewDay = dayFilter || null;
  window.location.hash = interviewDay ? "interview-" + interviewDay : "interviews";
  els.footnav.hidden = false;
  els.content.classList.remove("markdown-body");
  els.markDoneBtn.style.display = "none";
  renderSidebar();
  els.content.innerHTML = interviewHTML(interviewDay);
  els.content.querySelectorAll(".int-chip").forEach(c =>
    c.addEventListener("click", () => loadInterviews(parseInt(c.dataset.d, 10) || null)));
}

/* ---------- Practice Lab ---------- */
function loadLab() {
  current = -5;
  window.location.hash = "lab";
  els.footnav.hidden = false;
  els.content.classList.remove("markdown-body");
  els.markDoneBtn.style.display = "none";
  renderSidebar();
  if (window.Lab) {
    els.content.innerHTML = '<div class="loading">Practice Lab shuru ho raha hai…</div>';
    window.Lab.init(els.content);
  } else {
    els.content.innerHTML = '<div class="notice">❌ Lab engine load nahi hua — index.html me lab.js script check karo.</div>';
  }
}

/* ---------- Landing ---------- */
function loadStart() {
  const seg = (window.location.hash.match(/^#seg-(learn|practice|platform)$/) || [])[1] || "learn";
  current = -1;
  const h0 = window.location.hash;
  if (h0 === "" || h0 === "#start") window.location.hash = "start";
  els.footnav.hidden = true;
  els.content.classList.remove("markdown-body");
  alwaysShowDoneBtn();
  renderSidebar();
  els.content.innerHTML = landingHTML();
  const tg = document.getElementById("topicGrid");
  if (tg) tg.innerHTML = buildTopicCards();
  const cg = document.getElementById("conceptGrid");
  if (cg) cg.innerHTML = buildConceptCards();
  document.getElementById("weekGrid").innerHTML = buildWeekCards();
  document.getElementById("dayGrid").innerHTML = buildDayCards();
  const ecg = document.getElementById("expCoreGrid");
  if (ecg) ecg.innerHTML = buildExpCoreCards();
  const epg = document.getElementById("expPlatformGrid");
  if (epg) epg.innerHTML = buildExpPlatformCards();
  const ag = document.getElementById("advGrid");
  if (ag) ag.innerHTML = buildAdvCards();
  const ptg = document.getElementById("platformTopicGrid");
  if (ptg) ptg.innerHTML = buildPlatformTopicCards();
  const todayMd = getContent("today-task.md");
  const box = document.getElementById("todayBox");
  if (todayMd !== null && box) box.innerHTML = marked.parse(todayMd, { gfm: true, breaks: true });
  // accordion switching (Learn / Practice / Platform)
  els.content.querySelectorAll(".acc-head").forEach(btn => {
    const toggle = () => {
      const acc = btn.closest(".acc");
      const opening = !acc.classList.contains("open");
      if (opening) activateSeg(btn.dataset.seg, true);
      else acc.classList.remove("open");
    };
    btn.addEventListener("click", toggle);
    btn.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); } });
  });
  activateSeg(seg, false);
  document.querySelectorAll('[data-ql]').forEach(b => {
    b.addEventListener("click", () => {
      const v = b.getAttribute("data-ql");
      if (v === "start") loadDay(1);
      else if (v === "setup") loadDay(0);
      else if (v === "help") loadHelp();
      else if (v === "resume") loadDay(nextUndone());
      else if (v === "chat") toggleChat(true);
      else if (v === "palette") openPalette();
      else if (v === "interview") loadInterviews(null);
      else if (v === "lab") loadLab();
      else if (v === "golearn") { activateSeg("learn", false); scrollToSeg("learn"); }
      else if (v === "gopractice") { activateSeg("practice", false); scrollToSeg("practice"); }
      else if (v === "goplatform") { activateSeg("platform", false); scrollToSeg("platform"); }
      else if (v === "expstart") { location.hash = "exp-1"; loadExpanded(1); }
    });
  });
}

function scrollToSeg(seg) {
  const acc = els.content.querySelector("#acc-" + seg);
  if (acc) acc.scrollIntoView({ behavior: "smooth", block: "start" });
}

function activateSeg(seg, setHash) {
  if (!["learn", "practice", "platform"].includes(seg)) return;
  els.content.querySelectorAll(".acc").forEach(a => a.classList.remove("open"));
  const acc = els.content.querySelector("#acc-" + seg);
  if (acc) acc.classList.add("open");
  if (setHash && window.location.hash !== "#seg-" + seg) window.location.hash = "seg-" + seg;
}

function alwaysShowDoneBtn() { els.markDoneBtn.style.display = ""; }

function landingHTML() {
  const total = DAYS[DAYS.length - 1].num;
  const done = getProgress().filter(n => n >= 1 && n <= total).length;
  const expDone = getExpProgress().length;
  return '<div class="landing">' +
    '<div class="hero">' +
      "<h1>⬢ DevOps 50-Day Roadmap</h1>" +
      "<p>Simple English + Hindi mein, har din practical lab ke saath — hands-on <strong>Microsoft Azure</strong> pe, concepts <strong>cloud-agnostic</strong> (AWS/GCP bhi same). 0 → 5-saal experience level: Learn (concepts) → Practice (labs/capstones) → Platform (advanced + platform engineering).</p>" +
      '<div class="stat-row">' +
        '<div class="stat"><b>' + done + '/' + total + '</b><span>DIN COMPLETE</span></div>' +
        '<div class="stat"><b>' + (done / total * 100).toFixed(0) + '%</b><span>PROGRESS</span></div>' +
        '<div class="stat"><b>' + TOPICS.length + '</b><span>DEEP DIVES</span></div>' +
        '<div class="stat"><b>' + total + '</b><span>DAILY PAGES</span></div>' +
        '<div class="stat"><b>' + EXP_DAYS.length + '</b><span>DETAILED DAYS (' + expDone + ' ✅)</span></div>' +
      "</div>" +
      '<div class="cta-row">' +
        '<button class="cta" data-ql="start">▶️ Start Day 1 — DevOps Culture</button>' +
        '<button class="cta secondary" data-ql="resume">Continue — Day ' + nextUndone() + "</button>" +
        '<button class="cta secondary" data-ql="setup">🔧 Day 0 — Setup</button>' +
        '<button class="cta secondary" data-ql="lab">🧪 Practice Lab</button>' +
        '<button class="cta secondary" data-ql="interview">🎯 Interview Q&amp;A</button>' +
        '<button class="cta secondary" data-ql="help">💡 Help & Debug</button>' +
        '<button class="cta secondary" data-ql="chat">💬 Chaal Se Puchho</button>' +
        '<button class="cta secondary" data-ql="palette">🔎 Quick Launch (Ctrl+K)</button>' +
      "</div>" +
      '<div class="tech-chips"><span class="tech"><b>Git</b></span><span class="tech"><b>Docker</b></span><span class="tech"><b>Kubernetes</b></span><span class="tech"><b>Terraform</b></span><span class="tech"><b>Azure</b></span><span class="tech"><b>ArgoCD</b></span><span class="tech"><b>Istio</b></span><span class="tech"><b>Kyverno</b></span><span class="tech"><b>Vault</b></span><span class="tech"><b>Prometheus</b></span><span class="tech"><b>Grafana</b></span><span class="tech"><b>dbt</b></span><span class="tech"><b>KEDA</b></span><span class="tech"><b>cosign</b></span></div>' +
    "</div>" +
    '<div class="acc open" id="acc-learn">' +
      '<div class="acc-head" data-seg="learn" role="button" tabindex="0">' +
        '<span class="acc-ic">📚</span>' +
        '<span class="acc-txt">Learn<span class="acc-sub">Deep Dives + Concept Days + Kaise Padhna Hai</span></span>' +
        '<span class="acc-count">' + (TOPICS.length + conceptCount()) + ' items</span>' +
        '<span class="acc-prog">' + conDoneCount() + ' ✅</span>' +
        '<span class="acc-chev">▾</span>' +
      '</div>' +
      '<div class="acc-body" id="seg-learn">' +
        "<h2>📚 Learning Topics (10 domains — Networking, Linux, Docker, K8s…) </h2>" +
        '<div id="topicGrid" class="grid"></div>' +
        "<h2>🧠 Concept Days (theory, notes-tak)</h2>" +
        '<div id="conceptGrid" class="grid"></div>' +
        "<h2>🧠 Kaise Padhna Hai</h2>" +
        "<ol>" +
          "<li><strong>Day 0 pehle:</strong> Tools install + verify (setup-check.sh) — phir hi aage badho.</li>" +
          "<li><strong>Roz ek day:</strong> Concept padho → Diagram dekho → Copy-paste Demo chalao → Lab karo.</li>" +
          "<li><strong>Practice zaroori hai:</strong> Bas padhne se nahi hoga — har command khud chalao.</li>" +
          "<li><strong>Week ke aakhri din</strong> (7, 14, 21, 28) = review + capstone challenge.</li>" +
          "<li><strong>Atak gaye?</strong> 💡 Help & Debug page kholo ya chatbot se puchho.</li>" +
          "<li><strong>Day 29-31:</strong> DeployTrack project (CI/CD + K8s + Terraform + monitoring) + final Azure lecture.</li>" +
          "<li><strong>Day 32-50:</strong> Advanced — GitOps, Service Mesh, Policy, Secrets, FinOps, Chaos, DR, Multi-Cloud, Serverless, MLOps, DataOps, API/Microservices, Perf, Supply-chain, Security, Grand Capstone.</li>" +
        "</ol>" +
      '</div>' +
    '</div>' +
    '<div class="acc" id="acc-practice">' +
      '<div class="acc-head" data-seg="practice" role="button" tabindex="0">' +
        '<span class="acc-ic">🧪</span>' +
        '<span class="acc-txt">Practice<span class="acc-sub">Week-by-Week + Saare Pages + Detailed Core (Day 1-30)</span></span>' +
        '<span class="acc-count">' + practiceCount() + ' items</span>' +
        '<span class="acc-prog">' + practiceDoneCount() + ' ✅</span>' +
        '<span class="acc-chev">▾</span>' +
      '</div>' +
      '<div class="acc-body" id="seg-practice">' +
        '<div class="seg-cta-row">' +
          '<button class="cta" data-ql="start">▶️ Start Day 1</button>' +
          '<button class="cta secondary" data-ql="lab">🧪 Practice Lab (sandbox)</button>' +
          '<button class="cta secondary" data-ql="resume">Continue</button>' +
        '</div>' +
        "<h2>🗓️ Week-by-Week Roadmap</h2>" +
        '<div id="weekGrid" class="grid"></div>' +
        "<h2>📅 Saare " + DAYS.length + " Pages (labs/commands/Tickets)</h2>" +
        '<div id="dayGrid" class="grid"></div>' +
        "<h2>📗 Detailed Track — Core (Day 1-30, full LEARN→LAB→TICKETS)</h2>" +
        '<div id="expCoreGrid" class="grid"></div>' +
      '</div>' +
    '</div>' +
    '<div class="acc" id="acc-platform">' +
      '<div class="acc-head" data-seg="platform" role="button" tabindex="0">' +
        '<span class="acc-ic">🛠️</span>' +
        '<span class="acc-txt">Platform<span class="acc-sub">Platform Engineering Track + Advanced Class + Platform Deep Dives</span></span>' +
        '<span class="acc-count">' + platformCount() + ' items</span>' +
        '<span class="acc-prog">' + platformDoneCount() + ' ✅</span>' +
        '<span class="acc-chev">▾</span>' +
      '</div>' +
      '<div class="acc-body" id="seg-platform">' +
        "<h2>🛠️ Platform Engineering Track (Day 31-40)</h2>" +
        '<div id="expPlatformGrid" class="grid"></div>' +
        "<h2>📈 Advanced Class (Day 32-50)</h2>" +
        '<div id="advGrid" class="grid"></div>' +
        "<h2>🛠️ Platform Deep Dives</h2>" +
        '<div id="platformTopicGrid" class="grid"></div>' +
      '</div>' +
    '</div>' +
    '<div id="todayBox" class="notice"></div>' +
    "<p>Day complete karo toh sidebar mein ✓ aur progress bar badega. 🎯</p>" +
  "</div>";
}

function buildWeekCards() {
  return WEEKS.filter(w => w.key !== -1).map(w => {
    const days = DAYS.filter(d => d.week === w.key);
    const done = days.filter(d => isDone(d.num)).length;
    const pct = Math.round((done / days.length) * 100);
    const next = days.find(d => !isDone(d.num));
    return '<a class="card" onclick="loadDay(' + (next ? next.num : days[days.length - 1].num) + ')" href="#day-' + (next ? next.num : days[days.length - 1].num) + '">' +
      '<div><span class="card-num">' + w.icon + " " + w.name + '</span> <span class="card-type">' + done + "/" + days.length + "</span></div>" +
      '<div class="card-title">' + pct + '% complete</div>' +
      '<div class="card-sub">' + days.map(d => "D" + d.num).join(" · ") + "</div>" +
    "</a>";
  }).join("");
}

function buildDayCards() {
  return DAYS.map(d => {
    const cls = isDone(d.num) ? ' class="card done"' : ' class="card"';
    return '<a' + cls + ' href="#day-' + d.num + '" onclick="loadDay(' + d.num + ')">' +
      '<div><span class="card-num">Day ' + d.num + "</span> <span class=\"card-type\">" + d.type + "</span></div>" +
      '<div class="card-title">' + d.title + "</div>" +
      '<div class="card-sub">' + d.short + "</div></a>";
  }).join("");
}

function topicCard(t) {
  return '<a class="card" href="#topic-' + t.slug + '" onclick="loadTopic(\'' + t.slug + '\')">' +
    '<div><span class="card-num">📚</span> <span class="card-type">' + t.tag + "</span></div>" +
    '<div class="card-title">' + t.title + "</div>" +
    '<div class="card-sub">' + (t.days.map(d => "Day " + d).join(" · ")) + " se connected</div></a>";
}

function buildTopicCards() {
  return TOPIC_GROUPS.map(g => {
    const ts = g.slugs.map(s => TOPICS.find(x => x.slug === s)).filter(Boolean);
    return '<div class="topic-cat">' +
      '<div class="topic-cat-head"><span class="tc-name">' + g.name + "</span><span class=\"tc-count\">" + ts.length + " topics</span></div>" +
      '<div class="grid">' + ts.map(topicCard).join("") + "</div></div>";
  }).join("");
}

function buildExpCards() {
  return EXP_DAYS.map(d => {
    const cls = isExpDone(d.n) ? ' class="card done"' : ' class="card"';
    const ph = EXP_PHASES.find(p => p.key === d.phase);
    return '<a' + cls + ' href="#exp-' + d.n + '" onclick="loadExpanded(' + d.n + ')">' +
      '<div><span class="card-num">' + (ph ? ph.icon : "📗") + ' Day ' + d.n + '</span> <span class="card-type">' + d.type + "</span></div>" +
      '<div class="card-title">' + d.title + "</div>" +
      '<div class="card-sub">' + d.short + "</div></a>";
  }).join("");
}

function buildExpPhaseCards() {
  return EXP_PHASES.map(ph => {
    const days = EXP_DAYS.filter(d => d.phase === ph.key);
    const done = days.filter(d => isExpDone(d.n)).length;
    const pct = Math.round((done / days.length) * 100);
    const first = days[0];
    return '<a class="card" href="#exp-' + first.n + '" onclick="loadExpanded(' + first.n + ')">' +
      '<div><span class="card-num">' + ph.icon + " " + ph.name + '</span> <span class="card-type">' + done + "/" + days.length + " ✅</span></div>" +
      '<div class="card-title">' + pct + '% complete</div>' +
      '<div class="card-sub">' + days.map(d => "D" + d.n).join(" · ") + "</div></a>";
  }).join("");
}

function cardHTML(numLabel, type, title, short, href, onclick, done) {
  return '<a' + (done ? ' class="card done"' : ' class="card"') + ' href="' + href + '" onclick="' + onclick + '">' +
    '<div><span class="card-num">' + numLabel + "</span> <span class=\"card-type\">" + type + "</span></div>" +
    '<div class="card-title">' + title + "</div>" +
    '<div class="card-sub">' + short + "</div></a>";
}

function buildConceptCards() {
  return DAYS.filter(d => d.type === "concept" && d.num > 0).map(d =>
    cardHTML("Day " + d.num, d.type, d.title, d.short, "#day-" + d.num, "loadDay(" + d.num + ")", isDone(d.num)))
    .concat(EXP_DAYS.filter(d => d.type === "concept" && d.phase !== 6).map(d =>
      cardHTML("📗 Day " + d.n, d.type, "Detailed " + d.title, d.short, "#exp-" + d.n, "loadExpanded(" + d.n + ")", isExpDone(d.n))));
}

function buildExpCoreCards() {
  return EXP_DAYS.filter(d => d.phase >= 1 && d.phase <= 5).map(d =>
    cardHTML("📗 Day " + d.n, d.type, d.title, d.short, "#exp-" + d.n, "loadExpanded(" + d.n + ")", isExpDone(d.n)));
}

function buildExpPlatformCards() {
  return EXP_DAYS.filter(d => d.phase === 6).map(d =>
    cardHTML("📗 Day " + d.n, d.type, d.title, d.short, "#exp-" + d.n, "loadExpanded(" + d.n + ")", isExpDone(d.n)));
}

function buildAdvCards() {
  return DAYS.filter(d => d.num >= 32).map(d =>
    cardHTML("Day " + d.num, d.type, d.title, d.short, "#day-" + d.num, "loadDay(" + d.num + ")", isDone(d.num)));
}

function buildPlatformTopicCards() {
  return TOPICS.filter(t => PLATFORM_SLUGS.has(t.slug)).map(t =>
    cardHTML("📚", t.tag, t.title, t.days.map(d => "Day " + d).join(" · ") + " se connected", "#topic-" + t.slug, "loadTopic('" + t.slug + "')", false));
}

/* ---------- Palette (Ctrl+K Quick Launch) ---------- */
function paletteSections() {
  return [
    { group: "Jump To", items: DAYS.map(d => ({
      num: "D" + d.num,
      title: d.title,
      hint: (d.week > 0 ? "Week " + d.week : d.week === 0 ? "Capstone" : "Setup") + " · " + d.type + (isDone(d.num) ? " ✓done" : ""),
      go: () => loadDay(d.num)
    })) },
    { group: "Deep Dives", items: TOPICS.map(t => ({
      num: "📚",
      title: t.title,
      hint: t.tag + " · " + t.days.map(d => "Day " + d).join(" & "),
      go: () => loadTopic(t.slug)
    })) },
    { group: "Detailed Days", items: EXP_DAYS.map(d => ({
      num: "📗" + d.n,
      title: "Detailed " + d.title,
      hint: (EXP_PHASES.find(p => p.key === d.phase) || { name: "" }).name + " · " + d.type + (isExpDone(d.n) ? " ✓done" : ""),
      go: () => loadExpanded(d.n)
    })) },
    { group: "Actions", items: [
      { num: "⌂", title: "Start Here (Home)", hint: "landing page", go: () => loadStart() },
      { num: "🎯", title: "Interview Q&A (all days)", hint: "questions + tricky", go: () => loadInterviews(null) },
      { num: "🧪", title: "Practice Lab (sandbox terminal)", hint: "dummy cloud practice", go: () => loadLab() },
      { num: "💡", title: "Help & Debug", hint: "problem? yahan dekho", go: () => loadHelp() },
      { num: "💬", title: "Chat bot kholo", hint: "curriculum assistant", go: () => toggleChat(true) },
      { num: "📈", title: "Progress dekho", hint: "kya complete kiya", go: () => toggleChat(true, "progress") },
    ] },
  ];
}
function openPalette(initial) {
  els.paletteOverlay.hidden = false;
  els.paletteInput.value = initial || "";
  els.paletteInput.focus();
  renderPalette();
}
function closePalette() { els.paletteOverlay.hidden = true; }
function renderPalette() {
  const q = (els.paletteInput.value || "").trim().toLowerCase();
  const out = [];
  paletteSections().forEach(sec => {
    let items = sec.items;
    if (q) {
      items = items.filter(it => (it.title + " " + it.hint + " " + it.num).toLowerCase().includes(q));
    }
    if (items.length) {
      out.push('<div class="group-title" style="margin:6px 8px 2px">' + sec.group + "</div>");
      items.forEach(it => {
        out.push('<div class="pal-item" data-go="' + encodeURIComponent(it.title) + '">' +
          '<span class="pal-num">' + it.num + "</span>" +
          '<span class="pal-title">' + it.title + "</span>" +
          '<span class="pal-hint">' + it.hint + "</span></div>");
      });
    }
  });
  els.paletteResults.innerHTML = out.length ? out.join("") : '<div class="pal-empty">😕 Kuch nahi mila — try: "docker", "Day 5", "help"</div>';
  const items = Array.from(els.paletteResults.querySelectorAll(".pal-item"));
  if (items[0]) items[0].classList.add("active");
  els.paletteResults._items = items;
}
els.paletteInput.addEventListener("input", renderPalette);
els.paletteInput.addEventListener("keydown", ev => {
  const items = els.paletteResults._items || [];
  const idx = items.findIndex(i => i.classList.contains("active"));
  if (ev.key === "ArrowDown" && items.length) {
    ev.preventDefault();
    items[idx >= 0 ? idx : -1] && items[idx >= 0 ? idx : -1].classList.remove("active");
    items[(idx + 1) % items.length].classList.add("active");
  } else if (ev.key === "ArrowUp" && items.length) {
    ev.preventDefault();
    if (idx >= 0) items[idx].classList.remove("active");
    items[(idx - 1 + items.length) % items.length].classList.add("active");
  } else if (ev.key === "Enter" && items.length) {
    ev.preventDefault();
    const active = items.find(i => i.classList.contains("active")) || items[0];
    const title = decodeURIComponent(active.dataset.go);
    runPaletteGo(title);
  } else if (ev.key === "Escape") {
    closePalette();
  }
});
function runPaletteGo(title) {
  const all = [];
  paletteSections().forEach(s => all.push(...s.items));
  const found = all.find(it => it.title === title);
  closePalette();
  if (found) found.go();
}
els.paletteResults.addEventListener("click", ev => {
  const item = ev.target.closest(".pal-item");
  if (item) runPaletteGo(decodeURIComponent(item.dataset.go));
});
document.getElementById("paletteBtn").addEventListener("click", () => openPalette());
els.paletteOverlay.addEventListener("click", ev => { if (ev.target === els.paletteOverlay) closePalette(); });

/* ---------- Top Search (topic/page naavigate karo) ---------- */
function srchWords(text) {
  return (text || "").toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
}
let _SRCH = null;
function srchIndex() {
  if (_SRCH) return _SRCH;
  _SRCH = {
    topics: TOPICS.map(t => ({ t, words: new Set(srchWords((t.title + " " + t.tag + " " + (getContent(t.file) || "")))) })),
    days: DAYS.map(d => ({ d, words: new Set(srchWords((d.title + " " + d.short + " " + (getContent(d.file) || "")))) })),
    exp: EXP_DAYS.map(d => ({ d, words: new Set(srchWords((d.title + " " + d.short + " " + (getContent(d.file) || "")))) })),
  };
  return _SRCH;
}
function topSearchHits(q) {
  const { topics, days, exp } = srchIndex();
  const isNum = /^\d+$/.test(q);
  const tRank = (x) => {
    const t = x.t;
    const s = (t.title + " " + t.tag + " " + t.slug).toLowerCase();
    if (s.includes(q)) return 0;
    if (!isNum && [...x.words].some(w => w.startsWith(q))) return 3;
    return 99;
  };
  const dRank = (x) => {
    const d = x.d;
    if (String(d.num) === q || (d.title + " " + d.short).toLowerCase().includes(q)) return 0;
    if (!isNum && [...x.words].some(w => w.startsWith(q))) return 3;
    return 99;
  };
  const eRank = (x) => {
    const d = x.d;
    if ("x" + String(d.n) === q || String(d.n) === q || (d.title + " " + d.short).toLowerCase().includes(q)) return 0;
    if (!isNum && [...x.words].some(w => w.startsWith(q))) return 3;
    return 99;
  };
  const pick = (arr, rankFn) => arr.map(x => ({ x, r: rankFn(x) })).filter(v => v.r < 9).sort((a, b) => a.r - b.r || 0).slice(0, 8).map(v => v.x);
  return {
    topics: pick(topics, tRank),
    days: pick(days, dRank).slice(0, 6),
    exp: pick(exp, eRank).slice(0, 4),
    actions: paletteSections()[2].items.filter(a => (a.title + " " + a.hint).toLowerCase().includes(q)).slice(0, 3),
  };
}
function renderTopDrop() {
  const inp = document.getElementById("topSearchInput");
  const drop = document.getElementById("topSearchDrop");
  const q = (inp.value || "").trim().toLowerCase();
  if (!q) { drop.hidden = true; drop.innerHTML = ""; return; }
  const { topics, days, exp, actions } = topSearchHits(q);
  const groups = [];
  if (topics.length) groups.push({ name: "Deep Dives", items: topics.map(x => ({ num: "📚", title: x.t.title, hint: x.t.tag + " · " + x.t.days.map(d => "Day " + d).join(" & "), go: () => loadTopic(x.t.slug) })) });
  if (days.length) groups.push({ name: "Days", items: days.map(x => ({ num: "D" + x.d.num, title: "Day " + x.d.num + ": " + x.d.title, hint: (x.d.week > 0 ? "Week " + x.d.week : x.d.week === 0 ? "Capstone" : "Setup") + " · " + x.d.type, go: () => loadDay(x.d.num) })) });
  if (exp.length) groups.push({ name: "Detailed Days", items: exp.map(x => ({ num: "📗" + x.d.n, title: "Detailed " + x.d.title, hint: (EXP_PHASES.find(p => p.key === x.d.phase) || { name: "" }).name + " · " + x.d.type, go: () => loadExpanded(x.d.n) })) });
  if (actions.length) groups.push({ name: "Actions", items: actions });
  const rows = [];
  groups.forEach(g => g.items.forEach(it => rows.push(it)));
  const isGeneric = q.split(/\s+/).filter(w => w.length >= 2).every(w => !/^\d+$/.test(w));
  if (typeof buildOTFPage === "function" && isGeneric) {
    groups.push({ name: "✨ Auto Generate (instant page)", items: [{ num: "✨", title: titleCase(q), hint: 'kisi bhi term ke liye quick study page — click', go: () => loadTopic("otf-" + slugify(q)), otf: true }] });
    rows.push(groups[groups.length - 1].items[0]);
  }
  if (!rows.length) {
    drop._rows = [];
    drop.innerHTML = '<div class="pal-empty">😕 Kuch nahi mila — try "subnet", "docker", "k8s", "Day 12"</div>';
  } else {
    let ci = 0, html = "";
    groups.forEach(g => {
      html += '<div class="group-title" style="margin:6px 8px 2px">' + g.name + "</div>";
      g.items.forEach(it => {
        html += '<div class="pal-item" data-i="' + ci + '">' +
          '<span class="pal-num">' + it.num + "</span>" +
          '<span class="pal-title">' + it.title + "</span>" +
          '<span class="pal-hint">' + it.hint + "</span></div>";
        ci++;
      });
    });
    drop.innerHTML = html;
    drop._rows = rows;
    const first = drop.querySelector(".pal-item");
    if (first) first.classList.add("active");
  }
  drop.hidden = false;
}
function runTopGo(idx) {
  const drop = document.getElementById("topSearchDrop");
  const rows = drop._rows || [];
  const it = rows[idx];
  const inp = document.getElementById("topSearchInput");
  inp.value = ""; drop.hidden = true; drop.innerHTML = "";
  if (it) it.go();
}

/* ---------- On-The-Fly Quick Topic Engine (OTF) ----------
   Koi bhi technical term — agar existing page nahi mila to instant study page banao. */
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function titleCase(s) {
  const ACRONYMS = { oops: "OOPs", oop: "OOP", devops: "DevOps", gitops: "GitOps", cicd: "CI/CD", ci: "CI", cd: "CD", qa: "QA", sre: "SRE", k8s: "K8s", iac: "IaC", dns: "DNS", http: "HTTP", https: "HTTPS", sql: "SQL", ml: "ML", ai: "AI", mlops: "MLOps", dataops: "DataOps", finops: "FinOps", uuid: "UUID", json: "JSON", yaml: "YAML", xml: "XML", html: "HTML", css: "CSS", api: "API", aws: "AWS", gcp: "GCP", jwt: "JWT", tls: "TLS", ssl: "SSL", ssh: "SSH", nfs: "NFS", vpc: "VPC", nsf: "NSF", rbac: "RBAC", pv: "PV", pvc: "PVC", ip: "IP", os: "OS", vm: "VM", ipfs: "IPFS", npm: "NPM", cli: "CLI", gui: "GUI", ops: "Ops", dev: "Dev", devsecops: "DevSecOps", cdn: "CDN", oop: "OOP" };
  const low = String(s).toLowerCase();
  if (ACRONYMS[low]) return ACRONYMS[low];
  return String(s).split(/\s+/).map(w => {
    const wl = w.toLowerCase();
    if (ACRONYMS[wl]) return ACRONYMS[wl];
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}
function buildOTFPage(termRaw) {
  const term = String(termRaw).trim().replace(/[-_]+/g, " ");
  const T = titleCase(term);
  const UPPER = String(term).toUpperCase();
  const relatedD = DAYS.filter(d => (d.title + " " + (d.short || "")).toLowerCase().includes(String(term).toLowerCase())).slice(0, 4);
  const relatedT = TOPICS.filter(t => ((t.title + " " + (t.tag || "")).toLowerCase().includes(String(term).toLowerCase()))).slice(0, 6);

  const links = [];
  if (relatedT.length) links.push("Related deep dives: " + relatedT.map(t => "[" + t.title + "](../topics/" + t.slug + ".md)").join(" · "));
  if (relatedD.length) links.push("Related days: " + relatedD.map(d => "[" + d.title + "](../" + d.file + ")").join(" · "));

  return `# ✨ Quick Topic: ${T}

> **Ye page auto-ban gaya** kyonki DevClo me "${T}" ka dedicated topic page nahi hai — par concept samajhna zaroori hai, isliye ye quick study sheet bana diya.

---

## 1. ${T} Kya Hai

| Term | Kya hai (ek line) |
|---|---|
| **${T}** | Ye ek technical concept / tool / technology hai jo apne kaam ka backbone hai — isko samajhna modern development/DevOps me zaruri hai. |
| **Why famous?** | Har pipeline, architecture, ya design pattern me kisi na kisi roop me hota hai — interview me bhi aata hai. |

- **Ek line me:** ${T} ka matlab hai — apne system me ek structured way se kaam ko automate, organize, ya enforce karna.
- **Context:** Chhoti system me tum manually kar lete ho, badi system me ${T} required ho jaata hai.

---

## 2. Why ${T} Matters

- **Production me**: ${T} ki wajah se reliability badhti hai, error kam hota hai, scaling hoti hai.
- **Job/Interview**: ${UPPER} ke barre me interview me zyada puchhte hain kyunki ye practical + architectural dono cover karta hai.
- **Learning path**: pehle concept → phir tool → phir real project me use → ab tum ready ho.

---

## 3. Core Vocabulary — Yaad Rakho

| Term | Matlab |
|---|---|
| **Setup / Init** | ${T} ka pehla step: install/configure |
| **Core Operation** | Roj ka kaam: ${T} se kya hota hai |
| **Config / Policy** | Rules / settings jo ${T} ko control karte hain |
| **Debug / Troubleshoot** | Jab galat ho to kaise fix karna |
| **Scaling / Optimization** | Jab load zyada ho to ${T} kaise handle kare |
| **Security** | ${T} me kya important — secrets, access, permissions |

---

## 4. Where You'll See ${T} — Real Me

| Area | ${T} ka role |
|---|---|
| **Development / Backend** | ${T} apne code me ek building block / feature ho sakta hai |
| **CI/CD & Automation** | Rule, job, ya step ke roop me ${T} |
| **Infrastructure / Cloud** | Managed service, tool, ya resource |
| **Security / Ops** | Guard, audit, ya lifecycle management |

---

## 5. Key Concepts — Real Detail

1. **${T} ka first setup:** install / initialize / configure — ye sabse pehle.
2. **${T} operations:** primary commands / API / methods jo daily use honge.
3. **Integration:** ${T} ko apne existing system me kaise jodna hai.
4. **Error handling:** common failures, logs kya bolte hain, kaise fix karna.
5. **Scale & optimize:** jab traffic / data zyada ho to ${T} kaise handle kare.

> **Tip:** Ye sab generic templates hain. Specific tool hone pe in sections ko **real docs + hands-on lab** se replace karo.

---

## 6. Real-World Scenarios & Fixes

| Scenario | Dikkat | Fix / Approach |
|---|---|---|
| ${T} kaam nahi kar raha | config / dependency / permission issue | logs check → config fix → restart / retry |
| ${T} slow hai | resource / scale problem | add resources, caching, optimize queries |
| Pipeline integration toot gaya | version mismatch / dependency drift | pin versions, use lockfiles, check APIs |
| Interview me doubt aaya | sirf theory bata diya, example nahi | concept + real example + troubleshooting bolo |

---

## 7. Interview Questions — ${T}

| Question | Strong Answer Framework |
|---|---|
| "What is ${T}?" | Ek line definition + kahan use hota + ek real example |
| "Why ${T} over alternatives?" | Speed / ecosystem / reliability — 2-3 points |
| "How does ${T} work in practice?" | Step-by-step: setup → run → output |
| "Troubleshoot ${T}?" | Logs → config → isolation → escalation |
| "Scale / optimize ${T}?" | Horizontal vs vertical + caching + limits |

---

## 8. Hands-On Practice (Template)

\`\`\`bash
# ${T} — mini-drill
echo "1. ${T} ka setup karo (install/config)"
echo "2. ek basic operation karo (run/apply/build)"
echo "3. output verify karo (logs/status/test)"
echo "4. troubleshoot karo (ek failure simulate karo, fix karo)"
\`\`\`

**Ye page auto-generated hai — real lab ke liye "${T}" ka official docs + dekho aur apne project me integrate karo.**

---

## 9. Summary | Yaad Rakho

- **${T}** = a technical concept/tool jo modern stack me mandatory hai.
- Interview me: definition + real example + where used + troubleshooting.
- DevClo me saare days + topics pages ke **Related** links me ${T} se connected material mil jayega.
${links.length ? "\n---\n**Related:** " + links.join(" · ") : ""}
`;

}

(function initTopSearch() {
  const inp = document.getElementById("topSearchInput");
  const drop = document.getElementById("topSearchDrop");
  if (!inp || !drop) return;
  inp.addEventListener("input", renderTopDrop);
  inp.addEventListener("focus", renderTopDrop);
  inp.addEventListener("keydown", ev => {
    const items = Array.from(drop.querySelectorAll(".pal-item"));
    const idx = items.findIndex(i => i.classList.contains("active"));
    if (ev.key === "ArrowDown" && items.length) {
      ev.preventDefault();
      if (idx >= 0) items[idx].classList.remove("active");
      items[(idx + 1) % items.length].classList.add("active");
    } else if (ev.key === "ArrowUp" && items.length) {
      ev.preventDefault();
      if (idx >= 0) items[idx].classList.remove("active");
      items[(idx - 1 + items.length) % items.length].classList.add("active");
    } else if (ev.key === "Enter" && items.length) {
      ev.preventDefault();
      const active = items.find(i => i.classList.contains("active")) || items[0];
      runTopGo(parseInt(active.dataset.i, 10));
    } else if (ev.key === "Escape") {
      inp.value = ""; drop.hidden = true; drop.innerHTML = "";
    }
  });
  drop.addEventListener("click", ev => {
    const it = ev.target.closest(".pal-item");
    if (it) runTopGo(parseInt(it.dataset.i, 10));
  });
  document.addEventListener("mousedown", ev => {
    const top = document.getElementById("topSearch");
    if (top && !top.contains(ev.target)) { drop.hidden = true; drop.innerHTML = ""; }
  });
})();

/* ---------- Chat ---------- */
function toggleChat(open, preset) {
  const panel = document.getElementById("chatPanel");
  const fab = document.getElementById("chatFab");
  const opening = open === undefined ? panel.hidden : open;
  panel.hidden = !opening;
  fab.classList.toggle("open", opening);
  if (opening && window.ChatBot) {
    document.getElementById("chatInput").focus();
    window.ChatBot.start(preset);
  }
}
document.getElementById("chatFab").addEventListener("click", () => toggleChat());
document.getElementById("chatClose").addEventListener("click", () => toggleChat(false));
document.getElementById("chatToggleBtn").addEventListener("click", () => toggleChat());

/* ---------- Navigation ---------- */
els.prevBtn.addEventListener("click", () => {
  if (current === -3) loadTopic(topicSlug);
  else if (current === -4) loadInterviews(interviewDay);
  else if (current === -5) loadLab();
  else if (current === -2) loadStart();
  else if (current <= 0) loadStart();
  else if (current >= 1000) {
    const d = EXP_DAYS.find(x => x.n === current - 1000 - 1);
    if (d) loadExpanded(d.n); else loadStart();
  }
  else loadDay(current - 1);
});
els.nextBtn.addEventListener("click", () => {
  if (current === -3) loadStart();
  else if (current === -4) loadStart();
  else if (current === -5) loadStart();
  else if (current === -2) loadDay(1);
  else if (current >= 1000) {
    const d = EXP_DAYS.find(x => x.n === current - 1000 + 1);
    if (d) loadExpanded(d.n); else loadStart();
  }
  else {
    const d = DAYS.find(x => x.num === current + 1);
    if (d) loadDay(d.num);
  }
});
els.markDoneBtn.addEventListener("click", () => {
  if (current >= 1000) { toggleExpDone(current - 1000); markDoneReflect(); renderSidebar(); }
  else if (current >= 0) { toggleDone(current); markDoneReflect(); }
});
els.resetBtn.addEventListener("click", () => {
  if (confirm("Saara progress delete karna hai? (completed days + checklists)")) {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(EXP_PROGRESS_KEY);
    DAYS.forEach(d => localStorage.removeItem("devclo-day-" + d.num));
    EXP_DAYS.forEach(d => localStorage.removeItem("devclo-day-" + vid(d.n)));
    renderSidebar();
    if (current === -1) loadStart();
    else if (current === -2) loadHelp();
    else if (current === -3) loadTopic(topicSlug);
    else if (current === -4) loadInterviews(interviewDay);
    else if (current === -5) loadLab();
    else if (current >= 1000) loadExpanded(current - 1000);
    else loadDay(current);
  }
});
document.getElementById("homeBtn").addEventListener("click", loadStart);
document.getElementById("brandBtn").addEventListener("click", loadStart);
document.getElementById("helpBtn").addEventListener("click", loadHelp);
const interviewBtn = document.getElementById("interviewBtn");
if (interviewBtn) interviewBtn.addEventListener("click", () => loadInterviews(null));

/* task checkboxes */
els.content.addEventListener("change", ev => {
  const cb = ev.target;
  if (!cb.classList.contains("task-cb") || current < 0) return;
  const boxes = Array.from(els.content.querySelectorAll("input.task-cb"));
  const idx = boxes.indexOf(cb);
  let state = getTaskState(current);
  if (state.length === 0) state = boxes.map((b, i) => (b.checked ? i : -1)).filter(i => i >= 0);
  if (cb.checked) { if (!state.includes(idx)) state.push(idx); }
  else { state = state.filter(i => i !== idx); }
  saveTaskState(current, state.sort((a, b) => a - b));
  if (current >= 1000) {
    if (isAllChecked(current) && !isExpDone(current - 1000)) toggleExpDone(current - 1000);
  } else if (isAllChecked(current) && !isDone(current)) toggleDone(current);
  markDoneReflect();
  renderSidebar();
});

/*---------- keyboard shortcuts ----------*/
document.addEventListener("keydown", ev => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
    ev.preventDefault();
    openPalette();
  } else if (ev.key === "Escape") {
    if (!els.paletteOverlay.hidden) closePalette();
    else if (!document.getElementById("chatPanel").hidden) toggleChat(false);
  } else if (ev.key === "/" && !typing && document.getElementById("chatPanel").hidden) {
    ev.preventDefault();
    els.sideSearch.focus();
  }
});

/* ---------- init ---------- */
function init() {
  const hash = window.location.hash;
  if (hash === "#help" || hash === "#help-debug") return loadHelp();
  if (hash === "#lab") return loadLab();
  if (hash === "#interviews") return loadInterviews(null);
  if (hash && hash.startsWith("#interview-")) return loadInterviews(parseInt(hash.slice(11), 10));
  if (hash && hash.startsWith("#topic-")) return loadTopic(hash.slice(7));
  if (hash && hash.startsWith("#exp-")) {
    const n = parseInt(hash.replace("#exp-", ""), 10);
    if (n >= 1 && n <= EXP_DAYS[EXP_DAYS.length - 1].n) return loadExpanded(n);
  }
  if (hash && hash.startsWith("#day-")) {
    const n = parseInt(hash.replace("#day-", ""), 10);
    if (n >= 0 && n <= DAYS[DAYS.length - 1].num) return loadDay(n);
  }
  loadStart();
}

window.App = {
  DAYS, TOPICS, EXP_DAYS, EXP_PHASES, getProgress, isDone, isExpDone, current: () => current,
  loadDay, loadExpanded, loadStart, loadHelp, loadTopic, loadInterviews, loadLab,
  openPalette, toggleChat, nextUndone, activateSeg, gotoSeg,
  hash: () => window.location.hash,
};

init();

/* ---------- hashchange (browser back/forward) ---------- */
window.addEventListener("hashchange", () => {
  const h = window.location.hash;
  if (h === "#start" || h === "") { if (current !== -1) loadStart(); return; }
  if (h && h.startsWith("#seg-")) {
    const s = h.replace("#seg-", "");
    if (["learn", "practice", "platform"].includes(s)) {
      if (els.content.querySelector(".acc")) activateSeg(s, false);
      else loadStart();
    }
    return;
  }
  if (h === "#help" || h === "#help-debug") { if (current !== -2) loadHelp(); return; }
  if (h === "#lab") { if (current !== -5) loadLab(); return; }
  if (h === "#interviews") { if (current !== -4) loadInterviews(null); return; }
  if (h && h.startsWith("#interview-")) {
    const n = parseInt(h.slice(11), 10);
    if (!isNaN(n) && current !== -4) return loadInterviews(n);
  }
  if (h && h.startsWith("#topic-")) {
    const t = h.slice(7);
    if (!(current === -3 && topicSlug === t)) return loadTopic(t);
  }
  if (h && h.startsWith("#exp-")) {
    const n = parseInt(h.replace("#exp-", ""), 10);
    if (n >= 1 && n <= EXP_DAYS[EXP_DAYS.length - 1].n && current !== vid(n)) return loadExpanded(n);
  }
  if (h && h.startsWith("#day-")) {
    const n = parseInt(h.replace("#day-", ""), 10);
    if (n >= 0 && n <= DAYS[DAYS.length - 1].num && current !== n) return loadDay(n);
  }
});