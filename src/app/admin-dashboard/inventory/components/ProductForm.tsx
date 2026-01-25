'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type Mode = 'create' | 'edit';

type ProductPayload = {
  name: string;
  model: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  stock_count: number;
  features: string[]; // json array
  badge: string | null;
  is_active: boolean;
};

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function parseFeaturesFromTextarea(v: string) {
  const lines = v
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  return lines;
}

function featuresToTextarea(arr: string[] | null | undefined) {
  return (arr || []).join('\n');
}

export default function ProductForm({ mode, productId }: { mode: Mode; productId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [form, setForm] = useState<ProductPayload>({
    name: '',
    model: '',
    description: '',
    price: 0,
    original_price: null,
    image_url: '',
    stock_count: 0,
    features: [],
    badge: null,
    is_active: true,
  });

  const [featuresText, setFeaturesText] = useState('');

  async function guardAdminOrRedirect() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/admin-login');
      return false;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      router.push('/admin-login');
      return false;
    }
    return true;
  }

  async function loadProduct() {
    if (!productId) return;
    setLoading(true);
    setErrorMsg('');

    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      setErrorMsg('No hay sesión activa. Iniciá sesión como admin.');
      return;
    }

    const res = await fetch(`/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLoading(false);
      setErrorMsg(j?.error || 'No se pudo cargar el producto.');
      return;
    }

    const data = await res.json();
    const p = data.product;

    setForm({
      name: p.name || '',
      model: p.model || '',
      description: p.description || '',
      price: Number(p.price || 0),
      original_price: p.original_price !== null && p.original_price !== undefined ? Number(p.original_price) : null,
      image_url: p.image_url || '',
      stock_count: Number(p.stock_count || 0),
      features: Array.isArray(p.features) ? p.features : [],
      badge: p.badge || null,
      is_active: Boolean(p.is_active),
    });
    setFeaturesText(featuresToTextarea(Array.isArray(p.features) ? p.features : []));
    setLoading(false);
  }

  async function onSubmit() {
    setSaving(true);
    setErrorMsg('');
    setOkMsg('');

    const token = await getAccessToken();
    if (!token) {
      setSaving(false);
      setErrorMsg('No hay sesión activa. Iniciá sesión como admin.');
      return;
    }

    // construir payload seguro
    const payload: ProductPayload = {
      ...form,
      features: parseFeaturesFromTextarea(featuresText),
      price: Number(form.price || 0),
      stock_count: Number(form.stock_count || 0),
      original_price: form.original_price === null || form.original_price === undefined || form.original_price === ('' as any)
        ? null
        : Number(form.original_price),
      badge: form.badge?.trim() ? form.badge.trim() : null,
      image_url: form.image_url?.trim() || '',
      name: form.name.trim(),
      model: form.model.trim(),
      description: form.description.trim(),
    };

    // validaciones mínimas (las fuertes están en server)
    if (!payload.name || !payload.model || !payload.description || !payload.image_url) {
      setSaving(false);
      setErrorMsg('Completá nombre, modelo, descripción e imagen.');
      return;
    }

    if (payload.original_price !== null && payload.original_price < payload.price) {
      setSaving(false);
      setErrorMsg('original_price no puede ser menor que price.');
      return;
    }

    const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSaving(false);
      setErrorMsg(j?.error || 'No se pudo guardar el producto.');
      return;
    }

    const j = await res.json();
    setSaving(false);
    setOkMsg(mode === 'create' ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.');

    // después de crear, ir a editar
    if (mode === 'create' && j?.product?.id) {
      router.push(`/admin-dashboard/inventory/${j.product.id}`);
      return;
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await guardAdminOrRedirect();
      if (!ok) return;
      if (mode === 'edit') await loadProduct();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="h-64 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="bg-card rounded-lg p-6 card-elevation space-y-6">
      {errorMsg ? (
        <div className="p-4 rounded-md bg-error/10 text-error border border-error/20 text-sm">{errorMsg}</div>
      ) : null}

      {okMsg ? (
        <div className="p-4 rounded-md bg-success/10 text-success border border-success/20 text-sm">{okMsg}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Modelo</label>
            <input
              value={form.model}
              onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Badge (opcional)</label>
            <input
              value={form.badge ?? ''}
              onChange={(e) => setForm((s) => ({ ...s, badge: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
              placeholder="Ej: Más vendido / -25%"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Imagen URL</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm((s) => ({ ...s, image_url: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring min-h-[120px]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Precio (UYU)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Precio original (opcional)</label>
              <input
                type="number"
                value={form.original_price ?? ''}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    original_price: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Stock</label>
            <input
              type="number"
              value={form.stock_count}
              onChange={(e) => setForm((s) => ({ ...s, stock_count: Number(e.target.value) }))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              (Tu trigger ajusta automáticamente <code>stock_status</code> y registra <code>inventory_logs</code>).
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Features (una por línea)</label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus-ring min-h-[120px]"
              placeholder="4K Video&#10;Resistente al agua&#10;Batería 2h"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
            />
            Producto activo (visible en tienda)
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
        <Link
          href="/admin-dashboard/inventory"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 rounded-md transition-smooth focus-ring"
        >
          <Icon name="ArrowLeftIcon" size={18} />
          Volver
        </Link>

        <button
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-smooth focus-ring disabled:opacity-60"
        >
          <Icon name="CheckIcon" size={18} />
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
