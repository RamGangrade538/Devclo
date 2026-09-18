# Deep Dive: Git Advanced — Branching, Rebase, Reflog, Bisect & Production Git

> **Kaha ka hai:** Day 6 (basics) ka next level. 5-saal-experience engineer ki pehchan = woh git se kabhi **data nahi khota** aur conflict me fasa nahi rehta. Team workflows bhi yahin se decide hote hain.

---

## 1. Git Ka Andar — 3 Trees + 4 Areas (Refresh)

```
working dir (files) → git add → staging (index) → git commit → local repo (.git)
                                          └─────────────── push → remote
```

```bash
git status                 # teeno state ek sath
git log --oneline --graph --decorate --all    # asli commit DAG
git reflog                 # HAR brackish commit/checkout ki diary (sabse valuable!)
```

> **Reflog = Git ka "undo machine".** Rebase/git reset ke baad "khoya hua" commit yahin se milta hai — `git reflog` se hash utha kar `git checkout <hash>`.

---

## 2. Branching Workflows — Team Me Kaunsa?

| Strategy | Kaisa | Kab Use |
|----------|-------|---------|
| **GitHub Flow** | `main` + feature branches + PR | Simple teams, SaaS, tag on release |
| **Git Flow** | `main`(prod) `develop` + `feature/` `release/` `hotfix/` | Scheduled releases, multi-version |
| **Trunk-Based** | Sab chhote PRs direct `main`; short-lived branches | Modern CI/CD, feature flags |
| **GitLab Flow** | `main` + per-env branches (`staging`, `prod`) | Environment-deploy workflows |

**Key wraparound badha:** *"Branch = cheap; merge policy = expensive."* Team ka matlab points:
- **Feature branch = PR ka scope chhota** (1-2 days)
- **main hamesha deployable** (CI green mandatory)
- **Code review = merge gate** (2 approvers)
- **No direct push to main** in shared repo

---

## 3. Merge vs Rebase vs Cherry-pick

```bash
# merge — history preserve (safety)
git checkout main && git merge feature

# rebase — linear history (clean log)
git checkout feature && git rebase main
git push --force-with-lease origin feature   # NOTE: force-with-lease

# cherry-pick — kisi ek commit ko is pr ko
git cherry-pick <commit-hash>
```

| | Merge | Rebase |
|---|-------|--------|
| History | Merge commits (true story) | Linear (clean) |
| Commit order | As-is | Replayed (new hashes!) |
| Safety | Safe on shared | Rewrites history — shared pe nahi |
| Debug | `--graph` tree | Simple `--oneline` |

**Golden rule:** *"Never rebase commits jo kisi aur ne already pull kiye hain."*

**Force cleanup:`--force-with-lease`** (danger kab? kahin shared branch bhi uspe push ho chuki ho). Normal `--force` kabhi nahi.

---

## 4. Conflicts — Ghabrao Mat, System Se Solve

Konflikt me 3 files aati hain — **ours/theirs/base**:
```bash
git merge feature           # conflict!
git status                  # unmerged paths
git diff                    # <<<<<<< HEAD = ours, >>>>>>> feature = theirs
```
```diff
<<<<<<< HEAD
def get_price():
    return base_price
=======
def get_price():
    return base_price * DISCOUNT
>>>>>>> feature
```

**Best approach:**
1. Code editor me **manually** line mila lo (dono ka intent samajh ke)
2. `git add <file>` (resolve mark)
3. `git commit` (merge) / `git rebase --continue` (rebase)

```bash
# Ya git mergetool (beyond-compare/vimdiff)
git mergetool
```

**Abort hota hai:**
```bash
git merge --abort    /    git rebase --abort
```

---

## 5. `git stash` — Is The Reset Button You Never Lose

```bash
git stash                # working dirty save
git stash list
git stash apply stash@{1}
git stash pop            # apply + drop
git stash show -p stash@{0}
git stash -u             # untracked files bhi
git stash branch new-br  # stash -> fresh branch se continue
```

---

## 6. Reflog + Reset — Safety Net

```bash
# Oops, main pe galt reset/merge
git reflog
git reset --hard HEAD@{2}   # khud ko pehle state par wapas
```

| reset mode | Working dir | Staging | Lokal branch |
|------------|-------------|---------|--------------|
| `--soft` | rahega | rahegi | point move |
| `--mixed`(default) | rahega | clear | point move |
| `--hard` | **delete kar de** | clear | point move |

```bash
# "last commit hadi — update karne"
git add .
git commit --amend -m "better message"
git push --force-with-lease
```

---

## 7. Professional Tools — bisect, blame, hooks, submodules, worktrees

```bash
# Bug kis commit se aaya? (binary search)
git bisect start
git bisect bad HEAD
git bisect good v2.3.0
git bisect run pytest                    # auto
git bisect reset

# Ye line kisne likhi?
git blame file.py | grep "buggy_line"

# Chhota bug fix pe bhi CI chalta hai (pre-push demo)
# .git/hooks/pre-push.sample ko enable karke test chalao
```

**Submodules** (avoid unless sure): `git submodule add <url>` — version-lock external repo.

**Worktrees** (multi-branch parallel): `git worktree add ../hotfix hotfix-branch` — 1 repo, 2 dirs.

**Tags (releases):**
```bash
git tag -a v2.5.0 -m "release 2.5.0"
git push --tags
git show v2.5.0
```

---

## 8. Git With IDE/CLI — Clean Commit Discipline

```bash
# Conventional Commits (CI mita tolerance)
git commit -m "feat(auth): add refresh tokens
fix(ci): pin action version
chore(deps): bump flask"
```

**CI hooked kaam:**
```
pre-commit (lint+format)  →  commitizen convention  →  pre-push (tests)  →  PR checks (CI)
```

---

## 9. Secrets Leaked? — Git Se Secret Nikalna

```bash
# Bina history commit se
git filter-repo --path secrets.py --invert-paths     # modern
# Install: pip install git-filter-repo

# phir force push + ROTATE the secret (IRON RULE: secret ever committed = compromised)
gitleaks detect --source .
```

---

## 10. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **"push rejected (non-fast-forward)"** | Remote advance | `git pull --rebase` (ya fetch+merge) phir push |
| **Galt merge main pe ho gaya** | Accidentally merged to main | `git reflog` → `git reset --hard HEAD@{1}` |
| **Rebase ke beech conflict missile jana** | Ruk gaye | Resolve → `git rebase --continue` |
| **Stash khoya (drop par message)** | `git stash drop` | `git fsck --lost-found` → recurse pr.... best: reflog |
| **Secret commit me tha** | Leak | `git filter-repo` + force + **rotate** + gitleaks pre-commit |
| **App ke release ka code kaun version chala raha** | Tags nahi | CI me tag-based `.build` + `git describe --tags` |
| **CI fail stale branch isliye** | Old main pe PR | PR base main rebase karo (rebase workflow) |
| **Multiple features sath chahiye** | One branch me bund | Worktrees or feature-flags (trunk-based) |

---

## 11. Interview Questions — Git Advanced

| Question | Strong Answer |
|----------|---------------|
| "merge vs rebase?" | Merge preserves history w/ merge commit; rebase rewrites to linear. Rebase ONLY on unpushed commits, `--force-with-lease`. |
| "Conflict resolve kaise?" | `git status` → edit 3-way markers → `git add` → continue. `mergetool` optional; abort bhi option hai. |
| "Commit khau gaya (reset) — kaise pao?" | `git reflog` → pollute karke `git reset --hard <hash>` / `git checkout <hash>`. Reflog ki expiry 90 days. |
| "`--force-with-lease` vs `--force`?" | Force-with-lease checks remote updated nahi hai (fetch base se); force blindly overwrites. Always lease. |
| "GitHub Flow vs Git Flow?" | GitHub Flow = short-lived branches to main (CD-friendly); Git Flow = develop/release/hotfix for scheduled vertical releases. |
| "Submodules kab?" | Repo mein version-pinned dependency; avoid — alternative: package manager + lockfiles. |
| "pre-commit kya hai?" | Git hook — commit se pehle lint/format/secrets scan. CI pe bhi duplicate rakho. |
| "How do you never lose work?" | Branch single-purpose, commit often (small), stash for WIP, reflog as safety net, push daily. |

---

## 12. Hands-On Lab

```bash
mkdir -p ~/gitlab && cd ~/gitlab && rm -rf repo && git init repo && cd repo
git config user.name "student"; git config user.email s@d.local
echo 'print(1)' > app.py && git add . && git commit -m "init"

# branch + rebase demo
git checkout -b feature
echo 'print(2)' >> app.py && git commit -am "feat 2"
git checkout main && echo 'print(3)' >> app.py && git commit -am "main 3"
git checkout feature
git rebase main && git log --oneline --graph -5      # linear!

# conflict demo
git checkout main && echo 'print(100)' >> app.py && git commit -am "main 100"
git checkout -b fb
echo 'print(200)' >> app.py && git commit -am "fb 200"
git checkout main && git merge fb || true            # conflict
git mergetool || true

# reflog demo
git reset --hard HEAD~1
git reflog
git reset --hard HEAD@{1}
git log --oneline -3

# bisect demo (small)
git checkout main
git commit --allow-empty -m "good"; git tag good
git commit --allow-empty -m "bad";  git tag bad
git bisect start; git bisect bad bad; git bisect good good
git bisect reset
```

---

## 13. Summary | Yaad Rakho

1. Reflog = undo machine; Reset modes = soft/mixed/hard
2. Rebase linear but **rewrites history** — shared pe never, `--force-with-lease` lena jaana
3. Merge = history true; success sahes
4. Conflict = 3-way markers rakh ke manually resolve
5. Workflows = GitHub Flow / Git Flow / Trunk-Based — team decide karo
6. `git bisect` = bug ka culprit commit binary search
7. `git filter-repo` = history me se secret nikalo + **rotate karo**
8. Chhote commits + conventional messages + tags per release

---
**Related:** [Day 6](../day-06-git-fundamentals.md) · [Day 9](../day-09-github-actions.md) · [Deployment Strategies](../topics/deployment-strategies.md) · [Testing](../topics/testing-and-test-automation.md)