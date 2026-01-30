import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variable global para mantener la instancia (Singleton)
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is missing');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

  _admin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _admin;
}