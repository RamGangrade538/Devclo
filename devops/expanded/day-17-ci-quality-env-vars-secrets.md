# Day 17 — CI Quality: Env Vars & Secrets (DevClo Expanded)

## Overview | Parichay

Ab tak pipeline chalti hai, lekin **senior engineer CI ko quality-gated, secret-safe aur deterministic** banata hai. Aaj ka din 3 pillars uthate ho: test gates (coverage + lint + matrix), secrets ka sahi management (`$()` vs `${{ }}` vs `env:` masking), aur caching se deterministic builds. Ye wahi cheezein hain jo interview me "5-saal wala" engineers ko alag dikhati hain — "mera CI kabhi na kabhi flaky nahi hota, secrets kabhi log me nahi chhule, same SHA = same output".

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Coverage thresholds (`--cov-fail-under`) se CI fail karo
- [ ] Lint fail-fast gate daalo (pre-build)
- [ ] Matrix builds (OS × version) se multi-platform test karo
- [ ] Secret vs non-secret syntax samjho: `$()` vs `${{ }}` vs `env:`
- [ ] Secret masking, "print karna prohibit" discipline
- [ ] Variable groups Library se + **Key Vault linked** group
- [ ] Precedence rules: pipeline vars vs variable groups vs queue-time
- [ ] Caching: agent-level vs task-level, deterministic builds
- [ ] `##vso[task.setvariable]` + `isSecret: true` se dynamic secret share
- [ ] Audit: secrets ke security (service connection, rotated)

---

## Full Topic (LEARN) | Puri Detail

### 1. Test Gates — Build gate padh karke rukta hai

CI ka kaam hi hai **poori quality ko gate karna**, sirf "loop chalaya". Teeno layers:

```yaml
# 1) Lint — sabse pehle, fail-fast
- script: |
    flake8 app/ tests/ --max-line-length=100
  displayName: 'Lint (fail fast)'

# 2) Unit tests + coverage gate
- script: |
    python -m pytest tests/ --cov=app --cov-report=xml --cov-fail-under=85
  displayName: 'Test with 85% coverage gate'

# 3) Publish coverage report + fail test task on failed tests
- task: PublishCodeCoverageResults@2
  inputs:
    summaryFileLocation: 'coverage.xml'
```

- **Coverage threshold** (`--cov-fail-under`) ya `CoverageGate` task: 85% se kam to pipeline fail ~ prod deploy nahi hoga.
- **Lint fail-fast:** lint sabse pehle, kyunki fast hai aur code smell rokh deta hai — web 'devleopme' me flow: fail fast = fast feedback.
- **Matrix builds:** same job ek **matrix** me multiple combinations par chalti hai (complicate hota hai but 2026 me standard):

```yaml
strategy:
  matrix:
    linux-py312:
      image: ubuntu-latest
      py: '3.12'
    linux-py310:
      image: ubuntu-latest
      py: '3.10'
    windows-py312:
      image: windows-latest
      py: '3.12'
  maxParallel: 2
pool:
  vmImage: ${{ variables.image }}
```

Har matrix cell apna log set deta hai; koi bhi fail to overall red.

### 2. Secret vs Non-Secret Syntax — Isi Par Asli Seniority Hain

| Syntax | Type | Kab use karo |
|--------|------|--------------|
| `$()` | **Runtime** macro-substitution — compile ke baad, execution par values banti hain. Secrets **sirf isi** se read hote hain | variable ko task/step me use karna |
| `${{ }}` | **Compile-time** — YAML template parse hote hi evaluate. Secrets ko `${{ }}` se carefully handle karo (compile-time secrets **source me** chale jaate hain!) | template branching, `variables['var']` conditions |
| `env: VAR: $(secret)` | Environment mapping — script/process ke env me var daalna | Har script me secret inject karo (recommended) |

**Golden rules (INC-505/506 ka bhi basis):**
1. Secret ko kabhi `echo $(secret)` ya script argument me daalo, logs me plaintext aata hai.
2. Agar class `env:` diya to `echo $SECRET_FROM_ENV` **value dikhayega** — isliye ek line bhi print mat karo, masking me chacko mat.
3. `${{ }}` me secret mat rakho — evaluation compile-time hoti hai, secret ka value YAML ke andar hi lock ho jata hai (service agent me dur ya log dump me leak risk).
4. Use-case: secret ko script me chahiye tab `env: MY_KEY: $(mySecret)`, magar khati script me `"${MY_KEY}"` ko refer karo bina print kiye.

**Secret hi hai ya nahi — kaise pata chale:** Variable group me "secret" toggle hota hai; secret variables ko logs me `***` dikhate hain (masked). Pipeline-level `variables:` me `value:` me secret daalo to wo non-secret jaisa image me pass hoga — bachho.

### 3. Dynamic Secret Share (Runtime)

```yaml
- script: |
    value=$(curl -s ... )        # koi API se token nikala
    echo "##vso[task.setvariable variable=dynamicToken;issecret=true]$value"
  displayName: 'Fetch + inject secret'
- script: |
    echo "Use: ${DYNAMIC_TOKEN}"   # sirf env me refer, print nahi!
  env:
    DYNAMIC_TOKEN: $(dynamicToken)
```
`issecret=true` → masking ke sath downstream steps me value milti hai.

### 4. Variable Groups — Library + Key Vault

- **Library (variable groups):** Pipeline UI → Library → variable group. Multiple pipelines share karte hain. Group ko YAML me `- group: mygroup` se include karte ho. Precendence (queue-time beats group):
```
Pipeline variables (queue-time) > variable groups (library) > template/compile-time > ... repo/task vars
```

- **Key Vault linked (2026-standard):** Variable group ko Azure Key Vault se link karte ho → `Key Vault` secret ko pipeline variable ki tarah `$(secret)` se use karte ho, **without storing the value in Azure DevOps**. Secret value KV me single-source rhta hai, rotation automatic dikhti hai. (Practice — Day 20 me deep dive.)

```yaml
variables:
- group: devclo-shared        # library vars
- name: apiKey                # pipeline var (non-secret)
  value: dummy-local
```

### 5. Caching + Deterministic Builds

- **Agent-level cache:** `Cache@2` (CI jobs me) — path+key based (Day 16). Key me lock file daalo.
- **Task-level cache:** build tools ki internal cache (e.g. `npm ci`/dotnet strong name hash cache) — par key changes se poison hota hai. Prefer agent-level `Cache@2`.
- **Deterministic:** same SHA + pinned versions + lock file + no TTY randomness → same build output. "Reproducible" ke liye: random/date/time wali steps ko global ko source me rakho (`Build.BuildId` as version suffix, machine name nahi).
- **Cache traceback:** cache me old binary ke saath new lock file → mismatch. Isliye key hamesha lock file digest par — `"npm | $(Agent.OS) | $(hash)` jaisi.

---

## Sample Pipeline | Example YAML

```yaml
# azure-pipelines.yml — Day 17: CI quality gates + secrets yaad rakho
# Hinglish comments. Secret kabhi print nahi karna — bee honored rule.

trigger:
  branches:
    include: [main]

pool:
  vmImage: ubuntu-latest

variables:
  pythonVersion: '3.12'
  # Library group -> variables: `- group: devclo-secrets` (web UI me banao)
  # Usme NON-secret vars + SECRET vars dono ho sakte hain.

stages:
- stage: Quality
  jobs:
  - job: matrix_job
    strategy:
      matrix:
        linux-py312:  { image: ubuntu-latest, py: '3.12' }
        linux-py310:  { image: ubuntu-latest, py: '3.10' }
    pool:
      vmImage: ${{ variables.image }}
    steps:
    - checkout: self
    - task: UsePythonVersion@0
      inputs: { versionSpec: '${{ variables.py }}' }
    - script: |
        pip install -r requirements-dev.txt
      displayName: 'Install deps'
    - script: |
        flake8 app/ tests/ --max-line-length=100
      displayName: 'Lint (fail-fast)'
    - script: |
        python -m pytest tests/ --cov=app --cov-report=xml --cov-fail-under=80
      displayName: 'Test + coverage gate >=80%'
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'reports/junit.xml'
        testRunTitle: 'matrix-${{ variables.py }}'
      condition: succeededOrFailed()
    - task: PublishCodeCoverageResults@2
      inputs:
        summaryFileLocation: 'coverage.xml'

- stage: Secret_Usage_Demo
  dependsOn: Quality
  jobs:
  - job: secrets
    variables:
    - group: devclo-secrets      # isme apiKey SECRET hai
    - name: nonSecretVar
      value: 'plaintext-value'
    steps:
    - script: |
        # Secret ko env me lo, print kabhi nahi
        curl -H "Authorization: Bearer ${API_KEY}" https://api.example.test/check \
          --fail --silent --show-error > /dev/null && echo "API call OK"
      env:
        API_KEY: $(apiKey)       # masking — log me ***
      displayName: 'Use secret via env'
    - script: echo "Non-secret: $(nonSecretVar)"   # ya itna bhi print? — sirf non-secret
      displayName: 'Non-secret safe to log'
```

**Run karo:** Quality stage do matrix cells par chalti hai; Secret_Usage_Demo me `apiKey` ko log me kabhi plaintext nahi milega; coverage 80% se kam par build red.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command/Task | Kaam |
|--------------|------|
| `pytest --cov-fail-under=80` | Coverage gate — fail if under |
| `flake8 app/ --max-line-length=100` | Lint fail fast |
| `PublishCodeCoverageResults@2` | Coverage xml report rakho |
| `strategy.matrix` + `maxParallel` | Multi-OS/version matrix |
| `- group: name` in variables | Library variable group include |
| Variable group → Key Vault (link) | KV secret ke liye live ref, no stored value |
| `env: API_KEY: $(apiKey)` | Secret inject, log masked |
| `##vso[task.setvariable variable=v;issecret=true]` | Runtime dynamic secret |
| `Cache@2` key=`hash | lock | Agent.OS` | Task-level cache deterministic |
| `##vso[logissue type=warning]` | Warning log + gate |

---

## Practice Lab | Abhi Karein

1. Apne repo me `app/` + `tests/` banao; requirements me `pytest`, `pytest-cov`, `flake8` add karo.
2. Upar wala pipeline YAML copy karke push karo (Quality stage only) → matrix cells 2× green.
3. Coverage ko intentionally kam rakho (ek test delete karo) → pipeline **coverage gate se fail** ho, gowns `--cov-fail-under` error dekho.
4. `flake8` me deliberately style error daalo → lint fail-fast sabse pehle red hota hai.
5. Library me variable group `devclo-secrets` banao: `apiKey` = secret toggle ON.
6. Secret_Usage_Demo stage wala YAML add karke push karo → logs me `apiKey` ki value **kabhi nahi** dikhti (`***` masked).
7. Ek test script me `echo $API_KEY` likhke push karo → kitsa masked dikhta hai, usko comment out/remove karke wapas green karo (sikho: nahi print).
8. Variable group me `nonSecretVar` bhi daalo; pipeline-level `variables:` me uska **override** karo → precedence check karo (queue-time/override wins).
9. Key Vault linked group ka lab (agar subscription ho): KV me secret banao, group link karo, `$(kvSecret)` use karke print mat karo.
10. Same SHA do baar run karo → same output (deterministic) record karo.
11. `### blunder drill ###`: pipeline log download (`az pipelines runs log`) karke `grep -iE "apiKey|token|password"` karo → kuch na mile, ye password ka proof.
12. **Expected result:** Secrets kabhi log me nahi; quality gates fail ho sakte hain intentionally; build deterministic.

---

## Incidents / Tickets | Real Practice

### INC-505 · Test Fails Randomly (Flaky)
- **Situation:** CI me ek test "unpredictably" fail hote and pass hote rehta hai — devs usko 2-3 baar re-run karke green karte hain. Prod release me ye bad practice hai.
- **Investigate:**
  ```bash
  az pipelines runs list --status failed -o table     # failure pattern dekho
  az pipelines runs log --id <runid> | grep -iE "flaky|assert|FAIL"   # kon sa test
  # Tests individually run karo (isolation check):
  pytest tests/test_order.py -x                              # single run
  pytest tests/ -p no:randomly -x                            # ordered run compare
  ```
  Report ko timestamps se correlate karo (kahi DB connection/TZ race ho).
- **Root cause:** Test **parasite dependence** — ek doosre test ke state (shared DB/global) par depend kar raha tha; parallel/order-badlne par flaky deta tha (ya network time ke karan transient DB connect). 2026 me strands pattern: order dep, missing test DB setup, TZ/time mocking.
- **Fix:** Test ko **isolate** karo — per-test setup/teardown (fixtures), `pytest-randomly` ke sath determinism check karo, DB ko in-memory/sandbox lagao:
  ```python
  @pytest.fixture(autouse=True)
  def clean_db():
      db.reset()
      yield
  ```
  Pipeline me `--tb=short` rakhkar rerun se ai-ye denial chute.
- **Verify:** 5 baar `pytest -p no:randomly` + 5 baar default order → 10/10 green. `az pipelines run` 3 baar → har baar succeeded.
- **Blast radius | Prevent:** Flaky tests trust khatam karte hain → devs "re-run" culture shuru kar dein → prod ko flaky code milta hai. Flaky detect karne ke liye failure+success combo wali jobs ko pipeline `runsOn` me track karo ya `azure-pipelines` diagnostic (test stability dashboard). Senior rule: *re-run mat karo, root cause dhoondo — re-run sirf logs dafan karta hai.*

### INC-506 · Wrong Env Var in Wrong Stage
- **Situation:** Dev environment me deploy hua jabki `DATABASE_URL` **prod** ka pointer ho raha tha. App started par data galat DB me ja raha tha (silent data-corruption risk!).
- **Investigate:**
  ```bash
  # Pipeline YAML me variable scope padho
  az pipelines runs show --id <runid> -o json --query '[variables,stages]'
  grep -nE "DATABASE_URL|env:|group:" azure-pipelines.yml
  # deployed env me actual value check
  az webapp config appsettings list --name <app> --resource-group <rg>
  ```
- **Root cause:** `DATABASE_URL` **job-scope** par default value thi (`variables:` ko stage ke top par rakha tha ya library group override hone par) — isliye har stage me wahi reuse hua. Precedence rule tuta: stage-level kabhi bhi sahara se override nahi ho raha.
- **Fix:** Variable ko **stage-scope/decoupled** karo — stage-specific + environment condition:
  ```yaml
  stages:
  - stage: Dev
    variables:
      envName: dev
      - group: dev-vars        # dev ke liye alag group
  - stage: Prod
    variables:
      envName: prod
      - group: prod-vars        # prod ke liye — alag secrets, alag URL
  ```
  Environment-specific variable groups Queue-time override receiver ko nahi dena. `${{ variables.envName }}` se log me stage clear.
- **Verify:** Deployed stage par `az webapp config appsettings list` → `DATABASE_URL` = correct env; Dev stage me log `envName: dev` print.
- **Blast radius | Prevent:** Wrong env var = wrong data (silent corruption). Environmental values ko **stage-bound** rakho (variable groups per env), secret groups alag, and deterministic matrix skip. CD ke liye `Deployment jobs` (`environment:`) use karo — environment-scoped context Day 19 me deep hoga. Automation: init step me `envName` validate karke fail (`if [ "$envName" != "$(Build.SourceBranchName)" ]; then exit 1; fi`).

---

## Interview Corner | Sawal-Jawab

1. **Q: `$()` vs `${{ }}` vs `env:` — kisme kya?** A: `$()` = runtime macro (secrets bas isi se), `${{ }}` = compile-time template (branching ke liye), `env:` = script ke process environment me mapping (secret safe inject). Secret ko `${{ }}` ya echo me kabhi nahi.
2. **Q: Secret kabhi log me kaise na jaye?** A: Secret ko sirf `env:` ke through refer karo, print instructions script me hi prohibit karo, `issecret=true` dynamic vars masking, variable groups me secret toggle, aur library/KV group logs me value store na karen.
3. **Q: Coverage threshold kaise fail karta hai aur kyun zaroori?** A: `--cov-fail-under=80` (ya CoverageGate task) test coverage 80% se kam ho to build fail karta hai — degraded tests ke saath product deploy nahi hota. Threshold sirf "bhagwa" nahi hai; JSCodeViewer se verify bhi karo realistic ho.
4. **Q: Deterministic build ka matlab?** A: Same commit SHA + same pinned toolchain + lock files = same output, chahe kisi bhi machine/any time par run karo. Randomness (machine name, current time, install-time side effects) ko ko katalo.
5. **Q: Flaky test ka senior saudaba?** A: "Re-run mat karo, isolate karke root cause nikalo." Flaky = order dependence/DB pollution/env race. Detection: randomized order runner + stability dashboard + fail retry off. Isko flaky-free CI = deployable-CI ka proof hota hai.

---

## Quick Notes | Yaad Rakhna

- **Lint → Test → Coverage → Report** — quality gate sequence.
- Secret rule: `$()` ke through, `env:` me daalo, `${{ }}`/echo me kabhi nahi, logs me `***`.
- Variable groups = share + Key Vault linked = single-source secret, no stored value.
- Coverage < threshold → build red (yaad rakh: code ki safety = CI red).
- Caching key me lock file; deterministic = same SHA → same artifact.
- Stage-scoped vars, environment-scoped groups — wrong-var incident ka prevention.
- **Flaky test = investigation, not re-run** — team ka trust + release quality dono yahan depend karte hain.