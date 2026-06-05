# Deployment environment matrix (Phase 0)

Create **separate** infrastructure per environment: `dev`, `staging`, `production`.

## 0.1 — Supabase (PostgreSQL + Auth + Storage)

| Env | Supabase project | Notes |
|-----|------------------|-------|
| dev | `cardvault-dev` | Local API can use Supabase connection string |
| staging | `cardvault-staging` | Preview deploys |
| prod | `cardvault-prod` | Customer data |

**API `.env`:**

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=card-images
```

**JWT for RLS (optional):** Configure Supabase Auth or forward Nest JWT with custom claim `org`.

## 0.2 — Upstash Redis

| Env | Variable |
|-----|----------|
| All | `REDIS_URL=rediss://default:...@....upstash.io:6379` |

Used for: BullMQ, rate limits, JWT `jti` blocklist, session counter buffer.

**Local without Redis:** Omit `REDIS_URL` — API falls back to in-process OCR/export and in-memory rate limits.

## 0.3 — Migrations

```powershell
cd API
npm install
npm run db:migrate        # dev: creates/applies migrations
npm run db:migrate:deploy # CI/prod
npm run db:seed
```

Do not use `db:push` in staging/production.

## 0.4 — Full API `.env` reference

See `API/.env.example`. Key groups: Server, DB, JWT, Redis, Supabase, Storage, OCR, Stripe, Sentry.

## 0.5 — Multi-tenant seed

`npm run db:seed` creates:

- **cardvault-demo** — `employee@`, `manager@`, `admin@cardvault.local`
- **acme-demo** — `employee@acme.local`, `manager@acme.local` (cross-tenant tests)

Password for all: `Password123!`
