# Deep Dive: Testing & Test Automation — CI Me Gate, Cadence Me Confident

> **Kaha ka hai:** Day 8 (CI/CD) + Day 9 (GitHub Actions) + Day 14 (capstone). Jo engineer **tests ka tree** banata hai aur CI me gate laga pata hai, wahi production deploy bharosa se karta hai. Ye topic 'itna jaldi, etni confidence' wali chij hai.

---

## 1. Tests Kya Solve Karte Hain

| Bina Tests Ke | Tests Ke Saath |
|---------------|----------------|
| Har bug fix = naya bug | Regression pakda CI me |
| Change karna = darna | Refactor ka safety net |
| QA manual, slow | Automated feedback mins |
| Production failure late | Shift-left: fail = cheap (CI) |

**Golden ratio:** *"fast tests feedback loop = safer, faster releases."*

---

## 2. Test Pyramid — Interview Ka Favourite Number

```
       ╱ E2E ╲  (thoda — slow, flaky, costly)
     ╱ Integration ╲  (thoda-zyada)
   ╱   Unit         ╲  (bahut zyada — fast, crisp)
```

| Layer | Speed | Cost | Kaunse tests | Fail hone pe |
|-------|-------|------|---------------|--------------|
| **Unit** | ms | 0 | Functions/methods, isolated | Bug precise |
| **Integration** | sec | 0-1 env | Module + DB/API/file | Contract issues |
| **E2E** | min | real env/browser | Full user flow | Full-stack break |

**Rule:** zyada unit, kuch integration, **bahut kam** E2E (E2E slow + flaky). Har commit pe unit (sifs); nightly/PR pe integration+E2E (heavy).

---

## 3. Test Types — DevQA + CI me kya kya chalega

| Type | Kya Check | Tool (Python/Js coding) |
|------|-----------|--------------------------|
| **Unit** | Ek function | pytest / jest |
| **Integration** | Modules + DB/API | pytest + testcontainers |
| **Contract** | API shape dono side | pact (consumer-driven) |
| **E2E** | User flow | Playwright / Cypress |
| **Performance** | Load/latency | k6 / Locust |
| **Security** | Static scan | Semgrep / Bandit (SAST) |
| **Mutation** | Test kitne strong | mutmut (advanced) |

**Smoke test (post-deploy):** deploy ke baad 3-4 critical flows → prod broken 2 min me jan lo.

---

## 4. Coverage — Measure Karo, Trust Mat Karo

```bash
pytest --cov=app --cov-report=term-missing tests/
# 100% line coverage ≠ 100% confidence
```
- Use coverage as **trend** (decline = red flag), not target number
- Branch coverage > line coverage
- **Priority:** business logic > boilerplate

---

## 5. CI Me Tests Ka Placement (Pipeline Stages)

```
push → lint → unit (fast) → build → integration (env) → security scan → artifact → {
          E2E (deploy to staging)      → smoke (prod)
}
```

**GitHub Actions yaad rakho:**
```yaml
- name: Unit tests
  run: pytest tests/unit -q
- name: Integration
  run: pytest tests/integration -q
  env:
    DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
```

**Skip/pr priorities:**
- PR: unit + lint + build (fast, fail-fast)
- Merge to main: + integration + E2E + scan
- Release: + smoke + canary gate (details: [Deployment Strategies](../topics/deployment-strategies.md))

---

## 6. Test Data & Environment — "Works on my machine" Se Bacho

- **Deterministic data:** fixed fixtures, no `datetime.now()` in asserts
- **DB:** real Postgres via testcontainers / service container in CI
- **Env parity:** staging ≈ prod config (no "prod-only" surprises)
- **Local vs CI single source:** `pytest.ini`, `conftest.py` central fixtures
- **Secrets:** CI secrets via env vars, `az keyvault`/GitHub secrets — `print()` nahi

---

## 7. Flaky Tests — Interview Ka Sabse Hot Topic

**Flaky = kabhi pass, kabhi fail (no code change).** Cost: distrust in CI → team ignore karta → real bugs slip.

Causes + fixes:

| Cause | Fix |
|-------|-----|
| Time dependency (now, sleep) | Freeze clock / wait-for-condition, not sleep |
| Order dependence | Fresh test data per case; fixture reset |
| Shared state/ports | Unique DB/port per test |
| Race (async) | Await assertions, retry helper (bounded) |
| Reliance on network | Mock external; testcontainers for real deps |

```python
# wait-for pattern (not sleep)
def wait_for_endpoint(url, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if requests.get(url).status_code == 200: return True
        except requests.ConnectionError:
            pass
        time.sleep(0.2)
    raise TimeoutError(url)
```

**Policy:** flaky test = bug. Quarantine → fix or delete; never `@skip` permanently.

---

## 8. Test Code Quality — Tests Bhi Code Hain

- Tests bhi **review + lint** (CI me same)
- **Naming:** `test_user_cannot_pay_with_negative_balance`
- **AAA:** Arrange-Act-Assert (readability)
- **One behavior per test** — failure reason clear
- **Avoid over-mocking** — mock boundary, not internals
- **Golden file / snapshot** for output-heavy

```python
# AAA pattern
def test_discount_applies_when_spend_above_threshold():
    cart = Cart()                      # Arrange
    cart.add(Item(price=200))          # Act
    assert cart.total() == 180         # Assert
```

---

## 9. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **CI slow (40 min)** | E2E on every push | Split: unit (fast) / E2E nightly; cache deps; parallel jobs |
| **"Works locally but CI fails"** | Env diff | Service containers, lockfile, parity config, no shell-session state |
| **Flaky 2% CI** | Race/time | Fix (see table) — quarantine while fixing, don't ignore |
| **Integration fails new code** | DB schema drift | Migration test stage; test DB fresh but schema migrated |
| **Prod crash but tests green** | E2E didn't cover | Add smoke, better assertions, real-DB integration |
| **Coverage 100% but bugs** | Useless tests | Mutation testing, assert real behavior not implementation |
| **Deploying without tests** | Gate missing | CI branch protection: required checks before merge |
| **Test sleeps 2s slow** | Flaky avoided by sleep | Wait-for-condition; parallelise |

---

## 10. Interview Questions — Testing

| Question | Strong Answer |
|----------|---------------|
| "Test pyramid?" | Unit (many, fast) → integration (some) → E2E (few). Correct ratio = fast reliable feedback. |
| "Coverage kitna chahiye?" | Trend over target; branch coverage; critical paths 100%. 100% number = matlab nahi. |
| "Flaky test kaise handle?" | Root-cause (time/order/race), quarantine + fix in sprint, never permanent skip. |
| "CI me kaunsa test kab?" | PR=unit/lint; merge=integration+E2E+scan; release=smoke+canary gate. |
| "Unit vs integration?" | Unit isolated fast ms; integration real deps (DB/API) sec — both needed, ratio pyramid. |
| "E2E kyun kam?" | Slow + flaky + brittle selectors; cover critical journeys only; API/unit se logic. |
| "Staging = prod parity?" | Yes, degree matters: config/env/versions; secrets only via vault; data synthetic-but-realistic. |
| "How do you know your tests work?" | Mutation testing (kill weak tests), code review coverage, contract tests. |

---

## 11. Hands-On Lab (Python + pytest)

```bash
# 0. Setup
mkdir -p ~/tlab && cd ~/tlab
python3 -m venv .venv && source .venv/bin/activate
pip3 install pytest pytest-cov

# 1. App
cat > calc.py <<'EOF'
def add(a, b): return a + b
def divide(a, b):
    if b == 0: raise ValueError("div by zero")
    return a / b
EOF

# 2. Tests
cat > test_calc.py <<'EOF'
import pytest
from calc import add, divide

def test_add():
    assert add(2, 3) == 5

def test_divide():
    assert divide(10, 2) == 5

def test_divide_zero_raises():
    with pytest.raises(ValueError):
        divide(1, 0)

@pytest.mark.parametrize("a,b,exp", [(1,1,2),(0,0,0),(-1,1,0)])
def test_add_param(a, b, exp):
    assert add(a, b) == exp
EOF

# 3. Run + coverage
pytest -v --cov=calc --cov-report=term-missing

# 4. Coverage upar dikha + gate:
pytest --cov=calc --cov-fail-under=80
```

---

## 12. Summary | Yaad Rakho

1. Pyramid: much unit, some integration, little E2E
2. CI gates: PR (fast) → merge (deeper) → release (smoke/canary)
3. Coverage = trend; branch coverage; critical-first
4. Test data deterministic; env parity; trot-without-sleep (wait-for)
5. Flaky = bug (quarantine + fix, never permanent skip)
6. AAA + one behavior per test + test review
7. Smoke after deploy — prod alarms min me
8. Tests bhi code — lint, review, refactor - same barabar

---
**Related:** [Day 8](../day-08-cicd-concepts-and-pipelines.md) · [Day 9](../day-09-github-actions.md) · [Deployment Strategies](../topics/deployment-strategies.md) · [Git Advanced](../topics/git-advanced-workflow.md) · [Observability](../topics/observability.md)