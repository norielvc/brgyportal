import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Missing Supabase environment variables in Next.js Server Side.",
  );
}

// Create singleton client with reasonable timeout
export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    persistSession: false, // Disable session persistence on server
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      return fetch(url, { ...options, signal: controller.signal })
        .then((res) => {
          clearTimeout(timeoutId);
          return res;
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.error('Supabase request timeout after 30s');
          }
          throw err;
        });
    },
  },
});

/** Service-role Supabase client (same singleton as `supabase`). */
export function getServiceRoleClient() {
  return supabase;
}

/** Whether server-side Supabase env vars are present. */
export function isSupabaseServerConfigured() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export function isAnonSupabaseConfigured() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/**
 * Anon-key client for public portal reads (RLS applies when enabled).
 * @param {{ timeoutMs?: number }} [options]
 */
export function createAnonClient(options = {}) {
  const timeoutMs = options.timeoutMs ?? 30000;
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (fetchUrl, fetchOptions) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(fetchUrl, { ...fetchOptions, signal: controller.signal })
          .then((res) => {
            clearTimeout(timeoutId);
            return res;
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            throw err;
          });
      },
    },
  });
}
