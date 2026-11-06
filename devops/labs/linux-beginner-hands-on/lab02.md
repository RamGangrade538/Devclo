# Lab 02: Linux Filesystem, `pwd`, `ls`, `cd`

## Objective
Learn filesystem navigation — find where you are, list contents, and move between directories safely.

## Prerequisites
Completed Lab 01, in a terminal in your home directory.

## Step-by-step commands
```bash
# Go to safe lab root
cd ~/linux-labs

# Print working directory
pwd

# List contents (short)
ls

# Long listing with details
ls -l

# Show hidden files (. files)
ls -la

# Human readable sizes
ls -lh

# Change to filesystem practice dir
cd filesystem

# Go up one level
cd ..

# Go back to previous directory
cd -

# Go to home directory from anywhere
cd ~
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `pwd` | "Print Working Directory" — bataata hai kis directory me ho. |
| `ls` | List — directory contents dikhaata hai. |
| `ls -l` | Long format: permissions, owner, group, size, date, name. |
| `ls -a` | All files including hidden (`.bashrc`, `.profile`). |
| `ls -la` | `-l` + `-a` combined. |
| `ls -lh` | Human readable sizes (K, M, G). |
| `cd <dir>` | Change Directory. |
| `cd ..` | Parent directory (ek level upar). |
| `cd -` | Pichli directory me wapas jaata hai. |
| `cd ~` / `cd` | Home directory me chala jaata hai. |
| `.` and `..` | `.` current dir, `..` parent dir. |

## Expected output
`pwd` after `cd ~/linux-labs` should show `/home/ubuntu/linux-labs` (username may vary). `ls -l` shows type/permissions/owner/group/size/date/name.

## Verification & Troubleshooting
- **Verify:** `pwd` matches expected path.
- **`No such file or directory`:** Check spelling/case. Linux is case-sensitive.
- **Stuck:** Use `cd ~` to get back home.

## Real-world DevOps/Azure use case
When connecting to Azure VMs via SSH, you must know `pwd/cd/ls` to navigate logs (`/var/log/`), configs (`/etc/`), app paths, and deployment folders.

## Practice tasks
1. From `~`, go to `~/linux-labs/files`, print path, list with `-lh`.
2. Go up to `linux-labs`, go back to `files` using `cd -`.
3. List only directories in `~/linux-labs` (`ls -d */` hint or `ls -l | grep ^d`).

**Solutions:**
```bash
cd ~/linux-labs/files && pwd && ls -lh
cd ~/linux-labs && cd -
ls -d ~/linux-labs/*/
```
