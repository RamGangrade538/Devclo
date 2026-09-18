# Deep Dive: Data Pipelines & DataOps — ETL/ELT, Data Factory, dbt, Data Quality, Contracts

> **Kaha ka hai:** Day 45 ka gahra version. Data is a product: versioned schemas, tested (quality gates), scheduled, monitored (freshness), CI/CD-able (dbt in a pipeline like app code).

---

## 1. The Data Stack — Mindset

```
Source (DB, API, blob, kafka) → Ingestion → Landing (raw) → Transform (clean/mart)
 → Serve (BI / ML / API)   — each stage versioned + monitored
```
**DataOps = DevOps for data:** git-version models, tests, CI/CD, rollout, observability — same principles as app delivery (Day 45 summary). Key: **data is a product** → contracts, SLAs, alerts, ownership.

---

## 2. ETL vs ELT — Understand the Shift

| | ETL (classic) | ELT (modern cloud) |
|--|---------------|--------------------|
| Where transform | separate server before load | inside warehouse/lake (SQL engines) |
| Scale | transforms on staging box (limited) | warehouse scales for you (big compute) |
| Raw preservation | often discarded after transform | raw kept (audit, re-transform later) |
| Tools | Informatica/SSIS/Airflow | dbt, Databricks, Snowflake, Fabric |

Modern default: **ELT** — land raw, transform in-warehouse with SQL (dbt), keep lineage.

---

## 3. Ingestion Patterns

| Pattern | When | Azure tool |
|---------|------|-----------|
| Scheduled batch (Copy) | nightly/hourly CSV/API | Azure Data Factory (Copy activity), Databricks Auto Loader |
| Event-driven | blob event → ingest | Event Grid → ADF/Databricks trigger |
| Change Data Capture (CDC) | low-latency delta from DB | Debezium/Kafka + Event Hubs; ADF CDC; SQL managed instance change feed |
| Streaming | telemetry, real-time | Event Hubs → Stream Analytics → ADLS/Databricks |
| Tumbling windows | process "last 15min" | ADF tumbling trigger + dependencies |

```
Copy activity (ADF): source system + sink (ADLS/DB); schedules: Recurrence/Tumbling
Auto Loader (Databricks): "cloud storage → delta table" incremental automatically
```
**Idempotency & exactly-once-ish:** partition by date; upsert on key; re-run safe (Delta MERGE / dbt incremental).

---

## 4. Land − Transform − Serve Layers

```
ADLS (lake):
  /raw/{source}/yyyy/MM/dd/*.parquet   (as-is, versioned)
  /silver/{domain}/...                 (cleaned: types, nulls handled, joins)
  /gold/{model}/...                    (mart: aggregated business tables ready for BI/ML)
dbt: `sources` (refer silver/raw) → `staging` → `marts` tested + documented
Serve: Power BI / Databricks SQL / Lakehouse SQL / ML models
```
**Schema handling:** schema drift (new column) → ADF `allow schema drift` or Databricks `mergeSchema`; **when to hard-fail** (critical tables) vs soft-tolerate.

---

## 5. dbt — Models, Tests, Docs (the "SQL-as-code" world)

```bash
pip install dbt-core dbt-snowflake   # or dbt-synapse / dbt-databricks / dbt-postgres
dbt init my_project && cd my_project
```
```sql
-- models/staging/stg_orders.sql
SELECT id, customer_id, amount, status, created_at
FROM {{ source('shop','orders') }}
WHERE created_at >= '2024-01-01'
```
```yaml
# models/schema.yml — tests + freshness (quality gates)
version: 2
models:
  - name: stg_orders
    columns:
      - name: id
        tests: [not_null, unique]
      - name: amount
        tests:
          - dbt_expectations.expect_column_values_to_be_between: { min_value: 0 }
sources:
  - name: shop
    tables:
      - name: orders
        freshness:
          warn_after: { count: 2, period: hour }
          error_after: { count: 6, period: hour }
        loaded_at_field: created_at
```
```bash
dbt run && dbt test && dbt docs generate && dbt docs serve
# incremental for big tables:
# {%% config(materialized='incremental', unique_key='order_id') %%}
```
**CI/CD for dbt (like your app!):** branch → build in staging → `dbt test` on staging → merge → promote to prod (dbt run in prod). Versioned by Git; lineage/graph via docs.

---

## 6. Data Contract — Schema + Tests as Agreement

```
Data contract = schema + expectations (tests) + freshness + ownership
  declared by producer, consumed by everyone — version it like an API
Benefits: catches breaking changes before consumers break; enables ownership & rollout
Python example: dbt schema.yml (above) IS a data contract. Or table properties tooling.
```

---

## 7. Scheduling + Orchestration + Monitoring (Data Factory)

```
ADF pipeline:
  trigger (Tumbling 1h) → copy (source→landing) → dbt run (silver/gold) 
  → dbt test → fail-fast alert → on success continue
Failure handling: on fail → retry N, timeout, alert (Slack/Teams via Web Activity), runbook
Dependencies: daily job waits hourly job success (dependsOn) — no race conditions
Data observability: freshness (no data = SLA miss alert), volume anomaly, schema drift report
```

---

## 8. Real-World Example — E-commerce Data Platform

```
Event → Event Hubs → Stream Analytics → raw/{type}/...
Nightly ADF: copy Orders(DB CDC)/Products/Sessions → landing
dbt: stg_orders (clean) → marts: order_daily (revenue), user_cohort, LTV model input
Freshness: orders warn 1h/error 3h; volume alert if <50% yesterday's
Quality: NOT NULL id, unique order, amount in [0,1e7]
Serve: Power BI live dashboards + monthly retention report + ML (churn) table
CI: PR changes dbt model → staging run+test pass → merge → prod promote
Fail: no data by 08:00 → alert on-call with runbook → check source/auth/schema → re-run
```

---

## 9. Interview Questions — DataOps & Pipelines

| Question | Strong answer |
|----------|---------------|
| "ETL vs ELT?" | ETL transforms before load on app box; ELT loads raw and transforms in warehouse — scalable, preserves raw, lineage clear. |
| "dbt kya?" | SQL modeling as code: models (with ref), tests (not_null/unique/freshness), docs/lineage, incremental; versioned + CI/CD like app code. |
| "Data quality gates?" | not_null/unique/range/freshness tests in schema.yml; block promotion if fail — "data tests are unit tests for data". |
| "From on fresh?" | freshness check (warn/error) + volume anomaly; alert on SLA miss — data missing is as important as wrong. |
| "Data contract?" | Schema + expectations + freshness declared; producers maintain versioned, consumers rely — prevents silent breakage. |
| "Schema drift?" | Allow tolerated vs critical tables fail-fast; ADF mergeSchema / dbt schema tests. |
| "Incremental strategies?" | dbt incremental (unique_key, delete+insert), delta MERGE, CDC — balance freshness & cost. |
| "CI/CD for data?" | Branch → staging dbt build/test → merge → promote to prod (like app deployment). |

**Related:** [Day 45](../day-45-data-pipelines-dataops.md) · [MLOps](../topics/mlops-basics.md) · [Observability](../topics/observability.md) · [Serverless](../topics/serverless-event-driven.md)