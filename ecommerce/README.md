# Ecommerce (MERN/Next.js)

Monorepo ecommerce scaffold: Next.js storefront + Express/Prisma API + Postgres + Redis.

## Stack

| Layer    | Tech                                  |
| -------- | ------------------------------------- |
| Web      | Next.js 15 (App Router), Tailwind CSS |
| API      | Express, TypeScript, Zod, JWT         |
| Database | PostgreSQL 16 + Prisma                |
| Cache    | Redis 7                               |
| Infra    | Docker Compose                        |

## Layout

```
ecommerce/
├── apps/
│   ├── api/        # Express + Prisma REST API
│   └── web/        # Next.js storefront
├── packages/
│   └── shared/     # Shared TypeScript types
├── docker-compose.yml
└── .env.example
```

## Quickstart (local dev)

```bash
# Root .env (used by docker-compose) + per-app envs
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

npm install

# 1. Start Postgres + Redis only
docker compose up -d db redis

# 2. Prepare the database
npm run db:generate
npm run db:migrate      # creates tables + Prisma migration
npm run db:seed         # sample products + admin user

# 3. Run API and web together
npm run dev             # API :4000, web :3000
```

Open http://localhost:3000. API health check: http://localhost:4000/health

Seed admin login: `admin@ecommerce.local` / `admin1234`

## Full stack via Docker

```bash
cp .env.example .env
docker compose up --build
```

> If `docker compose` fails with `docker-credential-desktop: executable file not found`,
> remove the `"credsStore": "desktop"` entry from `~/.docker/config.json` (Docker Desktop
> helper not installed) or point `DOCKER_CONFIG` at a config without it.

- Web: http://localhost:3000
- API: http://localhost:4000
- Postgres: localhost:5432, Redis: localhost:6379

## API endpoints (Phase 1)

| Method | Route                  | Auth | Description              |
| ------ | ---------------------- | ---- | ------------------------ |
| GET    | `/health`              | –    | Liveness + DB check      |
| POST   | `/api/auth/register`   | –    | Register                 |
| POST   | `/api/auth/login`      | –    | Login, returns JWT       |
| GET    | `/api/products`        | –    | List (filter/search/page)|
| GET    | `/api/products/:slug`  | –    | Product detail           |

## Roadmap

- [x] **Phase 0** — repo structure, env, Docker
- [x] **Phase 1** — API skeleton, Prisma models, storefront listing, health
- [ ] **Phase 2** — auth guards, cart/wishlist, checkout, orders, payments, admin
- [ ] **Phase 3** — tests, validation hardening, rate limiting
- [ ] **Phase 4** — GitHub Actions CI (lint → test → build → image)
- [ ] **Phase 5** — deploy + monitoring (Prometheus/Grafana)
