# AI Agents in DevOps — From Chatbots to Autonomous Operators

> **Ek line mein:** AI agents DevOps me ab sirf "chat help" nahi — wo ab pipelines chalate hain, incidents resolve karte hain, infra provision karte hain, aur code likh dete hain. Ye deep dive batayega: kaise kaam karte hain, kaise deploy karte hain, aur production me kaise safe rakhte hain.

## Overview | Parichay

DevOps me AI ka evolution: **Copilot** (code suggestions) → **ChatOps** (Slack bots jo kubectl chalaate the) → **Agents** (autonomous loops jo observe→plan→act karte hain). Aaj ke agents LLM + tools + memory + planning ka combo hain. Wo sirf jawab nahi dete — wo **action lete hain**: Terraform apply, kubectl rollout, GitHub PR kholna, incident ka RCA likhna, cost optimization PR bhejna.

**Kyun important hai:** Manual toil (log grep karna, YAML fix karna, dependency update karna) ab AI agents automate kar sakte hain — lekin **guardrails** ke saath. Ye topic batayega kaise agents banate hain, kaise tools dete hain (MCP, function calling), aur production safety (human-in-loop, audit logs, rollback).

## What You'll Learn | Aaj Ki Seekh

- [ ] Agent architecture: LLM + Tools + Memory + Planning loop (ReAct, Plan-and-Execute)
- [ ] MCP (Model Context Protocol) — standard way agents tools access karte hain
- [ ] Agent types: Coding agents, Infra agents, Incident agents, Cost agents
- [ ] GitHub Copilot / Cursor / Windsurf — IDE agents ka use cases DevOps me
- [ ] Kubernetes operators as agents: K8sGPT, kagent, kubectl-ai
- [ ] Building a simple DevOps agent: Terraform plan → explain → PR bhejna
- [ ] Safety: Human-in-the-loop, audit logs, policy-as-code guardrails (OPA/Kyverno)

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart TD
    USER["Dev / SRE / Platform Engineer"] -->|Natural language goal| AGENT["AI Agent\n(LLM + Planner)"]
    AGENT -->|Tool calls (MCP / Function Calling)| TOOLS["Tool Registry\nkubectl, terraform, gh, aws, sql, prometheus"]
    TOOLS -->|Observation / Result| AGENT
    AGENT -->|Plan + Reasoning| MEMORY["Memory / Context\n(short-term + long-term vector store)"]
    AGENT -->|Proposed Action| GATE["Policy Gate\n(OPA / Kyverno / Human Approval)"]
    GATE -->|Approved| EXEC["Execution\nkubectl apply, terraform apply, gh pr create"]
    GATE -->|Denied| USER
    EXEC -->|Result / Logs| AGENT
    AGENT -->|Summary / Next step| USER
```

ASCII:
```
User Goal → Agent (LLM+Planner) → Tool Calls (MCP) → Observations
                                      ↓
                              Memory / Vector Store
                                      ↓
                              Policy Gate (OPA/Human)
                                      ↓
                              Execute → Result → Agent → User Summary
```

## Core Concepts | Samajho Agent Architecture

### 1. The Agent Loop (ReAct Pattern)

```
Thought: "User wants to scale deployment. I need to check current replicas first."
Action: kubectl get deploy/myapp -n prod -o json
Observation: replicas=3, CPU 85%
Thought: "High CPU. Scale to 6 with HPA or manual patch."
Action: kubectl scale deploy/myapp --replicas=6 -n prod
Observation: deployment scaled
Final Answer: "Scaled myapp from 3→6 replicas. Consider HPA for auto-scaling."
```

### 2. Tools via MCP (Model Context Protocol)

MCP standardizes how agents call external tools. Ek MCP server expose karta hai tools jaise:

```json
{
  "name": "kubernetes",
  "tools": [
    {"name": "kubectl_get", "description": "Get K8s resources", "inputSchema": {"type":"object","properties":{"resource":{"type":"string"},"namespace":{"type":"string"},"name":{"type":"string"}}}},
    {"name": "kubectl_apply", "description": "Apply manifest", "inputSchema": {"type":"object","properties":{"manifest":{"type":"string"}}}}
  ]
}
```

Agent calls tool → MCP server executes kubectl → returns structured result.

### 3. Agent Categories in DevOps

| Agent Type | Example Tools | Use Case |
|------------|---------------|----------|
| **Coding Agent** | Cursor, Copilot, Windsurf, Aider | Write Terraform, K8s YAML, GitHub Actions, fix lint |
| **Infra Agent** | kagent, kubectl-ai, K8sGPT, Terraform Agent | Provision infra, diagnose cluster, optimize costs |
| **Incident Agent** | PagerDuty AIOps, Blameless, custom | RCA auto-generate, runbook execute, page on-call |
| **Cost Agent** | Kubecost + LLM, FinOps agent | Rightsizing recommendations, idle resource cleanup PRs |
| **Security Agent** | Trivy + LLM, Snyk agent | Vuln triage, auto-fix PR, compliance check |

## Demo | Copy-Paste Karke Chalao

```bash
# 1. K8sGPT — AI-powered cluster diagnosis (install)
kubectl krew install k8sgpt
k8sgpt generate --backend ollama --model llama3.1  # local LLM
k8sgpt analyze --explain -n prod

# 2. kubectl-ai — natural language to kubectl
go install github.com/sozercan/kubectl-ai@latest
kubectl ai "scale deployment frontend to 5 replicas in namespace prod"
# Output: kubectl scale deployment frontend --replicas=5 -n prod  (asks confirmation)

# 3. GitHub Copilot CLI — gh copilot suggest
gh copilot suggest "create terraform for AKS cluster with managed identity"
# Gives you main.tf + variables.tf + outputs.tf

# 4. Build a tiny agent with Python + MCP (conceptual)
cat > devops_agent.py << 'EOF'
import json, subprocess, sys

TOOLS = {
    "kubectl_get": lambda args: subprocess.run(["kubectl","get",args["resource"],"-n",args.get("namespace","default"),"-o","json"],capture_output=True,text=True).stdout,
    "kubectl_scale": lambda args: subprocess.run(["kubectl","scale",args["resource"],f"--replicas={args['replicas']}","-n",args.get("namespace","default")],capture_output=True,text=True).stdout,
}

def call_tool(name, args):
    if name in TOOLS:
        return TOOLS[name](args)
    return f"Unknown tool: {name}"

# Simple ReAct loop (pseudo - replace with real LLM call)
goal = "Scale nginx deployment to 4 replicas in prod"
print(f"Goal: {goal}")
# LLM would decide: call kubectl_get deploy/nginx -n prod
obs = call_tool("kubectl_get", {"resource": "deploy/nginx", "namespace": "prod"})
print(f"Observation: {obs[:200]}")
# LLM decides next: scale to 4
result = call_tool("kubectl_scale", {"resource": "deploy/nginx", "replicas": 4, "namespace": "prod"})
print(f"Result: {result}")
EOF
python3 devops_agent.py
```

## Real-Life Example | Industry Me

**Platform team at a fintech (500 engineers):**

1. **Coding agents** (Cursor/Copilot) — engineers likhte hain Terraform modules, GitHub Actions workflows, K8s manifests. 40% boilerplate reduction.
2. **Infra agent** (kagent) — "Create Postgres with backup + monitoring" → agent generates Terraform + K8s manifests + opens PR with plan output.
3. **Incident agent** — PagerDuty alert fires → agent fetches logs/metrics/traces → writes RCA draft in Confluence → suggests runbook step → on-call approve → agent executes rollback.
4. **Cost agent** — Nightly: Kubecost data → LLM analyzes idle PVCs, over-provisioned nodes, unused LB → creates GitHub issues with Terraform PRs to rightsize.
5. **Guardrails:** Har agent action `opa eval` se pass hota hai. Destructive actions (delete, scale-down) require human approval via GitHub PR review.

**Results:** MTTR 45min → 12min, infra PRs 2hr → 15min, cost waste 18% → 4%.

## Practice Exercise | Abhi Karein

1. Install K8sGPT (`kubectl krew install k8sgpt`) + run `k8sgpt analyze --explain` on a local kind/minikube cluster.
2. Try `kubectl-ai` or `gh copilot suggest` for: "create a deployment with 3 replicas, resource limits, and liveness probe".
3. Write a 50-line Python script that: (a) takes a natural language goal, (b) uses a hardcoded tool map (kubectl_get, kubectl_scale), (c) prints the ReAct loop steps. Run it.
4. Set up a local MCP server (see `modelcontextprotocol.io` quickstart) exposing `kubectl_get`. Connect a simple LLM client (Ollama + function calling).
5. Add an OPA policy: `deny` any `kubectl delete` or `scale --replicas=0` from agent without human approval label.

## Quick Notes | Yaad Rakho

```
- Agent = LLM + Tools (MCP/Function Calling) + Memory + Planning Loop
- MCP = standard protocol for agent↔tool communication (JSON-RPC over stdio/HTTP)
- ReAct pattern: Thought → Action → Observation → repeat → Final Answer
- DevOps agent categories: Coding, Infra, Incident, Cost, Security
- K8sGPT / kubectl-ai / kagent = ready-to-use DevOps agents (open source)
- GitHub Copilot / Cursor / Windsurf = IDE agents for writing DevOps code
- Safety FIRST: Policy gate (OPA/Kyverno), Human-in-loop for destructive actions, Audit logs mandatory
- Vector memory = long-term context (past incidents, runbooks, cluster state)
- Start small: read-only agents (diagnose, explain) → then write with approval → then autonomous with guardrails
- Cost: LLM API calls add up — use local models (Ollama) for dev, cache embeddings
- Observability: Log every agent decision + tool call + result (OpenTelemetry)
```

**Agla:** Agentic CI/CD Pipelines — AI agents in GitHub Actions / GitLab CI / Azure Pipelines.