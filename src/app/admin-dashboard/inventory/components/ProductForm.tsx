'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type Mode = 'create' | 'edit';

// Tipo simple para el selector de addons
type SimpleProduct = { id: string; name: string };

type ProductPayload = {
  name: string;
  model: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  gallery: string[];
  video_url: string | null;
  stock_count: number;
  features: string[];
  badge: string | null;
  is_active: boolean;
  // Nuevos campos
  colors: { name: string; hex: string }[];
  addon_ids: string[];
  show_on_home: boolean; // <--- NUEVO CAMPO
};

// --- Componente Auxiliar para Subir Imagen ---
const ImageUploader = ({ 
  onUpload, 
  previewUrl, 
  label, 
  onRemove 
}: { 
  onUpload: (file: File) => Promise<void>; 
  previewUrl?: string; 
  label: string;
  onRemove?: () => void;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      await onUpload(e.target.files[0]);
    } catch (error) {
      alert('Error al subir imagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm group">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {previewUrl ? (
        <div className="relative aspect-square bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          {onRemove && (
            <button 
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors"
              title="Eliminar imagen"
            >
              <Icon name="TrashIcon" size={16} />
            </button>
          )}
        </div>
      ) : (
        <label className={`aspect-square bg-gray-50 rounded-lg border-2 border-dashed ${uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'} flex flex-col items-center justify-center cursor-pointer transition-colors relative`}>
          {uploading ? (
             <div className="animate-pulse flex flex-col items-center">
                <Icon name="ArrowPathIcon" size={32} className="text-blue-500 animate-spin" />
                <span className="text-xs text-blue-600 mt-2 font-medium">Subiendo...</span>
             </div>
          ) : (
             <>
                <Icon name="PhotoIcon" size={40} className="text-gray-300" />
                <span className="text-xs text-gray-500 mt-2 font-medium">Click para subir imagen</span>
                <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP</span>
             </>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

// --- Funciones Helpers ---
async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function parseFeaturesFromTextarea(v: string) {
  return v.split('\n').map((x) => x.trim()).filter(Boolean);
}

function featuresToTextarea(arr: string[] | null | undefined) {
  return (arr || []).join('\n');
}

// Genera un nombre de archivo único para evitar colisiones
function generateFileName(originalName: string) {
    const fileExt = originalName.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    return fileName;
}

// --- Componente Principal ---
export default function ProductForm({ mode, productId }: { mode: Mode; productId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Estados de carga y feedback
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  // Datos auxiliares
  const [allProducts, setAllProducts] = useState<SimpleProduct[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Estado del formulario
  const [form, setForm] = useState<ProductPayload>({
    name: '',
    model: '',
    description: '',
    price: 0,
    original_price: null,
    image_url: '',
    gallery: [],
    video_url: null,
    stock_count: 0,
    features: [],
    badge: null,
    is_active: true,
    colors: [],
    addon_ids: [],
    show_on_home: true, // <--- INICIALIZAR EN TRUE
  });

  const [featuresText, setFeaturesText] = useState('');

  // --- LÓGICA DE SUBIDA A SUPABASE (Multimedia) ---
  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);
    // 1. Subir al bucket 'products'
    const { error } = await supabase.storage
        .from('products')
        .upload(fileName, file);

    if (error) throw error;

    // 2. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleMainImageUpload = async (file: File) => {
      const url = await uploadToSupabase(file);
      setForm(prev => ({ ...prev, image_url: url }));
  };

  const handleGalleryImageUpload = async (file: File) => {
      const url = await uploadToSupabase(file);
      setForm(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
  };
  // -----------------------------------

  // --- LÓGICA DE COLORES Y ADDONS ---
  const handleAddColor = () => {
    if (!newColorName) return;
    setForm(s => ({ ...s, colors: [...s.colors, { name: newColorName, hex: newColorHex }] }));
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const removeColor = (idx: number) => {
    setForm(s => ({ ...s, colors: s.colors.filter((_, i) => i !== idx) }));
  };

  const toggleAddon = (id: string) => {
    setForm(s => {
        const exists = s.addon_ids.includes(id);
        return {
            ...s,
            addon_ids: exists ? s.addon_ids.filter(x => x !== id) : [...s.addon_ids, id]
        };
    });
  };
  // -----------------------------------

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

  // Cargar producto individual (modo edición)
  async function loadProduct() {
    if (!productId) return;
    setLoading(true);
    setErrorMsg('');

    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      setErrorMsg('No hay sesión activa.');
      return;
    }

    const res = await fetch(`/api/admin/products?id=${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      setLoading(false);
      setErrorMsg('No se pudo cargar el producto.');
      return;
    }

    const data = await res.json();
    const p = data.product;

    setForm({
      name: p.name || '',
      model: p.model || '',
      description: p.description || '',
      price: Number(p.price || 0),
      original_price: p.original_price ? Number(p.original_price) : null,
      image_url: p.image_url || '',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      video_url: p.video_url || null,
      stock_count: Number(p.stock_count || 0),
      features: Array.isArray(p.features) ? p.features : [],
      badge: p.badge || null,
      is_active: Boolean(p.is_active),
      colors: Array.isArray(p.colors) ? p.colors : [],
      addon_ids: Array.isArray(p.addon_ids) ? p.addon_ids : [],
      show_on_home: p.show_on_home !== undefined ? Boolean(p.show_on_home) : true, // <--- CARGAR CAMPO
    });
    setFeaturesText(featuresToTextarea(Array.isArray(p.features) ? p.features : []));
    setLoading(false);
  }

  // Cargar todos los productos (para el selector de addons)
  useEffect(() => {
     const fetchAll = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name')
            .eq('is_active', true);
        if (data) setAllProducts(data);
     };
     fetchAll();
  }, [supabase]);

  // Verificar admin y cargar datos iniciales
  useEffect(() => {
    (async () => {
      if (await guardAdminOrRedirect()) {
        if (mode === 'edit') await loadProduct();
      }
    })();
  }, []);

  async function onSubmit() {
    setSaving(true);
    setErrorMsg('');
    setOkMsg('');

    const token = await getAccessToken();
    if (!token) {
      setSaving(false);
      setErrorMsg('No hay sesión activa.');
      return;
    }

    const payload: ProductPayload = {
      ...form,
      features: parseFeaturesFromTextarea(featuresText),
      price: Number(form.price || 0),
      stock_count: Number(form.stock_count || 0),
      original_price: form.original_price ? Number(form.original_price) : null,
      badge: form.badge?.trim() || null,
      image_url: form.image_url?.trim() || '',
      video_url: form.video_url?.trim() || null,
      gallery: form.gallery.filter(url => url.trim() !== ''),
      name: form.name.trim(),
      model: form.model.trim(),
      description: form.description.trim(),
      // Nuevos campos asegurados
      colors: form.colors,
      addon_ids: form.addon_ids,
      show_on_home: form.show_on_home, // <--- ENVIAR CAMPO
    };

    if (!payload.name || !payload.model || !payload.description || !payload.image_url) {
      setSaving(false);
      setErrorMsg('Faltan datos obligatorios (Nombre, Modelo, Desc, Imagen Ppal).');
      return;
    }

    const url = mode === 'create' 
  ? '/api/admin/products' 
  : `/api/admin/products?id=${productId}`;
  
const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSaving(false);
      setErrorMsg(j?.error || 'Error al guardar.');
      return;
    }

    const j = await res.json();
    setSaving(false);
    setOkMsg('Guardado exitosamente.');

    if (mode === 'create' && j?.product?.id) {
      router.push(`/admin-dashboard/inventory/${j.product.id}`);
    }
  }

  if (loading) return <div className="h-64 bg-muted rounded-lg animate-pulse" />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Sticky */}
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
        <div>
            <h2 className="text-xl font-bold text-gray-800">
                {mode === 'create' ? 'Nuevo Producto' : `Editando: ${form.name}`}
            </h2>
            <p className="text-xs text-muted-foreground">Gestión de inventario, variantes y multimedia</p>
        </div>
        <div className="flex gap-3">
             <Link href="/admin-dashboard/inventory" className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">Cancelar</Link>
             <button 
                onClick={onSubmit} 
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
             >
                {saving ? (
                    <>
                        <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                        Guardando...
                    </>
                ) : (
                    <>
                        <Icon name="CheckIcon" size={16} />
                        Guardar
                    </>
                )}
             </button>
        </div>
      </div>

      {errorMsg && <div className="p-4 rounded-md bg-red-50 text-red-600 border border-red-200 flex items-center gap-2"><Icon name="XMarkIcon" size={20}/> {errorMsg}</div>}
      {okMsg && <div className="p-4 rounded-md bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><Icon name="CheckIcon" size={20}/> {okMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Multimedia */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* 1. Imagen Principal */}
            <ImageUploader 
                label="Imagen Principal (Portada)"
                previewUrl={form.image_url}
                onUpload={handleMainImageUpload}
                onRemove={() => setForm(s => ({ ...s, image_url: '' }))}
            />

            {/* 2. Galería */}
            <div className="bg-white p-5 rounded-lg border shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Galería ({form.gallery.length})</label>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {form.gallery.map((img, idx) => (
                        <div key={idx} className="relative aspect-square border rounded-md overflow-hidden group bg-gray-50">
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => setForm(prev => ({...prev, gallery: prev.gallery.filter((_, i) => i !== idx)}))}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                            >
                                <Icon name="XMarkIcon" size={10} />
                            </button>
                        </div>
                    ))}
                    
                    {/* Botón para subir más */}
                    <div className="relative aspect-square">
                        <ImageUploader 
                             label="" 
                             onUpload={handleGalleryImageUpload}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Video */}
            <div className="bg-white p-5 rounded-lg border shadow-sm">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Video (YouTube/Vimeo)</label>
                 <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-100">
                    <Icon name="VideoCameraIcon" size={18} className="text-gray-400" />
                    <input
                        value={form.video_url || ''}
                        onChange={(e) => setForm(s => ({ ...s, video_url: e.target.value }))}
                        className="flex-1 text-sm outline-none"
                        placeholder="https://youtube.com/..."
                    />
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">Recomendamos usar YouTube para videos largos.</p>
            </div>
        </div>

        {/* COLUMNA DERECHA: Datos */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Info General */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Información del Producto</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm text-gray-600 font-medium">Nombre</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="Ej: SJCAM 4000 WiFi"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm text-gray-600 font-medium">Modelo / SKU</label>
                        <input
                            value={form.model}
                            onChange={(e) => setForm(s => ({ ...s, model: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="Ej: SJ-4000-BLK"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-sm text-gray-600 font-medium">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                            placeholder="Descripción detallada para el cliente..."
                        />
                    </div>
                </div>
            </div>

            {/* Precios e Inventario */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Precios e Inventario</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label className="text-sm text-gray-600 font-medium">Precio (UYU)</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-2 text-gray-500 font-semibold">$</span>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm(s => ({ ...s, price: Number(e.target.value) }))}
                                className="w-full pl-7 px-3 py-2 border rounded-md font-bold text-gray-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 font-medium">Precio Tachado (Antes)</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={form.original_price ?? ''}
                                onChange={(e) => setForm(s => ({ ...s, original_price: e.target.value ? Number(e.target.value) : null }))}
                                className="w-full pl-7 px-3 py-2 border rounded-md text-gray-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-blue-600 font-bold">Stock Disponible</label>
                        <input
                            type="number"
                            value={form.stock_count}
                            onChange={(e) => setForm(s => ({ ...s, stock_count: Number(e.target.value) }))}
                            className="w-full mt-1 px-3 py-2 border-2 border-blue-100 bg-blue-50 rounded-md font-bold text-center text-blue-800 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: Variantes y Adicionales --- */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Variantes y Adicionales</h3>
                
                {/* 1. CONFIGURACIÓN DE COLORES */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colores Disponibles</label>
                    <div className="flex gap-2 mb-3 items-end">
                        <div>
                            <span className="text-xs text-gray-500">Nombre</span>
                            <input 
                                value={newColorName}
                                onChange={e => setNewColorName(e.target.value)}
                                className="block w-32 px-2 py-1 border rounded text-sm" placeholder="Ej: Negro" 
                            />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Color</span>
                            <input 
                                type="color"
                                value={newColorHex}
                                onChange={e => setNewColorHex(e.target.value)}
                                className="block w-12 h-8 p-0 border rounded cursor-pointer" 
                            />
                        </div>
                        <button type="button" onClick={handleAddColor} className="px-3 py-1 bg-gray-800 text-white rounded text-sm h-8 hover:bg-gray-900">Agregar</button>
                    </div>
                    
                    {/* Lista de colores agregados */}
                    <div className="flex flex-wrap gap-2">
                        {form.colors.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: c.hex }} />
                                <span className="text-sm">{c.name}</span>
                                <button onClick={() => removeColor(idx)} className="text-red-500 ml-1 hover:text-red-700"><Icon name="XMarkIcon" size={14}/></button>
                            </div>
                        ))}
                        {form.colors.length === 0 && <span className="text-xs text-gray-400">Sin colores definidos.</span>}
                    </div>
                </div>

                <div className="border-t my-4" />

                {/* 2. CONFIGURACIÓN DE ADICIONALES (Add-ons) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Productos Adicionales "You might also like"
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Selecciona qué otros productos se ofrecen como accesorio en la ficha de este producto.</p>
                    
                    <div className="h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 space-y-1">
                        {allProducts.filter(p => p.id !== productId).map(prod => (
                            <label key={prod.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={form.addon_ids.includes(prod.id)}
                                    onChange={() => toggleAddon(prod.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{prod.name}</span>
                            </label>
                        ))}
                        {allProducts.length === 0 && <div className="p-2 text-sm text-gray-400">No hay otros productos activos disponibles.</div>}
                    </div>
                </div>
            </div>

            {/* Extras */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-2">Detalles Adicionales</h3>
                
                <div>
                    <label className="text-sm text-gray-600 font-medium">Características (Bullet Points)</label>
                    <textarea
                        value={featuresText}
                        onChange={(e) => setFeaturesText(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px] text-sm bg-gray-50 font-mono"
                        placeholder="• 4K Ultra HD&#10;• WiFi Integrado&#10;• Sumergible 30m"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Escribe una característica por línea.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                        <label className="text-sm text-gray-600 font-medium">Etiqueta (Badge)</label>
                        <input
                            value={form.badge ?? ''}
                            onChange={(e) => setForm(s => ({ ...s, badge: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            placeholder="Ej: OFERTA, NUEVO"
                        />
                    </div>
                    <div className="flex flex-col gap-3 justify-end pt-4">
                        
                        {/* CHECKBOX NUEVO: MOSTRAR EN INICIO */}
                        <div className="flex items-center justify-end">
                            <label className="flex items-center gap-3 cursor-pointer select-none p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full justify-center sm:w-auto">
                                <span className={`text-sm font-bold ${form.show_on_home ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {form.show_on_home ? 'VISIBLE EN HOME' : 'NO MOSTRAR EN HOME'}
                                </span>
                                <div className={`relative w-12 h-6 rounded-full transition-colors ${form.show_on_home ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.show_on_home ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={form.show_on_home} 
                                    onChange={(e) => setForm(s => ({ ...s, show_on_home: e.target.checked }))} 
                                />
                            </label>
                        </div>

                        {/* CHECKBOX ORIGINAL: PRODUCTO PUBLICADO */}
                        <div className="flex items-center justify-end">
                            <label className="flex items-center gap-3 cursor-pointer select-none p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full justify-center sm:w-auto">
                                <span className={`text-sm font-bold ${form.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                    {form.is_active ? 'VISIBLE EN TIENDA' : 'OCULTO (Borrador)'}
                                </span>
                                <div className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={form.is_active} 
                                    onChange={(e) => setForm(s => ({ ...s, is_active: e.target.checked }))} 
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}