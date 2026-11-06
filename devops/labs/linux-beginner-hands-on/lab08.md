# Lab 08: Permissions Deep Dive (`chmod`, `chown`, `rwx`, octal)

## Objective
Master Linux file permissions — read/write/execute, symbolic vs octal, and safe ownership changes.

## Prerequisites
Work in `~/linux-labs/users-perms/`

## Golden rule
**NEVER use `chmod 777` as a fix.** Find correct minimal permissions.

## Step-by-step commands
```bash
cd ~/linux-labs/users-perms

# Create test files/dirs
touch app.log script.sh private.txt
mkdir webdir
ls -l

# Understand rwx
# r = read (4), w = write (2), x = execute (1)
# User Group Other

# Make script executable (symbolic)
chmod u+x script.sh
ls -l script.sh

# Remove execute for group/others
chmod go-x script.sh
ls -l script.sh

# Set exact permissions with octal
# 644 = rw-r--r-- (common for files)
chmod 644 app.log
ls -l app.log

# 755 = rwxr-xr-x (common for dirs/scripts if needed)
chmod 755 webdir
ls -l webdir

# 600 = rw------- (private)
chmod 600 private.txt
ls -l private.txt
```

## Permission breakdown
| Octal | Symbolic | Use case |
|---|---|---|
| `644` | `rw-r--r--` | Regular files (readable by all, writable by owner) |
| `600` | `rw-------` | Private files (only owner) |
| `755` | `rwxr-xr-x` | Directories/executables (traverse/execute for others) |
| `700` | `rwx------` | Very private dir/script |
| `640` | `rw-r-----` | Group readable, others none |

## `chown` basics (understand, be careful)
```bash
# Check ownership
ls -l private.txt

# Change owner/group ONLY if you have rights / know what you're doing
# chown user:group file  (needs sudo usually)
# Example (concept): sudo chown ubuntu:ubuntu private.txt
```
> **Label:** `chown` often needs `sudo`. Changing ownership incorrectly can break access. Only do in your own lab files with permission.

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `chmod` | Change mode/permissions. |
| `u/g/o/a` | user/owner, group, others, all. |
| `+ - =` | add/remove/set permissions. |
| `rwx` | read/write/execute. For directory, `x` = enter/traverse. |
| `chown user:group file` | Change owner and/or group. Often needs `sudo`. |
| `octal` | Numeric way (4+2+1). Faster and common. |

## Verification & Troubleshooting
- **Can't execute script:** Add `u+x` with `chmod u+x script.sh`
- **"Permission denied" reading file:** Check permissions with `ls -l` and fix minimally
- **Don't guess with 777:** Too open (security risk). Use least privilege.

## Real-world DevOps/Azure use case
Set correct permissions for SSH keys (`600`), web files (`644`), scripts (`700/755`), app logs dirs. Wrong perms cause "Permission denied" in deployments.

## Practice tasks
1. Create `secret.key`, set to `600`, verify with `ls -l`
2. Create `runme.sh`, make executable for owner only `700`
3. Create `public.html`, set to `644`
4. Explain why `777` is bad (write answer in a note file)

**Solutions:**
```bash
touch secret.key runme.sh public.html
chmod 600 secret.key
chmod 700 runme.sh
chmod 644 public.html
ls -l secret.key runme.sh public.html
echo "chmod 777 gives read/write/execute to everyone - major security risk" > permissions-note.txt
cat permissions-note.txt
```
