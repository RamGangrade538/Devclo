# Deep Dive: Cloud & Network Security Architecture — Zero Trust, IAM, Sentinel, Compliance

> **Kaha ka hai:** Day 49 ka gahra version. Security = layered (identity → network → app → data → people). Zero Trust replaces the perimeter. Proof on Azure but patterns universal.

---

## 1. Zero Trust — The Pillars

| Principle | Translate to Azure |
|-----------|--------------------|
| **Never trust, always verify** | Every request authenticated (Entra OIDC + MFA/CA), not "VNet = trust" |
| **Use least privilege** | RBAC least privilege + PIM (JIT) elevation; deny-by-default NSG |
| **Assume breach** | Logs everything; detect laterally; segment; quick revoke |
| **Verify explicitly** | Conditional Access: device + location + risk requirements |

**Trust zones:** Identity is now perimeter — inside VNet ≠ trusted; per-service micro-perimeter enforcement (auth policy + NSG on each tier).

---

## 2. IAM Deep — Entra ID, RBAC/ABAC, PIM

```
IDENTITY (directory):
  Entra ID (Azure AD) = identity source; MFA enforced for ALL admin
  Conditional Access: "block if untrusted device", "require MFA on risky sign-in"
  Service principals/OIDC for workloads (no passwords)
AUTHORIZATION:
  RBAC roles (Owner/Contributor/Reader + custom): least priv on resource groups
  ABAC (attribute-based): risk/conditions on top of role
  PIM = just-in-time access: elevate to privileged role for N hours, multi-step approval,
        audited — no permanent "always-on admin"
```
**Golden rule:** admin roles = PIM only; define scopes (subscription/resource group), don't use global owner by default; audit via Entra sign-in logs + role assignments.

---

## 3. Network Security Architecture (Layered)

```
Externally:
  Internet → FrontDoor/WAF (edge) → APIM (API) → internal NVA/ASG zones
Internal (Azure native):
  Hub (Firewall/ER, shared svcs) — Spoke VNets (workloads)
  Subnets split by tier (web/app/data/gateway-subnet/Bastion subnet)
  NSG on every subnet: default-deny `DenyAll` rule bottom; allow only needed src→dst/port
  Private Endpoints for PaaS (no public IP at all) + Private DNS
East-West:  NetworkPolicies (k8s default-deny) + service mesh mTLS (optional)
Management:  no public RDP/SSH — Azure Bastion (browser tunnel); agent-level
```
Deliberations:
```
- NSG = first line (stateless L3/L4); if app grw, Gateway/mesh does L7
- Public: WAF + rate-limit; never expose DB/storage publicly (private endpoint + firewall)
- Multi-tier: DB only allow app subnet, not internet
- Route traffic via hub firewall for egress filtering (allowlist egress)
```

---

## 4. Data & Encryption

- **At rest:** Azure SSE by default; use **CMK/Key Vault** for compliance (customer-managed keys); transparent (SSE=C envelope), plus **Field-level** for regulated data
- **In transit:** TLS 1.2+ everywhere; cert-manager/cert rotation; HSTS
- **Keys/certs/secrets:** Key Vault standard+soft delete/purge protection; policy enforce
- **Data privacy:** mask/PII tokenization; DLP/BLUR where needed; classify data

---

## 5. Monitoring & Response — Defender + Sentinel (SIEM/SOAR)

```
COLLECT:
  Entra ID sign-in + audit logs, Azure Activity, Defender alerts, NSG flow logs, DNS logs
DETECT (Defender for Cloud): misconfig + vulnerability + threat detection (containers, VMs, PAAS)
CORRELATE & ALERT (Sentinel = SIEM): analytic rules (impossible travel, PIM never used)
RESPOND (SOAR playbooks): auto-actions (block user, revoke tokens, quarantine VM) via Logic Apps
Audit trail: everything → Log Analytics → archive (retention), compliance reports
```
```bash
az security contact create --name default --email sec@example.com \
  --minimal-severity High --email-notifications on
az monitor log-analytics workspace create -g rg -n law-sentinel
# Sentinel: portal → connect data connectors (Entra, Activity, Defender) → build rule + playbook
```
**Rules to start with:**
```
- Failed MFA / unusual locations
- Role assignment changes (privilege escalation alert)
- Storage/DB public-network enablement (anomaly)
- PowerShell/scripted mass changes
- PIM activation outside window
- Egress to known-bad IPs
```

---

## 6. Compliance — Policy + Defender + Audits

```
Azure Policy = guardrails at scale: 
  - Deny public storage, deny open ports, enforce tags, require HTTPS
  - Initiatives: CIS, PCI-DSS, HIPAA, SOC2 (built-in)
Defender regulatory dashboard: continuous score vs standards
Evidence: audit logs archived; reports exported for certificates
```
**Policy-only-then-Deny** philosophy: `Audit` first → see deviation → `Deny` → Auto Remediation (`DeployIfNotExists`) for drift corrected.

---

## 7. Response Runbook — Incident Handling

```
Detect (Sentinel) → Triage (severity/scope) → Contain (revoke, block, quarantine)
 → Eradicate (patch/revert) → Recover (clean restore) → Validate + Document
Playbooks (SOAR) automate the first steps; postmortem updates playbooks.

Key responses:
  - User compromised: Conditional Access block + token revoke + reset MFA
  - Storage exposed: private endpoint + firewall + SAS revoke + enable Defender alert
  - VM malicious: isolate (NSG quarantine) + snapshot forensic + malware scan
```

---

## 8. Interview Questions — Cloud Security

| Question | Strong answer |
|----------|---------------|
| "Zero trust?" | Verify identity (MFA/CA), least privilege, assume breach, segment, log everything — no implicit trust inside network. |
| "PIM?" | Just-in-time privileged access: elevate admin roles temporarily w/ approval + audit vs permanent "always-on" admins. |
| "NSG default-deny?" | Final DenyAll rule; explicit allows only. Combined with Bastion (no SSH to internet), private endpoints for PaaS. |
| "WAF vs NSG?" | WAF L7 app-layer (SQLi/XSS) at edge; NSG L3/L4 network filter. Both used — different layers. |
| "Encryption?" | SSE at rest by default, CMK for compliance, TLS1.2+ in transit, Key Vault holds keys; secrets via workload identity. |
| "Sentinel?" | SIEM collecting Entra/Azure/Defender, analytic rules + SOAR playbooks; audit + incident response hub. |
| "Policy vs Defender?" | Policy = prevention at scale (deny/audit/auto-remediate); Defender = detection + posture + recommendations. Complement. |
| "Assume breach design?" | Least privilege + logs to SIEM + blast-radius segmentation + instant revoke path readiness (keys, identities, NSGs). |

**Related:** [Day 49](../day-49-cloud-network-security.md) · [Azure VNet Deep Dive](../topics/azure-vnet.md) · [DevSecOps](../topics/devsecops.md) · [Supply Chain](../topics/supply-chain-security.md)