# Deep Dive: Platform Engineering & IDPs — Backstage, Golden Paths, Developer Portals

> **Standalone deep dive:** Platform = product for developers: self-service, repeatable, Golden Path templates → faster time-to-first-deploy, less tribal knowledge.

---

## 1. What Platform Engineering Solves

**Pain:** developers waste hours on ambient setup (registry account, CI secrets, namespace, monitoring, deploy pipeline) — tribal knowledge + tickets.
**OPPOSITE:** an **Internal Developer Platform (IDP)** self-services all that:
- Create service → pre-approved template (repo + CI + secrets + k8s + dashboards) → 5 min
- Interface: UI portal (Backstage/Port) OR grader CI (`scaffolder`) — both fine
**Same discipline as product work:** platform team builds for "customers" (devs), with SLOs + roadmap.

---

## 2. Components of an IDP

```
┌───────────────────────────────────────────────────────────────┐
│  Developer Portal (Backstage / Port / Roadie)                 │
│   - Software Catalog: 'what runs what, who owns, deps, cost'  │
│   - Scaffolder: templates → new services                      │
│   - TechDocs: docs render                                    │
│   - Plugins: ArgoCD, Grafana, Datadog, Sonar, Azure, PagerDuty│
├───────────────────────────────────────────────────────────────┤
│  Backing Platform: Git/GitOps · CI/CD · Cloud accounts ·      │
│      K8s (ArgoCD) · Secrets · Monitoring · Policies           │
└───────────────────────────────────────────────────────────────┘
```

- **Software Catalog** = entity model registry (Component/System/API/Resource; owner; lifecycle; relations). Query: "my service's owner", "what services call X".
- **Scaffolder** = template engine: parameters (form) → steps (fetch template, create repo, trigger CI, register catalog) → service ready.

---

## 3. Backstage Quick Hands-On

```bash
npx @backstage/create-app@latest
cd my-backstage && yarn dev     # http://localhost:3000
```
**Register a component** — put in your repo root:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: deploytrack-api
  description: DeployTrack API service
  annotations:
    github.com/project-slug: myorg/deploytrack-api
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: group:platform
  system: deploytrack
  dependsOn: ['resource:deploytrack-db']
```
→ Portal: **Create → Register existing component** → points at `catalog-info.yaml` → catalog populated.

**Scaffolder template** (`templates/*/template.yaml`):
```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata: { name: golang-service, title: "Go API service" }
spec:
  owner: platform
  type: service
  parameters:
    - title: Details
      properties:
        name: { type: string, title: Service name }
        owner: { type: string, title: Owner, enum: [platform, payments] }
  steps:
    - id: fetch
      action: fetch:template
      input:
        url: ./skeletons/golang
        values: { name: ${{ parameters.name }} }
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=myorg&repo=deploytrack-${{ parameters.name }}
        repoVisibility: private
    - id: register
      action: catalog:register
      input: { repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }} }
  output:
    links:
      - title: Open in GitHub
        url: ${{ steps['publish'].output.remoteUrl }}
```
**Plugins**: ArgoCD (see service deployments), Grafana (dashboards), Sonar, Azure Pipelines, Jira, TechDocs, DORA metrics. That's the "one door" to the whole system.

---

## 4. "Golden Path" — the Template Library

Golden Path = **approved, default stack** for a type of service:
```
Go API microservice Golden Path contains:
  - repo (branch protection, codeowners)
  - CI (lint, test, security: trivy/gitleaks, sign, SBOM)   Day 34/48
  - Dockerfile (distroless) + k8s manifests (limits, probes, RBAC)
  - secrets (ESO→KV), policy tags (Kyverno allowlist)      Day 35/37
  - observability wiring (dashboards, trace propagation)   Day 24-27
  - deployment method (ArgoCD app, headers for canary)     Day 32
```
Templates are **code** — versioned, reviewed; teams may contribute "flavor" variants. Anything outside Golden Path = exception w/ justification.

---

## 5. Metrics That Matter

| Metric | Meaning |
|--------|---------|
| Time to first deploy (TTFD) | portal template vs manual setup |
| Deploy frequency | same CD cadence across services |
| Change failure rate | portal-consistent pipelines lower it |
| MTTR | + runbooks/TechDocs |
| % services via portal | adoption |
| Golden-path drift | exceptions rising = platform debt |

---

## 6. Real-World: Learnings

- **Platform team = product:** backlog of dev pain; Slack channel; weekly office hours; measure usage.
- **Don't overbuild:** start with catalog + 2-3 Golden Paths; expand as adoption grows.
- **GitOps integrates:** ArgoCD/Flux App-of-Apps = the deploy "feature" of IDP. Backstage plugin surfaces rollout state.
- **Compute/cloud embedded:** a template can pre-provision an Azure resource group + AKS namespace via terraform in CI (Day 42).
- **Self-service ≠ no governance:** templates bake policies (allowlist registry, standard labels) — platform is the enforcer.

---

## 7. Interview Questions — Platform Engineering

| Question | Strong answer |
|----------|---------------|
| "IDP kya?" | Internal developer platform: self-service UI/mesh of everything a dev needs (create-repo→deploy→monitor), backed by GitOps/automation. |
| "Backstage kya?" | Spotify's open-source developer portal: software catalog + scaffolder (templates) + TechDocs + plugin ecosystem. |
| "Golden Path?" | Approved, templated stack (repo+CI+deploy+secrets+observability) for a service type — faster, consistent, governed. |
| "Scaffolder steps?" | Template → fetch (skeleton) → publish (create repo) → trigger CI/register catalog → link outputs. |
| "Catalog kyu?" | Single source of truth: ownership, deps, cost, lifecycle — replaces "who owns service X?" questions. |
| "Platform team role?" | Build & maintain templates/tools like a product; measure (TTFD, DORA); fix dev pain; not "IT helpdesk". |
| "IDP vs plain CI?" | CI/CD is a piece; IDP wraps repo/bootstrap/secrets/monitoring/deploy into one self-service workflow with governance baked in. |
| "Adoption laane?" | Start with 2 golden paths, public docs, office hours, measure usage; low friction > perfection. |

**Related:** [Day 38](../day-38-platform-engineering-backstage.md) · [GitOps](../topics/gitops-argocd.md) · [CI/CD Deep Dive](../topics/cicd-explained.md) · [Observability](../topics/observability.md)