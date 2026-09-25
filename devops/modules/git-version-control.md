# 🔀 Git & Version Control

> **Hinglish:** Git har developer/DevOps ka daily companion hai — code ki history, branches, aur team collaboration sab isi pe. Interview me "Git" ka sawaal pucha-hi-pucha jata hai. Ye module Git ke basics se advanced workflows tak le jata hai.

## 📖 Overview — Ye Topic Kya Hai

Git ek **distributed version control system (DVCS)** hai. Matlab: har developer ke paas pure project ki **full history copy** hoti hai, aur wo offline bhi kaam kar sakta hai. GitHub/GitLab/Bitbucket usi ke upar **remote collaboration** dete hain — code push/pull, PRs, code review.

Tum business me agar "production code pe kaun bhai kaam kar raha hai" nahi jante toh disaster. Git wahi discipline deta hai: **har change logged, har version revert karne ke kaabil**, har branch alag.

## 🟢 Beginner — Shuruaat yahan se

- `git init / clone / status / add / commit / log / diff` — daily loop.
- **Commit kya hai** — snapshot of changes with message.
- **Branching** — alag-alag features par alag lines of work.
- **Remote ka kaam** — `push`, `pull`, `fetch`, `clone`.

## 🟡 Intermediate — Team me kaam karo

- **Merge, rebase, cherry-pick, revert, reset** — history ko safe manage karna.
- **Merge conflicts** — jaldi aur correctly resolve karna.
- **Pull/Merge Requests** — peer review ke liye process.
- **Tags** (releases) aur **Git hooks** (automation triggers).
- **Branching strategies** — GitFlow, Trunk-based, feature branch.

## 🔴 Advanced — Pro bano

- **Semantic versioning** — releases ko `major.minor.patch` se naam dena.
- **reflog, bisect** — lost commits recover karna, buggy commit find karna.
- **Git internals** — objects, HEAD, index, dangling commits.
- **Submodules / monorepo vs polyrepo** — bade codebases ko manage karna.
- **GPG signing, alias aur workflow automation**.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Git fundamentals** — distributed version control: poora history sabke paas.
- [ ] **Git workflow** — working dir → stage → commit → push/pull loop.
- [ ] **Repository (repo)** — project ki folder + `.git` history.
- [ ] **Commit** — changes ka snapshot with message.
- [ ] **Branch** — alag-alag kaam ki parallel lines; default `main`.
- [ ] **Merge** — ek branch ke changes dusre me laana.
- [ ] **Rebase** — branch ko base pe phir se layna; clean history.
- [ ] **Cherry-pick** — ek specific commit ko dusre branch me copy karna.
- [ ] **Tags** — releases pe permanent naam (v1.0.0).
- [ ] **Git stash** — incomplete kaam ko temporary side pe rakhna.
- [ ] **Git reset** — commits/head ko peeche layna (soft/mixed/hard).
- [ ] **Git revert** — ek commit ke changes ko undo karke naya commit banana (safe).
- [ ] **Git bisect** — binary search se buggy commit dhoondhna.
- [ ] **Merge conflicts** — do logon ne same file badli; ko `<<<<<<` markers resolve karo.
- [ ] **Git hooks** — events pe scripts: pre-commit lint, post-merge deploy.
- [ ] **Branching strategies** — team ke liye rules: GitFlow, trunk, feature-branch.
- [ ] **Trunk-based development** — sab `main` pe small frequent commits.
- [ ] **GitFlow** — structured branches: main, develop, feature, release, hotfix.
- [ ] **Pull/Merge Requests** — changes review + discuss ke saath merge.
- [ ] **Code review** — doosre dev ko code dikhana; quality gate.
- [ ] **Semantic versioning** — `MAJOR.MINOR.PATCH` (breaking.feature.fix).
- [ ] **git log / git diff** — history aur changes dekhna.
- [ ] **git status** — "kya abhi pending hai" dekhna.
- [ ] **remote** — GitHub/GitLab se jode; origin main remote hota hai.
- [ ] **.gitignore** — jo track na ho (secrets, node_modules, .env).
- [ ] **HEAD / detached state** — kitna high point hai; aage-peeche movement.
- [ ] **Fast-forward vs no-ff merge** — history straight vs merge commit.
- [ ] **Squash** — kai commits ko ek me milana.
- [ ] **GPG signing** — commits pe signature; authenticity.
- [ ] **Reflog** — undo ki undo; lost commits wapas laane ka lifeline.
- [ ] **Git vs Github** — Git tool, GitHub hosting + collaboration UI.
- [ ] **Force push** — careful! history rewrite; `--force-with-lease`.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Git | Version control system | Har code project me |
| GitHub | Remote hosting + PRs/Actions | Collaboration + CI/CD |
| GitLab CI | Remote + pipelines | DevSecOps + self-hosted teams |
| Bitbucket | Atlassian stack hosting | Jira-heavy teams |
| Sourcetree / GitKraken | Git GUI | Beginners jo CLI se darrate hain |
| git-lfs | Large file storage | Binaries/videos waghera repo me |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Daily Loop:** Repo banao, 5 commits karo, `git log --oneline --graph` se history dekho.
- [ ] **Lab 2 — Conflict Fight:** Do branches me same line change karo, merge karo, conflict resolve karo.
- [ ] **Lab 3 — Undo Playground:** Ek bad commit banake revert karo; phir reset --hard try karo; phir reflog se recover karo.
- [ ] **Lab 4 — Branch Strategy Simulate:** GitFlow jaisi workflow banao — feature→develop→main releases.
- [ ] **Lab 5 — Hooks + Tags:** pre-commit hook me auto lint lagao; release pe tag banao (v1.0.0).
- [ ] **Project — Contribute karo:** Open source repo clone karo, issue fix karke PR submit karo (ya practice on GitHub).

## 🔗 Related Topics

- [🐍 Programming & Scripting](../modules/programming-scripting.md)
- [⚙️ CI/CD](../modules/cicd.md)
- [📦 Artifact & Package Management](../modules/artifact-package-management.md)
- [Git Advanced Workflow](../topics/git-advanced-workflow.md)
- [GitHub — Actions & Collaboration Hub](../topics/github-actions-deep.md)
- [Day 6 — Git Fundamentals](../day-06-git-fundamentals.md)