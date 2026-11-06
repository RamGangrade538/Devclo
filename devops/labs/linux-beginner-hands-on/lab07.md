# Lab 07: Users, Groups & `sudo`

## Objective
Understand users/groups, how to check identity, and safe use of `sudo`.

## Prerequisites
Ubuntu Linux, normal user account. **Do NOT** create/delete real system users on shared prod-like systems unless instructed. Practice conceptually + safe checks.

## Safety note
Commands like `useradd`, `usermod`, `groupadd` may need `sudo`. Creating users is usually restricted. Focus on **viewing/understanding**. Only run user-management with permission.

## Step-by-step commands
```bash
# Who am I?
whoami
id

# Current user details
id $USER

# List logged in users
who
w

# Check groups
groups
groups $USER

# View users/groups files (read-only)
cat /etc/passwd | head -5
cat /etc/group | head -5

# Check sudo access
sudo -l 2>&1 | head -15
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `whoami` | Current username dikhaata hai. |
| `id` | UID, GID aur groups dikhaata hai. |
| `who/w` | Kaun login hai aur kya kar raha hai. |
| `groups` | User kis kis group ka member hai. |
| `/etc/passwd` | User account info (readable). Password hashes usually in `/etc/shadow` (restricted). |
| `/etc/group` | Group definitions. |
| `sudo` | "SuperUser DO" — root privileges ke saath command chalata hai (with rules). |
| `sudo -l` | List what current user can run with sudo. |

## Understanding `sudo` safely
- `sudo` logs activity
- Use only when necessary
- Never share `sudo` password
- On company/learning labs ask before modifying users
- **NEVER** run random internet scripts with `sudo` blindly

## Expected output
`whoami` shows your user. `id` shows numeric IDs and groups. `sudo -l` shows allowed commands or "may run the following commands" or requires password depending on config.

## Verification & Troubleshooting
- **`user is not in the sudoers file`** — normal on some restricted accounts
- **Want to understand:** Read output, don't force

## Real-world DevOps/Azure use case
On Azure Linux VMs, you use `sudo` for installing packages, editing nginx configs, restarting services with `systemctl`. Access controlled via groups/sudoers for least privilege.

## Practice tasks
1. Run `whoami`, `id`, `groups` and note outputs.
2. Check `sudo -l` and understand if you have any sudo rights.
3. Read first 3 lines of `/etc/passwd` and `/etc/group`.

**Solutions:**
```bash
whoami; id; groups
sudo -l | head -10
head -3 /etc/passwd; echo "---"; head -3 /etc/group
```
