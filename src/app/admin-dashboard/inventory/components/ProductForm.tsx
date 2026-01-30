'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type Mode = 'create' | 'edit';

type SimpleProduct = { id: string; name: string };

// Tipos para los campos JSON complejos
type StoryBlock = 
  | { type: 'full_video'; video_url: string; title?: string; subtitle?: string; text_color?: 'light'|'dark' }
  | { type: 'image_left'; image_url: string; title: string; description: string }
  | { type: 'image_right'; image_url: string; title: string; description: string }
  | { type: 'banner'; image_url: string; title?: string; text_color?: 'light'|'dark' };

type TechSpec = { label: string; value: string };
type FAQItem = { question: string; answer: string };

// Variante de color
type ColorVariant = {
  id: string;
  name: string;
  hex: string;
  images: string[];
  stock: number;
};

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
  features: string[]; // Bullet points simples
  badge: string | null;
  is_active: boolean;
  colors: ColorVariant[];
  addon_ids: string[];
  show_on_home: boolean;
  // Nuevos campos JSON
  story_content: StoryBlock[];
  tech_specs: Record<string, string>; // Se guarda como objeto en DB
  faq_content: FAQItem[];
};

// --- Componente Auxiliar: Uploader ---
const ImageUploader = ({ 
  onUpload, previewUrl, label, onRemove 
}: { 
  onUpload: (file: File) => Promise<void>; 
  previewUrl?: string; label: string; onRemove?: () => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try { await onUpload(e.target.files[0]); } 
    catch (error) { console.error(error); alert('Error al subir'); } 
    finally { setUploading(false); }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group h-full">
      {label && <label className="block text-xs font-bold uppercase text-gray-500 mb-2">{label}</label>}
      {previewUrl ? (
        <div className="relative w-full aspect-square bg-gray-50 rounded-md overflow-hidden border border-gray-100">
          {previewUrl.endsWith('.mp4') ? (
             <video src={previewUrl} className="w-full h-full object-cover" muted />
          ) : (
             <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          )}
          {onRemove && (
            <button onClick={onRemove} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition-colors">
              <Icon name="TrashIcon" size={14} />
            </button>
          )}
        </div>
      ) : (
        <label className={`w-full aspect-square rounded-md border-2 border-dashed ${uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'} flex flex-col items-center justify-center cursor-pointer transition-colors`}>
          {uploading ? <Icon name="ArrowPathIcon" size={24} className="text-blue-500 animate-spin" /> : <Icon name="PhotoIcon" size={32} className="text-gray-300" />}
          <input type="file" accept="image/*,video/mp4" onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
};

// --- Helpers ---
function generateFileName(originalName: string) {
    const fileExt = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
}
function parseFeatures(v: string) { return v.split('\n').map(x => x.trim()).filter(Boolean); }
function stringifyFeatures(arr: string[]) { return (arr || []).join('\n'); }

// --- COMPONENTE PRINCIPAL ---
export default function ProductForm({ mode, productId }: { mode: Mode; productId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Estados Globales
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [allProducts, setAllProducts] = useState<SimpleProduct[]>([]);

  // Estado del Formulario
  const [form, setForm] = useState<ProductPayload>({
    name: '', model: '', description: '', price: 0, original_price: null,
    image_url: '', gallery: [], video_url: null, stock_count: 0,
    features: [], badge: null, is_active: true, colors: [], addon_ids: [], show_on_home: true,
    story_content: [], tech_specs: {}, faq_content: []
  });
  
  const [featuresText, setFeaturesText] = useState(''); // Bullet points simples
  
  // Estados para editores complejos
  const [specsList, setSpecsList] = useState<TechSpec[]>([]); // Array temporal para editar specs
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);

  // --- SUBIDA DE ARCHIVOS ---
  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- LOGICA STORY BUILDER ---
  const addStoryBlock = (type: StoryBlock['type']) => {
    const newBlock: any = { type };
    if (type === 'full_video') { newBlock.video_url = ''; newBlock.title = ''; }
    else { newBlock.image_url = ''; newBlock.title = ''; newBlock.description = ''; }
    setForm(s => ({ ...s, story_content: [...s.story_content, newBlock] }));
  };

  const updateStoryBlock = (idx: number, field: string, value: string) => {
    setForm(s => {
        const newStory = [...s.story_content];
        (newStory[idx] as any)[field] = value;
        return { ...s, story_content: newStory };
    });
  };

  const removeStoryBlock = (idx: number) => {
    setForm(s => ({ ...s, story_content: s.story_content.filter((_, i) => i !== idx) }));
  };

  // --- LOGICA TECH SPECS ---
  const addSpec = () => setSpecsList([...specsList, { label: '', value: '' }]);
  const updateSpec = (idx: number, field: 'label'|'value', val: string) => {
      const newList = [...specsList];
      newList[idx][field] = val;
      setSpecsList(newList);
  };
  const removeSpec = (idx: number) => setSpecsList(specsList.filter((_, i) => i !== idx));

  // --- LOGICA FAQ ---
  const addFAQ = () => setForm(s => ({ ...s, faq_content: [...s.faq_content, { question: '', answer: '' }] }));
  const updateFAQ = (idx: number, field: 'question'|'answer', val: string) => {
      setForm(s => {
          const newFAQ = [...s.faq_content];
          newFAQ[idx][field] = val;
          return { ...s, faq_content: newFAQ };
      });
  };
  const removeFAQ = (idx: number) => setForm(s => ({ ...s, faq_content: s.faq_content.filter((_, i) => i !== idx) }));

  // --- MANEJADORES VARIANTES (Ya existentes) ---
  const addVariant = () => {
    if (!newColorName) return;
    const newVariant: ColorVariant = { id: Math.random().toString(36).substr(2, 9), name: newColorName, hex: newColorHex, images: [], stock: 0 };
    setForm(s => ({ ...s, colors: [...s.colors, newVariant] }));
    setNewColorName(''); setNewColorHex('#000000');
  };
  const removeVariant = (idx: number) => {
    setForm(s => ({ ...s, colors: s.colors.filter((_, i) => i !== idx) }));
    if (editingVariantIndex === idx) setEditingVariantIndex(null);
  };
  const updateVariantStock = (val: number, idx: number) => {
      setForm(s => {
          const newColors = [...s.colors];
          newColors[idx].stock = val;
          const totalStock = newColors.reduce((acc, c) => acc + c.stock, 0);
          return { ...s, colors: newColors, stock_count: totalStock > 0 ? totalStock : s.stock_count };
      });
  };
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIdx: number) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const urls: string[] = [];
    for (const file of files) { try { urls.push(await uploadToSupabase(file)); } catch (err) { console.error(err); } }
    setForm(s => {
        const newColors = [...s.colors];
        newColors[variantIdx].images = [...newColors[variantIdx].images, ...urls];
        return { ...s, colors: newColors };
    });
    e.target.value = '';
  };
  const toggleAddon = (id: string) => {
    setForm(s => {
        const exists = s.addon_ids.includes(id);
        return { ...s, addon_ids: exists ? s.addon_ids.filter(x => x !== id) : [...s.addon_ids, id] };
    });
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    (async () => {
        const { data: prods } = await supabase.from('products').select('id, name').eq('is_active', true);
        if (prods) setAllProducts(prods);

        if (mode === 'edit' && productId) {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) { router.push('/admin-login'); return; }
            
            const res = await fetch(`/api/admin/products?id=${productId}`, {
                headers: { Authorization: `Bearer ${session.session.access_token}` }
            });
            if (res.ok) {
                const { product: p } = await res.json();
                
                // Parsear tech_specs de Objeto a Array para el editor
                const loadedSpecs = p.tech_specs 
                    ? Object.entries(p.tech_specs).map(([k, v]) => ({ label: k, value: String(v) }))
                    : [];

                setForm({
                    ...p,
                    price: Number(p.price),
                    stock_count: Number(p.stock_count),
                    original_price: p.original_price ? Number(p.original_price) : null,
                    gallery: p.gallery || [],
                    features: p.features || [],
                    colors: Array.isArray(p.colors) ? p.colors : [],
                    addon_ids: p.addon_ids || [],
                    show_on_home: p.show_on_home ?? true,
                    story_content: Array.isArray(p.story_content) ? p.story_content : [],
                    faq_content: Array.isArray(p.faq_content) ? p.faq_content : [],
                    tech_specs: p.tech_specs || {}
                });
                setFeaturesText(stringifyFeatures(p.features));
                setSpecsList(loadedSpecs);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    })();
  }, []);

  // --- GUARDAR ---
  const onSubmit = async () => {
      setSaving(true); setErrorMsg('');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      let finalStock = form.stock_count;
      if (form.colors.length > 0) {
          const variantStock = form.colors.reduce((acc, c) => acc + (c.stock || 0), 0);
          if (variantStock > 0) finalStock = variantStock;
      }

      // Convertir Array de Specs a Objeto para guardar
      const specsObject = specsList.reduce((acc, item) => {
          if (item.label && item.value) acc[item.label] = item.value;
          return acc;
      }, {} as Record<string, string>);

      const payload = {
          ...form,
          stock_count: finalStock,
          features: parseFeatures(featuresText),
          tech_specs: specsObject,
      };

      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products?id=${productId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${session.session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!res.ok) {
          const err = await res.json();
          setErrorMsg(err.error || 'Error al guardar');
          setSaving(false);
      } else {
          router.push('/admin-dashboard/inventory');
      }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Icon name="ArrowPathIcon" size={32} className="animate-spin text-gray-400"/></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      {/* HEADER */}
      <div className="sticky top-0 bg-white/95 backdrop-blur z-20 py-4 border-b flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{mode === 'create' ? 'Crear Producto' : 'Editar Producto'}</h1>
            <p className="text-sm text-gray-500">Gestión completa de contenido, inventario e historia.</p>
        </div>
        <div className="flex gap-3">
            <Link href="/admin-dashboard/inventory" className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">Cancelar</Link>
            <button onClick={onSubmit} disabled={saving} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                {saving ? 'Guardando...' : 'Guardar Producto'}
            </button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">{errorMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA (Multimedia General) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">Foto de Portada</h3>
                <ImageUploader 
                    label="" 
                    previewUrl={form.image_url} 
                    onUpload={async (f) => { const url = await uploadToSupabase(f); setForm(s => ({...s, image_url: url})) }} 
                    onRemove={() => setForm(s => ({...s, image_url: ''}))}
                />
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">Galería General</h3>
                <div className="grid grid-cols-3 gap-2 mt-3">
                    {form.gallery.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-gray-50 group">
                            <img src={url} className="w-full h-full object-cover" />
                            <button onClick={() => setForm(s => ({...s, gallery: s.gallery.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon name="XMarkIcon" size={10} />
                            </button>
                        </div>
                    ))}
                    <div className="aspect-square">
                        <ImageUploader label="" onUpload={async (f) => { const url = await uploadToSupabase(f); setForm(s => ({...s, gallery: [...s.gallery, url]})) }} />
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA CENTRAL (Datos y Story) */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Info Básica */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Nombre</label><input value={form.name} onChange={e => setForm(s => ({...s, name: e.target.value}))} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium mb-1">Modelo/SKU</label><input value={form.model} onChange={e => setForm(s => ({...s, model: e.target.value}))} className="w-full p-2 border rounded-md" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Descripción Corta</label><textarea value={form.description} onChange={e => setForm(s => ({...s, description: e.target.value}))} className="w-full p-2 border rounded-md h-24" /></div>
                <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Precio</label><input type="number" value={form.price} onChange={e => setForm(s => ({...s, price: Number(e.target.value)}))} className="w-full p-2 border rounded-md font-bold" /></div>
                    <div><label className="block text-sm font-medium mb-1">Precio Tachado</label><input type="number" value={form.original_price || ''} onChange={e => setForm(s => ({...s, original_price: e.target.value ? Number(e.target.value) : null}))} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium mb-1 text-gray-500">Stock (Calc)</label><input disabled value={form.stock_count} className="w-full p-2 border rounded-md bg-gray-100 text-center" /></div>
                </div>
            </div>

            {/* 2. VARIANTES */}
            <div className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Variantes de Color</h3>
                </div>
                <div className="flex items-end gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div><label className="text-xs font-bold uppercase text-gray-500">Nombre</label><input value={newColorName} onChange={e => setNewColorName(e.target.value)} className="w-32 p-2 border rounded-md text-sm" placeholder="Ej: Blanco" /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500">Hex</label><input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-10 h-9 p-0 border rounded cursor-pointer" /></div>
                    <button onClick={addVariant} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Agregar</button>
                </div>
                <div className="space-y-4">
                    {form.colors.map((color, idx) => (
                        <div key={color.id || idx} className={`border rounded-lg overflow-hidden transition-all ${editingVariantIndex === idx ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="flex items-center justify-between p-3 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                                    <span className="font-bold text-gray-800">{color.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${color.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Stock: {color.stock}</span>
                                    <span className="text-xs text-gray-400">{color.images.length} fotos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingVariantIndex(editingVariantIndex === idx ? null : idx)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium">
                                        {editingVariantIndex === idx ? 'Cerrar' : 'Gestionar'}
                                    </button>
                                    <button onClick={() => removeVariant(idx)} className="text-gray-400 hover:text-red-600 p-2"><Icon name="TrashIcon" size={18} /></button>
                                </div>
                            </div>
                            {editingVariantIndex === idx && (
                                <div className="p-4 bg-gray-50 border-t space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock</label>
                                        <input type="number" value={color.stock} onChange={e => updateVariantStock(Number(e.target.value), idx)} className="w-32 p-2 border rounded-md font-mono font-bold" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="block text-xs font-bold text-gray-700 uppercase">Galería {color.name}</label>
                                            <label className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center gap-1">
                                                <Icon name="PlusIcon" size={14} /> Agregar Fotos
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(e, idx)} />
                                            </label>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {color.images.map((img, imgIdx) => (
                                                <div key={imgIdx} className="relative w-20 h-20 rounded-md overflow-hidden border bg-white group">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button onClick={() => { const newColors = [...form.colors]; newColors[idx].images = newColors[idx].images.filter((_, i) => i !== imgIdx); setForm(s => ({...s, colors: newColors})); }} className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Icon name="XMarkIcon" size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. HISTORIA VISUAL (Nuevo Editor de Bloques) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Historia Visual ("Apple Style")</h3>
                    <div className="flex gap-2">
                        <button onClick={() => addStoryBlock('full_video')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium">+ Video Full</button>
                        <button onClick={() => addStoryBlock('image_left')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium">+ Img Izq</button>
                        <button onClick={() => addStoryBlock('image_right')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium">+ Img Der</button>
                    </div>
                </div>
                <div className="space-y-6">
                    {form.story_content.map((block, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50 relative group">
                            <button onClick={() => removeStoryBlock(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Icon name="TrashIcon" size={16}/></button>
                            <span className="text-xs font-bold uppercase text-blue-600 mb-2 block">{block.type.replace('_', ' ')}</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Media URL (Video/Imagen)</label>
                                    <div className="flex gap-2">
                                        <input value={block.type === 'full_video' ? (block as any).video_url : (block as any).image_url} onChange={(e) => updateStoryBlock(idx, block.type === 'full_video' ? 'video_url' : 'image_url', e.target.value)} className="flex-1 p-2 border rounded-md text-sm" placeholder="https://..." />
                                        <div className="w-10 h-10 relative">
                                            <ImageUploader label="" onUpload={async (f) => { const url = await uploadToSupabase(f); updateStoryBlock(idx, block.type === 'full_video' ? 'video_url' : 'image_url', url); }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <input value={block.title || ''} onChange={(e) => updateStoryBlock(idx, 'title', e.target.value)} className="w-full p-2 border rounded-md text-sm font-bold" placeholder="Título del Bloque" />
                                    {block.type !== 'full_video' && (
                                        <textarea value={(block as any).description || ''} onChange={(e) => updateStoryBlock(idx, 'description', e.target.value)} className="w-full p-2 border rounded-md text-sm h-20" placeholder="Descripción..." />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {form.story_content.length === 0 && <p className="text-sm text-gray-400 italic text-center">No hay bloques de historia. Agrega uno para empezar.</p>}
                </div>
            </div>

            {/* 4. ESPECIFICACIONES TÉCNICAS (Nuevo Editor Key-Value) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Especificaciones Técnicas (Comparador)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specsList.map((spec, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input value={spec.label} onChange={(e) => updateSpec(idx, 'label', e.target.value)} className="w-1/3 p-2 border rounded-md text-sm bg-gray-50" placeholder="Ej: Batería" />
                            <input value={spec.value} onChange={(e) => updateSpec(idx, 'value', e.target.value)} className="flex-1 p-2 border rounded-md text-sm" placeholder="Ej: 120 min" />
                            <button onClick={() => removeSpec(idx)} className="text-gray-400 hover:text-red-500"><Icon name="XMarkIcon" size={16}/></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addSpec} className="text-sm text-blue-600 hover:underline font-medium">+ Agregar Especificación</button>
            </div>

            {/* 5. PREGUNTAS FRECUENTES (FAQ) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Preguntas Frecuentes (FAQ)</h3>
                <div className="space-y-4">
                    {form.faq_content.map((faq, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-gray-50 relative group">
                            <button onClick={() => removeFAQ(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Icon name="XMarkIcon" size={14}/></button>
                            <input value={faq.question} onChange={(e) => updateFAQ(idx, 'question', e.target.value)} className="w-full p-2 border rounded-md text-sm font-bold mb-2" placeholder="Pregunta" />
                            <textarea value={faq.answer} onChange={(e) => updateFAQ(idx, 'answer', e.target.value)} className="w-full p-2 border rounded-md text-sm" placeholder="Respuesta" />
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addFAQ} className="text-sm text-blue-600 hover:underline font-medium">+ Agregar Pregunta</button>
            </div>

            {/* 6. EXTRAS (Bullet Points Simples + Addons) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Extras</h3>
                <div>
                    <label className="text-sm font-medium">Características Rápidas (Bullet Points)</label>
                    <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} className="w-full p-2 border rounded-md h-24 font-mono text-sm mt-1" placeholder="Una por línea..." />
                </div>
                <div>
                    <label className="text-sm font-medium mb-2 block">Productos Adicionales (Upselling)</label>
                    <div className="h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {allProducts.filter(p => p.id !== productId).map(prod => (
                            <label key={prod.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                                <input type="checkbox" checked={form.addon_ids.includes(prod.id)} onChange={() => toggleAddon(prod.id)} className="rounded border-gray-300 text-blue-600" />
                                <span className="text-sm text-gray-700">{prod.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Producto Publicado</span>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(s => ({...s, is_active: e.target.checked}))} className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700">Mostrar en Homepage</span>
                    <input type="checkbox" checked={form.show_on_home} onChange={e => setForm(s => ({...s, show_on_home: e.target.checked}))} className="w-5 h-5 text-blue-600" />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}