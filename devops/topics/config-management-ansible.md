# Deep Dive: Ansible — Configuration Management (IaC Ka Doosra Haath)

> **Kaha ka hai:** Day 22 (Terraform) + Day 13 (scripting) ka counter-part. **Terraform = infra banao**, **Ansible = bane hue servers pe software install/configure/tune karo**. Production me dono sath chalti hain. Ye gap hai to 'full DevOps' nahi.

---

## 1. Terraform vs Ansible vs Shell — Kab Kya (Interview Core)

| Tool | Kya Karta | Idempotent? | State? |
|------|-----------|-------------|--------|
| **Shell** | Commands chalao | ❌ (always runs) | ❌ |
| **Ansible** | Config/photos banao, packages, services, files | ✅ (declared state) | User-defined (behind) |
| **Puppet/Chef** | Agent-based CM | ✅ | Server-side |
| **Terraform** | Cloud infra (VM, VNet, LB) | ✅ | State file |
| **CloudFormation** | AWS infra declarative | ✅ | AWS stack |

**Simple line (interview):** *"Terraform creates the VM; Ansible makes it A server — installs nginx, tunes ufw, copies configs, runs systemd. Shell is the notebook; Ansible is the textbook."*

| Task | Terraform | Ansible |
|------|-----------|---------|
| Create VM | ✅ `azurerm_linux_virtual_machine` | ❌ (call cloud module/plugin) |
| Install nginx | ❌ (na) | ✅ `apt:` / `dnf:` |
| Manage user/ssh | Partially | ✅ `user:`, `authorized_key:` |
| Configure app config | ❌ | ✅ `template:`, `lineinfile:` |
| Run scripts one-time | ❌ | ✅ `command:`/`script:` |
| Revert/idempotent | ✅ | ✅ |

---

## 2. Architecture — Agent-Less Pyara (SSH Only)

```
Control node (jaha ansible hai)
    │  SSH (port 22, key auth)
    ▼
[ host-1 ] [ host-2 ] [ host-3 ]   (targets — Linux/Windows/WSL)
```

**Key points:**
- **Agent-less** — target pe kuch install nahi karna (vs Puppet/Chef)
- Configuration push (playbook) tarah-push model
- Inventory = hosts + vars (`/etc/ansible/hosts` or any file)
- Modules = idempotent (apt, service, copy, template, yum)
- Ansible facts = auto-discovered system info

---

## 3. Setup + Inventory

```bash
# Control node pe:
sudo apt install ansible -y        # or pip3 install ansible
ansible --version

# hosts inventory (YAML/INI)
cat > inventory.ini <<'EOF'
[webservers]
web1.example.com ansible_host=10.0.0.11 ansible_user=devops
web2.example.com ansible_host=10.0.0.12 ansible_user=devops

[dbservers]
db1.example.com ansible_host=10.0.0.20

[all:vars]
ansible_python_interpreter=/usr/bin/python3
EOF

ansible-inventory -i inventory.ini --list
```

---

## 4. Ad-Hoc Commands — Quick Actions Bina Playbook

```bash
# Ping (SSH + python check)
ansible all -i inventory.ini -m ping

# Commander 1-line (module: command/apt/service/shell)
ansible webservers -i inventory.ini -m apt -a "name=nginx state=present" -b
ansible webservers -i inventory.ini -m service -a "name=nginx state=started enabled=yes" -b
ansible all -i inventory.ini -m shell -a "uptime"
```

| Module | Use |
|--------|-----|
| `ping` | Connectivity |
| `apt`/`yum`/`dnf` | Package install/remove |
| `service`/`systemd` | Start/enable service |
| `copy` | File copy |
| `template` | Jinja template -> file (vars bharke) |
| `lineinfile` | File ke me line add/change |
| `user` / `group` | Users/groups manage |
| `shell`/`command` | Raw command (non-idempotent — careful) |

---

## 5. Playbook — Kuch Toh Karta Hona Chahiye

```yaml
---
- name: Install and configure nginx on webservers
  hosts: webservers
  become: yes                      # sudo mode
  vars:
    app_env: production
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
        update_cache: yes
    - name: Ensure service is running
      service:
        name: nginx
        state: started
        enabled: yes
    - name: Deploy index page
      template:
        src: index.html.j2
        dest: /var/www/html/index.html
      notify: restart nginx        # handler trigger handle change

  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted

  # Optional: verify
  post_tasks:
    - name: curl check
      uri:
        url: "http://localhost"
        status_code: 200
```

**Run karo:**
```bash
ansible-playbook -i inventory.ini playbook.yml
ansible-playbook -i inventory.ini playbook.yml --syntax-check   # dry check
ansible-playbook -i inventory.ini playbook.yml --check          # dry-run
ansible-playbook -i inventory.ini playbook.yml --tags nginx
```

**Template file (Jinja2):**
```html
<!-- index.html.j2 -->
<h1>Welcome {{ app_env }} on {{ ansible_hostname }}</h1>
```

---

## 6. Handlers, Tags, Vault, Facts

**Handler = "notified task"** — koi task change hua tabhi chalta (nginx restart tab jab conf badla).
```yaml
notify: restart nginx   →  handlers: restart nginx (runs once, only on change)
```

**Tags** — selective run:
```yaml
tasks:
  - { name: ..., apt: {name: nginx}, tags: [web] }
  - { name: ..., service: {...},  tags: [web] }
```
```bash
ansible-playbook ...  --tags web        # only web tasks
ansible-playbook ...  --skip-tags debug
```

**Vault = encrypted vars (secrets!):**
```bash
ansible-vault create secrets.yml
ansible-vault view secrets.yml
ansible-playbook -i inventory.ini playbook.yml --ask-vault-pass
```

**Facts** (auto):
```bash
ansible webservers -i inventory.ini -m setup | head   # OS, IP, mounts, cpu...
# playbook me: 'os family: {{ ansible_os_family }}' → CentOS vs Ubuntu condition
```

---

## 7. Roles — Playbooks Ko Structure Do

```
roles/
  nginx/
    tasks/main.yml
    handlers/main.yml
    templates/index.html.j2
    vars/main.yml
    defaults/main.yml
    meta/main.yml
```

```bash
# Role init
ansible-galaxy init roles/nginx
# Use
ansible-galaxy install geerlingguy.nginx    # community roles
```

**Playbook jo role use kare:**
```yaml
- hosts: webservers
  roles:
    - role: nginx
      app_env: production
```

---

## 8. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **Playbook host unreachable** | SSH key/port/user | `ansible_user`, `--private-key`, test `ssh host` manually |
| **`connection refused` python3** | Target me python nahi | Set `ansible_python_interpreter=/usr/bin/python3` (or python2) |
| **Not idempotent** | `shell:` module har baar runs | Prefer modules (apt/service/copy); shell se `creates:` guard |
| **Secrets leak in play repo** | vars hardcoded | `ansible-vault` env vars, external `--extra-vars` file |
| **Slow (many hosts)** | Serial? parallel? | Ansible default 5 forks — `--forks 50`, `serial: 5` for rolling |
| **Different distros (Ubuntu+CentOS)** | apt vs dnf | Facts (`ansible_os_family`) + `when:` per-family |
| **Order of deploy tasks wrong** | `import_playbook` again | Playbook blocks ordered; separate plays per role |
| **Rollback** | Badi change nothing | Version tag in template (blue-green-style), `--check` pehle |

---

## 9. Interview Questions — Ansible

| Question | Strong Answer |
|----------|---------------|
| "Ansible vs Terraform?" | Terraform=cloud infra (VM/VNet/LB, state file); Ansible=server config (packages, services, files, idempotent playbooks). Complementary, not competing. |
| "Agent-less ka matlab?" | SSH-based push; no daemon on target. Simpler burst/edge, but target pe python+ssh needed. |
| "Idempotency?" | Playbook dobara run = same result; only changed state triggers handlers. Prefer modules over `command`. |
| "Handler kab chalta?" | Notified change ke baad, ek baar, play end pe. For config-reload. |
| "Vault kya?" | Encrypted file for secrets (`ansible-vault`); password/file-key encrypted. |
| "Roles kyun?" | Reusable, testable, community library; separate tasks/handlers/templates/vars. |
| "Fork/rolling deploy?" | `--forks` parallel; `serial: N` rolling batch (troubleshoot midway). |
| "Cross-distro?" | Use facts + `when: ansible_os_family`. |

---

## 10. Hands-On Lab (Local — Docker targets)

```bash
# 0. Install
sudo apt install ansible -y || pip3 install ansible

# 1. Local inventory + ad-hoc
cat > inv.ini <<'EOF'
[all]
localhost ansible_connection=local
EOF
ansible all -i inv.ini -m ping

# 2. Playbook banao
mkdir -p ~/anslab && cd ~/anslab
cat > play.yml <<'EOF'
---
- name: Setup nginx + index
  hosts: all
  become: yes
  tasks:
    - name: install nginx
      apt:
        name: nginx
        state: present
        update_cache: yes
    - name: deploy page
      copy:
        content: "<h1>Hello Ansible {{ ansible_hostname }}</h1>"
        dest: /var/www/html/index.html
    - name: start
      service: { name: nginx, state: started, enabled: yes }
EOF
ansible-playbook -i inv.ini play.yml
curl -s localhost | grep Ansible

# 3. Idempotency prove
ansible-playbook -i inv.ini play.yml    # "ok" not "changed"
```

---

## 11. Summary | Yaad Rakho

1. Terraform = infra; **Ansible = server state**; shell = baat karne wala
2. Agent-less, push, SSH, Python
3. Inventory = groups + vars; ad-hoc = ek-line
4. Playbook (YAML): hosts + become + vars + tasks; handlers = notify
5. Modules idempotent (apt/service/copy/template) — `command` se bacho
6. Vault = secrets encrypted
7. Roles = reusable os-level components (`ansible-galaxy`)
8. `--check`, `--syntax-check` pehle; `--forks` parallel; `serial:` rolling

---
**Related:** [Day 22](../day-22-terraform-azure-iac.md) · [What is IaC](../topics/what-is-iac.md) · [Advanced Scripting](../day-13-advanced-shell-scripting-automation.md) · [systemd Services](../topics/linux-systemd-service-management.md)