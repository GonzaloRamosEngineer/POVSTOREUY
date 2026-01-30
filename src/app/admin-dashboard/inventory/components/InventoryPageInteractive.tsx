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

    // Construimos la query para la API
    // (Nota: Si tu API filtra por 'q', bien. Si no, filtraremos en cliente o ajustamos la API).
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('includeInactive', includeInactive ? 'true' : 'false');

    // Opción A: Usar la API existente (si soporta los campos nuevos)
    // Opción B: Consulta directa a Supabase aquí (más flexible para dashboard)
    
    // Vamos a usar consulta directa a Supabase para garantizar que traemos image_url y colors
    // sin depender de si la API /api/admin/products fue actualizada o no.
    
    let query = supabase
      .from('products')
      // 👇 AQUÍ ESTÁ LA CLAVE: Pedimos image_url y colors
      .select('id, name, model, price, original_price, stock_count, is_active, updated_at, image_url, colors')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (q.trim()) {
      // Búsqueda simple por nombre o modelo
      query = query.or(`name.ilike.%${q.trim()}%,model.ilike.%${q.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setLoading(false);
      setErrorMsg('Error al cargar productos desde Supabase.');
      return;
    }

    // Mapeamos para asegurar que colors sea un array válido (defensivo)
    const safeRows: ProductRow[] = (data || []).map((p: any) => ({
        ...p,
        // Aseguramos que colors sea un array, por si viene null de la DB
        colors: Array.isArray(p.colors) ? p.colors : [],
        // Aseguramos stock_status (calculado al vuelo)
        stock_status: p.stock_count === 0 ? 'Sin stock' : p.stock_count <= 5 ? 'Bajo stock' : 'En stock'
    }));

    setRows(safeRows);
    setLoading(false);
  }

  async function onDeactivate(id: string) {
    const token = await getAccessToken();
    if (!token) return;

    // Para desactivar, podemos usar la API o Supabase directo.
    // Usamos la API para mantener la lógica de negocio si la hay.
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: 'DELETE', // O PATCH { is_active: false } dependiendo de tu API
      headers: { Authorization: `Bearer ${token}` },
    });

    // Si tu API usa DELETE para borrar físico, cuidado.
    // Si usa DELETE para soft-delete (is_active=false), está bien.
    // Voy a asumir que quieres cambiar el estado is_active.
    
    /* NOTA: Si tu endpoint DELETE borra el registro, úsalo.
       Si quieres hacer toggle (activar/desactivar), mejor haz un update directo aquí:
    */
    
    const product = rows.find(r => r.id === id);
    if (!product) return;

    const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', id);

    if (error) {
        alert('Error al actualizar estado');
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
  }, [q, includeInactive]); // Recargar si cambian los filtros

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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
        <div className="bg-card rounded-lg p-6 card-elevation border-l-4 border-red-500">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Error</h3>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      ) : null}

      <div className="bg-card rounded-lg p-4 card-elevation">
        {loading ? (
          <div className="space-y-4">
              <div className="h-12 bg-muted rounded-lg animate-pulse" />
              <div className="h-12 bg-muted rounded-lg animate-pulse" />
              <div className="h-12 bg-muted rounded-lg animate-pulse" />
          </div>
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