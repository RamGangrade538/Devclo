# Day 36 — Multi-Cluster & Fleet Management (DevClo Expanded — Platform Engineering)

## Overview | Parichay
Ab tak tumne ek cluster bana liya, usme GitOps laga diya (Day 35). But production reality: ek cluster kabhi kafi nahi hota. Region failover chahiye, tenant isolation chahiye, DR chahiye, project sandboxes chahiye — aur woh sab alag-alag clusters me. Ye day tumhe "cluster nahi, **fleet** sochna" sikhata hai: multiple clusters ko centrally manage karna (policy, security, upgrades, app rollout) jaise ek platform team karta hai. 5-saal ka difference: junior hota to ek cluster revive karta — tum poora fleet govern karoge.

## What You'll Learn | Aaj Ki Seekh
- [ ] Multi-cluster ka "kyun": isolation, DR, multi-region, multi-tenant reasoning
- [ ] Hub-spoke aur fleet topologies ko pehchanna (L0/L1/L2 severance pattern)
- [ ] GitOps manager (ArgoCD/Flux) ko fleet-wide app rollout ke liye use karna
- [ ] Cluster API (CAPI) ka architecture samajhna: control-plane vs workload clusters
- [ ] Azure AKS Fleet Manager: hub, member join, MemberUpdateStrategy (rollout upgrade)
- [ ] Azure Arc connected clusters + GitOps configs (`az connectedk8s`)
- [ ] Multi-tenant security: namespaces, NetworkPolicies, ResourceQuota, LimitRange
- [ ] Tenant-level audit logs enable karna (AuditSink / policy reporting)
- [ ] Failover demo pattern: cluster down → traffic switch → DNS/Global LB flow
- [ ] GitOps drift+self-heal ko 2 clusters me prove karna

## Full Topic (LEARN) | Puri Detail

### 1. Why Multi-Cluster — "Ek cluster kyun nahi?"
Single cluster ke dushman:
| Reason | Problem | Multi-cluster fix |
|--------|---------|-------------------|
| **Isolation** | Ek noisy tenant/app (resource hog, misbehaving deploy) pura cluster degrade kare | Blast radius = ek cluster |
| **DR** | Region down ya etcd corruption → sabka sab khatam | Active/passive region pair |
| **Region/latency** | Users Europe me, data US me | Cluster per region (data locality) |
| **Tenant hard-boundary** | Regulated tenant ko bhi same etcd/control-plane me chahiye | Separate clusters hi compliance dete hain |
| **Control-plane blast radius** | Upgrade/`kubectl apply` ki galti sab jagah lagti hai | Rolling cluster-wise rollout |

Decision frame (senior move): namespace = **logical** isolation kaafi hai jab shared control-plane acceptable ho; cluster = **hard** boundary jab compliance/data/audit rigid ho. Namespace fast hai, cluster slow hai — isliye sadharan pattern: default shared clusters + dedicated clusters sirf special tenants/apps ke liye.

### 2. Fleet Topologies (L0/L1/L2 Severance)
**Hub-spoke (fleet)**: ek "hub" cluster sirf management ke liye — operators, GitOps, policy engine wahan beth-te hain; **spoke/workload** clusters apps chalate hain. Rules:
- Workload kubectl ko spokes pe **direct** access kam se kam — sab kuch Git se, hub se.
- Hub ✅ fail = workload apps ❌ fail — ye izolasyon hi principle hai.
- Prometheus/ArgoCD/OPA ko hub pe deploy karke spokes pe agents (thanos, shard argocd, kyverno) — **fan-out**.

L0/L1/L2 severance (senior lingo): L0 = control-plane control/connectivity loss; L1 = workload can't reach fleet hub (apps chalti hain, GitOps sync rukta hai); L2 = fleet not known. Jaise-jaise severity level badhta hai, failover policy alag hoti hai — isi ko architecture me likho.

### 3. GitOps Managers Across Clusters
Day 35 ke tools ab scale pe:

> **Pattern memory:** Har cluster apna isolation chahta hai lekin config ek hi jagah. Custom-selector "hub controls spokes" + spokes agents self-sustain — isi ko "hub thinks, spokes act" bol sakte ho. Config authoring sirf hub/git me, execution har cluster ke apne operator me.
- **ArgoCD**: hub pe `ApplicationSet` with cluster generator — `clusters.yaml` secret (type kubernetes) me label `argocd.argoproj.io/managed-by-cluster-list` ya `--kubeconfig`. Pattern: **app-of-apps** (root application jo har cluster ka environment application spawn karta hai).
  ```yaml
  apiVersion: argoproj.io/v1alpha1
  kind: ApplicationSet
  metadata: { name: platform-apps }
  spec:
    generators:
      - cluster:
          selector: { matchLabels: { env: prod } }
          values: { version: v2.1.0 }
    template:
      metadata: { name: '{{name}}-app' }
      spec:
        project: platform
        destination: { server: '{{server}}', namespace: platform }
        source:
          repoURL: https://github.com/org/plat-gitops
          targetRevision: main
          path: apps/{{values.version}}
  ```
- **Flux**: `flux bootstrap` per cluster, ya hub se `Kustomization` resources pointing at spokes via `kubeconfig` secrets. Multi-cluster ka classic Flux pattern: separate branch/folder per cluster, cluster-specific overlays.
- Drift catch: git = source of truth; koi bhi cluster me manual change → manager revert karta hai. Ye proof Day 36 lab me karo.

### 4. Cluster API (CAPI)
**Cluster API**: Kubernetes-natived (kubectl nehi declarative CRDs se) cluster provisioning: `Cluster`, `MachineDeployment`, `MachinePool`, providers (AWSCluster, AzureCluster). Control plane = **Management cluster** (kind/small AKS), jo "Machine" objects bana kar cloud me wahi provider ke code se nodes launch karta hai. Scale upgrade: `kubectl rollout restart machinedeployment`. Sr-level point: CAPI de-ket default infra sab clusters ko **same config** deta hai — fleet wid out-of-the-box.
- Pod infra is versionable + repeatable; `ClusterClass` se cluster farms ek template se (2026 stable hua hai) — v1.2 GA-era.
- Watchouts: CAPI cloud-provider integration (azure-ccm + azure-cloud-node-manager), machine pool vs managed nodes; DR ke liye infra template test in a scratch region.

### 5. AKS Fleet Manager (Azure)
**AKS Fleet Manager** = Azure ka managed multi-cluster solution. Key concepts:
- **Hub cluster & member clusters** — `az fleet create` hub, `az fleet member create` join (AKS ya ubuntu-flex/auto-zone clusters).
- **MemberUpdateStrategy**: ek hub se saare member clusters ka **upgrade orchestration** (version control), not just rollout.
- **Kubernetes object propagation (v1.2+ / Azure-ASM preview)**: `ClusterResourcePlacement` CRD sirf hub pe likho, fleet usse spokes pe propagate karta hai — **jobs/workloads centrally, sensitive configs nahi**.
- Configure:
  ```bash
  az fleet create --resource-group rg-platform --name fleet-hub \
    --location eastus --enable-hub-cluster
  az fleet member create --resource-group rg-platform --fleet-name fleet-hub \
    --name member-east --member-cluster-id /subscriptions/.../aks-east
  ```
- Advantage: no extra infra (hub is AKS), managed upgrades, Azure AD integrated.

### 6. Azure Arc Connected Clusters + GitOps Configs
On-prem/dusra cloud/edge clusters ko Azure me lao:
```bash
az connectedk8s connect --resource-group rg-platform --name edge-cluster-a
az k8s-configuration flux create --resource-group rg-platform \
  --cluster-name edge-cluster-a --cluster-type connectedClusters \
  --name gitops-platform --namespace platform \
  --repository-url https://github.com/org/plat-gitops \
  --operator-instance-name flux --operator-namespace flux-system \
  --sync-interval 5m
```
- `connectedClusters` type = Arc cluster, `managedClusters` = AKS.
- Isi se tumko milta hai: Azure Policy gate (policy constraints jo port karti hain), Defender for Cloud coverage, **GitOps config-as-CR** — sab centrally.

### 7. Multi-Tenancy Security (namespaces + policy)
Namespace se start karo, lekin sirf namespace naam nahi — **policy stack**:
- **ResourceQuota** per tenant (cpu/mem/PVC count), **LimitRange** per pod/container.
- **NetworkPolicies**: default-deny egress/ingress per namespace, allow-list onliy.
- **RBAC**: namespace-scoped Roles/RoleBindings; platform pe ClusterRoles only.
- **Tenant-level audits**: nise advisor/Events per namespace log karo `kubectl get events -n ten-a`; enable AuditLog forwarding (Azure: AKS diagnostics → Log Analytics) taaki "kisne kab kya kiya" tenant-wise prove ho.
- **Admission policy per fleet**: Kyverno policies hub/Arc se propagate karke "deny external images", "force labels", "min replicas" — tenant khud ko split mat karo.
- **Billing/ownership linkage**: tenant app store + RG/resource group ownership dock — operators/upgrade path defined per tenant buddy at onboarding.

### 8. Failover Demo Pattern (regional)
Real failover 3-layer:
1. **App layer**: same release both regions, GitOps se; traffic via Global Load Balancer/azure Traffic Manager endpoint health.
2. **DB layer**: active-passive/cross-region replica (PostgreSQL geo-replica); failover promo command.
3. **Verify layer**: `curl` endpoint-A vs endpoint-B, DNS TTL, status code, latency. Script it: endpoint-A down → TM fails to B → traffic auto redirect → SLO metric smoke.

```bash
# traffic manager endpoint flip (manual failover for demo)
az network traffic-manager endpoint update --resource-group rg-platform \
  --profile-name tm-global --type azureEndpoints -n east-endpoint --status Disabled
curl -sI https://api.example/health | head -1   # -> 200 (west serving)
az network traffic-manager endpoint update --resource-group rg-platform \
  --profile-name tm-global --type azureEndpoints -n east-endpoint --status Enabled
```
- Chaos-check weekly: one region "down" for 5 min — record SLO impact, MTTR, runbook gap.

### 2026 Notes
AKS **Fleet Manager** ab GA (1.2) hua hai with member update + object propagation preview aur member as multi-AZ auto-zone support; **azure-arc connected k8s + GitOps-config (flux)** mature hai. Cluster API (CAPI) 1.x stable, AzureCluster/azure-ccm integrators evolve kar rahi hain. Kyverno 1.13+/Flux 2.x spray ecosystem kayi milestones pe. FYI: naya hype **AKS automatic** — managed node pool image upgrades, versions kubernetes-obs auto-maintain karta hai; platform ko "auto" vs "controlled" decide karna hota hai (compliance de do).

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `kubectx` / `kubens` | cluster/namespace switch (senior tool) |
| `kubectl config get-contexts` | active contexts dekh |
| `kubectl config use-context kind-east` | kubectl ko target cluster pe bhejo |
| `az aks list -o table` | subscription ke saare AKS |
| `az aks get-credentials -g rg -n aks-east --overwrite-existing` | kubeconfig update |
| `az fleet create/...` | AKS Fleet hub |
| `az fleet member create ...` | member join |
| `az fleet member list -g rg -n fleet-hub -o table` | members + status |
| `az connectedk8s connect -g rg -n edge-a` | cluster ko Arc se connect |
| `az k8s-configuration flux create ...` `--sync-interval 5m` | GitOps config apply |
| `kubectl get clusterresourceplacement -A` | fleet object propagation (hub) |
| `kubectl get ns; kubectl get quota -A` | tenants + quotas |
| `kubectl describe netpol -n ten-a` | network policy state |
| `kubectl get events -n ten-a --sort-by=.lastTimestamp` | tenant audit trail |

## Practice Lab | Abhi Karein
Prereq: `kind` ya `k3d` (local), ya 2 AKS clusters (eastus + westus) — aproach local fast hai, Azure commands curriculum me.
1. Do kind clusters banao (name `east` + `west`): `kind create cluster --name east`, `kind create cluster --name west`.
2. `kubectx kind-east` set karke `kubectl get nodes` → `ready` dekh. Dono me do-do kubectl contexts verify.
3. Har cluster me namespace `platform` + ResourceQuota banao:
   `kubectl create ns platform`, `kubectl apply -f quota.yaml` (limits.cpu=4, memory=8Gi).
4. NetworkPolicy **default-deny** egress/ingress `platform` namespace me apply karo.
5. Ek ArgoCD (ya Flux) hub ko `kind-east` pe install karo (`kubectl create ns argocd` + install manifests).
6. ApplicationSet cluster-generator se `kind-west` target `platform-apps` application banao.
7. Ek demo app (nginx hello) ko Git repo me push karo; dono clusters me sync — `kubectl get app -A` (ArgoCD) sync statusel `Healthy`.
8. Drift test: `kubectl scale deploy demo-app --replicas=5 -n platform --context kind-west` → GitOps 5 min baad `git revert`/_self-heal_ karke `replicas:3` pe wapas laaye — `kubectl get deploy -n platform` se check.
9. Failover demo: east cluster me app scale 0 karo (`kubectl scale ... --replicas=0`), Traffic Manager/Azure Front Door ya simple DNS script se west ko traffic bhejo; `curl` endpoint pe 200 verify.
10. Audits: `kubectl get events -n platform --context kind-east` — rollback + scale events dikhe.
11. Log: "fleet topo diagram" realistic draw karo (hub/spokes, GitOps path, failover arrows).
Expected output line 1-6 me: 2 clusters healthy, quota + netpol applied, 1 ApplicationSet dono clusters manage karta; step 8 me replicas drift auto-reverted; step 9 me traffic switch successful.

## Real Incidents | Ek "Platform" Problem

### PLAT-036 · Region East Down — Failover Call
- **Situation:** Friday 3:12am. Monitoring: `east` cluster nodes ka leak — Azure incident, region degradation. AKS API server notreachable (`kubernetes.default.svc` timeout), pod healthchecks fail, SLO breach 40%. Platform on-call aaya.
- **Investigate:**
  ```bash
  kubectl ctx east; kubectl get nodes   # connectionFail — API server issue
  kubectl get member -n fleet-hub; az fleet member list -g rg -n fleet-hub -o table
  # west check
  kubectl ctx west; kubectl get deploy -n platform; curl https://west.example/api/health
  kc get events -n platform --context west --sort-by=.lastTimestamp | tail
  ```
- **Root cause:** East region me control-plane failure (Azure regional incident je AKS notcontrol-plane degraded), flag grantedregarding no failover automation — DNS/Traffic Manager my failed because app in west **patched hi nahi** (last deploy east main).
- **Fix:** Traffic Manager endpoint east → down mark; `az network traffic-manager endpoint update --status Disabled`; west pe `kubectl rollout restart deploy/api -n platform --context west`; `kubectl apply -f west-overlay` (env config swap); wait 60s for TM probe failover.
- **Verify:** `curl https://api.example/health` → 200 (west serving); TM endpoint status shows `Disabled/Enabled-failed-over`; prometheus `haproxy/ingress latency p95 < 300ms`; SLO burn stopped.
- **Prevent:** Failover runbook (DR playbook) + automated Traffic Manager health check, daily `api.example` smoke; west config parity test in CI; infrastructure "region pair" policy in platform backlog — and log incident for blameless postmortem.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q: Ek cluster vs multiple clusters — decision pad kya hai?**
A: Threat/requirements decide: **hard** boundaries (compliance, tenant regulatory, DR region, control-plane isolation) → separate clusters; lekin har cluster ka operational overlap (monitoring, GitOps, upgrades) hai — isliye fleet hub se manage karo, warna **N clusters = N single point of failures**.

**Q: Hub-spoke me hub fail ho to kya hota hai?**
A: Hub = control/management plane; spoke workloads **alag** rehti. Apps wahi chalti hain, GitOps daemon spes pe **cached** config se sync/self-heal continue karega (L1/L2 severity); sirf strategic planning (rollout/upgrade) rukta hai. Ye L1/L2 severance ke mature pattern — test it, don't just claim.

**Q: ArgoCD ApplicationSet cluster generator vs Flux — kya pattern use hota hai?**
A: Do common: (a) **ApplicationSet** cluster generator + app-of-apps — ArgoCD ke paas karta hai multi-cluster pick (env/project labels); (b) Flux me per-cluster `Kustomization` + `Cluster` `kustomization` folder — simpler mono-repo flow. Senior: criteria repo depth + team skill, dono hi valid.

**Q: Kubectl directly spoke pe use karo ya nahi?**
A: Operational ban — spokes pe read-only debugging ok, but changes/rollouts via **git + GitOps only**, so drift impossible. Hub pe `kubectl apply` allowed (git-repo-backed config only), sensitive secrets ke liye ExternalSecret (SOPS/ESO) hi.

**Q: Multi-tenant ke liye clusters boundaries kahan draw?**
A: Default: **namespaces** (fast, cheap) + RBAC+quotas+NetworkPolicy strong karke. Boundary cluster tab: regulated data, audit needs hard separation, noisy neighbor blast radius, ya development of control-plane isolation. Policy: "namespace isolation first, cluster only when reason proves needed."

## Quick Notes | Yaad Rakhna
- "Ek cluster to kyu nahi?" — isolation/DR/region/tenant — har case ko separately justify karo
- Blast radius ko cluster me, won't shared-etc se mitao — disconnected severance
- GitOps mee catching mechanism: `ApplicationSet`/Flux per-fleet configs — drift auto-heal
- CAPI = configuration provider; AKS Fleet = managed hub + update orchestration
- Arc diff: `managedClusters` vs `connectedClusters` — configurations dono pe
- Multi-tenant security formula: Namespace + ResourceQuota + NetworkPolicy + RBAC + audits
- Failover = app + DB + DNS teeno layers ready, not just two-command demo

## Next | Aage Bolte Jaana
Day 37 se ham platform service par **SLO/error budget incursion** — fleets ko hi quantitative target par chalate hain:
→ `day-37-sre-for-platforms.md`