# Module 1 — Linux Basics and Filesystem

> **Hinglish:** Ye module Ubuntu server ke "basic sawaal" sikhata hai — main kaun hoon, kahan hoon, kya files hain, aur command output ko kaise filter karna hai. Sab kuch `~/devops-lab/` ke andar.

**Prerequisite:** Ubuntu terminal access, non-root user (`ubuntu` ya tumhara user).
**Setup:** `mkdir -p ~/devops-lab/{notes,scripts,logs,files,backups,git-lab,docker-app,docker-data}`

---

## Task 1: Ubuntu Server Audit

**Scenario:** Naya server mila hai. Production me kuch bhi install karne se pehle uski identity, OS version, uptime, aur tumhare access level pata karo.

**Command plan:**
```bash
whoami
id
hostnamectl
uname -a
cat /etc/os-release
uptime
groups
```

**Verification:**
- `whoami` tumhara username dikhaye.
- `id` me UID, GID aur groups hon.
- `/etc/os-release` me `Ubuntu` aur version (`22.04`/`24.04`) ho.
- `uptime` load average ke saath time bataye.

**Troubleshoot:** `hostnamectl` "System has not been booted with systemd" bole to tum WSL/container me ho — VM use karo ya `hostname` se kaam chalao.

---

## Task 2: Navigate the Filesystem

**Scenario:** Ek incident aaya hai; tumhe `/var/log`, `/etc`, aur project directory ke beech tezi se ghoomna hai. Absolute vs relative path clear hona chahiye.

**Command plan:**
```bash
pwd
ls -la /
cd /etc
pwd
ls -la | head
cd ~
pwd
cd /var/log
cd ..
pwd
cd -
pwd
```

**Verification:**
- `/etc` jaake `pwd` absolute path `/etc` dikhaye.
- `cd ~` ke baad `/home/<user>` aaye.
- `cd ..` se `/var/log` se `/var` me aao.
- `cd -` pichli directory pe wapas le jaye.

**Note:** Absolute path `/` se shuru hota hai; relative path current directory se. Linux case-sensitive hai — `Logs` ≠ `logs`.

---

## Task 3: Create a Project Structure

**Scenario:** Ek sample app ke liye clean directory tree banao: app code, config, logs, scripts, releases.

**Command plan:**
```bash
cd ~/devops-lab
mkdir -p app/{config,logs,scripts,releases}
mkdir -p releases/v1 releases/v2
find app -type d | sort
tree app 2>/dev/null || ls -R app
```

**Verification:**
- `app/config`, `app/logs`, `app/scripts`, `app/releases` exist karein.
- `find` output me 5+ directories dikhein.
- `mkdir -p` dobara chalao — error na aaye (idempotent).

**Troubleshoot:** `tree` command nahi mila to `sudo apt install tree` (optional) ya `ls -R` use karo.

---

## Task 4: Create and Read Files

**Scenario:** App ke liye ek config file, ek startup script, aur ek log file banao — phir unhe safely read karo.

**Command plan:**
```bash
cd ~/devops-lab/app
printf 'APP_ENV=staging\nPORT=8080\nLOG_LEVEL=info\n' > config/app.conf
cat > scripts/start.sh <<'EOF'
#!/usr/bin/env bash
echo "Starting sample app on port ${PORT:-8080}"
EOF
chmod +x scripts/start.sh
printf 'INFO app started\nWARN slow response\nERROR db timeout\n' > logs/app.log
cat config/app.conf
head -n 2 logs/app.log
./scripts/start.sh
```

**Verification:**
- `config/app.conf` me 3 lines hon.
- `logs/app.log` me INFO/WARN/ERROR lines hon.
- `start.sh` executable ho aur "Starting sample app" print kare.

**Troubleshoot:** `Permission denied` aaye to `chmod +x scripts/start.sh`. Heredoc me `'EOF'` quotes zaroori hain taaki `$PORT` turant expand na ho.

---

## Task 5: Copy, Move, and Rename

**Scenario:** Config change se pehle backup banao, aur release folder ko proper version naam do — bina original ko nuksan pahunchaye.

**Command plan:**
```bash
cd ~/devops-lab/app
cp config/app.conf config/app.conf.bak
cp -r releases/v1 releases/v1-copy
mv releases/v1-copy releases/v1.0.0
mv config/app.conf.bak "config/app.conf.$(date +%F).bak"
ls -l config releases
```

**Verification:**
- `config/` me original aur dated `.bak` dono hon.
- `releases/v1.0.0` exist kare, `v1-copy` na ho.
- Original `app.conf` content same rahe.

**Note:** `mv` same filesystem pe rename karta hai; different filesystem pe copy+delete. Backup ka naam date ke saath rakho to overwrite nahi hota.

---

## Task 6: Read Large Files

**Scenario:** 1 lakh line ka log file hai. Poora `cat` karke terminal hang mat karo — beginning, end, aur paged view use karo.

**Command plan:**
```bash
cd ~/devops-lab/logs
seq 1 100000 | sed 's/^/line /' > big.log
wc -l big.log
head -n 5 big.log
tail -n 5 big.log
sed -n '50000,50005p' big.log
less big.log
```

**Verification:**
- `wc -l` = `100000` dikhaye.
- `head` 1-5 lines, `tail` 99996-100000 lines dikhaye.
- `less` me `/ERROR` search karke `q` se exit karo.

**Note:** `less` ke andar: `Space` = next page, `b` = back, `/pattern` = search, `q` = quit. `cat` sirf chhoti files ke liye.

---

## Task 7: Find Files and Search Content

**Scenario:** 3 baje incident hai. Saare `.log` files dhoondho aur unme `ERROR` messages search karo — poore filesystem pe nahi, sirf lab folder me.

**Command plan:**
```bash
cd ~/devops-lab
find . -type f -name "*.log"
find . -type f -name "*.log" -exec grep -Hn "ERROR" {} \;
grep -RIn "ERROR" logs/
find . -type f -name "*.log" -size +1M
```

**Verification:**
- `find` sirf lab ke log files dikhaye.
- `grep -Hn` file name + line number ke saath ERROR lines dikhaye.
- `-size +1M` bade log file (`big.log` size ke hisaab se) dikhaye ya khaali ho.

**Troubleshoot:** Permission errors se bachne ke liye `find` ko `~/devops-lab` tak seemit rakho. Root se search karna `2>/dev/null` ke bina shor karega.

---

## Task 8: Pipes and Redirection

**Scenario:** Incident report ke liye log counts nikalo, output ko file me save karo, aur naya result append karo.

**Command plan:**
```bash
cd ~/devops-lab
grep -c "ERROR" logs/app.log
grep "ERROR" logs/app.log | wc -l
printf 'line1\nline2\nline3\n' > notes/count.txt
wc -l < notes/count.txt
grep "ERROR" logs/app.log | tee -a notes/count.txt
cat notes/count.txt
```

**Verification:**
- Dono counting commands same number dein.
- `notes/count.txt` me pehle 3 lines, phir ERROR line append ho.
- `tee` terminal pe bhi dikhaye aur file me bhi likhe.

**Note:** `>` overwrite karta hai, `>>` append. `2>` errors ke liye, `2>&1` errors ko stdout ke saath. `tee -a` = screen + append.

---

## Module 1 Done — Checklist

- [ ] Users, OS, uptime, groups inspect kar liye.
- [ ] Absolute/relative navigation clear hai.
- [ ] Project directory tree bana liya.
- [ ] Config/script/log files create aur read kiye.
- [ ] Backup + rename safely kiya.
- [ ] Large log ko head/tail/less se dekha.
- [ ] find + grep se search ki.
- [ ] Pipe, redirect, tee use kiya.

**Next:** [Module 2 — Users and Permissions](module-02-users-permissions.md)
