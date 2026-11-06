# Appendix: Quick Reference, Safety, Troubleshooting

## Quick command cheat-sheet
| Task | Command |
|---|---|
| Where am I | `pwd` |
| List files | `ls -la` |
| Move | `cd <dir>` |
| Create file/dir | `touch`, `mkdir -p` |
| View | `cat`, `less`, `head`, `tail -f` |
| Copy/Move/Delete | `cp -r`, `mv`, `rm` (be careful) |
| Find/Search | `find . -name`, `grep -r` |
| Count/Filter | `wc`, `sort`, `uniq`, `cut` |
| Pipes/Redirection | `\|`, `>`, `>>` |
| Permissions | `chmod`, `chown` |
| Users/Sudo | `whoami`, `id`, `sudo -l` |

## Safety Rules (Must follow)
- **Practice only** in `~/linux-labs/`
- **Never** use `chmod 777` as a fix — use least privilege
- **Label sudo** — only when needed, know risks
- **No destructive** `rm -rf /`, `mv /*` etc
- **Double check paths** before `rm`, `cp`, `mv`
- **Use `-i`** when unsure deleting
- **Scripts executable** only for owner when not shared (`700`) or as appropriate
- **Logs matter** — write logs in deployments

## Troubleshooting common errors
| Error | Cause | Fix |
|---|---|---|
| `Permission denied` | Missing read/write/execute or need sudo | Check `ls -l`, fix perms minimally, or use `sudo` only if justified |
| `No such file or directory` | Wrong path/case | `pwd`, `ls`, fix path (Linux case-sensitive) |
| `command not found` | Not installed or wrong PATH | `command -v <cmd>`, check spelling |
| `cannot create directory` | Permissions | Use `~/` or fix dir perms |
| `Port already in use` | Another process using port | `ss -tlnp \| grep <port>`, stop old process |

## How to run all labs quickly
```bash
cd ~/linux-labs
# Follow in order: lab01 -> lab10
# Use README.md as guide
```

## Cleanup (optional)
If you want to reset practice space (safe):
```bash
# ONLY remove your lab folder
rm -rf ~/linux-labs
mkdir -p ~/linux-labs/{filesystem,files,search,users-perms,scripts,deployment,logs}
```

> Only run cleanup if you're sure you want to remove everything in `~/linux-labs/`

## Final checklist
- [ ] Can navigate with `pwd/cd/ls`
- [ ] Can create/view/copy/move/remove files safely
- [ ] Can find/filter with `find/grep/pipes/redirection`
- [ ] Understand `rwx` and octal permissions
- [ ] Know when to use `sudo` and risks
- [ ] Wrote and ran a deployment script with logs
- [ ] Did mini-project with symlink + service helper
