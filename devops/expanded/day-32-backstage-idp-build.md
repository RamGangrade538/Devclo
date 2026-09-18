# Day 32 — Backstage (IDP) Build (DevClo Expanded — Platform Engineering)

## Overview | Parichay

Aaj Backstage — Spotify ka open-source developer portal — hands-on karna hai. Kal ke fundamentals (platform as product, catalog, golden path) ka concrete implementation yahan hai. Backstage ke 3 main pillars: **Software Catalog** (service inventory + ownership + relations), **Scaffolder** (golden path templates → new service in minutes), **TechDocs** (docs co-located with code, portal me render). Plugin ecosystem bahut badi — ArgoCD, Grafana, PagerDuty, Azure Pipelines, Sonar sab ek portal me. 5-saal ka difference: Backstage ko "install" nahi karna — **templates banana, policies enforce, adoption track** as product. Container ya local Node.js dono se chala sakte ho.

## What You'll Learn | Aaj Ki Seekh

- [ ] Backstage install — npx + Docker container dono
- [ ] Software Catalog entity model — Component, System, API, Resource, Domain
- [ ] catalog-info.yaml banana aur register (manual + automated)
- [ ] TechDocs — docs-as-code setup (mkdocs + Backstage)
- [ ] Scaffolder — template.yaml ka anatomy: parameters, steps, output
- [ ] Golden Path template create (Node/Go microservice skeleton)
- [ ] Plugins: ArgoCD, Grafana, Azure Pipelines add karna
- [ ] Entity relations (dependsOn, providesApis, ownedBy)
- [ ] app-config.yaml total wiring samajhna
- [ ] 2026: Backstage version, Score spec, CNOE mention

## Full Topic (LEARN) | Puri Detail

### 1. Backstage install — 3 tarika

```bash
# 1. Local Node.js (learning)
npx @backstage/create-app@latest
cd my-backstage-app && yarn dev    # http://localhost:3000

# 2. Docker (production-like)
docker pull backstage/backstage:latest
docker run -d -p 7007:7007 backstage/backstage:latest

# 3. Helm (AKS/K8s)
helm repo add backstage https://backstage.github.io/charts
helm install backstage backstage/backstage -n backstage --create-namespace
```

Config `app-config.yaml` — app metadata, auth, catalog, scaffolder, plugins:

```yaml
app:
  title: DevClo Developer Portal
  baseUrl: http://localhost:3000
auth:
  providers:
    guest: {}
catalog:
  locations:
    - type: file
      target: ./catalog-info.yaml
scaffolder:
  defaultAuthor:
    name: platform
    email: platform@devclo.com
```

### 2. Software Catalog — Entity Model

Catalog = Backstage ka **source of truth** — "kya deployed, kaun owner, kya deps."

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-api
  description: Payment processing service
  annotations:
    github.com/project-slug: myorg/payment-api
    backstage.io/techdocs-ref: dir:.
  tags: [java, payments]
  links:
    - url: https://grafana.internal/d/payment
      title: Grafana Dashboard
spec:
  type: service
  lifecycle: production
  owner: group:payments-team
  system: payments
  providesApis: [payment-api]
  dependsOn:
    - resource:payment-db
    - component:auth-service
```

| Kind | Purpose | Example |
|------|---------|---------|
| **Component** | Software unit (service/lib/site) | `payment-api` |
| **System** | Group of components | `payments` |
| **API** | Contract (OpenAPI/gRPC) | `payment-api` (OpenAPI) |
| **Resource** | Infra resource (DB, bucket) | `payment-db` (Postgres) |
| **Domain** | Business domain | `finance` |

**Register:** Portal → Create → Register existing component → URL (`https://github.com/myorg/payment-api/blob/main/catalog-info.yaml`) — ya automated GitHub discovery:

```yaml
catalog:
  locations:
    - type: github-discovery
      target: https://github.com/myorg?catalog-path=/catalog-info.yaml&branch=main
```

**Relations** auto-ban janate hain (`dependsOn`, `ownedBy`, `providesApis`, `consumesApis`). "payment-db update kar rahe ho → kya affected?" — impact graph. Blast radius visibility — senior mindset.

### 3. TechDocs — Docs as Code

```bash
# app-config.yaml
techdocs:
  builder: local
  publisher:
    type: local
```

Service repo me:
```yaml
# mkdocs.yaml
site_name: Payment API Docs
theme:
  name: material
nav:
  - Home: index.md
  - Runbook: runbook.md
```

`docs/index.md`, `docs/runbook.md` — portal me "TechDocs" tab → rendered docs. Code ke saath docs = no wiki drift.

### 4. Scaffolder — Golden Path Templates

Scaffolder = "create service" button. Template YAML: **parameters → steps (actions) → output.**

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: node-service
  title: Create Node.js Microservice
  description: Golden path for Node.js services
spec:
  owner: platform
  type: service
  parameters:
    - title: Service Details
      required: [serviceName, owner]
      properties:
        serviceName:
          type: string
          title: Service Name
          pattern: ^[a-z][a-z0-9-]+$
        owner:
          type: string
          title: Owner Team
          enum: [platform, payments, data]
    - title: Repository
      properties:
        repoOwner: { type: string, default: myorg }
        repoName:
          type: string
          default: ${{ parameters.serviceName }}
  steps:
    - id: fetch
      action: fetch:template
      input:
        url: ./skeletons/node-service
        values:
          name: ${{ parameters.serviceName }}
          owner: ${{ parameters.owner }}
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=${{ parameters.repoOwner }}&repo=${{ parameters.repoName }}
        repoVisibility: private
        topics: [golden-path]
    - id: register
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml
  output:
    links:
      - title: Open in GitHub
        url: ${{ steps['publish'].output.remoteUrl }}
```

**Skeleton** (`skeletons/node-service/`):
```
├── catalog-info.yaml     # ${{ parameters.… }} population
├── Dockerfile
├── package.json
├── README.md
├── mkdocs.yaml
├── src/index.ts
└── k8s/deployment.yaml, service.yaml
```

**Built-in actions:** `fetch:template`, `fetch:plain`, `publish:github`, `publish:gitlab`, `catalog:register`, `fs:write`, `kubernetes:create`. Custom action (TypeScript) bhi ban sakta hai — e.g., `azure:create-resource-group` — golden path ab Azure RG bhi create karega.

### 5. Plugins — Portal = "One Door"

```bash
yarn add @backstage/plugin-argocd @backstage/plugin-grafana
yarn add @backstage/plugin-azure-pipelines @backstage/plugin-techdocs-react
```

```yaml
argocd:
  baseUrl: https://argocd.internal
  username: admin
grafana:
  baseUrl: https://grafana.internal
  apiKey: $GRAFANA_API_KEY
```

Portal me Service → ArgoCD tab (deploy state), Grafana tab (dashboards) — one place to work.

### 6. 2026 Notes

- **Backstage v1.35+** — stable, scaffolder v1beta3, Kubernetes plugin GA.
- **Score spec (workload.yaml)** — human-centric workload description; platform-agnostic deploy (renders to k8s/compose); Backstage + CNOE integration.
- **CNOE (CNCF)** — open reference platform; Backstage ke with Score; plugin ecosystem yahan grow ho raha.
- TechDocs mature; `techdocs-cli` local preview; mkdocs-material default.

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Purpose |
|---------|---------|
| `npx @backstage/create-app@latest` | Create Backstage app (first time) |
| `yarn dev` | Start dev server — http://localhost:3000 |
| `yarn new --select template` | Scaffold a plugin/template |
| `yarn stage` (container) | Production-style build |
| `docker run -d -p 7007:7007 backstage/backstage:latest` | Container run |
| `yarn add @backstage/plugin-grafana` | Add plugin |
| `yarn scaffolder` / UI "Create" | Run a golden path template |
| `techdocs-cli serve` | Preview TechDocs locally |
| `yarn tsc` / `yarn lint` | Type-check + lint |
| `yarn backstage-cli repo lint` | Validate catalog/entity YAML |

## Practice Lab | Abhi Karein

1. `npx @backstage/create-app@latest` chalao — portal `http://localhost:3000` open karo.
2. `app-config.yaml` me catalog discovery (or local file) enable karo.
3. **3 catalog-info.yaml** likho — 3 services (kis service ke liye wo); Component + System + Resource register karo.
4. Relations verify karo — "dependsOn", "ownedBy" clickable graph.
5. **MkDocs**: ek repo me `mkdocs.yaml` + `docs/` — TechDocs tab me render.
6. **Scaffolder skeleton** banao (`skeletons/node-service/`) + `template.yaml`; portal me test karo.
7. Template se naya service create — repo banaya? CI trigger? catalog register?
8. **Plugin install**: `@backstage/plugin-grafana` add; dashboard link entity me; verify.
9. Catalog "Owner" / "Tag" filters try karo; relations graph explore karo.
10. Template validation test — invalid `serviceName` pattern reject ho? `owner` enum?
11. Apna setup dokument karo `docs/backstage-setup.md` (screenshots + commands) — push.
12. Bonus: ArgoCD plugin + `argocd` annotation in catalog-info.yaml — deploy status in portal.

## Real Incidents | Ek "Platform" Problem

### TICKET INC-PLAT-32: "Scaffolder template broken — service create nahi ho raha"

- **Situation**: Dev ne `node-service` template select kiya, Create dabaya — error: "Failed to publish to GitHub: repository already exists." Template 2 hafte pehle chal raha tha.
- **Investigate**: Backstage logs (`yarn dev`): `publish:github` failed — 422 Unprocessable Entity. GitHub: repo name collision. `repoName` default `${{ parameters.serviceName }}` — team ne existing `myorg/payment-v2` diya. Template me repo existence check nahi tha.
- **Root cause**: Template validation weak — `repoName` pattern missing, `repoExists` check nahi; scaffolder blindly publish attempt; scaffolder error message dev ke liye unclear.
- **Fix**: (1) `repoName` pattern `^[a-z][a-z0-9-]+$`; (2) pre-check step (`github:repoExists`) ya `publish:github` input handling; (3) explicit error message: "Repository already exists — check catalog first."
- **Verify**: Fresh create success; duplicate run pe graceful error + guidance. Smoke-test har template quarterly.
- **Prevent**: Template validation rules mandatory (pattern, enum); template CI test (create + delete) scheduled; template health dashboard (success/error rate tracked). Templates = code, versioned, bug-fixed.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q1: "catalog-info.yaml ka purpose kya?"**
> Backstage Software Catalog ka **declarative registration file** — service ka metadata (name, owner, tags, annotations, relations) code me, Git me versioned, PR-reviewed. Portal auto-discovers. "Who owns payment-api?" → instant answer; no Slack archaeology. Catalog = source of truth for software inventory.

**Q2: "Scaffolder vs manual repo creation?"**
> Scaffolder = opinionated, repeatable, governed — parameters → steps (fetch template → publish repo → register catalog). Consistent output (Dockerfile, CI, monitoring) har baar. Manual = ad hoc, tribal knowledge, drift. Template bhi code hai (PR-reviwed, versioned) — not a wiki page. Adoption = measurable TTFD drop.

**Q3: "Golden path template me kya hona chahiye?"**
> Repo (branch protection, CODEOWNERS), CI/CD (lint, test, security scan, deploy), Dockerfile (distroless, non-root), K8s manifests (limits, probes, RBAC), secrets (ESO/Key Vault), monitoring (Grafana link, alerts), TechDocs, catalog-info.yaml (ownership), cost tags. Golden path = "everything a service needs"; exceptions = review.

**Q4: "Backstage plugins kaise kaam karte hain?"**
> UI components + backend APIs; `yarn add @backstage/plugin-*` + app-config configure. Service detail page tabs = plugin data (ArgoCD deploy state, Grafana dashboards, Azure Pipelines builds). Custom plugins bhi — internal tools ke liye. Ek portal = one door to entire infra.

**Q5: "TechDocs kyu use karein, alag docs site kyu nahi?"**
> Docs co-located with code (`mkdocs.yaml` + `docs/`) — PR me update = synced; no stale Confluence. Portal me renders. Versioned with code, owned by service team. Con: needs mkdocs (container solves); Pro: no drift, discoverable.

## Quick Notes | Yaad Rakhna

- Install: `npx @backstage/create-app@latest` ya Docker ya Helm — 3 tarike.
- Catalog = source of truth: Component/System/API/Resource/Domain, Git-versioned.
- catalog-info.yaml = declarative registration; annotations = plugin data.
- Scaffolder = Golden Path: parameters → steps → service in minutes.
- Actions: `fetch:template`, `publish:github`, `catalog:register`; custom actions possible.
- TechDocs = docs-as-code (mkdocs + Backstage tab) — no wiki drift.
- Plugins: ArgoCD, Grafana, Azure Pipelines — portal = one door.
- 2026: Backstage v1.35+, Score spec, CNOE — platform-agnostic.

## Next | Aage Bolte Jaana

Portal ready — ab golden path ko **IaC se enforce** karo: Terraform modules + policy checks + environment promotion (Day 33).

[Day 33 — Self-Service IaC + Golden Path](../expanded/day-33-self-service-iac-golden-path.md)