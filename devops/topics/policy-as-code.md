# Deep Dive: Policy as Code — OPA, Rego, Gatekeeper, Kyverno

> **Kaha ka hai:** Day 37 ka gahra version. Policy = code, versioned, tested, enforced at admission. Works for k8s, Terraform, clouds, HTTP — one engine (OPA) anywhere.

---

## 1. Why Policy as Code

```
Traditional: admins "remember" the checklist (no scale, no audit)
Policy as Code: 
  - Declarative policies versioned in Git (review + rollback)
  - Enforced automatically (admission) — no human remembers
  - Auditable: verification result logged (evidence)
  - One place: security/nginx/SRE/operations policies — consistent
```

Examples of policy: require resource limits, disallow privileged pods, block public storage accounts, require owner label, allow only signed images, require HTTPS, region allowlist.

---

## 2. OPA (Open Policy Agent) — General-Purpose

**OPA = policy engine, language = Rego.**

```
ANY data input → OPA evaluates against Rego policy → decision (allow/deny/validate)
Input types: k8s admission reviews, Terraform plans, HTTP requests, cloud API calls, arbitrary JSON
```
**Rego basics:**
```rego
package example

# policy as pure function: input → decision
allow := input.user == "admin"            # expression (rule)

# violations as sets
deny contains msg if {
  some k in input.deployments
  not k.metadata.labels["app"]
  msg := sprintf("deployment %s missing app label", [k.metadata.name])
}
```
- **Deterministic**: no side effects, no time dependence → testable
- **`opa test`** = unit tests for policies — so your policy CI runs like app CI (my favorite part)

```bash
opa eval -I -f pretty 'data.policies'              # evaluate
opa test ./policies/*_test.rego                     # unit test policies
```
---

## 3. Gatekeeper — OPA for Kubernetes

Gatekeeper = OPA integrated as **admission controller**:
- **ConstraintTemplate**: template + Rego target block (`input.review.object` = the resource)
- **Constraint**: instantiate template with parameters

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata: { name: k8srequiredlabels }
spec:
  crd:
    spec:
      names: { kind: K8sRequiredLabels }
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          provided := {label for label in input.review.object.metadata.labels}
          required := {label for label in input.parameters.labels}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing labels: %v", [missing])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata: { name: require-app-label }
spec:
  match:
    kinds: [ { apiGroups: ["apps"], kinds: ["Deployment"] } ]
  parameters:
    labels: ["app", "env"]
```
- **Audit mode** (default) logs violations; **Enforce** blocks.
- Runs ~content outside k8s too (Terraform via `opa eval` in CI).

---

## 4. Kyverno — Kubernetes-Native Policies (YAML, no Rego)

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-resource-limits }
spec:
  validationFailureAction: Enforce     # or Audit
  background: true
  rules:
    - name: require-limits
      match:
        resources: { kinds: [Pod] }
      validate:
        message: "cpu/memory limits required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    cpu: "?*"
                    memory: "?*"
```
| Kyverno capability | Example |
|--------------------|---------|
| `validate` | deny (limits, labels, image tag rules) — pattern/anyPattern/deny |
| `mutate` | inject sidecars (istio), defaults, add labels/annotations |
| `generate` | create default NetworkPolicy/Namespace resources |
| `verifyImages` | only allow signed/allow-listed images (Day 48 supply chain!) |
| cluster vs namespace policy | ClusterPolicy (cluster snoopy) |

```yaml
# auto hands-on: deny 'latest'
spec:
  rules:
    - name: no-latest
      match: { resources: { kinds: [Pod] } }
      validate:
        message: "no latest tags"
        deny:
          conditions:
            any:
              - key: "{{ request.object.spec.containers[].image }}"
                operator: AnyIn
                value: ["*:latest"]
```

---

## 5. Where to enforce — admission + CI + higher layers

```
Admission (runtime): Gatekeeper/Kyverno — block bad pods BEFORE create
CI (build time):     Trivy/Checkov/Semgrep + OPA eval over Terraform plan — block EARLY
Config/git:          Policy checks in PR (e.g., Kyverno on rendered manifests, "policy within CI")
Cloud:               Azure Policy / AWS Config / GCP Config Controller — provider-level
```
**Defense in depth:** catch at CI (cheap) + enforce at admission (authoritative) + monitor cloud-level (compliance).

---

## 6. Azure Policy (cloud-native counterpart)

```json
{
  "mode": "All",
  "policyRule": {
    "if": {
      "field": "Microsoft.Storage/storageAccounts/networkAcls.defaultAction",
      "equals": "Allow"
    },
    "then": { "effect": "Deny" }
  }
}
```
- Enforces on resource **create/update** (Deny/DeployIfNotExists/Audit)
- Built-in initiatives: CIS, PCI-DSS, HIPAA, SOC2 — report compliance per resource
- Pairs with Defender for Cloud recommendations (Day 49)

---

## 7. A Real Policy Set (Golden practices)

```
- Require resource limits (CPU/mem)         enforce   (visibility → hard gate)
- Forbid image tag "latest"                 enforce
- Require labels (app, env)                 enforce
- Allowlist registry(s)                     enforce (avoid supply-chain skips)
- Verify image signature                    enforce (kyverno verifyImages)
- Default-deny across namespaces            generate (NetworkPolicy)
- Inject Istio sidecar when annotation set  mutate   (progressive)
- Require owner in annotations              audit first → enforce later
- Block privileged / hostNetwork / hostPID  enforce
```

---

## 8. Interview Questions — Policy as Code

| Question | Strong answer |
|----------|---------------|
| "OPA vs Kyverno?" | OPA=general-purpose engine (Rego), Gatekeeper version for k8s, can validate TF/cloud/HTTP too. Kyverno=k8s-native, YAML-only, mutate/generate/verify-images easy. |
| "Rego kya?" | OPA's language: pure, deterministic functions returning decisions/violations; testable with `opa test`. |
| "Admission control kaise?" | API server calls validating webhook → policy engine evaluates admissionReview → allow/deny + message before resource persisted. |
| "Enforce vs Audit?" | Enforce blocks requests; Audit logs only (rollout before blocking). Start Audit, move to Enforce once confident. |
| "Policy kab chalao?" | CI (build/plan) early + admission (runtime) authoritative + cloud-level (Azure Policy) compliance. Left-shifo. |
| "verifyImages kya?" | Kyverno rule: pod images must be signed (cosign) + from allowed registry — supply-chain defense at admission. |
| "Kyverno mutate use case?" | Auto-inject sidecar (istio), add defaults (limits/labels), normalized naming — GitOps doesn't even need to write them. |
| "Policy review how?" | GitOps: policies versioned, PR-reviewed, tested (`opa test`/kyverno test), canaried in Audit first. |

**Related:** [Day 37](../day-37-policy-as-code-opa-kyverno.md) · [GitOps](../topics/gitops-argocd.md) · [Supply Chain](../topics/supply-chain-security.md) · [Cloud Security](../topics/cloud-network-security.md)