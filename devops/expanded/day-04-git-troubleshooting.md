# Day 04 — Git Troubleshooting: Secrets, Reverts & History Rewrite (DevClo Expanded)

## Overview | Parichay
"History me secret commit ho gaya" — ye sabse expensive git incident hai jo ek dev career me aata hai. Day 4 sirf advanced commands nahi, **safety drills** hain: secret leak detection + history removal + rotation, safe revert of bad deployments, aur `git reflog`/`filter-repo` se senior-level recovery. INC-203 aur INC-204 isi day ke prove hai.

## What You'll Learn | Aaj Ki Seekh
- [ ] `git reset --soft/--mixed/--hard` — teeno ka exact effect
- [ ] `git revert` — safe undo joh history nahi todti
- [ ] `git reflog` se deleted commits/branches recovery
- [ ] `git filter-repo` — history rewrite (secret removal, author change)
- [ ] Secret leak flow: detect (`gitleaks`) → remove → **rotate** → prevent (CI gate)
- [ ] Branch protection, required checks, `.gitignore`/`.gitattributes`
- [ ] CI secrets scanners (gitleaks pre-commit hook, GitHub secret scanning)
- [ ] Deployment mapping: git SHA → tag → image → env ka proof
- [ ] INC-203 aur INC-204 ka full ticket flow

## Full Topic (LEARN) | Puri Detail

### 1. reset Family — Area-by-Area Undo
| Command | Effect (jaha tak JAATA hai) |
|---------|------------------------------|
| `git reset --soft HEAD~1` | HEAD pichhe jaata hai, changes **staged** rehte hain |
| `git reset --mixed HEAD~1` | (default) changes **unstaged** working me |
| `git reset --hard HEAD~1` | changes **delete** — khatam. working dir ba wapas purana |

Rule: `reset` = local, unpushed history ke liye. Push ho chuka hai to `revert` karo (public history ko kabhi mat tod).

### 2. revert — The Safe Deployment Undo
`git revert <sha>` = ek **naya commit** jo us chang ke ulta kar deta hai. History intact, team sync me.
```bash
git log --oneline -5
git revert a1b2c3d          # bad deployment commit
# vi editor aayega: message keep, wq
git push
```
Multi-commit: `git revert --no-commit a1b2c3d e4f5g6h && git commit -m "revert: ..."`.
Revert ke baad rollout: pipeline redeploy hota hai naya commit → `curl` verify.

### 3. reflog — Full Recovery
```bash
git reflog                 # saare HEAD movements (30-90 day)
git reflog --all
git checkout -b rescue <sha>
git reset --hard HEAD@{2}
```
Bhooli hui branch: `git reflog show <branch>` se us branch ka last dha dekho ki wahi rehni chahiye; `git branch newbranch <sha>` banao.

### 4. filter-repo — History Rewrite (Secret Removal)
`git filter-repo` ab Git's original tool se developer recommend hai (fast + correct). Install: `pipx install git-filter-repo`.
```bash
git clone https://github.com/org/repo.git /tmp/repo && cd /tmp/repo
git filter-repo --invert-paths --path .env --path secrets.txt   # files hatao
git filter-repo --replace-text replacements.txt                 # content replace
# replacements.txt:
# AKIA1234ABC4512DEF==>REDACTED
git push origin --force --all
git push origin --force --tags
```
⚠️ **Golden rule:** Secret remove karne ke baad bhi **credential rotate karna hi hai** — kyunki kisi ne history clone kar liya ho to secret leak already possible hai. Remove = cleanliness, Rotate = real security.

### 5. Secret Leak Prevention Stack
- **gitleaks**: `gitleaks detect --source .` (local), `gitleaks protect --staged` (pre-commit). GitHub repo me secrets scanning default on.
- **pre-commit hook**: `.pre-commit-config.yaml` me gitleaks + `git-secrets` + trailuni.
- **CI gate**: GitHub Actions `step` gitleaks `--exit-code 1` → PR block.
- **`.gitignore`**: `.env`, `*.pem`, `id_rsa`, `config/keys/*`. `.gitattributes`: line-ending normalization + merge strategies.
- **Never print secrets** — `echo $TOKEN` bhi log me nahi; pipeline logs masked (`##[mask]`).

### 6. Deployment Mapping: SHA → Tag → Image → Env
Senior skill: "prod pe kaunsa code hai" ka proof:
```bash
git rev-parse HEAD                # local HEAD SHA
git tag | sort -V | tail          # release tags
docker image inspect app:prod --format '{{.Config.Labels}}'   # image source SHA
kubectl get deployment app -o jsonpath='{.spec.template.spec.containers[0].image}'
```
Chain: commit SHA → build artifact/tag → container image (`git-<sha8>`) → env config (dev/stage/prod). Postmortem me ye chain har incident me PDF-proof hota hai.

### 2026 Notes
GitHub **secret scanning** now scans fork/history; `git filter-repo` 2021 me `filter-branch` deprecated (slow); pre-commit standard; CI scans with `gitleaks` v8 + `trufflehog v3`. Git 2.4x+ default `main` branch. **SSH signing** + **GPG** dual support. Force-push protection on GitHub (`allow_force_pushes=false` + bypass list).

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `git reset --soft/mixed/hard HEAD~1` | area-wise undo |
| `git revert <sha>` | safe undo via naya commit |
| `git reflog` | head movement record |
| `git checkout -b rescue <sha>` | sha se branch recover |
| `git log --oneline --graph --decorate` | branch-safe history |
| `git filter-repo --invert-paths --path .env` | secret file history se |
| `git filter-repo --replace-text map.txt` | content purge |
| `gitleaks detect --source .` | secret scan |
| `gitleaks protect --staged` | pre-commit scan |
| `git rev-parse HEAD` / `git rev-parse --short HEAD` | SHA proof |
| `git tag -l` / `git ls-remote` | tags / remote refs |
| `git show --stat <sha>` | us commit me kya badla |
| `git push --force-with-lease` | safe force push |

## Practice Lab | Abhi Karein
1. Scratch repo banao; `git init leakon && cd leakon`; kuch commits karo.
2. **Intentional leak**: `.env` file banao (`echo "DB_PASSWORD=SuperSecret123" > .env`) aur `git add .env && git commit -m "add config"`.
3. `gitleaks detect --source .` chalao — secret milna chahiye (`DB_PASSWORD`).
4. Local `git log --oneline` me SHA note karo jis commit me `.env` hai.
5. `git add .gitignore` me `.env` daal ke commit karo (future protection).
6. Clone `git clone . /tmp/leakcopy` — ab is copy me `.env` abhi bhi history me hai — **prove: `git show <sha>:.env`**.
7. Abhi `git filter-repo --invert-paths --path .env` original repo me chalao.
8. `git show <sha>:.env` ab error `not known` — history se gira.
9. **Rotate**: kahe ki secret browser/password manager me badal diya (real ya dummy).
10. PRE-COMMIT gate: `.pre-commit-config.yaml` me gitleaks repo add karke `pre-commit install`, phir `git add .env` attempt karo — hook block kare.
11. **Revert drill**: ek `fix: remove debug logging` commit, usse `git revert <sha>` karo, `git log --oneline` me naya `revert:` commit verify.
12. Deployment proof: `git rev-parse --short HEAD` + apne local image/build tag me woh SHA use karke env mapping table likho.

## Incidents / Tickets | Real Practice

### INC-203 · Secret Committed to Public Repo
- **Situation:** `app-team/checkout-service` repo (public GitHub) me developer ne `.env` push kar di — usme AWS `AKIA...` keys + DB password. Slack pe retracted message: "secret in history!!"
- **Investigate:**
  ```bash
  git log --oneline --all -- .env          # kab commit hua
  git log -p -S 'AKIA' --oneline           # kis commit me key patt pe
  gitleaks detect --source . --report-format json --report-path leak.json
  ```
- **Root cause:** `.env` `.gitignore` me add karna bhool gaye; dev ne `git add -A && commit` kiya bina staging check kiye. Secret branch protect pe push hua (reviewer miss kiya).
- **Fix:**
  ```bash
  # 1. REMOVE from history (local + remote)
  cd /tmp && git clone https://github.com/app-team/checkout-service.git && cd checkout-service
  git filter-repo --invert-paths --path .env
  git remote add origin URL.md    # (origin re-add karo; filter-repo remote remove kar deta hai)
  git push origin --force --all
  git push origin --force --tags
  # 2. ROTATE credentials (non-negotiable)
  #    > AWS console / az keyvault se naya secret generate
  #    > purana key revoke/disable
  # 3. CI gate + pre-commit
  cat > .pre-commit-config.yaml <<'EOF'
  repos:
    - repo: https://github.com/gitleaks/gitleaks
      rev: v8.18.2
      hooks: [{id: gitleaks, args: ["--exit-code", "1"]}]
  EOF
  pre-commit install
  ```
- **Verify:** `git show main:.env` → `not known` (history me nahi); github.com/... `git log -S AKIA` empty; actions me gitleaks step pass; naya secret app me live + old revoked.
- **Blast radius | Prevent:** Public repo = attackers cloud loot kar sakte the (~per hour cost/security risk limitless). Preventions: `.gitignore` first-commit se, branch protection + required gitleaks check, GitHub secret scanning on, and hari paas UK credential rotation drill documented.

### INC-204 · Revert Bad Deployment
- **Situation:** `user-service` v3.2.1 (commit `b8f4c2d`) production pe deploy hua — hizme NPS queries failing, 500s rising. On-call: "fix tew fast, 15 min."
- **Investigate:**
  ```bash
  git log --oneline -10 origin/main
  kubectl get deploy user-service -o jsonpath='{.spec.template.spec.containers[0].image}'   # running SHA
  curl -s -o /dev/null -w '%{http_code}' https://user.example.com/api/users/123   # 500?
  git show b8f4c2d --stat          # bad commit me kya badla
  kubectl logs -l app=user-service --tail=100 | grep -i error
  ```
- **Root cause:** `b8f4c2d` ne DB index-drop migration + SQL query rewrite introduce kiya — production scale pe query plan explode (full table scan), latency 8s, 500s.
- **Fix:**
  ```bash
  git checkout main && git pull
  git revert b8f4c2d                # naya "revert the change" commit
  git commit -a -m "revert(v3.2.1): DB query rewrite b8f4c2d — NPS 500s" || true
  git push origin main              # CI/CD auto redeploy
  kubectl rollout status deploy/user-service
  ```
- **Verify:** `kubectl get deploy user-service -o ...image` = revert commit SHA; `curl` → 200; error rate dashboard <0.1% (grafana).
- **Blast radius | Prevent:** Saara user-profile traffic (300 RPS) affected ~18 min. Prevent: query in staging with prod copy data, perf check gate in CI, release tagging, aur revert = first instinct for new-change regression (investigation baad).

## Interview Corner | Sawal-Jawab

**Q: Secret commit ho gaya public repo me — steps?**
A: 1) **Rotate pehle** (secret ab compromised hai, kitne bhi remove karo), 2) `git filter-repo` se poori history me file/hii publish content purge karo aur force-push, 3) pre-commit + CI gitleaks gate add karo, 4) GitHub secret scanning/security tab verify + users ko informed. Order kisi bhi junior ko galat milta hai — senior `rotate` ko pehla step bolta hai.

**Q: `git reset --hard` vs `git revert`?**
A: reset = history **rewrite** (local, unpushed ke liye), working dir wapas purana — bad commit hamesha ke liye gaya. revert = **naya commit** jo undo karta hai, history transaction intact — shared/prod branch ke liye safe. Prod me sirf revert.

**Q: `filter-repo` vs `filter-branch`?**
A: `filter-repo` — fast (Cython), safe (saare refs handle), maintained; `filter-branch` deprecated (slow + footgun). Installation: `pipx install git-filter-repo`; use: `--invert-paths` (files hatao), `--replace-text` (content), `--mailmap`. And remember: history rewrite = force-push required + team ko re-clone karna padta hai.

**Q: "Konsa code prod pe chal raha hai" kaise prove karte ho?**
A: Chain mapping: deployment/tag → image SHA (`kubectl get deploy ... image` / `docker inspect labels`) → `git rev-parse` / CI build log me source commit. Har step ek immutable id (SHA) se jhudta hai; ye chain postmortem me main evidence hai.

**Q: `.gitattributes` kyon important?**
A: File attributes control karte hain: line endings (`* text=auto eol=lf`), binary detect, git-lfs tracking, merge strategy (e.g. `.gitattributes` se `config.yaml -text` preserve). Mislined line-ending churn aur dumb merge conflicts isi se mool ke bandh hote hain.

## Quick Notes | Yaad Rakhna
- reset(soft/mixed/hard) = staged/unstaged/delete undo; revert = safe naya commit
- Secret leak ho → **rotale pehle**, remove baad me
- `gitleaks` + pre-commit + CI gate = leak prevention stack
- `git filter-repo --invert-paths --path .env` — force-push ke saath
- Prod pe galat code → `git revert <sha>` → pipeline redeploy
- Deployment proof: SHA → tag → image → env, har jagah immutable id
- Never force-push to shared branches bina coordination (`--force-with-lease` prefer)