# 🐧 Linux — System, Commands & Operations

> **Hinglish:** Linux duniya ke zyadatar servers aur containers ka engine hai. Agar DevOps banna hai toh Linux commands aana **must** hai — kyunki 90% kaam terminal pe hi hota hai. Ye module tujhe "Linux bande" banata hai.

## 📖 Overview — Ye Topic Kya Hai

Linux ek **open-source operating system** hai jo servers, clouds, mobiles (Android), aur supercomputers me chalta hai. DevOps engineer banne ke liye Linux isliye zaroori hai kyunki **saara infra, CI/CD agents, containers — sab Linux par** chalte hain.

Is module me ham cover karenge: filesystem (`/etc`, `/var`, `/home`, `/proc`), processes aur threads, users aur groups, permissions (`rwx`, `chmod`, `sudo`), SSH, package managers (`apt`, `yum`), `systemd` services, logs (`journalctl`), `cron` jobs, aur saare daily-use ke commands (`grep`, `awk`, `sed`, `find`, `xargs`, `ps`, `top`, `ss`, `lsof`, `df`, `du`, `free`).

Ek important baat: Linux me **sab kuch file hai** (device bhi, process bhi `/proc` me). Samajh lo toh baaki sab simple ho jata hai.

## 🟢 Beginner — Shuruaat yahan se

- Filesystem navigation: `pwd`, `ls -la`, `cd`, `mkdir -p`, `file`.
- File padhna-likhna: `cat`, `less`, `head`, `tail -f`, `nano`/`vim`, `touch`, `cp`, `mv`, `rm`.
- Searching: `find`, `grep -r`, `locate`.
- Users/permissions basics: `whoami`, `id`, `sudo`, `chmod`, `chown`.

## 🟡 Intermediate — Ab real kaam karo

- **Processes:** `ps aux`, `top`, `htop`, `kill`, `signal` (SIGTERM vs SIGKILL), `&` background, `nohup`, `systemctl` services.
- **Networking from terminal:** `ss`, `netstat`, `ping`, `curl`, `dig`, `ip`, `lsof -i`.
- **Text processing masters:** `grep -E`, `awk`, `sed`, `cut`, `sort`, `uniq`, `xargs`.
- **Disks/memory:** `df -h`, `du -sh`, `free -h`, `lsblk`, `mount`, `df -i`.
- **Environment vars & shell:** `export`, `.bashrc`, `source`, `env`, `$PATH`.

## 🔴 Advanced — Production-grade Linux

- **systemd deep dive** — units, services, timers, `journalctl`, custom service banana.
- **Process management depth** — nice/renice, `perf`, memory pressure, zombie processes.
- **Filesystems & storage** — LVM, RAID, inodes, symlinks vs hardlinks, `fstab`.
- **Network troubleshooting** — `traceroute`, `tcpdump`, `nmap`, `nc`, `/proc` analysis, DNS debugging.
- **Automation** — bash scripting loops/functions, `cron`, `at`, logrotate, systemd timers.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Linux filesystem (FHS)** — fixed layout: `/etc` config, `/var` logs, `/home` users, `/proc` virtual.
- [ ] **Processes** — running programs; `ps`, `top`, `kill` se control karte hain.
- [ ] **Threads** — ek process ke andar parallel kaam ke chhote threads.
- [ ] **Users & groups** — har user ke apne access; groups se multiple users ko rights dete hain.
- [ ] **File permissions** — `rwx` per user/group/other; `chmod` se change karte hain.
- [ ] **sudo** — admin-level command limited time ke liye chalao bina root login ke.
- [ ] **SSH** — secure remote login; keys se password-less connection.
- [ ] **Environment variables** — shell/runtime settings jo apps padhte hain (`PATH`, `HOME`).
- [ ] **Package managers** — software install/update: `apt`, `yum`, `dnf`.
- [ ] **systemd** — Linux ka service manager; `systemctl start/status/enable`.
- [ ] **Services (units)** — background daemons; systemd files se control.
- [ ] **Logs** — `/var/log`, `journalctl`; kya hua/broken wo yahan milta hai.
- [ ] **Cron** — scheduled jobs, "har 5 min ye command chalao".
- [ ] **Signals** — processes ko message: `SIGTERM` graceful stop, `SIGKILL` force kill.
- [ ] **Process management** — find/prioritize/kill processes smartly (`ps`, `renice`, `kill`).
- [ ] **Disk management** — `df`, `du`, `lsblk`, `mount`, `fsck` — space ka dhyaan.
- [ ] **Memory management** — `free -h`, OOM, swap, memory leaks spot karna.
- [ ] **CPU management** — `top`/`htop` me load, `nice`, `uptime` (load average).
- [ ] **Networking commands** — `ip`, `ss`, `ping`, `curl`, `dig` se network diagnose.
- [ ] **curl** — HTTP request tool; APIs test karne ka sabse zyada-used tool.
- [ ] **wget** — files download karna (recursive bhi kar sakta hai).
- [ ] **grep** — text me pattern search; log me "error" dhoondhna.
- [ ] **awk** — column-wise text processing; "2nd field print karo".
- [ ] **sed** — search + replace in text; "demo" hatao files me.
- [ ] **find** — files dhoondhna by name/type/size/time.
- [ ] **xargs** — pehli command ka output agle command ko argument me do.
- [ ] **ps** — processes ki list; `ps aux` sab kuch.
- [ ] **top / htop** — live process + CPU/memory stats.
- [ ] **ss** — listening/connected sockets; port kaun use kar raha hai.
- [ ] **lsof** — "kaunsi file/port kis process ne kholi hai".
- [ ] **df** — disk kitni free/used hai (per filesystem).
- [ ] **du** — folder kitni jagah le raha hai.
- [ ] **free** — RAM/swap usage.
- [ ] **journalctl** — systemd logs parche karne ka tool.
- [ ] **Shell scripting** — commands ki script; automation ka base.
- [ ] **stdin/stdout/stderr** — I/O streams; `>`, `|`, `2>&1`.
- [ ] **Exit codes** — har command 0 = success, non-zero = fail; scripting me kaam aata hai.
- [ ] **Symlinks** — shortcut files; `ln -s`.
- [ ] **Swap** — RAM bharne pe disk se extra memory.
- [ ] **OOM killer** — memory khatam hone pe Linux process mar deta hai; log me `dmesg`.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| bash / zsh | Shell | Daily commands, scripting |
| vim / nano | Terminal text editors | Files edit karne ke liye |
| tmux | Terminal sessions bachao | Long-running work, SSH me |
| htop / btftop | Interactive process viewer | CPU/RAM live dekhne ke liye |
| systemd | Service manager | Services enable/restart ke liye |
| apt / dnf | Package managers | Software install ke liye |
| jq | JSON parser (CLI) | JSON API data se kaam karne ke liye |
| tcpdump / nc | Network debug tools | Packets catch + port test ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Server Health Script:** `sh` script likho jo CPU, memory, disk check karke report print kare (top commands).
- [ ] **Lab 2 — User & Permission Hunt:** naya user banao, group me add karo, `chmod 750` se folder ka access test karo.
- [ ] **Lab 3 — Log Detective:** `/var/log` me se bug "dhoondho" — `grep -E "error|fail"` use karo, `tail -f` se live dekhna seekho.
- [ ] **Lab 4 — Service Banao:** apni script ko `systemd` service banao, start/enable/status karo, `journalctl -u` se logs dekho.
- [ ] **Lab 5 — Network Debug:** `ss`, `curl -v`, `dig`, `ping` se ek slow/na-milne wala service troubleshoot karo.
- [ ] **Project — Cron Reports:** daily 9am pe system health report generate + mail/file me save karne wala cron setup karo.

## 🔗 Related Topics

- [🌐 Networking](../modules/networking.md)
- [⚡ Automation](../modules/automation.md)
- [🐍 Programming & Scripting](../modules/programming-scripting.md)
- [Linux Permissions (rwx)](../topics/linux-permissions.md)
- [Linux Storage & Sysadmin](../topics/linux-storage-sysadmin.md)
- [systemd & Service Management](../topics/linux-systemd-service-management.md)
- [Day 2 — Linux Filesystem & Commands](../day-02-linux-filesystem-and-commands.md)
- [Day 3 — Users, Permissions & Processes](../day-03-linux-users-permissions-processes.md)