# Day 29: Capstone Project Planning
📚 Topic 29: DeployTrack Planning — Architecture, Skeleton & Project Setup
✅ Prerequisite-checklist: (review All previous Days 1-28 concepts if needed)

## Overview | Parichay

**DeployTrack** - ek complete DevOps project jisme aap 30 din ka sab kuch combine karoge: Flask backend, Docker, K8s, Terraform, monitoring, logging, security, aur CI/CD. Aaj **planning** karenge.

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
