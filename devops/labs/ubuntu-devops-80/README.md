# 80 Practical DevOps Tasks — Ubuntu to Job-Ready

> **Hinglish:** Ye ek hands-on roadmap hai — 80 tasks, 12 modules, Ubuntu-based. Har task me **scenario**, **commands**, aur **verification** diya hai. Sirf padho mat — type karo, output compare karo, phir aage badho.

**Platform:** Ubuntu 22.04/24.04 (VM, WSL2, ya cloud VM)
**Level:** Beginner → job-ready projects
**Time:** ~30-40 hours (module 1-7 basics, 8-12 projects)
**Golden rule:** Sab practice `~/devops-lab/` ya dedicated VM me karo. Production paths (`/etc`, `/var`, `/root`) ko bina samjhe mat chhedo.

---

## How to Use This Roadmap

1. **Ek module ek baar** me karo; andar ke tasks order me karo.
2. Har task ka **command plan** copy-paste se pehle padho — kya kar raha hai, samjho.
3. **Verify** step ka output match hone ke baad hi next task.
4. Error aaye to **troubleshoot** karo, `sudo` ya `chmod 777` blindly mat lagao.
5. Apne outputs/screenshots `~/devops-lab/notes/` me rakho — interview/portfolio me kaam aayenge.

### One-time setup

```bash
mkdir -p ~/devops-lab/{notes,scripts,logs,files,backups,git-lab,docker-app,docker-data}
cd ~/devops-lab
pwd
```

### Safety Rules

- `adduser`, `chown`, `systemctl`, package install, Docker, Azure — ye system change karte hain. Lab VM use karo.
- `rm -rf` unknown path pe kabhi nahi. Pehle `ls` se path confirm karo.
- `chmod 777` fix nahi hai. Minimum permission do (`600`, `640`, `750`).
- UFW/firewall remotely change karne se SSH lock ho sakta hai — pehle rule check karo.
- Azure resources paise lagate hain — module 11 ke baad **cleanup** zaroor karo.
- Docker install steps Ubuntu version pe depend karte hain — official docs verify karo.

---

## Module Index

### Module 1 — Linux Basics and Filesystem
1. [Task 1: Ubuntu Server Audit](module-01-linux-basics.md#task-1-ubuntu-server-audit)
2. [Task 2: Navigate the Filesystem](module-01-linux-basics.md#task-2-navigate-the-filesystem)
3. [Task 3: Create a Project Structure](module-01-linux-basics.md#task-3-create-a-project-structure)
4. [Task 4: Create and Read Files](module-01-linux-basics.md#task-4-create-and-read-files)
5. [Task 5: Copy, Move, and Rename](module-01-linux-basics.md#task-5-copy-move-and-rename)
6. [Task 6: Read Large Files](module-01-linux-basics.md#task-6-read-large-files)
7. [Task 7: Find Files and Search Content](module-01-linux-basics.md#task-7-find-files-and-search-content)
8. [Task 8: Pipes and Redirection](module-01-linux-basics.md#task-8-pipes-and-redirection)

### Module 2 — Users and Permissions
9. [Task 9: Inspect User Accounts](module-02-users-permissions.md#task-9-inspect-user-accounts)
10. [Task 10: Create Practice Users](module-02-users-permissions.md#task-10-create-practice-users)
11. [Task 11: Create Groups](module-02-users-permissions.md#task-11-create-groups)
12. [Task 12: Add Users to Groups](module-02-users-permissions.md#task-12-add-users-to-groups)
13. [Task 13: Practice chmod](module-02-users-permissions.md#task-13-practice-chmod)
14. [Task 14: Practice chown and chgrp](module-02-users-permissions.md#task-14-practice-chown-and-chgrp)
15. [Task 15: Directory Permissions](module-02-users-permissions.md#task-15-directory-permissions)
16. [Task 16: sudo and Least Privilege](module-02-users-permissions.md#task-16-sudo-and-least-privilege)
17. [Task 17: umask and ACL Basics](module-02-users-permissions.md#task-17-umask-and-acl-basics)
18. [Task 18: Permission Troubleshooting](module-02-users-permissions.md#task-18-permission-troubleshooting)

### Module 3 — Processes and Services
19. [Task 19: Process Inspection](module-03-processes-services.md#task-19-process-inspection)
20. [Task 20: Background Jobs](module-03-processes-services.md#task-20-background-jobs)
21. [Task 21: Stop a Process Safely](module-03-processes-services.md#task-21-stop-a-process-safely)
22. [Task 22: Manage systemd Services](module-03-processes-services.md#task-22-manage-systemd-services)
23. [Task 23: Enable a Service at Boot](module-03-processes-services.md#task-23-enable-a-service-at-boot)
24. [Task 24: Inspect Service Logs](module-03-processes-services.md#task-24-inspect-service-logs)
25. [Task 25: Create a Custom Service](module-03-processes-services.md#task-25-create-a-custom-service)
26. [Task 26: Service Failure Troubleshooting](module-03-processes-services.md#task-26-service-failure-troubleshooting)

### Module 4 — Packages and Environment
27. [Task 27: Package Management](module-04-packages-environment.md#task-27-package-management)
28. [Task 28: Install and Verify Nginx](module-04-packages-environment.md#task-28-install-and-verify-nginx)
29. [Task 29: Environment Variables](module-04-packages-environment.md#task-29-environment-variables)
30. [Task 30: PATH and Shell Startup](module-04-packages-environment.md#task-30-path-and-shell-startup)

### Module 5 — Networking
31. [Task 31: IP and Hostname](module-05-networking.md#task-31-ip-and-hostname)
32. [Task 32: Connectivity Checks](module-05-networking.md#task-32-connectivity-checks)
33. [Task 33: Inspect Listening Ports](module-05-networking.md#task-33-inspect-listening-ports)
34. [Task 34: SSH Access](module-05-networking.md#task-34-ssh-access)
35. [Task 35: Firewall Rules](module-05-networking.md#task-35-firewall-rules)
36. [Task 36: Troubleshoot a Web Port](module-05-networking.md#task-36-troubleshoot-a-web-port)

### Module 6 — Storage and Monitoring
37. [Task 37: Disk Usage](module-06-storage-monitoring.md#task-37-disk-usage)
38. [Task 38: Directory Size](module-06-storage-monitoring.md#task-38-directory-size)
39. [Task 39: Memory and CPU](module-06-storage-monitoring.md#task-39-memory-and-cpu)
40. [Task 40: Block Devices](module-06-storage-monitoring.md#task-40-block-devices)
41. [Task 41: Logs and Log Rotation](module-06-storage-monitoring.md#task-41-logs-and-log-rotation)
42. [Task 42: Health Check Report](module-06-storage-monitoring.md#task-42-health-check-report)

### Module 7 — Bash Scripting
43. [Task 43: First Bash Script](module-07-bash-scripting.md#task-43-first-bash-script)
44. [Task 44: Variables and Arguments](module-07-bash-scripting.md#task-44-variables-and-arguments)
45. [Task 45: Conditional Logic](module-07-bash-scripting.md#task-45-conditional-logic)
46. [Task 46: Loops](module-07-bash-scripting.md#task-46-loops)
47. [Task 47: Functions and Exit Codes](module-07-bash-scripting.md#task-47-functions-and-exit-codes)
48. [Task 48: Error Handling and Logging](module-07-bash-scripting.md#task-48-error-handling-and-logging)
49. [Task 49: Schedule a Cron Job](module-07-bash-scripting.md#task-49-schedule-a-cron-job)
50. [Task 50: Server Health Script](module-07-bash-scripting.md#task-50-server-health-script)

### Module 8 — Deployment Projects
51. [Task 51: Application Directory Layout](module-08-deployment-projects.md#task-51-application-directory-layout)
52. [Task 52: Create a Sample App](module-08-deployment-projects.md#task-52-create-a-sample-app)
53. [Task 53: Write a Deployment Script](module-08-deployment-projects.md#task-53-write-a-deployment-script)
54. [Task 54: Apply Least-Privilege Ownership](module-08-deployment-projects.md#task-54-apply-least-privilege-ownership)
55. [Task 55: Create a systemd App Service](module-08-deployment-projects.md#task-55-create-a-systemd-app-service)
56. [Task 56: Verify and Roll Back](module-08-deployment-projects.md#task-56-verify-and-roll-back)

### Module 9 — Git and GitHub
57. [Task 57: Initialize a Repository](module-09-git-github.md#task-57-initialize-a-repository)
58. [Task 58: Commit Changes](module-09-git-github.md#task-58-commit-changes)
59. [Task 59: Branch and Merge](module-09-git-github.md#task-59-branch-and-merge)
60. [Task 60: Connect GitHub](module-09-git-github.md#task-60-connect-github)
61. [Task 61: SSH and .gitignore](module-09-git-github.md#task-61-ssh-and-gitignore)

### Module 10 — Docker
62. [Task 62: Install and Verify Docker](module-10-docker.md#task-62-install-and-verify-docker)
63. [Task 63: Run Your First Container](module-10-docker.md#task-63-run-your-first-container)
64. [Task 64: Inspect Containers and Images](module-10-docker.md#task-64-inspect-containers-and-images)
65. [Task 65: Build a Docker Image](module-10-docker.md#task-65-build-a-docker-image)
66. [Task 66: Persistent Volumes](module-10-docker.md#task-66-persistent-volumes)
67. [Task 67: Container Networking](module-10-docker.md#task-67-container-networking)
68. [Task 68: Environment Variables](module-10-docker.md#task-68-environment-variables)
69. [Task 69: Docker Compose](module-10-docker.md#task-69-docker-compose)
70. [Task 70: Container Troubleshooting](module-10-docker.md#task-70-container-troubleshooting)

### Module 11 — Azure
71. [Task 71: Azure Resource Basics](module-11-azure.md#task-71-azure-resource-basics)
72. [Task 72: Create an Ubuntu VM](module-11-azure.md#task-72-create-an-ubuntu-vm)
73. [Task 73: Secure Network Access](module-11-azure.md#task-73-secure-network-access)
74. [Task 74: Connect to the VM](module-11-azure.md#task-74-connect-to-the-vm)
75. [Task 75: Deploy an App to Azure](module-11-azure.md#task-75-deploy-an-app-to-azure)
76. [Task 76: Azure Monitoring and Cleanup](module-11-azure.md#task-76-azure-monitoring-and-cleanup)

### Module 12 — CI/CD and Advanced DevOps
77. [Task 77: Build a GitHub Actions Pipeline](module-12-cicd-advanced.md#task-77-build-a-github-actions-pipeline)
78. [Task 78: Build and Publish a Docker Image](module-12-cicd-advanced.md#task-78-build-and-publish-a-docker-image)
79. [Task 79: Automate Deployment](module-12-cicd-advanced.md#task-79-automate-deployment)
80. [Task 80: End-to-End Capstone](module-12-cicd-advanced.md#task-80-end-to-end-capstone)

---

## Overall Progress

- [ ] 1. Ubuntu Server Audit
- [ ] 2. Navigate the Filesystem
- [ ] 3. Create a Project Structure
- [ ] 4. Create and Read Files
- [ ] 5. Copy, Move, and Rename
- [ ] 6. Read Large Files
- [ ] 7. Find Files and Search Content
- [ ] 8. Pipes and Redirection
- [ ] 9. Inspect User Accounts
- [ ] 10. Create Practice Users
- [ ] 11. Create Groups
- [ ] 12. Add Users to Groups
- [ ] 13. Practice chmod
- [ ] 14. Practice chown and chgrp
- [ ] 15. Directory Permissions
- [ ] 16. sudo and Least Privilege
- [ ] 17. umask and ACL Basics
- [ ] 18. Permission Troubleshooting
- [ ] 19. Process Inspection
- [ ] 20. Background Jobs
- [ ] 21. Stop a Process Safely
- [ ] 22. Manage systemd Services
- [ ] 23. Enable a Service at Boot
- [ ] 24. Inspect Service Logs
- [ ] 25. Create a Custom Service
- [ ] 26. Service Failure Troubleshooting
- [ ] 27. Package Management
- [ ] 28. Install and Verify Nginx
- [ ] 29. Environment Variables
- [ ] 30. PATH and Shell Startup
- [ ] 31. IP and Hostname
- [ ] 32. Connectivity Checks
- [ ] 33. Inspect Listening Ports
- [ ] 34. SSH Access
- [ ] 35. Firewall Rules
- [ ] 36. Troubleshoot a Web Port
- [ ] 37. Disk Usage
- [ ] 38. Directory Size
- [ ] 39. Memory and CPU
- [ ] 40. Block Devices
- [ ] 41. Logs and Log Rotation
- [ ] 42. Health Check Report
- [ ] 43. First Bash Script
- [ ] 44. Variables and Arguments
- [ ] 45. Conditional Logic
- [ ] 46. Loops
- [ ] 47. Functions and Exit Codes
- [ ] 48. Error Handling and Logging
- [ ] 49. Schedule a Cron Job
- [ ] 50. Server Health Script
- [ ] 51. Application Directory Layout
- [ ] 52. Create a Sample App
- [ ] 53. Write a Deployment Script
- [ ] 54. Apply Least-Privilege Ownership
- [ ] 55. Create a systemd App Service
- [ ] 56. Verify and Roll Back
- [ ] 57. Initialize a Repository
- [ ] 58. Commit Changes
- [ ] 59. Branch and Merge
- [ ] 60. Connect GitHub
- [ ] 61. SSH and .gitignore
- [ ] 62. Install and Verify Docker
- [ ] 63. Run Your First Container
- [ ] 64. Inspect Containers and Images
- [ ] 65. Build a Docker Image
- [ ] 66. Persistent Volumes
- [ ] 67. Container Networking
- [ ] 68. Environment Variables
- [ ] 69. Docker Compose
- [ ] 70. Container Troubleshooting
- [ ] 71. Azure Resource Basics
- [ ] 72. Create an Ubuntu VM
- [ ] 73. Secure Network Access
- [ ] 74. Connect to the VM
- [ ] 75. Deploy an App to Azure
- [ ] 76. Azure Monitoring and Cleanup
- [ ] 77. Build a GitHub Actions Pipeline
- [ ] 78. Build and Publish a Docker Image
- [ ] 79. Automate Deployment
- [ ] 80. End-to-End Capstone

---

## Job-Ready Outcome

Is roadmap ke baad tum ye kar sakte ho:

- Ubuntu server audit, users/groups, permissions safely manage karna.
- Processes/services troubleshoot karna (systemd + journald).
- Networking, ports, SSH, firewall basics samajhna.
- Bash scripts + cron se automation likhna.
- Git/GitHub workflow aur Docker containers chalana.
- Azure VM deploy karna aur CI/CD pipeline se app ship karna.

Ye sab **evidence** ke saath karo — scripts, screenshots, CI runs, aur ek capstone repo. Wahi interview me "experience" banta hai.
