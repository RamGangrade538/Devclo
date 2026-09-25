# 🪪 IAM — Identity & Access Management

> **Hinglish:** IAM = "kaun hai (identity) aur kya khol sakta hai (access)". Users, groups, roles, policies, service accounts, SSO, OAuth/OIDC, SAML, RBAC — ye sab isi ka hai. Cloud me IAM hi sabse pehla security layer hai.

## 📖 Overview — Ye Topic Kya Hai

Har access decision ke 2 chhote sawaal: **Authentication** (kaun ho?) aur **Authorization** (kya kar sakte ho?). IAM in dono ko manage karta hai — **human users** (console/login) aur **machine identities** (service accounts, workload identity) dono ke liye.

Core building blocks: **Users/Groups** (identities), **Roles** (temporary permission sets), **Policies** (rules JSON/IAM), **Service accounts/workload identity** (machines), **SSO + federation** (ek login sab jagah), **OAuth/OIDC/SAML** (standards), **RBAC/ABAC** (access models), **least privilege** (access philosophy). Interview me ye sabse common topic hai.

## 🟢 Beginner — Shuruaat yahan se

- AuthN vs AuthZ — ek line me farak.
- Users/groups create + basic policy.
- Roles vs policies — difference.
- **Least privilege mindset** — "sirf jitna zaroori".
- Cloud console me IAM pehla resource dekho.

## 🟡 Intermediate — Ab design karo

- **RBAC** — role-based, assign to users/groups.
- **Service accounts + workload identity** — app ke liye.
- **Policy structure** — effect, action, resource, condition.
- **SSO basics** — identity provider, federation.
- **OAuth 2.0 flow basics** — access token, scopes.

## 🔴 Advanced — Pro bano

- **OIDC/SAML** — identity protocols deep.
- **ABAC/policies with conditions** — fine-grained.
- **Federation setup** — external IdP connect (Okta/Azure AD).
- **Privilege escalation prevention** — policy boundaries.
- **Access review automation** — periodic cleanup + audit.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Users** — individual identities.
- [ ] **Groups** — identities ka collection (team).
- [ ] **Roles** — temporary/assumable permission sets.
- [ ] **Policies** — permission rules (allow/deny).
- [ ] **Service accounts** — machine identity (not human).
- [ ] **Workload identity** — K8s/cloud app identity.
- [ ] **Federation** — external identity provider integrate.
- [ ] **SSO** — ek login, sab apps.
- [ ] **OAuth** — delegated authorization (Google login app me).
- [ ] **OIDC** — authentication on top of OAuth.
- [ ] **SAML** — enterprise SSO standard (XML).
- [ ] **RBAC** — role-based access control.
- [ ] **ABAC** — attribute-based (conditions).
- [ ] **Least privilege** — minimal access principle.
- [ ] **MFA** — extra factor mandatory.
- [ ] **Token/credential expiry** — credentials time-bound.
- [ ] **Condition keys** — policies with context.
- [ ] **Access boundaries** — org limits.
- [ ] **Audit trails** — every access logged.
- [ ] **Separation of duties** — design per division.
- [ ] **Policy evaluation order** — explicit deny wins.
- [ ] **Identity federation** — external users map roles.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| AWS IAM / Azure RBAC / GCP IAM | Cloud IAM | Cloud access control |
| Okta / Azure AD / Keycloak | Identity providers | SSO/auth state |
| Keycloak | Open-source IdP | Self-hosted SSO |
| Auth0 / Cognito | Auth service | App authentication |
| CloudTrail / audit logs | Access audit | Governance |
| Vault | Machine/rotate identity | Secret identity mgmt |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Group + Policy:** Group banao, policy attach, member test (eff-what access).
- [ ] **Lab 2 — Role Assume:** Cross-role assume karke temp creds; `assumed-role` session dekho.
- [ ] **Lab 3 — Least Privilege:** Granular policy likho (s3 read only bucket X), extra permission fail test.
- [ ] **Lab 4 — OAuth Mini:** OIDC flow (Auth0/Keycloak) — login → token → API call.
- [ ] **Project — Access Review Report:** Users/roles list + rights report + cleanup recommendations banao.

## 🔗 Related Topics

- [🔐 Security Fundamentals](../modules/security-fundamentals.md)
- [☁️ Cloud Fundamentals](../modules/cloud-fundamentals.md)
- [☸️ Kubernetes](../modules/kubernetes.md)
- [Cloud & Network Security](../topics/cloud-network-security.md)
- [Day 36 — K8s Advanced: Operators & RBAC](../day-36-kubernetes-advanced-operators-rbac.md)