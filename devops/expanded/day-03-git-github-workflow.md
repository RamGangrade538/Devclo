# Day 03 — Git + GitHub Full Workflow (DevClo Expanded)

## Overview | Parichay
DevOps me Git sirf "commit-push" nahi hai — ye deployment history, rollback aur collaboration ka source of truth hai. Day 3 me tum 3-areas, branches, merge/rebase/cherry-pick, PRs, branch protection aur **reflog** (sabse undervalued command) master karoge — INC-201 (merge conflict) aur INC-202 (wrong branch deploy) ke saath.

## What You'll Learn | Aaj Ki Seekh
- [ ] 3 areas (working/index/HEAD) + `git log --oneline --graph`
- [ ] reflog: deleted branch/commit recovery
- [ ] Trunk-Based Development (2026 standard) vs GitFlow
- [ ] `merge` vs `rebase` vs `cherry-pick` + `stash` + `squash`
- [ ] Signed commits (GPG) + tags/releases
- [ ] GitHub: PRs, reviewers, branch protection, CODEOWNERS, `git blame`
- [ ] 2026: merge queue, conventional commits, `git worktree`
- [ ] INC-201 aur INC-202 ticket ka full flow

## Full Topic (LEARN) | Puri Detail

### 1. Three Areas & The Mental Model
```
Working Directory → (git add) → Staging/Index → (git commit) → HEAD (local history) → (git push) → Remote
```
- **Working** = files on disk. **Index** = ready to be committed snapshot. **HEAD** = current branch's last commit.
- `git status` = state; `git log --oneline --graph --all` = history visual; `git show <sha>:file` = kisi bhi commit pe file.

### 2. Branching Strategy (2026 = Trunk-Based)
| Strategy | Kaisa | Kab |
|----------|-------|-----|
| GitFlow | main + develop + feature + release + hotfix | older monoliths, long release cycles |
| GitHub Flow | main + feature branches, PR merge | default for most teams |
| **Trunk-Based** | sab `main` pe, chhoti (1-2 day) feature branches, feature flags | **2026 recommended** — CI/CD fast |

- Short-lived feature branches + PR each change → `main` hamesha deployable. Feature flags se half-done code safely ship hota hai.
- `git checkout -b feat/login` = branch banao + switch (`git switch -c`).

### 3. Merge vs Rebase vs Cherry-Pick
- **merge**: naya merge commit; history jagah jagah se branch dikhni hai. Safe, add-only.
- **rebase**: apne commits ko main ke top pe replay karo — linear history. `git pull --rebase` standard practice (merge commits ki jhaank nahi).
- **cherry-pick**: kisi doosre branch ka ek specific commit laao: `git cherry-pick <sha>`.
- **squash**: PR ke saare commits → ek clean commit (`git merge --squash` ya GitHub "squash and merge").
- **stash**: incomplete kaam save karo, branch switch karo, `git stash pop` restore. `git stash -u` includes untracked.

### 4. Reflog — The Undo Button
`git reflog` = **har step** ka log (branch switch, reset, rebase, even deleted commits). Jab sab kuch toot jaaye (delete branch, `reset --hard` galat SHA):
```bash
git reflog                      # sha + action dikhega
git checkout -b recovery <sha>  # deleted branch recover
git reset --hard HEAD@{1}       # "undo the undo"
```

### 5. GitHub & PRs
- PR = "merge karne ki request" — code review, checks, CI gates.
- **Branch protection** (repo → Settings → Branches):
  - Require PR review (1-2 approvals)
  - Require status checks to pass (CI)
  - Require linear history / signed commits
  - Dismiss stale reviews
- **CODEOWNERS** (`.github/CODEOWNERS`): kuch paths ke files ka change sirf specific team approve kar sakti hai — e.g. `*/terraform/*` = @platform-team.
- `git blame file` = har line ka author + commit — "kisne ye line todi".
- **Tags/Releases**: `git tag -a v1.2.0 -m "release"` + `git push origin v1.2.0`; GitHub Release = tag + notes + artifacts.
- **Signed commits (GPG)**: `git commit -S -m "..."`; key setup `gpg --generate-key`. Protected branch "require signed commits" pe enforce karta hai.

### 6. 2026 Tools & Habits
- **Merge queue** (GitHub): PRs test-together merge hone se pehle — conflicting PRs ko CI race se bachata hai. Toggle "Merge queue" in protected branch.
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `!` (breaking). Auto-changelog + versioning ka base.
- **git worktree**: `git worktree add ../app-hotfix main` — ek folder me do branches simultaneously (no more stash juggling).

### 6. Real PR Lifecycle (Senior ke nazar se)
1. `git switch -c feat/xxx` apne local me — kuch commits.
2. Push: `git push -u origin feat/xxx` — GitHub pe PR button activate.
3. PR body: description + issue link + test evidence + screenshot (senior difference).
4. Reviewers: CODEOWNERS auto-assign; code review comments → commits update.
5. CI checks (lint + test) must-pass (branch protection enforce karta hai).
6. Merge (squash preferred) → branch delete auto → CI deploy trigger.
7. Post-merge: `git log --oneline -5` + release notes update.

**PR review me kya dekhta 5-saal wala**: diff sahi logic? tests added? secrets nahi (`gitleaks`), config change migration considered, env vars documented — code se zyada craft.

### 7. Common Ground Rules
- Kabhi `main` pe direct push nahi — everything through PR (protected branch).
- Commit message precise: `fix(auth): handle empty token` (conventional).
- Pull request chhota rakho (review-able) — 200+ line PR = re-design ka sign.
- `git pull --rebase` before push — merge commits clutter se bachav.
- Never `git push --force` on shared branches — `--force-with-lease` only if needed.
- `.gitignore` pehle hi file add karo (secrets cleanup baad me bahut mehnat ka kaam).

### 8. Git + CI/CD Integration (Kyun ye Day 3 me aata hai)
- CI triggers: `on: push: branches: [main]` + PR events.
- Rollback = `git revert` ya tag wapas deploy — isliye **tags HAMESHA prod commit pe**.
- Build number ↔ commit SHA mapping har artifact pe.
- GitHub Actions artifacts/merge queue = trunk-based ka enabler.

### 2026 Notes
Trunk-based + merge queue = default for high-velocity teams. GPG → ab **SSH signing** bhi supported (`git commit -S` with SSH key). `git switch/restore` (old checkout/reset split). GitHub Codespaces me Git setup zero-click.

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command | Kya karta hai |
|---------|----------------|
| `git status` / `git diff` | kya badla / unstaged changes |
| `git add -p` | hunk-by-hunk stage (senior trick) |
| `git commit -m "feat: ..."` | commit (conventional) |
| `git log --oneline --graph --all` | history map |
| `git switch -c feat/x` | nayi branch + switch |
| `git merge feat/x` / `git pull --rebase` | merge / linear history |
| `git cherry-pick <sha>` | ek commit copy |
| `git stash` / `git stash pop` | save/restore wip |
| `git revert <sha>` | safe undo (new commit) |
| `git reset --soft/mixed/hard` | undo area-wise |
| `git reflog` | har action ka log — recovery |
| `git blame file` | kaun author kis line ki |
| `git tag -a v1.0.0 -m "rel"` | release tag |
| `git commit -S` | signed commit (GPG/SSH) |
| `git worktree add ../x -b feat/y` | para-para se branches |

## Practice Lab | Abhi Karein
Ek scratch repo (`mkdir gitlab && cd gitlab && git init`) me:
1. `git config user.name/user.email` set karo.
2. README.md likho, `git add`, `git commit` — `git log --oneline` dekh.
3. `main` pe `git switch -c feat/login`; login.py + 2 commits karo.
4. `git switch main`; README me ek line change + commit (conflict ready karne ke liye).
5. `git merge feat/login` — **conflict aana chahiye**; file khولो, resolve, `git add`, `git commit`.
6. `git log --graph --oneline --all` — merge commit dekho.
7. `git tag -a v0.1.0 -m "first release"` + `git tag` verify.
8. `git switch feat/login; git stash`; `git switch main; git stash pop` — stash test.
9. Ab gurr se: feature branch par ek more commit archive, phir `git branch -D feat/login` (delete).
10. `git reflog` — deleted branch ka sha dhundo.
11. `git switch -c feat/recovered <sha-from-reflog>` — branch recover karo.
12. GitHub pe repo push karo, dusre "reviewer" se ek comment, PR banao + merge (merge queue mention karo).
13. `git blame` apne files par chalao.

## Incidents / Tickets | Real Practice

### INC-201 · Merge Conflict Blocks Release
- **Situation:** Release din, `feat/payroll-tax` branch merge hoti nahi — conflict `config.yaml` me. 2 devs ne alag-alag default values li. Release timeline 15 min over.
- **Investigate:**
  ```bash
  git switch main && git pull
  git switch feat/payroll-tax
  git merge main          # conflict dikhega
  git status              # unmerged paths
  cat config.yaml         # <<<<<<< ======= >>>>>>> sections
  git log --oneline main..feat/payroll-tax   # is branch ke naye commits
  ```
- **Root cause:** Dono branches ne `config.yaml` me `server.port`/`tax.percent` same area change kiya — main ne `tax_percent: 11`, feature ne `12`. Git ka conflict marker bolta hai "tum decide karo".
- **Fix:**
  ```bash
  # config.yaml me: sahi values rakh, conflict markers hata do
  git add config.yaml
  git merge --continue     # (ya git commit)
  # CI gate:
  pytest tests/ && npm test  # ya app ka build command
  git push
  ```
- **Verify:** `git log --oneline` me merge commit; CI green; `git diff main...feat/payroll-tax --stat` me koi conflict marker na ho.
- **Blast radius | Prevent:** Tax change delay = payroll cycle miss hota (~2000 employees affected). Prevent: config small commits, communication (branch lock), `.gitattributes` merge strategy, aur merge se pehle `git merge main` local (first-mover) — CI pe parikhasan time mat barhao.

### INC-202 · Wrong Branch Deployed to Production
- **Situation:** `main` pe hotfix push hua, CI ne build kiya aur production me deploy kar diya. User reports: expected feature visible hai. Per temp CI ne `develop` (unreviewed, unstable) build karla.
- **Investigate:**
  ```bash
  git log --oneline -10 main
  git log --oneline -10 develop
  git log --oneline -10 origin/main
  # CI workflow me trigger conditions:
  cat .github/workflows/deploy.yml
  git ls-remote origin refs/heads/main refs/heads/develop
  ```
- **Root cause:** CI workflow me trigger likha tha `on: push: branches: ['main','develop']` — dono pe deploy job common stage tha. `develop` pe automation bot ka merge bhi deploy trigger kar gaya. `git ls-remote`/logs me commit sha `develop` ke deploy artifacts se match kar raha hai.
- **Fix:**
  ```bash
  # 1. Correct ref se rebuild + deploy
  env APP_SHA=$(git rev-parse origin/main) ./deploy.sh
  # 2. CI gate:
  # on: push: branches: [main]   only
  # deploy job: if: github.ref == 'refs/heads/main'
  ```
- **Verify:** Production stack pe running image tag = `main` ke last commit SHA; `git log origin/main -1` SHA match; `curl https://api.example.com/health` → 200.
- **Blast radius | Prevent:** Unreviewed develop code prod me = potential instability for all users (≈ 50k/व्यय) temporarily. Prevent: env-per-branch mapping (dev→staging, main only→prod), branch protection `develop` don't deploy, deploy stage me `if: github.ref == 'refs/heads/main'` ga बंदी.

## Interview Corner | Sawal-Jawab

**Q: git merge vs rebase — kab kya?**
A: Merge = history me branch + merge commit milta hai (safe, collaborative). Rebase = apne commits ko linear replay (clean history, feature branch 1-2 din ki ho to). Rule: **public/shared branch pe kabhi rebase/history-rewrite mat karo** — dusron ki history toot jayegi.

**Q: reflog kyon important hai?**
A: `git reflog` har action (commit, reset, branch delete, checkout) ka lok bkhaar record rakhta hai — git garbage collect hote hi kabhi kabhi safe hai. `reset --hard` galat SHA se ya deleted branch recover karne ka conclude source-of-truth yehi hai.

**Q: Merge queue kya solve karta hai?**
A: Merging multiple PRs mainstream ka conflict race: 5 PRs sab green, ek merge hone se baaki 4 ke CI red ho jaate hain. Merge queue PRs ko sequential grouped-run me test karke merge karta hai — main hamesha green.

**Q: Branch protection me kya enforce karte ho?**
A: (1) PR reviews mandatory (≥1 approve + CODEOWNERS), (2) CI status checks must-pass, (3) linear history ya signed commits, (4) no direct push to main, (5) stale reviews dismiss. Ye "kabhi toota main" nahi hota ka guarantee hai.

**Q: Production pe galat branch deploy ho gaya — first move?**
A: Panic mat karo, **detect → isolate → rollback**: (1) `git log prod-tag..main` / deployment pipeline logs me source ref check karo, (2) wrong image tag note karo, (3) pehle correct/previous good tag se redeploy (velocity), (4) phir CI trigger fix karo (branch gate), (5) postmortem.

## Quick Notes | Yaad Rakhna
- Areega flow: add → commit → push; `git log --oneline --graph` hamesha
- Reflog = last resort ka undo — deleted branch/commit yahi se wapas
- Trunk-based: chhoti branches main pe, flag-based shipping
- Rebase = linear; use only on local/unpushed branches
- `git revert` safe hai, `reset --hard` careful
- Conventional commits: `feat:`, `fix:`, `chore:`
- CODEOWNERS + branch protection = quality gate sabse bada