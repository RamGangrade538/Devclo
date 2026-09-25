# Day 38: Platform Engineering — Backstage, Golden Path, Internal Developer Platform (IDP)

> Platform engineering = **developer productivity par focus** — devs ko self-service ban: infra, deploy, envs, observability ek dashboard me, bina team-bottleneck ke. Golden Path = templated "best way" stack.

## Overview | Parichay

Ab tak SaaS lever ka dimension: CI, CD, K8s, IaC, secrets, policy... Ab: **wahi sab ek "platform" me bando** — jo developers ko bina puchhe kaam de. Tools: **Backstage** (Spotify's open-source developer portal — software catalog + scaffolder + plugins), Azure DevOps Developer Portal, Port, Roadie, Humanitec, IaC golden templates.

Developer kya karta hai: portal → "create new microservice" → pre-approved template (repo, build, deploy, secrets, monitoring cables) → 5 min me running with observability attached.

### Platform engineering kyun — ticket-queue se self-service tak

Ek phase ke baad DevOps teams ban jati hain **developers ki ticket queue** — "namespace chahiye", "pipeline chahiye", "DB creds chahiye" — dono taraf frustration. **Platform engineering** iska jawab: dev team ke liye ek **self-service platform** jisse wo bina puchhe aage badhein, aur platform team use **product ki tarah** chalaaye. Trigger kab: onboarding me din lagte hain, har service ka setup alag, DevOps team bottleneck hai. Ye DevOps ka "industrialized form" hai — same goals, product-minded packaging.

Problem ke signs jinko platform solve karta hai:
- Onboarding me 3 din lagte hain (env, repo, pipeline setup)
- DevOps team ki Slack har ghante me "kaise karein" messages
- Har service ka setup alag — docs likhi bhi nahi gayi
- "Naya service kaise banega" ka answer kisi ko nahi pata

### IDP ka anatomy — teen pillare

**Internal Developer Platform** ka skeleton: 1) **Catalog** (kya hai, kiska hai — inventory + ownership), 2) **Scaffolder/templates** (naya service banana — golden path executable), 3) **Plugins/integrations** (CI/CD, K8s, dashboards, incidents — sab portal me). Ye teen alag tools ho sakte hain ya ek suite (Backstage me teeno built-in). Golden rule: **platform bhi product hai** — developers = customers, unka feedback loop chahiye. IDP koi ek CI tool nahi — wo ek layer hai jo tools ko ek unified face deta hai.

Har pillar ko 1-line define karo:
- **Catalog** → "kya kahan hai, kiska hai" — inventory + ownership
- **Scaffolder** → "naya kya banana hai" — template se repo+CD
- **Plugins** → "kaise dekhna hai" — deploy status, dashboards, incidents

### Software catalog — inventory with ownership

Repo me `catalog-info.yaml` → Backstage me **Component / System / API / Resource** entities + relations ("ye service `X` use karta hai"). Fayda: "is service ka owner kaun?" ka jawab 2 second me; deploys, on-call, dashboards sab entity se linked. Biggest gotcha: **stale catalog** isse sabse bura hai (dead entries = trust khatam) — metadata ko CI me validate karo aur ownership mandatory banao. Ye traditional CMDB ka **code-first**, GitOps-friendly modern avtar hai.

### Scaffolder — template se naya service

Template YAML ka flow: **parameters** (naam, language, owner) → **steps** (`fetch:template` skeleton render, `publish:github` naya repo + pipeline trigger, catalog register) → **output** (links). 5 minute me: repo + Dockerfile + CI + K8s manifests + monitoring wiring, sab **org standards ke saath** — koi bhi chhodi hui setting nahi. Yahi golden path ka **executable form** hai — wiki me likhi guide nahi, ek button jo sahi cheez banata hai. Maintenance: templates versioned in Git, upgrades planned + changelog.

Scaffolder template ka structure 1-line me:
```
parameters (naam, language, owner)
  -> steps: fetch skeleton + create repo + pipeline trigger + catalog register
  -> output: repo link + dashboard link + docs link
```
Yahi "scaffholding" hai — skeleton ban jaye, dev usi me business code likhe.

### Golden Path — paved road vs off-road

Golden path = org ki **recommended stack** (jaise: Node/Go API + GitHub Actions + AKS + specific dashboards). Do tareeke se enforce karo: **guardrails** (policy as code — Day 37 ka OPA/Kyverno) aur **magnetic rails** (template itna easy ki off-road ki zaroorat hi na pade). Balance ka sawal: "sab allowed" → 100 fragmented setups; "sirf ye" → innovation band. Sahi answer: **default path super easy + exceptions explicit request se**. Interview line: "golden path cognitive load kam karta hai bina escape hatches block kiye."

### Backstage ecosystem — plugins aur TechDocs

Backstage (Spotify ka open-source portal) ka fayda: **bada plugin ecosystem** (ArgoCD, Grafana, PagerDuty, Azure, SonarQube), **TechDocs** (repo me mkdocs → portal me render — docs code ke paas rehti hain), scaffolder + catalog built-in. Trade-offs: Node app, **self-host + customise** karna padta hai (SaaS alternatives: Roadie, Port, Humanitec). Kab kaunsa: catalog-first problem + open-source control chahiye → Backstage; quick start + managed → Port/Roadie. Azure DevOps ka apna portal hai, par Backstage multi-tool neutral hai — ek jagah sab dikhta hai.

Plugins jo pehle lagaoge wo high-value hain:
- **ArgoCD** — per-service deployment status in portal
- **Grafana/Prometheus** — RED dashboards linked
- **PagerDuty/incidents** — on-call + history ek jagah
- **TechDocs** — repo ke docs portal me rendered

### Platform as product — success kaise nappe

Product mindset = backlog user research se, success **metrics** se: **time-to-first-deploy** (onboarding speed), **deploy frequency**, **MTTR**, **"percent of deploys via self-service"**, aur dev satisfaction survey. Agar ye numbers nahi badh rahe to platform ka justification kamzor hai. Anti-pattern: platform team apne assumptions pe features banaye, feedback loop ke bina. Ek line jaise monitor: "agar developers abhi bhi tickets pe wait karein, to tumne tool banaya, platform nahi."

Success metrics ki checklist:
- **Time-to-first-deploy** — naye service ka 30 min andar production
- **% deploys via portal** — 80%+ self-service hona chahiye
- **Deploy frequency+MTTR** — DORA metrics saath chalao
- **Dev survey** — satisfaction, "kya rokta hai" feedback loop

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