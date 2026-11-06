# Linux Hands-On Labs for Beginners (DevOps & Azure)

> Safe, practical labs to master Linux fundamentals for DevOps and Azure. All exercises run in `~/linux-labs/`. No destructive production commands. `chmod 777` is **not** recommended as a fix. Sudo is clearly labeled with risks.

**Target Audience:** Absolute beginners learning Linux for DevOps/Azure  
**Platform:** Ubuntu Linux (tested on this environment)  
**Time:** ~6-8 hours total (spread over practice)  
**Approach:** Learn -> Type -> Explain -> Verify -> Practice

---

## Table of Contents

1. [Lab 01: Setup & Safe Workspace](#lab-01-setup--safe-workspace)
2. [Lab 02: Linux Filesystem, `pwd`, `ls`, `cd`](#lab-02-linux-filesystem-pwd-ls-cd)
3. [Lab 03: Creating & Viewing Files (`mkdir`, `touch`, `cat`, `less`, `head`, `tail -f`)](#lab-03-creating--viewing-files)
4. [Lab 04: Copy, Move, Rename & Remove (`cp`, `mv`, `rm`)](#lab-04-copy-move-rename--remove)
5. [Lab 05: Search & Filter (`find`, `grep`, `pipes`, `redirection`)](#lab-05-search--filter)
6. [Lab 06: Text Counting & Processing (`wc`, combining tools)](#lab-06-text-counting--processing)
7. [Lab 07: Users, Groups & `sudo`](#lab-07-users-groups--sudo)
8. [Lab 08: Permissions Deep Dive (`chmod`, `chown`, `rwx`, octal)](#lab-08-permissions-deep-dive)
9. [Lab 09: Deployment Scripts & Automation Basics](#lab-09-deployment-scripts--automation-basics)
10. [Lab 10: Application Deployment (Mini-Project)](#lab-10-application-deployment-mini-project)
11. [Appendix: Quick Reference, Safety, Troubleshooting](#appendix-quick-reference-safety-troubleshooting)

---

## Lab 01: Setup & Safe Workspace

### Objective
By the end of this lab, you will:
- Understand why we use a safe practice directory
- Create `~/linux-labs/` with a clean structure
- Learn basic shell safety tips for labs

### Prerequisites
- Ubuntu Linux terminal access
- A non-root user (like `ubuntu`) — normal for most environments

### Step-by-step commands
```bash
# Create main practice directory
mkdir -p ~/linux-labs

# Create subdirectories for organized practice
mkdir -p ~/linux-labs/{filesystem,files,search,users-perms,scripts,deployment,logs}

# Verify structure
ls -la ~/linux-labs
```

### Command explanations (Hinglish)
| Command | Explanation |
|---|---|
| `mkdir -p` | Parent directories bhi create karta hai agar nahi hain. `-p` = "parents". |
| `~` | Current user's home directory (`/home/username`). |
| `{}` brace expansion | Ek hi line se multiple directories create karne ka shortcut. |

### Expected output
```
linux-labs/
├── deployment
├── files
├── filesystem
├── logs
├── scripts
├── search
└── users-perms
```

### Verification & Troubleshooting
- **Check:** `pwd` gives `/home/ubuntu` and `ls ~/linux-labs` shows folders.
- **Error:** `Permission denied` — you're likely in a read-only dir. Use `~/` in home.
- **Tip:** Never practice destructive commands in `/etc`, `/root`, or project code until you understand them.

### Real-world DevOps/Azure use case
On Azure VMs/Jumpboxes, you create isolated working dirs for testing scripts, logs, and deployments without touching system configs.

### Practice tasks
1. Create `~/linux-labs/practice-day1` and list it.
2. Create 3 nested dirs `a/b/c` using `mkdir -p`.

**Solution:**
```bash
mkdir -p ~/linux-labs/practice-day1
mkdir -p ~/linux-labs/a/b/c
ls -R ~/linux-labs/practice-day1 ~/linux-labs/a
```

---
