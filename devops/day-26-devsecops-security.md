# Day 26: DevOps Security (DevSecOps)
📚 Topic 26: Security Deep Dive — DevSecOps, CI Security Scans & Compliance
✅ Prerequisite-checklist: (review Day 25 ELK logging if needed)

## Overview | Parichay

Security ab "baad mein" nahi - har step mein honi chahiye. **DevSecOps** matlab security ko **shift-left** karna i.e. development ke har stage mein. Aaj hum SAST, DAST, container/dependency/secret scanning seekhenge.

Jaise ghar ka lock **design ke waqt** socha jaata hai, na ki rona ke baad — waise hi security ab build ke baad ki nahi, har commit par. Bug jo **abhi** milta hai (dev me) = chand rupaye; jo **prod** me milta hai = crore. Shift-left ka matlab: **secrets commit pe, code analysis CI me, dependencies scan build me, container image scan deploy se pehle.**

### Shift-left — security ka pehla principle

**Shift-left** ka matlab hai security checks ko pipeline ke **end** (deploy ke baad, prod me) se **shuru** (commit/CI) me le aana. Kyun: fix-cost curve exponential hai — dev me pakda to file edit, QA me to regression, prod me to incident, data leak ho gaya to court + reputation. Security team bhi shift-left se khush: 100 devs khud checks chalayenge, 2 security engineers baad me audit karenge. Practically ye hota hai **CI gates** ke roop mein — scan fail = exit 1 = pipeline red = deploy ruk jayega. Policy nahi, code ban jata hai.

Har stage pe kaunsa check lagta hai:

| Stage | Check | Tool |
|---|---|---|
| commit | secrets | `gitleaks` |
| PR | static code | `bandit` / Semgrep |
| build | dependency CVEs | `trivy fs` |
| image | container CVEs | `trivy image` |
| staging | running app attack | OWASP ZAP |

### SAST vs SCA vs DAST — teeno alag jagah dekhte hain

| Scan | Dekhta hai | Tool | Kab chalta hai |
|---|---|---|---|
| **SAST** | tumhara source code (patterns) | `bandit`, Semgrep | commit/PR pe, code static |
| **SCA** | 3rd-party deps ke known CVEs | `trivy fs`, Grype | build ke waqt, lockfile vs DB |
| **DAST** | chal rahe app ko attack | OWASP ZAP | staging pe, black-box |
| **Secret scan** | code me atke credentials | `gitleaks` | pehla gate, commit pe |

SAST "code ne aisi galti ki jo jagah kahin bhi ho sakti hai" bolta hai; SCA "tumne `requests==2.19.1` use kiya, usme CVE hai" — dono ka answer alag hai. DAST sabse late (running app chahiye) aur sabse slow, but real exposure dikhata hai.

### Secret scanning — commit se pehle rok do

Sabse sasta gate: **`gitleaks`** jaisa tool repo scan karta hai known **patterns** (AWS key `AKIA...`, private key header) aur **entropy** (random-looking string) se — secret mila to `--exit-code 1` se pipeline ruk jaati hai. Kyun itna drama: git history permanent hai — key ek baar commit hui to history se hatana mushkil (force push + rotate, dono). Rule: 1) **kabhi hardcoded secret nahi**, 2) env vars / **Azure Key Vault** / Vault se lo (Day 35), 3) leak ho jaye to **turant rotate** karo, sirf delete se kaam nahi chalta. Pre-commit hook + CI dono me lagao — do layers.

Kaunse secrets detect hote hain: AWS/Azure keys, private keys, GitHub/Slack tokens, generic passwords.

- pattern match (known formats jaise `AKIA...`)
- entropy check (random high-entropy string bhi)
- git history bhi scan — purana commit bhi leak hai

### SCA aur container scanning — bahar wale risk

**SCA** tumhare lockfile (`requirements.txt`, `package-lock.json`) ko vulnerability DB (NVD/OSV) se match karta hai — `trivy fs .` chalao, HIGH/CRITICAL CVEs bahar. **Container scan** (`trivy image`) zyada gehra hai: base OS packages + app libraries + misconfigs — kyunki image me OS bhi to hai (Log4Shell jaisa 0-day dependency me tha, infra nahi). Gotchas: 1) `--ignore-unfixed` (fix available hi nahi to kuch kar nahi sakte), 2) severity threshold team decide karti hai (HIGH + CRITICAL = block), 3) **base image** chhoti rakho — `alpine`/`distroless` = attack surface kam, 4) scan hamesha build ke baad asli image pe, sirf Dockerfile pe nahi.

### CI gates — asli guard kaun hai

Scans tab tak suggestions hain jab tak **guard** na ho. CI me har step ka exit code check hota hai — isliye **`--exit-code 1`** flag hi asli weapon hai: vulnerability mila = job fail = deploy stage kabhi chalu hi nahi hoti. Order matter karta hai (sabse sasta/fast pehle): `gitleaks` (seconds) → `bandit` (seconds) → `trivy fs` → `trivy image` (slowest, build ke baad). Production me **waiver process** hoti hai — critical fix possible nahi to ticket + expiry ke saath exception, silently `|| true` kabhi nahi (wo gate ko gate hi nahi banata).

Gate ka asli mechanism ek line hai — exit code:

```bash
trivy image --severity HIGH,CRITICAL --exit-code 1 app:1.0
# exit 1 -> job fail -> deploy job kabhi start hi nahi hoga
```

### SBOM aur supply chain ka angle

Modern security ka extra layer: **SBOM (Software Bill of Materials)** — image/repo ki "andar kya hai" wali list (`trivy image --format cyclonedx`). Jab naya CVE aata hai to ek command se check: "kya hamari kisi image me `log4j` hai?" — ye **supply chain** thinking hai. Isi world se aate hain signed images, pinned digests (`image@sha256:...`), aur dependency pinning (lockfile commit). DevSecOps ka mantra: **tum jitna pin karoge, tumhe surprise utne kam.**

### Gotchas aur interview angle

Common mistakes: 1) sirf release pe scan (har push pe karo — bug wahi milega), 2) scan fatigue (har LOW finding block = devs bypass karenge — threshold rakho), 3) `.env` file repo me (`.gitignore` + gitleaks dono), 4) scanner CI runner me loosely installed (tooling as code — version pin karo). Interview: "**SAST aur SCA ka fark?**" (apna code vs dependencies), "**secret leak hua to?**" (rotate first, history cleanup second), "**shift-left se team kyun khush?**" (late fix = on-call + business loss). Reply me hamesha **tool + exit code + gate** ka triangle dikhao.

Ek-line memory hooks:

- shift-left = fix sasta, prod me fix = incident
- SAST = apna code, SCA = bahar wale deps, DAST = chal rahe app pe attack
- secret leak = rotate first, git history cleanup second
- scan without `--exit-code 1` = suggestion, gate nahi

## What You'll Learn | Aaj Ki Seekh

- [ ] Shift-left philosophy — security har stage pe, baad me nahi
- [ ] SAST vs SCA vs DAST — teeno alag problems
- [ ] SAST: Bandit (Python) se static code analysis
- [ ] Secret scanning: `gitleaks` se leaks commit se pehle rokna
- [ ] SCA: `trivy fs` / `grype` — dependencies ke CVEs
- [ ] Container scanning: `trivy image` — base image + app CVEs
- [ ] CI gates — kaun guard karta hai pipeline ko (koi scan fail → build block)

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart LR
    DEV["Developer commit"] --> SECRET["gitleaks\n(secret scan)"]
    SECRET --> SAST["SAST: Bandit\n(python code)"]
    SAST --> SCA["SCA: Trivy fs\n(dependencies)"]
    SCA --> IMG["trivy image\n(container CVE)"]
    IMG --> GATE{"High/Critical?\ndeploy block"}
    GATE -->|"fail (exit 1)"| FIX["Fix + re-scan"]
    GATE -->|"pass"| DEPLOY["Deploy"]
```

ASCII:
```
commit → gitleaks(secrets) → bandit(SAST) → trivy fs(SCA) → trivy image → gate → deploy
                                  koi bhi HIGH/CRITICAL = pipeline RED
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Tools install
go install github.com/gitleaks/gitleaks/v8@latest            # path ~/go/bin me
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
pip install bandit

# 2. Thoda risky repo banao (demo)
mkdir -p sec-lab && cd sec-lab
echo 'db_password = "SuperSecret123!"' > config.py
echo 'password=AKIAIOSFODNN7EXAMPLE' > .env
cat > app.py << 'EOF'
import subprocess
def run(cmd):
    subprocess.call(cmd, shell=True)      # shell=True = command injection risk
EOF
echo -e 'Flask==2.0.1\nrequests==2.19.1' > requirements.txt

# 3. Secret scan — commit se pehle
gitleaks detect --source . --verbose --exit-code 1 || echo "BLOCKED"

# 4. SAST — python code analysis (B602, B603...)
bandit -r . -q -f json -o bandit.json; grep -i severity bandit.json | head

# 5. SCA — requirements.txt ke CVEs
trivy fs . --severity HIGH,CRITICAL --ignore-unfixed

# 6. Container scan — build karke image me kya hai
docker build -t demo-app:1.0 .
trivy image --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed demo-app:1.0
trivy image --format cyclonedx --output sbom.cdx.json demo-app:1.0   # SBOM bhi
```

**Kaun guard karta hai CI:** yahi scans GitHub Actions/GitLab CI me steps ke roop mein:

```yaml
# .github/workflows/security.yml — push/PR pe chalta hai, fail = deploy block
name: Security Gates
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: gitleaks detect --source . --exit-code 1
      - run: pip install bandit && bandit -r . -q --exit-zero || true
      - run: trivy fs . --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed
      - run: docker build -t app:ci .
      - run: trivy image --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed app:ci
```

## Real-Life Example | Industry Me

**Production me:** Log4Shell (log4j RCE) ka asli incident yaad karo — almost har company ne dependency list scan karke `log4j 2.16` upgrade kiya. Us din jo teams ne **SCA abhi se** laga rakha tha, unhe ek command me poori trivy hogi. Production pipeline gates: gitleaks (side effects: leaked key = PCIDSS chain) → SAST (tirchi queries) → SCA (deps) → image scan (base OS CVEs) → signing. **Waiver system** bhi hota hai — har critical ka ticket, expire wali waiver, silently bypass NEVER.

## Practice Exercise | Abhi Karein

1. gitleaks + trivy + bandit install karo
2. Risky repo banao (`config.py`, `.env`, `app.py`, `requirements.txt`)
3. `gitleaks detect` — fake AWS key pakdo, `--exit-code 1` ka asar dekho
4. `bandit -r .` — B602/B603 issues padho aur code fix karo
5. `trivy fs .` — requirements.txt ke HIGH/CRITICAL CVEs dhundo
6. App image build karke `trivy image` (base OS + packages) compare karo vs distroless
7. Security workflow YAML ko GitHub Actions pe push karke ek vulnerability se build fail karo

## Quick Notes | Yaad Rakho

```
- Shift-left = security har stage pe, bug early = sasta fix
- SAST = source code (Bandit/Semgrep) | SCA = dependencies (Trivy/Grype)
- DAST = running app attack (OWASP ZAP) - prod ke paas
- gitleaks = secrets on commit (regex + entropy); rotate immediately agar leak
- trivy = swiss army: fs (deps), image (container), repo, k8s
- Container scan: base image CVEs bhi scrutinize karo - distroless/scratch chuno
- CI gate: HIGH/CRITICAL found → exit 1 → pipeline red → no deploy
- Make sure Integrated pipelines: every push scans, not just releases
- SBOM (syft/trivy) = "andar kya hai" list - compliance + supply chain
- Never hardcode secrets; Key Vault/Vault/SOPS use karo (Day 35)
```

**Agla:** SRE — SLI/SLO, error budgets, burn rate aur incident management (Day 27).