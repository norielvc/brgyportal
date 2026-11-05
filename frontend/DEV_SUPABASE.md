# Separate Supabase for local development

Using **production** Supabase credentials in `frontend/.env.local` while running `localhost:3003` will:

- Count every API read/write against **production egress**
- Risk changing live barangay data during tests

## Recommended setup

1. In [Supabase Dashboard](https://supabase.com/dashboard), **create a second project** (e.g. `brgydesk-dev`).
2. Apply the same schema/migrations as production (SQL files in `backend/`, or restore a sanitized dump).
3. Copy `frontend/.env.local.example` → `frontend/.env.local`.
4. Point **only** `.env.local` at the dev project:

```env
SUPABASE_URL=https://YOUR-DEV-REF.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-DEV-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dev-service-role-key
SUPABASE_ANON_KEY=dev-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key

# Optional: warn if URL matches production project ref
SUPABASE_PRODUCTION_PROJECT_REF=your-prod-ref-from-dashboard-url
```

5. Keep **production** keys in Vercel project env vars only (never in `.env.local` on your laptop).

## If you must hit production locally

Set in `.env.local`:

```env
SUPABASE_ALLOW_PRODUCTION=true
```

The server will skip the localhost warning. Use sparingly.

## Verify

Restart `npm run dev` and check the terminal: you should **not** see the production Supabase warning. Staff login should use dev users/residents only.

## Egress (PostgREST) checklist

Supabase **egress** is mostly database API traffic. To keep usage down:

1. **Never use production Supabase from local dev** (see above).
2. **Avoid leaving many staff tabs open** — sidebar badges refresh on **navigation and tab focus**, not on a timer (each refresh hits Supabase).
3. **Certificate lists** use `?view=list` (slim columns, no `details` JSON). Open a single request with `/api/certificates/[id]` when you need the full record.
4. **Do not refresh Certificate Requests / Help Desk in a loop** — each refresh hits Supabase.
5. **Census export** is gated (confirm + cooldown) — use it only when needed.
6. **KapChat** polls every ~20s while the tab is open — close Help Desk / portal chat when not in use.
7. **Dashboard analytics** defaults to the **last 12 months** of requests unless you set date filters.
8. **Resident database** list/search skips heavy `census_extras`; opening a profile loads one full row via `GET /api/residents/[id]`.

After deploy, watch Supabase **Usage → Egress** for a few days; daily GB should drop versus polling full certificate rows with nested joins on every badge update.
