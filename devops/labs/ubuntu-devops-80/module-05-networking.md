# Module 5 — Networking

> **Hinglish:** "App down hai" ka matlab aksar network path ka koi step toota hota hai — DNS, route, port, firewall, ya service. Is module me IP/route, DNS, listening ports, SSH, aur UFW inspect karna seekhoge.

**Prerequisite:** Ubuntu VM. `sudo` for `ss`/UFW/sshd details.
**Safety:** Remote server pe UFW rules change karne se SSH lock ho sakta hai. Is lab me sirf **inspect** karo; change tabhi jab console access ho.

---

## Task 31: IP and Hostname

**Scenario:** Server ka network identity pata karo — IP, default gateway, hostname. Ye har connectivity debug ka pehla step hai.

**Command plan:**
```bash
hostname
hostnamectl
hostname -I
ip -brief addr
ip route
ip -4 addr show scope global
```

**Verification:**
- `hostname` machine ka naam dikhaye.
- `hostname -I` ek ya zyada IPv4 addresses de.
- `ip route` me `default via <gateway>` line ho.
- `ip -brief addr` me interface (eth0/ens33) + state + IP ho.

**Note:** `lo` = loopback (`127.0.0.1`). `eth0`/`ens*` = real interface. Default route = internet/other networks ka raasta.

---

## Task 32: Connectivity Checks

**Scenario:** User bol raha hai "website nahi khul rahi". Pehle DNS resolve hota hai ya nahi, phir HTTP reachable hai ya nahi — layer by layer check karo.

**Command plan:**
```bash
getent hosts example.com
getent hosts google.com
ping -c 3 1.1.1.1
ping -c 3 example.com
curl -I --max-time 10 https://example.com
curl -sS -o /dev/null -w 'http_code=%{http_code} time=%{time_total}s\n' https://example.com
```

**Verification:**
- `getent hosts` domain ka IP dikhaye (DNS working).
- `ping 1.1.1.1` reply de (raw connectivity).
- `ping example.com` reply de (DNS + connectivity).
- `curl -I` me `HTTP/2 200` ya `301` aaye.
- `curl -w` `http_code=200` (ya similar) print kare.

**Troubleshoot:** `ping 1.1.1.1` fail = network/route issue. IP ping chale par domain nahi = DNS issue (`/etc/resolv.conf`, resolver). Ping chale par curl fail = proxy/TLS/firewall/HTTP issue.

**Note:** Kuch networks ICMP ping block karte hain — ping fail hone ka matlab hamesha "down" nahi hota. `curl`/`nc` se port-level check karo.

---

## Task 33: Inspect Listening Ports

**Scenario:** Kaun-kaun services kaunse port pe sun rahi hain? Port 8080 pe already koi hai kya? Deploy se pehle check karo.

**Command plan:**
```bash
ss -tuln
sudo ss -tulpn
ss -tlnp | grep ':80'
ss -tlnp | grep ':22'
```

**Verification:**
- `ss -tuln` TCP/UDP listening sockets dikhaye.
- `sudo ss -tulpn` me process name/PID bhi dikhe.
- Port 22 pe `sshd`, port 80 pe `nginx` (agar installed) dikhe.

**Note:** `-t` TCP, `-u` UDP, `-l` listening, `-p` process, `-n` numeric ports. `0.0.0.0:80` = all interfaces; `127.0.0.1:80` = localhost only.

---

## Task 34: SSH Access

**Scenario:** Password ki jagah SSH key se login setup karna hai. Pehle SSH service config inspect karo, phir key-based auth samjho.

**Command plan:**
```bash
systemctl status ssh --no-pager
sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|pubkeyauthentication'
ls -la ~/.ssh
ssh-keygen -t ed25519 -C "devclo-lab" -f ~/.ssh/devclo_lab
cat ~/.ssh/devclo_lab.pub
ssh-copy-id -i ~/.ssh/devclo_lab.pub "$USER"@localhost
ssh -i ~/.ssh/devclo_lab "$USER"@localhost 'hostname; whoami'
```

**Verification:**
- `sshd -T` me `pubkeyauthentication yes` dikhe.
- `~/.ssh/devclo_lab` (private) aur `.pub` (public) files ban jayein.
- `ssh-copy-id` ke baad `~/.ssh/authorized_keys` me public key line ho.
- `ssh -i ...` bina password ke login kare.

**Note:** Private key (`devclo_lab`) kabhi share/commit na karo; sirf `.pub` server pe jaati hai. Production me `PermitRootLogin no` aur `PasswordAuthentication no` recommended hai (pehle key login test karo, warna lockout).

---

## Task 35: Firewall Rules

**Scenario:** Server pe UFW enabled hai. Deploy se pehle existing inbound rules inspect karo — bina change kiye, taaki SSH na toote.

**Command plan:**
```bash
sudo ufw status
sudo ufw status verbose
sudo ufw show added
sudo ufw app list
sudo ufw allow 80/tcp
sudo ufw status numbered
```

**Verification:**
- `ufw status` `active`/`inactive` bataye.
- `show added` me rules list ho.
- `allow 80/tcp` ke baad numbered list me port 80 rule dikhe.
- SSH port 22 ka rule pehle se ho (warna remote access risk).

**Important:** `ufw enable` remote SSH pe bina `allow 22/tcp` ke mat karo. Is lab me enable ki zaroorat nahi. Rule delete: `sudo ufw delete <number>` (number `status numbered` se).

---

## Task 36: Troubleshoot a Web Port

**Scenario:** Nginx install hai par `http://<server>:80` nahi khul raha. Service, listen port, local HTTP, config, aur firewall — step by step check karo.

**Command plan:**
```bash
systemctl is-active nginx
ss -tlnp | grep ':80'
curl -I --max-time 5 http://localhost
sudo nginx -t
sudo journalctl -u nginx -n 30 --no-pager
sudo ufw status | grep -E '80|Status'
```

**Verification:**
- `systemctl is-active nginx` = `active`.
- `ss` me nginx port 80 pe listen kare.
- `curl -I localhost` = `200`/`301`.
- `nginx -t` = syntax ok.
- Journal me fatal error na ho.
- UFW port 80 allow kare (agar active hai).

**Diagnosis order:** service active? → port listening? → localhost HTTP? → config valid? → firewall? → external network/NSG? Har step ka result note karo; jo pehla fail ho, wahi asli issue hai.

---

## Module 5 Done — Checklist

- [ ] IP, hostname, route inspect kiye.
- [ ] DNS + HTTP connectivity layer-by-layer check ki.
- [ ] Listening ports aur owning process dekhe.
- [ ] SSH config + key-based auth setup kiya.
- [ ] UFW rules inspect kiye.
- [ ] Web port ko systematic order me debug kiya.

**Next:** [Module 6 — Storage and Monitoring](module-06-storage-monitoring.md)
