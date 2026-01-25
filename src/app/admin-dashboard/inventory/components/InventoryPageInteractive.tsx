'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import ProductTable, { type ProductRow } from './ProductTable';

type AdminCheck = { ok: true } | { ok: false; message: string };

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export default function InventoryPageInteractive() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [admin, setAdmin] = useState<AdminCheck | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  async function verifyAdmin(): Promise<AdminCheck> {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return { ok: false, message: 'No se pudo validar la sesión. Iniciá sesión nuevamente.' };
    if (!userData.user) return { ok: false, message: 'Necesitás iniciar sesión como admin.' };

    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userData.user.id)
      .single();

    if (pErr || !profile) return { ok: false, message: 'No se pudo obtener tu perfil admin (user_profiles + RLS).' };
    if (profile.role !== 'admin') return { ok: false, message: 'Tu usuario no tiene rol admin.' };

    return { ok: true };
  }

  async function loadProducts() {
    setLoading(true);
    setErrorMsg('');

    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      setErrorMsg('No hay sesión activa. Iniciá sesión como admin.');
      return;
    }

    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('includeInactive', includeInactive ? 'true' : 'false');

    const res = await fetch(`/api/admin/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLoading(false);
      setErrorMsg(j?.error || 'No se pudieron cargar los productos.');
      return;
    }

    const data = await res.json();
    setRows(data.products || []);
    setLoading(false);
  }

  async function onDeactivate(id: string) {
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || 'No se pudo desactivar el producto.');
      return;
    }

    await loadProducts();
  }

  useEffect(() => {
    (async () => {
      const check = await verifyAdmin();
      setAdmin(check);
      if (check.ok) await loadProducts();
      else setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

if (admin?.ok === false) {
  return (
    <div className="bg-card rounded-lg p-6 card-elevation">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-2">Acceso restringido</h3>
      <p className="text-sm text-muted-foreground">{admin.message}</p>
      <div className="mt-4">
        <Link
          href="/admin-login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth focus-ring"
        >
          <Icon name="ArrowRightIcon" size={18} />
          Ir a login admin
        </Link>
      </div>
    </div>
  );
}


  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-card rounded-lg p-4 card-elevation flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex-1 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon name="MagnifyingGlassIcon" size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o modelo…"
              className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md focus-ring"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Incluir inactivos
          </label>

          <button
            onClick={loadProducts}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 rounded-md transition-smooth focus-ring"
          >
            <Icon name="ArrowPathIcon" size={18} />
            Actualizar
          </button>
        </div>

        <Link
          href="/admin-dashboard/inventory/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-smooth focus-ring"
        >
          <Icon name="PlusIcon" size={18} />
          Agregar producto
        </Link>
      </div>

      {/* Content */}
      {errorMsg ? (
        <div className="bg-card rounded-lg p-6 card-elevation">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">Error</h3>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      ) : null}

      <div className="bg-card rounded-lg p-4 card-elevation">
        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <ProductTable
            products={rows}
            onEdit={(id) => router.push(`/admin-dashboard/inventory/${id}`)}
            onDeactivate={onDeactivate}
          />
        )}
      </div>
    </div>
  );
}
