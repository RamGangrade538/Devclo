# Day 37: Policy as Code — OPA (Rego), Kyverno, Admission Control

> Policy = "kisko kya allowed" in cloud+cluster. OPA/Rego + Kyverno policy ko code bana dete hain — audit aur enforcement dono, GitOps ki tarah versioned.

## Overview | Parichay

Abhi k8s pe koi bhi pod bana sakta hai — bas utna hi insecure. **Policy as Code:** admission controller har request pe policy check karta hai:
- **OPA (Open Policy Agent)** + Gatekeeper — general policy (any K8s, cloud API, even Terraform)
- **Kyverno** — K8s native, YAML-only policies, no Rego needed, simpler
- **deny/validate/mutate/generate** — enforcement, modification crate, defaults

Use cases: no `latest` images, require resource limits, disallow `privileged: true`, auto-add labels, require owner, block public storage in Terraform, auto-label namespaces.

### Admission control — persist hone se pehle ka darwaza

Request flow simple hai: **authn/authz → admission webhooks → etcd save**. Yani webhook galat policy pe request ko rok sakta hai **before** cluster state change hota hai — yahi enforcement point hai. Do types: **Validating** (allow/deny) aur **Mutating** (request badal kar aage bhejo — sidecar/labels inject). Gotcha: webhook availability = cluster usability — galat webhook config se `kubectl` hi hang ho jata hai; timeouts chhote rakho aur `failurePolicy` samjho (`Ignore` vs `Fail`).

Admission flow ke 3 points yaad rakho:
- **Mutating** pehle chalta hai (request change karta hai), phir **Validating**
- Authn/authz webhook se pehle ho chuki hoti hai — policy sirf "kya allowed" check karti hai
- `failurePolicy: Fail` = engine down to poora cluster ruk jaata hai, `Ignore` = risk tolerate

### OPA + Rego — general purpose policy engine

OPA kisi bhi input pe policy chala sakta hai: k8s admission, Terraform plan, HTTP request — **Rego** language me rules likho (`input.review.object...` pattern). Power: **ek engine, har jagah** — k8s solution hi nahi, poora org policy ek jagah. Cost: Rego ek nayi declarative language hai (set logic) — thoda non-intuitive pehle (`violation` wala assertion style). Default-deny mindset rakho: jo allow defined nahi wo deny. Interview one-liner: OPA = "policy brain", systems sirf sawal puchte hain.

OPA ko kahan kahan laga sakte ho — ye list hi "policy as code" ka poora scope hai:
- **K8s admission** (Gatekeeper)
- **Terraform plan** (Conftest) — IaC validation
- **HTTP API** — request/response policies
- **CI gate** — dashboards, pipelines bhi OPA query se

### Gatekeeper — OPA ka k8s pakka roop

Gatekeeper = OPA ko K8s native banata hai with 2 CRDs: **ConstraintTemplate** (Rego template, parameterized) + **Constraint** (instance — kaunse resources pe, kya params). Fayda: constraints YAML me `match` (labels/namespaces) se scope hoti hain, aur background pe **audit** purane resources bhi check karta hai. Policy bhi **GitOps me versioned** rehti hai. Kab Gatekeeper: team Rego jaanti hai, ya non-K8s inputs (Conftest se Terraform) bhi — tab OPA stack better fit hai.

### Kyverno — YAML-only, k8s native

Kyverno me **Rego nahi** hai — policy pure Kubernetes YAML me likhni hai, jo K8s ki grammar already aati hai. `ClusterPolicy` me rules: match kinds → validate/mutate/generate — 10 minute me pehli policy **live** ho jati hai. Bonus: **image verification** (cosign signatures se verify) built-in hai. Kab Kyverno: scope sirf K8s hai aur team Rego nahi seekhna chahti; kab OPA: multi-platform policy (Terraform, cloud APIs) ek hi engine se chahiye. Dono ka rule hamesha: policies bhi **tested + reviewed + versioned** — policy hi code hai.

### Validate, mutate, generate — teen kartabe

- **validate**: allow/deny pattern — `*:latest` band, `privileged: true` band, resource limits required.
- **mutate**: request me defaults inject — CPU/memory limits, labels, sidecar annotation — developer ke bina bhi compliance.
- **generate**: naye resources banao — namespace banate hi NetworkPolicy / ResourceQuota auto-create.

Isliye policy sirf "roko" nahi — **badlo aur default banao**. Ye adoption ko asaan banata hai: dev ko checklist yaad nahi karni padti, sab khud ho jata hai.

Ek table me teeno kartabe:
| Action | Matlab | Example |
|--------|--------|---------|
| validate | allow/deny | no `latest`, limits required |
| mutate | request me change | inject sidecar, add labels |
| generate | new resource | NetworkPolicy on namespace-create |

### Audit se Enforce tak — rollout order

Seedha prod pe `validationFailureAction: Enforce` daala to team ruk jayegi (ya worse — bypass dhundhegi). Sahi order: **Audit mode** (violations sirf log hongi + report) → muddo ke violations fix → **per-namespace Enforce** → mesh-wide. Track metrics: violations/day ka trend. Exclusions pehle se socho: `kube-system`, `kube-node-lease` jaise system namespaces. Ye change-management utna hi hai jitna technical — policy rollout bhi progressive delivery hai.

Rollout checklist:
1. **Audit mode** all namespaces — violations report dekh lo
2. Exclusions fix karo (`kube-system`, operators, legacy)
3. **Per-namespace Enforce** (pehle dev, phir staging, phir prod)
4. Violations ka trend monitor karo + dashboard me violations count

### Policy across cloud — Terraform plans bhi

OPA ka asli faayda input-agnostic hai: `terraform plan -json` → OPA/Conftest → "public storage allowed nahi", "region allowlist", "mandatory tags" enforce. Isse **infra PR gate** ban jata hai — jaise Kyverno K8s me policy lagata hai, wahi OPA plan file pe enforce karta hai → infra bhi code jaise governed. Common policies: no `0.0.0.0/0`, required tags (owner/env), prod pe public IPs deny. Interview frame: "policy as code = versioned, tested, reviewed — exact same discipline as app code."

Ek block-policy example jo interview me bolna sahi lagti hai:
```
Plan query (Rego): "if any resource has ingress 0.0.0.0/0 -> violation"
Location: PR gate (Conftest/OPA test --plan) -- infra deploy block
```
Yahi "IaC = code" ka access dena hai, bina extra human approval ke.

### Interview angle — ek taiyar example rakho

Sawal: "kaise roke ki koi `latest` image ya bina-limits pod chalaaye?" Answer frame: **admission webhook + Kyverno ClusterPolicy (validate, Enforce) + Audit se rollout + developer-friendly message**. Doosre: Enforce vs Audit ka fark, mutate ka example (auto-limits injection), OPA vs Kyverno ke 1-liners. Ye teen cheezein ready rakhna — live demo round me YAML dikha ke kaam impress hota hai.

## What You'll Learn | Aaj Ki Seekh

- [ ] Admission control flow (before persist)
- [ ] OPA basics: Rego, `input`, default deny, rules as policy
- [ ] Gatekeeper: ConstraintTemplate + Constraint
- [ ] Kyverno: ClusterPolicy/Policies (validate, mutate, generate)
- [ ] Cloud policy: Terraform/CloudTrail guard too (custom libs)
- [ ] OPA for IaC (main.tf) validation — policy across cloud

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart LR
    USER["kubectl create Pod"] --> ADM{"API Server
    Admission (validate)}
    ADM --> POL{"Policy Engine
    Gatekeeper / Kyverno"}
    POL -->|"OPA Rego / k8s policy"| ALLOW["ALLOW → persist"]
    POL -->|"violation"| DENY["DENY + message"]
    POLOPT["Verdicts logged in AdmissionReview"]
```

ASCII:
```
request → admission (validating webhook) → policy engine → allow/deny (before resource saved)
Kyverno: validate + mutate (auto-inject sidecars/labels) + generate (defaults)
OPA Rego: general purpose — "any input" mode (Terraform plans, HTTP, k8s admission)
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Install Kyverno (simplest)
kubectl apply -f https://github.com/kyverno/kyverno/releases/.../install.yaml

# 2. POLICY: no latest image tag
cat > require-tag.yaml << 'EOF'
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-image-tag }
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-image-tag
      match:
        resources:
          kinds: [Pod]
      validate:
        message: "image tag required (no use of 'latest')"
        pattern:
          spec:
            containers:
              - image: "!*:latest"
EOF
kubectl apply -f require-tag.yaml
kubectl run nginx-latest --image=nginx:latest     # DENIED with your message
kubectl run nginx-pinned --image=nginx:1.25       # OK

# 3. MUTATE: auto-add resource limits
cat > auto-limits.yaml << 'EOF'
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: add-resource-requirements }
spec:
  rules:
    - name: add-limits
      match:
        resources: { kinds: [Pod] }
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - (name): "*"
                resources:
                  limits:
                    cpu: 500m
                    memory: 512Mi
                  requests:
                    cpu: 100m
                    memory: 128Mi
EOF

# 4. Gatekeeper/OPA (alternative — general Rego)
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v3.14.0/deploy/gatekeeper.yaml
cat > template.yaml << 'EOF'
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata: { name: k8srequiredlabels }
spec:
  crd:
    spec:
      names: { kind: K8sRequiredLabels, listKind: K8sRequiredLabelsList }
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          provided := {label for label in input.review.object.metadata.labels}
          required := {"app.kubernetes.io/name"}
          missing = required - provided
          count(missing) > 0
          msg := sprintf("missing labels: %v", [missing])
        }
EOF
kubectl apply -f template.yaml

# 5. OPA against Terraform (example — reusable)
# (rego policy can also validate your .tf plan output)
```

## Real-Life Example | Industry Me

| Policy (commander) | Type | kubectl example |
|--------------------|------|-----------------|
| Require `resources` limits | validate | cpu/memory surely set |
| Require pull `Always` + digest | validate | reproducible image |
| Disallow `hostNetwork` + `privileged` | validate | security posture |
| Auto-inject istio/envoy sidecar annotation | mutate | GitOps magic |
| Auto label `app.kubernetes.io/part-of` | mutate | tracing/ownership |
| NetworkPolicy separation | generate | default deny |

**DemoD scenario:** you run `kubectl apply -f deployment.yaml` no resource limits → Kyverno mutate adds default limits OR enforces fail at CI. This is exactly "security via code" — no new checkbox for the human.

## Practice Exercise | Abhi Karein

1. Kyverno: install + require-tag (Enforce) — try latest vs pinned
2. Kyverno mutate: auto-limits — deploy pod, `kubectl describe` shows injected request/limit
3. Kyverno generate: namespace default NetworkPolicy — `kubectl create ns newns` → policy auto-created
4. Gatekeeper: required-labels template + constraint
5. OPA/Rego with Terraform plan (visit docs `openpolicyagent.org`) — try one .tf policy
6. Inventory: list 5 policies your org has → write as Kyverno YAML

## Quick Notes | Yaad Rakho

```
- Admission control = before persist; policies = OPA/Gatekeeper (Rego) or Kyverno (YAML-native)
- Enforce vs Audit: Enforce blocks; Audit logs violation (rollout first!)
- validate (allow/deny) / mutate (inject defaults) / generate (create resources) / verify-images
- RULES: match kinds + exclude patterns; message = human-readable denial
- Policy = code → GitOps versioned, CI test, PR review (SAST on policies!)
- Works for ANY input: k8s, HTTP, Terraform plans, cloud API → one engine (OPA)
- Common: require limits, forbid latest, require labels, disallow privilege, allowlist registries
```

**Agla:** Platform Engineering — IDPs, Backstage, Golden Path, internal developer portals.