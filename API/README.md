# CardVault API

NestJS REST API at `/api/v1` — Prisma ORM, PostgreSQL, multi-tenant SaaS backend.

## Setup

```powershell
npm install
cp .env.example .env
# Edit .env — DB_*, JWT secrets, GOOGLE_VISION_KEY_PATH
npm run db:push
npm run db:seed
npm run dev
```

Health: http://localhost:8000/api/v1/health

## Environment variables

See `.env.example` for the full list. Key groups:

| Group | Variables |
|-------|-----------|
| Server | `PORT` (default `8000`), `CORS_ORIGINS`, `NODE_ENV` |
| Database | `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` — or set `DATABASE_URL` directly |
| Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, optional RS256 key paths |
| OCR | `OCR_PROVIDER=google`, `GOOGLE_VISION_KEY_PATH`, `GOOGLE_VISION_TIMEOUT_MS` |
| Storage | `STORAGE_DRIVER=local` (default) or `supabase` + Supabase keys |
| Queue | `REDIS_URL` (optional — without it, OCR/export run in-process) |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO` |
| Observability | `SENTRY_DSN` (optional) |

`DATABASE_URL` is built from `DB_*` at startup unless overridden.

## Demo accounts (after seed)

Password: `Password123!`

| Email | Role | Org |
|-------|------|-----|
| employee@cardvault.local | employee | cardvault-demo |
| manager@cardvault.local | manager | cardvault-demo |
| admin@cardvault.local | platform_super_admin | cardvault-demo |
| employee@acme.local | employee | acme-demo |
| manager@acme.local | manager | acme-demo |

## Verify

```powershell
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"employee@cardvault.local","password":"Password123!"}'
```

## API modules

| Prefix | Purpose |
|--------|---------|
| `/auth` | Login, refresh, logout, me |
| `/contacts` | CRUD, search, merge |
| `/sessions` | Event sessions, members, stats |
| `/encounters` | Contact encounter history |
| `/ocr` | Submit image, poll jobs, confirm fields |
| `/exports` | Create and download Excel/CSV/PDF |
| `/users` | Org user management |
| `/organizations` | Tenant CRUD (platform roles) |
| `/plans` | Subscription plans |
| `/dashboard` | Admin dashboard stats |
| `/analytics` | Lead funnel, sessions, platform metrics |
| `/audit-events` | Audit log |
| `/notifications` | In-app + Expo push device registration |
| `/billing` | Stripe checkout, portal, webhooks |
| `/images` | Signed card image URLs |

Role-based access is enforced per endpoint. Employees use MOBILE; managers and platform admins use WEB.

## Scripts

```powershell
npm run dev              # API with hot reload
npm run start:worker     # BullMQ worker (needs REDIS_URL)
npm run db:migrate       # Apply migrations (dev)
npm run db:migrate:deploy # Apply migrations (CI/prod)
npm run db:push          # Sync schema (local quick start)
npm run db:seed          # Demo orgs, users, contacts
npm run test:google-ocr  # OCR smoke test on a local image
```

## Structure

```
src/
  config/           # database-url, jwt-keys, upload paths
  contracts/        # Shared API types
  common/           # Guards, interceptors, tenant context, pagination
  modules/          # Feature modules (auth, contacts, ocr, …)
  queue/            # BullMQ setup
  redis/            # Redis client
  storage/          # Local + Supabase storage drivers
  health/
prisma/
  schema.prisma     # Multi-tenant schema v3
  migrations/
  seed.ts
scripts/            # Prisma CLI helpers
```

## Docs

- [DOCS/engineering/LOCAL_DEV.md](../DOCS/engineering/LOCAL_DEV.md) — migrations, Redis, troubleshooting
- [DOCS/engineering/OCR_GOOGLE_VISION.md](../DOCS/engineering/OCR_GOOGLE_VISION.md) — Vision credentials
- [DOCS/engineering/CARD_SCANNING.md](../DOCS/engineering/CARD_SCANNING.md) — end-to-end scan flow
- [DOCS/engineering/DEPLOY_ENV.md](../DOCS/engineering/DEPLOY_ENV.md) — production env matrix
