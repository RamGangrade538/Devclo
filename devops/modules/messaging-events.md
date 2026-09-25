# 📨 Messaging & Event Systems — Queues, Pub/Sub, Event-Driven

> **Hinglish:** Jab tumhari app ka ek hissa doosre ko "email kaam kar raha hai, isko process kar" ke through async decouple karta hai — queues aur events use karte ho. Kafka, RabbitMQ, SQS/SNS — ye systems scale + resilience ke masterpieces hain.

## 📖 Overview — Ye Topic Kya Hai

Puraana pattern: service A directly service B ko HTTP pe call karta hai — agar B down toh A bhi fail. **Messaging** inhe decouple karta hai: A ek **message** queue/re-topic me daal deta hai, B apne pace pe consume karta hai. A/B dono independently chalte aur scale hote hain.

Do modes:
- **Queues** (point-to-point) — ek consumer ko kaam milega (SQS, RabbitMQ). At-least-once processing.
- **Pub/Sub** (broadcast) — event multiple consumers ko (SNS, Kafka topics).
- **Event-driven architecture** — events hi system ka asli data flow (order placed → inventory, billing, email…).

Core concepts: consumer groups, partitions, offsets (Kafka), dead-letter queues (failures rescue), ordering, idempotency, delivery guarantees (at-least-once, exactly-once ideas).

## 🟢 Beginner — Shuruaat yahan se

- Queue vs Pub/Sub — farak waha (one-to-one vs one-to-many).
- SQS ya local RabbitMQ pe message produce/consume karo.
- Simple async flow: producer → queue → consumer script.
- Delivery guarantees — at-most/at-least-once me farak.

## 🟡 Intermediate — Ab real apps banao

- **Consumer groups** — parallel consumption (Kafka).
- **Partitions & offsets** — ordering + checkpoint.
- **Idempotency** — consumer double-process me safe.
- **Dead-letter queues** — failed messages alag.
- **Retries & backoff** — transient failures handle.
- **Event schemas** — evolve events (versioning).

## 🔴 Advanced — Pro bano

- **Exactly-once vs at-least-once** — trade-offs (dedup, transaction IDs).
- **Ordering guarantees** — per-key partition.
- **Backpressure & lag monitoring** — consumer lag.
- **Schema registry** — Avro/JSON schema for events.
- **Event sourcing / CQRS principles** — event-first design.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Message queues** — async task pipeline (point-to-point).
- [ ] **Pub/Sub** — event broadcast to multiple subscribers.
- [ ] **Event-driven architecture** — events drive flow.
- [ ] **Kafka** — distributed event streaming platform.
- [ ] **RabbitMQ** — AMQP broker, flexible routing.
- [ ] **SQS** — AWS queue service (fully managed).
- [ ] **SNS** — AWS pub/sub notifications.
- [ ] **Event buses** — central event routing (EventBridge).
- [ ] **Consumer groups** — Kafka group pe parallel consume.
- [ ] **Partitions** — data shards; ordering within key.
- [ ] **Offsets** — consumed position (checkpoint).
- [ ] **At-least-once delivery** — message kabhi na kho (duplicate ho):
- [ ] **Exactly-once concepts** — no duplicates (hard, trade-offs).
- [ ] **Idempotent consumers** — double-process safe.
- [ ] **Dead-letter queues** — failed messages quarantine.
- [ ] **Retries & backoff** — transient errors retry.
- [ ] **Backpressure** — consumer slow → sender control.
- [ ] **Consumer lag** — offset gap; real-time health.
- [ ] **Message ordering** — same-key ordering guarantee.
- [ ] **Duplicate handling** — dedup ids.
- [ ] **Schema registry** — event type contract.
- [ ] **Topic vs queue** — broadcast vs competing consumers.
- [ ] **Retention** — message/data kitna time store.
- [ ] **Async vs sync** — decoupling payoffs.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Apache Kafka | Event streaming | High-throughput events |
| RabbitMQ | AMQP broker | Flexible routing/queues |
| SQS / SNS | AWS managed | Serverless queue/pubsub |
| Redis Streams | Lightweight | Small-scale event needs |
| Debezium | CDC connectors | DB changes to events |
| Schema Registry | Event schemas | Kafka ecosystem contracts |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — First Queue:** RabbitMQ/SQS produce — 3 messages bhejo, consumer consume karo, visibility/ack checks.
- [ ] **Lab 2 — Pub/Sub:** SNS/Redis topic se 2 consumers ek event pe react karte dekho.
- [ ] **Lab 3 — DLQ Flow:** Consumer me kill switch lagao (always fail) → DLQ me messages jate dekho; replay karo.
- [ ] **Lab 4 — Kafka Basics:** Local Kafka, topic + partitions + consumer group; producer lag/consume.
- [ ] **Project — Order Flow:** "order placed" event → 3 services (inventory, billing, email) via queue/pubsub end-to-end.

## 🔗 Related Topics

- [🧩 Service Architecture](../modules/service-architecture.md)
- [🕸️ Distributed Systems](../modules/distributed-systems.md)
- [☁️ Cloud Fundamentals](../modules/cloud-fundamentals.md)
- [Serverless & Event-Driven](../topics/serverless-event-driven.md)
- [Day 43 — Serverless & Event-Driven](../day-43-serverless-event-driven.md)