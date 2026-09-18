# Day 31 — Platform Engineering Fundamentals (DevClo Expanded — Platform Engineering)

## Overview | Parichay

Aaj se Phase 6 shuru — DevOps se **Platform Engineer** banna. Ab tak tumne CI/CD, K8s, Terraform, monitoring sikha — wo sab ek engineer ke tools the. Aaj ka sawaal: *"Ye saara infrastructure developers ke liye kitna accessible hai?"* Platform engineering ka kaam hai **"software delivery ke common parts ko ek self-service product me wrap karna"** — taaki developers infra ke tickets me phase na rahein. 5-saal wala engineer sakhti paida karta hai, 7-10 saal wala **developer experience (DevEx)** banata hai aur usse measure karta hai. Aaj ka chuna: paved road vs golden path, IDP vs CI/CD, platform-as-a-product mindset, cognitive load (CUP), CNCF maturity model, Team Topologies, aur internal cloud/showback concepts. Ye notions interview me "senior" tone aise deta hai.

## What You'll Learn | Aaj Ki Seekh

- [ ] "Paved road" vs "golden path" vs "guardrails" ka concept aur difference
- [ ] IDP (Internal Developer Platform) components aur CI/CD se uska difference
- [ ] Platform-as-a-Product mindset — developers = customers, backlog driven
- [ ] Cognitive Load (CUP) — intrinsic / extraneous / germane load kya hota hai
- [ ] CNCF Platform Engineering maturity model ke stages
- [ ] Team Topologies — stream-aligned, platform, enabling, complicated-subsystem teams
- [ ] Internal cloud / portal / backing platform ka hierarchy
- [ ] Showback vs Chargeback cost models
- [ ] "Developer persona + frustrations + platform scope" 1-pager banana

## Full Topic (LEARN) | Puri Detail

### 1. Kya problem solve hoti hai?

Developer ko naya service lana hai to 2020 me kya karta tha — repo chahiye, CI chahiye, cloud account/namespace chahiye, secrets chahiye, DNS chahiye, monitoring cable chahiye. Har cheez ka alag ticket, alag owner, alag Slack thread. Result: **tribal knowledge** (jo 2 log jaante hain) + **wait time** (kisi aur ke time par depend). Platform engineering isi "middle" ko productitize karta hai — repeated cheezein templates, APIs, aur UIs me bando.

> 5-saal test: "Time-to-first-deploy (TTFD) kitna hai?" Platform wala engineer isko number me bata pata hai aur usse reduce karta hai.

### 2. Paved Road vs Golden Path vs Guardrails

Ye 3 terms aksar galat interchangeably use hote hain:

| Term | Matlab | Example |
|------|--------|---------|
| **Paved Road** | Documented, supported, "nasa terrain" — ispe chalne wala supported hai | Ek standard deploy path with runbooks |
| **Golden Path** | Recommended/approved template stack — templated (Scaffolder / Terraform module) | `create-service` template = repo + CI + Helm + dashboard |
| **Guardrails** | Constraints/enforcement — path se bahar = blocked ya flagged | Policy: registry allowlist, namespace quotas, tag requirements |

Kaam ka tarika: **paved road banao (default), golden path me template karo (repeatable), guardrails se enforce karo (governed)**. Developers ko "freedom of choice" nahi chahiye — wo chahte hain *safe defaults*. Platform jo 100 options de de wo fail hota hai — famous line: **"A platform with too many options is not a platform, it's a menu."**

### 3. IDP vs CI/CD — confused kyu hote hain

CI/CD = delivery ka ek **step** (pipeline). IDP = poora **system** jo developer ko repo-create se deploy/monitor tak le jata hai.

```
Plain setup:
  Dev → ticket → "cloud team" → env ready → then CI/CD pipeline

IDP setup:
  Dev → Portal (Backstage/Port) → select template → scaffolder runs
        → repo created + CI wired + k8s namespace + secrets + monitoring
        → CI/CD is plumbing, not hero
```

CI/CD tool sirf ek actor hai IDP ke andar. IDP ke components: **portal (control plane), software catalog (inventory), templates/scaffolder (golden path), GitOps (config delivery), policy/guardrails, secrets, observability wiring**. Backstage/Port/Roadie = portal surface; ArgoCD/Flux = config delivery; Terraform modules = provisioning. IDP in sabko ek interface me dikhata hai.

### 4. Platform as a Product

Platform team ka mindset **product manager** jaisa:
- **Consumers = developers** — unka kaam aasaan karna hai
- **API-first/UI-first** — platform kaam ko interface ke piche chipkata hai
- **Backlog driven**: dev pain → feature → ship → measure adoption
- **SLOs for platform services**: portal latency, scaffold success rate, CI availability, deploy success rate
- **Office hours + docs + feedback channels** — platform customer support bhi karta hai
- **Adoption metrics**: % deploys via portal, TTFD, golden-path drift (exceptions = platform debt)

Platform ka KPI = product teams ki velocity + stability. Platform jo bantaa hai wo internal product hai.

### 5. Cognitive Load (CUP — Cognitive Load Per User)

Developer ke dimaag me limit hoti hai. Har config, har "gotcha" load hai. 3 types (Sweller):

- **Intrinsic** — kaam ke liye zaruri (business logic). Platform isse reduce nahi kar sakta.
- **Extraneous** — unnecessary jaise "CLI me 5 flags + service account + region code yaad rakhna". **Platform ka kaam ise 0 karna** — removable load.
- **Germane** — learning/improvement (mere patterns seekhna).

CUP metric = **avg cognitive load per developer**. Platform jitna tools scatter karta hai, CUP utna badhta hai — so **thin waist**: standardized interfaces kam (e.g., `scaffolder`, `kubectl`), granular config hidden. Simplicity = feature, shortcut nahi.

### 6. CNCF Platform Engineering Maturity Model

CNCF ke white papers ne maturity model diya:

1. **Reactive / Manual** — ticket-based, no templating
2. **Standardized** — golden paths start, pre-approved templates, some self-service
3. **Self-service** — developers bina ticket kaam karte hain; catalog + scaffolder; large adoption
4. **Platform as a product** — dedicated team + budget + SLOs + backlog; adoption measured
5. **Autonomous / federated** — platform intelligent: recommendations, cost optimization, autonomous remediation

Most orgs 0-2 me hain. Senior engineer maturity gap pehchanta hai — "hum Stage 2 hain, 3 tak jane ke liye catalog + templates chahiye." Yehi observation interview me kaam deta hai.

### 7. Team Topologies (Matthew Skelton)

| Team type | Kaam | Example |
|-----------|------|---------|
| **Stream-aligned** | Full ownership of a business service | Payment team |
| **Platform** | Internal platform/support capabilities for other teams | IDP, cloud platform |
| **Enabling** | Skill-up/coaching consults | DevOps enablement |
| **Complicated-subsystem** | Highly specialized domain | Payments engine, ML |

Principles: platform team **enabled by stream-aligned** needs; platform success = stream teams success. Interaction modes: collaboration, X-as-a-Service, facilitating. Senior engineer platform ko **team scaffold** samajhta hai, sirf software nahi.

### 8. Internal Cloud / Showback / Chargeback

"Internal cloud" = virtual control plane jo internal consumers ko on-demand infra/API deta hai with usage tracking. Cost me 2 models:

- **Showback** — usage report, no money booking — informational, adoption-friendly
- **Chargeback** — team budget se real (money/credits) — accountability, thoda friction

Internal cloud + metadata tags (`team`, `env`, `product`) = **unit economics** — cost per deploy, per user. Day 39 (FinOps) isko pura kholega.

**Hierarchy — "portals jo UI hai, platform jo engine hai":**

```
┌─────────────────────────────────────────────────────────────┐
│ Developer Portal (UI) — Backstage / Port / Roadie            │
│   catalog · scaffolder · docs · dashboards · cost view      │
├─────────────────────────────────────────────────────────────┤
│ Control Plane (IDP layer) — workflows, revenue, approvals,  │
│   policy, API/CLI, golden paths (templates)                 │
├─────────────────────────────────────────────────────────────┤
│ Backing Platform (inner) — CI/CD · GitOps (ArgoCD/Flux)     │
│   · IaC (Terraform modules) · secrets · observability ·     │
│   cloud (Azure) · clusters (K8s)                            │
└─────────────────────────────────────────────────────────────┘
```

Portal sirf surface hai — "one door"; asli platform = idp layer + backing platform. Isilie "backstage install kiya = platform ban gaya" galat hai.

**Platform anti-patterns (senior bullet-proofing):**

- **Tool sprawl** — har team apna tool asaan samajhti hai → 5 CI tools, 3 registries: platform nahi, chaos.
- **Rewrite-only** — purana monolith ignore karke naye "platform" pe sab migrate — blast radius + adoption nahi.
- **Template graveyard** — templates banakar bhúlna; 1 year me obsolete → "golden path" bhi toxic.
- **Portals without platform** — UI bana diya par CI/CD kum asaan — dev khud infra console kholta hai.
- **No metrics** — "improvement" ke bina numbers; platform ghar dusro ke kaam ki tarah kabhi approve nahi hota.

Anti-pattern se bachne ka rule: **platform ka role "friction remove" hai, "feature add" nahi.**

### 9. 2026 Notes

- **CNOE** (CNCF) — open reference spec for platform engineering; Backstage + Score spec integration.
- **Score spec / workload.yaml** — human-centric workload description; platform-agnostic deploy; avoids k8s-proprietary lock-in for IDP.
- Backstage stable ~v1.4x; scaffolder v2 mature; catalog/DIR standard.
- GitOps operators (ArgoCD v3, Flux 2.x) = config delivery surface — Day 35.
- Team platform adoption trends: many orgs adopting "platform as product" with dedicated teams + FinOps culture.

### 10. GitOps / IaC se link

Platform engineer **target state coding** karta hai: Terraform modules (infra golden path) + GitOps (ArgoCD app delivery) + policy guardrails. Kal se — Backstage me hands-on.

## Practice Lab | Abhi Karein

1. Apne (ya imagined) org ke liye **1-pager "Developer Persona"** likho — developer kaun, time-waster kya (top 3).
2. **Frustration → solution map**: har frustration khanche "platform feature" hai (scaffolder, catalog, cost dashboard, runbook).
3. Apna **platform scope** define karo — included (repo/CI/k8s/observability/secrets) vs out-of-scope (business logic).
4. Platform ka **definition of done (4 KPIs)** likho — TTFD, deploy frequency, adoption %, % self-service.
5. **Paved-road diagram** banao (mermaid/ASCII) — dev → portal → template → gitops → cluster → monitoring.
6. Team Topologies apply karo: platform team kaun, stream-aligned team kaun; enablement plan likho.
7. **Gya pan-ki-test**: "IDP vs CI/CD" aur "paved road vs golden path" — apne words me 2-min explain (record karo, suno).
8. 1-pager ko `docs/platform-strategy.md` ke roop me GitHub pe push karo (portfolio).

## Real Incidents | Ek "Platform" Problem

### TICKET INC-PLAT-31: "Developer ko ek VM lene ka ticket 4 din lag raha hai"

- **Situation**: Naya feature team sprint me infra chahiye: dev namespace + Postgres + CI secrets. Process: 4 alag tickets, 3 teams, TTFD ~4 din. Team lead ne escalation kiya.
- **Investigate**: Flow trace kiya — repo ticket (repo team), cloud infra (cloud team), namespace+RBAC (k8s team), secrets (security team). Har stop me queue wait + context switch. Koi catalog/template nahi — "kisne kya puraana banaya" pata hi nahi.
- **Root cause**: **No paved road** — har request ad hoc, sequential, handoff-heavy; platform visibility zero (tribal knowledge).
- **Fix**: (1) `service-template` (Scaffolder + Terraform module combo) banao — repo + namespace + RBAC + secrets + Postgres ek `create` me; (2) catalog me registration enforce karo; (3) TTFD KPI weekly dashboard pe. Temporary: single-ticket + priority lane.
- **Verify**: Naya service template se; TTFD 4 din → ~30 min (healthcheck endpoint up, catalog registered). 2 hafte me 3 teams adoption.
- **Prevent**: Ticket-based requests rule hi band — self-service enforce; external tickets routed to template. Har service catalog me registered. Weekly TTFD report.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q1: "Platform engineer, DevOps aur SRE me kya difference?"**
> DevOps = culture + pipeline (dev+ops ek delivery loop). SRE = reliability approach — availability budget, software to run software. **Platform engineer = developer productivity** — ek self-service internal product (IDP) banao jo DevOps/SRE capabilities ko developers tak measurable taur par pahunchaye. Yaani: DevOps philosophy, SRE reliability, Platform = productization.

**Q2: "Paved road concept samjhao."**
> Paved road = supported, documented, consistent "default" way — ispe chalne par tum supported ho (runbooks, owners). Golden path = templeted version (repeatable). Guardrails = enforcement (policy). Milakar: paved road banao (default), golden template me karo, guardrails se enforce karo. Extra options = menu, not platform.

**Q3: "IDP ke core components kya?"**
> Developer portal (UI), software catalog (inventory + owners), templates/scaffolder (self-service create), config delivery (GitOps), policy/guardrails, secrets management, observability wiring. CI/CD is just one building block. IDP ek "system" hai, koi single tool nahi.

**Q4: "Cognitive load (CUP) itna important kyu?"**
> Developer ka mental model limited hai; har extra flag/step extraneous load hai jo errors aur friction badhata hai. Platform ka primary job extraneous load hatana hai — thin waist interfaces, templating, automations. Measure: onboarding time, ticket volume, on-call burden, survey feedback.

**Q5: "Showback vs chargeback?"**
> Showback = usage reports to teams (informational, adoption-friendly). Chargeback = real money/credits booked (accountability, can add friction). Mature path: showback pehle adoption lao, chargeback baad me accountability. Dono ke liye good metadata (team/env/product tags) zaruri — nahi to numbers bekaar.

## Quick Notes | Yaad Rakhna

- Paved road (supported) + Golden path (template) + Guardrails (policy/enforcement) = trinity.
- IDP = portal + catalog + templates + GitOps + policy + secrets + observability; CI/CD is a part.
- Platform-as-a-product: devs = customers; backlog + SLOs + adoption metrics.
- Cognitive load (CUP): extraneous load reduce = #1 platform goal; thin waist.
- CNCF maturity: manual → standardized → self-service → product → autonomous.
- Team Topologies: stream-aligned + platform + enabling + complicated-subsystem.
- Showback pehle, chargeback baad; tags (team/env/product) mandatory.

## Next | Aage Bolte Jaana

Concepts clear — ab inhe **Backstage** me karo: install, catalog entities, scaffolder template, TechDocs (Day 32).

[Day 32 — Backstage (IDP) Build](../expanded/day-32-backstage-idp-build.md)