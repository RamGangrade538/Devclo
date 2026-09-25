# Day 0: Setup & Prerequisites — Tools Install, Flow & Debugging

> **Ye day sabse pehle karo.** Agar tools install na ho, koi bhi lab work nahi karega. Is day ka goal = ek aisi machine jisme har tool install ho aur `--version` run karte hi sab sahi output de.

## Overview | Parichay

Is day me hum wo sab install karenge jo aane wale 30 din chahiye. Linux (Ubuntu) pe chalegayenge — agar aap Windows/Mac pe ho to WSL2 (Windows Subsystem for Linux) use karo, ya VM banao. Har tool ke saath: **kya hai, kyun chahiye, install kaise karein, test kaise karein, aur error aaye to fix kaise karein.**

### Ye day sabse important kyun hai

Aaj ke baad har din tool **use** karoge, install nahi. Agar Docker aaj sahi set na hua, to Day 15-17 ke labs me har command pe error aayega — aur aap sochoge "aaj ka din galat chal raha hai", jabki asli problem Day 0 ka adhura setup hai. Isliye Day 0 ka motto hai: **"pehle verify karo, phir aage badho."** Har tool install karke uska `--version` chalao, output dekh ke tick karo, phir agli tool pe jao. Shortcut mat lete — beta beta check karne se hi machine "dev-ready" banega.

### WSL2 vs VM vs Native Linux — kaunsa chuno

| Option | Kya hai | Kab choose karo |
|--------|---------|-----------------|
| **Native Linux** (dedicated/dual boot) | Real Linux, full speed, pure Linux | Sirf Linux pe kaam karte ho |
| **WSL2** | Windows ke andar **asli Linux kernel** | Windows use karte ho, fast setup chahiye |
| **VM** (VirtualBox/VMware) | Windows ke andar poora virtual machine | Multiple distros try karni hain, isolated box chahiye |

WSL2 recommended hai kyunki: it light hai (VM jaisa RAM nahi khaata), Windows filesystem ko mount karta hai (`/mnt/c/...`), copy-paste easy hai, aur Docker Desktop natively support karta hai. VM ka drawback — slow + 2-4GB RAM khata hai. Native Linux ka drawback — Windows apps nahi chalenge. Trade-off yaad rakho: **kaam chhota + fast chahiye → WSL2.**

### Har tool ek kaam ke liye — table yaad rakho

| Tool | Kya karta hai | Kab use hoga |
|------|---------------|--------------|
| **Git** | Code changes track + version | Day 6+ har din |
| **VS Code** | Code + terminal likhne ki jagah | Roz |
| **Docker** | Apps ko container me package karta hai | Day 15-21 |
| **Python/Node** | Scripts + apps run karne ke liye | Day 4, 29-30 |
| **kubectl** | Kubernetes ko command se control | Day 18-21 |
| **Terraform** | Cloud infra ko code se banata hai | Day 22 |
| **az CLI** | Azure cloud se command se baat | Day 23+ |

Har tool ek specific kaam ke liye hai — "ye tool kya kar raha hai" ki mental image banao, phir syntax automatically yaad rehta hai.

### `--version` = software ka health check

Jaise doctor heartbeat se health check karta hai, waise hi `tool --version` software ka proof hai — tool installed hai, executable run ho raha hai, aur kitni version pe hai sab batata hai. Ye simple command **sabse powerful debugging tool** hai. Jab kabhi "tool nahi chal raha" lage, pehla sawaal always: `tool --version` chala ke dekho. Pattern: `git --version`, `docker --version`, `python3 --version`, `terraform --version`.

### "command not found" ka debug flow

Error aana normal hai — asli skill error ko **systematically** solve karna hai. Ye pura course me baar-baar aaega, isliye abhi se flow yaad rakho:

```
command not found
   1. Spelling check karo — `gti` nahi `git`?
   2. Install hua bhi hai? → apna install documentation dobara dekho
   3. Install hua but PATH me nahi? → nvm (Node), brew (Mac), pip (Python) yehi case hota hai
   4. Terminal ko restart karo → kabhi-kabhi PATH tabhi load hota hai
   5. Tab still? → `which git`, `type git`, `echo $PATH` se location dhoondo
```

### Dev-ready machine = ek final checklist

Setup khatam karne ke baad ek hi baar mein sab verify karo:

```bash
git --version && docker --version && python3 --version && node -v
kubectl version --client && terraform version && az --version | head -1
```

Sab sahi output de diya → machine dev-ready, aap agle din se seedha kaam pe.

> **Ek line mein:** Day 0 = tools ka "Home Delivery". Saare saamaan ghar aa jaye, bas unpack (install) karna hai.

## What You'll Learn | Aaj Ki Seekh

- [ ] Har tool install karna: Git, VS Code, Docker, Python, Node, kubectl, Terraform, `az` CLI
- [ ] `--version` se sab verify karna (test command pattern)
- [ ] Common setup errors ka debug karna
- [ ] WSL2 vs VM vs native Linux ka decision
- [ ] Debug checklist: "tool nahi mila" hone par kya karna hai
- [ ] Ek baar sab setup karke apni machine ko "dev-ready" banana

---






