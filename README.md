# BrgyDesk — Multi-Tenant Barangay Service Portal

Production-oriented portal for barangay operations: resident census, barangay IDs, certificate workflows, public citizen portal, subscriptions, and QR/PWA tools.

**Stack:** Next.js 14 · Express · Supabase (PostgreSQL) · JWT

- [Architecture](docs/ARCHITECTURE.md) — API layers & multi-tenancy  
- [Best practices](docs/BEST_PRACTICES.md) — secrets, smoke tests, layout  
- [Deployment guide](docs/guides/DEPLOYMENT.md) — production checklist  
- [Setup guide](docs/guides/SETUP_GUIDE.md) — detailed setup  
- Historical SQL/scripts: [`_archive/`](_archive/README.md) (not used at runtime)

## Features (summary)

- Multi-tenant admin dashboard with role-based access
- Public portal per barangay: `http://localhost:3003/{tenant}` (e.g. `/ibaoeste`, `/demo`)
- Certificate request workflows, pickup, official receipts, signatures
- Resident database, ID management, bulk import
- CMS: events, facilities, programs, achievements, tourism, officials
- Subscription tiers (Starter / Standard / Pro) with feature gates
- PWA: service worker, install prompt, offline banner

## Prerequisites

- Node.js 18+
- Supabase project (URL + anon + service role keys)
- Same `JWT_SECRET` on frontend and backend

## Quick start

```bash
# From repo root
npm install
npm run install-all

# Configure env (see below)
# backend/.env
# frontend/.env.local

# Development (two terminals or root script)
npm run dev
# Frontend: http://localhost:3003
# Backend:  PORT from backend/.env (often 5005)
```

Or use `start-dashboard.bat` if present on Windows.

## Environment variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

JWT_SECRET=your-shared-jwt-secret
JWT_EXPIRE=7d
PORT=5005
NODE_ENV=development

FRONTEND_URL=http://localhost:3003
# Optional: RATE_LIMIT_DISABLED=true
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=300
# RATE_LIMIT_LOGIN_MAX=30
```

### Frontend (`frontend/.env.local`)

```env
# Leave empty or /api to use Next.js BFF (recommended)
NEXT_PUBLIC_API_URL=/api

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=same-as-backend
JWT_EXPIRE=7d

# Optional default tenant for local tools
# NEXT_PUBLIC_TENANT_ID=ibaoeste
```

Copy from `backend/.env.example` and `frontend/.env.local.example`.

## Login

Users are stored in Supabase `users`. Credentials are set per deployment (seed scripts or superadmin onboarding).  
Do not rely on sample passwords in old docs—use your tenant admin account or reset via superadmin.

## Project structure

```
admin-dashboard/
├── backend/              Express API, services, generated PDFs
├── frontend/
│   ├── pages/            Active Next.js routes + pages/api BFF
│   └── src/components/   UI, forms, portal, layout
├── docs/ARCHITECTURE.md  API and tenancy design
├── mobile/               Mobile app documentation
└── *.sql                 Historical DB migrations / ops SQL
```

**Note:** `frontend/src/pages/` was removed as duplicate/unused; Next.js uses `frontend/pages/` only.

## Production

- Build: `npm run build` (frontend)
- Process manager: `npm run pm2:start` (see `ecosystem.config.js`)
- Set `FRONTEND_URL` / `ALLOWED_ORIGINS` on the backend for CORS
- Ensure `JWT_SECRET` and Supabase keys are set in the host environment

## Health checks

- Next: `GET /api/health`
- Express: `GET /api/health` on backend port

```bash
npm run smoke              # Supabase tenant rows + counts
npm run smoke:local        # + localhost:3003 API (dev server must be running)
```

## Support

- Supabase connection: verify URL and keys in both env files
- Port conflicts: frontend dev uses **3003**; backend uses `PORT` in `.env`
- Auth issues: clear `localStorage` token/user and cookies; confirm `JWT_SECRET` matches

---

Built for Philippine barangay digitization — **BrgyDesk**.
