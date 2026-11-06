# Lab 04: Copy, Move, Rename & Remove (`cp`, `mv`, `rm`)

## Objective
Safely copy, move/rename, and remove files/directories with correct flags.

## Prerequisites
Files from Lab 03 exist in `~/linux-labs/files/`

## Step-by-step commands
```bash
cd ~/linux-labs/files

# Copy file
cp hello.txt hello-backup.txt

# Copy with verbose
cp -v multiline.txt multiline-copy.txt

# Copy directory recursively
cp -r projects projects-backup

# Move/rename file (mv)
mv notes.md projects/app1/notes.md  # move
mv hello-backup.txt hello-renamed.txt  # rename in same dir

# Move directory
# (ensure projects exists)

# Remove file (careful!)
rm hello-renamed.txt

# Remove with prompt (interactive)
# rm -i <file>  # asks confirmation

# Remove directory recursively (use with extreme caution)
# rm -r <dir>   # only remove what YOU created
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `cp source dest` | Copy file. |
| `cp -v` | Verbose — kya copy hua dikhaata hai. |
| `cp -r` | Recursive — directory aur uske andar sab copy karta hai. |
| `cp -p` | Preserve permissions/timestamps (useful in some cases). |
| `mv source dest` | Move ya rename karta hai (same filesystem pe). |
| `rm file` | File delete karta hai. **Permanently gone** (trash nahi usually). |
| `rm -i` | Interactive — pehle puchta hai confirm karne ko. |
| `rm -r` | Recursive delete for directories. |
| `rmdir` | Sirf empty directory remove karta hai (safer). |

> **WARNING:** `rm -rf` blindly use mat karo. Kabhi bhi `rm -rf /` jesa command nahi chalana. Hamesha path double check karo.

## Expected output
Copies created, `mv` moves/renames, `rm` removes only targeted files you created.

## Verification & Troubleshooting
- **Verify copy:** `diff hello.txt hello-backup.txt` or compare `ls -l`
- **Wrong move:** Use `mv` back or copy again
- **Accidental delete:** Usually unrecoverable from shell — prevention is key (use `-i` or `ls` before `rm`)

## Real-world DevOps/Azure use case
Backup configs before changes, move artifacts to release folders, clean build dirs in scripts (only known safe paths).

## Practice tasks
1. Copy `numbers.txt` to `numbers-backup.txt` with verbose.
2. Rename `script.sh` to `deploy.sh` using `mv`.
3. Create `temp/` with a file, remove file with `rm -i`, remove empty dir with `rmdir` or safe approach.

**Solutions:**
```bash
cp -v numbers.txt numbers-backup.txt
mv script.sh deploy.sh
mkdir -p temp && touch temp/x.txt && rm -i temp/x.txt && rmdir temp
```
