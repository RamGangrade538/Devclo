# 💾 Storage — Block, File, Object & Databases

> **Hinglish:** Storage ke teen bade types: **block** (disk-level, fast), **file** (network share), **object** (S3-style, huge scale). Inke saath volumes, persistent storage in K8s, filesystems, backups aur data lifecycle samjho.

## 📖 Overview — Ye Topic Kya Hai

Apps data ko kahin rakhna hota hai. Base types:
- **Block storage** — raw disk (EBS/NVMe), single server se attached, fast, OS filesystem ke liye.
- **File storage** — networked fileshare (NFS/EFS), multiple servers mount karte hain, posix.
- **Object storage** — flat key-value, buckets, unlimited scale (S3, MinIO), metadata + versioning.

In K8s: **PersistentVolumes + StorageClasses** (dynamic provisioning), **CSI** drivers, **StatefulSets** (stateful apps). DevOps me data ka dhyan: **backups** (RPO/RTO), **snapshots**, **replication/DR**, **encryption at rest**, **lifecycle/tiering** (hot→cold→archive), **filesystems** (ext4/xfs/btrfs).

## 🟢 Beginner — Shuruaat yahan se

- Block vs file vs object — ek line difference.
- `df`, `mount`, `lsblk` — local storage basics.
- S3 bucket create + upload/list.
- Filesystem basics (inode, mount point).

## 🟡 Intermediate — Ab deploy karo

- Persistent volume (PV/PVC) + StorageClass in K8s.
- NFS vs object storage — use-case decide.
- Snapshot + restore — files NFS/volume-level.
- Backup strategy — RPO/RTO define karo.

## 🔴 Advanced — Pro bano

- **CSI snapshots** — volume snapshots K8s.
- **Object lifecycle rules** — tiering/expire.
- **Replication/DR** — cross-region copies.
- **Encryption at rest + key mgmt** — decrypt unshared.
- **Storage performance tuning** — IOPS, throughput.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Block storage** — raw disk (EBS), attached to VM.
- [ ] **File storage** — networked share, multi-server mount.
- [ ] **Object storage** — buckets, key-value, scalable (S3).
- [ ] **PersistentVolume** — cluster-level storage unit.
- [ ] **PersistentVolumeClaim** — pod ka storage request.
- [ ] **StorageClass** — dynamic provisioning type.
- [ ] **CSI** — container storage interface drivers.
- [ ] **StatefulSet** — stateful app pods (stable IDs).
- [ ] **Backups** — RPO (lost data gap) / RTO (recovery time).
- [ ] **Snapshots** — point-in-time captures.
- [ ] **Replication/DR** — copies for disaster.
- [ ] **Encryption at rest** — stored data encrypted.
- [ ] **Lifecycle/tiering** — hot/cold/archive move.
- [ ] **Filesystems** — ext4/xfs/btrfs choices.
- [ ] **Mount points** — where disk attached.
- [ ] **Quotas/limits** — storage caps.
- [ ] **Immutable backups** — tamper-proof copies.
- [ ] **Versioning** — object versions (S3).
- [ ] **Retention policy** — kitne din/versions rakhna.
- [ ] **GFS / backup rotation** — smart backup schedules.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| AWS EBS | Block storage | VM disk |
| AWS EFS | File storage | Shared mount |
| S3 / GCS / Azure Blob | Object storage | Web-scale data |
| MinIO | Self-hosted S3 | Local object store |
| K8s storage | PV/PVC/CSI | Cluster persistence |
| Velero | Backup/restore | K8s cluster backup |
| Restic/Rclone | Backup tooling | Data protection |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — S3 Basics:** Bucket create, upload, presign URL, versioning on demo.
- [ ] **Lab 2 — PVC in K8s:** StorageClass + PVC mount pod me; pod delete → PVC persists, data survive.
- [ ] **Lab 3 — NFS vs Object:** NFS mount for shared apps; S3 for artifacts/backups — use-case decide and implement.
- [ ] **Lab 4 — Backup:** Velero backup + restore; restore ke baad data-wapas aaya check.
- [ ] **Lab 5 — Lifecycle:** S3 lifecycle rule ek chain banao — hot→cold→archive.

## 🔗 Related Topics

- [☸️ Kubernetes](../modules/kubernetes.md)
- [☁️ Cloud Fundamentals](../modules/cloud-fundamentals.md)
- [Linux Storage & Sysadmin](../topics/linux-storage-sysadmin.md)
- [Data Pipelines & DataOps](../topics/dataops-pipelines.md)
- [Day 20 — ConfigMaps, Secrets & Volumes](../day-20-kubernetes-configmaps-secrets-volumes.md)