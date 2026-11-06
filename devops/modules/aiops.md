# 🤖 AIOps & LLMOps — AI in DevOps

> **Hinglish:** AIOps = **server/ops ka data dekh ke AI se problem pehle pakadna** (alert kam karna, root cause batana, auto-fix). LLMOps = **LLM wali app ko production me safely chalana** (RAG, cost, speed, testing). Ye dono alag cheezein hain — naam sunke confuse mat hona.

## 🧠 Pehle Ek Kahani — Isse Sab Clear Ho Jayega

Raat ke 3 baje hain. Tumhare phone pe **200 alerts** aa rahe hain — "CPU high", "disk full", "service down", "latency badh gayi"...

Lekin asli problem sirf **ek** hai: database ka connection pool full ho gaya, isliye baaki sab services slow ho gayi.

Ab do raste hain:

- **RuleOps (purana tarika):** Har alert ke liye alag rule. "CPU > 80% to alert." 200 alerts = 200 phone calls. Insaan thak jata hai, asli root cause dhundhne me time jaata hai.
- **AIOps (naya tarika):** AI saara data (metrics + logs + traces) ek saath dekhta hai, 200 alerts ko **correlate** karta hai, aur bolta hai: *"Sirf DB pool full hai, baaki sab uski wajah se hai."* 200 alerts → **1 incident**.

Bas! AIOps ka kaam hai **shor (noise) kam karke signal dena**.

Doosri side: agar tumne ChatGPT jaisi app banayi hai, to usme AIOps ka koi lena-dena nahi. Uske liye **LLMOps** chahiye — matlab LLM app ko production me chalane ka poora system.

## 📖 Overview — AIOps Aur LLMOps Alag Kyun Hain?

| | **AIOps** | **LLMOps** |
|---|---|---|
| Kaam | Ops data me AI lagana | AI (LLM) app ko chalana |
| Input | Metrics, logs, alerts | Prompts, documents, user questions |
| Output | Root cause, kam alerts, auto-fix | Sahi jawab, kam cost, safe output |
| Example | Datadog, Dynatrace, Moogsoft | LangChain, pgvector, Triton |
| Tum kaun ho? | SRE/DevOps jo systems chalata hai | ML/App engineer jo AI product banata hai |

**Simple line:** AIOps me AI **tumhari help** karta hai. LLMOps me tum AI ki **help** karte ho (usko production-ready banate ho).

### AIOps ke 5 kaam (yaad rakhne layak)

1. **Anomaly detection** — "ye number normal nahi hai" (fixed threshold ki jagah AI pattern dekhta hai).
2. **Log analysis** — hazaaron log lines me se error ka pattern nikalna.
3. **Alert correlation** — 200 alerts ko 1 incident banana (dedupe + grouping).
4. **Predictive** — disk full hone se **pehle** batana.
5. **Self-healing** — chhota fix khud karna (pod restart, scale up), bada kaam human ko dena.

### LLMOps ke 6 kaam (yaad rakhne layak)

1. **RAG** — model ko apne documents se jawab dilwana (bina dobara train kiye).
2. **Vector DB** — documents ko numbers (embeddings) me rakhna, similarity search ke liye.
3. **Serving** — model ko API banana, jise app call kare.
4. **Eval** — test questions se check karna ki jawab sahi hain ya nahi.
5. **Guardrails** — galat/toxic/unsafe output rokna, prompt injection se bachna.
6. **Monitoring** — token cost, latency, hallucination track karna.

## 🔑 6 Words Jo Sabse Pehle Samajhne Hain

| Word | Aasan matlab |
|---|---|
| **LLM** | Bada language model (GPT/Claude/Llama) — text samajhta/likhta hai |
| **Prompt** | Model ko diya gaya instruction/question |
| **Embedding** | Text ko numbers ki list me badalna, taaki machine compare kar sake |
| **Vector DB** | Embeddings ka database — "iss se milta-julta text do" |
| **RAG** | Pehle apne documents search karo, phir unhe model ko deke jawab lo |
| **Agent** | LLM + tools + memory — sirf jawab nahi, kaam bhi karta hai |

**RAG ko aise samjho:** closed-book exam vs open-book exam. RAG = model ko open book de dena (tumhare docs), isliye jawab zyada sahi aur cited hota hai.

## 🟢 Beginner — Shuruaat Yahan Se

- **AIOps vs RuleOps** — story wala difference: 200 alerts vs 1 incident.
- **Anomaly kya hai** — baaki dinon se alag dikhne wala number. Example: raat 3 baje traffic 10x badh jaye.
- **RAG kya hai** — pehle search, phir jawab. Bina training model ko tumhara data dikhane ka tarika.
- **Embedding kya hai** — "billi" aur "cat" ke numbers paas-paas hote hain, isliye search kaam karta hai.
- **LLMOps vs MLOps** — MLOps model train/deploy karta hai; LLMOps prompt, RAG, eval, cost, safety sambhalta hai.

## 🟡 Intermediate — Ab Implement Karo

- **Alert dedupe/correlation** — same root cause wale alerts ko group karo, warna on-call pagal ho jayega.
- **RAG pipeline** — document → chhote chunks → embedding → vector DB → search → prompt.
- **Eval harness** — 10-20 golden questions banao; har change ke baad score check karo.
- **Prompt guardrails** — input me injection filter, output me PII/unsafe content filter.
- **Serving + caching** — same sawal ka jawab cache karo; model switch karke cost/latency compare karo.
- **Rate limiting + queue** — model ki capacity 1 request hai to 10 users ko queue me rakho, 429 + Retry-After do.

## 🔴 Advanced — Pro Bano

- **Fine-tuning** — base model ko apne data pe thoda aur train karna (RAG se mehnga, sirf style/skill ke liye).
- **LLM monitoring** — token cost per request, p95 latency, hallucination rate, drift.
- **GPU/inference infra** — batching, autoscaling, model quantization.
- **AIOps self-healing** — low-risk fixes auto karo, high-risk ke liye human approval (human-in-the-loop).
- **Trust & safety** — eval + guardrail gates ke bina production deploy mat karo.

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

- [ ] **Lab 1 — Anomaly Demo:** Ek metric ki timeseries lo; threshold rule vs simple ML se anomaly nikalo; dono ke false alerts compare karo.
- [ ] **Lab 2 — RAG Mini:** 5-10 PDF/text docs → chunks → embeddings → pgvector → query; har jawab ke saath source citation dikhao.
- [ ] **Lab 3 — Eval Harness:** 10 test Q+A likho; score do; ek galat prompt ko guardrail se roko.
- [ ] **Lab 4 — Cost Watch:** Token usage + cost dashboard banao; caching on/off aur do models ka cost-per-answer compare karo.
- [ ] **Project — AIOps Ops Dashboard:** Logs + metrics + anomaly + alert correlation ek screen pe; ek fake incident inject karke dekho ki 200 alerts 1 incident me collapse hote hain ya nahi.

## 🔗 Related Topics

- [📡 Observability](../modules/observability.md)
- [📈 Monitoring](../modules/monitoring.md)
- [🏛️ Architecture](../modules/architecture.md)
- [AI Agents in DevOps](../topics/ai-agents-devops.md)
- [Day 44 — MLOps](../day-44-mlops.md)
