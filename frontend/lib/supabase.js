import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase environment variables in Next.js Server Side.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      return fetch(url, { ...options, signal: controller.signal })
        .then(res => { clearTimeout(timeoutId); return res; })
        .catch(err => { clearTimeout(timeoutId); throw err; });
    }
  }
});
// Vercel Force Sync: 04/07/2026 09:29:55
