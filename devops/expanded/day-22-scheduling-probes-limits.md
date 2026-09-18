# Day 22 — Scheduling, Probes & Limits (DevClo Expanded)

## Overview | Parichay

Kal pods banana seekha — aaj control seekhte hain: **resource requests/limits**, **probes** (Readiness/Liveness) aur **scheduling** (nodeSelector, affinity, taints/tolerations). Ye sab production me pod stability aur zero-downtime deploy ka base hai. Aaj ke baad "pod Pending/OOMKilled" ka reason tum nikal paoge.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] requests vs limits (CPU/memory) — scheduler ko kaise batate hain
- [ ] QoS classes: Guaranteed, Burstable, BestEffort — kyu matter karti hai
- [ ] Eviction aur OOMKilled — Node pressure pe K8s ka decision loop
- [ ] Liveness vs Readiness probe — startup aur readiness aur unka lifecycle
- [ ] `kubectl top`, `describe pod` se limit violation analysis
- [ ] taints & tolerations — node pe kisko chalna allowed hai
- [ ] nodeSelector, node affinity, pod anti-affinity — smart scheduling
- [ ] Namespace ResourceQuota + LimitRange — multi-tenant guardrails
- [ ] Pending pods ka debug flow (scheduler events padhna)

---

## Full Topic (LEARN) | Puri Detail

### 1. requests vs limits | Budget Ka Khiladi

```
request  = kubelet scheduler ko "mujhe itna minimum chahiye" — node selection ka base
limits   = "usse zyada mat do" — enforcement (CPU throttles, memory kills)
Limit > Request = overcommit allowed
```

```yaml
resources:
  requests:
    cpu: "250m"        # 0.25 CPU core
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

**CPU me kya hota:** limit cross karo → kubelet CPU **throttle** karta hai (slow down, process alive). **Memory me kya:** limit cross karo → kernel **OOMKill** karta hai (container dies, ExitCode 137). Isliye memory limits zyada careful decide karo.

### 2. QoS Classes | K8s Ka VIP Ranking

Kernel ko memory free karni ho (node pressure) to sabse pehle BestEffort pods mara jata hai — Guaranteed last.

| QoS Class | Kab? | Kaun mara jayega |
|-----------|------|------------------|
| **Guaranteed** | request == limit (dono set) | Last — 1001 step safe |
| **Burstable** | request < limit (dono set) | Bechmechein |
| **BestEffort** | kuch bhi set nahi | Sabse pehle evict/OOM |

### 3. Eviction | Node ka Brain

Kubelet node pressure (memory/disk/filesystem) pe pods evict karke node bachata hai. Signals: `memory.available`, `nodefs.available`, `imagefs.available`. Alerts dekhne ko: `kubectl describe node` → Conditions.

### 4. Probes | Doctor Ka Checkup

- **Liveness** — "App zinda hai?" Agar fail → kubelet **restart** karta hai (poison pill). Yahan /health/live use karo.
- **Readiness** — "App traffic lane ke layak hai?" Agar fail → pod ko **Service se hata deta hai** (traffic stop, restart nahi). Yahan /ready use karo (dependencies check).
- **Startup probe** — slow boots ke liye liveness ki jagah startup probe; protect karta hai slow-start app ko premature restart se.

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 3
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 5
```

Probe endpoints ka definition: **startup = app process up hai**, **live = process responsive**, **ready = can accept traffic (DB/redis connected)**. Logs me probe fail hota dikhe — `kubectl describe`.

### 5. OOMKilled Aur Pending | Do Pregnant Problems

**OOMKilled:** `kubectl get pods` status `OOMKilled` ho ya ExitCode 137. Check: `kubectl describe pod` (Last State: Terminated, Reason: OOMKilled), `kubectl top pod` (limit ke paas memory?), app logs me heap/leak. Fix: limit tune karo + app memory bound karo (JVM `-Xmx`, Node `--max-old-space-size`).

**Pending:** Pod ban paya, node nahi mila. Read scheduler — `kubectl describe pod` → Events: "0/3 nodes are available: 1 Insufficient cpu, 1 node(s) had taint, 1 node(s) didn't match node selector". Fix accordingly: request kam karo, taint tolerate karo, selector match karo.

### 6. Taints & Tolerations | Bodyguard Rule

**Taint** node pe: "yeh pod yahan nahi chalega" (default offender). Jo pod **tolerate** karta hai wahi allowed. Classic: `node-role.kubernetes.io/control-plane:NoSchedule`, `CriticalAddonsOnly`, spot/preemptible `PreferNoSchedule`.

```bash
kubectl taint nodes node1 env=production:NoSchedule
# pod me
tolerations:
- key: "env"
  operator: "Equal"
  value: "production"
  effect: "NoSchedule"
```

### 7. Affinity | Preferences

- **nodeSelector** — simple (must match key=value)
- **nodeAffinity** — required/preferred (`preferredDuringScheduling` = koshish karo)
- **podAffinity / podAntiAffinity** — "mere saathi same node pe" vs "saathio ke saath node share mat karo" (multi-AZ spread ke liye common)

```yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      preference:
        matchExpressions:
        - key: workload
          operator: In
          values: ["batch"]
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 50
      podAffinityTerm:
        labelSelector:
          matchLabels:
            app: web
        topologyKey: kubernetes.io/hostname
```

### 8. ResourceQuota + LimitRange | Namespace Guardrails

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    pods: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: dev
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "250m"
      memory: "256Mi"
    type: Container
```

### 9. 2026 Notes | Latest Kya Hai

- **In-place pod resize (GA-ish)** — CPU/memory live update bina restart (`kubectl edit` → spec.resources). Pod resizePolicy to define M(u enable for CPU, not for memory).
- **Container resource & utilization analytics** — recommended-request suggestion, `kubectl top` improved.
- **NodeProblemDetector / DRA (Dynamic Resource Allocation)** — GPU/NIC handling ab declarative hai.
- **Cgroup v2 default** — memory accounting accurate; OOMKilled reports are reliable.
- Queue-sorting, **PodOverhead** for sandboxes (gVisor) — scheduling calculations realistic.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `kubectl top pod <pod>` | Actual live CPU/mem consumption (needs metrics-server) |
| `kubectl top node` | Node level consumption + pressure overivew |
| `kubectl describe node <node>` | Conditions: MemoryPressure/DiskPressure/Ready |
| `kubectl describe pod <pod>` | Limits, QoS class, probes, events |
| `kubectl taint nodes <node> key=value:NoSchedule` | Node pe taint lagao |
| `kubectl get events -A --sort-by=.lastTimestamp` | Recent scheduling/eviction events |
| `kubectl api-resources | grep -i quota` | ResourceQuota/limitrange check |
| `kubectl get resourcequota -n dev` | Namespace quota consumption |

---

## Practice Lab | Abhi Karein

1. Cluster: `kind create cluster` (ya pehle wala reuse). Ladies: `kubectl get nodes`
2. **Deployment with resources + probes** likho (upar wala YAML `web` with requests/limits + probes). Apply karo.
3. **QoS verify karo:** `kubectl get pod <pod> -o jsonpath='{.status.qosClass}'` → `Guaranteed` aana chahiye.
4. **Probe test:** `kubectl exec -it deploy/web -- rm /usr/share/nginx/html/health && kubectl get pods -w` — readiness fail se Service me pod excluded hoga.
5. **Liveness test:** path galat karke `kubectl set env deploy/web` nahi — deployment `livenessProbe` me /health se /bad path do → pod restart hote dekho (`Restart Count` badhega).
6. **Pending simulate:** ek pod banao jiski `cpu: 8` request ho (node pe utna nahi) → `kubectl get pod` Pending → `kubectl describe pod` me "Insufficient cpu" reason padho.
7. **OOM simulate:** pod limit `memory: 64Mi` do aur stress image chalao (`polinux/stress --vm 1 --vm-bytes 100M`) → OOMKilled dekho, restart count dekho.
8. **Taint make:** `kubectl taint nodes <control-plane> dedicated=special:NoSchedule` → normal pod Pending ho jayega → toleration add karke Running.
9. **ResourceQuota:** namespace me quota apply karo → 21st pod `quota exceeded` error de.
10. **Limit tune practice:** OOM wale pod ki limit badha kar reuse karo — app stable.
11. `kubectl top pod` se sab verify karo — numbers screenshot (portfolio).
12. Cleanup: cluster delete.

---

## Incidents / Tickets | Real Practice

### INC-603 · OOMKilled

- **Situation:** Release ke baad `search-api` pods ek-ek karke `OOMKilled` ho rahi hain; kuch restart ke baad stable, server broadly se outages. Alert: "Container OOMKilled (ExitCode 137)".
- **Investigate:** `kubectl describe pod search-api-<id>` → Last State Terminated reason OOMKilled. `kubectl top pod search-api-<id>` → memory usage limit ke paas. `kubectl logs search-api-<id> --previous` → memory allocation lines (GC/malloc).
- **Root cause:** Naye release me query results response payload me cache hogaye (memory spike), limit `512Mi` ab kaafi nahi. Requests.cpu bhi low thi to pressure window me OOM.
- **Fix:** `kubectl set resources deployment search-api --requests=cpu=250m,memory=1Gi --limits=cpu=750m,memory=1Gi` — limits app ko measured luego. App me response/JSON serialization size limit bhi fix commit kiya (code fix).

**Verify:** `kubectl rollout status deploy/search-api` → `kubectl get pods` (Running, restart stable) → `kubectl top pod` (usage within new request) → 1 hour watch.
- **Blast radius | Prevent:** Poora search surface degrade. Detect faster: Prometheus `container_memory_workingset_bytes` ratio-1 alert; OOMKilled count alert. Prevent: OOM test in staging, JVM `-Xmx` set karo, memory limit tuning bas heuristic se nahi — load test data se.

### INC-604 · Readiness Probe Failing

- **Situation:** `cart-api` on kuch pods Ready `1/1` the, kuch minutes baad `0/1` — Service intermittent 502. Restart se thik ho jata hai, phir break.
- **Investigate:** `kubectl get pods -o wide` → odd pods Ready n/1. `kubectl describe pod` → Readiness probe failed: HTTP probe failed with statuscode: 500. `curl` from inside: `kubectl exec -it cart-api-<id> -- wget -qO- http://localhost:8080/health/ready` → 500.
- **Root cause:** Readiness path `/health` (sirf process check) naya version me `/health/ready` (jo DB + Redis check karta hai) — naya endpoint DB connection pool exhaust par 500 de raha. Probe ab realistic check kar raha tha aur app actually not ready tha.
- **Fix:** DB connection pooling + redis retry code fix; provisioning box badha. Probe ko `/health/ready` par rakhna (sahi), timeout `2s → 5s` increase.
- **Verify:** `kubectl rollout restart deploy/cart-api` → `kubectl get pods` sab 1/1 → `curl` HTTP 200. Readiness hamesha Service ke traffic ki gate — `/` ya `/health` (process alive) liveness ke liye, `/health/ready` readiness ke liye.
- **Blast radius | Prevent:** Partial graceful degradation (kuch pods out). Detect faster: `Error` readiness alert, probe failure alert. Prevent: load test se probe latency measure, single-responsibility endpoints (live vs ready) ka standard.

---

## Interview Corner | Sawal-Jawab

**Q1: CrashLoopBackOff vs ImagePullBackOff me kya difference hai?**
ImagePullBackOff = image pull fail (wrong tag, private registry, tag missing) — describe Events me "Failed to pull image". CrashLoopBackOff = image mila but container startup/crash ho raha hai (exit code non-zero). Dono me `describe` + `logs --previous` bolo.

**Q2: Pods Pending kyun rahte hain?**
Scheduler ko node nahi mila — Insufficient resources (request > available), taint NoSchedule w/o toleration, nodeSelector/affinity no match, ya persistent storage (PVC not bound). `kubectl describe pod` Events me exact reason.

**Q3: Liveness aur Readiness probe ka kya role hai?**
Liveness: process zinda? fail → restart (CrashLoop lekar prevent hota hai deadlock). Readiness: traffic ready? fail → Service se pod short-circuit (partial 502 close nai hota). Isliye readiness ko dependencies bhi check karne do, liveness ko sirf responsiveness.

**Q4: QoS Guaranteed kyu matter karta hai?**
Node pressure pe kubelet BestEffort pods pehle evict karta hai, Guaranteed last (oom_kill_allocating_task). Production critical DB **Guaranteed** rakho taki eviction se bacha rahe.

**Q5: OOMKilled fix ka approach kya hai?**
Pehle detect: `describe` (Reason: OOMKilled), `top pod` (usage vs limit). Root cause nikaalo: leak (code) vs legit high memory (app growth). Phir: code fix (cache/buffer), `-Xmx`/heap bound, limits tune na ki request. OOM tab hota hai jab usage limit cross kare — request nahi.

---

## Quick Notes | Yaad Rakhna

- requests = scheduling promise; limits = enforcement (CPU throttle 🐌, memory kill 💀).
- `kubectl top` se live measurement — requests/limits bina data ke guess hai.
- QoS ranking (eviction): BestEffort → Burstable → Guaranteed. Critical = Guaranteed.
- Liveness ≠ Readiness — ek process check, dusra real readiness. Dono alag paths.
- OOM startup probes: slow-start app ko liveness premature restart se bachao.
- taints/tolerations = node-selection filters; affinity = smarter scheduling jo spread/app colocation karaye.
- ResourceQuota + LimitRange = namespace ke guardrails — multi-tenant me mandatory.

---

**Kal:** Services, Ingress, DNS aur network policies — traffic ka raasta.