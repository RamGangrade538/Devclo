# 📄 YAML & JSON — Configuration Data

> **Hinglish:** Har DevOps tool ka config language YAML hai — Docker Compose, Kubernetes, Ansible, GitHub Actions, GitLab CI — sab YAML. Aur APIs ka data format hai JSON. Ye module dono ko simple Hinglish me cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

**JSON (JavaScript Object Notation)** — data exchange ka standard. Har REST API JSON bhejti/leti hai. **YAML** (YAML Ain't Markup Language) — JSON jaisa but **human-friendly**: comments, readable indentation. YAML isliye DevOps configs ke liye pick hua.

Dono **data formats** hain, programming languages nahi. Ek cheez yaad rakho: **YAML = JSON ka superset** — par YAML thu indentation/anchors JSON me nahi milogi. Is module me: syntax, structures, anchors, variables, JSON parsing, config files, environment-specific config, aur secrets-vs-config ka farak.

## 🟢 Beginner — Shuruaat yahan se

- **JSON structure** — objects `{}`, arrays `[]`, string/number/bool/null.
- **YAML basics** — `key: value`, list with `-`, nested with indentation.
- **Dono ka convert** — `jq` (JSON) aur `yq` (YAML) CLI tools.
- **Real example** — `docker-compose.yml`, `values.yaml`, `ci.yml` khol kar padhna.

## 🟡 Intermediate — Ab configs likho

- **YAML anchors (`&`, `*`)** — `defaults: &d` + `<<: *d`.
- **Multi-document YAML** — `---` separators (K8s multi-manifest).
- **Env-specific config** — dev/stage/prod me overrides.
- **Secrets vs config** — config repo me open; secrets Vault/K8s Secret me.
- **Common gotchas** — `yes/on/1` ka boolean conversion, indentation errors.

## 🔴 Advanced — Pro bano

- **Schema validation** — JSON Schema, `kubeconform`, YAML lint.
- **Merge/extend patterns** — environment inheritance in YAML.
- **Safe parsing** — `yaml.safe_load` vs `load` (security risk).
- **Config-as-code versioning** — git me configs, PR review, drift check.
- **Templating** — Helm `values.yaml` overrides, `envsubst`, `kustomize`.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **YAML syntax** — `key: value`, indentation se hierarchy banati hai.
- [ ] **YAML structures** — lists (`- item`), maps, nested objects.
- [ ] **Anchors** — `&name` define + `*name` reuse; DRY configs.
- [ ] **Merge keys** — `<<` se anchor ko merge karna.
- [ ] **YAML comments** — `#` se notes; configs samajhne me help.
- [ ] **Multi-doc YAML** — `---` se ek file me multiple documents.
- [ ] **JSON syntax** — `{"key": "value"}`, arrays `[1,2]`.
- [ ] **JSON types** — string, number, boolean, null, object, array.
- [ ] **JSON parsing** — `jq`, `python json.load`, `node JSON.parse`.
- [ ] **jq tricks** — `.key`, `.[]`, filters, `jq '.a.b'`.
- [ ] **yq (YAML CLI)** — YAML parse/convert/merge karne ka tool.
- [ ] **Validation** — malformed YAML/JSON ka error bina crash ke pakdo.
- [ ] **Configuration files** — apps/CI/CD/K8s sab config files se chalti hain.
- [ ] **Environment-specific config** — dev/stage/prod configs alg.
- [ ] **Secrets vs configuration** — config public ho sakti, secrets nahi.
- [ ] **Quoting rules** — strings me special chars safe karna.
- [ ] **Type gotchas** — YAML me `on`, `yes` boolean ban jate hain.
- [ ] **Indentation consistency** — YAML me spaces (tabs nahi) matter karte hain.
- [ ] **Schema** — config ki expected shape define/validate karna.
- [ ] **Env var interpolation** — `${VAR}` ya `${{ }}` configs me.
- [ ] **Key ordering** — JSON me order parse hota hai (matters in some tools).

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| jq | JSON CLI processor | JSON data parse/transform karne ke liye |
| yq | YAML CLI processor | YAML configs parse/merge karne ke liye |
| yamllint | YAML linter | Syntax errors check karne ke liye |
| kubeconform | K8s manifest validator | K8s YAML validate karne ke liye |
| python `json`/`yaml` | Standard libs | Scripts me parse karne ke liye |
| kustomize / helm | Template/override tools | Config reuse + env overrides ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — JSON File Explorer:** Apne pass koi API output JSON lo (curl se), `jq` se 5 cheezein extract karo.
- [ ] **Lab 2 — YAML Birth:** `docker-compose.yml` likho (2 services), `docker compose config` se validate karo.
- [ ] **Lab 3 — Anchor Playground:** Anchors se repeats hatao; ek anchor merge karke values override karo.
- [ ] **Lab 4 — Env Override Pattern:** Ek base YAML + prod override banao; merge karke final config dekho (yq).
- [ ] **Project — Config-Lint Pipeline:** CI me ek step lagao jo YAML files lint + JSON schema validate karta ho.

## 🔗 Related Topics

- [🐧 Linux](../modules/linux.md)
- [⚙️ CI/CD](../modules/cicd.md)
- [🚢 Kubernetes](../modules/kubernetes.md)
- [🤖 Ansible & Config Management](../modules/config-management.md)
- [HTTP & REST API Basics](../topics/http-rest-api-fundamentals.md)
- [Day 8 — CI/CD Concepts & Pipelines](../day-08-cicd-concepts-and-pipelines.md)