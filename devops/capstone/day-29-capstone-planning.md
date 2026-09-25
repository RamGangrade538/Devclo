# Day 29: Capstone Project Planning
📚 Topic 29: DeployTrack Planning — Architecture, Skeleton & Project Setup
✅ Prerequisite-checklist: (review All previous Days 1-28 concepts if needed)

## Overview | Parichay

**DeployTrack** - ek complete DevOps project jisme aap 30 din ka sab kuch combine karoge: Flask backend, Docker, K8s, Terraform, monitoring, logging, security, aur CI/CD. Aaj **planning** karenge.

### Capstone kyun — 30 din ka sab kuch ek project me

Alag-alag labs alag-alag theek lagte hain, par asli test tab hota hai jab **ek hi project** me sab ko saath jodna ho. Capstone isliye hai kyunki industry me bhi yahi hota hai: ek application, ek repo, ek pipeline — jisme **Dockerfile** se lekar **Terraform** tak sab ek dusre pe depend karte hain. Ek cheez badal do (jaise port ya env var) to compose file, K8s Service, ingress — sab ko saath adjust karna padta hai. Yahi **integration muscle** hai jo interview me aur real job me dono me dikhta hai.

Ek baar me 5 layers decide hote hain — code, build, run, infra, observe:
- **Code** — Flask + React + Celery (kya likhna hai)
- **Build** — Dockerfiles + GHCR tags (image kaise banegi)
- **Run** — compose locally + K8s on cloud (kahan chalega)
- **Infra** — Terraform se VNet/AKS/Postgres (base kaise bana)
- **Observe** — Prometheus/Grafana (deploy ke baad kaise dekho)

### Architecture pehle — boxes aur arrows ka game

Planning ka sabse pehla kaam hai **architecture draw karna** — kaunse components hain, kaun kis se baat karta hai, data kahan store hota hai, entry point kya hai. Golden rule: **code likhne se pehle diagram banao**, warna baad me refactor bahut mehnga padta hai. DeployTrack me 4 core boxes hain — **frontend** (React UI), **backend API** (Flask brain), **worker** (Celery — background jobs), aur **data layer** (PostgreSQL + Redis). Nginx bahar ka single darwaza hai; Prometheus/Grafana andar ki nigrani. Interview me jab "design a deployment tracker" aaye, to yahi flow arrows ke saath bolna shuru karo.

| Layer | Kya karega | Kyun chahiye |
|-------|-----------|--------------|
| Frontend | Status UI dikhaye | User ko live view chahiye |
| API | CRUD + business logic | Sabka central brain |
| Worker | Long jobs (notify, sync) | HTTP response fast rahe |
| DB + Cache | State + queue | Durable data + fast hand-off |

### Monolith vs microservices — line kahan khichni hai

DeployTrack **chhota microservice-style** app hai: frontend, API, worker alag containers hain, par itna bhi nahi ki har service ka apna repo ho. Ye learning ke liye **sahi balance** hai — bada monolith me Docker/K8s ka maza nahi aata, aur 20 microservices me pehle hi overload ho jata hai. Rule of thumb: jab ek cheez ka **independent scale** chahiye (worker pe load alag) ya **alag lifecycle** ho (frontend static assets, backend dynamic API), tabhi alag karo. Baaki ko simple rakho — complexity khud justified honi chahiye.

Decision shortcut:
- **Monolith** — ek process, deploy/scale saath-saath: chhoti team, low load ke liye
- **Microservices** — alag deploy/scale, par network + versioning ka complexity: bade teams
- **Yahan** — 3 containers (frontend/backend/worker) + shared DB: bounded complexity

Ye choice bolna hi interview me design-sense dikhata hai — "kyun 3 services, 15 nahi?" ka jawab ready rakho.

### Directory structure — repo ka blueprint

Repo ka layout hi team ki soch batata hai. Rules: **config alag code se** (`terraform/`, `k8s/`, `monitoring/` apne folders me), `scripts/` me jo bhi bash chalta hai, `.github/workflows/` me pipelines, aur har service apne folder me Dockerfile ke saath. Ek aur zaroori cheez — **.gitignore pehle hi sahi likho** (`.env`, `*.tfstate`, `node_modules/`), warna pehla commit hi secrets aur faltu files le jaata hai. Clean layout se naya member `ls` karke samajh jata hai ki kahan kya hai — onboarding ka aadha kaam yahin khatam.

```bash
deploytrack/
├── backend/     # Flask app + tests + Dockerfile
├── frontend/    # React UI + Dockerfile
├── terraform/   # infra as code (AKS, VNet, DB)
├── k8s/         # manifests: deploy, svc, ingress
└── scripts/     # deploy, rollback, health-check
```

### Planning vs coding — DevOps ka golden rule

Interviews me yahi farak dikhta hai ki banda junior hai ya ready-for-prod: juniors turant code likhna shuru karte hain, seniors pehle **requirements, constraints aur failure modes** sochte hain. Aaj ka din isliye planning ka hai: pehle architecture + directory + git init + test skeleton, phir kal poora implementation. Planning me hi decide ho jaana chahiye — **kaunse endpoints**, **secrets kahan jayenge**, **rollback kaise hoga**, aur **Azure ka cost idea** (har resource bill deta hai — cleanup plan bhi). Ek ghante ki planning implementation me 10 ghante bachati hai.

Planning sheet decide karti hai:
- **API contract** pehle — endpoints, request/response shape (client/server ka agreement)
- **Secrets** kaunse store se — compose me env, K8s me Secret ya Key Vault
- **K8s shape** — Deployment + Service + Ingress ka pehla draft
- **Rollback + health check** points — fail hone pe kaise detect + wapas
- **Azure resources checklist + estimated cost** (cleanup ke saath ek hi jagah)

### Local dev — docker-compose pehle, cloud baad me

Production se pehle sab kuch **local pe verify** karo — `docker-compose up` se ek command me Flask + Postgres + Redis + Nginx chal jate hain, bina kisi ka laptop setup kharab kiye. Compose ka bada fayda: **same interfaces** production jaise (env vars `DATABASE_URL`, `REDIS_URL`) — isliye code me `localhost` hardcode nahi hota. Gotcha: compose ka `depends_on` sirf start order deta hai, service ready hone ka wait nahi — app side pe retry logic rakho. Local green dikhe tabhi Azure/AKS pe jaana safe hai.

### Interview angle — planning wale sawal

Common asks: "DeployTrack kaise design karoge?", "frontend aur API beech me kya aayega?", "state kahan rakhoge?", "rollback plan kya hai?". Pattern yaad rakho: **requirements → components → data flow → failure handling → cost/security**. 8-word frame: nginx = entry point, Flask = logic, Celery = async, Postgres = source of truth, Redis = queue/cache, K8s = run, Terraform = infra, GitHub Actions = glue. Ye bolna hi answer ka skeleton de deta hai — details fir usi pe layer karo.

Interview prep notes:
- "Project banao" wale sawal pe **pehle diagram, phir detail** — order hi senior behavior hai
- **"Kyun 3 services, 15 nahi?"** ka jawab ready rakho (independent scale + alag lifecycle)
- Rollback, cost, security teeno jagah mention karo — bina puchhe bolna value-add hai
- Whiteboard pe boxes+arrows draw karne ki practice rakho — likhne ki jagah batao

## What You'll Learn | Aaj Ki Seekh

- [ ] DeployTrack architecture samajhna (frontend + backend + worker + database)
- [ ] Project directory structure setup karna step-by-step
- [ ] Flask backend API banana (health, deployments, services endpoints)
- [ ] Pytest se basic tests likhna
- [ ] Backend ka Dockerfile banana
- [ ] docker-compose.yml se local environment run karna
- [ ] Git repo initialize karna with proper .gitignore
- [ ] Planning pehle, code baad mein - DevOps ka golden rule

---

## Project: DeployTrack

**Goal:** Ek web application jo deployments track karta hai + full DevOps infrastructure + observability + CI/CD.

### Architecture

```
                    ┌─────────────┐
                    │   Users     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx     │
                    │  (Ingress)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼─────┐ ┌───▼────┐
       │  Frontend   │ │  API   │ │ Worker │
       │  (React)    │ │ (Flask)│ │ (Celery)│
       └─────────────┘ └───┬────┘ └───┬────┘
                           │          │
                    ┌──────▼──────────▼──────┐
                    │    PostgreSQL + Redis    │
                     └─────────────────────────┘
```

## Diagram | Dekho Kaise Kaam Karta Hai

### Mermaid - Full DeployTrack Architecture

```mermaid
graph TB
    U["Users / Browser"] -->|"HTTP"| N["Nginx Ingress"]
    N -->|"/"| FE["Frontend - React"]
    N -->|"/api/*"| BE["Backend - Flask API"]
    N -->|"/api/*"| W["Worker - Celery"]

    BE -->|"SQL"| PG[("PostgreSQL")]
    BE -->|"Cache/Queue"| RD[("Redis")]
    W -->|"Consume"| RD
    W -->|"Write"| RD

    subgraph AKS["Azure AKS Cluster"]
        FE
        BE
        W
    end

    subgraph Data["Data Layer"]
        PG
        RD
    end

    subgraph Obs["Observability"]
        PROM["Prometheus"] -->|"scrape /metrics"| BE
        PROM --> GRAF["Grafana Dashboard"]
    end

    AKS --> Data
    BE --> Obs
```

### Reference Images

![Azure Kubernetes Service Architecture](assets/img/aks-architecture.svg)
*Azure Kubernetes Service - managed K8s on Azure. [Source: Microsoft Learn](https://learn.microsoft.com/en-us/azure/aks/concepts-clusters-workloads)*

![NGINX Ingress Controller on AKS](assets/img/aks-ingress.svg)
*NGINX Ingress Controller - traffic routing in AKS. [Source: Microsoft Learn](https://learn.microsoft.com/en-us/azure/aks/ingress-basic)*

---

## Project Structure

```
deploytrack/
├── .github/workflows/
│   ├── ci.yml              # Lint + Test + Security
│   ├── build.yml           # Build + push images
│   ├── deploy-staging.yml  # Staging deploy
│   └── deploy-prod.yml     # Production + approval
├── frontend/               # React (Dockerfile, src)
├── backend/                # Flask (Dockerfile, app/, tests/)
├── worker/                 # Celery
├── nginx/                  # nginx.conf
├── terraform/              # VNet, AKS, Azure SQL/Postgres, Storage, modules
├── k8s/                    # deployments, services, ingress, configmap, secrets
├── monitoring/             # prometheus.yml, dashboards
├── scripts/                # setup, deploy, rollback, health-check, seed-data
├── docker-compose.yml      # local dev
├── docker-compose.prod.yml # prod overrides
├── Makefile
└── README.md
```

---

## Planning Tasks (Aaj)

- [ ] Architecture banao (draw karo)
- [ ] Directory structure banao
- [ ] Git repo + .gitignore (secrets mat bhejop)
- [ ] Backend API banao (Flask):
  - `GET /api/deployments` - list
  - `POST /api/deployments` - new
  - `GET /api/services` - services + status
  - `GET /api/health` - health
- [ ] Basic tests likho
- [ ] Backend Dockerfile banao
- [ ] docker-compose.yml local dev ke liye
- [ ] `docker-compose up` verify karo

---

## Code Templates

**Backend (Flask):**
```python
# backend/app/main.py
from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)
deployments = []
services = [
    {"id": 1, "name": "frontend", "status": "healthy"},
    {"id": 2, "name": "backend", "status": "healthy"},
    {"id": 3, "name": "worker", "status": "healthy"},
    {"id": 4, "name": "postgres", "status": "healthy"},
    {"id": 5, "name": "redis", "status": "healthy"},
]

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "ts": datetime.utcnow().isoformat()})

@app.route('/api/deployments', methods=['GET'])
def get_deployments():
    return jsonify(deployments)

@app.route('/api/deployments', methods=['POST'])
def create_deployment():
    d = request.json
    rec = {
        "id": len(deployments) + 1,
        "service": d.get("service"),
        "environment": d.get("environment"),
        "version": d.get("version"),
        "status": "deploying",
        "timestamp": datetime.utcnow().isoformat(),
    }
    deployments.append(rec)
    return jsonify(rec), 201

@app.route('/api/services')
def get_services():
    return jsonify(services)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**Test:**
```python
# backend/tests/test_api.py
import pytest
from app.main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

def test_health(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.json['status'] == 'healthy'

def test_list_services(client):
    r = client.get('/api/services')
    assert len(r.json) == 5

def test_create_deployment(client):
    r = client.post('/api/deployments', json={
        "service": "backend", "environment": "staging", "version": "2.0.0"})
    assert r.status_code == 201
    assert r.json['status'] == 'deploying'
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - DATABASE_URL=postgresql://deploy:secret@postgres:5432/deploytrack
      - REDIS_URL=redis://redis:6379/0
    depends_on: [postgres, redis]

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: deploy
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: deploytrack
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: [./nginx/nginx.conf:/etc/nginx/nginx.conf]
    depends_on: [backend]

  volumes:
    pgdata:
```

---

## Demo | Copy-Paste Karke Chalao

Step 1 - Directory structure banao:
```bash
mkdir -p deploytrack/{frontend,backend/app,backend/tests,worker,nginx,terraform/modules,k8s,monitoring,scripts,.github/workflows}
cd deploytrack
git init && touch .gitignore
echo -e "*.pyc\n__pycache__\n.env\n.terraform\n*.tfstate\nnode_modules/" > .gitignore
ls -la  # verify structure
```

Step 2 - Backend Flask app chalao aur test karo:
```bash
# backend/app/main.py aur backend/tests/test_api.py copy karo (upar code templates se)
cd backend
pip install flask pytest
python -m pytest tests/ -v          # tests pass hone chahiye
python app/main.py &                 # background mein start
curl http://localhost:5000/api/health    # {"status": "healthy"}
curl http://localhost:5000/api/services  # 5 services list
curl http://localhost:5000/api/deployments  # empty list
kill %1                               # band karo
```

Step 3 - Docker Compose se sab services up karo:
```bash
cd ..
docker-compose build
docker-compose up -d
docker-compose ps                    # sab green hona chahiye
curl http://localhost/api/health      # nginx ke through test
docker-compose logs -f backend       # logs dekho
docker-compose down                  # sab band
```

---

## Real-Life Example | Zindagi Se

**DeployTrack jaisa real life mein kya hai?**

Socho aap **Delhi Metro** mein ho. Aapke phone pe ek app hai jo batata hai:

| DeployTrack Concept | Delhi Metro Equivalent |
|---------------------|----------------------|
| Deployment status tracking | Train kahan hai abhi (real-time location) |
| Service health (frontend/backend/worker) | Kaun-si line active hai (Green/Yellow/Blue) |
| Deployment timestamp | Kab next train aayegi |
| Rollback | Agar line band hai toh alternate route lo |
| Monitoring (Prometheus/Grafana) | Metro control room jo sab dekh raha hai |

Ya phir **Zomato/Swiggy** order tracking:
- **Order placed** = deployment create hua
- **Restaurant ne banaya** = build complete
- **Rider picked up** = image GHCR pe push hua
- **Delivered** = production mein deploy ho gaya
- **Food kharab = refund** = rollback to previous version

DeployTrack mein bhi yehi hota hai - deployment create karo, status track karo, aur agar kuch gadbad hai toh rollback karo. **Yehi hai real DevOps - automate karo, monitor karo, aur swift action lo!**

---

## Notes | Yaad Rakho

```
- Pehle architecture + design, phir code
- Har stage test karte jao
- Secrets .env/backend mein mat rakho (k8s secrets / env)
- local dev upar kam karlo, phir azure (AKS/VM) par deploy
- Azure subscription har resource ko cost deta hai - cleanup zaroori
```

---

**Kal:** DeployTrack ka complete implementation - CI/CD, K8s, Terraform, monitoring, scripts.
