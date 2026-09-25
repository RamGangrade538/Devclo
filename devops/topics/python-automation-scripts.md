# Deep Dive: Python for DevOps Automation — Scripts Se Platform Tak

> **Standalone deep dive:** Bash = quick admin; **Python = jahan loops/APIs/parsing/CI scripting** baat aati hai. Sab modern DevOps tooling (Ansible, boto3, azure-sdk, dbt, MLflow) Python ka API deta hai.

---

## 1. Python Kyon (For DevOps)?

| Bash | Python |
|------|--------|
| Quick one-liner, admin | Complex logic, APIs, JSON/data structures |
| kaho-strings fragile | Clean flow control, error/handling |
| Cross-platform painful | Works everywhere (incl Windows CI) |
| No data structures rich | Lists/dicts/sets — parsing easy |
| No good HTTP client | `requests`/`httpx` — REST harmony |

**Golden line (interview):** *"Bash for the server floor, Python for the building manager."*

---

## 2. Core Basics (Refresh Fast)

```python
# Variables + types
env = "prod"
regions = ["eastus", "westeurope", "eastasia"]
config = {"min": 2, "max": 10, "env": env}

# Conditions + loops
for r in regions:
    if r != "eastus":
        print("deploy to", r)

# Functions
def scale(deploy, count):
    return f"{deploy}: {count} replicas"

# Env vars
import os
token = os.environ.get("TOKEN", "")       # never hardcode!
```

**Path/file handling:**
```python
from pathlib import Path
Path("logs").mkdir(exist_ok=True)
Path("app.yaml").read_text()
Path("out.txt").write_text("done\n")
for f in Path(".").glob("*.log"): print(f)
```

---

## 3. JSON/YAML — API Aur Config Ka India

```python
import json
resp = requests.get(url).json()
print(resp["id"], resp["name"])
json.dump(data, open("out.json", "w"), indent=2)

import yaml
config = yaml.safe_load(open("config.yaml"))
```

**Common pattern — fetch + transform + write:**
```python
import requests, os, yaml
URL = os.environ["CI_API_URL"]
jobs = requests.get(URL, timeout=10).json()
summaries = [{"name": j["name"], "status": j["status"]} for j in jobs]
open("summary.yaml", "w").write(yaml.safe_dump(summaries))
open("summary.json", "w").write(json.dumps(summaries, indent=2))
```

---

## 4. Automation Workhorses — argparse, subprocess, logging, scheduler

```python
# CLI arguments
import argparse
p = argparse.ArgumentParser()
p.add_argument("--action", choices=["deploy", "rollback"], required=True)
p.add_argument("--dry-run", action="store_true")
args = p.parse_args()
print(args.action, args.dry_run)

# Subprocess — call system tools + capture
import subprocess
out = subprocess.run(["kubectl", "get", "pods"], capture_output=True, text=True, check=False)
print(out.stdout)

# Logging (proper — not print!)
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logging.info("deploy started")

# Retry helper (flaky API/network)
import time
def retry(fn, tries=3, delay=2):
    for i in range(tries):
        try:
            return fn()
        except Exception:
            if i == tries - 1: raise
            time.sleep(delay)
```

**Scheduled automation:** `schedule` lib ya cron/systemd (`python3 script.py`) ([systemd topic](../topics/linux-systemd-service-management.md)).

---

## 5. Requests + Error Handling (Been the 502 Hell)

```python
import requests, logging

def call_api(url, token, retries=3):
    for n in range(retries):
        try:
            r = requests.get(url, timeout=10,
                             headers={"Authorization": f"Bearer {token}"})
            r.raise_for_status()
            return r.json()
        except requests.exceptions.ConnectionError as e:
            logging.warning("conn retry %s: %s", n, e)
            time.sleep(2 ** n)            # exponential backoff
    raise RuntimeError(f"API down after {retries} attempts")
```

| Exception | Matlab | Fix |
|-----------|--------|-----|
| `ConnectionError` | Down/network | retry + backoff |
| `Timeout` | Slow | timeout param, smaller retry |
| `HTTPError` (4xx/5xx) | Status | check code + message |
| `JSONDecodeError` | Not json | validate content-type |

---

## 6. Azure/AWS API Interaction — The Real DevOps

**Azure (azure-identity + resource-groups):**
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient

cred = DefaultAzureCredential()
client = ComputeManagementClient(cred, subscription_id="<sub>")

for vm in client.virtual_machines.list("devops-rg"):
    print(vm.name, vm.hardware_profile.vm_size)
```

**AWS (boto3):**
```python
import boto3
ec2 = boto3.client("ec2", region_name="ap-south-1")
insts = ec2.describe_instances(
    Filters=[{"Name":"instance-state-name","Values":["running"]}])
print(len(insts["Reservations"]))
```

**K8s (kubernetes client):**
```python
from kubernetes import client, config
config.load_kube_config()
core = client.CoreV1Api()
for ns in core.list_namespace().items:
    print(ns.metadata.name)
```

---

## 7. Python In CI — The Pipeline Brain

**GitHub Actions step:**
```yaml
- name: Run automation script
  run: python3 scripts/healthcheck.py --env staging
  env:
    TOKEN: ${{ secrets.API_TOKEN }}
```

**Script ko robust rup se:**
```python
import sys, os, json
required = ["TOKEN", "ENV"]
missing = [k for k in required if not os.environ.get(k)]
if missing:
    sys.exit(f"Missing env: {missing}")     # CI fail fast, clear message
# no exit(0) on failure — raise/exit(1)
```

---

## 8. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **CI step passes but script fails** | `exit(0)` forgot / exception swallowed | Rely on `raise`, `sys.exit(1)`; don't `except: pass` |
| **Secret hord anga in script** | Hardcoded in code | `os.environ`, CI secrets, key vault |
| **Long script hangs** | no timeout | `requests` timeout param, subprocess `timeout=` |
| **Timezone/mday in automation** | naive datetime | `datetime.utcnow()` with `pytz`/ISO; `datetime.now(timezone.utc)` |
| **File path break (Windows CI)** | Hardcoded `/` separator | `Path` / `os.path.join` |
| **API payload config JSON** | Manual dict dupe | Use dataclasses + `json.dumps` |
| **Retry logic missing** | Flaky network script | Retry helper with backoff |
| **Script ad-hoc dupe** | 50 copy-paste scripts | Modules, CLIs with argparse, shared utils, tests (pytest) |

---

## 9. Interview Questions — Python for DevOps

| Question | Strong Answer |
|----------|---------------|
| "Python script kaise structure karte?" | Main() + argparse + logging + retries + env vars (secrets) + exit codes; tests via pytest. |
| "requests se handling?" | raise_for_status, timeout, retry w/ backoff, auth headers from env. |
| "subprocess vs os.system?" | subprocess — capture/safety/args-lists (no shell injection); os.system string = danger. |
| "YAML/JSON parse?" | `yaml.safe_load`/`json.loads`; never eval. |
| "Path handling?" | `pathlib.Path` — cross-platform glob/join/mkdir/read. |
| "Idempotent script pattern?" | Check-before-act: `if not Path(f).exists(): write`; cloud SDK check existing resource. |
| "Python in CI?" | Steps run scripts with env map; fail-fast with sys.exit/raise; lint (ruff/mypy-ish) in CI. |
| "Concurrency needed (many hosts)?" | `concurrent.futures.ThreadPoolExecutor` / `asyncio` for I/O; keep count low. |

---

## 10. Hands-On Lab

```bash
mkdir -p ~/pylab && cd ~/pylab && python3 -m venv .venv && source .venv/bin/activate

# 1. Toolbox script (fetch + parse + save)
pip3 install requests pyyaml
cat > jobs.py <<'EOF'
import requests, yaml, json, sys, os
URL = os.environ.get("API_URL", "https://api.github.com/repos/anomalyco/opencode")
r = requests.get(URL, timeout=10); r.raise_for_status()
data = r.json()
summary = {"repo": data["name"], "stars": data["stargazers_count"]}
open("summary.yaml","w").write(yaml.safe_dump(summary))
open("summary.json","w").write(json.dumps(summary, indent=2))
print(summary)
EOF
API_URL=https://api.github.com/repos/anomalyco/opencode python3 jobs.py
cat summary.yaml

# 2. CLI + argparse
cat > deploy.py <<'EOF'
import argparse, sys, os
p = argparse.ArgumentParser()
p.add_argument("--env", required=True)
p.add_argument("--dry-run", action="store_true")
a = p.parse_args()
if not os.environ.get("TOKEN"):
    sys.exit("Missing TOKEN env var")
print("deploy to", a.env, "(dry)" if a.dry_run else "")
EOF
TOKEN=x python3 deploy.py --env prod
TOKEN=x python3 deploy.py --env prod --dry-run
TOKEN=x python3 deploy.py            # exit code 2 -> helpful usage (argparse)

# 3. Retry demo
cat > retry.py <<'EOF'
import time
def flaky():
    if time.time() % 3 < 2: raise ConnectionError("boom")
    return "ok"
for i in range(5):
    try: print(flaky())
    except ConnectionError as e: print("retry:", e); time.sleep(1)
EOF
python3 retry.py
```

---

## 11. Summary | Yaad Rakho

1. Bash = server floor, Python = building manager (logic + APIs)
2. Basics: env/loops/functions/dicts + `os.environ` for secrets
3. JSON/YAML parse + write — automation ka data backbone
4. `argparse` CLI, `subprocess`, `logging` (not print), `pathlib`
5. `requests`: timeout, raise_for_status, retry+backoff
6. Cloud SDKs (azure-identity/boto3/kubernetes) — same script pattern
7. CI: env vars, fail-fast `sys.exit(1)`, no swallowed exceptions
8. Tests with pytest make scripts production-grade

---
**Related:** [Day 4](../day-04-shell-scripting-basics.md) · [Day 13](../day-13-advanced-shell-scripting-automation.md) · [Build Tools](../day-11-build-tools-maven-gradle.md) · [Capstone](../capstone/day-29-capstone-planning.md) · [Testing](../topics/testing-and-test-automation.md)