# 🗄️ Databases for DevOps — SQL, NoSQL, Ops

> **Hinglish:** Database hi app ka dimag hai — agar DB slow/not connected/backup nahi hai toh app bhi nahi. DevOps ko DBA banne ki zaroorat nahi, par **connection pooling, replication, backups, failover, migrations** ye sab samajhna zaroori hai.

## 📖 Overview — Ye Topic Kya Hai

DBs two types: **SQL** (relational — table, joins, transactions — PostgreSQL/MySQL) aur **NoSQL** (key-value/document/wide-column — Redis, MongoDB, DynamoDB). Choice app ke read/write pattern pe depend karta hai.

DevOps angle: **connection pooling** (connections reuse), **indexes** (query speed), **transactions** (data consistency), **replication** (primary/replicas — read scale + HA), **backups + restore** (data loss se bachav), **failover** (primary down → replica promote), **migrations** (schema versioning — Alembic/Flyway/Prisma). Aur startup-order me DB hamesha pehle, app baad.

## 🟢 Beginner — Shuruaat yahan se

- SQL basics: SELECT, JOIN, WHERE, ORDER, LIMIT.
- APNE app me DB connect karo (Postgres/MySQL/SQLite).
- CRUD: insert/update/delete + transactions.
- Redis basics: set/get, cache pattern.

## 🟡 Intermediate — Ab operations karo

- **Indexes** — query latency pe effect; EXPLAIN dekho.
- **Connection pooling** — pooling config, connection limits.
- **Replication** — read replica setup (manual/local/cloud).
- **Backups** — pg_dump / automated backup + restore.
- **Migrations** — schema versions, rollback.

## 🔴 Advanced — Pro bano

- **High availability DB** — managed (RDS/Azure SQL), failover clusters.
- **Sharding / partitioning** — data split for scale.
- **Caching strategy** — cache invalidation, TTL.
- **DB security** — least privilege, TLS, secrets (not hardcoded).
- **Performance tuning** — slow query log, vacuum, connection config.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **SQL basics** — SELECT/INSERT/UPDATE/DELETE/JOIN.
- [ ] **PostgreSQL** — open-source relational DB (production king).
- [ ] **MySQL** — popular relational alternative.
- [ ] **Redis** — in-memory cache/key-value store.
- [ ] **MongoDB concepts** — document NoSQL, flexible schema.
- [ ] **Connections** — app ↔ DB network session.
- [ ] **Connection pools** — connections reuse; overhead kam.
- [ ] **Replication** — data copies (primary → replica).
- [ ] **Backups** — periodic data copy; tested restore zaroori.
- [ ] **Restore** — backup se recovery (drill kar ke dekho).
- [ ] **Failover** — primary fail pe replica shuru.
- [ ] **High availability** — DB hamesha up; managed solutions.
- [ ] **Read replicas** — reads scale karna.
- [ ] **Indexes** — query speed ke liye; but writes slow (trade).
- [ ] **Transactions** — all-or-nothing operations.
- [ ] **Database migrations** — schema version control (Flyway/Alembic).
- [ ] **ACID vs BASE** — SQL strict vs NoSQL eventual.
- [ ] **SQL vs NoSQL** — when which; joins vs documents.
- [ ] **Caching** — hot reads memory se.
- [ ] **Connection limits / timeouts** — overload prevent.
- [ ] **Query execution plan (EXPLAIN)** — slow query diagnostics.
- [ ] **Schema design basics** — tables, relations, normalization.
- [ ] **DB in Docker/K8s** — stateful workloads, PVC.
- [ ] **Secrets for DB** — passwords in Vault/Secrets, not config.
- [ ] **Backup types** — full, incremental, WAL archiving.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| PostgreSQL / MySQL | Relational DB | Primary data stores |
| Redis | Cache / queue | Hot cache, sessions |
| MongoDB | Document DB | Flexible schemas |
| pg_dump / Velero | Backups | Data protection |
| Flyway / Alembic | Migrations | Schema versions |
| PgBouncer | Pooler | Connection management |
| EXPLAIN / slow-query | Diagnostics | Performance |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — CRUD App:** Postgres local, small app ke saath CRUD + transaction-try (rollback demo).
- [ ] **Lab 2 — Index Experiment:** Slow query banao, `EXPLAIN` karo, index lagao, timing compare.
- [ ] **Lab 3 — Backup & Restore:** `pg_dump` se backup, delete some data, restore, verify.
- [ ] **Lab 4 — Replica Setup:** Read replica banao; replica pe SELECT, primary pe write, failover test.
- [ ] **Lab 5 — Pool Setup:** PgBouncer ya app pooling config; connections metric me improvement dekho.
- [ ] **Project — DB in K8s:** StatefulSet + PVC + Secret postgres cluster; backup cronjob; restore drill.

## 🔗 Related Topics

- [💾 Storage](../modules/storage.md)
- [🏎️ Performance Engineering](../modules/performance-engineering.md)
- [☸️ Kubernetes](../modules/kubernetes.md)
- [Day 20 — ConfigMaps, Secrets & Volumes](../day-20-kubernetes-configmaps-secrets-volumes.md)
- [Day 23 — Azure Core Services](../day-23-azure-core-services.md)