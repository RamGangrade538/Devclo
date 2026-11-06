# Module 2 — Users and Permissions

> **Hinglish:** Har `Permission denied` ka ek reason hota hai: owner, group, mode, ya parent directory. Is module me users/groups banaoge, `chmod`/`chown` practice karoge, aur **least privilege** seekhoge.

**Prerequisite:** `sudo` access wala lab user. **Sab commands lab VM me karo.**
**Safety:** `adduser`, `chown`, `usermod` system change karte hain. Shared system pe mat chalao. `chmod 777` kabhi fix nahi hai.

**Setup:**
```bash
sudo mkdir -p /srv/devops-perms
sudo chown "$USER":"$USER" /srv/devops-perms
chmod 755 /srv/devops-perms
mkdir -p ~/devops-lab/notes
```

---

## Task 9: Inspect User Accounts

**Scenario:** Server pe kaun-kaun hai aur kaun abhi logged in hai? Audit ke liye accounts, UIDs, aur sessions dekho.

**Command plan:**
```bash
whoami
id
getent passwd | head
getent passwd "$USER"
who
w
last -n 5
```

**Verification:**
- `getent passwd "$USER"` line me username, UID, home, shell ho.
- `who`/`w` current logged-in sessions dikhayein.
- `last -n 5` recent logins dikhaye (khaali ho sakta hai container me).

**Note:** UID 0 = root. 1000+ = normal users. 1-999 = system/service accounts.

---

## Task 10: Create Practice Users

**Scenario:** Do lab accounts banao — ek application owner, ek tester. Password disabled rakho; sirf `sudo -u` se commands test karenge.

**Command plan:**
```bash
sudo adduser --disabled-password --gecos "" labuser1
sudo adduser --disabled-password --gecos "" labuser2
id labuser1
id labuser2
getent passwd labuser1 labuser2
```

**Verification:**
- Dono users ke UID 1001/1002 (ya similar) hon.
- `id` me apna primary group (`labuser1`) ho.
- `ls /home` me dono home directories hon.

**Troubleshoot:** "user already exists" aaye to skip karo. User delete karna ho (optional cleanup): `sudo deluser --remove-home labuser1`.

---

## Task 11: Create Groups

**Scenario:** Developers ki ek team ban rahi hai. Ek `developers` group banao taaki file access group-based ho, har user ko alag permission na deni pade.

**Command plan:**
```bash
sudo groupadd developers
getent group developers
grep '^developers:' /etc/group
```

**Verification:**
- `getent group developers` output me group name, GID, aur members list ho.
- Abhi members khaali ho sakte hain (task 12 me add honge).

**Troubleshoot:** Group already exists to `groupadd` error dega — `getent group developers` se confirm karo, dobara mat banao.

---

## Task 12: Add Users to Groups

**Scenario:** `labuser1` ko developers group me daalo. Group membership se usse shared project files ka access milega.

**Command plan:**
```bash
sudo usermod -aG developers labuser1
getent group developers
id labuser1
sudo -u labuser1 groups
```

**Verification:**
- `getent group developers` me `labuser1` dikhe.
- `id labuser1` me `developers` group ho.
- `sudo -u labuser1 groups` me bhi developers ho.

**Note:** `-aG` me `-a` (append) zaroori hai; `usermod -G` purani groups hata deta hai. Existing login session me group tabhi milega jab user dobara login kare; `sudo -u` naya process banata hai isliye turant dikh jata hai.

---

## Task 13: Practice chmod

**Scenario:** Teen files banao: private (sirf owner), team-shared (owner read/write, group read), aur public-read (sab read). Modes ko octal me samjho.

**Command plan:**
```bash
cd /srv/devops-perms
touch private.txt shared.txt public.txt
chmod 600 private.txt
chmod 640 shared.txt
chmod 644 public.txt
stat -c '%A %a %U:%G %n' private.txt shared.txt public.txt
```

**Verification:**
- `private.txt` = `-rw-------` / `600`
- `shared.txt` = `-rw-r-----` / `640`
- `public.txt` = `-rw-r--r--` / `644`

**Octal yaad rakho:** `r=4`, `w=2`, `x=1`. Pehla digit owner, doosra group, teesra others. `600` = owner rw only.

---

## Task 14: Practice chown and chgrp

**Scenario:** File ka owner galat hai. Ownership `labuser1` ko do aur group `developers` karo — permission badle bina.

**Command plan:**
```bash
cd /srv/devops-perms
sudo chown labuser1 shared.txt
sudo chgrp developers shared.txt
ls -l shared.txt
sudo chown labuser1:developers private.txt
stat -c '%U:%G %n' private.txt shared.txt
```

**Verification:**
- `shared.txt` ka owner `labuser1`, group `developers`.
- `private.txt` bhi `labuser1:developers`.
- Mode (`600`/`640`) same rahe — `chown` permission nahi badalta.

**Note:** `chown user:group file` dono ek saath. `chgrp` sirf group badalta hai. Recursive (`-R`) se pehle `ls` se path confirm karo.

---

## Task 15: Directory Permissions

**Scenario:** Developers ke liye shared directory banao. Sab group members file bana sakein, par naye files ka group automatically `developers` rahe (setgid bit).

**Command plan:**
```bash
sudo mkdir -p /srv/devshare
sudo chown root:developers /srv/devshare
sudo chmod 2770 /srv/devshare
ls -ld /srv/devshare
sudo -u labuser1 touch /srv/devshare/labuser1-file.txt
ls -l /srv/devshare
```

**Verification:**
- `ls -ld` me permission `drwxrws---` dikhe (`s` = setgid).
- `labuser1` file bana sake.
- File ka group `developers` ho, owner `labuser1`.

**Note:** Directory pe `x` = andar jaane ki permission. `2770` = setgid + owner/group rwx, others none. `777` se group isolation khatam ho jata hai.

---

## Task 16: sudo and Least Privilege

**Scenario:** Tumhe check karna hai ki tumhe kaun-kaun se sudo rights hain. Root shell me ghusna nahi hai — sirf zaroori command sudo se chalani hai.

**Command plan:**
```bash
sudo -l
sudo -v
sudo id
sudo whoami
```

**Verification:**
- `sudo -l` tumhare allowed commands/rules dikhaye.
- `sudo whoami` = `root` (command-level escalation).
- `sudo -v` password timestamp refresh kare, shell root na ho.

**Note:** `sudo -i` ya `sudo su -` poora root shell deta hai — avoid karo. `sudo command` least privilege hai. `visudo` se rules edit hote hain, direct `/etc/sudoers` mat likho.

---

## Task 17: umask and ACL Basics

**Scenario:** Naye files default me kaunse permission ke saath banein? `umask` check karo. Phir ek file pe extra user ko ACL se read access do — mode badle bina.

**Command plan:**
```bash
umask
(umask 027; touch /srv/devops-perms/umask-test.txt)
stat -c '%A %a %n' /srv/devops-perms/umask-test.txt
getfacl /srv/devops-perms/shared.txt 2>/dev/null || echo "acl tool missing"
sudo apt install -y acl
sudo setfacl -m u:labuser2:r /srv/devops-perms/shared.txt
getfacl /srv/devops-perms/shared.txt
sudo -u labuser2 cat /srv/devops-perms/shared.txt
```

**Verification:**
- Default `umask` usually `0022` ya `0002` ho.
- Subshel me `umask 027` ke baad file `640` bane.
- `getfacl` me `user:labuser2:r--` line ho.
- `labuser2` file read kar sake.

**Note:** `umask 022` = file `644`, dir `755`. `umask 027` = file `640`, dir `750`. ACL extra users/groups ke liye hai, lekin simple group model pehle try karo.

---

## Task 18: Permission Troubleshooting

**Scenario:** `labuser1` ko `/srv/devops-perms/secret.txt` padhne pe "Permission denied" aa raha hai. Blind fix mat karo — owner, group, mode, aur parent directories check karo.

**Command plan:**
```bash
sudo bash -c 'echo "db_password=lab-only" > /srv/devops-perms/secret.txt'
sudo chown root:root /srv/devops-perms/secret.txt
sudo chmod 600 /srv/devops-perms/secret.txt
ls -l /srv/devops-perms/secret.txt
sudo -u labuser1 cat /srv/devops-perms/secret.txt; echo "exit=$?"
namei -l /srv/devops-perms/secret.txt
```
**Fix (least privilege):**
```bash
sudo chown root:developers /srv/devops-perms/secret.txt
sudo chmod 640 /srv/devops-perms/secret.txt
sudo -u labuser1 cat /srv/devops-perms/secret.txt; echo "exit=$?"
```

**Verification:**
- Pehle command `Permission denied` + `exit=1` de.
- `namei -l` har path component ki permission dikhaye.
- Fix ke baad `labuser1` (developers member) content padh le aur `exit=0`.

**Troubleshoot checklist:**
1. `ls -l` = owner/group/mode sahi?
2. `id labuser1` = required group me hai?
3. `namei -l` = parent directories me `x` (traverse) hai?
4. Fix = minimum change (group + `640`), not `777`.

---

## Module 2 Done — Checklist

- [ ] Users/UID/sessions inspect kiye.
- [ ] Do lab users banaye.
- [ ] `developers` group banaya.
- [ ] User ko group me add kiya (`-aG`).
- [ ] `chmod` octal modes practice kiye.
- [ ] `chown`/`chgrp` se ownership badli.
- [ ] Setgid shared directory banayi.
- [ ] `sudo -l` se rights inspect kiye.
- [ ] `umask` aur ACL use kiye.
- [ ] Permission denied ko systematically debug kiya.

**Next:** [Module 3 — Processes and Services](module-03-processes-services.md)
