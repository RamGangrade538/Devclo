# 🕸️ Distributed Systems — CAP, Consensus, Consistency

> **Hinglish:** Jab ek system multiple machines pe fail ho sakta hai — network issues, coordination, consistency — tab wo **distributed system** hai. SRE/Platform roles ke liye iske core ideas (CAP, consensus, replication, retries) samajhna essential hai.

## 📖 Overview — Ye Topic Kya Hai

Distributed system = components alag machines pe, network se jude, ek saath kaam karte. Main challenge: **partial failure** (koi component dead, baki nahi), **latency**, **no shared clock**, **consistency vs availability**.

**CAP theorem** — ek distributed system network partition (network fail) pe ya to **Consistency** rakh sakta hai ya **Availability**, dono nahi. Design decision yehi hai. **Consensus** (sab agree — Raft/Paxos), **replication** (copies sync), **leader election**, **quorum** (majority decide), **distributed locks** (race prevent), **idempotency/retries/backoff/timeouts** (network failures handle), **eventual consistency**, **failure domains**.

## 🟢 Beginner — Shuruaat yahan se

- CAP triangle — C/A/P matlab, example (banking vs social feed).
- Barriers: network latency/failure.
- **Idempotency** — same op repeat safe.
- Retry vs timeout — when safe.

## 🟡 Intermediate — Ab patterns banao

- **Consensus & leader election** — how one wins.
- **Quorum** — majority reads/writes.
- **Replication models** — sync vs async, read replicas.
- **Distributed locks** — mutex over network.
- **Backoff (exponential) + jitter** — retry storms avoid.

## 🔴 Advanced — Pro bano

- **Eventual consistency vs strong** — trade-offs.
- **Failure domains / blast radius** — isolation.
- **Timeouts & deadlines cascade** — tail latencies.
- **Distributed transactions (2PC/Saga)** — complexity.
- **Data partitioning** — sharding key design.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **CAP theorem** — consistency/availability/partition trade-off.
- [ ] **Consistency** — all nodes same data (at time X).
- [ ] **Availability** — every request gets response.
- [ ] **Partition tolerance** — network split pe system chale.
- [ ] **Replication** — copies across nodes.
- [ ] **Consensus** — nodes agree on value (Raft/Paxos).
- [ ] **Leader election** — one leader decided (etcd etc).
- [ ] **Quorum** — majority needed to proceed.
- [ ] **Distributed locks** — mutual exclusion across nodes.
- [ ] **Idempotency** — retry-safe operations.
- [ ] **Retries** — handle transient network.
- [ ] **Backoff** — escalated wait between retries.
- [ ] **Timeouts** — no infinite hang.
- [ ] **Race conditions** — concurrent update control.
- [ ] **Eventual consistency** — eventually all agree.
- [ ] **Failure domains** — isolated failure zones.
- [ ] **Partial failure detection** — timeouts/heartbeats.
- [ ] **Clock skew** — no perfect time sync.
- [ ] **Split-brain** — network partition both sides act leader.
- [ ] **2PC / Saga** — distributed transactions.
- [ ] **Sharding/partitioning** — data split for scale.
- [ ] **Linearizability** — strongest consistency.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| etcd / ZooKeeper | Consensus storage | Leader election, locks |
| Redis cluster / Consul | Coordination | Distributed lock/services |
| Kafka | Log-based replication | Event stream consistency |
| Postgres streaming | Sync/async replication | DB high availability |
| chaos libraries | Fault injection | Failure simulation |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — CAP Demo:** Redis vs DB in network failure — behavior observe karo.
- [ ] **Lab 2 — Leader Election:** 3-node etcd cluster, leader elected + fail, new leader demo.
- [ ] **Lab 3 — Distributed Lock:** Two workers same task — lock ke bina conflict, lock ke saath clean.
- [ ] **Lab 4 — Retry/Backoff:** Jitter + exponential backoff implement karo; simulated burst me success rate dekho.
- [ ] **Project — Micro Dist. App:** 3 services + consensus + locks + retries + failure injection drill.

## 🔗 Related Topics

- [🧩 Service Architecture](../modules/service-architecture.md)
- [📨 Messaging & Event Systems](../modules/messaging-events.md)
- [🏛️ Architecture](../modules/architecture.md)
- [Performance Engineering](../topics/performance-engineering.md)
- [Day 47 — Performance Engineering](../day-47-performance-engineering.md)