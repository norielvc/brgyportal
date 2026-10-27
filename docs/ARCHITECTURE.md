# BrgyDesk Architecture

This document describes how the app is wired today. It is intended for developers onboarding or deploying the system.

## Overview

BrgyDesk is a **multi-tenant barangay portal**:

- **Staff admin** — dashboard, residents, certificates, workflows, IDs, QR, CMS
- **Public portal** — `/{tenant}` citizen-facing site
- **Superadmin** — tenant onboarding (`/superadmin`)

**Primary database:** [Supabase](https://supabase.com) (PostgreSQL).  
Legacy README references to MongoDB are outdated; the Express server uses `*-supabase.js` routes only.

## Runtime layout

```
Browser
  → Next.js 14 (frontend/, port 3003 in dev)
       pages/          UI routes
       pages/api/      BFF (Backend-for-Frontend) — auth, portal, barangay-id, many CMS proxies
  → Express (backend/, PORT from .env, often 5005)
       /api/*          Certificates, workflows, residents (admin), PDF generation, email
  → Supabase
```

## API routing strategy

| Client config | Behavior |
|---------------|----------|
| `NEXT_PUBLIC_API_URL` **empty** or `/api` | Browser talks only to **Next.js `/api`**. Recommended for Railway/Vercel frontend. |
| `NEXT_PUBLIC_API_URL=http://localhost:5005/api` | Axios/fetch can hit **Express** directly (local full-stack). |

The shared axios client (`frontend/src/lib/api.js`) defaults to **`/api`** when `NEXT_PUBLIC_API_URL` is unset.

### Next.js-only (or primarily Next) endpoints

Examples that run in `frontend/pages/api/` without requiring Express for the same path:

- `POST /api/auth/login` — JWT issuance
- `GET /api/portal/tenant-info`, `portal/[type]`, `portal/submit`, `portal/track`
- Barangay ID CRUD/export (`/api/barangay-id/*`)
- Some CMS CRUD (events, facilities, programs, achievements, notifications)
- `GET /api/residents/search` — resident lookup with tenant scoping

### Express endpoints

Mounted in `backend/server.js` (require JWT unless noted):

- Certificates, workflow assignments, workflows
- Admin residents CRUD, dashboard stats
- Pickup verification, QR scans, signatures, physical inspection, official receipts
- Public/optional: homepage CMS reads, pickup (partial), educational assistance

When adding a feature, prefer **one** layer for new routes (usually Next BFF calling Supabase, or Express) and document it here.

## Multi-tenancy

1. Users have `tenant_id` in Supabase `users`.
2. Express `authenticateToken` sets `req.headers['x-tenant-id']` from the JWT user (superadmin may override).
3. Browser `_app.js` wraps `fetch` to attach `Authorization` and `x-tenant-id` (logged-in user’s tenant wins).
4. Next API routes using the service role **must** call `authenticateToken` and filter by `user.tenant_id`.

## Shared server libraries (frontend)

| Module | Purpose |
|--------|---------|
| `frontend/lib/supabase.js` | Service-role singleton, `createAnonClient()` for public reads |
| `frontend/lib/jwtSecret.js` | JWT secret resolution (no weak default in production) |
| `frontend/lib/loginRateLimit.js` | In-memory limiter for Next login |
| `frontend/src/lib/api-auth.js` | `authenticateToken(req, res)` for Next API routes |

## Security notes

- Set **`JWT_SECRET`** in production for both frontend and backend.
- Set **`SUPABASE_SERVICE_ROLE_KEY`** only on the server (never `NEXT_PUBLIC_*`).
- Rate limits: Express `/api` + stricter `/api/auth/login`; Next `/api/auth/login` has a matching in-memory limiter. Disable with `RATE_LIMIT_DISABLED=true` if needed for local debugging.

## SQL and ops scripts

Historical migrations and one-off fixes live under **`_archive/sql/`** and `backend/`. They are not loaded at runtime. New schema changes should be saved as SQL with clear names (tenant/feature/date).

See also [BEST_PRACTICES.md](BEST_PRACTICES.md).

## Smoke tests

From repo root (loads `backend/.env`):

```bash
npm run smoke
npm run smoke:local   # also hits http://localhost:3003/api/*
```

Use in CI with Supabase secrets configured; add `--url=` for your deployed frontend.

## What we intentionally did not change in refactors

- Workflow default steps in `backend/services/workflowService.js` (tenant DB config remains source of truth when present).
- Large portal UI (`PortalPageContent.js`) — split is a future refactor, not required for correctness.
