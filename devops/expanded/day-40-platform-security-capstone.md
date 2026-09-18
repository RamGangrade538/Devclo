# Day 40 — Platform Security & Grand Capstone (DevClo Expanded — Platform Engineering)

## Overview | Parichay
Platform ka last building block — **security without friction**. Zero trust (identity is the new perimeter), supply-chain hardening (SBOM, SLSA, cosign), policy-as-code (Kyverno/OPA), compliance guardrails (Azure Policy, Defender for Cloud, ISO/NIST). Phir aata hai **GRAND CAPSTONE**: ek production-grade platform demo jo IDP + GitOps + SLO + FinOps + security ko ek story me jodta hai — interview me "5-saal ka senior platform engineer" isi story se prove hota hai.

## What You'll Learn | Aaj Ki Seekh
- [ ] Zero trust: identity-as-boundary, workload identity, conditional access
- [ ] Supply chain: SBOM generation, SLSA levels, cosign sign/verify
- [ ] Scanner gates in pipeline: Trivy (image), Snyk/Grype (deps), gitleaks (secrets)
- [ ] Policy-as-code: Kyverno (validate/mutate/generate) aur OPA/Rego basics
- [ ] Azure Policy + Defender for Cloud for AKS/Arc (CIS benchmarks, ASC)
- [ ] Compliance basics: ISO 27001, NIST 800-53, PCI DSS — controls not checkbox
- [ ] CRI dashboard + compliance monitoring setup
- [ ] Release-gating: SBOM + sign + policy → Prod
- [ ] GRAND CAPSTONE plan: portfolio story structure + 5-min exec demo + docs
- [ ] Incident ticket: policy violation at deploy caught in pipeline

## Full Topic (LEARN) | Puri Detail

### 1. Zero Trust — Identity Is the Boundary
No network trust, **verify every call**:
- **Identity as boundary**: every component gets a (workload) identity, not static secrets. Kubernetes/Azure: **workload identity** (Azure AD) — pod gets identity via federated credential, no secret in pod/files.
  ```bash
  az identity create --name app-id --resource-group rg-platform
  az aks pod-identity ... # ya workload identity federation:
  az identity federated-credential create --identity-name app-id -g rg --name aks-federated \
    --issuer https://oidc.prod-.../oidc-issuer --subject system:serviceaccount:payments:sa
  ```
- **Conditional access**: policy-driven trust — MFA for admins, restricted IPs, device compliance — applied to platform admin surface (subscription/OID console).
- **Principle chain**: authN (identity) → authZ (RBAC/ABAC policy) → verify (provenance + vulnerability) → least privilege.
- Workload identity → no certs/manual secrets in k8s; **External Secrets Operator** can still revoke/rotate central vaults.

### 2. Supply Chain Security (SBOM, SLSA, cosign)
Pipeline = attack surface (SolarWinds, CodeCov, XZ Utils lessons).
- **SBOM**: list of software packages+deps — generate and publish artifact. Tools: `syft`, `cyclonedx`, Azure ACR `sbom` feature.
  ```bash
  syft image myapp:2.1.0 -o spdx-json > sbom.spdx.json
  az acr sbom create --repository myapp --image v2.1.0 --output ./sbom.json
  ```
- **SLSA** (Supply-chain Levels for Software Artifacts) L1-L4: build provenance + reproducible + security measure. Target baseline L3 (build source tracks, hermetic-ish, provenance attestation).
- **cosign** (sigstore): sign and verify container images:
  ```bash
  cosign sign --key cosign.key registry/myapp:v2.1.0
  cosign verify --key cosign.pub registry/myapp:v2.1.0
  # keyless (sigstore OIDC) trending in 2026:
  cosign sign --yes registry/myapp:v2.1.0   # keyless via GitHub OIDC
  cosign verify registry/myapp:v2.1.0 --certificate-identity ...
  ```
- **Gate in CI**: after build → sign → gate on `cosign verify` in prod deploy step.
- **Provenance**: in-toto/slsa attestation checksum; store in registry (OCI layout), reference in deployment.

### 3. Scanning Gates (pipeline stops, not reports)
| Stage | Tool | Gate |
|-------|------|------|
| Secret scan (pre-commit/CI) | gitleaks/trufflehog | fail on secrets |
| Dependency vuln (CI) | Snyk / `npm audit` / Grype | fail over CRITICAL |
| Image vuln (CI) | Trivy/Grype | fail on CRITICAL/HIGH fixed |
| License/policy | OPA/Checkov / budget | fail on policy |
| Boot image | cosign verify | fail unsigned |
```yaml
# pipeline gate (azure-pipelines / GH Actions):
- task: Docker@2   # "trivy image" step
  displayName: 'Trivy scan gate'
- bash: |
    trivy image --severity CRITICAL,HIGH --exit-code 1 --ignore-unfixed $(IMAGE)
```
Dependency scanning in dev + prod; scan pinned lockfiles. **Secrets never in logs.**

### 4. Policy-as-Code: Kyverno & OPA
- **Kyverno** (K8s-native admission): validate/mutate/generate/config via YAML policy:
  ```yaml
  apiVersion: kyverno.io/v1
  kind: ClusterPolicy
  metadata: { name: require-labels }
  spec:
    validationFailureAction: Enforce
    rules:
      - name: require-team-label
        match: { resources: { kinds: ["Deployment"] } }
        validate:
          message: "Every deploy must have app.kubernetes.io/team label"
          pattern:
            metadata: { labels: { "app.kubernetes.io/team": "?*" } }
  ```
  More policies: **deny `latest` tag**, **deny privileged containers**, **deny external registries** (image pull whitelist by regex), enforce `requests/limits`, default network-policy generator.
- **OPA/Gatekeeper** (Rego, generic policy) — for anything non-K8s too: TF plans (`conftest`/OPA on Terraform), cloud policy, config.
  ```rego
  deny[msg] {
      input.kind == "Deployment"
      not input.metadata.labels["app.kubernetes.io/team"]
      msg = "Deployment missing team label"
  }
  ```
- 2026: Kyverno popular as native-K cli (raw YAML, fast); Gatekeeper stays in estates with OPA boring already. Both run as admission webhooks — keep a "dry-run/audit" turnaround before enforce.

### 5. Azure Policy + Defender for Cloud
- **Azure Policy** (subscription-level governance): apply to AKS — "no public access", "require tags", "enforce latest k8s version", "no privileged containers"; on Arc clusters via extensions.
- **Defender for Cloud** (CSPM for Azure): agentless scanning, AKS security posture (CIS AKS benchmark), vulnerability assessments, recommendation pipeline; enable **Defender Cloud Security Posture Mgmt** for compliance view.
- **CRI (Container Runtime) dashboard**: Defender/pod security — container-running inventory, vulnerabilities to image location.
- Compliance evaluation: Defender policy → ISO/NIST/PCI mapping out-of-box, generates **compliance dashboard** for auditors.

### 6. Compliance Basics (ISO/NIST/PCI — senior commonsense)
- **ISO 27001**: ISMS; controls = policies/processes (A.8 asset, A.9 access, A.12 ops, A.16 incident). Strategy: run controls, evidence via automation (audit logs, policy reports).
- **NIST 800-53 / CS**: catalog scenarios; use **SP 800-53 rev5 + 800-218 (secure software dev)** as source; AKS mapping docs.
- **PCI DSS 4.0**: cardholder data only — network segmentation, FIM, log retention, access controls; separate flows for card data (tokenization), least-necessary scope.
- Practical: docs assets → compliance matrix (control → evidence → owner); automation gives evidence (policy reports, audit logs, cosign signature, SBOM). **Don't fake-compliance — evidence data is the ask.**
- Least privilege, SSRF surface reduction, managed RBAC everywhere.

### 7. GRAND CAPSTONE — Your Platform Story
Production "engineer" demo — combines all Phase 6 into one coherent system. Structure:
1. **IDP** (Day 31-33): Backstage + golden-path template (service scaffold → CI → Helm → cost + SLO links).
2. **GitOps** (Day 35-36): ArgoCD app-of-apps/flux multi-env, 2 clusters, failover pattern.
3. **SLO** (Day 37): platform SLO + burn-rate alerts + Grafana SLO panel.
4. **Observability** (Day 38): OTel auto-instruement, traces/logs/metrics correlated (Tempo/Loki/Grafana).
5. **FinOps** (Day 39): tags, budget alert, Kubecost dash, unit cost.
6. **Security** (Day 40): SBOM + cosign sign/verify + Trivy gate + Kyverno labels/limits policy + Defender/Azure Policy compliance view.

**5-min Exec Demo script** (the "wow" arc):
- 0:00 Customer pain → platform promise (paved road).
- 1:00 Backstage catalog + template → new service created in 2 min.
- 1:45 GitOps sync to 2 clusters (ArgoCD app/tree health).
- 2:30 Pipeline: test → image → sign (cosign) → SBOM → gate → prod.
- 3:15 SLO + burn-rate panel + cost panel (Kubecost) + security policy report.
- 4:15 Failover/firecracker: kill cluster → app survives via GitOps/canary + dashboards healthy.
- 4:45 Ask/next-steps.
Documentation (repo): architecture, ADRs, runbooks, incident log, security controls matrix.

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `az identity create; az identity federated-credential create ...` | workload identity |
| `syft image myapp:v2 -o spdx-json > sbom.json` | SBOM generate |
| `cosign sign/verify --key key registry/img:v2` | sign/verify |
| `trivy image --severity CRITICAL,HIGH --exit-code 1 image` | vuln gate |
| `gitleaks detect --source . -v` | secret scan |
| `syft`/`sbom trace` + `cosign attest` | provenance attest |
| Kyverno `kubectl apply -f policy.yaml` | validate/mutate |
| `kubectl kyverno test ./policy` (kyverno CLI) | local improv |
| `conftest test -p policy/ plan.json` (OPA→TF check) | policy for deliverable |
| `az policy assignment create --policy ...` | Azure policy |
| `az security assessment list` | defender posture |

## Practice Lab | Abhi Karein
10-12 steps (kind/aks + local kyverno + cosign):
1. Build demo image: `docker build -t myapp:v2.1.0 .`
2. Trivy gate: `trivy image --severity CRITICAL,HIGH --exit-code 1 myapp:v2.1.0` → record output (exit 0/1).
3. `syft myapp:v2.1.0 -o spdx-json > sbom.json` + open SBOM (look license names).
4. cosign keypair: `cosign generate-key-pair`; `cosign sign --key cosign.key ...` (or keyless with OIDC).
5. `cosign verify --key cosign.pub myapp:v2.1.0` → success output.
6. Install Kyverno (`kubectl create -f .../release/v1.x/install.yaml`), apply `require-team-label` ClusterPolicy + `deny-latest-tag`.
7. Deploy missing label → retry blocked: `kubectl create -f hopfails.yaml` → error message (message from policy).
8. Fix deploy: add `app.kubernetes.io/team: demo`, apply → succeeds. Check `kubectl get clusterpolicy` status `ready`.
9. Gatekeeper/OPA optional: write simple Rego file + `conftest test -p policy/ deployment.yaml` (learning mode).
10. Azure Policy (if subscription): assignment "Require tag on resource groups" → review.
11. Scan secrets: `gitleaks detect --source .` → 0 (or 1 fake → add fix).
12. **Capstone-start**: scaffold repo with README sections (architecture, security controls, SLO, cost) + write 100-word demo transcript.
Expected outputs: `cosign verify` OK; kyverno blocks bad deploy + message; sbom.json + gitleaks clean; pipeline gates wired in repo; GRAND CAPSTONE scaffold first draft.

## Real Incidents | Ek "Platform" Problem

### PLAT-040 · Secret in Image + Kyverno Bypass → Pipeline Flippancy
- **Situation:** Production deploy failed at 03:30. Pipeline gate reports: Kyverno `require-team-label` Enforce blocked a Deployment; meanwhile separate smoke-para detection: a debug image contained hardcoded DB credential (leaked to logs). Two incidents, one theme — pipeline "security theater" flapped because gates were configurable-off (manual override).
- **Investigate:**
  ```bash
  kubectl get clusterpolicy require-team-label -o yaml   # validationFailureAction?
  kubectl get deploy -A --selector '!app.kubernetes.io/team'  # count offenders
  trivy image --severity CRITICAL app:8.0.9-debug          # debug image
  gitleaks detect gitleaks.toml --source ./helm/charts/    # in repo leak
  kubectl audit logs ...  # who changed policy / bypass
  ```
- **Root cause:** (1) `require-team-label` was **Audit** mode → advisory, not block; (2) `latest` tag policy conflict/false sense; (3) debug image `8.0.9-debug` pushed with plaintext DB creds via env → leaked in cloud logs; 4 the "override" runbook bypass-gate is a bad habit.
- **Fix:** (1) Switch policy to **Enforce** (`validationFailureAction: Enforce`), add `deny-latest`; (2) rotate DB password + remove file from image / EVS (ExternalSecret), force `cosign verify` + signed provenance in deploy gate; (3) add Secret-scan & SBOM check to CI (build blocks); (4) audit: attacker attempted exploit of pod env → patch, defense-in-depth.
- **Verify:** `kubectl create` unlabeled / `:latest` deploy → blocked with message; `trivy`/`gitleaks` green; `cosign verify` green; secret gone from image/labels; 30-day no undeployed "leak event" alert.
- **Prevent:** Policy Enforce for critical, gate immutability (pipeline cannot override), secret-rotation drill, **monthly compliance report** (SBOM evidence + policy + cosign), never push debug creds — separate build profile.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q: Zero trust in practice for platforms?**
A: Perimeter died; treat every org unit as **untrusted**. Identity = workload identity (no static secrets, federated OIDC), authN via OIDC+conditional access (MFA/device/IP), authZ least privilege RBAC, then **policy verify** + provenance. Continuously authorize, not just at entry.

**Q: cosign sign/verify — why?**
A: Signs artifact provenance so deploy gate can **verify identity** — prevents malicious/unauthorized image injection. Keyless (sigstore OIDC) modern 2026: no key mgmt burden. Gate: block unsigned/UNTRUSTED in pipeline; verify cha definitely in release stage.

**Q: Kyverno vs OPA/Gatekeeper — choice?**
A: Kyverno = K8s-native (YAML), easier adoption (validate/mutate/generate, name/value loops), rapidly popular. OPA/Gatekeeper = generic-registered (Rego) — works TF/cloud too; teams with non-K8s policy needs pick it. Both admission; often estate uses both for different scope. Choose per need: domain (K8s) → Kyverno; multi-tool policy → OPA.

**Q: How to prove compliance without checkbox-fake?**
A: **Evidence automation** — policy reports, audit logs, signed SBOM + provenance, Defender/CSPM dashboard, image vulnerability scans. Design SOP: control → evidence → owner → auto-collect in repo (compliance-matrix.md). Prove-to-auditor by demos, not documents.

**Q: Supply chain SLSA L3 — what does it truly require?**
A: L3: build scripts source-referenced, **signed provenance** (attestation of build steps), **hermetic-ish validations** + platform-level isolation, per-plac generated. In practice: trusted build service, provenance artifact stored, deploy gate verifies cosign attest + provenance match image SHA.

## Quick Notes | Yaad Rakhna
- Zero trust = identity is boundary; workload identity, conditional access, least privilege
- Paved path: SBOM + SLSA + cosign — sign your own images & verify
- Scanners gate the pipeline (fail CI), never user-reports
- Kyverno (native K8s YAML) vs OPA (Rego genericized) — pick by domain scope
- Azure Policy + Defender/CSPM give compliance evidence dashboards
- ISO/NIST/PCI = automated controls + audit evidence, not checkbox audit
- **GRAND CAPSTONE**: IDP → GitOps → SLO → OTel → FinOps → Security, all connected + exec 5-min demo + repo docs

## Next | Aage Bolte Jaana
Capstone complete! Phase 6 (Day 31-40) poora — ab apni 5-saal wali **platform story** portfolio me push karo. Aage jaise aaye: advanced topic drills ya dusre tracks:
→ `day-41-disaster-recovery-backup.md` (optional senior deep-dive)