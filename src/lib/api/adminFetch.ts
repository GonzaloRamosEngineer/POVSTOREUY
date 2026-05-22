import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export class AdminFetchError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Wrapper para llamadas client-side a /api/admin/*.
 * Inyecta el Bearer token de la sesión actual de Supabase.
 * Lanza AdminFetchError si la respuesta no es OK.
 */
export async function adminFetch<T = any>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(input, { ...init, headers });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && (body.error || body.message)) ||
      `Request failed with status ${res.status}`;
    throw new AdminFetchError(message, res.status, body);
  }

  return body as T;
}
