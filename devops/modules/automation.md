# ⚡ Automation — Cron, Scripts, Orchestration & Bots

> **Hinglish:** DevOps ka dham: **repeat koi kaam nahi** — automate. Cron/scheduled jobs, bash/python scripts, CI/CD, Ansible/playbooks, Rundeck jobs, slack bots, event-driven automation. Ye module end-to-end automation thinking cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Automation = repeated manual ops ko machine se karna. Har layer pe hai: **code automation** (bash/python scripts), **scheduled jobs** (cron, workflow engines like Airflow/Temporal), **infra provisioning** (Terraform/Ansible), **delivery** (CI/CD), **environment health** (self-healing scripts/bots), **event-driven** (webhook/queue consumer → auto action).

Core ideas: **idempotency** (baar chalao → same result), **determinism** (har baar same output), **trigger types** (time/schedule, event, manual), **orchestration vs choreography**, **failure handling** (retry, DLQ, alerts), **logging/traceability**, **maintainability** (documented scripts).

## 🟢 Beginner — Shuruaat yahan se

- Cron syntax — `* * * * *`.
- Bash/python script: backup, cleanup, report.
- Idempotency logic — kya "baar baar safe".
- Timeout + logging in scripts.

## 🟡 Intermediate — Ab orchestrate karo

- **Workflow engine** — dependencies, retries, states (Airflow/Temporal).
- **Ansible playbook** — config automate.
- **Event-driven trigger** — queue → auto action.
- **Secrets in automations** — env + vault.
- **Choreography vs orchestration** — design choice.

## 🔴 Advanced — Pro bano

- **Self-healing automation** — health check → auto-restart.
- **Robust retries + DLQ** — failure isolation.
- **Runbooks as automation** — incident auto-response.
- **Bots (Slack/Teams)** — chat to /operation.
- **Automation registry** — discoverable, tested, owned.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Idempotency** — re-run safe, same result.
- [ ] **Determinism** — predictable execution.
- [ ] **Cron** — time-based triggers.
- [ ] **Event-driven** — triggers from events.
- [ ] **Orchestration** — central controller.
- [ ] **Choreography** — decentralized events.
- [ ] **Workflow retries** — transient failures re-run.
- [ ] **Timeouts** — no infinite hangs.
- [ ] **Secrets injection** — no hard-coded keys.
- [ ] **Logging** — every run traceable.
- [ ] **Alerting on failures** — auto-notify.
- [ ] **Dead-letter queue** — unprocessable queue.
- [ ] **Self-healing** — auto-recovery scripts.
- [ ] **Scheduled jobs** — nightly batch runs.
- [ ] **CI/CD automation** — build/deploy auto.
- [ ] **Ansible/config automation** — desired state.
- [ ] **Monitoring hooks** — automation telemetry.
- [ ] **Runbooks** — documented procedures.
- [ ] **ChatOps** — bots control ops.
- [ ] **Infrastructure as Code** — infra auto-managed.
- [ ] **Environment parity** — same automation everywhere.
- [ ] **Cost of automation** — when worth automating.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use karo |
|---|---|---|
| cron / systemd timers | Basic scheduler | Simple time jobs |
| Airflow / Temporal | Workflow engines | Complex DAGs/states |
| Ansible | Config automation | Desired state mgmt |
| Kubernetes CronJob | K8s scheduler | In-cluster batch |
| Rundeck | Ops jobs | Runbook automation |
| Slack Bots (Bolt etc) | ChatOps | Ops interaction |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Cron Job:** Nightly backup + cleanup + email/report script; test run safe.
- [ ] **Lab 2 — Ansible Playbook:** Install + configure Nginx idempotent playbook; chaos re-run no change.
- [ ] **Lab 3 — Event-Driven:** File/queue event trigger → processing pipeline auto.
- [ ] **Lab 4 — Self-Healing:** Health check script — unhealthy → restart + alert + log.
- [ ] **Project — Ops Bot:** Bot accepts command, runs automation, posts result; full manual ops removed.

## 🔗 Related Topics

- [🤖 AIOps](../modules/aiops.md)
- [⚙️ CI/CD](../modules/cicd.md)
- [🤖 Ansible & Config Management](../modules/config-management.md)
- [Automation & Scripting](../topics/python-automation-scripts.md)
- [Day 13 — Advanced Shell Scripting & Automation](../day-13-advanced-shell-scripting-automation.md)