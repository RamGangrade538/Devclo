# 🩺 Troubleshooting — Debug Ops Issues Like a Pro

> **Hinglish:** Jahan 90% kaam chalta hai wahi rukta hai: **kuch toot gaya aur apko pata nahi kyun**. Ye module structured troubleshooting ka framework deta hai: logs, metrics, traces, reproducible steps, bisect, hypothesis-test, system/remedy patterns.

## 📖 Overview — Ye Topic Kya Hai

Ops troubleshooting = **systematic root-cause analysis**, uska chabi concept: ghabrao nahi, pehle hypothesis banao.

Framework: 1) **Reproduce** definitively. 2) **Isolate** (app vs network vs infra). 3) **Collect data** — logs (`journalctl`, `kubectl logs`), metrics (CPU/mem/net), traces (distributed), configs, resource state. 4) **Hypothesis → test** (change one variable). 5) **Fix + verify + prevent** (notes, monitoring, autofix). 6) Bisect (release/commit pe).

Common domains: **HTTP failures** (4xx/5xx), **pod crash/ImagePullBackOff**, **network/DNS**, **DB connection/perf**, **memory leaks**, **disk full/IO**, **timeouts**, **deployment rollback**, **race conditions**, **cert expiry**.

## 🟢 Beginner — Shuruaat yahan se

- Logs pehle — `kubectl logs`, `journalctl -xe`.
- HTTP status codes — 4xx vs 5xx split.
- `df`, `free`, `top/htop`, `ss` — resource check.
- Error message ko Google/search pe **verbatim** dhundo.

## 🟡 Intermediate — Ab methodically karo

- **Reproduce** before fixing.
- **Bisect** — half the problem inputs.
- Hypothesis-test loop — ek variable kam.
- Check **recent deploy/release** — common cause.
- Metrics vs logs continuity — correlation.

## 🔴 Advanced — Pro bano

- **Distributed tracing** — full call path.
- **Memory/CPU profiling** — deep leaks.
- **Network deep** — pcap/tcpdump, DNS, TLS handshake.
- **Race conditions** — concurrency debugging.
- **Postmortem → prevention** — monitoring + automation.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Reproduce before fix** — problem clearly reproduce.
- [ ] **Log analysis** — parse + traces.
- [ ] **Metrics correlation** — resource vs timing.
- [ ] **Tracing** — call path inspect.
- [ ] **Isolate scopes** — app vs network vs infra.
- [ ] **HTTP status codes** — status guide.
- [ ] **Pod crash states** — CrashLoopBackOff, ImagePullBackOff.
- [ ] **Resource issues** — disk, memory, CPU.
- [ ] **DNS failures** — resolution check.
- [ ] **TLS/cert issues** — expiry/SNI.
- [ ] **DB connection pool** — exhausted issues.
- [ ] **Timeouts/retries** — latency debugging.
- [ ] **Bisect debugging** — halving inputs.
- [ ] **Rollback path** — revert quickly.
- [ ] **Config drift** — env mismatch.
- [ ] **Postmortem** — blameless incident learning.
- [ ] **Observability first** — data before guess.
- [ ] **Staged rollout** — canary reducing blast.
- [ ] **Automated recovery** — self-heal where safe.
- [ ] **Environmental parity** — reproduce local.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| kubectl / k9s | K8s inspect | Cluster issues |
| journalctl / tail | Logs | System logs |
| top / htop / pidstat | Resource | CPU/mem usage |
| ss / tcpdump / Wireshark | Network | Network debug |
| Jaeger / Tempo | Tracing | Call path |
| Prometheus / Grafana | Metrics | Correlated metrics |
| Valgrind / py-spy | Profiling | Leak/CPU analysis |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Broken Pod Lab:** CrashLoopBackOff + ImagePullBackOff diagnose: logs, describe, fix.
- [ ] **Lab 2 — OOM Debug:** App memory leak → VmRSS/mem metrics se trace → fix + protect.
- [ ] **Lab 3 — Network Puzzle:** DNS/TCP/TLS failure isolate layer-by-layer.
- [ ] **Lab 4 — Bisect Drill:** Recent release regress → git bisect/changelog se culprit commit find.
- [ ] **Project — Debug Playbook:** Apne top-5 on job issues ki systematic playbook (symtom → check → fix) banao.

## 🔗 Related Topics

- [📡 Observability](../modules/observability.md)
- [🚒 Incident Management](../modules/incident-management.md)
- [🏎️ Performance Engineering](../modules/performance-engineering.md)
- [Debugging Microservices](../topics/distributed-tracing-opentelemetry.md)
- [Day 47 — Performance Engineering](../day-47-performance-engineering.md)