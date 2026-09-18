# Day 01 — Linux Fundamentals & Operations (DevClo Expanded)

## Overview | Parichay
Har cloud server (AWS, Azure, GCP) ke andar ek Linux OS hota hai — jo aaj tum karoge wahi kal production me karenge. Ye day pure foundation hai: filesystem, permissions, users, processes, systemd, disk — isi se aage 30+ tickets aur saara DevOps kaam chalta hai.

## What You'll Learn | Aaj Ki Seekh
- [ ] FHS filesystem structure + `/proc /sys /dev /tmp /var` ka kaam samajhna
- [ ] symlink vs hardlink ka difference + `mount` aur `/etc/fstab`
- [ ] rwx octal permissions, `umask`, ACL (`getfacl/setfacl`), setuid/setgid/sticky bit
- [ ] Users/groups: `/etc/passwd`, sudoers, `useradd/usermod`, password policy (`chage`)
- [ ] Processes: `ps`, `top`, signals, states (R/S/D/Z), zombie/orphan, cgroups v2
- [ ] systemd: units, drop-ins, `systemctl`, timers, journald, targets
- [ ] Disk: `df -h -i`, `du`, `iostat`, `lsof`, inode-full gotcha, swap, `systemd-analyze`
- [ ] INC-101 (CPU 95%) aur INC-102 (Disk 100%) ticket ka flow samajhna

## Full Topic (LEARN) | Puri Detail

### 1. Filesystem (FHS)
Linux me sab kuch **file** hai. FHS (Filesystem Hierarchy Standard) define karta hai kya kahan rakha hai:

| Path | Kya hai | Real use-case |
|------|---------|---------------|
| `/etc` | Config files | `nginx.conf`, `fstab`, `hosts` |
| `/var` | Variable data | `logs/`, `mail/`, `lib/docker` |
| `/tmp` | Temporary (reboot pe clean) | build artifacts |
| `/proc` | **Virtual** — running processes | `cat /proc/cpuinfo`, `/proc/<pid>/status` |
| `/sys` | Kernel/devices ko tune | cgroups, block devices |
| `/dev` | Device files | `/dev/sda` (disk), `/dev/null` |
| `/home` | User homes | `/home/ubuntu` |

- **Symlink** (`ln -s target link`) = shortcut, broken ho sakta hai; **hardlink** (`ln target link`) = same inode, 2 names.
- **Mount**: `mount /dev/sdb1 /data` runtime pe; permanent ke liye `/etc/fstab` line chahiye. Ubuntu me `lsblk -f` se device/FSTYPE block.
- **LVM** (senior topic): physical volume → volume group → logical volume. Elastic disk common hai Azure pe (extend = `lvextend -l +100%FREE` + `resize2fs`).

### 2. Permissions
`ls -l` pe weight: `drwxr-xr--  user group`. Har file ke 3 trios: **owner / group / other**. Octal: `r=4 w=2 x=1`.

| Special bit | Symbol | Matlab |
|-------------|--------|--------|
| setuid | `s` (owner) | File owner ke permission se chalta hai (e.g. `/usr/bin/passwd`) |
| setgid | `s` (group) | Group inheritance — new files jo parent dir ka group le |
| sticky | `t` (other) | `/tmp` me sirf owner delete kar sakta hai |

- `chmod 750` ya `chmod u+rwx,g+rx,o=`; `umask` decided karta hai default perms (`umask 022` → 644/755).
- **ACL** tab jab standard rwx kaafi nahi: `setfacl -m u:deploy:r file` + `getfacl file`; check `setfacl -x` remove. Note: ACL aur `ls -l` ka last `+` dikhata hai.

### 3. Users & Groups
- `/etc/passwd` = `name:x:UID:GID:comment:home:shell`; `/etc/shadow` = hashed password + expiry (`chage` policies); `/etc/group` = groups.
- `useradd -m -s /bin/bash dev-user`, `usermod -aG sudo dev-user` (⚠️ `-a` bhoolo mat, warna group chala jayega).
- **sudoers**: `/etc/sudoers` file is `visudo` se hi edit karo; drop-in: `/etc/sudoers.d/`. Example: `dev-user ALL=(ALL) NOPASSWD: /usr/bin/systemctl`.
- **Password policy**: `chage -m 7 -M 90 -W 7 dev-user` (min, max days, warning).

### 4. Processes
- `ps aux` vs `ps -ef`; `ps aux --sort=-%cpu` = heaviest process. `top` interactive, `htop` prettier.
- **States**: `R`(running), `S`(sleep), `D`(uninterruptible IO), `Z`(zombie). Zombie = child exit ho gaya, parent `wait()` nahi kiya. Parent zabardasti nahi, `kill -9 <parent>` se grandparent adopt karta hai.
- **Signals**: `1` HUP(restart), `2` INT(Ctrl+C), `9` KILL(force), `15` TERM(graceful).
- **cgroups v2** (2026 default): resources ko Containers/k8s me limit — `/sys/fs/cgroup/` me `cpu.max`, `memory.max`.

### 5. Systemd (2026: systemd ~257)
- Units: `.service`, `.timer`, `.target`, `.mount`. `systemctl enable --now nginx` (start + boot-pe-start).
- **Drop-ins** (config override bina original file chhue): `/etc/systemd/system/nginx.service.d/override.conf` with `[Service] Environment=...`.
- `systemctl cat nginx`, `systemd-analyze blame` (boot time), `systemctl list-unit-files`.
- **Journald**: `journalctl -u nginx -f -n 100` — logs centralised, binaries facts.
- Targets = runlevels: `systemctl isolate multi-user.target` (GUI off).

### 6. Disk & Inodes (real gotcha)
- `df -h` (space) **aur** `df -i` (inodes). Disk 100% hota hai + **inode 100%** bhi hota hai — chhoti files galat jagah (e.g. `/var/spool/mail`) se.
- `du -sh /var/log/*` — kya khaya jagah; `iostat -x 2` — I/O wait; `free -m` — RAM/swap; `swapon --show`.
- `lsof +D /dir` — kounsa process file pakde hue hai (deleted file bhi space khata hai: `lsof +L1`).

### 2026 Notes
Kernel **6.x** (6.14 LTS current), systemd ~257, **cgroups v2** default, **Azure Linux / Ubuntu 24.04 LTS** standard base images, WSL2 sadharan local dev. `nproc`, `free` output ab "available memory" pe dhyan deta hai (cache free nahi hoti).

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `pwd; ls -la; cd` | kahan ho, kya hai, jao |
| `cat /etc/os-release` | OS + version |
| `lsblk -f` | disks + filesystem |
| `mount /dev/sdb1 /data` | disk mount karo |
| `df -h` / `df -i` | space / inodes |
| `du -sh *` | folder ka size |
| `ln -s /a /b` | symlink |
| `chmod 750 file` `chown u:g file` | perms/owner |
| `setfacl -m u:dev:r file` `getfacl file` | ACL |
| `useradd -m -s /bin/bash u` `usermod -aG sudo u` | user banao |
| `chage -l u` | password policy check |
| `ps aux --sort=-%cpu` / `top` | processes |
| `kill -9 <pid>` / `kill -15 <pid>` | force / graceful kill |
| `systemctl status/enable/restart nginx` | service control |
| `journalctl -u nginx -f -n 100` | service logs |
| `systemd-analyze blame` | boot time breakdown |
| `free -m` / `swapon --show` | RAM / swap |
| `iostat -x 2` / `lsof +D /tmp` | IO / open files |

## Practice Lab | Abhi Karein
Multipass/WSL2 ya ek cloud VM (`ubuntu` user) pe:
1. `cat /etc/os-release` likho aur note karo: je kernel `uname -r` me kya hai.
2. `lsblk -f` chalao — kitni disks, kaunsa mountpoint, kya FSTYPE.
3. `/tmp` me `ln -s /etc/hostname myhost` aur `ln /etc/hostname myhost2` banao; `ls -li` se inode compare karo (hardlink same inode).
4. `df -h` aur `df -i` dono dekh lo — dono me number alag hote hain kyun.
5. `useradd -m -s /bin/bash devops` → `usermod -aG sudo devops` → `su - devops` → `sudo whoami` (`root` aana chahiye).
6. `setfacl -m u:devops:r /etc/hostname` + `getfacl /etc/hostname` → ACL dikhna chahiye.
7. `chmod 600` ek file, phir `ls -l` pe `-rw-------` verify.
8. `ps aux --sort=-%cpu | head` — 3 heavy processes log karo.
9. `kill -15` ek apne-destroyed sleep process par: `sleep 300 &` then `kill -15 $!`.
10. `systemctl status cron` + `systemctl is-active cron`.
11. `journalctl -u cron -n 20 --no-pager` — logs pado.
12. `systemd-analyze blame | head` — sabse dheemi unit kaunsi hai.

## Incidents / Tickets | Real Practice

### INC-101 · CPU 95%
- **Situation:** PagerDuty alert: `web-prod-01` (10 CPU cores) pichle 20 min se 95% CPU bata raha hai. Users complain - site sluggish, 504s chal rahe hain. Team ne kal hi naya version (v2.8.1) deploy kiya tha.
- **Investigate:**
  ```bash
  ssh deploy@web-prod-01
  uptime                    # load average dekh: 1-min, 5-min, 15-min
  top -b -n1 | head -25     # kaunsa process sabse zyada CPU
  ps aux --sort=-%cpu | head -10
  systemctl status app-web  # deployed service ka status
  journalctl -u app-web --since "30 min ago" | tail -50
  ```
- **Root cause:** Naya version me ek **busy-wait loop** aaya (synchronization ke liye `while(true){check}` southern galti). Ek thread 100% CPU loop kar raha tha, threads 10/10 pe. Code review ne pakda nahi kyunki loop sirf specific response-code pe chalta tha.
- **Fix:**
  ```bash
  # Rollback to previous good build
  systemctl stop app-web
  # naye artifact ko hatao, purane v2.8.0 restore karo
  systemctl start app-web
  systemctl restart app-web   # fresh start
  ```
  Code fix: busy-wait loop ko sleep + timeout ke saath replace kiya.
- **Verify:** `uptime` load gradually drop; `top` me user CPU < 50%; `curl -I https://web-prod-01.example.com` → `200 OK` and latency < 300ms.
- **Blast radius | Prevent:** Poora prod traffic (≈ 50k users/hr) slow — 40 min me ~33k requests affected. Preventive: `top`/CPU **alert pehle se** (≥1 min sustained), CI me CPU-profile/load test gate, phase-based rollout (10% → 100%), rollback az se ek button.

### INC-102 · Disk 100%
- **Situation:** Monitoring alert: `api-qa-02` disk `/` 100% hu bhar gaya. Deploy fails - "No space left on device". Manual page scripts bhi fail.
- **Investigate:**
  ```bash
  ssh ops@api-qa-02
  df -h /                  # 100%? 
  df -i /                  # inodes bhi check (dono root causes ho sakta)
  du -sh /var/log/* 2>/dev/null | sort -rh | head
  du -sh /var/* /tmp/* 2>/dev/null | sort -rh | head
  lsof +L1                 # deleted but open (space-eating) files
  ```
- **Root cause:** `/var/log/nginx/*.log` uncontrolled — logrotate **configured hi nahi yu** (package install hua tha pehle, logrotate config nahi banaya). Gzip-able huge logs ne `/` bhara.
- **Fix:**
  ```bash
  rm -f /var/log/nginx/access.log.1   # stale rotation hatao
  logrotate -d /etc/logrotate.d/nginx # dry-run
  install -m 644 -o root -g root /tmp/nginx.logrotate.conf /etc/logrotate.d/nginx
  logrotate -f /etc/logrotate.d/nginx # abhi rotate karo
  df -h /
  ```
- **Verify:** `df -h /` ab < 80%; `logrotate -d` error-free; next day `ls /var/log/nginx/` me `.1` rotate dikhe.
- **Blast radius | Prevent:** QA env pe ~15 engineers blocked — prod pe ye outage = **full service down**. Permanent fix: logrotate har log dir pe, disk-usage alert at 80%, rotation size-based (`size 100M`) not just daily, logs central log-mgmt (Day 6) pe bhejo.

## Interview Corner | Sawal-Jawab

**Q: Zombie process kya hai aur kiski galti hoti hai?**
A: Zombie = child process exit ho chuka par parent ne `wait()` nahi kiya, isliye process table me entry atki hai. Ye child ki "galti" nahi — **buggy parent** ki hai. Kill parent (`kill -9`) karo, to init adopt karke reap kar dega.

**Q: chmod 4755 me 4 kya karta hai?**
A: 4 = **setuid bit**. File (executable) us user ke permission se chalti hai jiska owner hai, na ki uske jo run kar raha hai. Example: `/usr/bin/passwd` — normal user password change kar sakta hai kyunki root ki tarah chalta hai.

**Q: Inode full hone par kya hota hai aur kaise pata chalega?**
A: `df -h` to space bachiwala dikhayega lekin write fail hoga. `df -i` dekho — 100% dikhega. Cause: lakhon chhoti files (mail spool, docker overlay, temp). Find: `find / -xdev -type f | cut -d/ -f2 | sort | uniq -c | sort -rn`.

**Q: systemd timer vs cron (senior ready)?**
A: **Timer use karta main**, kyunki: journald se logs milte hain, missed runs track hote hain (`Persistent=true`), dependency/constraints (calendar + monotonic) hoti hain, aur `systemctl` se manage karna uniform hai. Cron simple chal jata hai par logs/PATH/dependency cabadh deta hai.

**Q: Sticky bit, setgid, setuid — real world example?**
A: `/tmp` pe sticky (kisi aur ka file delete nahi), `/usr/bin/passwd` pe setuid, aur project dir pe setgid (nayi files automatically group inherit). Seniors bolte hain: setuid hamesha suspect karo, `find / -perm -4000 2>/dev/null`.

## Quick Notes | Yaad Rakhna
- FHS: config `/etc`, logs `/var/log`, virtual `/proc /sys`
- `df -h` + `df -i` dono check karo — space vs inode alag alag bahar jaate hain
- `chmod 755` = 4+2+1 per trio; `umask` defaults control karta hai
- Zombie = parent ka bug; `kill -9` parent se reap hota hai
- Systemd drop-ins `/etc/systemd/system/<unit>.d/override.conf` — files mat touch karo
- Signals: 15 = graceful, 9 = force; 1 = HUP/reload
- `lsof +L1` → deleted-but-open files jo disk khaye hue hain