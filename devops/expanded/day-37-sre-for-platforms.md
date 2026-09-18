# Day 37 — SRE for Platforms (DevClo Expanded — Platform Engineering)

## Overview | Parichay
Ab tumhare paas fleet hai (Day 36), lekin "kitna reliable?" — ye tum nahi bol sakte jab tak SLO define nahi kiya. Platform/SRE ka dil hai: **SLI → SLO → error budget → burn-rate alerting**, aur jab budget khatam ho jaye to "freeze ya ship" ka data-driven decision. Ye day tumhe incident management lifecycle (detection se postmortem tak) aur on-call operational maturity bhi degi — woh skills jinko interviews me "5-saal ka SRE" bolte hain.

## What You'll Learn | Aaj Ki Seekh
- [ ] SLI vs SLO vs error budget ka farak + availability legend (9s)
- [ ] Error budget math: 99.9% = 43.2 min/month, 99.99% = 4.32 min/month
- [ ] Service-level objectives (availability/latency/success) define karna
- [ ] Burn-rate alerting approach (windowed, multi-window) — PromQL slos
- [ ] SLO for platform services: CI uptime, deploy success rate, portal latency
- [ ] Index: incident lifecycle — detection, triage, mitigation, resolution, blameless postmortem, action items
- [ ] On-call: rotations, severity definitions, escalation, status pages
- [ ] Playbook/runbook template + severity (SEV1-4) calibration
- [ ] Error-budget-exhausted decision: freeze vs ship (risk-based)
- [ ] Grace-period reconstruction during incident (SLO window math)

## Full Topic (LEARN) | Puri Detail

### 1. SLI, SLO, Error Budget — Langage ka Bhed
- **SLI (Service Level Indicator):** ek measurable, clients-view ("kitna % requests fast/ok"). Examples: `availability = good / valid`, `latency p95 ≤ 300ms`, `deploy success = passed/prod attempts`.
- **SLO (Service Level Objective):** target par SLI, e.g. `availability ≥ 99.9%` (ab final goal), `p95 latency ≤ 300ms` 90% of days.
- **Error budget:** `100% - SLO` window of tolerable failure. **Budget = dev license**, not company-party stat — SREs bhi kaam karte hain is budget ke andar chhote-incremental risk (canary, experiment) ke saath.

**Availability legend (quick math):**

| Availability | Unavailability/day | Unavailability/month (30d) | Year |
|--------------|-------------------|----------------------------|------|
| 99% (2 nines) | 14.4 min | 7.2 hr | 3.65 d |
| 99.5% | 7.2 min | 3.6 hr | 1.83 d |
| 99.9% (3 nines) | 1.44 min | **43.2 min** | 8.77 hr |
| 99.95% | 43.2 s | 21.6 min | 4.38 hr |
| 99.99% (4 nines) | 8.64 s | **4.32 min** | 52.6 min |
| 99.999% (5 nines) | 0.86 s | 25.9 s | 5.26 min |

**Formula:**
- Bad window / min basis: `error-budget = 1 - SLO`, consumed per incident = `(SLO_target * elapsed_time_minutes) ... monthly budget`.
- Example 99.9%: 1 month budget-evaluated at 43.2 min; 60 min downtime = `60/43.2 = 139%` budget burned → `error budget consumed: >=100%`.

**Open questions seni cheap to ask:** (a) Apunka SLO rolling window hai ya calendar-month? (b) Latency SLI histogram buckets barabar calibrated hain? (c) SLI me "good" definition auth kya hai (e.g. 5xx only vs 4xx exceptions, timeouts included)? In 10 min me 90% senior interview divergence isi pe hota hai.

### 2. Burn-Rate Alerting (The SRE Gold)
Simple rule "alert sim abhi fail" = too late. Standard SLO alert approach:
- **Multi-window, multi-burn** — short window catches fast burn, long window catches slow burn:
  - `fast_burn` (1h window, budget rate > 14.4x → fire max), 
  - `slow_burn` (6h/1d window, budget rate > 3x / 1x warnings).

**Window/threshold cheat (99.9% SLO):**

| Window | Burn rate | Meaning |
|--------|-----------|---------|
| 1h | 14.35x | ~14.35h budget in 1h — total outage class |
| 1h | 6x (page) | ~ 5 min of 100% errors |
| 6h | 3x (page) | ~ 2h of 100% errors — sustained degradation |
| 1d | 1x (warning) | budget burning at exact SLO pace |
- **PromQL burn-rate pattern** (availability 99.9%, 60min window):
  ```promql
  # fast burn: 99.9% / 60min => burn rate threshold 14.4 (SLO 99.9%, 60min => rate = 1/0.069)
  (
    sum(rate(http_request_duration_seconds_count{job="api",status=~"5.."}[1h]))
    /
    sum(rate(http_request_duration_seconds_count{job="api"}[1h]))
  ) > (1 - 0.999) * 14.4 * 0.001
  # slow burn 6h: threshold 2.4, etc.
  ```
  aur SLO library rule `multiwindow-multiburn-ratios` case read karo (Google SRE workbook / sloth format).
- `sloth`/`sloth SLI` tooling: generate alerts/rules YAML from SLI config — dashboard + alerts ek saath.
- Status-page tie-in: burn state → page; "page when budget rate crosses threshold" beats "monitor one metric".
- **Key:** alerts fired tab incident me hote hain jab budget burn rate crossing hota hai, not just monolithic "module down".

### 3. Slo for the Platform Itself
Platform services tatway ke SLO targets (bridge example for reference):
| Platform component | SLI | Health target (start) | Note |
|--------------------|-----|------------------------|------|
| CI pipeline uptime | successful run / triggered run | ≥ 99.5% | breakage budget high — CI down blocks dev |
| Deploy success rate | prod deploys pass / attempts | ≥ 99.7% (rollback OK) | differentiate "deploy logic" vs app bug |
| GitOps sync | commits synced / committed | ≥ 99.9% | sync-slack high → drift risk |
| Backstage/portal | portal page 200 (p95 latency) | availability ≥ 99.9%, p95 < 1s | developer happiness proxy |
| Registry (ACR/artifactory) | pull success/pull attempts p95 latency | ≥ 99.9% | pull-blocker blocks deploys |
| Cost API/cost refresh | budget query success / attempt | ≥ 99.5% | cost data turns managers "on-call-ish" |

**SLO noodle-do (platform internals):** Main component target: fail threshold + apnea don't page main app SLO — platform SLOs alag window, independent team. Example: CI burn on 30d window, dedup alerts — a 3-day broken CI ≠ 30d budget breach, but 4+ consecutive failures → own SEV3.

Tick for platform: SLOs dono **user-facing apps** and **platform itself** — CI/portal/registry dete delay degrades team throughput even if Prod is "fine".

### 4. Error Budget Decision (Freeze vs Ship)
Budget exhausted (`>100%`):
- **Freeze** only **risky** changes; bugfixes/emergency patches **never** freeze; benign deploy policy "safe config only".
- Communication: SLO breach + budget % up on status page; release gating — code sets both.
- Rebuild path: budget refill — either new month counting window (windowed SLO) or incident review + burn budget policy.
- **Memory hook:** freeze budget ≠ "stop deploys"; it means "stop risky deploys" — release of hotfix/critical security patch still on.

### 5. Incident Management Lifecycle (full loop)
1. **Detection:** alert / user report / SLO burn. Triage queue + P1 escalation immediate.
2. **Triage:** SEV classification + data collection (affected components, blast radius links, status page update, Commander assigned).
3. **Mitigation:** first goal = **restore service**, not "fix root cause". Rollback/scale/feature-flag/traffic-shed. Investigate in parallel.
4. **Resolution:** verify restored (SLO recovery, health checks, synthetic probes); decide if "mitigated" vs "resolved".
5. **Blameless Postmortem (24-72h):** What-did-happen + **why** (contributing factors, not "kiski galti"), **action items** with owners + SLO-linked deadline, share via status page internal.
6. **Follow-up:** action items tracked, alerts tuned, runbook updated, **budget impact** noted.

**Sample incident timeline (senior flavor):** `03:12 Alert P1 → 03:15 triage: SEV1 (API 5xx 60%) → 03:18 status page posted → 03:33 rollback to v1.4 (mitigation) → 03:45 egress unblocked → 04:10 SLO metric healthy → 05:00 blameless postmortem session booked → Thu: action items (2 owners)`. Note: mitigation done < 30 min; root-cause investigation continues after restore.

**Severity definitions (standard SRE):**
| SEV | Meaning | Response | Example |
|-----|---------|----------|---------|
| SEV1 | Total outage, revenue/hard | `< 5` min page, P1 incident | prod API down |
| SEV2 | Major degraded, partial | `< 30` min page | p95 2s+, rollout stuck |
| SEV3 | Minor (degraded sek, no customer) | business hours | QA env fail |
| SEV4 | Triage in next few days | non-urgent ticket | UI cosmetic bug |

### 6. On-Call + Status Pages
- **Rotation:** primary + secondary, primary = pager, secondary = first backup; schedule and on-call load (avoidalerts per shift), roadmap "on-call pay/credit" policy company-wise.
- **Playbook/runbook:** per service — "kyu alert", "investigation first 5 commands", "mitigation actions", "escalation contact". Generate from incidents (postmortem → runbook).
- **Status page (statuspage/pagerduty):** always communicate during incident; components degrade based on threshold; postmortem later on it, 3-2-1-trust format *(maintaining healthy comms beats silence — users prefer status updates over dumb wait)*.
- Example runbook sentinel: `severe-runbook-short`: (1) 5 sec diagnosis commands, (2) mitigation list 3 options, (3) who to call.
- **On-call UX metrics:** alert rate per rotation (reduce noise), time-to-ack, time-to-mitigate; alert fatigue annelaati — if primary gets > 3 pages/shift, tune.
- **Escalation ladder:** SEV matrix defines call-tree (primary → secondary → manager → director); timers enforced; ownership handoff documented in incident channel.

### 2026 Notes
SLO ecosystem ab **standard**: sloth/locust stable, Grafana **SLO app** (multi-window burn built-in), Prometheus **sloth multiwindow-multiburn** default exemplar. Burn budget windowed SLOs increasingly standard; around `.09- .99` tracking remains manual. Tools: FireHydrant/Blameless incidental tools; statuspage APIs mature. Focus: **budget-driven release cal** and **CI/CD SLO gating** ka relation — "release gating" can auto-pause risky deploys on budget.

## Cheat-Sheet | Yaad Rakhna Commands

| Command/Query | Kaam |
|---------------|------|
| `sum(rate(http_requests_total{status=~"5.."}[1h])) / (1 - 0.999)` | raw error ratio |
| `(1 - 0.999) * 14.4` | fast-burn alert constant |
| `histogram_quantile(0.99, sum(rate(api_duration_seconds_bucket[5m])) by (le))` | p99 latency |
| `sum(rate(http_requests_total{job="api",code=~"5.."}[6h]))` | slowburn error window |
| `sloth generate -l yaml` | SLO config → Prom rules + dashboard |
| `date -d "-43 min"` | budget window trauma math |
| `kubectl get events -A --sort-by=.lastTimestamp` | incident detection aid |
| `promtool check rules alerts-rules.yaml` | alert rules lint |
| `curl -I https://status.example/api/v1/incidents` | status page API check |
| `firehydrant incidents get <id>` (or pagerduty) | incident ticket states |
| `curl -X POST http://localhost:9093/api/v2/alerts -d @alert.json` | simulate alertmanager alert |

## Practice Lab | Abhi Karein
8-10 steps using local prometheus + demo app (`prometheus-demo` / `pyroscope` example):
1. Demo API deploy (kind) + scrape config set (valid job name `api`).
2. SLI: define availability SLI in `sloth.yml` (target 99.9, burn thresholds) → `sloth generate` → output rules + alerts.
3. `promtool check rules` pass karo.
4. Presence reload ke baad: `kubectl apply` (scrape 5m) — verify Prom rules active: `curl .../api/v1/rules`.
5. Load generate karo (loopa 500s) + `curl .../v1/query --data-urlencode 'query=sum(rate(...[5m]))'`.
6. Fast-burn alert fire hone do (`alertmanager` webhook) — `kubectl get alerts`, screenshot.
7. SLO staleness: `kubectl scale deploy api --replicas=0` → burn-rate 5m + 1h windows react → record "budget burned %" math.
8. Postmortem kar lo (template: timeline, SLE data, action items with tweaks) as reference — lead to Day 37 ticket.
9. Own **platform SLO doc**: 1 component (CI uptime) — SI target, alert burn, owner.
10. Grafana/SLO app me multi-window panel lagao — fast-burn + slow-burn dono visible; screencap final.
11. Practice explain: 99.9% math ko 30 sec me bina calculator — availability legend from memory.
Expected outputs: rules loaded, alert fired at burn window, "budget burned" percentages you can explain in 30 seconds, 1-page SLO doc done.

## Real Incidents | Ek "Platform" Problem

### PLAT-037 · Error Budget Almost Exhausted — Ship or Freeze?
- **Situation:** Monday 11:00; quarterly 99.9% error budget at **94% consumed** (3 incidents within 2 weeks). Team aaj koi new canary release karna chahti hai (Core feature). Alert: `slo_budget_remaining:ratio` at 0.06. Release reviewer prudently pumped brakes.
- **Investigate:**
  ```promql
  sum(rate(http_requests_total{job="api",status=~"5.."}[30d])) /
  sum(rate(http_requests_total{job="api"}[30d]))
  # budget ratio
  slo:error_budget:ratio{sl=~".+"}
  # burn rate last 2 incidents:
  sum(rate(http_requests_total{job="api",status=~"5.."}[7d]))
  ```
- **Root cause:** Primary availability incident diya — DB connection pool exhaustion during a scheduled load-test (day + peak). Secondary latency incident — degraded network in region (3rd-party). Total burn: 2 incidents ≈ 5h-6h actually logged — budget math shows **94%+ of 43.2m remaining = only ~2.6m left**.
- **Fix decision:** (1) **Freeze this week** — no new features, flag-gate new canary OFF at origin (safe). (2) Hotfix DB pool exhaustion (config bump + connection pooling tune), allow emergency patch. (3) Set **release gating**: `if budget ratio < 0.05 on prod pipeline, block risky deploys auto`.
- **Verify:** `slo:error_budget:ratio` rise as incidents age out (7x budget rebuild); new window 1st of month → budget fresh; CI gate shows "budget OK" before each deploy.
- **Postmortem output (what we wrote):** timeline + contributors + 3 action items (1. pool-circuit breaker, 2. planned-load calendar overrun, 3. budget-gate policy) with owners/due dates, published to platform status page internal.
- **Prevent:** Multi-window burn alerts (fast+slow) so incidents are caught < week; monthly **budget review meeting** with product ("here's your release spend"); testing planned-load during known low-traffic window, not peak.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q: 99.9% SLO = monthly how many minutes downtime?**
A: 30 days × 1440 min = 43,200 min × (1 - 0.999) = **43.2 min/month** (99.99% → 4.32 min). Math is window-bound; yearly = 8.77 hr.

**Q: Burn rate kya hota hai?**
A: Rate of wasting budget relative to normal wear-and-tear. 1x = budget eats at expected SLO pace; burn > N means budget consumed faster — e.g. 14.4x for 60min window = 14.4 min of error in 1h vs SLO-budgeted 60s. Multi-window alert src fires if it persists.

**Q: Error budget exhausted — ship or freeze?**
A: Rule-based: **freeze risky** (new features/canaries) but never freeze bugfixes/hotfixes/security. Decision backed by data (budget ratio + burn + incident review), not by vibes; document on status page; budget refill window = windowed SLO (monthly/quarterly).

**Q: SLOs for platform services (CI/portal) — why or why not?**
A: Absolutely yes — platform is a **product**: CI uptime SLO (69x burn for "no-runs"), deploy success SLO (distinguish pipeline bug vs app bug), portal p95 latency (dev-throughput proxy). They protect **developer velocity**, same–well-managed available path.

**Q: Blameless postmortem — what does that actually mean?**
A: Focus on **contributing factors** (systems/process/direct root causes chain) — name of nearest trigger not a person-name "villain". Purpose = system improvement; interviews might align "who made the call" but never "who to fire". Action items + owners + due dates tracked.

## Quick Notes | Yaad Rakhna
- SLI = indicator, SLO = target/threshold, error budget = leftover risk allowance
- 99.9% = 43.2 min/month; latency SLOs need percentiles, not averages
- Burn-rate alert (fast+slow windows) >> basic "alert on failure" — ke alaawa budget tracking hi SRE art
- Incident loop: detect → triage → mitigate (restore first!) → resolve → **blameless postmortem → action items**
- Freeze policy: risky only; hotfixes and bug fixes always can ship
- Every platform component (CI, portal, registry, deploys) deserves its own SLO
- Documentation + runbooks + status page comms = the "soft" 50% of on-call success
- On-call UX: fewer, clearer pages > many noisy alerts; measure time-to-ack/MTTR

## Next | Aage Bolte Jaana
Day 38 me wahi details: telemetry system — **OpenTelemetry + Prometheus/Grafana deep** — taaki SLIs actually measure ki ja saken:
→ `day-38-observability-opentelemetry.md`