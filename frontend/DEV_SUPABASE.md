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
