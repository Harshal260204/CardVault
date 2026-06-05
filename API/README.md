# CardVault API

NestJS REST API (`/api/v1`) + Prisma + local PostgreSQL.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API HTTP port (default `4000`) |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Host (usually `localhost`) |
| `DB_PORT` | Port (usually `5432`) |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated web origins |

`DATABASE_URL` is built automatically from `DB_*` at startup. To override, set `DATABASE_URL` directly in `.env`.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run db:push
npm run db:seed
npm run dev
```

## Demo accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| employee@cardvault.local | Password123! | employee |
| manager@cardvault.local | Password123! | manager |
| admin@cardvault.local | Password123! | super_admin |

## Verify

http://localhost:{PORT}/api/v1/health — expect `"database": "up"`.

```bash
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"employee@cardvault.local\",\"password\":\"Password123!\"}"
```

## Phase 5 API (requires Bearer token)

- `GET /api/v1/contacts` — list (paginated)
- `GET /api/v1/sessions` — event sessions
- `GET /api/v1/users` — org users (manager+)

See `DOCS/engineering/API_PHASE5.md`.

Admin (manager+): `GET /admin/dashboard`, `GET /audit-events`, `GET|POST /exports`, `PATCH /users/:id` — see `DOCS/engineering/ADMIN_PHASE7.md`.

OCR: `POST /ocr/jobs` (multipart), `GET /ocr/jobs`, `POST /ocr/jobs/:id/confirm` — see `DOCS/engineering/OCR_PHASE8.md`.

Exports: `POST /exports`, `GET /exports/:id/download` — see `DOCS/engineering/EXPORT_PHASE9.md`.

## Structure

```
src/
  config/        # database-url builder
  contracts/
  modules/
  health/
prisma/
scripts/         # Prisma CLI helpers
```
