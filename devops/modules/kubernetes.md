# ☸️ Kubernetes — Containers ka OS

> **Hinglish:** Kubernetes (K8s) containers ko **production-grade** banata hai — auto-restart, scaling, load balancing, self-healing, storage, configuration — sab kuch manage karta hai. Ye module basics → workloads → networking → config/storage → operations → advanced tak jata hai.

## 📖 Overview — Ye Topic Kya Hai

Agar tumhare paas 5 containers hain, toh Docker enough hai. Agar 50 saas services, Thousands of pods, autoscale, upgrades bina downtime ke — toh tumhe **Kubernetes** chahiye: ek **container orchestrator** jo declare kiye gaye "desired state" ko continuously maintain karta hai.

**Cluster** = control plane (decision-maker) + worker nodes (jaha kaam chalta hai). Chalti hui unit **Pod** (ek ya zyada containers). Workloads (Deployment, StatefulSet, DaemonSet, Job/CronJob), **Services + Ingress** (networking), **ConfigMap/Secret** (configuration), **Volumes/PV/PVC** (storage), aur **Namespaces + RBAC** (isolation). Ye sab "declarative YAML" me likha jata hai.

## 🟢 Beginner — Shuruaat yahan se

- `minikube`/local cluster chalao, `kubectl get nodes`.
- Pod, Deployment banao, `kubectl logs`, `exec`, `describe`.
- Services: ClusterIP (internal), NodePort (dev), LoadBalancer (cloud).
- `kubectl port-forward` se local access.
- Scale karo: `kubectl scale deploy`, `rollout status`.

## 🟡 Intermediate — Ab yaml me design karo

- **Deployments** — replicas, rolling updates, rollback.
- **Probes** — liveness/readiness/startup — traffic control.
- **Requests/limits** — memory/CPU quotas; Quality of Service.
- **ConfigMap + Secret** — config injection, mounts vs env.
- **Volumes: PV, PVC, StorageClass** — persistent storage.
- **Services + DNS** — service discovery; Ingress routing + TLS.
- **RBAC** — roles, bindings, service accounts.

## 🔴 Advanced — Pro bano

- **HPA / VPA / Cluster Autoscaler** — scaling layers.
- **Node scheduling** — taints/tolerations, affinity/anti-affinity, PDB.
- **CRDs + Operators** — Kubernetes ko extend karna.
- **Admission controllers + webhooks** — policy enforcement.
- **Helm/Kustomize** — packaging + overlays.
- **Multi-cluster, federation, upgrades, troubleshooting deep-dive.**

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Kubernetes basics** — container orchestration; desired state controller.
- [ ] **Cluster** — nodes ka group jo K8s chala raha hai.
- [ ] **Control plane** — decision layer: API server, scheduler, controllers.
- [ ] **Worker node** — jaha pods chalti hain (kubelet + kube-proxy).
- [ ] **Pod** — smallest unit; 1+ containers.
- [ ] **Container** — running image instance.
- [ ] **Namespace** — logical partition; isolation/projects.
- [ ] **Labels** — resources pe key-value tags; selectors se chunte ho.
- [ ] **Selectors** — labels ki basis pe resources group/select.
- [ ] **Annotations** — metadata (non-query) tools ke liye.
- [ ] **Deployment** — declarative desired state for stateless apps.
- [ ] **ReplicaSet** — pods ka count maintain karta hai.
- [ ] **StatefulSet** — ordered pods + stable identity (DBs).
- [ ] **DaemonSet** — har node pe ek pod (logs agent).
- [ ] **Job / CronJob** — one-off / scheduled workloads.
- [ ] **Service** — stable network endpoint for pods.
- [ ] **ClusterIP** — internal service for cluster (default).
- [ ] **NodePort** — node ke port se external access.
- [ ] **LoadBalancer** — cloud LB provision; external IP.
- [ ] **Ingress** — HTTP routing + TLS + paths; single entry.
- [ ] **NetworkPolicy** — pod-to-pod traffic rules (allow/deny).
- [ ] **DNS** — service discovery; `service.ns.svc`.
- [ ] **ConfigMap** — non-secret config store.
- [ ] **Secret** — base64 sensitive data (credentials).
- [ ] **Volumes** — pod ke andar storage mounts.
- [ ] **PersistentVolume** — cluster-level storage resource.
- [ ] **PersistentVolumeClaim** — app ki storage request.
- [ ] **StorageClass** — dynamic storage provision (tier).
- [ ] **kubectl** — primary CLI; get/describe/apply/exec/logs.
- [ ] **Probes** — liveness (marne pe restart), readiness (traffic).
- [ ] **Requests / limits** — resource guarantees + caps.
- [ ] **HPA** — pods scale by CPU/metrics.
- [ ] **VPA** — pod resource recommendations.
- [ ] **Cluster Autoscaler** — nodes add/remove by scheduling pressure.
- [ ] **Scheduling** — pod ko kaunsa node milege.
- [ ] **Taints / Tolerations** — node pe "mat aao" + pod "aana chahata hoon".
- [ ] **Affinity** — prefer/require run near/away from nodes.
- [ ] **PodDisruptionBudget** — intentional shrinkage me min pods rakh.
- [ ] **RBAC** — role + bindings; kiska kya access.
- [ ] **ServiceAccount** — pod ki identity in cluster API.
- [ ] **CRDs** — custom object types define karna.
- [ ] **Operators** — CRD + controller loop; auto manage apps.
- [ ] **Admission Controllers / Webhooks** — requests validate/mutate.
- [ ] **Helm / Kustomize** — packaging & config overlays.
- [ ] **Multi-cluster / federation** — kai clusters ek saath.
- [ ] **Cluster upgrades** — node drains, app stays up.
- [ ] **K8s troubleshooting** — status, events, logs, describe.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| kubectl | K8s CLI | Har K8s kaam ke liye |
| minikube / kind / k3d | Local clusters | Learning + dev |
| Helm | Package manager | Apps chart se install |
| Kustomize | Config overlays | Env-specific tweaks |
| AKS / EKS / GKE | Managed K8s | Production me |
| Lens / k9s | Dashboards/TUI | Cluster dekhne ke liye |
| kubectl-krew + plugins | Extensible tools | Specialized ops |
| Velero | Backup/restore | DR ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First Deploy:** Local cluster + Deployment 3 replicas, service lagao, `rollout` update karo, rollback karo.
- [ ] **Lab 2 — Probes & Limits:** Liveness/readiness probes lagao, resources requests/limits set karo, kubectl describe se verify.
- [ ] **Lab 3 — Config + Secrets:** ConfigMap + Secret se env/config mount karo; mount vs env difference dekho.
- [ ] **Lab 4 — Storage:** PVC claim karo + StorageClass use karo, pod restart pe data persist kar (file write/read test).
- [ ] **Lab 5 — Ingress + TLS:** Ingress controller lagao, path-based routing + self-signed TLS certificate.
- [ ] **Lab 6 — Autoscale:** HPA lagao, load bhejke pods badhte hue dekho.
- [ ] **Project — Microservices on K8s:** 3-tier app (frontend, api, db) namespaces me, deployments + services + ingress + config/secret + RBAC ke saath end-to-end.

## 🔗 Related Topics

- [🐳 Docker & Containers](../modules/docker-containers.md)
- [🔁 GitOps](../modules/gitops.md)
- [💾 Storage](../modules/storage.md)
- [🛡️ DevSecOps](../modules/devsecops.md)
- [K8s Control Plane & Scheduling](../topics/kubernetes-architecture.md)
- [Helm — K8s Package Manager](../topics/helm-charts.md)
- [Day 18 — Kubernetes Fundamentals](../day-18-kubernetes-fundamentals.md)
- [Day 19 — Deployments & Services](../day-19-kubernetes-deployments-services.md)
- [Day 20 — ConfigMaps, Secrets & Volumes](../day-20-kubernetes-configmaps-secrets-volumes.md)