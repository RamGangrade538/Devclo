# Lab 05: Search & Filter (`find`, `grep`, `pipes`, `redirection`)

## Objective
Find files and search inside files. Master pipes `|` and redirection `>`, `>>`, `<`.

## Prerequisites
Files from previous labs in `~/linux-labs/`

## Step-by-step commands
```bash
cd ~/linux-labs

# find files by name
find . -name "hello.txt"

# find all .txt files
find . -type f -name "*.txt"

# find directories
find . -type d

# grep for pattern in file
grep "Hello" files/hello.txt

# case-insensitive
grep -i "hello" files/hello.txt

# line numbers
grep -n "Line" files/multiline.txt

# recursive grep
grep -r "Log" .

# Pipes: combine commands
ls -l files/ | grep ".txt"

# count matches
grep -r "entry" files/ | wc -l

# Redirection
# > overwrite
echo "New content" > files/overwrite.txt
cat files/overwrite.txt

# >> append
echo "Appended line" >> files/overwrite.txt
cat files/overwrite.txt

# Redirect command output
ls -lh files/ > files/listing.txt
cat files/listing.txt
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `find` | Files/directories dhundhne ke liye powerful tool. |
| `find . -name` | Current dir `.` se naam se dhundo. |
| `find . -type f` | Sirf files dhundo, `-type d` sirf dirs. |
| `grep "pattern" file` | File ke andar pattern dhundhta hai. |
| `grep -i` | Case-insensitive search. |
| `grep -n` | Line number dikhata hai. |
| `grep -r` | Recursive search (sab subdirs me). |
| `grep -v` | Invert match (pattern ko chhod ke sab dikhao). |
| `\|` (pipe) | Pehle command ka output doosre command ko input deta hai. |
| `>` | Output overwrite karta hai (file create/update). |
| `>>` | Output append karta hai (existing me jodta hai). |
| `<` | Input as file (less common but good to know). |

## Expected output
`find` returns paths, `grep` returns matching lines, pipes filter results, redirection creates files.

## Verification & Troubleshooting
- **No matches:** Check case/spaces or use `-i`.
- **Too much output:** Pipe to `head` or use `less`.
- **Overwrite accident:** Avoid `>` on important files — use `>>` or copy first.

## Real-world DevOps/Azure use case
Debug by grepping logs for errors, find config files, build reports by piping commands in deployment scripts.

## Practice tasks
1. Find all `.sh` files under `~/linux-labs`
2. Find lines containing `error`/`Error` in all files under `~/linux-labs` (use `grep -ri`)
3. Save list of all `.txt` files to `~/linux-labs/search/txt-list.txt`

**Solutions:**
```bash
find ~/linux-labs -type f -name "*.sh"
grep -ri "error" ~/linux-labs 2>/dev/null
find ~/linux-labs -type f -name "*.txt" > ~/linux-labs/search/txt-list.txt
cat ~/linux-labs/search/txt-list.txt
```
