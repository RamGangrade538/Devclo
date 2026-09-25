# Deep Dive: MLOps — Model Lifecycle, MLflow, Serving, Drift, LLMOps

> **Standalone deep dive:** ML = just another software artifact with extra stages (data versioning, training, evaluation, serving, drift). Reproducibility + automation + monitoring = MLOps.

---

## 1. The Extra Complexity vs Classic DevOps

```
Software: source → build → test → deploy → monitor (deterministic)
ML adds:   data (version, quality) → train → eval(gates) → register → serve → drift → retrain
           - env involves nondeterminism (weights) → reproducibility needs pinning everything
           - data changes over time → drift (model decays without code change)
           - evaluation gates (accuracy) are the "tests"
```
MLOps = CI/CD for models + **continuous training + continuous deployment** in one loop.

---

## 2. Reproducibility — The Rule of 4

```
same DATA version + same CODE commit + same ENV (library/OS/gpu) + same SEED
  → same model artifact (up to floating point fuzz)
Versioning tools:
  - Data: DVC, lakeFS, Delta Lake (time-travel), MLflow datasets
  - Code: git (obvious)  Env: Docker/poetry/conda lock  Seed: logged as param
```
MLflow **tracking** logs params/metrics/artifacts per run → any experiment reproducible w/ `mlflow run`.

---

## 3. MLflow Basics (Open Standard)

```bash
pip install mlflow
cat > train.py << 'EOF'
import mlflow, mlflow.sklearn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
mlflow.set_experiment("iris-clf")
with mlflow.start_run():
    X, y = load_iris(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression(C=1.0).fit(Xtr, ytr)
    acc = model.score(Xte, yte)
    mlflow.log_param("C", 1.0)
    mlflow.log_metric("acc", acc)
    mlflow.set_tag("data_version", "dvc:abc123")
    mlflow.sklearn.log_model(model, "model")
EOF
python train.py && mlflow ui   # http://127.0.0.1:5000
```
**Registry with lineage:** model store keeps versions; record which data/tracking/pipeline produced each → **lineage = audit + rollback story**.

---

## 4. The MLOps Pipeline (with Gates)

```
┌──────────────────────────────────────────────────────────────┐
│ Data: (versioned) → validate (nulls, skew) → feature store    │
│ Train: job (env-pinned, seed) → metrics                       │
│ Evaluate gate: precision/recall/AUC ≥ threshold + fairness     │
│ Registry: register(vX, stage=staging) — lineage link          │
│ Deploy: endpoint (fixed version) w/ canary/A-B                │
│ Monitor: data-drift (KS/EVD), concept-drift, accuracy proxy    │
│ Drift → new training job triggered (data version bump)          │
└──────────────────────────────────────────────────────────────┘
CI/CD for ML: data change OR code change OR drift → pipeline (自動) w/ gates along the way.
```

---

## 5. Serving — Real-time, Batch, Edge

| Serving mode | When | Tech |
|--------------|------|------|
| Real-time endpoint | online predict (<1s) | AzureML online endpoint, TFServing, Triton, KServe |
| Batch | nightly scoring (millions) | Azure Batch, Spark batch, scheduled endpoints |
| Edge/IoT | offline, low-power | **ONNX Runtime** (portable), TensorFlow Lite, TensorRT |

```bash
# ONNX — portable model (any cloud/language)
mlflow models convert-model -m runs:/<id>/model --output mymodel.onnx
onnxruntime-inference mymodel.onnx
```
Canary/A-B: deploy v2 behind gateway → route % traffic → promote after monitoring (same as app canary, day 46).

---

## 6. Monitoring — Data & Concept Drift

```
DATA drift: distribution of input features changed vs training
  → KS-test/PSI per feature; alert when p < 0.05
CONCEPT drift: relationship features→label changed (real-world changed)
  → accuracy proxy (ground truth trickle): e.g., "disputed orders %" for fraud model
Operational: latency/errors (endpoint) as usual day 24-27
```
```python
from scipy import stats
ks, p = stats.ks_2samp(train_feature, live_feature)
if p < 0.05: trigger_retrain_ticket()
```
**Retraining trigger:**
```
- scheduled (weekly if data fresh daily)
- drift metric crossed
- feedback accuracy proxy dropped
- business event (new product line → retrain with new label schema)
```
Guardrails: data quality gates before training (nulls, schema), fairness checks, rollback = register old version + endpoint revert (minutes).

---

## 7. LLMOps (GenAI) — the new frontier

| Concern | Practice |
|---------|----------|
| Model versioning | Pin foundation model + prompt version + eval set (prompt versioned like code!) |
| Eval | automated: golden datasets + LLM-as-judge (secondary model scores outputs) |
| Guardrails | input/output filters (prompt injection, jailbreaks), data redaction (PII) |
| Cost/latency | token budgets, caching, cheaper-model fallback, batch vs streaming |
| RAG | index pipelines, chunking versioning, retrieval quality tests |
| Compliance | audit logs of prompt/output, prompt SLOs (confidence, refusal rate) |

Prompt/skills = versioned + diffable (in git), eval before rollout, canary to users.

---

## 8. Interview Questions — MLOps

| Question | Strong answer |
|----------|---------------|
| "Reproducibility kaise?" | Pin data version + code commit + env (lock) + seed; MLflow tracking logs everything; reruns identical. |
| "Data vs concept drift?" | Data = input feature distribution shifted (KS/PSI); concept = features↔label relation changed (accuracy proxy). Both → retrain. |
| "MLflow?" | Tracking (params/metrics/artifacts), registry (versions+lineage), serve models; open standard, cloud-neutral. |
| "Serving options?" | Real-time endpoint / batch nightly / edge ONNX; A-B via gateway like normal canary. |
| "Evaluation gate?" | Offline metrics (precision/recall/AUC) on holdout + fairness + error cases review — only pass to registry. |
| "Rollback quickly?" | Registry keeps versions; revert endpoint to vX (or canary weights) in minutes. |
| "LLMOps spec?" | Prompt versioning, evals (LLM-as-judge), guardrails, token cost/latency budgets, RAG quality tests. |
| "When to avoid ML?" | Simple heuristics/analytics work & cheaper; MLOps costs; begin with MVP + monitoring. |

**Related:** [Day 44](../day-44-mlops.md) · [Data Pipelines](../topics/dataops-pipelines.md) · [Serverless](../topics/serverless-event-driven.md) · [Observability](../topics/observability.md)