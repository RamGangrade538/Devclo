# 🐍 Programming & Scripting — Bash / Python / Go

> **Hinglish:** DevOps engineer ka "hath-ka-hathiyar" scripting hai. Pyare scripts (bash) se chhoti automation, Python se badi automation + APIs, aur Go se performance-heavy tools. Ye module bataata hai programming ka core concepts jo teeno languages pe apply hote hain.

## 📖 Overview — Ye Topic Kya Hai

Ek DevOps engineer ko production-grade code banane ki zaroorat nahi, par **automation likhni** zaroor hoti hai. Isliye kam-az-kam **ek language well** aani chahiye. Bash sabse simple hai aur har server pe hai; Python power + most ecosystem ke saath hai (cloud SDKs, automation frameworks); Go fast binaries banata hai (jisme kai modern tools — Docker, K8s — likhe gye hain).

Is module me ham core programming concepts cover karenge jo language-agnostic hain: variables, data structures, functions, modules, exceptions, error handling, logging, file handling, HTTP requests, JSON/YAML parsing, regex, CLI apps aur testing.

## 🟢 Beginner — Shuruaat yahan se

- **Variables & types** — data ko naam do: strings, numbers, booleans, lists/arrays, dicts.
- **Data structures** — list, dict/map, set, tuple — kab kaunsa.
- **Control flow** — `if/else`, loops (`for`, `while`).
- **Functions** — chhote reusable blocks; `args`, `return`.
- **CLI basics** — script chalao, arguments lo, output print karo.

## 🟡 Intermediate — Real automation likho

- **Modules/packages** — code ko import karke reuse karo.
- **Exceptions** — errors ko catch/raise karke crash hina roko.
- **File handling** — read/write files, open/close, context manager.
- **HTTP requests** — APIs call karna, auth, JSON dekhna.
- **Regex** — text pattern matching (`re` in python, `grep -E` in bash).
- **Logging** — structured logs likhna (print se behtar).
- **Environment vars & config** — app setup bina secrets hardcode kiye.

## 🔴 Advanced — Production-grade

- **Testing** — unit tests, mocking, coverage (pytest).
- **Type hints / error handling patterns** — code robust banao.
- **Concurrency/parallelism** — threads vs async vs goroutines; kab kaunsa.
- **CLI frameworks** — `click`, `argparse`, `cobra` — achi CLI tools banao.
- **Packaging** — pip package / Go binary / bash script distro.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Variables** — data ko naam; `name = "Devops"`.
- [ ] **Data structures** — list/dict/set/tuple; data kaise organize karte hain.
- [ ] **Functions** — reusable blocks; `def func(x):` yaa bash `func() { }`.
- [ ] **Modules / packages** — code import/reuse; `import os`, `import requests`.
- [ ] **Exceptions** — errors `try/except` se handle karna.
- [ ] **APIs (HTTP)** — code se REST APIs call karna.
- [ ] **JSON / YAML parsing** — config/data files ko read + modify karna.
- [ ] **Regular expressions** — text pattern match; logs/validation ke liye.
- [ ] **File handling** — open/read/write/append files.
- [ ] **HTTP requests** — `requests`/`curl` se request + response handle.
- [ ] **CLI applications** — terminal se chalta app; args, help, flags.
- [ ] **Automation scripts** — repeat kaam ka script; schedule karo (cron).
- [ ] **Error handling** — fail ho toh gracefully; clear message do.
- [ ] **Logging** — timestamps + levels (`INFO`, `ERROR`) ke saath logs.
- [ ] **Testing** — code ka verify; unit test, integration test.
- [ ] **Strings & string formatting** — text jo dena hai, `${VAR}` interpolo.
- [ ] **Lists & loops** — iterate karna; `for x in items`.
- [ ] **Dictionaries / maps** — key-value data; `{"name": "x"}`.
- [ ] **Sets / dedupe** — unique values; duplicates hatao.
- [ ] **Tuples / immutable** — ek baar set, baad me badlo nahi.
- [ ] **Booleans & comparisons** — true/false, `and/or/not`.
- [ ] **Type conversion** — `str()`, `int()`, floats.
- [ ] **`sys.argv` / `$@`** — script arguments access karna.
- [ ] **Exit codes** — script ki success/failure signal (`exit 1`).
- [ ] **shebang** — bash script pe `#!/bin/bash`; direct run karo.
- [ ] **Environment variables** — `os.environ` / `$VAR`.
- [ ] **Virtualenv / venv** — python dependencies isolated.
- [ ] **pip / package install** — `pip install`, `requirements.txt`.
- [ ] **Go basics (optional)** — types, structs, simple binaries.
- [ ] **JSON vs YAML in code** — parse + generate (json.load, yaml.safe_load).
- [ ] **String slicing** — `text[0:5]`, substring nikalna.
- [ ] **List comprehensions** — python me concise lists.
- [ ] **Generators / lazy iter** — memory efficient loops.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Bash | Shell scripting | Quick server automation |
| Python | General-purpose language | APIs, automation, scripts, tools |
| Go | Compiled fast language | CLI tools, high-perf services |
| jq | JSON CLI | JSON data process + parse |
| pytest | Python test framework | Automated tests likhne ke liye |
| click/argparse | CLI framework | Achi CLI apps banane ke liye |
| requests / httpx | HTTP client libs | APIs call karne ke liye |
| uv / pipenv | Package/env managers | Dependencies manage karne ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Multi-Tool Script:** Ek bash script jo kisi service ka health check karke ek report file likhe.
- [ ] **Lab 2 — Python API Fetcher:** Kisi public API se data lo, JSON parse karo, clean output banao.
- [ ] **Lab 3 — Regex Cleaner:** Logs se IPs/emails/dates extract karna seekho.
- [ ] **Lab 4 — Test Suite:** Apne python script pe pytest test likho (mock ke saath).
- [ ] **Lab 5 — CLI Tool:** Ek real CLI utility banao (`--help`, args, exit codes) — jaise disk-report tool.
- [ ] **Project — Notification Bot:** Log monitor karke issue mile toh Slack/webhook pe message bhejne wala script banao.

## 🔗 Related Topics

- [🐧 Linux](../modules/linux.md)
- [⚡ Automation](../modules/automation.md)
- [🤖 AIOps](../modules/aiops.md)
- [Python for DevOps Automation](../topics/python-automation-scripts.md)
- [Day 4 — Shell Scripting Basics](../day-04-shell-scripting-basics.md)
- [Day 13 — Advanced Shell Scripting](../day-13-advanced-shell-scripting-automation.md)