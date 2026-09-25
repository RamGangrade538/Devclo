# Deep Dive: Chaos Engineering — Litmus, Chaos Mesh, GameDays, Fault Injection

> **Standalone deep dive:** Purposefully break things (in controlled scope) to build confidence. "If it survives chaos, it can survive production."

---

## 1. Chaos Engineering — Definition & The Loop

**Definition (Principles of Chaos Engineering by PFtizpatrick/Литmus):**
```
1. Define steady state (SLI/SLO metrics: p99 < 200ms, error < 1%)
2. Form a hypothesis (e.g., "killing one pod keeps p99 < 200ms")
3. Vary real-world events (faults) — kill pod, network delay, CPU hog
4. Try to disprove hypothesis by running experiment in controlled blast radius
5. Minimize blast radius — small scope, staging-first, scheduled
6. Automate continuous experiments (in CI/CD or scheduler)
```
**The output:** evidence. "Our system survives AZ loss / pod kill / db blip" — measured, not assumed.

---

## 2. Fault Types & Destructive Loads

| Fault | Tools | Real scenario it models |
|-------|-------|--------------------------|
| pod-kill / deployment delete | Litmus | random pod eviction, node drain |
| node pause / cluster restart | Litmus, ChaosMesh | AZ/availability-zone blip |
| network delay / loss / corrupt | Chaos Mesh NetworkChaos | latency to DB, packet loss |
| CPU spike / memory pressure | StressChaos (k6 also) | noisy neighbour, hot pod |
| disk IO pressure / fill | ChaosMesh IOChaos | full disk, slow storage |
| DNS failure / flake | ChaosMesh DNSChaos | DNS outage |
| clock skew | ChaosMesh ClockChaos | cert/time issues |
| cloud-level | Azure Chaos Studio (VM/VMSS/AKS targets) | region/scale incidents |

---

## 3. Litmus in Practice

```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata: { name: engine-nginx, namespace: litmus }
spec:
  engineState: active
  appinfo:
    appns: default
    applabel: app=nginx
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: FORCE
              value: "true"
            - name: CHAOS_INTERVAL
              value: "20"
            - name: TOTAL_CHAOS_DURATION
              value: "60"
```
```bash
kubectl get chaosengines,chaosresults -n litmus -w
kubectl describe chaosresult engine-nginx-pod-delete -n litmus | grep -i verdict   # PASS/FAIL
```
**ChaosResult verdict = evidence** — record in dashboards/CI.

---

## 4. Chaos Mesh — CRs You Apply

```yaml
# Network delay
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata: { name: web-latency }
spec:
  action: delay
  mode: one
  selector: { namespaces: [default], labelSelectors: { app: nginx } }
  delay: { latency: "2000ms", correlation: "100", jitter: "100ms" }
  duration: "2m"
```
```yaml
kind: StressChaos          # CPU/memory
spec:
  mode: one
  selector: { labelSelectors: { app: nginx } }
  stressors:
    cpu: { workers: 2, load: 100 }
    memory: { workers: 2, size: "500Mi" }
```
```yaml
kind: DNSChaos             # DNS poisoning/failure
spec:
  action: error
  selector: { labelSelectors: { app: nginx } }
  mode: all
  domainNamePatterns: ["*.example.com"]
  duration: "60s"
```
Everything = YAML → templated in GitOps, versioned, policy-controlled (allowed experiments list!).

---

## 5. Azure Chaos Studio — Native Targets

- Register **targets**: AKS, VM, VMSS (enabled once); run **experiments** with steps (chaos, failover, delay) + triggers (schedule) + **failover rules**.
- Managed + integrates with Azure Monitor alerts — less infra to run than self-managed.
- `az chaos` CLI exposes targets/experiments (can be driven from pipelines/gamedays).

---

## 6. GameDay Playbook (the human layer)

```
GameDay 90 min (staging first):
├─ 0-10   intro: goals, steady-state dashboards, runbooks open
├─ 10-30  chaos 1: kill DB primary — failover < 30s? app errors?
├─ 30-50  chaos 2: net-partition service-b — timeouts/retries behave?
├─ 50-70  chaos 3: CPU hog on API replica — autoscaler reacts? SLO holds?
├─ 70-100 postmortem: blameless; top findings → runbook updates + action owners
└─ 100-120 retro: schedule next; refresh resilience budget
```
**Resilience budget** = dedicated slack/issues secured before new features (like error-budget day 27). Chaos finds the "unknown unknowns"; budget funds the fix.

**Postmortem culture:** blameless, focused on systems; export action items; every runbook updated → chaos works double duty: verification + documentation.

---

## 7. Path to Production Chaos

| Level | Activity |
|-------|----------|
| 0 | Identify critical services + steady-state SLOs |
| 1 | Staging experiments (pod-delete) — learn tooling |
| 2 | Automate staging chaos in CI/schedule + record verdicts |
| 3 | Prod experiments with 1-pod/1-az blast radius, throttled hours, runbooks ready |
| 4 | Continuous + gamedays; chaos covered in release gates |

---

## 8. Interview Questions — Chaos Engineering

| Question | Strong answer |
|----------|---------------|
| "Chaos kya?" | Design experiments: hypothesis about resilience → controlled fault → evidence (SLO intact?) — builds confidence, not just outages. |
| "Blast radius?" | Scope fault narrowly (1 pod/ns/az), staging first, scheduled hours, rollback runbooks — minimize harm while testing. |
| "Steady state kya?" | Define normal (SLI: p99 latency, error rate) as the experiment's pass/fail baseline. |
| "Litmus vs ChaosMesh vs Chaos Studio?" | All k8s/azure; Litmus=experiment-def (ChaosEngine), ChaosMesh=CR set, Chaos Studio=Azure-native with alerts integration. |
| "GameDay?" | Planned human drill: hypothesis + chaos + observe + blameless postmortem + runbook updates. |
| "Automation?" | Chaos in CI/schedule via GitOps (yaml experiments), verdicts recorded, gated releases on critical paths. |
| "Kyu nahi rely on 'it worked before'?" | Untested resilience = hope; chaos makes it measured and documented. |

**Related:** [Day 40](../day-40-chaos-engineering.md) · [Observability/SLO](../topics/observability.md) · [DR](../topics/disaster-recovery-backup.md) · [Performance](../topics/performance-engineering.md)