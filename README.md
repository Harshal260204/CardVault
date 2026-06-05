# CardVault

Enterprise business card management — three-app monorepo.

## Repository structure

```
CardVault/
├── DOCS/        # Product & engineering documentation
├── API/         # NestJS + Prisma backend only
├── ocr_service/ # Local PaddleOCR Python sidecar (no Docker)
├── WEB/         # Next.js super admin / manager console only
└── MOBILE/      # Expo React Native field sales app only
```

Each code folder is a **standalone project** with its own `package.json`.

**No Docker** — use local PostgreSQL for development.

## Quick start

### 1. API

```bash
cd API
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Health: http://localhost:8000/api/v1/health

**OCR (card scanning)** — run the local Paddle server before using Scan in MOBILE:

```bash
cd ocr_service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

See [DOCS/engineering/OCR_PADDLE_LOCAL.md](DOCS/engineering/OCR_PADDLE_LOCAL.md) and [DOCS/engineering/OCR_EXTRACTION_PIPELINE.md](DOCS/engineering/OCR_EXTRACTION_PIPELINE.md).

### 2. Web (admin)

```bash
cd WEB
cp .env.local.example .env.local
npm install
npm run dev
```

http://localhost:3000 — `manager@cardvault.local` or `admin@cardvault.local` / `Password123!`

### 3. Mobile (sales)

```bash
cd MOBILE
cp .env.example .env
npm install
npm start
```

`employee@cardvault.local` / `Password123!`

See [DOCS/engineering/LOCAL_DEV.md](DOCS/engineering/LOCAL_DEV.md) for details.
