# Deep Dive: Linux File Permissions — rwx Ka Poora Kala

> **Kaha ka hai:** Day 3 ka gahra version. Permissions = security ki **pehli deewar**. Har DevOps engineer ko soye-jagte ye yaad hona chahiye.

---

## 1. Permission Model — Teen Sets, Teen Actions

Har file/directory ke saath **9 permission bits** hote hain (3 sets × 3 actions):

```
-rwxr-xr--  1 user group  4096 Sep 9 10:00 script.sh
 │ │ │ │ │ │
 │ │ │ └── Others (world)
 │ │ └──── Group
 └──────── Owner (user)
```

| Set | Kaun | Bits | Meaning |
|-----|------|------|---------|
| **Owner (u)** | File creator | `rwx` | Full control apni files pe |
| **Group (g)** | Group members | `r-x` | Team collaboration |
| **Others (o)** | Baaki sab | `r--` | Public read-only |

**Actions:**
- **r (read, 4)** — File: content padhna; Dir: `ls` list karna
- **w (write, 2)** — File: modify/delete content; Dir: files create/delete/rename
- **x (execute, 1)** — File: run as program/script; Dir: `cd` enter karna (critical!)

---

## 2. Numeric (Octal) Mode — Quick Math

```
r = 4    w = 2    x = 1
```

| Octal | Binary | rwx | Use Case |
|-------|--------|-----|----------|
| **7** | 111 | rwx | Owner full, scripts, directories |
| **6** | 110 | rw- | Regular files (no execute) |
| **5** | 101 | r-x | Read + enter (dirs), scripts readable not writable |
| **4** | 100 | r-- | Read-only (configs, secrets) |
| **0** | 000 | --- | No access |

**Common Combos:**
```bash
chmod 755 script.sh      # Owner rwx, Group/Other r-x (standard executable)
chmod 644 config.yaml    # Owner rw-, Group/Other r-- (standard file)
chmod 700 ~/.ssh         # Owner only (private keys, SSH dir)
chmod 600 ~/.ssh/id_rsa  # Private key — SSH requires this!
chmod 775 /shared/team   # Team collaboration (group rwx)
chmod 1777 /tmp          # Sticky bit (see below)
```

---

## 3. Directory Permissions — `x` Ka Khas Matlab

| Permission | File Pe | Directory Pe |
|------------|---------|--------------|
| **r** | Read content | `ls` list files |
| **w** | Modify content | Create/delete/rename files **inside** |
| **x** | Execute as program | **`cd` enter + access files inside** |

**Critical:** Bina `x` ke directory **useless** hai — `ls` bhi kaam karega (r se) par `cd` / file access nahi.

```bash
mkdir test && chmod 644 test  # rw-r--r-- (NO x)
ls test        # Works (r)
cd test        # Permission denied! (no x)
cat test/file  # Permission denied!
```

---

## 4. Special Bits — SUID, SGID, Sticky Bit

### SUID (Set User ID) — `4xxx`
- File execute hota hai **file owner ki privileges se** (nahin ki runner ki)
- **Classic:** `/usr/bin/passwd` (root owned, SUID) — normal user password change kar sakta hai
- **Danger:** Agar SUID binary me vulnerability → privilege escalation
- **Set:** `chmod 4755 file` (adds 4 to owner bits)

### SGID (Set Group ID) — `2xxx`
- **On file:** Execute hota hai **file group ki privileges se**
- **On directory (IMPORTANT):** Nayi files **parent directory ka group inherit** karti hain — team folders ke liye essential
- **Set:** `chmod 2775 /shared/team` → group `team` ke members ke files group `team` me bante hain

### Sticky Bit — `1xxx` (Directory pe)
- **Only owner** apni file delete/rename kar sakta hai — **chahe doosre ke pass write permission ho**
- **Classic:** `/tmp` — `chmod 1777 /tmp` (drwxrwxrwt)
- **Indicator:** `t` in others execute position (`rwxrwxrwt`)

**Combined Example:**
```bash
# Team shared folder: group rwx, SGID, sticky
chmod 3775 /shared/team  # 3 = SUID(0)+SGID(2)+Sticky(1) ... wait
# Actually: 1775 = sticky(1) + SGID(2) + 775
chmod 1775 /shared/team  # rwxrwsr-x + sticky on dir
# Result: drwxrwsr-t
```

---

## 5. Default Permissions — `umask`

`umask` = **default permissions subtract karna** (naya file/dir create hote time)

```bash
umask 022    # Default: files 644 (666-022), dirs 755 (777-022)
umask 077    # Private: files 600, dirs 700
umask 002    # Group-friendly: files 664, dirs 775
```

**Permanent:** Add to `~/.bashrc` / `~/.profile`:
```bash
# Team env
umask 002
```

---

## 6. Ownership — `chown`, `chgrp`

```bash
# Change owner
chown user file
chown user:group file
chown :group file          # Only group

# Recursive
chown -R user:group /path

# Reference file se copy
chown --reference=ref_file target_file
```

**Numeric UID/GID bhi chalate hain** (useful in containers):
```bash
chown 1000:1000 /app
```

---

## 7. ACL (Access Control Lists) — Beyond rwx

Standard 3 sets se zyada granular control chahiye to **ACL** use karo:

```bash
# Check ACL
getfacl file

# Set user-specific permission
setfacl -m u:alice:rwx file

# Set group-specific permission
setfacl -m g:developers:rw file

# Set default ACL on directory (inherited by new files)
setfacl -d -m u:alice:rwx /shared/project

# Remove ACL
setfacl -x u:alice file
setfacl -b file            # All ACLs remove
```

**Backup/restore ACLs:**
```bash
getfacl -R /shared > acl.backup
setfacl --restore=acl.backup
```

---

## 8. Capabilities — Fine-Grained Root Powers

Full root dene ke bajay **specific capabilities** do:

```bash
# Check capabilities
getcap /usr/bin/ping
# /usr/bin/ping = cap_net_raw+ep

# Add capability (binary pe)
setcap cap_net_bind_service=+ep /app/server   # Port <1024 bind without root

# Remove
setcap -r /app/server

# List all capabilities
capsh --print
```

**Common Capabilities:**
| Capability | Allows |
|------------|--------|
| `CAP_NET_BIND_SERVICE` | Bind ports < 1024 |
| `CAP_NET_RAW` | Raw sockets (ping, tcpdump) |
| `CAP_SYS_ADMIN` | Mount, namespace, many dangerous ops |
| `CAP_DAC_OVERRIDE` | Bypass file permissions |
| `CAP_SYS_PTRACE` | `strace`, debug other processes |

**Container me:** `docker run --cap-add=NET_BIND_SERVICE --cap-drop=ALL ...`

---

## 9. SELinux / AppArmor — Mandatory Access Control

**SELinux (RHEL/Fedora/CentOS):**
- Labels on files/processes (`user:role:type:level`)
- Policy rules: `allow user_t bin_t : file { read execute };`
- Modes: `Enforcing` (block), `Permissive` (log only), `Disabled`

```bash
# Check status
sestatus
getenforce

# Context dekhna
ls -Z /etc/passwd
# system_u:object_r:etc_t:s0

# Boolean toggle
setsebool -P httpd_can_network_connect 1
```

**AppArmor (Ubuntu/Debian):**
- Path-based profiles
- Profiles in `/etc/apparmor.d/`
- `aa-enforce`, `aa-complain`, `aa-status`

---

## 10. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **SSH key permission denied** | `id_rsa` 644 | `chmod 600 ~/.ssh/id_rsa` |
| **Team can't edit each other's files** | No SGID on shared dir | `chmod 2775 /shared; chgrp team /shared` |
| **`/tmp` files deleted by others** | No sticky bit | `chmod 1777 /tmp` |
| **Docker container can't bind port 80** | Non-root, no CAP_NET_BIND_SERVICE | `setcap cap_net_bind_service=+ep /app` ya `docker run --cap-add=NET_BIND_SERVICE` |
| **New files in shared dir have wrong group** | Missing SGID on parent | `chmod g+s /shared` |
| **`chmod 777` security audit failure** | Over-permissive | Fix to 755/644/700 as appropriate |
| **SELinux blocking nginx** | Wrong context on web root | `restorecon -Rv /var/www/html` |

---

## 11. Interview Questions — Permissions

| Question | Strong Answer |
|----------|---------------|
| "`chmod 755` vs `644` kab use karte ho?" | 755 = executable/scripts/dirs; 644 = regular files. Dir pe `x` zaruri for `cd`. |
| "SUID/SGID/Sticky bit difference?" | SUID=run as file owner; SGID=run as file group (file) OR inherit group (dir); Sticky=only owner deletes in dir. |
| "umask 022 ka matlab?" | Default file 644, dir 755. `umask` subtracts from 666/777. |
| "Private SSH key 600 kyun?" | SSH strict mode: `Permissions too open` error if group/other readable. |
| "ACL vs standard permissions?" | ACL = per-user/per-group beyond owner/group/other. `setfacl`/`getfacl`. |
| "Capabilities kya hain?" | Root privileges ko fine-grained bits me todna (e.g., `CAP_NET_BIND_SERVICE` for port<1024). |
| "Sticky bit `/tmp` pe kyun?" | Multi-user system: user A user B ki file na delete kare, chahe write permission ho. |
| "SGID directory pe kya karta hai?" | Nayi files parent directory ka group inherit karti hain — team collaboration ke liye. |
| "`chmod 777` kyun avoid karte hain?" | World-writable = koi bhi modify/delete kar sakta hai. Security risk + audit failure. |
| "Container me non-root user kyun?" | Root in container ≈ root on host (kernel shared). Escape risk. `USER 1000` in Dockerfile. |

---

## 12. Hands-On Lab

```bash
# 1. Create test structure
mkdir -p /tmp/permlab/{scripts,configs,shared,team}
cd /tmp/permlab

# 2. Script executable
echo '#!/bin/bash\necho "Hello"' > scripts/deploy.sh
chmod 755 scripts/deploy.sh
./scripts/deploy.sh

# 3. Config read-only
echo 'debug=false' > configs/app.conf
chmod 644 configs/app.conf

# 4. SSH simulation
mkdir -p .ssh
echo 'fake-key' > .ssh/id_rsa
chmod 600 .ssh/id_rsa
ls -la .ssh/

# 5. Team shared with SGID
chgrp team shared  # requires group 'team' exist
chmod 2775 shared
touch shared/file1
ls -l shared/  # group should be 'team'

# 6. Sticky bit test
chmod 1777 team
# As different user: touch team/test; rm team/test  # only owner can delete

# 7. ACL test
setfacl -m u:nobody:rwx configs/app.conf
getfacl configs/app.conf

# 8. Capability test
# setcap cap_net_bind_service=+ep /usr/bin/python3
# python3 -m http.server 80  # works without sudo

# 9. Verify all
find /tmp/permlab -ls
```

---

## 13. Summary | Yaad Rakho

1. **r=4, w=2, x=1** — octal math yaad rakho
2. **Directory pe `x` = `cd` + access** — bina `x` ke dir useless
3. **Special bits:** SUID(4) owner privileges, SGID(2) group/inherit, Sticky(1) only owner deletes
4. **umask** = default subtract; `022` standard, `002` group-friendly, `077` private
5. **SSH keys = 600** (private), `700` (`.ssh` dir) — non-negotiable
6. **ACL** = `setfacl`/`getfacl` for per-user/per-group beyond standard
7. **Capabilities** = root ko todna; `CAP_NET_BIND_SERVICE` common for port<1024
8. **SELinux/AppArmor** = MAC (Mandatory Access Control) — labels/profiles
9. **Team folders:** `chmod 2775` (SGID) + `chgrp team`
10. **Never `chmod 777`** — audit failure, security risk

---
**Related:** [Day 3](../day-03-linux-users-permissions-processes.md) · [Containers vs VMs](../topics/containers-vs-vms.md) · [K8s Security](../topics/devsecops.md)