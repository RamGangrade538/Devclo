# Day 27 — Full AKS Troubleshooting Day (DevClo Expanded)

## Overview | Parichay

Aaj koi naya topic nahi — aaj jo seekha hai usko **investigative flow** se test karte ho. Problem koi bhi ho: pehle **layer isolate karo** (node/cluster/app/network/config), phir real commands se dig karo, phir fix, verify, prevent. Tickets har layer ke hain: **Node NotReady**, **ConfigMap stale**, **Rollout stuck** — plus ek "5 hidden issues" challenge. Guess nahi, data se solve karo.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Node health: `kubectl describe node`, Conditions, kubelet, disk pressure
- [ ] Node NotReady debug chain — kubelet -> journalctl -> disk -> containerd
- [ ] App crash chain: CrashLoopBackOff / ImagePullBackOff / OOM / Pending — ek saath, varied
- [ ] ConfigMap/Secret staleness — env caching, `rollout restart` refresh
- [ ] Rollout stuck — `rollout status`, strategy fields (maxUnavailable/maxSurge), readiness gates
- [ ] Incident mindset: alert → isolate layer → root cause → fix → verify → prevent
- [ ] Full 5-issue "broken cluster" drill

---

## Full Topic (LEARN) | Puri Detail

### 1. The Investigation Funnel | Pehle Layer Do

Har incident pe ek systematic order hai — upar se niche:

```
1. Scope  — kaun affected? saare users / ek service / ek node / ek pod?
2. Layer  — cluster? (control plane), node? (kubelet/CNI), app? (container), config? (CM/secret), network? (service/ingress)
3. Data   — exact commands chalao (get → describe → logs → top → syslog)
4. Root cause — ek asli cause, not the symptom
5. Fix    — smallest change that works
6. Verify — curl/logs/metrics cross-check
7. Prevent— alert, monitor, automation, docs
```

Golden rule: **events aur logs ko guess se pehle padho**. Har bug ka signature hota hai.

### 2. Node Troubleshooting | Node Layer

`kubectl get nodes` state: `Ready`, `NotReady`, `Unknown`. NotReady = kubelet lost/issue ya node unhealthy.

```bash
kubectl describe node aks-np1-2
#    Conditions:  Ready=False, Reason=KubeletNotReady
#                 MemoryPressure=True, DiskPressure=True
kubectl get nodes -o wide
# Node ka public/agent IP, kubelet version
```

**Node NotReady debug chain (order:):**

1. `kubectl get nodes` → identify NotReady node
2. `kubectl describe node <node>` → Conditions section (no "Ready True")
3. SSH/jump to node (or Azure serial console): `journalctl -u kubelet -n 200 --no-pager` + `-f`
4. Kubelet logs: "image pull fail" / "failed to mount volume" / "disk pressure"
5. Check disk: `df -h`, `inode: df -i` (inodes full is classic!), `mount | grep ...`
6. containerd: `systemctl status containerd`, `ctr -n k8s.io version`, logs `journalctl -u containerd`
7. Network/CNI: `systemctl status network`, `ip addr`, check `/var/log/azure` CNI logs
8. If node is up but kubelet dead: `systemctl start kubelet`, then watch.

Or call `kubectl drain <node> --ignore-daemonsets` before fixing if needed.

**Disk pressure (common 2026):** logs/images/containers fill disk → Eviction + NotReady. check `df -h /var/lib/containerd`. Cleanup images: `kubectl delete pod ...` is not enough — remove unused images `ctr images rm`, or node rotate. `--system-reserved` tuning.

### 3. Control Plane Layer | AKS Managed

AKS control plane is managed — you can't kubectl into it. Health checks:
```bash
kubectl get componentstatuses   # (legacy, apiserver still shows)
kubectl get nodes               # hmm control plane uses api-server
kubectl get events -A --sort-by=.lastTimestamp
az aks show -g rg -n aks --query "provisioningState,powerState"
az aks get-credentials --overwrite-existing
```
Symptom: `kubectl` timeout / "Unable to connect to the server" → api-server/dns/RBAC issue, or kubeconfig stale, or backend cluster azure. For self-managed: etcd backups, scheduler, controller-manager logs.

### 4. App Layer — Full Chain | With Debug Flows

**CrashLoopBackOff:** describe → exit code + reason; logs `--previous`.
**ImagePullBackOff:** describe → Failed to pull image (auth/not found); secret existence, registry.
**OOM:** describe → OOMKilled reason; top; requests/limits tuning.
**Pending:** describe → scheduler events: insufficient resources / taints / node selector / PVC.

Also probe failures: describe → readiness/liveness probe failed; check probe path and app under load.

### 5. Config Layer — ConfigMap/Secret Staleness | The Sneaky One

ConfigMap/Secret updates **do NOT** auto-apply to running pods:

- **env: values** — baked into pod at creation; config change doesn't propagate (except some external secrets-store mount refresh).
- **volumeMounts: files** — ConfigMap updates eventually sync to file mount (kubelet periodic ~1min), but **app doesn't re-read** (env cache / in-memory config). Java app loads on boot.
- Fix pattern: `kubectl rollout restart deployment <dep>` → new pods pick fresh CM/Secret. For env from ConfigMap, always restart is the refresh mechanism.

```bash
kubectl rollout restart deployment config-app
kubectl rollout status deployment config-app
kubectl get pods -l app=config-app
```

Watch out: CM changed but image/environment stale → confusing bugs (dev changed CM, pod still old). **Verify: `kubectl exec -it <pod> -- env | grep KEY`** (current state) ally.

### 6. Rollout Stuck | Deployment Not Progressing

`kubectl rollout status deployment <d>` stuck (never "successfully rolled out"). Reasons:
- **maxUnavailable: 0 + maxSurge: 1** — new RS created but pods Pending (no capacity / quota) or readiness failing → old replica sets intact, new not coming.
- **PVC not bound** → new pods Pending → rollout stuck forever.
- **Readiness failing** on new image (probe) → new pods never Ready → surge can't complete.
- **ImagePullBackOff** → new pods keep crash/failing → complete false.

Debug:
```bash
kubectl rollout status deployment web   # observe "waiting for rollout to finish"
kubectl rollout history deployment web  # versions + revisions
kubectl get rs -l app=web               # new rs replicas created ? 0 ready
kubectl describe rs <new-rs>            # logs why new pods failing
kubectl rollout undo deployment web --to-revision=<old>   # rollback fast
```

### 7. 2026 Notes | Latest Kya Hai

- **`kubectl events`** command GA (better than `get events`), `--field-selector`.
- **`kubectl debug`** — ephemeral containers to debug running pods (pod's `kubectl debug -it <pod> --image=busybox`), no SSH.
- **Structured kubelet logs** — `journalctl -u kubelet` grep oriented.
- **Kubernetes 1.30+** — PodRetention, `SidecarContainers` GA (affect rollout logs).
- **Azure Monitor / KQL correlate** node+kubelet errors; Container Insights live view.
- **Auto-remediation** policies/service health for AKS Node NotReady (azure policies can deploy a kicker).

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `kubectl get nodes -o wide` | Node states + IPs |
| `kubectl describe node <n>` | Conditions + allocatable + pressure |
| `kubectl get events -A --sort-by=.lastTimestamp` | Recent cluster events |
| `journalctl -u kubelet -n 200 --no-pager` | Kubelet logs (node me) |
| `df -h && df -i` | Disk + inode full check |
| `kubectl logs <pod> --previous` | Last crashed container logs |
| `kubectl describe pod <p> -o yaml` | Full spec + events |
| `kubectl get rs -l app=<a>` | ReplicaSets for rollout diff |
| `kubectl rollout status/undo/history` | Deployment progress control |
| `kubectl debug -it <pod> --image=busybox` | Ephemeral debug container |
| `kubectl rollout restart deployment <d>` | Config refresh trigger |

---

## Practice Lab | Abhi Karein

1. **Cluster + deployment:** kind/AKS, deploy `web` (nginx, replicas 3) with readiness path `/health` (add: nginx config serving /health 200) + liveness `/live`.
2. **Issue 1 (probe):** deploy v2 with bad image that stops /health → rollout stuck. Debug: `kubectl rollout status`, `get rs`, `describe rs` → fix (`rollout undo`).
3. **Issue 2 (oom):** deploy with `memory: 128Mi` + heavy payload container → OOMKilled. Debug + fix (limits tune).
4. **Issue 3 (imagepull):** image `nginx:fake-tag-xyz` → ImagePullBackOff. Describe events → fix tag.
5. **Issue 4 (config stale):** ConfigMap value env change → observe pod still old env; `kubectl exec ... env`; `rollout restart` → new shows updated.
6. **Issue 5 (node-ish in kind):** `kubectl cordon <control-plane-node>` + delete a daemonset → pod unschedulable (Pending) — observe + uncordon.
7. **Full chain drill from scratch:** clear pods, `kubectl get pods` show some wrong states — go through funnel for each (describe+logs+events), document root cause.
8. **`kubectl debug` practice:** ephemeral container into running nginx pod, `curl` localhost probe.
9. **Prepare a postmortem:** for one issue write "What / Why / How fixed / What prevents".
10. **Cleanup.** — Portfolio: 5 issues + postmortem screenshots.

---

## Incidents / Tickets | Real Practice

### INC-611 · Node NotReady

- **Situation:** 3 AM — some `payments-api` requests 502. `kubectl get nodes` → `aks-np1-2` is `NotReady`. Other nodes fine. This node runs many pods. Users on that node experiencing errors.
- **Investigate (full flow):**
```bash
kubectl get nodes -o wide                # NotReady confirmed, internal IP noted
kubectl describe node aks-np1-2          # Conditions:
#   Ready=False, Reason=KubeletNotReady, pressure?
#   MemoryPressure / DiskPressure flags → critical hint
kubectl get nodes aks-np1-2 -o jsonpath='{.status.conditions[?(@.type=="DiskPressure")].status}'
# SSH (or azure serial console / Bastion):
journalctl -u kubelet -n 300 --no-pager | grep -i error | tail -30
df -h && df -i                           # disk/inode check
systemctl status containerd --no-pager   # runtime healthy?
journalctl -u containerd -n 100 | grep -i error
```
- **Root cause:** `/var/lib/containerd` disk full — node log + container images ke karan 100% full. Kubelet "eviction manager" sees DiskPressure → marks node NotReady. Actual: 2 weeks' debug pods with log collections accumulated + unused old images. (Inodes also 97% — many tiny files from containers.)
- **Fix (smallest first):**
```bash
# 1. Free immediate space
# prune unused images (via crictl on node)
crictl rmi --prune          # or: ctr -n k8s.io images rm <unused>
journalctl --vacuum-size=200M
# 2. Drain node for proper cleanup + let pods reschedule
kubectl drain aks-np1-2 --ignore-daemonsets
kubectl cordon aks-np1-2
# 3. remove old logs (on node)
rm -rf /var/log/containers/*old-* 2>/dev/null || true
# 4. uncordon
kubectl uncordon aks-np1-2
kubectl get nodes                     # back to Ready
```
- **Verify:** `kubectl get nodes` reaching Ready; `kubectl get pods -o wide | grep np1-2` — pods Scheduling back; `df -h` from node <70%; app errors cleared. Optional: node pool auto-repair policy.
- **Blast radius | Prevent:** All pods on that node suffered → about 1/3 capacity; user impact possible for any app replicated across only that node. Detect faster: `Kubernetes_node_status_NotReady` alert (severity high), disk pressure alert (Azure Monitor machine metric). Prevent: node pool autoscale; log rotation/cleanup policy; image GC config; `--eviction-hard` cycling; capacity headroom; disk alert on node.

### INC-612 · ConfigMap Stale

- **Situation:** Feature flag in ConfigMap (`FEATURE_X=true`) changed in config file, redeployed new YAML (apply) but running app still shows `FEATURE_X=false`. Version deploy okay.
- **Investigate:**
```bash
kubectl get configmap app-config -o yaml        # CM has FEATURE_X: "true"
kubectl get deploy config-app -o yaml | grep -A6 envFrom
kubectl exec -it $(kubectl get pods -l app=config-app -o jsonpath='{.items[0].metadata.name}') -- env | grep FEATURE
# → FEATURE_X=false — pod still old
kubectl get pods -l app=config-app              # creationTimestamp old (pod started before CM change)
kubectl rollout status deploy config-app        # shows "successfully rolled out" (old config applied)
```
- **Root cause:** ConfigMap change doesn't recreate pods; **env values are baked into the pod at start time**. No action triggered by CM update → running pods keep stale env. (Volume-mounted consumers sync eventually, but env-var consumers never refresh on their own.)
- **Fix:** trigger a rollout that re-reads config:
```bash
kubectl rollout restart deployment config-app
kubectl rollout status deployment config-app
kubectl exec -it $(kubectl get pods -l app=config-app -o jsonpath='{.items[0].metadata.name}') -- env | grep FEATURE   # now true
```
(Optionally annotate strategy: `kubectl -n <ns> annotate deploy config-app configmap.app-config.hash=<hash>` so changes always trigger restart — hashes pattern.)
- **Verify:** `env | grep FEATURE` → true; app behavior uses new flag; `kubectl get pods` new creationTimestamp; no downtime if replicas >1 rolling.
- **Blast radius | Prevent:** Feature flag changes validated manually everywhere — if multiple services, every one stale = inconsistent behavior (some true, some false). Detect faster: annotate deployment with config hash (restart on mismatch auto-in CI); golden: config updated → pipeline emits rollout restart. Prevent: never pure-env config for mutable flags; reload-on-change pattern (`signal/supervisor`), or Secrets Store/Config sync tooling; document "config changed = rollout restart required".

### INC-613 · Rollout Stuck

- **Situation:** `kubectl rollout status deployment web` — hangs: "Waiting for deployment spec update to be observed..." / replicas unavailable. Old version working, new v2 not coming up. Users see old version okay, but no update.
- **Investigate (ordered):**
```bash
kubectl rollout status deployment web          # observe stuck
kubectl rollout history deployment web          # revisions present
kubectl get rs -l app=web -o wide               # TWO rs: old(ready 3) + new(desc 0, unexplored)
kubectl describe rs <new-rs>                    # new pods failing reason
kubectl get pods -l app=web -o wide             # new pods status (CrashLoopBackOff / Pending?) or none
kubectl describe pod <new-pod>                  # events: probes failing? image pull? pvc?
kubectl get deployment web -o yaml | grep -A10 strategy
```
- **Root cause:** New image v2 readiness probe path `/healthz` returns 500 (code didn't wire the new probe route) → new pods never Ready → `maxUnavailable: 0` means old RS untouched, new RS cannot complete (each Surge pod dies on probe). Combined with `maxSurge: 25%`: old 3 still 3, rolling can't proceed = perfectly stuck.
- **Fix (two options):**
```bash
# Fast: rollback to known-good
kubectl rollout undo deployment web --to-revision=1
kubectl rollout status deployment web          # success → then fix code
# Alternatively fix image (if ready to ship) → new apply pushes rollout forward
kubectl set image deployment web web=v2fix:1.0.1   # correct image
```
- **Verify:** `kubectl rollout status deployment web` → "successfully rolled out"; `kubectl get rs` new updated, old scaled to 0; `kubectl get pods` 3/3 Ready; endpoints updated. Health payload: `kubectl get ep web`.
- **Blast radius | Prevent:** No new traffic on new version (users unaffected but change stuck — an operationally blind spot: automation may pause). Detect faster: heartbeat alert on rollout stuck (`rollout status` timeout), readiness failure alert, ArgoCD/health gate. Prevent: always have valid readiness/liveness for new image tested in CI (pre-prod canary), set `maxSurge` and `maxUnavailable` consciously, enable `progressDeadlineSeconds` (default 600s → marks failed rollouts as FailReason).

---

## Interview Corner | Sawal-Jawab

**Q1: Node NotReady hone par debug process kya?**
Order: `kubectl get/describe node` (Conditions — KubeletNotReady reason), node access → `journalctl -u kubelet`, disk check `df -h / df -i`, containerd status; drain/node cleanup; uncordon. Common: kubelet down (service), disk/inode pressure, CNI fail, resource busy. Always start from Conditions section.

**Q2: ConfigMap change karke pod refresh kyu nahi hoti? Or env var update issue?**
ConfigMap env are injected pod-start; ConfigMap/Secret update doesn't recreate pods. Volume-mounted files sync (eventually), but processes that cache config (most apps/JVMs) don't re-read. Fix: `kubectl rollout restart deployment` (or annotation hash). Golden rule: config change → remember to rollout.

**Q3: Rollout stuck status dekhkar kya scenes possible?**
New RS pods Pending (no capacity/quota/PVC), CrashLoopBackOff/ImagePullBackOff (image broken), readiness failing (probes), or maxSurge=0/maxUnavailable=0 with no rollout capacity. Check `get rs -l app`, `describe new-rs`, `rollout undo` if stuck.

**Q4: kubectl describe me kaunse fields batch ruled out?**
Conditions (Ready/ContainersReady), Events (sabse last — image pull result, probe results, scheduling), Restart Count (crash frequency), Image (wrong tag suspicion), Node (stuck on one node?). Combined with `logs --previous` (crash reason) and `top` (resource).

**Q5: Incident me blast radius kaise estimate karte ho?**
Identify what failed (node/app/network), who depends (users/services on replicas per node: if 3 replicas spread 1/node → node loss = 33%); check health of dependent services, metrics (latency, error rate, saturation), and config in Pods. Then share impact to stakeholders while fixing.

---

## Quick Notes | Yaad Rakhna

- Pehla step hamesha: alert → identifier via `get` → layer isolation → then commands.
- Node problems read Conditions: NotReady reason = KubeletNotReady → disk/inode pressure kubelet kharab.
- ConfigMap/Secret refresh = `kubectl rollout restart` — env values kabhi auto-refresh nahi hoti.
- Rollout stuck = debug new ReplicaSet with `describe`; `undo` is your rollback friend.
- `kubectl debug -it` = ephemeral container — no need to SSH/release into pod.
- `journalctl -u kubelet / containerd` sabse trusted node-level logs.
- Har fix ke baad verify karo + document prevent step (alert/rollback/automation). That's seniority.

---

**Kal:** Phase 5 — poori end-to-end project (DeployTrack): infra + AKS deploy + CI/CD from push-to-main tak.