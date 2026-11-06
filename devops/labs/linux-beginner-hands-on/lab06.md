# Lab 06: Text Counting & Processing (`wc`, combining tools)

## Objective
Count lines/words/characters and combine simple tools for quick analysis.

## Prerequisites
Files from Lab 05

## Step-by-step commands
```bash
cd ~/linux-labs/files

# word count
wc numbers.txt

# lines only
wc -l numbers.txt

# words only
wc -w numbers.txt

# characters/bytes
wc -c numbers.txt

# combine with pipes
cat multiline.txt | wc -l
grep "Line" multiline.txt | wc -l
ls -1 | wc -l

# sort and unique
echo -e "apple\nbanana\napple\norange" > fruits.txt
sort fruits.txt
sort fruits.txt | uniq
sort fruits.txt | uniq -c

# cut examples
echo "user:devops:1000" > users.csv-like.txt
cut -d: -f1 users.csv-like.txt
cut -d: -f1,3 users.csv-like.txt
```

## Command explanations (Hinglish)
| Command/Flag | Explanation |
|---|---|
| `wc` | Word count — lines, words, bytes/characters. |
| `wc -l` | Sirf number of lines. |
| `wc -w` | Sirf words. |
| `wc -c` | Bytes count. |
| `sort` | Lines sort karta hai (alphabetical/numeric). |
| `uniq` | Duplicate consecutive lines remove karta hai (usually after sort). |
| `uniq -c` | Har unique line ke count ke saath dikhaata hai. |
| `cut -d: -f1` | Delimiter `:` par cut karke field 1 leta hai. |

## Expected output
`wc` shows 3 numbers (lines words bytes) by default. `sort | uniq` gives distinct list.

## Verification & Troubleshooting
- **uniq doesn't remove non-consecutive:** Always `sort` first.
- **cut delimiter:** Use correct `-d` for space/comma/colon.

## Real-world DevOps/Azure use case
Count log lines, unique IPs from access logs, extract usernames from files in reports/scripts.

## Practice tasks
1. Count how many `.txt` files in `~/linux-labs/files/` using `ls -1 | wc -l` (adjust)
2. Get unique sorted list of lines from `fruits.txt`
3. Extract first field from `users.csv-like.txt`

**Solutions:**
```bash
ls -1 ~/linux-labs/files/*.txt | wc -l
sort fruits.txt | uniq
cut -d: -f1 users.csv-like.txt
```
