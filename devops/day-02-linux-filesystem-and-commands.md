# Day 2: Linux Fundamentals - File System & Commands
📚 Topic 2: Linux Deep Dive — Filesystem & Commands
✅ Prerequisite-checklist: (review Day 1 DevOps Culture concepts if needed)

## Overview | Parichay

Linux duniya ke zyada-tar servers, containers, aur cloud instances par chalta hai. Agar aapko DevOps banana hai toh Linux commands aana **zaroori** hai. Aaj hum file system structure aur kaam ke commands seekhenge.

### Filesystem fixed kyun hai — FHS ki soch

Kalpana karo ek godown jisme saara saamaan bina rule ke rakha hai — aaj samaan kahan hai kisi ko nahi pata. ISLIYE Linux har cheez ka **fixed shelf** define karta hai: config `/etc`, logs `/var`, temp `/tmp`, users `/home`. Isi fixed map ko **FHS (Filesystem Hierarchy Standard)** kehte hain. Fayda: jab bhi production server me problem aaye, tum **pehle se jante ho kahan dekhna hai** — naya admin bhi 10 minute me dhoondh leta hai. Yehi reason hai ki har Linux machine ka filesystem dikhta hai basically same.

### "/ (root)" se sab shuru — Linux ka single tree

Linux me drives ke alag letters nahi hote (`C:`/`D:` Windows jaisa). Poora system **ek hi tree** hai jo "/" (root) se shuru hota hai — chaahe disk, pen drive, ya network share, sab kuch isi tree ke neeche **mount** hota hai. `/mnt/data`, `/media/usb` — ye sirf paani ke spots hain jahan cheezein jodi jaati hain.

### Har directory ka kaam — apna mental map banao

| Directory | Kya rakhta hai | Real example |
|-----------|----------------|--------------|
| `/` | Root — sab kuch iske neeche | — |
| `/etc` | Configuration files | `nginx.conf`, `hosts`, `ssh` |
| `/var` | Badalta/growing data, logs | `/var/log/syslog`, mail |
| `/tmp` | Temporary stuff (reboot pe clean) | install temp files |
| `/home` | Har user ka personal space | `/home/ubuntu` |
| `/proc` | **Virtual** — RAM me live kernel + process info | `/proc/cpuinfo`, `/proc/meminfo` |
| `/dev` | Device files — disk, printer, null | `/dev/sda` (disk), `/dev/null` |

### "Sab kuch file hai" — Linux ki philosophy

Linux me basically **sab kuch file hai** — config file hai, log file hai, disk file hai (`/dev/sda`), aur process bhi file hai (`/proc` me). `/proc` sabse interesting hai: ye **virtual filesystem** hai — disk pe exist nahi karta, bas RAM me rehta hai, aur jab tum `cat /proc/cpuinfo` karte ho to kernel live data file jaisa dikhata hai. Yehi karan hai ki `lsof` wali tools bina kernel code padhe kaam kar leti hain.

### Navigation aur file reading — kaunsi tool kab

- `pwd` = "mujhe kahan khade ho?" ka answer
- `ls -la` = full listing (hidden dot-files bhi) — `-l` long format, `-a` all, `-h` human readable
- `cd` = ghoomna; `cd ~` home, `cd -` pehli jagah, `cd ..` upar
- `cat` = poori file padho (chhoti files); `less` = lambi files scroll karke; `head`/`tail` = shuruaat/ant me se
- `tail -f` = log file **live stream** mein dekho — monitoring ka daily tool

### `find` vs `grep` — do alag dhoondh ka tarika

- `find /etc -name "*.conf"` = **name** se file dhoondho (filesystem tree ko walk karta hai)
- `grep -r "Listen" /etc/nginx/` = **content** ke andar pattern dhoondo (file ke andar padhta hai)
- `2>/dev/null` = "permission denied" wale errors chhupao, sirf useful output dekho

### Symlink vs hardlink — shortcut ka science

`ln -s /etc/hostname /tmp/x` ek **symlink** banata hai — shortcut file jisme "original ka path" likha hota hai (`ls -l` me arrow dikhti hai). Original delet ho to symlink **toot jata hai**. Hardlink (`ln src dst`) asli index entry copy karta hai — dono names same inode pe point karte hain (`ls -li` se inode same milega); original delete ho to dosti reh jaati hai. Practically DevOps me **symlink hi** zyada dikhega (jaise `node`, `python` symlinks).

### Disk ka dhyan — `df` vs `du`

- `df -h` = **poori disk** pe kitni jagah bachi (mounts ki list)
- `du -sh dir` = **kaunsi folder/folder** kitna khata hai (`-s` summary, `-h` human)
- Production incident ka classic order: `df -h` → disk full hai → `du -sh * | sort -rh` → kaun padta hai → old logs remove. Badhe bugchha ke peli disk ki wajah se app crash hota hai.

---

> Ek line mein: Linux me sab kuch **file hai** (config, log, device, process) aur filesystem ke fixed shelves rule karte hain — jaise godown me har cheez ka apna rack.

## Learning Priority | Kis Order Me Practice Karein

Agar aap beginner ho, toh Linux/DevOps ko is order me practice karo — pehle filesystem ke "fixed shelves" strong karo, phir aage badho:

1. **Basic navigation:** `/`, `/home`, `/root`, `pwd`, `cd`, `ls`
2. **Configuration:** `/etc`, SSH aur Nginx config
3. **Logs:** `/var/log`, `journalctl`, `tail -f`
4. **Services:** `systemctl` — kaunsi service chal rahi hai, start/stop/restart
5. **Networking:** `ip a`, `ss -tulpn`, `curl`, `dig` — troubleshooting ka pehla step
6. **Permissions:** `chmod`, `chown`, `sudo`
7. **Disk management:** `df`, `du`, `/mnt`
8. **Processes:** `/proc`, `ps`, `top`
9. **Application management:** `/opt`, `/usr/local/bin`, `/var/lib`
10. **DevOps tools:** Docker, Jenkins, Kubernetes aur Terraform ke data/configuration paths

**Recommendation:** Sabse pehle `/etc`, `/var/log`, `/home`, `/tmp`, `/opt`, `/usr/local/bin` aur `/var/lib` ko achhe se samjho. Inka practical knowledge server administration aur DevOps troubleshooting me sabse zyada kaam aayega.

> Note: Steps 4 (services) aur 5 (networking) classic Linux lists me aksar chhoot jaate hain, lekin real DevOps incident me yahi sabse pehle use hote hain — isliye yahan add kiye gaye hain.

## What You'll Learn | Aaj Ki Seekh

- [ ] FHS structure: `/etc` (config), `/var` (logs), `/tmp` (temp), `/proc` (virtual) — kya kahan rakha hai
- [ ] Navigation: `pwd`, `ls -la`, `cd`, `mkdir -p`
- [ ] Files padhna: `cat`, `head`, `tail -f`, `less`
- [ ] Dhoondhna: `find / -name file`, `grep -r pattern`
- [ ] Symlink vs hardlink: `ln -s` shortcut banao
- [ ] Disk check: `df -h` (kitni bachi), `du -sh` (kaun kha raha)
- [ ] Logs continuously dekhte raho: `tail -f /var/log/syslog`

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart TB
    ROOT["/ (root)"]
    ROOT --> ETC["/etc - config files
nginx.conf, hosts, fstab"]
    ROOT --> VAR["/var - variable data
logs, mail, docker"]
    ROOT --> TMP["/tmp - temporary
reboot pe clean hota hai"]
    ROOT --> HOME["/home - user homes
/home/ubuntu"]
    ROOT --> PROC["/proc - VIRTUAL
running processes + kernel"]
    ROOT --> DEV["/dev - device files
sda = disk, null"]
    ETC --> CMD1["grep -r 'Listen' /etc/nginx"]
    VAR --> CMD2["tail -f /var/log/syslog"]
    PROC --> CMD3["cat /proc/cpuinfo"]
```

ASCII:
```
/  →  /etc (config)  /var (logs)  /tmp (temp)  /home (users)
     /proc (virtual) /dev (devices)
pwd        → kahan ho
ls -la     → sab file (hidden bhi)
tail -f    → log live dekho
find / -name x   → kahan hai?
df -h + du -sh   → disk space + sizes
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Kahan ho aur kya hai?
pwd
ls -la

# 2. Ghoomna aur structure banana
cd /etc && ls | head -5
cd ~                      # wapas home
mkdir -p /tmp/lab/config  # nested folders ek saath

# 3. Files padhna
cat /etc/os-release       # OS + version
tail -n 5 /var/log/syslog # log ke last 5 lines
tail -f /var/log/syslog   # LIVE streaming (Ctrl+C = roko)

# 4. Dhoondhna
find /etc -name "*.conf" 2>/dev/null | head
grep -r "Listen" /etc/nginx/ 2>/dev/null   # andar search

# 5. Symlink shortcut
ln -s /etc/hostname /tmp/lab/myhostname
ls -l /tmp/lab/myhostname   # arrow -> dikhegi

# 6. Disk dekhna
df -h                      # kaunsi mount pe kitna
du -sh /var/log/* 2>/dev/null | sort -rh | head
```

## Real-Life Example | Industry Me

**Log + disk check — production web server (nginx):**
```bash
ssh deploy@web-prod-01
tail -f /var/log/nginx/error.log               # live errors dekho
grep " 500 " /var/log/nginx/access.log | tail # 500s kahan aaye
find /var/log -name "*.gz" -mtime +30 -delete # purane rotated logs clean
df -h                                          # disk kitni bachi
du -sh /var/log/nginx/* 2>/dev/null | sort -rh | head
```
Production me har incident isi se shuru hota hai — pehle log padho, phir disk check karo, phir fix karo. Seniors is poori flow ko 5 minute me kar lete hain.

## Practice Exercise | Abhi Karein

1. `mkdir -p ~/lab/{config,backup}` banao — ek command me 2 folders
2. `ls -la` se hidden files pehchano (dot wali) — `.bashrc` kya hai?
3. Do terminal kholo — ek me `tail -f /var/log/syslog`, doosre me command chalao, log live dikhega
4. `find /usr -name "*.sh" 2>/dev/null | head` — kuch bash scripts dhoondo
5. Symlink banao `ln -s /etc/hostname ~/lab/host` aur `ls -li` se inode compare karo (hardlink same inode, symlink alag)
6. `df -h` + `du -sh ~/lab/*` — kitni jagah use hui likho
7. `grep -c "Listen" /etc/nginx/nginx.conf` — count karo

## Linux for DevOps — Practical Training

Ye 6 modules har DevOps engineer ke daily kaam ke hain. Har module me **kya hai** aur **kaunse commands** chalao — dono diye hain.

### 1. Configuration — `/etc`

**Kya hai:** Server ki saari configuration yahan rehti hai. SSH (`/etc/ssh/sshd_config`), Nginx (`/etc/nginx/nginx.conf`), hostname resolution (`/etc/hosts`), disks (`/etc/fstab`), users (`/etc/passwd`, `/etc/shadow`). Kisi bhi service ka behaviour badalna ho toh pehle `/etc` me uski config dhoondo.

```bash
ls /etc                                  # saari config files
cat /etc/os-release                      # OS + version
cat /etc/hosts                           # hostname → IP mapping
grep -r "PermitRootLogin" /etc/ssh/      # SSH me root login allowed hai?
nginx -t                                 # config test karo (syntax check)
sudo systemctl reload nginx              # reload bina downtime (restart se pehle try karo)
```

> Rule: config file change karne ke baad **pehle** us tool ka test/preview chalao (`nginx -t`, `sshd -t`), phir reload. Direct `restart` mat maaro.

### 2. Logs — `/var/log`

**Kya hai:** Har service apni activity yahan likhti hai — errors, logins, requests. Troubleshooting ka **pehla step** hamesha log padhna hai. systemd-based distros me `journalctl` central logs deta hai.

```bash
tail -f /var/log/syslog                  # live log stream (Ctrl+C roko)
tail -n 100 /var/log/auth.log            # last 100 lines (logins/sudo)
grep " 500 " /var/log/nginx/access.log   # 500 errors dhoondo
journalctl -u nginx -f                   # sirf nginx service ke logs (live)
journalctl --since "1 hour ago"          # pichle ghante ke saare logs
find /var/log -name "*.gz" -mtime +30 -delete  # 30 din se purane logs clean
```

> Rule: `/var/log` disk pe badh sakta hai — ise monitor karo, warna disk full hone se app crash hoga (Sensor 4 dekho).

### 3. Permissions — `chmod`, `chown`, `sudo`

**Kya hai:** Kaunsi file kaun padh/ likh/ run kar sakta hai — iska rule. Har file ke 3 sets: **user (u)**, **group (g)**, **others (o)** aur 3 rights: **r=4, w=2, x=1**. Security ka base yahi hai.

```bash
ls -l file                               # -rw-r--r-- owner group dekh
chmod 644 config.yml                     # owner read/write, baaki read (safe default)
chmod 755 deploy.sh                      # owner all, baaki read+execute (script)
chmod u+x script.sh                      # sirf owner ko execute do
chown app:app /var/lib/app               # owner:group badlo
chown -R user:group /opt/app             # poore folder pe recursively
sudo -u app whoami                       # doosre user ke roop me command chalao
id                                       # tumhara uid/gid + groups
```

> Rule: `777` kabhi production me mat lagao — least privilege do. Secrets/config `600`, scripts `755`, normal data `644`.

### 4. Disk management — `df`, `du`, `/mnt`

**Kya hai:** Disk bharne se pehle pata karo kaunsi mount full ho rahi hai aur kis folder ne khaya. Naya disk `/mnt` ya `/data` pe mount hota hai.

```bash
df -h                                    # har mount pe kitni jagah bachi
du -sh /var/log/* | sort -rh | head      # sabse bada folder top pe
lsblk                                    # disks + partitions ka tree
sudo mount /dev/sdb1 /mnt                # disk ko /mnt pe jodo
cat /etc/fstab                           # boot pe kaunse disk auto-mount hote hain
```

> Rule (incident order): `df -h` → full mila → `du -sh * | sort -rh` → culprit folder → old logs/temp clean karo.

### 5. Processes — `/proc`, `ps`, `top`

**Kya hai:** Kaunsi process chal rahi hai, kitni CPU/RAM kha rahi hai. `/proc` ek **virtual filesystem** hai — kernel live data wahan file ki tarah dikhata hai.

```bash
ps aux                                   # saari running processes
top                                      # live CPU/RAM (htop better UI)
cat /proc/cpuinfo                        # CPU details (live)
cat /proc/meminfo                        # RAM details (live)
lsof -i :80                              # port 80 kisne hold kiya?
kill <PID>                               # process ko politely band karo
kill -9 <PID>                            # force kill (last resort)
```

> Rule: pehle `kill` (SIGTERM) — process cleanup kar sakti hai. `kill -9` (SIGKILL) tab jab woh na maane; ye graceful nahi hota.

### 6. Application management — `/opt`, `/usr/local/bin`, `/var/lib`

**Kya hai:** Third-party/self-built apps kahan rehti hain. `/opt` = extra software, `/usr/local/bin` = custom binaries/scripts (PATH me), `/var/lib` = app ka runtime state/data (docker yahan rehta hai).

```bash
ls /opt                                 # installed 3rd-party apps
ls /usr/local/bin                       # custom commands (PATH me hote hain)
ls /var/lib/docker                      # docker images/containers ka data
echo $PATH                              # kaunse folders se commands milti hain
which docker                            # command kahan se aa raha hai
```

> Rule: apna tool install karo toh `/usr/local/bin` ya `/opt` prefer karo — `/usr/bin` system package manager ka hai, use gandha mat karo.

## Quick Notes | Yaad Rakho

```
- Ek root "/" se sab shuru hota hai (Windows /c/ jaisa kuch nahi)
- /etc = config · /var = logs · /tmp = temp (reboot pe clean) · /home = users
- /proc = virtual reality — /proc/cpuinfo, /proc/meminfo live
- ls -la = sab kuch (hidden .file bhi) · pwd = kahan ho
- mkdir -p = parent folders bhi bana deta hai
- tail -f = log live dekho (stream) · tail -n 100 = last 100 lines
- find / -name = name se dhoondo · grep -r = content search
- ln -s src dst = symlink shortcut (broken ho sakta hai)
- df -h = disk kitni bachi · du -sh * = kis folder ne khaya
- 2>/dev/null = errors chhupana (find/grep me common)
- Tab = auto-complete · Ctrl+L = clear · Ctrl+C = roko
- Everything is a file — process, disk, device sab file hai
```

**Agla:** Linux users, permissions aur processes — kaun kya kar sakta hai server pe.