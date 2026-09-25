# Deep Dive: Linux Storage & Sysadmin — Disk, LVM, Backup, Logs Manage Karna

> **Standalone deep dive:** Cloud VM/Docker/K8s sab **disk** pe chalti hai — disk full ho to app crash. Ye deep dive OS admin ka core hai.

---

## 1. Disk Full Ka Panic — Pehle Visibility, Phir Fix

```bash
df -h                 # filesystem usage (Disk Fully = "df")
df -h /var/lib/docker # specific mount
du -sh /var/log/*     # folder sizes
du -sh * | sort -h | tail -10   # sabse bade folder
lsblk                 # block devices + sizes
blkid                 # UUID / filesystem type
```

**Disk full hone par first-aid (order se):**
```bash
# 1. Kaunsi mount full hai?
df -h | grep -E "100%|[0-9]{2}%"

# 2. Andar kya kha raha hai?
sudo du -xh --max-depth=1 /var | sort -h | tail -10

# 3. Purane logs delete/compress
sudo journalctl --vacuum-size=100M
sudo logrotate -f /etc/logrotate.d/*

# 4. Images/containers k8s/docker
docker system df && docker system prune -af --volumes
```

---

## 2. Files, Partitions & Filesystems

| Filesystem | Used Kahan | Kya Khaas |
|------------|-----------|-----------|
| `ext4` | Default Linux data drive | Journaled, solid |
| `xfs` | RHEL/Rocky default | High perf, good for large files |
| `tmpfs` | `/tmp`, `/dev/shm` | RAM me — restart = data gone (fast!) |
| `overlayfs` | Docker layers | Container imagen ka join |
| `btrfs/zfs` | Snapshots/CoW libera | Advanced teams |

**Partition create + format (demo on spare disk):**
```bash
lsblk -f
sudo fdisk /dev/sdb          # n -> p -> <enter> -> w
sudo mkfs.ext4 /dev/sdb1
sudo mkdir /mnt/data
sudo mount /dev/sdb1 /mnt/data
echo '/dev/sdb1 /mnt/data ext4 defaults 0 2' | sudo tee -a /etc/fstab  # boot pe mount
sudo mount -a                  # fstab validate (red text = problem)
```

---

## 3. LVM — Disk Ka "Jadu"

**Problem:** Partition bada karna hai but disk pe extra space alag block me hai. **Solution:** LVM — partition kabhi fixed nahi, logick blocks me batch.

```
[fdisk  (physical) ]   →   PV (Physical Volume)   →   VG (Volume Group)  →   LV (Logical Volume) → mount
```

```bash
# Setup
sudo pvcreate /dev/sdb /dev/sdc        # disks -> PV
sudo vgcreate vg_app /dev/sdb /dev/sdc # PV -> VG (pool)
sudo lvcreate -L 20G -n lv_data vg_app # VG -> LV (20G)
sudo mkfs.ext4 /dev/vg_app/lv_data
sudo mount /dev/vg_app/lv_data /mnt/data

# GROW (without downtime!)
sudo lvextend -L +10G /dev/vg_app/lv_data        # LV +10G
sudo resize2fs /dev/vg_app/lv_data               # FS bhi badao
df -h /mnt/data                                  # => 30G!

# Shrink / snapshot
sudo lvcreate -s -L 2G -n snap /dev/vg_app/lv_data   # snapshot (backup)
```

**LVM commands you'll actually use daily:**
```bash
pvs; vgs; lvs            # status
vgextend somevg /dev/sdd # pool me nayi disk
lvextend -L +5G vg/lv && resize2fs /dev/vg/lv
```

---

## 4. Mount, UUID & /etc/fstab

```bash
findmnt /data            # kon mount hai
cat /etc/fstab           # boot mounts

# UUID se mount karo (device name badal sakta hai)
UUID=$(blkid -s UUID -o value /dev/sdb1)
echo "UUID=${UUID} /mnt/data ext4 defaults,noatime 0 2" | sudo tee -a /etc/fstab
```

| fstab options | Matlab |
|---------------|--------|
| `defaults` | rw,suid,dev,exec,auto nouser async |
| `noatime` | Access-time update band (perf) |
| `nofail` | Missing disk pe boot rukne na de (cloud) |
| `x-systemd.automount` | Lazzy mount (khule tab mount) |

---

## 5. du/dd/Loop Device Energia (mkfs demo assemble)

**Disk images (dd) — backup ka raw tarika:**
```bash
sudo dd if=/dev/sdb of=/backup/disk.img bs=4M status=progress
# Disk image me filesystem:
sudo losetup -fP /backup/disk.img
sudo mkfs.ext4 /dev/loop0
```

---

## 6. Backup Strategy — rsync, tar, snapshots

| Tool | Best For | Example |
|------|----------|---------|
| `rsync` | Incremental, SSH, **bandwidth friendly** | `rsync -avz /data/ user@backup:/data/` |
| `tar` | Whole dir bundle + compress | `tar czf app.tgz /opt/app` |
| `restic`/`borg` | Offsite + encrypted + dedup | `restic backup /data` |
| LVM snapshot | Filesystem-level consistent | `lvcreate -s` |
| Cloud | Blob/Storage lifecycle | `azcopy`, `aws s3 sync` |

**Rsync CRITICAL details:**
```bash
rsync -avz --delete /source/ user@dest:/backup/
# --delete = source se gayab file wo dest pe bhi delete (BACKUP mirror)
# ona toh try: rsync -avz --dry-run
rsync -avz -e "ssh -i ~/.ssh/deploy_key" src/ u@h:/dst/
```

**tar pipeline (compressed):**
```bash
tar czf /backup/logs-$(date +%F).tgz /var/log   # c=create, z=gzip, f=file
tar tzf /backup/logs-2026-*.tgz | head          # list
tar xzf /backup/logs-2026-*.tgz -C /restore     # extract
```

---

## 7. Logrotate — Logs Kabhi Badansan Na Ho

App logs bade ho jate hain; `logrotate` unhe rotate + compress + delete karta hai:

```conf
# /etc/logrotate.d/app
/opt/deploytrack/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

| Directive | Matlab |
|-----------|--------|
| `daily/weekly/size 100M` | Rotation trigger |
| `rotate 14` | 14 old files rakh |
| `compress` | .gz |
| `delaycompress` | Ek current ko aage se turant compress na karo (app open ho sakti) |
| `copytruncate` | File copy karo + truncate (app bina restart rotate) |
| `postrotate` | SIGHUP send karna (nginx etc.) |

```bash
sudo logrotate -d /etc/logrotate.conf   # dry-run
sudo logrotate -f /etc/logrotate.d/app  # force rotate
```

---

## 8. Process & Load Management

```bash
top / htop                     # live
ps aux --sort=-%mem | head     # sabse memory-hungry
vmstat 1 8                     # system-level (r, b, si, so, wa)
iostat -x 2                    # disk busy % (await)
sar -u 2 5                     # CPU history (sysstat)
free -h                        # RAM

# Memory pressure:
cat /proc/sys/vm/swappiness    # default 60; servers pe 10 keep
# Side note: zombie processes
ps aux | awk '$8 ~ /Z/'        # zombie list — parent fix karo
```

**`top` ke kaam ki keys:** `1` (per-core), `M` (sort by mem), `P` (sort by cpu), `k` (kill), `q` (exit).

---

## 9. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **"No space left on device" par disk space hai** | Inode full | `df -i` → purge chhoti files (docker overlay me aisa hota) |
| **Mount hamesha fail ho raha** | fstab galt entry | `systemctl status local-fs.target`, fstab `nofail` |
| **Resize nahi ho raha cloud disk** | OS ne new size nahi dekha | `sudo growpart /dev/sda 1 && sudo resize2fs /dev/sda1` |
| **Logs 20GB** | logrotate nahi tha | logrotate config + `journalctl --vacuum-size` |
| **rsync baar-baar full copy** | `--delete`/incremental nahi | `rsync -avz` (only diff) dhyan se; `--delete` ek mirror backup |
| **dd ke jagah disk image mount** | `mount` fail | `losetup -fP` + mount loop |
| **df data lost mount pe** | DB writes crash | LVM snapshot kaafi; fsync-on; transaction log |
| **Boot slow** | Unnecessary services enabled | `systemd-analyze blame`, disable unused |

---

## 10. Interview Questions — Storage & Sysadmin

| Question | Strong Answer |
|----------|---------------|
| "Disk full — kaunse command chalayenge?" | `df -h` → `du -xh --max-depth=1` → delete `journalctl --vacuum`, `docker system prune`, logrotate. Order = visibility then cleanup. |
| "LVM kyun use karte ho?" | Partition re-size bina downtime, pool me extra disk jodna, snapshots. `lvextend + resize2fs`. |
| "rsync vs scp?" | rsync = incremental + resume + delete mirror; scp = one-time full copy. Bandwidth diff bada hai production me. |
| "logrotate se kya hota hai?" | Logs rotate/compress/purge — disk bharta nahi, retention policy meet hoti hai. |
| "inode full kya hota hai?" | Space hai par `No space left` — lakhs chhoti files (containers/workers). `df -i`. |
| "Backup strategy kya bataoge?" | 3-2-1 (3 copies, 2 media, 1 offsite) + restore-test monthly (un-tested backup = backup nahi). |
| "Snapshot vs full backup?" | Snapshot = point-in-time copy pointer (fast, cheap, crash-recovery); full = real data copy (restore independent). Use both layered. |
| "Docker overlay2 disk full kaise?" | `docker system df`, prune images/containers/volumes, limit image pull si. |

---

## 11. Hands-On Lab (safe practice — VMs/disks se careful)

```bash
# 1. Visibility
df -h; lsblk -f; free -h

# 2. dos-tools se loose practice
du -sh /var/log/* | sort -h | tail
journalctl --vacuum-size=50M && docker system df (agar docker hai)

# 3. tar backup demo
mkdir -p ~/backup-lab && cd ~/backup-lab
echo "data1" > f1.txt; echo "data2" > f2.txt
tar czf data.tgz f1.txt f2.txt
tar tzf data.tgz
mkdir restore && tar xzf data.tgz -C restore && diff f1.txt restore/f1.txt

# 4. rsync (local = practice)
rsync -avz ~/backup-lab/ ~/backup-lab-copy/
rm ~/backup-lab/f1.txt
rsync -avz --delete ~/backup-lab/ ~/backup-lab-copy/
ls ~/backup-lab-copy   # f1.txt delete ho gaya (mirror)

# 5. logrotate ding
cat > /tmp/rotate.conf <<'EOF'
/tmp/backup-lab/*.log { daily; rotate 3; compress; copytruncate; }
EOF
sudo logrotate -f /tmp/rotate.conf
```

---

## 12. Summary | Yaad Rakho

1. `df -h` (space) + `du -sh *|sort -h` (kaha) + `df -i` (inode)
2. LVM = lvextend + resize2fs (bina downtime grow)
3. fstab me `UUID`, boot failure se `nofail`
4. rsync = incremental + `--delete` mirror (careful), `--dry-run` pehle
5. tar = backup bundle, `c/z/f`, `t`, `x`
6. logrotate = daily/rotate 14/compress/copytruncate
7. 3-2-1 backup + **restore test** monthly
8. Journal vacuum + docker prune = disk-full rescue

---
**Related:** [Day 2](../day-02-linux-filesystem-and-commands.md) · [Day 13](../day-13-advanced-shell-scripting-automation.md) · [systemd Services](../topics/linux-systemd-service-management.md) · [Day 40 Chaos](../day-40-chaos-engineering.md)