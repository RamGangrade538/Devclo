# Day 38: Platform Engineering — Backstage, Golden Path, Internal Developer Platform (IDP)

> Platform engineering = **developer productivity par focus** — devs ko self-service ban: infra, deploy, envs, observability ek dashboard me, bina team-bottleneck ke. Golden Path = templated "best way" stack.

## Overview | Parichay

Ab tak SaaS lever ka dimension: CI, CD, K8s, IaC, secrets, policy... Ab: **wahi sab ek "platform" me bando** — jo developers ko bina puchhe kaam de. Tools: **Backstage** (Spotify's open-source developer portal — software catalog + scaffolder + plugins), Azure DevOps Developer Portal, Port, Roadie, Humanitec, IaC golden templates.

Developer kya karta hai: portal → "create new microservice" → pre-approved template (repo, build, deploy, secrets, monitoring cables) → 5 min me running with observability attached.

## What You'll Learn | Aaj Ki Seekh

- [ ] Internal Developer Platform (IDP) components
- [ ] Software Catalog (entity model, descriptors)
- [ ] Scaffolder: software templates → git repo + pipeline + env
- [ ] Golden Path / paved road concept
- [ ] Backstage install + extract entity from `catalog-info.yaml`
- [ ] ArgoCD + Backstage integration (Action plugin)

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart TD
    DEV["Developer"] -->|"self-service"| PORTAL{"Developer Portal
    (Backstage / Port)"}
    PORTAL -->|"create service"| TEMPLATE["Golden Path Template
    (repo + pipeline + dockerfile + k8s yaml + monitoring)"]
    TEMPLATE -->|"run scaffolder"| GIT["Git Repo
    (your org uses code)")
    GIT -->|"push →"| CI["CI/CD (GitHub Actions/Argo)"]
    GIT -->|"backstage registers"| CATALOG["Software Catalog
    (backstage ecosystem: owners, deps, cost)"]
    CI -->|"deploy"| K8S["K8s / Azure
    (namespaces, secrets, NetworkPolicies)"]
    TEMPLATE -->|"wired"| K8S
    OBS["Observability: dashboards"] -->|"link to service"| CATALOG
```

ASCII:
```
Dev → portal → template → (repo + cicd + k8s + monitoring) → catalog → deps
Golden Path = recommended stack (approved architecture) that scales
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Backstage install (node-based)
npx @backstage/create-app@latest
cd my-backstage && yarn dev          # http://localhost:3000

# 2. Software Catalog — register your repo
# catalog-info.yaml in repo root:
cat > catalog-info.yaml << 'EOF'
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: deploytrack-api
  description: DeployTrack API backend
  annotations:
    github.com/project-slug: myorg/deploytrack-api
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: group:platform
  system: deploytrack
EOF
# Register at portal: Create → Register existing component

# 3. Scaffolder: software template (portal action)
#   (kie backstage template YAML: parameters -> steps -> output)
#   steps:
#     - fetch:template → repo created with skeleton
#     - publish:github → push
#     - github:actions? create:scaffolder jobs → trigger pipeline

# 4. ArgoCD plugin: portal shows deployments per service
#    (args: argo CD serverUrl + token; fetch App & ApplicationSets)

# 5. TechDocs (mkdocs in repo) — docs render in portal
```

## Real-Life Example | Industry Me

**Amazon demoD scale:** platform team pre-builds "Golden Path" templates: WebAPI(Node/Go), Worker, DataService — each with:
```
repo (branch protection, lint)     + pipeline (build+test+security+deploy)
dockerfile (distroless, signed)    + k8s manifests (limits, probes, RBAC)
secrets (KV policy)                + dashboards (RED metrics, trace link)
```
**Scaffolder injects** `portal-generated` metadata → catalog shows all services, owners, teammates, deps.

Dev ka answer ab "call infra team Monday" nahi → "portal se karta hoon, 4 minute".

**Team structure:** Platform Team (SRE+DEVOPS) → platform-as-a-product — devs wahi "customers". Metrics = Time-to-first-deploy, deploy frequency, MTTR — dev experience + business velocity.

## Practice Exercise | Abhi Karein

1. Backstage dev install + open portal
2. Add catalog-info.yaml to one of your git repos → register → component visible
3. Write a software template (sA `fetch:template` skeleton: README, Dockerfile, simple pipeline) → publish to a new repo
4. Add ArgoCD plugin config, see service deployments
5. Create TechDocs for your project → render docs in portal
6. Define your org's "Golden Path" — list exactly what a service includes

## Quick Notes | Yaad Rakho

```
- IDP = self-service dev platform; Backstage (Spotify) = opensource leader; Port/Roadie/Humanitec commercial
- Catalog: entity descriptors (Component/System/API/Resource) + ownership + relations
- Scaffolder: templates = parameter + steps (fetch/publish/cicd) → new service in minutes
- Golden Path = approved stack — devs don't reinvent; platform team maintains
- Plugins: ArgoCD, Grafana, Sonar, Azure, PagerDuty, docs (TechDocs), topology
- Success metrics: time-to-first-deploy, deploy freq, MTTR, "% of deploys via portal"
- Platform-as-product: treat dev team as customers, backlog driven
```

**Agla:** Cloud Cost Optimization — FinOps, Kubecost, Azure Cost Management (FinOps).