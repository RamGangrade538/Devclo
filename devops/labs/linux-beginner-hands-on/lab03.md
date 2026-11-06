# Lab 03: Creating & Viewing Files (`mkdir`, `touch`, `cat`, `less`, `head`, `tail -f`)

## Objective
Create files/directories and view file contents safely using common Linux viewing tools.

## Prerequisites
Completed Labs 01-02, working in `~/linux-labs/files/`

## Step-by-step commands
```bash
cd ~/linux-labs/files

# Create directories
mkdir -p projects/app1 logs

# Create empty files
touch readme.txt notes.md script.sh

# Create a file with content using echo (safe)
echo "Hello from Linux Lab" > hello.txt
echo -e "Line 1\nLine 2\nLine 3" > multiline.txt

# View entire file
cat hello.txt

# View with line numbers
cat -n multiline.txt

# Create a larger sample file for viewing practice
seq 1 50 > numbers.txt

# View first 10 lines
head -n 10 numbers.txt

# View last 10 lines
tail -n 10 numbers.txt

# View file page by page (press q to quit)
less numbers.txt
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `mkdir -p` | Create dirs (and parents). |
| `touch` | Empty file create karta hai ya existing file ka timestamp update karta hai. |
| `echo "..." > file` | Content likhkar file banata/overwrite karta hai (`>`). |
| `echo -e` | Escape sequences (`\n`) enable karta hai. |
| `cat` | Pura file dikhata hai (chote files ke liye best). |
| `cat -n` | Line numbers ke saath dikhaata hai. |
| `head -n N` | Pehle N lines dikhaata hai (default 10). |
| `tail -n N` | Aakhri N lines dikhaata hai (default 10). |
| `less` | Pager — scroll up/down, search, `q` se exit. `more` se better beginner-friendly. |
| `tail -f` | Live follow — naye lines aate hi dikhaata hai (logs dekhnge ke liye useful). |

### `tail -f` demo (safe)
Open two terminals OR run in background carefully:
```bash
# Terminal 1 style idea: in one terminal
echo "start" >> logs/app.log
tail -f logs/app.log
# In another terminal write: echo "new log line" >> logs/app.log and watch Terminal 1
```
Press `Ctrl+C` to stop `tail -f`.

## Expected output
`cat hello.txt` -> `Hello from Linux Lab`. `head/tail` show correct ranges. `less` opens interactive view.

## Verification & Troubleshooting
- **File exists?** `ls -l hello.txt`
- **Too long output:** Use `less`, `head`, `tail` instead of `cat` on large files.
- **Permission denied on write:** Check dir permissions (Lab 08).

## Real-world DevOps/Azure use case
View app logs (`/var/log/nginx/`, app logs), check config files, and tail deployment logs during releases.

## Practice tasks
1. Create `~/linux-labs/files/sample.txt` with 20 lines using `seq` or `for` loop idea: `for i in {1..20}; do echo "Log entry $i"; done > sample.txt`
2. Show lines 5-10 using `head -n 10 | tail -n 6` (pipe idea) or just practice `head/tail`.
3. Use `less` on `numbers.txt` and search with `/` then quit with `q`.

**Solutions:**
```bash
for i in {1..20}; do echo "Log entry $i"; done > sample.txt
head -n 10 sample.txt | tail -n 6
less numbers.txt
```
