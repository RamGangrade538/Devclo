# Module 4 — Packages and Environment

> **Hinglish:** Ubuntu me software `apt` se aata hai. Environment variables aur `PATH` batate hain ki program kaise behave kare aur command kahan se mile. Ye module chhota hai, par har deployment me kaam aata hai.

**Prerequisite:** Ubuntu + `sudo`. Internet access for package install.
**Safety:** `apt upgrade` se pehle lab VM snapshot lo. Production me blind upgrade mat karo.

---

## Task 27: Package Management

**Scenario:** Naye server ki package state check karo — indexes fresh hain? Nginx installed hai? Kaunsa version available hai?

**Command plan:**
```bash
sudo apt update
apt list --installed 2>/dev/null | head -n 15
apt policy nginx
dpkg -l | grep -E '^ii' | wc -l
```

**Verification:**
- `apt update` bina error ke package indexes refresh kare.
- `apt policy nginx` installed/candidate version dikhaye (installed ho to `Installed:` line).
- `dpkg -l` ke `ii` lines installed packages count karein.

**Note:** `apt update` = index refresh. `apt upgrade` = installed packages update. Dono alag hain. `apt install` se pehle `apt policy` se version/source dekho.

---

## Task 28: Install and Verify Nginx

**Scenario:** Ek web server install karo aur verify karo ki service chal rahi hai aur HTTP response de rahi hai.

**Command plan:**
```bash
sudo apt install -y nginx
systemctl status nginx --no-pager
systemctl is-enabled nginx
curl -I http://localhost
ss -tlnp | grep ':80'
```

**Verification:**
- `nginx` service `active (running)` ho.
- `curl -I` me `HTTP/1.1 200 OK` ya `301` aaye.
- `ss` output me port `80` pe `nginx` listen kar raha ho.

**Troubleshoot:** Port 80 busy ho to `sudo ss -tlnp | grep ':80'` se process dhundo. `curl: connection refused` aaye to `journalctl -u nginx -n 30`.

**Note:** Lab VM me nginx install karna safe hai. Production me config change se pehle `nginx -t` se syntax test karo.

---

## Task 29: Environment Variables

**Scenario:** App ko batana hai ki wo `staging` environment me chal rahi hai — bina config file badle. Temporary variable set karo, read karo, phir remove karo.

**Command plan:**
```bash
export APP_ENV=staging
export APP_PORT=8080
printenv APP_ENV APP_PORT
echo "App running in $APP_ENV on port $APP_PORT"
env | grep '^APP_'
unset APP_ENV
printenv APP_ENV || echo "APP_ENV removed"
```

**Verification:**
- `printenv` values dikhaye.
- `env | grep '^APP_'` sirf set variables dikhaye.
- `unset` ke baad `printenv APP_ENV` non-zero exit + "APP_ENV removed".

**Note:** `export` sirf current shell aur uske child processes me chalta hai. Naya terminal = variable gone. Permanent ke liye `~/.bashrc` ya systemd `Environment=` use karo, par secrets ko shell history/config me mat likho.

---

## Task 30: PATH and Shell Startup

**Scenario:** `kubectl: command not found` aata hai lekin binary installed hai. `PATH` aur shell startup files samjho — command kahan search hota hai.

**Command plan:**
```bash
echo "$PATH"
which bash
which nginx
command -v curl
ls -la ~/.bashrc ~/.profile ~/.bash_profile 2>/dev/null
grep -n 'PATH' ~/.bashrc ~/.profile 2>/dev/null
bash -lc 'echo "$PATH"'
```

**Verification:**
- `PATH` me `:` se separated directories hon (`/usr/local/bin:/usr/bin:/bin`).
- `which bash`/`command -v curl` executable path dikhaye.
- `~/.bashrc`/`~/.profile` me PATH-related lines (ho sakti hain).
- Login shell (`bash -lc`) ka PATH interactive shell se alag ho sakta hai.

**Note:** `~/.bashrc` interactive non-login shells ke liye, `~/.profile` login shells ke liye. Script me `#!/usr/bin/env bash` use karo. Naya PATH add karne ke liye purana `$PATH` include karna mat bhoolo: `export PATH="$HOME/bin:$PATH"`. Change ke baad `source ~/.bashrc`.

---

## Module 4 Done — Checklist

- [ ] `apt update` aur package versions inspect kiye.
- [ ] Nginx install karke service + HTTP verify kiya.
- [ ] Temporary env variable set/read/unset kiya.
- [ ] `PATH` aur shell startup files samjhe.

**Next:** [Module 5 — Networking](module-05-networking.md)
