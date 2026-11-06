# Module 3 — Processes and Services

> **Hinglish:** Process = abhi chal raha program. Service = systemd ke through manage hone wala long-running process. Is module me process dhoondhna, safely band karna, service enable/disable karna, aur failure debug karna seekhoge.

**Prerequisite:** Ubuntu with systemd (VM/WSL2 with systemd). `sudo` access.
**Safety:** `kill -9` last resort hai. Pehle `SIGTERM` (`kill`) do. Unknown service ko disable mat karo.

**Setup:** `mkdir -p ~/devops-lab/{notes,scripts,logs}`

---

## Task 19: Process Inspection

**Scenario:** Server slow hai. Kaun process CPU/RAM kha raha hai? Process ID (PID) aur command ke saath list nikalo.

**Command plan:**
```bash
ps aux --sort=-%cpu | head -n 10
ps aux --sort=-%mem | head -n 10
pgrep -a sleep
top -bn1 | head -n 15
```

**Verification:**
- `ps aux` me `USER`, `PID`, `%CPU`, `%MEM`, `COMMAND` columns hon.
- Top CPU/RAM processes sorted hon.
- `pgrep -a` matching process ka PID + command dikhaye (abhi khaali ho sakta hai).

**Note:** `ps` = snapshot, `top` = live. `pgrep name` PID deta hai, `pgrep -a` command bhi.

---

## Task 20: Background Jobs

**Scenario:** Ek harmless long-running process background me chalao aur uska PID save karo — taaki baad me safely band kar sako.

**Command plan:**
```bash
cd ~/devops-lab
sleep 300 &
echo $! > notes/sleep.pid
jobs -l
cat notes/sleep.pid
ps -p "$(cat notes/sleep.pid)" -o pid,ppid,stat,cmd
```

**Verification:**
- `jobs -l` me `sleep 300` running job dikhe.
- `notes/sleep.pid` me numeric PID ho.
- `ps -p` same PID ke saath `sleep 300` dikhaye.

**Note:** `&` process ko background bhejta hai. `$!` last background process ka PID deta hai. Terminal band karne pe process `SIGHUP` se mar sakta hai — long-term ke liye `nohup`/systemd use karo.

---

## Task 21: Stop a Process Safely

**Scenario:** Task 20 ka test process ab band karna hai. Pehle polite signal (`SIGTERM`), phir verify; `kill -9` sirf tab jab `-TERM` kaam na kare.

**Command plan:**
```bash
TEST_PID=$(cat ~/devops-lab/notes/sleep.pid)
ps -p "$TEST_PID" -o pid,stat,cmd
kill -TERM "$TEST_PID"
sleep 1
ps -p "$TEST_PID" -o pid,stat,cmd || echo "Process stopped cleanly"
```

**Verification:**
- Pehle process running dikhe.
- `kill -TERM` ke baad `ps` khaali ho ya "Process stopped cleanly" aaye.
- `kill` ne PID reuse pe galat process ko na mara ho — command name match karo.

**Note:** `SIGTERM` (15) = graceful shutdown ka request. `SIGKILL` (9) = immediate, cleanup ka mauka nahi. `killall sleep` mat use karo — doosre users ke process bhi mar sakte hain.

---

## Task 22: Manage systemd Services

**Scenario:** SSH service ka health check karo — chal rahi hai ya nahi, aur uski details kya hain.

**Command plan:**
```bash
systemctl status ssh --no-pager
systemctl is-active ssh
systemctl is-enabled ssh
systemctl list-units --type=service --state=running | head
```

**Verification:**
- `status` me `Active: active (running)` dikhe (ya installed na ho to "could not be found").
- `is-active` = `active`.
- `is-enabled` = `enabled`/`disabled`.

**Troubleshoot:** `Unit ssh.service could not be found` aaye to OpenSSH server installed nahi: `sudo apt update && sudo apt install -y openssh-server`, phir dobara check karo.

---

## Task 23: Enable a Service at Boot

**Scenario:** SSH reboot ke baad bhi chalti rahe. Check karo ki service boot pe enabled hai; agar nahi to enable karo — par pehle samjho kya change ho raha hai.

**Command plan:**
```bash
systemctl is-enabled ssh
sudo systemctl enable ssh
systemctl is-enabled ssh
systemctl list-unit-files | grep '^ssh'
```

**Verification:**
- `is-enabled` pehle `disabled` ho to enable ke baad `enabled`.
- `list-unit-files` me `ssh.service enabled` dikhe.
- `systemctl status ssh` abhi bhi active rahe (enable se service start nahi hoti, boot pe hoti hai).

**Note:** `enable --now` = enable + start. Sirf `start` = abhi ke liye, boot pe nahi. Disable karna ho: `sudo systemctl disable ssh` (remote access band na karo).

---

## Task 24: Inspect Service Logs

**Scenario:** SSH me login issue aaya. Service ke recent logs aur errors journal se nikalo.

**Command plan:**
```bash
sudo journalctl -u ssh -n 20 --no-pager
sudo journalctl -u ssh --since "1 hour ago" --no-pager
sudo journalctl -u ssh -p err --no-pager
sudo journalctl -u ssh -f
```

**Verification:**
- `-n 20` last 20 lines dikhaye.
- `--since` time filter kare.
- `-p err` sirf error priority lines dikhaye.
- `-f` live follow kare (`Ctrl+C` se exit).

**Note:** `journalctl -u <unit>` service-specific logs. `-b` current boot, `--since today`, `-p warning` useful filters hain.

---

## Task 25: Create a Custom Service

**Scenario:** Ek harmless lab script ko systemd service banao jo boot pe chale aur `journalctl` me log de. Ye production deployment ka core pattern hai.

**Command plan:**
```bash
sudo tee /usr/local/bin/devclo-hello.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
while true; do
  echo "devclo-hello: alive at $(date -Is)"
  sleep 30
done
EOF
sudo chmod 755 /usr/local/bin/devclo-hello.sh

sudo tee /etc/systemd/system/devclo-hello.service >/dev/null <<'EOF'
[Unit]
Description=DevClo Hello Lab Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/devclo-hello.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now devclo-hello
systemctl status devclo-hello --no-pager
sudo journalctl -u devclo-hello -n 10 --no-pager
```

**Verification:**
- `status` me `active (running)` aur `Enabled: yes`.
- Journal me "devclo-hello: alive at ..." line ho.
- `systemctl restart devclo-hello` ke baad naya timestamp aaye.

**Note:** Unit file `/etc/systemd/system/` me jaati hai, `daemon-reload` zaroori hai. `Restart=on-failure` crash pe auto-restart deta hai. Service ko log file ki zaroorat nahi — stdout journal me jata hai.

---

## Task 26: Service Failure Troubleshooting

**Scenario:** Ek service start nahi ho rahi. Guess mat karo — status, exit code, aur journal se exact reason nikalo.

**Command plan:**
```bash
sudo tee /etc/systemd/system/devclo-broken.service >/dev/null <<'EOF'
[Unit]
Description=DevClo Broken Lab Service

[Service]
Type=simple
ExecStart=/usr/local/bin/this-script-does-not-exist.sh

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl start devclo-broken; echo "start_exit=$?"
systemctl status devclo-broken --no-pager
sudo journalctl -u devclo-broken -n 20 --no-pager
systemctl show devclo-broken -p ExecMainStatus -p ActiveState -p Result
```
**Cleanup (optional, evidence lene ke baad):**
```bash
sudo systemctl disable --now devclo-broken 2>/dev/null || true
sudo rm /etc/systemd/system/devclo-broken.service
sudo systemctl daemon-reload
```

**Verification:**
- `start_exit` non-zero ho.
- `status` me `failed` aur exit code dikhe.
- Journal me "No such file or directory" jaisa clear reason ho.
- `Result=exit-code` / `ExecMainStatus=203` (ya similar) dikhe.

**Debug checklist:**
1. `systemctl status` — failed state + exit code.
2. `journalctl -u <unit> -xeu <unit>` — detailed explanation.
3. `ExecStart` path executable hai? (`ls -l`, `test -x`)
4. User/permissions sahi hain? Unit me `User=` check karo.
5. `daemon-reload` kiya? Unit syntax valid hai? (`systemd-analyze verify <unit>`)

---

## Module 3 Done — Checklist

- [ ] Processes PID/CPU/RAM ke saath inspect kiye.
- [ ] Background job + `$!` PID use kiya.
- [ ] `SIGTERM` se process safely band kiya.
- [ ] systemd service status/active/enabled check kiya.
- [ ] Service boot pe enable ki.
- [ ] `journalctl` se logs filter kiye.
- [ ] Custom service unit banaya.
- [ ] Failed service ka root cause nikala.

**Next:** [Module 4 — Packages and Environment](module-04-packages-environment.md)
