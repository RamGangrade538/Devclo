# Day 21 — Kubernetes Fundamentals + kubectl (DevClo Expanded)

## Overview | Parichay

Yahan se Phase 4 shuru hota hai — asli production-grade kaam. Aaj tum Kubernetes ki **architecture**, core objects (Pod/Deployment/ReplicaSet/Service/Namespace) aur **kubectl** ka pura command arsenal seekhoge. Ye din tumhare AKS journey ka foundation hai — isko solid kiya to baki 6 din easy hain.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Control plane vs worker node components — har component ka kaam (api-server, etcd, scheduler, controller-manager, kubelet, kube-proxy, CRI)
- [ ] Pod kya hai — smallest unit, restart policy, multi-container pods
- [ ] ReplicaSet vs Deployment — dono ka relationship aur rolling updates
- [ ] Service object kyu zaroori (stable IP + DNS) aur Namespace isolation
- [ ] kubectl core commands: `get`, `describe`, `logs`, `events`, `port-forward`, `exec`, `apply`, `delete`
- [ ] `kubectl describe pod` Events section padhna — asli troubleshooting skill
- [ ] Workload types: Deployment vs StatefulSet vs DaemonSet vs Job/CronJob — kab kya use karein
- [ ] 2026 features: Gateway API (GA), sidecar containers, in-place pod resize, Karpenter/NAP

---

## Full Topic (LEARN) | Puri Detail

### 1. Why Kubernetes | Kyun K8s

Containers are perfect for shipping — but production me scaling, failover, rolling updates, service discovery, storage, security sab manually impossible hai. Kubernetes is the **control plane of containers**: declare desired state → K8s continuously reconciles reality to match it. Ye "reconcile loop" hi K8s ki superpower hai.

### 2. Architecture | Design

```
┌─────────────────────────── Control Plane ───────────────────────────┐
│  API Server (front door, authN/authZ, REST)                         │
│  Scheduler (kis node pe pod chalega)                                │
│  kube-controller-manager (reconcile loops: deployments, rs, ...)    │
│  etcd (sab kuch ka source of truth, key-value store)                │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
            kubelet ←────────────┘
┌────────────── Worker Node ──────────────┐
│  kubelet  (container runtime se baat)   │
│  kube-proxy (iptables/IPVS, service IP) │
│  CRI         (containerd) → Pods        │
└─────────────────────────────────────────┘
```

| Component | Layer | Kaam |
|-----------|-------|------|
| **api-server** | Control | Sab commands ka gatekeeper; auth, validation, etcd me state store |
| **etcd** | Control | Cluster ka memory (key-value DB). Sirf api-server isse baat karta hai |
| **scheduler** | Control | Naya pod dekh ke best-fit node chunta hai (resources, affinity, taints) |
| **controller-manager** | Control | Reconcile loop: desired vs actual state match karta hai |
| **kubelet** | Node | Har node ka agent; pods ko container runtime ko deta hai, health report karta hai |
| **kube-proxy** | Node | Service IP → pod IP routing (iptables/IPVS rules) |
| **CRI (containerd)** | Node | Actually containers run karta hai (Docker ab CRI-sser replaced) |

### 3. Core Objects | Basic Cheezein

**Pod** = smallest schedulable unit = 1 ya zyada containers sharing network + storage. Pod is mortal — tum directly pod nahi banate production me.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web        # ← services isse select karti hai
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
```

**ReplicaSet** = desired number of pod replicas maintain karta hai. **Deployment** = ReplicaSet + rolling updates + rollback. Hamesha Deployment use karo, kabhi directly RS nahi.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
```

**Service** = pods ko stable cluster-wide DNS + IP deta hai (pods jaate-marte rehte hain, Service constant). **Namespace** = cluster ko logical pockets me divide (dev/qa/prod).

### 4. kubectl — Apna Sabse Bada Hathiyaar

```bash
kubectl get nodes                    # cluster healthy?
kubectl get pods -A                  # saare namespace
kubectl get pods -n dev -o wide      # IP + node ke saath
kubectl get deploy,rs,svc,po         # multiple types ek saath
kubectl describe pod web-8f7dc-2xyz  # events = troubleshooting ka gold
kubectl logs -f web-8f7dc-2xyz --tail=100
kubectl logs web-8f7dc-2xyz --previous   # crash hone se pehle wala log!
kubectl exec -it web-8f7dc-2xyz -- bash
kubectl port-forward pod/web-8f7dc-2xyz 8080:80   # local access
kubectl get events --sort-by=.lastTimestamp      # cluster-level events
kubectl apply -f manifest.yaml      # declarative deploy
kubectl delete -f manifest.yaml
kubectl rollout status deploy/web   # update progress
```

**Golden rule (troubleshooting):** `get` → `describe` → `logs`. Pehle kaunsi state hai (Pending/Running/CrashLoop), phir Events dekho (kya reason), phir container me jao.

### 5. Workload Types | Kab Kya

| Workload | Use kab karo | Stateless? |
|----------|--------------|------------|
| **Deployment** | Web APIs, stateless apps, microservices | ✅ default |
| **StatefulSet** | DBs, message queues — stable identity + ordered scaling | ❌ (persistent) |
| **DaemonSet** | Har node pe exactly ek pod (monitoring agents, CNI) | — |
| **Job** | One-shot tasks (batch, migration) | — |
| **CronJob** | Schedule pe chalti job (backup, cleanup) | — |

### 6. 2026 Notes | Latest Kya Hai

- **Gateway API v1.2+ (GA)** — Service/Ingress ka senior successor; role-oriented: GatewayClass, Gateway, HTTPRoute. Multi-team, header-based routing, backend weight splitting native.
- **Sidecar containers (beta → stable)** — `spec.spec.sidecars` field; Logs/Metrics agents ab first-class citizen hai.
- **In-place pod resize** — CPU/memory update me pod restart nahi hota, `kubectl edit` live.
- **Karpenter / NAP** — node autoscaling ab cluster-level, pod scheduling se directly node spawn hota hai (Day 26 me detail).
- **Structured logging (klog)** — kubelet aur scheduler ke logs format hain — `kubectl logs` parsing easy.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `kubectl get nodes -o wide` | Node status + kubelet version + internal IP |
| `kubectl get pods -A -w` | Watch mode me live pod state |
| `kubectl describe pod <pod>` | Events + conditions — troubleshooting ka pehla step |
| `kubectl logs <pod> --previous` | Previous (crashed) container ke logs |
| `kubectl exec -it <pod> -- sh` | Container ke andar debug |
| `kubectl get events --sort-by=.lastTimestamp` | Cluster events — recent first |
| `kubectl rollout status deploy/<name>` | Deploy update me kitna progress |
| `kubectl apply -f <file.yaml>` | Declarative create/update |
| `kubectl port-forward pod/<pod> 8080:80` | Local port → pod port |
| `kubectl get deploy nginx -o yaml` | Live object ka pura spec |

---

## Practice Lab | Abhi Karein

1. **Cluster banao (5 min):** `kind create cluster` ya `k3d cluster create dev`. Kubectl ready check: `kubectl cluster-info`
2. **Nodes dekho:** `kubectl get nodes -o wide` — note karo Kubernetes version, internal IP, runtime.
3. **Deployment YAML likho** (upar wala `web` manifest). `kubectl apply -f web-deploy.yaml`
4. **Rollout check:** `kubectl rollout status deployment/web` — "successfully rolled out" aana chahiye.
5. **Pods verify:** `kubectl get pods -o wide` — 3 pods, saare Running (0/0 Ready nahi — 3/3 Ready).
6. **Describe padho:** `kubectl describe pod <any-pod>` — Events me "Successfully pulled image" dekho.
7. **Expose karo:** `kubectl port-forward deployment/web 8080:80 &` → `curl localhost:8080` → HTTP 200.
8. **Exec karke andar jao:** `kubectl exec -it deploy/web -- sh` → `ls /usr/share/nginx/html` → exit.
9. **Scale karo:** `kubectl scale deployment web --replicas=5` → `kubectl get pods` (5 ho jayein).
10. **Namespace + quota:** `kubectl create ns qa; kubectl run test --image=nginx -n qa; kubectl get pods -n qa`
11. **Crash simulate:** bad image deploy karo `kubectl set image deployment/web web=nginx:this-tag-not-here` → pod me ImagePullBackOff dekho (kal ye fix hoga).
12. **Cleanup:** `kubectl delete -f web-deploy.yaml; kubectl delete ns qa; kind delete cluster` (cost 0).

---

## Incidents / Tickets | Real Practice

### INC-601 · CrashLoopBackOff

- **Situation:** RAT teams revision push ke baad `payments-api` ke pods `CrashLoopBackOff` me hain. Users payments nahi kar pa rahe. Alert: "Pod restarting continuously".
- **Investigate:** `kubectl get pods -n prod | grep payments` → status CrashLoopBackOff. `kubectl describe pod payments-api-<id> -n prod` (Restart Count batayega kitni baar). `kubectl logs payments-api-<id> -n prod --previous` (kurgana crash ka log).
- **Root cause:** `.env` me new required env var `DB_CONNECT_TIMEOUT` set nahi tha → app startup pe null pointer + non-zero exit code 1. Kubelet use restart karta rehta tha.
- **Fix:** ConfigMap/Secret me env var add karke reload — `kubectl set env deployment payments-api DB_CONNECT_TIMEOUT=5` → `kubectl rollout restart deployment payments-api`. App exit code 0 pe healthy.
- **Verify:** `kubectl rollout status deployment/payments-api` → `kubectl get pods` (Running, Restart Count 0). `curl /health` → 200.
- **Blast radius | Prevent:** Poora payments flow down (blast radius = all payment users). Detect faster: ready + liveness probe add karo (Day 22). Prevent: CI me startup smoke test (exit code check), env var validation pipeline gate. CrashLoopBackOff = app ka problem, ImagePullBackOff = image ka problem — dono me differ karo.

### INC-602 · ImagePullBackOff

- **Situation:** Naya image `catalog-service:2.1.0` ACR me push hua, deploy hua — pod stuck `ImagePullBackOff`, Ready 0/1, service empty.
- **Investigate:** `kubectl describe pod catalog-service-<id>` → Events me "Failed to pull image ... unauthorized: authentication required" (private ACR). `kubectl get secrets -n prod` → koi docker-registry secret nahi dikha.
- **Root cause:** Image ACR (private registry) me hai, lekin pod spec me `imagePullSecrets` nahi tha. ImagePullBackOff me `describe → Events` me actual reason hamesha likha hota hai.
- **Fix:** `kubectl create secret docker-registry acr-secret --docker-server=myacr.azurecr.io --docker-username=00000000-0000-0000-0000-000000000000 --docker-password=<token> -n prod` (ye user ACR me admin/login identity represents karta hai). ServiceAccount me patch: `kubectl patch serviceaccount default -n prod -p '{"imagePullSecrets":[{"name":"acr-secret"}]}'`. `kubectl rollout restart deployment catalog-service`.
- **Verify:** `kubectl get pods` → ImagePullBackOff gone → Running 1/1. `kubectl describe pod` Events → "Successfully pulled image".
- **Blast radius | Prevent:** Service bina pods ke = parts of app down. Detect faster: `FailedToPullImage` se alert rule. Prevent: 2026 me best = **workload identity** / AKS kubelet identity pe pull grant karo (no static username/password), aur image tag fix + pin karo (dangling/latest tag se bacho).

---

## Interview Corner | Sawal-Jawab

**Q1: kubectl describe pod me kaunse sections padhte ho aur kyu?**
`Status/Conditions` (scheduled kya, container ready kya), `Events` (sabse last — image pull / probe failures), `Restart Count`. Ye hi debugging ka 80% hai — get only state batata hai, describe reason batata hai.

**Q2: Deployment, ReplicaSet aur Pod ka relationship kya hai?**
Deployment → ReplicaSet (versioned) → Pods. Har deploy/update naya RS banata hai (rollback ke liye record), RS desired replicas maintain karta hai. Pods koi bhi moment pe replace ho sakte hain.

**Q3: StatefulSet vs Deployment difference?**
StatefulSet: stable Pod identity (pod-0, pod-1), stable DNS, ordered create/scale/terminate, PersistentVolumeClaim per pod. DB/jobs ke liye; Deployment stateless scalable apps.

**Q4: kubectl apply vs create me kya difference hai?**
`apply` = declarative merge (existing resource ko diff karke update, git-like). `create` = imperative, error deta hai agar already exists. Production me hamesha `apply` (GitOps-ready).

**Q5: DaemonSet kahan use hota hai real me?**
Har node pe exactly 1 pod: monitoring agents (Prometheus node-exporter), logging (Fluentd/KiNDD), CNI, CSI components. Node add hote hi pod auto-chal jata hai, node hatne pe bhi.

---

## Quick Notes | Yaad Rakhna

- Troubleshoot order: `get` (state) → `describe` (reason/events) → `logs` (app problem ko nahi, image-crash problem ko). Kabhi bhi random command mat chalao.
- Production me direct Pod nahi — Deployment + Service + Namespace se kaam karo.
- `logs --previous` crashed container ka last log = sabse important debugging info.
- Control plane = brain (sirf cloud managed me ya multi-master), worker nodes = muscles.
- Labels + selectors = kl Service ka routing logic ka base — aaj hi samajh lo.
- Gateway API ab GA — nayi projects me Ingress ki jagah HTTPRoute dekhna (Day 23).
- **Kal:** Scheduling, probes aur limits — pods control me lane ka time.

---

**Kal:** Probes, requests/limits, OOMKilled aur Pending pods.