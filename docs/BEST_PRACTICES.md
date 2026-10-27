# BrgyDesk — Best Practices

## Secrets & environment

- Use the **same `JWT_SECRET`** on frontend and backend (and production host env).
- Never commit `.env`, `.env.local`, or service-role keys.
- **`SUPABASE_SERVICE_ROLE_KEY`** is server-only (Next API routes + Express).

## After deploy or big changes

```bash
npm run smoke
npm run smoke:local   # requires frontend on :3003
```

## Code layout

| Path | Purpose |
|------|---------|
| `frontend/pages/` | All Next.js routes (do not add `frontend/src/pages/`) |
| `frontend/pages/api/` | BFF layer |
| `backend/routes/` | Express APIs, PDFs, heavy workflow |
| `scripts/` | Shared ops scripts (smoke test) |
| `_archive/` | Old SQL, notes, one-off scripts (not used at runtime) |
| `docs/` | Current documentation |

## Data & backups

- Census Excel, JSON backups, and exports live **outside** the repo (OneDrive folder or `backups/` not in git).
- See `.gitignore` for `Resident/`, `backup_before_deduplication/`, etc.

## Rate limiting

- Enabled by default on Express and Next login.
- Set `RATE_LIMIT_DISABLED=true` only for short local debugging.

## New features

- Add API in **one** layer (prefer Next BFF or Express, not both without reason).
- Use `frontend/lib/supabase.js` and `src/lib/api-auth.js` for new Next API routes.
- Scope all queries by **`tenant_id`** when using the service role.
