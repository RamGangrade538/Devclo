# 🤖 Ansible & Configuration Management

> **Hinglish:** 50 servers pe nginx ka version update karna hai? Har server pe jaakar manually kabhi nahi — **Ansible** ek place se sabko configure/update/deploy karta hai, **idempotently** (baar-run karo, wahi state maintain rahe). Ye module playbooks, inventory, roles, handlers, aur drift control cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Configuration management ka matlab: servers ko **configure** karna aur unhe **desired state** me rakhna (installed versions, files, services, settings). **Ansible** sabse popular CM tool hai kyunki:
- **Agentless** — kuch install nahi servers pe (SSH hi kaafi).
- **Push-based** — tum command delle, wahi turant run hoti hai.
- **Idempotent** — step baar baar chale, result same.

Core units: **Inventory** (kaunse servers), **Playbook** (kya karna hai — YAML), **Tasks/Roles** (reusable blocks), **Templates** (jinja files), **Handlers** (state change pe chalta action). Ansible site-wide config, app deploy, patch updates sab me use hota hai. Purana ecosystem: Puppet, Chef (agent-based), Salt.

## 🟢 Beginner — Shuruaat yahan se

- Ansible install + `ansible --version`.
- **Inventory** file me servers add karo.
- `ansible -m ping` se connectivity test (ad-hoc).
- Pehla **playbook**: nginx install + start (declare state, check idempotency).

## 🟡 Intermediate — Ab real servers karo

- **Plays/Tasks order**, `become` (sudo), vars, loops, when conditions.
- **Handlers** — service restart only on config change.
- **Templates (Jinja2)** — env-specific config files generate.
- **Roles** — files/vars/tasks/handlers ka pakka structure.
- **Secrets** — vault use karo; configs me password nahi.

## 🔴 Advanced — Pro bano

- **Config drift detection** — repo state vs server reality.
- **Idempotency practices** — register + changed_when.
- **Ansible Tower/AWX** — UI, scheduling, RBAC.
- **Integration with Terraform** — provision via TF, configure via Ansible.
- **Performance** — forks, `--limit`, serial rolling updates.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Ansible** — agentless config mgmt + automation.
- [ ] **Playbooks** — YAML me desired steps.
- [ ] **Inventory** — managed hosts ki list (static/ini ya dynamic cloud).
- [ ] **Roles** — reusable structure: tasks/handlers/templates/vars.
- [ ] **Variables** — host/group/play level values.
- [ ] **Templates** — Jinja2 se dynamic config.
- [ ] **Handlers** — notify "service restart" sirf jab change hua.
- [ ] **Idempotency** — baar-run same result; no side effects.
- [ ] **Configuration drift** — actual vs desired mismatch; auto-fix.
- [ ] **Secrets (Ansible Vault)** — playbook me encrypted data.
- [ ] **Modules** — yum/apt/copy/service/template — repeated actions.
- [ ] **become (sudo)** — privilege escalation.
- [ ] **Loops & conditionals** — with_items, when.
- [ ] **Tags** — playbook ke subset run karna.
- [ ] **Gathering facts** — hosts ki info collect.
- [ ] **Ad-hoc commands** — `ansible -m` quick single task.
- [ ] **Pull vs push model** — Ansible push; Chef/Puppet agent pull.
- [ ] **Puppet/Chef/Salt** — other CM tools; agent-based.
- [ ] **Inventory groups & patterns** — `webservers`, `all`, `!db`.
- [ ] **Rolling update** — serial: ek-ek karke nodes update.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Ansible | Config mgmt + automation | Setup/patch/deploy servers pe |
| Ansible Vault | Secret encryption | Playbook ke secrets secure |
| AWX / Tower | Ansible UI | Scheduling + RBAC at scale |
| Puppet / Chef / Salt | Alternative CM tools | Legacy/enterprise stacks |
| Molecule | Ansible role testing | Local role CI |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First Playbook:** nginx install + config + start; run `--check` aur twice run to see idempotency.
- [ ] **Lab 2 — Templates & Handlers:** Jinja template se nginx config banao; change pe handler se restart.
- [ ] **Lab 3 — Role Structure:** `ansible-galaxy init` se role banao, use karo with vars.
- [ ] **Lab 4 — Vault Secrets:** Vault se encrypted var store karo, playbook me decrypt karke use karo.
- [ ] **Lab 5 — Rolling Update:** Playbook ko `serial: 1` se chalao, nodes ek-ek karke badlo.
- [ ] **Project — Server Roster Automation:** 3 servers setup (nginx + app + db) single role-based playbook se.

## 🔗 Related Topics

- [🐧 Linux](../modules/linux.md)
- [🏗️ Infrastructure as Code](../modules/iac.md)
- [⚡ Automation](../modules/automation.md)
- [Ansible — Config Management](../topics/config-management-ansible.md)
- [Day 22 — Terraform (Azure IaC)](../day-22-terraform-azure-iac.md)