# 🤖 AIOps & LLMOps — AI in DevOps

> **Hinglish:** AIOps = **AI/machine learning se ops automate karo** — logs ke pattern se root cause, anomalies, alerts reduce, self-healing. LLMOps = **genAI (LLMs) ko production context me run karo**: vector DBs, RAG, model serving, eval, prompt guardrails, GPU. Ye dono trending hai.

## 📖 Overview — Ye Topic Kya Hai

Two strands:

**AIOps (AI for IT operations):** Machine learning ko ops data pe lagao — **anomaly detection** (bahtar instead of static thresholds), **log analysis** (ML se root cause suggestion), **intelligent alerting** (correlation, dedupe — alert storm end), **predictive issues** (failure pehle seedha bata de), **self-healing** (auto incident resp). Tools: Datadog AI, Dynatrace Davis, Splunk ITSI, Moogsoft.

**LLMOps (GenAI in prod):** Ek LLM app sirf API call nahi — ek **pipeline+platform** hai: **RAG** (vector DBs ke retrieval), **model/embedding serving**, **prompt/guardrail** (safety), **evaluation** (quality tests), **monitoring** (cost, latency, hallucination), **fine-tuning** pipelines, **GPU/inference cost**. Tools: LangChain, LlamaIndex, pgvector/FAISS, Weaviate, triton.

## 🟢 Beginner — Shuruaat yahan se

- AIOps vs RuleOps — rules vs ML difference.
- **Anomaly detection basics** — thresholds vs ML.
- RAG concept — vector + retrieval = answers.
- Vector embedding kya hai — hi-level.
- LLMOps vs MLOps — difference.

## 🟡 Intermediate — Ab implement karo

- Alert correlation/dedupe — overflow reduce.
- RAG pipeline: chunk → embed → index → retrieve → prompt.
- Eval harness — answer quality tests add.
- Prompt guardrails — injection/safety rules.
- Model serving + caching — latency/cost control.

## 🔴 Advanced — Pro bano

- **Fine-tuning pipeline** — base model + custom data.
- **LLM ops monitoring** — token cost, drift, hallucination rates.
- **GPU/inference infra** — scale, autoscaler.
- **AIOps self-healing** — recommended + auto-fix.
- **Trust & safety** — eval gates to production.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **AIOps** — AI for IT operations.
- [ ] **Anomaly detection** — ML picks outliers.
- [ ] **Log analysis** — ML root cause on logs.
- [ ] **Intelligent alerting** — dedupe, correlation.
- [ ] **Predictive maintenance** — failure pre-detection.
- [ ] **Self-healing** — auto incident response.
- [ ] **Observability + AI** — metrics join.
- [ ] **LLMOps** — genAI in production.
- [ ] **RAG** — retrieval-augmented generation.
- [ ] **Embeddings** — vector representation of text.
- [ ] **Vector databases** — similarity search (pgvector, FAISS).
- [ ] **Prompt engineering** — designing prompts.
- [ ] **Guardrails** — safe LLM output usage.
- [ ] **Model evaluation** — quality benchmarks.
- [ ] **Fine-tuning** — adapt model to data.
- [ ] **Inference serving** — model endpoints.
- [ ] **Token & cost optimization** — cost-per-request.
- [ ] **Latency requirements** — streaming, caching.
- [ ] **Hallucination mitigation** — grounded answers.
- [ ] **Data pipelines for GenAI** — prep+embedding.
- [ ] **Monitoring LLM apps** — eval in prod.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Datadog AI / Dynatrace Davis | AIOps analysis | Incident detection |
| Splunk ITSI | Intelligent ops | Log analytics |
| LangChain / LlamaIndex | LLM framework | RAG pipelines |
| pgvector / FAISS / Weaviate | Vector store | Similarity search |
| Triton / Ray Serve | Model serving | Inference infra |
| OpenTelemetry + eval | LLM monitoring | Production GPT apps |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Anomaly Demo:** Metric timeseries pe anomalies detect (simple ML / Prophet) — threshold vs ML compare.
- [ ] **Lab 2 — RAG Mini:** PDF docs → embedded → pgvector → LangChain query, citations with.
- [ ] **Lab 3 — Eval Harness:** 10 test Q+A, answer quality score, guardrail poor answers.
- [ ] **Lab 4 — Cost Watch:** Token usage + cost dashboard; cache + model switch experiment.
- [ ] **Project — AIOps Ops Dashboard:** Logs + metrics + anomaly + auto-alert correlation = mini intelligence stack.

## 🔗 Related Topics

- [📡 Observability](../modules/observability.md)
- [📈 Monitoring](../modules/monitoring.md)
- [🏛️ Architecture](../modules/architecture.md)
- [AI Agents in DevOps](../topics/ai-agents-devops.md)
- [Day 44 — MLOps](../day-44-mlops.md)