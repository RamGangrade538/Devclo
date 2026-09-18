# Day 34 — DevEx + DORA Metrics (DevClo Expanded — Platform Engineering)

## Overview | Parichay

Platform bana liya — ab prove karo ki wo kaam kar raha hai. Engineers gate numbers kahe bina bhi "improvement" claim karte hain, par senior engineer **numerical evidence** deta hai. Aaj: DORA four keys — **Deployment Frequency, Lead Time for Change, MTTR, Change Failure Rate** — ka definition, calculation, aur unko GitHub / Azure DevOps se nikalo (Git provider APIs + scripts). Saath me **Developer Experience (DevEx)** — kaise measure karein (DX Core 4, SPACE framework), feedback loops (PR time, build time, env wait time, on-call burden). Metrics calculation table dekhlenge. 5-saal level: platform success ≠ "template bana diya" — success = **numbers improve hote hain**.

## What You'll Learn | Aaj Ki Seekh

- [ ] DORA four keys definition + exact formula
- [ ] Deployment Frequency measure — how via GitHub/Azure DevOps API
- [ ] Lead Time for Change measure (commit → production)
- [ ] MTTR (Mean Time to Restore) measure (recovery time)
- [ ] Change Failure Rate measure (failed deployments / total)
- [ ] DX Core 4 — quick survey, productivity signals
- [ ] Feedback loops ko practical banane (PR time, build time, env wait time, on-call burden)
- [ ] Metrics dashboard build (script-based)
- [ ] Improvement plan likhna numbers ke saath

## Full Topic (LEARN) | Puri Detail

### 1. DORA Four Keys — kya hota hai

Google se 2014 se publication — "Accelerate" (Forsgren, Humble, Kim). 2023 me FOUR keys validated.

| Key | Definition | Formula / Normalization |
|-----|------------|-------------------------|
| **Deployment Frequency** | How often does org deploy bina fail hue | deployments per day/week/month (`deployments / working days`) |
| **Lead Time for Change** | Commit to production ready | commit timestamp → deployment timestamp (git SHA → deploy) |
| **MTTR** | Time to recover from a production failure | detection time → restored (not just "fixed") |
| **Change Failure Rate (CFR)** | % of deployments that cause failures (requiring rollback/fix) | `failed deployments / total` × 100 |

**DORA targets** (Accelerate): based on 2023 survey:
- **Elite:** deploy freq daily / on-demand; lead time < 1 day; MTTR < 1 hour; CFR 0–15%
- **High:** deploy 1×week–1×month; lead time 1–7 days; MTTR < 1 day; CFR 0–15% (for high performers distinction)
- **Medium:** deploy 1×month–1×6mo; lead time 1–4 weeks; MTTR < 1 week; CFR 31–45%
- **Low performers:** worse

Note: These are relative and org-specific — don't blindly chase "elite" for a legacy monolith.

### 2. How to Measure — the pipelines

**GitHub** (assume CD deployed via Actions):

```bash
# Deployments (GitHub Actions runs that deployed)
gh api repos/{owner}/{repo}/deployments --paginate | jq 'length'

# Lead time — last N deploys: time between commit and deploy job.
# Heroku like data, but simplest: check deploy workflow's "completed_at" minus commit timestamp.
gh api repos/{owner}/{repo}/actions/runs --paginate \
  --jq '.[] | select(.workflow_name == "deploy") | [.created_at, .head_sha] | @tsv'
```

**Azure DevOps Analytics / REST:**

```bash
# REST: build definitions that have "deploy" in name
curl -u :$PAT "https://dev.azure.com/org/proj/_apis/build/definitions?api-version=6.0" | \
  jq '.value[] | select(.name | test("deploy"))'

# Get builds over last 30 days → count deployed (environments/approvals)
curl -u :$PAT "https://dev.azure.com/org/proj/_apis/build/builds?definitions=42&resultFilter=succeeded&queryOrder=finishTimeDesc&api-version=6.0"
```

**Azure DevOps Analytics (KQL-ish OData):** power query on `Builds` and environment `DeploymentRecords` — gives DF/lead-time cleanly. You can even use Power BI.

**For MTTR/CFR:** incident log + monitoring. Use `alert` timestamps vs `service restored` timestamp.

### 3. Example calculation script (Python + GitHub API)

```python
import json, datetime, urllib.request, os

TOKEN = os.environ["GH_TOKEN"]
BASE = "https://api.github.com/repos/myorg/payment-api"

def gh(path):
    req = urllib.request.Request(BASE + path)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    return json.loads(urllib.request.urlopen(req).read())

# deployments this month
deploys = gh("/deployments")
month_deploys = [d for d in deploys
                 if datetime.datetime.fromisoformat(d["created_at"].replace("Z","+00:00"))
                     > datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)]

# lead times: for each deploy, find triggering commit age
lead_times = []
for d in month_deploys:
    sha = d["sha"]
    commit = gh(f"/commits/{sha}")
    created = datetime.datetime.fromisoformat(d["created_at"].replace("Z","+00:00"))
    committed = datetime.datetime.fromisoformat(commit["commit"]["author"]["date"].replace("Z","+00:00"))
    lead_times.append((created - committed).total_seconds() / 3600)  # hours

print(f"Deploy frequency: {len(month_deploys)} / month")
print(f"Lead time median: {sorted(lead_times)[len(lead_times)//2]:.1f} hrs")
```

### 4. Deploy Frequency Graph + Table

Let me show you a **weekly table** you'd compute from CI/CD history (pedagogy):

| Week | Deploys | Failed | Commits | Lead Time (median, hrs) | MTTR (hrs) | CFR |
|------|---------|--------|---------|--------------------------|-----------|------|
| W1 | 24 | 3 | 61 | 3.2 | 5.1 | 12.5% |
| W2 | 21 | 2 | 55 | 2.8 | 2.4 | 9.5% |
| W3 | 27 | 4 | 70 | 2.5 | 10.2 | 14.8% |
| W4 | 30 | 5 | 88 | 2.1 | 4.3 | 16.7% |
| **Summary** | **102** | **14** | **274** | **2.6** | **5.5** | **13.7%** |

CFR = 14/102 = 13.7% = DORA "elite"-ish (0-15%). MTTR avg 5.5h is decent but W3 spiked 10h — investigate (below incident).

### 5. Developer Experience (DevEx) — DX Core 4 + SPACE

DevEx is **how developers feel** about doing work — measured via:

**DX Core 4** (human signals):
1. **Flow** — how often / easily enter "in the zone"? Uninterrupted focus time; low task switching.
2. **Feedback loops** — short & fast; tests, CI, env, prod alerts.
3. **Cognitive load** — low unnecessary (extraneous) load.
4. **Joy & satisfaction** — surveys (e.g., DX survey metrics).

**SPACE framework** (fater DevEx): **S**atisfaction & wellbeing, **P**erformance (outcomes), **A**ctivity (output), **C**ommunication & collaboration, **E**fficiency & flow. Covers both what work happens and how people experience it — don't optimize only throughput.

Survey example (quarterly):
```
"Kabhi mojoodah ek sprint me, ko difficult interuption hui infra/tooling ke liye?" 
  1-5 (5 = rarely)
"Tooling me kitna asaan tha sab kuch deploy karana bina wait ke?"
  ...
```

### 6. Feedback Loops — the "wait time" enemies

| Loop | What to measure | Target reduction focus |
|------|-----------------|------------------------|
| **PR time** | PR open → merged (awaiting review) | # reviewers, stale-hours; automerge for trivial; change size |
| **Build time** | push → green | parallelize CI, cache layers, skip redundant jobs |
| **Env wait time** | request env → ready | golden path templates, auto-provision, idle cleanup |
| **On-call burden** | alerts/page frequency per service | SLO tuning, noise reduction, better alerts, self-healing |

Golden path = these numbers fall → DevEx ↑ naturally → DORA improves. Platform metrics: track `% deploys via portal` (adoption), `scaffold success rate`, `template error rate`.

### 7. Where to get the data

- **Git** — commits, timestamps → lead time
- **CI/CD** — deploy jobs → deployment frequency, CFR
- **Monitoring/Alerting** — incident timestamps → MTTR, on-call burden
- **Survey** (quarterly, small — <10 min) → DX Core 4
- **CI/CD log** of deploys "marked failed/rollback" → CFR

If you have GitHub, use `gh api` (above). For Azure DevOps, add Analytics views (OData/Power BI) or simple REST calls.

### 8. 2026 Notes

- **DORA 2024/2025 reports** confirm the four keys + "AI-assisted developers" improving some metrics but not autonomy — teams adopting AI tooling see mixed lead-time gains. Keep core DevEx (flow) ware.
- **DevEx Productized**: Backstage's `search`, `TechDocs`, `Scaffolder`, catalog reduce TTFD — citations in DORA data. Platform = the real lever on DORA (200+ surveys back this).
- **DX (getdx.com)** has free "DX Core 4" survey + open-source `dora` CLI and API — for measuring lead time/MTTR; you can also build with `gh`/`az`.
- Chip-level: measure prepayment aversion — don't just compute but **act**: fix top wait-time bottlenecks (feedback loop) quarterly.

## Practice Lab | Abhi Karein

1. Apne repo (GitHub) ke liye **deploy frequency script** likho (`gh api` or Python). Run on last 30 days.
2. **Lead time** measure karo: commit→deploy (median).
3. **CFR** calculate: `failed rolls back / total deploys` %.
4. `MTTR` derive karo from your incident log (time of first alert → service restored). If no incidents, estimate from a runbook timeline.
5. **DX Core 4 mini-survey** banao (10 Q, Likert 1-5) — fake but honest data do; plot results.
6. **Feedback loops** table banao: PR merge time, build green time, env provision time — 2 improvements each.
7. Weekly summary table likho (like the table above) — promote trends.
8. `docs/dora-dashboard.md` banao with a graph (draw.io/mermaid or a simple python plot) — push.
9. Backstage plugin `dora` se check karo (if used).
10. Improvement hypothesis: "Agar PR review time 2d→4h ho, lead time kya khulega?" — estimate.

## Real Incidents | Ek "Platform" Problem

### TICKET INC-PLAT-34: "DORA numbers look bad — W3 MTTR 10 hours, CFR 17%"

- **Situation**: Weekly platform report: W3 MTTR 10.2h (spike from ~3h), CFR 16.7%. Engineering manager alarmed; "is platform failing us?" Blast radius: 3 incidents hitting prod in W3.
- **Investigate**: Pull GitHub Actions deploy log for W3. Three production incidents: (1) payment API schema migration timed out (5h restore), (2) notification worker OOM (2h), (3) auth service returned slow + rolled back (10h). Found CTI: fast feedback missing — flaky deploy gate let one release through without full canary.
- **Root cause**: (1) No canary/rollback automation per-service (rolled back manually); (2) Observability gaps — Grafana dashboard but alerts late/noisy; (3) Deployment approval was a rubber-stamp — no deploy tags/rollback log check; (4) On-call lacked runbook for payment schema migration (recovery = slow).
- **Fix**: (1) Add **canary rollout + health gate** to deploy pipeline (fail → auto rollback within 5 min); (2) On-call runbooks for the 3 critical services (document incident journey flow); (3) Alert threshold tuning: page only on SLU burn, reduce noise by 60%; (4) Deploy gate: require rollback-time test + deploy tag.
- **Verify**: W4 MTTR 4.3h, CFR down to 17%→target 10%. No incident > 2h. Runbook followed in a game-day drill.
- **Prevent**: Root cause was **feedback loop** — no "seconds-to-prod failure detection". So: keep DORA dashboard weekly, CI health auto-generated; pursue alerts to reduce to 1 page per real incident; crystallize learning into runbook audits.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q1: "DORA key kya measure karta hai — definition + formula?"**
> Deployment Frequency — how often deployed to prod. Lead Time for Change — commit to production-ready. MTTR — detect failure to fully restore. Change Failure Rate — failed deploys ÷ total deploys (%). Use git/CD timestamps, CI logs, monitoring. Metrics must be **normalized** (per working day) and automated — not manual.

**Q2: "Lead Time for Change kaise measure karenge bina CD logs?"**
> Git history + deployment record: commit SHA → deploy timestamp (from GitOps repo commit, or infra deploy pipeline runtime). Median over window (7/30 days). If no CD, tag a "deployed commit" per env (e.g., ArgoCD sync state). Lead time is from **first** commit in the batch to deployment — use allocatable lowest-SHA compromise with approximations documented.

**Q3: "DevEx Core 4 ko practical output me kaise le jate ho?"**
> 4 signals: Flow (interruptions), Feedback loops (fast, useful), Cognitive load (low), Joy (satisfaction). Quarterly small survey, track trend per team; pairs with SPACE for full view. Improvements: better deploy UX (golden path), auto-review bots, on-call load balance, docs quality. Metrics combined with DORA = evidence for platform roadmap.

**Q4: "Platefom ke liye DevEx/DORA kya kosis me aati hai?"**
> As platform product outcome: TTFD down, deploy frequency up, CFR down, MTTR down, scaling errors down, on-call burden down. Track `% services on golden path` (adoption) + `scaffolder + template health` — these are leading indicators. A falling CFR with rising DF = platform working; rising MTTR = platform reliability problem.

**Q5: "DORA vs DORA Games? Numbers me aage?"**
> DORA is measurement & direction — not a grade. Aces: don't embellish; normalize properly; baseline BEFORE change. If you don't measure DF accurately, say so. Combine: qualitative (surveys) + quantitative (CI/CD) — single survey won't tell you "bad deploy delay"; single metric won't show "morale" or "cognitive load." Continuous improvement, not optimization theater.

## Quick Notes | Yaad Rakhna

- DORA four keys: DF, LT, MTTR, CFR.
- DF: deploys/working day; LT: commit→prod; CFR: failed/total; MTTR: fail→restore.
- Measure via Git provider API (gh) + CI logs + monitor/incident.
- DX Core 4: Flow, Feedback, Cognitive load, Joy — survey quarterly.
- SPACE framework: S-P-A-C-E (satisfaction, performance, activity, communication, efficiency).
- Feedback loops: PR time, build time, env wait, on-call — attack the bottlenecks.
- Platform health = DORA trends + adoption%; evidence, not vibes.

## Next | Aage Bolte Jaana

Metrics prove ho gaye — ab **scale par deploy** karo: GitOps at scale — ArgoCD, Flux, application sets, progressive delivery (Day 35).

[Day 35 — GitOps at Scale](../expanded/day-35-gitops-at-scale.md)