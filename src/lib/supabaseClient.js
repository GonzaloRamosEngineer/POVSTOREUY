'use client';

import { createClient } from '@supabase/supabase-js';

// Variable fuera de la función para guardar la instancia (Singleton)
let supabaseBrowserClient = null;

export function getSupabaseBrowserClient() {
  // Si ya existe, devolvemos el que ya creamos antes. ¡Ahorramos memoria y loops!
  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }

  // Creamos la instancia y la guardamos en la variable global
  supabaseBrowserClient = createClient(url, anonKey);

  return supabaseBrowserClient;
}