# CardVault Web (Admin)

Next.js 14 app for **managers** and **super admins** only — dashboard, org contacts, users, audit log, exports.

Field sales use the **MOBILE** app (`employee` role).

## Setup

```powershell
cd WEB
cp .env.local.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` must match the API (default `http://localhost:8000/api/v1`).

## Demo login

| Email | Password | Role |
|-------|----------|------|
| manager@cardvault.local | Password123! | manager |
| admin@cardvault.local | Password123! | super_admin |

Open http://localhost:3000 → redirects to `/admin/dashboard`.

## Routes

- `/login` — admin sign-in
- `/admin/dashboard` — stats and charts
- `/admin/contacts` — org-wide contact table
- `/admin/users` — user management
- `/admin/audit-log` — audit events
- `/admin/export` — export jobs and download
