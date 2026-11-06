# Module 9 — Git and GitHub

> **Hinglish:** Git = tumhare code ka time machine. GitHub = wo time machine team ke saath share karne ki jagah. Is module me init, commit, branch/merge, remote push, SSH auth, aur `.gitignore` seekhoge.

**Prerequisite:** Git installed (`git --version`). GitHub account (task 60 ke liye).
**Setup:**
```bash
mkdir -p ~/devops-lab/git-lab
cd ~/devops-lab/git-lab
git --version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Task 57: Initialize a Repository

**Scenario:** Apne lab scripts ko version control me daalna hai. Ek naya Git repository initialize karo aur status dekho.

**Command plan:**
```bash
mkdir -p ~/devops-lab/git-lab
cd ~/devops-lab/git-lab
git init -b main
git status
ls -la .git | head
git rev-parse --show-toplevel
```

**Verification:**
- `git init` ke baad "Initialized empty Git repository" message aaye.
- `git status` me "On branch main" aur "No commits yet" dikhe.
- `.git/` directory exist kare.
- `git rev-parse --show-toplevel` repo root path de.

**Note:** `-b main` default branch ko `main` banata hai. Git me `.git/` hi history/config rakhta hai — ise delete karne se local history chali jayegi.

---

## Task 58: Commit Changes

**Scenario:** Lab scripts ko track karo aur pehla meaningful commit banao. Commit message se future me pata chale kya badla tha.

**Command plan:**
```bash
cd ~/devops-lab/git-lab
printf '# DevClo Lab Scripts\n\nUbuntu DevOps practice repository.\n' > README.md
mkdir -p scripts
printf '#!/usr/bin/env bash\necho "hello from git lab"\n' > scripts/hello.sh
chmod +x scripts/hello.sh
git status
git add README.md scripts/hello.sh
git status
git commit -m "Add initial lab scripts and README"
git log --oneline --decorate
git show --stat --oneline HEAD
```

**Verification:**
- `git status` commit se pehle untracked files dikhaye.
- `git add` ke baad files "Changes to be committed" me hon.
- `git log --oneline` me commit hash + message dikhe.
- `git show --stat` me 2 files changed hon.

**Note:** `git add .` se pehle `git status` dekho — galti se secrets/logs add na ho jayein. Commit chhota aur focused rakho.

---

## Task 59: Branch and Merge

**Scenario:** Naya feature (`health-check`) main code ko chhede bina banao. Feature branch pe kaam karo, phir main me merge karo.

**Command plan:**
```bash
cd ~/devops-lab/git-lab
git switch -c feature/health-check
printf '#!/usr/bin/env bash\necho "health: OK"\n' > scripts/health-check.sh
chmod +x scripts/health-check.sh
git add scripts/health-check.sh
git commit -m "Add health check script"
git switch main
git status
git merge --no-ff feature/health-check -m "Merge health check feature"
git log --oneline --graph --decorate --all
ls -l scripts/health-check.sh
```

**Verification:**
- `feature/health-check` branch create ho aur commit ho.
- `main` pe merge ke baad `scripts/health-check.sh` mile.
- `git log --graph` me merge commit dikhe.
- `git branch` me dono branches hon.

**Note:** `git switch -c` = naya branch + uspe jao (purana `git checkout -b` bhi chalta hai). Merge conflict aaye to file manually fix karke `git add` + `git commit`.

---

## Task 60: Connect GitHub

**Scenario:** Local repository ko GitHub pe push karo taaki backup + collaboration ho. GitHub pe pehle khaali repo banao (README ke bina).

**Command plan:**
```bash
cd ~/devops-lab/git-lab
git remote -v
git remote add origin git@github.com:<YOUR_USERNAME>/devclo-git-lab.git
git remote -v
git push -u origin main
git branch -vv
git status
```

**Verification:**
- `git remote -v` me `origin` fetch/push URLs dikhein.
- `git push -u origin main` success ho.
- GitHub page pe files dikhein.
- `git branch -vv` me `main ... [origin/main]` tracking ho.

**Note:** `<YOUR_USERNAME>` aur repo name apne hisaab se badlo. HTTPS URL use karo to PAT (personal access token) lagega; SSH ke liye task 61 dekho. Force push (`--force`) shared branch pe mat karo.

---

## Task 61: SSH and .gitignore

**Scenario:** Password ki jagah SSH key se GitHub auth setup karo. Aur local logs/secrets ko repo se bahar rakho — `.gitignore` ke saath.

**Command plan:**
```bash
ls -la ~/.ssh
ssh-keygen -t ed25519 -C "devclo-github" -f ~/.ssh/github_devclo
cat ~/.ssh/github_devclo.pub
```
**GitHub → Settings → SSH and GPG keys → New SSH key** me public key paste karo, phir:
```bash
ssh -T git@github.com
cd ~/devops-lab/git-lab
cat > .gitignore <<'EOF'
# local logs and secrets
logs/
*.log
.env
.env.*
!.env.example
*.pem
__pycache__/
EOF
mkdir -p logs
echo "secret=do-not-commit" > .env
echo "local log" > logs/app.log
git status --short
git add .gitignore
git commit -m "Add gitignore for logs and secrets"
git push
```

**Verification:**
- `ssh -T git@github.com` "successfully authenticated" message de (username ke saath).
- `git status --short` me `.env` aur `logs/` **na** dikhein.
- `.gitignore` commit + push ho.
- GitHub pe `.env`/logs nahi dikhein.

**Note:** Private key (`github_devclo`) kabhi share/commit na karo. Pehle se tracked secret ho to: `git rm --cached .env` phir commit. `.gitignore` sirf untracked files ko ignore karta hai. Secrets ke liye `.env.example` rakho, real `.env` nahi.

---

## Module 9 Done — Checklist

- [ ] Git repo initialize kiya.
- [ ] Files stage karke commit kiya.
- [ ] Feature branch + merge kiya.
- [ ] GitHub remote add karke push kiya.
- [ ] SSH key auth setup kiya.
- [ ] `.gitignore` se logs/secrets exclude kiye.

**Next:** [Module 10 — Docker](module-10-docker.md)
