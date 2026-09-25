# 🧱 DevOps Fundamentals

> **Hinglish:** DevOps ek aisi kaam karne ki culture hai jisme developers (jo code likhte hain) aur operations (jo system chalate hain) saath-saath kaam karte hain — taaki software jaldi, reliably aur automatically release ho. Ye module puri "DevOps duniya ka map" samjhata hai.

## 📖 Overview — Ye Topic Kya Hai

DevOps ka matlab sirf tools nahi hai — ye ek **culture + mindset** hai. Puraana time me developers code likh kar "wall ke paar" operations ko de dete the, aur agar deploy fail hota tha toh blame hota tha. DevOps is dichotomy ko todta hai: **development, testing, deployment aur monitoring sab ek continuous loop** me chalta hai.

DevOps ko samajhne ke liye pehle **SDLC (Software Development Life Cycle)** samjho — code likhna, test karna, deploy karna, monitor karna. DevOps isi cycle ko **automate aur shrink** karta hai — jisse software bahut jaldi users tak pahunchta hai.

DevOps me kuch core cheezein hamesha aati hain: **automation** (repeatable kaam machine kare), **Culture** (blame ke bajaye learning), **Measurement** (har kaam ka data kaho), **Sharing** (tools aur responsibility sabki). Agar ye yaad rahe toh interview me bhi strong rahoge.

Ye module ek "starting map" hai — baaki saare modules isi ke branches hain (Linux, Cloud, CI/CD, Docker, K8s…). Pehle ise padho, phir baaki modules me jaana aasan hoga.

## 🟢 Beginner — Shuruaat yahan se

- Sabse pehle **SDLC aur Agile ka matlab** samjho — kaam chhote-chhote sprints me kaise banta hai.
- **DevOps lifecycle ka flow** yaad karo: Plan → Code → Build → Test → Release → Deploy → Operate → Monitor → wapas Plan.
- **CI, CD aur CI/CD** me difference — CI = code merge hote hi test/build chala do; CD = ready software automatically release/deploy karo.
- **Infrastructure vs Application** samjho — app to software hai, infra to wo machine/network jispe chalta hai.
- **Environment** kya hote hain: dev (test karne ke liye), test/qa, staging (production jaisa dummy), production (real users).

## 🟡 Intermediate — Ab depth me jao

- **High availability, scalability, reliability** — ye teeno alag cheezein hain; example ke saath samjho.
- **SLIs, SLOs, SLAs** — availability ko number me kaise likha jata hai (jaise 99.9%).
- **RTO / RPO aur Disaster Recovery** — "kitni der me dobara upar aana hai" aur "kitna data bacha ke rakhna hai".
- **Change, Incident, Problem management** — kab kya process chalu hota hai jo cheezein alag hain.

## 🔴 Advanced — Pro bano

- **Toil aur automation** — jo kaam machine kare wo bot ko do, insaan ko creative cheezo pe time do.
- **SRE vs DevOps** — dono relation samjho, error budgets ka concept lo.
- **Distributed systems + reliability engineering** — production me jab lakhon users aate hain tab kya fail hota hai aur kaise design karte hain.
- **Value Stream Mapping & DORA metrics** — janji team "fast + safe" hai ya nahi.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **What is DevOps** — culture jo dev+ops ko jodta hai; fast + reliable delivery ka aim.
- [ ] **SDLC** — software banane ka pura lifecycle: requirement se maintenance tak.
- [ ] **Agile & Scrum basics** — chhote chhote iterations me kaam, Scrum me sprints, standup, retros.
- [ ] **DevOps lifecycle** — continuous loop: plan → code → build → test → release → deploy → operate → monitor.
- [ ] **CI (Continuous Integration)** — code merge hote hi build+test auto chala do, taaki issues jaldi pakde.
- [ ] **CD (Continuous Delivery/Deployment)** — tested code release-ready rhenclause; Continuous Deployment me auto deploy bhi ho jata hai.
- [ ] **CI/CD** — CI + CD milakar software ko continuously integrate, test aur ship karne ka pipeline.
- [ ] **Continuous Integration** — baar-baar code merge + automated test.
- [ ] **Continuous Delivery** — har change deploy-ready release me bana do.
- [ ] **Continuous Deployment** — production me automatically deploy ho jaye bina manual click ke.
- [ ] **Infrastructure vs application** — infra = servers/network/storage; application = code/features.
- [ ] **On-premises vs cloud** — on-prem = apne racks, cloud = provider se on-demand lete ho.
- [ ] **Environments (dev/test/staging/prod)** — alag-alag stages khud ka copy infra, prod = real users.
- [ ] **High availability (HA)** — system 24x7 upar rehna, koi ek cheez fail ho to bhi.
- [ ] **Scalability** — load badhne pe capacity badhane ki ability (vertical = zyada CPU, horizontal = zyada machines).
- [ ] **Reliability** — system consistently sahi kaam kare, users ko issue na aaye.
- [ ] **Performance** — system kitna fast hai (latency) aur kitna kaam karta hai (throughput).
- [ ] **Disaster recovery (DR)** — bada accident hua toh backup se wapas kaise laana hai.
- [ ] **RTO / RPO** — RTO = kitni der me recover; RPO = kitna data loss allowed.
- [ ] **SLIs / SLOs / SLAs** — SLI = measure kiya gya metric; SLO = target; SLA = customer ke saath agreement.
- [ ] **Change management** — production me koi bhi change control me, taaki risk kam ho.
- [ ] **Incident management** — production tooti toh detection, triage, escalation, fix, communication.
- [ ] **Problem management** — incident ke *root cause* ki investigation, taaki future me na ho.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Git / GitHub / GitLab | Code version control + collaboration | Har project — code manage karne ke liye |
| Jenkins / GitHub Actions | CI/CD pipelines | Build-test-deploy automate karne ke liye |
| Docker | Container runtime | App ko package + portable banane ke liye |
| Kubernetes | Container orchestration | Production me scale + manage karne ke liye |
| Terraform | Infrastructure as Code | Cloud infra code se banane ke liye |
| Prometheus / Grafana | Monitoring + dashboards | System health dekhte rahne ke liye |
| Vault | Secrets management | Passwords/keys safely store karne ke liye |

## 🧪 Practical Labs / Projects

- [ ] **Mini Project — Manual vs Automated:** Ek hello-world app banao, pehle manually deploy karo, phir ek CI/CD script se. Difference observe karo.
- [ ] **Diagram banao:** Apne sabhi familiar tools ke saath ek DevOps lifecycle loop draw karo (mermaid me bhi try karo).
- [ ] **DORA exercise:** Apni/imaginary team ke liye deployment frequency aur change failure rate likho — kahin improvement lagega.
- [ ] **Comparison chart:** On-prem vs cloud (AWS/Azure/GCP) for a small app — cost aur effort ka rough rough estimate banao.

## 🔗 Related Topics

- [🌐 Networking](../modules/networking.md)
- [🐧 Linux](../modules/linux.md)
- [⚙️ CI/CD](../modules/cicd.md)
- [📊 Observability](../modules/observability.md)
- [DevOps Culture Deep Dive](../topics/devops-culture.md)
- [DevOps Culture Deep Dive](../topics/devops-culture.md)