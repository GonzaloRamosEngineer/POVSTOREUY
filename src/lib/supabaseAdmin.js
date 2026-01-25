import { createClient } from '@supabase/supabase-js';

let _admin = null;

// ✅ Mantiene compatibilidad con lo que ya tenías (supabaseAdmin)
export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is missing (or NEXT_PUBLIC_SUPABASE_URL as fallback)');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

  _admin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _admin;
}

// ✅ Export legacy: para no romper imports viejos si existen
export const supabaseAdmin = getSupabaseAdmin();
