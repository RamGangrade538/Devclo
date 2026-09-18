# Today's Task - Day 1: Start Your DevOps Journey

## Time Required: 1-2 hours

---

## Your Tasks for Today

### 1. Set Up Your Terminal (15 min)
- [ ] If on Windows, install WSL2: `wsl --install` in PowerShell
- [ ] Install Ubuntu from Microsoft Store (WSL2 users)
- [ ] Open your terminal and run `uname -a` to verify Linux is working

### 2. Install Essential Tools (20 min)
- [ ] Install Git: `sudo apt update && sudo apt install git -y`
- [ ] Install Docker: follow https://docs.docker.com/engine/install/
- [ ] Install VS Code: https://code.visualstudio.com/
- [ ] Verify installations: `git --version`, `docker --version`

### 3. Learn the Basics (30 min)
- [ ] Watch: "What is DevOps?" on YouTube (search: devops explained for beginners)
- [ ] Read: https://www.atlassian.com/devops
- [ ] Understand the DevOps lifecycle: Plan > Code > Build > Test > Release > Deploy > Operate > Monitor

### 4. First Hands-On (30 min)
- [ ] Open your terminal
- [ ] Create a new directory: `mkdir ~/devops-lab && cd ~/devops-lab`
- [ ] Initialize a Git repo: `git init`
- [ ] Create a file: `echo "# Hello DevOps" > README.md`
- [ ] Stage and commit: `git add README.md && git commit -m "First commit"`
- [ ] Check status: `git status`

### 5. Create Your GitHub Account (20 min)
- [ ] Go to https://github.com and sign up
- [ ] Create a new repository called `devops-lab`
- [ ] Push your local repo: follow the instructions on GitHub after creating the repo

---

## Quick Notes

**What is DevOps?**
> DevOps is a set of practices that combines software development (Dev) and IT operations (Ops). It aims to shorten the systems development life cycle and provide continuous delivery with high software quality.

**The 3 Ways of DevOps:**
| Principle | Description |
|-----------|-------------|
| Flow | Optimize left-to-right flow of work from Development to Operations to the customer |
| Feedback | Create fast and frequent feedback loops from right to left |
| Continual Learning | Continual experimentation and risk-taking enables learning from failures |

**DevOps Toolchain:**
| Phase | Tools |
|-------|-------|
| Plan | Jira, Trello, Azure Boards |
| Code | Git, GitHub, GitLab, VS Code |
| Build | Maven, Gradle, npm |
| Test | JUnit, Selenium, Pytest |
| Release | Jenkins, GitHub Actions, GitLab CI |
| Deploy | Docker, Kubernetes, Ansible |
| Operate | Terraform, CloudFormation |
| Monitor | Prometheus, Grafana, ELK Stack |

---

## Done for Today? Check these off:
- [ ] Terminal/WSL2 set up
- [ ] Git, Docker, VS Code installed
- [ ] Understand what DevOps is
- [ ] Created a Git repo and made first commit
- [ ] GitHub account created

---

**Tomorrow:** We'll dive into Linux fundamentals - the OS that powers most of the DevOps world.

*Good luck! Your DevOps journey starts now with DevClo 2027.*
