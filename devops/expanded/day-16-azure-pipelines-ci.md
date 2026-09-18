# Day 16 — Azure Pipelines: CI (Build + Test + Artifact) (DevClo Expanded)

## Overview | Parichay

Day 15 me trigger lagana seekha; aaj pipeline ka **andar** banaenge. CI ka matlab sirf "build chal jaye" nahi — balki **restore → compile → test → artifact publish** ka clean, repeatable flow jisme koi bhi mistake log se clear ho. Aaj pipeline ko **code banate ho** (templates, jobs, steps, conditions) aur logs systematically padhna seekhte ho — yehi "pipeline as code" ka base hai.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] YAML structure samjho: stages → jobs → steps (hierarchy)
- [ ] `checkout`, `condition`, `dependsOn`, `continueOnError` ke 1-fakte yahan bhi
- [ ] Templates (`template:` / `extends:`) se reusable pipeline steps banao
- [ ] Package manager tasks: npm/Python/dotnet restore + build + test
- [ ] Tool version pinning karo (SDK/runtime exact version)
- [ ] Publish + download artifacts (build ka product rakho)
- [ ] Task logs + `##vso[logissue]` + exit codes ka system samjho
- [ ] Retry vs investigate ka decision daalo
- [ ] Caching (`Cache@2`) se dependencies repeat use karo
- [ ] Conditions se skip/branch-specific steps likho

---

## Full Topic (LEARN) | Puri Detail

### 1. YAML Anatomy — Stages/Jobs/Steps

Pipeline ki teen levels hierarchy hoti hai. Jab tak hierarchy clear na ho, har debugging itna complicated lagta hai:

```
Pipeline (pura culture)
└── Stage 1 (e.g. Build)        → logical phase, resources jobs running
    └── Job 1 (e.g. compile)     → specific machine/agent pool par chalta block
        └── Step A (script)      → ek command
        └── Step B (npm test)
    └── Job 2 (e.g. deploy-test)
└── Stage 2 (e.g. Deploy)
```

```yaml
stages:
- stage: Build
  jobs:
  - job: compile_and_test
    pool: { vmImage: ubuntu-latest }
    steps:
    - script: echo "building..."
```

Yahan **1 Stage → 1 Job → steps** hain. `dependsOn` se order control karte ho (default: sequence), `condition: succeeded()/failed()/always()` se step skip karte ho, `continueOnError: true` se job ko fail hone ke baad bhi aage chalne dete ho (warn ke liye).

### 2. Checkout Aur Repo Control

Har job me **agent workspace** me repo ka fresh checkout hota hai. YAML ka ROI:

```yaml
steps:
- checkout: self            # default — current repo checkout
  clean: true               # stale files nikaal do
  fetchDepth: 0             # full history (tags/commit log ke liye)
  persistCredentials: true  # later git commands (e.g. push) ke liye
- checkout: other-repo      # doosra repo bhi chahiye (mayfu: templates repo)
```

### 3. Templates — Duplicate Code Khatam

Dono form practice me milte hain:
- **`template:` include (steps/variables ka reuse):**
```yaml
# azure-pipelines.yml
steps:
- template: templates/ci-steps.yml      # steps koi bhi repo me
  parameters:
    pythonVersion: '3.12'
```
```yaml
# templates/ci-steps.yml
parameters:
  pythonVersion: '3.12'
steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: ${{ parameters.pythonVersion }}
```

- **`extends:` (pipeline teplit, 2026-favourite):** Root template set of stages/steps define karta hai aur child `parameters:` se override. Large orgs me rounds: platform team ek template repo me pipelineable golden path rakhta hai, teams bas `extends: templates/main.yml` karte hain. Naming: koi bhi name de sakte ho but `main.yml`/`azure-pipeline-template.yml` common.

### 4. Standard CI Tasks (Build + Test)

| Tailored Use | Task | Input |
|--------------|------|-------|
| Python | `UsePythonVersion@0` | `versionSpec: '3.12'` (py version pin) |
| Node | `NodeTool@0` | `versionSpec: '20.x'` |
| .NET | `UseDotNet@2` | `version: '8.x'` |
| Build | `script:` / `npm run build` / `dotnet build` | bailo se |
| Test publish | `PublishTestResults@2` | `testResultsFormat: 'JUnit'`, `searchFolder`, `testRunTitle` |
| Lint/quality | `script: npm run lint` | fail-fast `failTaskOnFailedTests` |

**Tool version pinning (INC-503 ka asli fix):** Image me default version ho sakta hai but production ke liye `versionSpec` + `condition` se exact pin karo. E.g. Python project ke liye `pyproject.toml`/`requirements.txt` bhi pin karoge.

### 5. Artifacts — Build Ka Product Rakho

```
Build ka result (compiled jar / npm dist / docker) = artifact
Artifact publish → isi pipeline ya doosri location par download
```

```yaml
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: 'dist'                 # folder ka path
    ArtifactName: 'webapp'                # artifact ka naam
    publishLocation: 'Container'          # prefer container (fast)
    retentionDays: 30
```

Kisi downstream job/stage me usi artifact ko `DownloadPipelineArtifact@2` se le lo — jab bhi environment promotion karte ho (dev→qa→prod), saare envs ko **same artifact** de do. Ye (sabse critical) CD principle hai: "jo build maine dev me test kiya, wahi build prod me jaata hai".

### 6. Logs Ka System — Padhna Seekho, Rona Nahin

- **Task logs:** Har step ka log, timeout, exit code (`##[error]`, `##[warning]`) dikhta hai.
- `##vso[logissue type=error;sourcepath=x]` — script se custom error/warning inject karte ho. `##vso[task.setvariable var=x]` — steps ke darmiyan variables share.
- **Exit codes:** Script/command nonzero exit code = step fail = job fail (unless `continueOnError`). `.continued` results bhi `succeededOrFailed()` condition se handle kar sakte ho.
- **Retry vs investigate:** Timeout/transient network error → retry policy feasible (`retryCountOnTaskFailure: 2`); compile/SDK mismatch/flaky dependency missing → hamesha investigate karo, blind retry sirf 2 cheezein deta hai: time waste + demorilization. Rule: **deterministic failure = investigate, stochastic failure = retry once with log capture.**

### 7. Caching + Deterministic Builds

```yaml
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(npm_config_cache)
  displayName: 'Cache npm'
```
Cache key me lock file daaloge to dependency restore fast hoga (pipeline 30s+ bachti hain). Note (Day 17 me deeper): **deterministic build** = same SHA/commit + same environment = same output, cache mudat chhora. Lock files (`package-lock.json`, `yarn.lock`, `poetry.lock`) isi ka engine hain.

---

## Sample Pipeline | Example YAML

```yaml
# azure-pipelines.yml — Day 16: CI pipeline (build + test + artifact + template)
# Hinglish comments: career candidates par direct copy-paste karke chalao.

trigger:
  branches:
    include: [main, develop]

pool:
  vmImage: ubuntu-latest

variables:
  pythonVersion: '3.12'
  ARTIFACT_NAME: 'devclo-api'

stages:
- stage: Build                      # Stage 1 — build + test
  jobs:
  - job: lint_and_test
    displayName: 'Lint + Test + Artifact'
    steps:
    - checkout: self
      clean: true
      fetchDepth: 0

    - task: UsePythonVersion@0      # version pin — INC-503 fix
      inputs:
        versionSpec: $(pythonVersion)

    - task: Cache@2                 # pip cache — repeated py fiber
      inputs:
        key: 'pip | "$(Agent.OS)" | requirements.txt'
        path: $(PIP_CACHE_DIR)
      displayName: 'Cache pip deps'

    - script: |
        python -m pip install --upgrade pip
        pip install -r requirements-dev.txt
      displayName: 'Install deps'

    - script: |
        python -m pytest tests/ --junitxml=reports/TEST-junit.xml --cov=. --cov-report=html
      displayName: 'Run tests'
      continueOnError: false       # fail fast

    - task: PublishTestResults@2    # kabhi logs me rat race nahi — test report rakho
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'reports/TEST-junit.xml'
        testRunTitle: 'unit-tests'
      condition: succeededOrFailed()

    - task: PublishBuildArtifacts@1 # artifact = CD ka fuel
      inputs:
        PathtoPublish: 'dist'
        ArtifactName: $(ARTIFACT_NAME)
        publishLocation: 'Container'
```

**Run karke:** pipeline green hoti hai → artifact `devclo-api` published → logs me `##[section]` ka ek order dikhta hai. Isi artifact ko Day 19 CD stages me download karoge.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command/Task | Kaam |
|--------------|------|
| `az pipelines run --name CI --branch main` | Pipeline branch se manually chalao |
| `az pipelines runs show --id <id> --query status` | Run status dekho |
| `az pipelines runs log --id <id>` | Run ke logs dump karo |
| `az pipelines artifact list --run-id <id>` / `az pipelines artifact download` | Artifact dekh/download karo |
| `UsePythonVersion@0` / `NodeTool@0` / `UseDotNet@2` | Runtime version pin |
| `PublishTestResults@2` | JUnit XML → test report |
| `PublishBuildArtifacts@1` | build product container me rakho |
| `Cache@2` | Depty cache (key = lock file) |
| `##vso[logissue type=error]` | Script se error inject |

---

## Practice Lab | Abhi Karein

1. Day 15 ka repo lo, `app/` me ek simple Python Flask API + `tests/test_app.py` + `requirements.txt` banao.
2. Upar wala `azure-pipelines.yml` copy karke push karo → first run green hona chahiye.
3. Logs me streak dekho: UsePythonVersion → Cache → Install → pytest → PublishTestResults → PublishBuildArtifacts.
4. Test report me intentionally ek test fail karo → pipeline **fail fast** hota hai, logo me error exit code dikhta hai.
5. `pip install` se pehle `&& python -m pip --version` print karke tool version verify karo.
6. Templates ka istemal: `templates/ci-steps.yml` me install+test steps nikaalo, main yaml se `template:` include karo.
7. `condition: succeededOrFailed()` wala test-publish step add karke dekho ki failed run me bhi report banti hai.
8. `Cache@2` ka key `package-lock`-style lock file se set karo; second run me "Cache restored" log dekho.
9. Second stage `DeployTest` (sirf echo) add karke `dependsOn: Build` se chalao.
10. Artifact download karke verify karo (web UI me Artifacts tab bhi dekh lo).
11. `az pipelines runs log --id <id>` se full log local file me le aao aur `##[error]` grep karo.
12. **Expected result:** Repo me sirf YAML file hai, CI 100% API se rebuild hoti hai, artifact published, templates reuse ho raha hai.

---

## Incidents / Tickets | Real Practice

### INC-503 · Build Failed
- **Situation:** Ek update ke baad pipeline "Build failed. Error: SDK version not supported" de rahi hai. Dev ka local build chal raha tha, CI nahi.
- **Investigate:**
  ```bash
  az pipelines runs show --id <runid> -o json           # status/error msg
  az pipelines runs log --id <runid> | grep -iE "error|version"   # exact line
  ```
  Web me usi failing step ke logs me `##[error]` line dhundo (Search: "error").
- **Root cause:** Microsoft-hosted image apne default tool version ko update kar diya (example: ubuntu image me Python 3.11+ ho gaya), jabki app 3.10 par validated thi. Tool version **pin na hone** ki wajah se silent drift aaya.
- **Fix:** Pipeline me version pin karo:
  ```yaml
  - task: UsePythonVersion@0
    inputs:
      versionSpec: '3.10.x'
      addToPath: true
  ```
  (aur `requirements.txt` me bhi python version compatible rakho)
- **Verify:** Rebuild → install step me `3.10.x` py. `az pipelines runs show --id <id>` → status `succeeded`.
- **Blast radius | Prevent:** Har build fail se prod deploy ruk jaata tha (lead time badh gaya). Tool version ko `variables:` me pin karo, images ke weekly-release notes follow karo (Microsoft-hosted rolling updates), aur SAME version CI + local wali guarantee ki tarah `pyproject.toml`/`.nvmrc`/`.tool-versions` repo me rakho. Isko *hermetic/reproducible environment* kehte hain.

### INC-504 · Dependency Failure
- **Situation:** Pipeline install step par fail hoti hai: "Could not resolve dependency ... read ECONNRESET / package not found". Kabhi kabhi baad wale run me pass ho jaati hai.
- **Investigate:**
  ```bash
  az pipelines runs log --id <id> | grep -iE "econnreset|not found|feed|403|npm"
  head package-lock.json                         # lock file exist?
  npm config get registry                        # kaunsa registry/feed
  ```
  Azure Artifacts feed use ho raha ho to feed connection/service connection check karo.
- **Root cause:** (a) `package-lock.json` repo me **missing/outdated** hai — nakli dependency graph, network blip par flaky; (b) Azure Artifacts feed ki auth cache expire ho gayi / feed deleted.
- **Fix:** Lock file commit karo + cache task me lock file key use karo:
  ```yaml
  - task: Cache@2
    inputs:
      key: 'npm | "$(Agent.OS)" | package-lock.json'
      path: $(npm_config_cache)
  - script: npm ci                       # lock-file-based install (npm install nahi!)
  ```
  Feed issue → `az artifacts feed list` se verify + service connection renew.
- **Verify:** Lock file committed ke baad `npm ci` deterministic install karta hai; feed se re-resolve: rebuild green, cache hit logs "from cache".
- **Blast radius | Prevent:** Flaky deps = flaky CI = trust gir jata hai ("green build matlab kuch no guarantee"). `npm ci` (lock-based) ya `pip install -r requirements.txt` + exact pins se deterministic builds; package feed par retention + uptime alert lagao, aur **retry late** (retry count 1) transient failures ke liye.

---

## Interview Corner | Sawal-Jawab

1. **Q: stage, job, step ka fark?** A: Stage = logical phase (build/deploy); job = ek agent par chalta unit of work; step = command/task. Stages dependencies (`dependsOn`) se sequence hote hain, jobs within stage parallel chal sakti hain (except `dependsOn`), steps hamesha sequence.
2. **Q: Artifact publish kyun karte ho?** A: CI ka product ko immutable ripet karne ke liye. Same artifact dev→qa→prod me jaata hai, isliye CD trustworthy hai — "jo test kiya wahi deploy kiya". Retention policy se cost control to 'nazir.
3. **Q: Pipeline me `condition: always()` vs `succeededOrFailed()`?** A: `always()` har haal me chalega (deployment crash condition par bhi), `succeededOrFailed()` tab tak nahi jab tak job cancelled na ho — report/job-cleanup tasks par behtar hota hai.
4. **Q: Cache aur lock file ka rista?** A: Lock file = dependency graph captured (exact versions); cache = unke binaries ka local copy. Cache key me lock file rakho to cache tabhi hit hogi jab graph same ho — doosra isliye deterministic rehta hai.
5. **Q: "Pipeline as code" ka kya matlab hai shehri?** A: Pipeline definition repo me `azure-pipelines.yml` ke roop me version controlled hota hai — PR reviews, code review se quality gate, rollback (older YAML), aur CD infra (IAC) jaise hi treat hota hai. Classic editor/portal mausam ab legacy path hai.

---

## Quick Notes | Yaad Rakhna

- YAML hierarchy: **stages → jobs → steps** — order hamesha isi tarah yaaad rakho.
- Version pinne = CI stability ka base (INC-503 ka fix).
- **Same artifact → saare environments** — CD ka golden rule.
- Logs me `##[error]`/`##[warning]` = system ka signal, har line padho.
- Retry sirf transient failures ke liye; deterministic failure investigate karo.
- Lock file (`package-lock.json`) + `npm ci` = deterministic dependency install.
- Cache key = lock file; templates (`extends:`) = org-level reuse.