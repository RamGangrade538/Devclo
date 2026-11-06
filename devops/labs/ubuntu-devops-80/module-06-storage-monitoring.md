# Module 6 — Storage and Monitoring

> **Hinglish:** "Disk full" aur "memory full" production ke sabse common incidents hain. Is module me disk/memory/CPU/block devices inspect karna aur ek reusable health report banana seekhoge.

**Prerequisite:** Ubuntu VM. `sudo` for some log paths.

---

## Task 37: Disk Usage

**Scenario:** Alert aaya "disk usage 90%". Kaunsa filesystem bhara hai, aur kitni jagah bachi hai?

**Command plan:**
```bash
df -h
df -i
df -h / /home /var 2>/dev/null
findmnt -t ext4,xfs
```

**Verification:**
- `df -h` me `Size`, `Used`, `Avail`, `Use%`, `Mounted on` columns hon.
- `/` ka `Use%` dikhe; 90%+ ho to investigation shuru karo.
- `df -i` inode usage dikhaye (inode full bhi "disk full" jaisa error deta hai).

**Note:** `df` filesystem-level hai; `du` directory-level. Inode full hone pe nayi file nahi banegi chahe space ho.

---

## Task 38: Directory Size

**Scenario:** Disk bhar gaya hai. Lab folder ke andar kaunsi directory sabse badi hai? Bade culprits dhoondho.

**Command plan:**
```bash
du -sh ~/devops-lab
du -h --max-depth=1 ~/devops-lab | sort -h
du -ah ~/devops-lab | sort -rh | head -n 10
```

**Verification:**
- `du -sh` total size dikhaye.
- `--max-depth=1` ke output size ke ascending order me ho.
- Top 10 list me sabse badi files/dirs pehle hon.

**Note:** `du` permission-denied dirs pe error de sakta hai; `2>/dev/null` se noise hatao. `ncdu` interactive tool bhi useful hai (`sudo apt install ncdu`).

---

## Task 39: Memory and CPU

**Scenario:** App slow hai. RAM, swap, CPU load aur run queue dekho — bottleneck CPU hai, memory hai, ya I/O wait?

**Command plan:**
```bash
free -h
nproc
uptime
top -bn1 | head -n 15
vmstat 1 3
```

**Verification:**
- `free -h` me total/used/free/available + swap dikhe.
- `uptime` me load average (1/5/15 min) ho.
- `top` me `%Cpu(s)` line aur top processes hon.
- `vmstat 1 3` me `r` (running), `si/so` (swap), `wa` (I/O wait) columns hon.

**Note:** Load average ko CPU count se compare karo (`nproc`). 4 CPU pe load 4 = saturated. `available` memory dekho, `free` alone misleading hai (cache use hota hai). `wa` high = disk I/O bottleneck.

---

## Task 40: Block Devices

**Scenario:** Naya disk attach hua hai. OS use dekh raha hai? Mounted hai? Filesystem type kya hai?

**Command plan:**
```bash
lsblk
lsblk -f
findmnt
mount | head -n 20
cat /etc/fstab
```

**Verification:**
- `lsblk` disks/partitions ka tree dikhaye.
- `lsblk -f` me filesystem type (ext4/xfs) + mountpoint ho.
- `findmnt` mounted filesystems ka structured list de.
- `/etc/fstab` boot-time mounts dikhaye.

**Note:** `lsblk` se device identify karo, phir `mkfs`/`mount` se pehle **double-check** karo ki sahi disk hai. Galat disk format = data loss.

---

## Task 41: Logs and Log Rotation

**Scenario:** `/var/log` bada ho raha hai. Kaunse logs hain, kitne purane, aur logrotate unhe kaise rotate karta hai?

**Command plan:**
```bash
ls -lh /var/log | head -n 20
sudo journalctl --disk-usage
sudo journalctl -n 20 --no-pager
cat /etc/logrotate.conf
ls /etc/logrotate.d
cat /etc/logrotate.d/nginx 2>/dev/null
```

**Verification:**
- `/var/log` me `syslog`, `auth.log`, `nginx/` etc. dikhein.
- `journalctl --disk-usage` journal size bataye.
- `logrotate.conf` me `weekly`, `rotate`, `compress` settings hon.
- `logrotate.d/` me service-specific config ho.

**Note:** Logrotate config ka syntax test: `sudo logrotate -d /etc/logrotate.conf` (debug/dry-run). Journal size limit: `/etc/systemd/journald.conf` me `SystemMaxUse=`.

---

## Task 42: Health Check Report

**Scenario:** Har subah server health ka ek report chahiye — uptime, memory, disk, aur critical services. Ek script banao jo report file me save kare.

**Command plan:**
```bash
mkdir -p ~/devops-lab/{scripts,notes}
cat > ~/devops-lab/scripts/health-report.sh <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
OUT_DIR="${1:-$HOME/devops-lab/notes}"
mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/health-$(date +%F-%H%M).txt"
{
  echo "=== DevClo Health Report ==="
  echo "Host: $(hostname)"
  echo "Date: $(date -Is)"
  echo
  echo "--- Uptime / Load ---"
  uptime
  echo
  echo "--- Memory ---"
  free -h
  echo
  echo "--- Disk ---"
  df -h /
  echo
  echo "--- Services ---"
  for svc in ssh nginx devclo-hello; do
    printf '%-15s %s\n' "$svc" "$(systemctl is-active "$svc" 2>/dev/null || echo unknown)"
  done
} | tee "$REPORT"
echo
echo "Report saved: $REPORT"
EOF
chmod +x ~/devops-lab/scripts/health-report.sh
~/devops-lab/scripts/health-report.sh
ls -lh ~/devops-lab/notes/health-*.txt | tail -n 3
```

**Verification:**
- Script bina error ke chale.
- Report file `~/devops-lab/notes/health-YYYY-MM-DD-HHMM.txt` bane.
- Report me uptime, memory, disk, aur service status sections hon.
- Services ka `active`/`inactive` status sahi ho.

**Note:** `set -uo pipefail` undefined variable aur pipe failures pakadta hai (lekin `set -e` nahi, taaki ek service fail hone pe poora report na ruke). Isi script ko Module 7 ke cron task me schedule karoge.

---

## Module 6 Done — Checklist

- [ ] Disk space aur inode usage check kiye.
- [ ] Directory sizes se bade folders dhoondhe.
- [ ] Memory, CPU load, swap, I/O wait inspect kiye.
- [ ] Block devices aur mounts dekhe.
- [ ] Logs + logrotate config inspect kiye.
- [ ] Reusable health report script banaya.

**Next:** [Module 7 — Bash Scripting](module-07-bash-scripting.md)
