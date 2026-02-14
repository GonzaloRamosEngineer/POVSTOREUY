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
  features: string[];
  badge: string | null;
  is_active: boolean;
  colors: ColorVariant[];
  addon_ids: string[];
  show_on_home: boolean;
  story_content: StoryBlock[];
  tech_specs: Record<string, string>;
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
  
  const [featuresText, setFeaturesText] = useState(''); 
  const [specsList, setSpecsList] = useState<TechSpec[]>([]); 
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  const STANDARD_SPECS = [
    'Resolución Máxima', 'Estabilización', 'Resistencia al Agua', 
    'Duración Batería', 'Ángulo de Visión', 'Sensor', 'Conectividad', 'Peso'
  ];

  // --- SUBIDA DE ARCHIVOS ---
  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- LÓGICA DE ORDENAMIENTO DE SPECS ---
  const orderedSpecs = useMemo(() => {
    return [...specsList].sort((a, b) => {
        const aIsStandard = STANDARD_SPECS.includes(a.label);
        const bIsStandard = STANDARD_SPECS.includes(b.label);
        if (aIsStandard && !bIsStandard) return -1;
        if (!aIsStandard && bIsStandard) return 1;
        return 0;
    });
  }, [specsList]);

  // --- ACCIONES DE SPECS ---
  const updateSpec = (realIdx: number, field: 'label'|'value', val: string) => {
      const newList = [...specsList];
      newList[realIdx][field] = val;
      setSpecsList(newList);
  };

  const removeSpec = (realIdx: number) => {
      setSpecsList(specsList.filter((_, i) => i !== realIdx));
  };

  // --- LÓGICA STORY, FAQ Y VARIANTES ---
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

  const addFAQ = () => setForm(s => ({ ...s, faq_content: [...s.faq_content, { question: '', answer: '' }] }));
  const updateFAQ = (idx: number, field: 'question'|'answer', val: string) => {
      setForm(s => {
          const newFAQ = [...s.faq_content];
          newFAQ[idx][field] = val;
          return { ...s, faq_content: newFAQ };
      });
  };
  const removeFAQ = (idx: number) => setForm(s => ({ ...s, faq_content: s.faq_content.filter((_, i) => i !== idx) }));

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
          const totalStock = newColors.reduce((acc, c) => acc + (c.stock || 0), 0);
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
  }, [productId, mode, supabase, router]);

  // --- GUARDAR ---
  const onSubmit = async () => {
      setSaving(true); setErrorMsg('');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const specsObject = specsList.reduce((acc, item) => {
          if (item.label && item.value) acc[item.label] = item.value;
          return acc;
      }, {} as Record<string, string>);

      const payload = {
          ...form,
          stock_count: form.colors.length > 0 ? form.colors.reduce((acc, c) => acc + (c.stock || 0), 0) : form.stock_count,
          features: parseFeatures(featuresText),
          tech_specs: specsObject,
      };

      const res = await fetch(mode === 'create' ? '/api/admin/products' : `/api/admin/products?id=${productId}`, {
          method: mode === 'create' ? 'POST' : 'PATCH',
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
            <p className="text-sm text-gray-500">Gestión de inventario y especificaciones comparativas.</p>
        </div>
        <div className="flex gap-3">
            <Link href="/admin-dashboard/inventory" className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">Cancelar</Link>
            <button onClick={onSubmit} disabled={saving} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar Producto'}
            </button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">{errorMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA (Multimedia) */}
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
                            <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
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

        {/* COLUMNA CENTRAL (Datos y Specs) */}
        <div className="lg:col-span-8 space-y-8">
            
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Nombre</label><input value={form.name} onChange={e => setForm(s => ({...s, name: e.target.value}))} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="block text-sm font-medium mb-1">Modelo</label><input value={form.model} onChange={e => setForm(s => ({...s, model: e.target.value}))} className="w-full p-2 border rounded-md" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Descripción Corta</label><textarea value={form.description} onChange={e => setForm(s => ({...s, description: e.target.value}))} className="w-full p-2 border rounded-md h-24" /></div>
                <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Precio</label><input type="number" value={form.price} onChange={e => setForm(s => ({...s, price: Number(e.target.value)}))} className="w-full p-2 border rounded-md font-bold" /></div>
                    <div><label className="block text-sm font-medium mb-1 text-gray-500">Stock (Calc)</label><input disabled value={form.stock_count} className="w-full p-2 border rounded-md bg-gray-100 text-center" /></div>
                </div>
            </div>

            {/* VARIANTES */}
            <div className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Variantes de Color</h3>
                <div className="flex items-end gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div><label className="text-xs font-bold uppercase text-gray-500">Color</label><input value={newColorName} onChange={e => setNewColorName(e.target.value)} className="w-32 p-2 border rounded-md text-sm" placeholder="Blanco" /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500">Hex</label><input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-10 h-9 p-0 border rounded cursor-pointer" /></div>
                    <button onClick={addVariant} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Agregar</button>
                </div>
                <div className="space-y-4">
                    {form.colors.map((color, idx) => (
                        <div key={color.id || idx} className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                                    <span className="font-bold text-gray-800">{color.name}</span>
                                    <span className="text-xs text-gray-400">Stock: {color.stock}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingVariantIndex(editingVariantIndex === idx ? null : idx)} className="text-blue-600 text-sm font-medium underline">Editar</button>
                                    <button onClick={() => removeVariant(idx)} className="text-gray-400 hover:text-red-600"><Icon name="TrashIcon" size={18} /></button>
                                </div>
                            </div>
                            {editingVariantIndex === idx && (
                                <div className="p-4 bg-gray-50 border-t space-y-4">
                                    <input type="number" value={color.stock} onChange={e => updateVariantStock(Number(e.target.value), idx)} className="w-24 p-2 border rounded-md" />
                                    <label className="block text-xs text-blue-600 cursor-pointer">
                                        + Subir Fotos
                                        <input type="file" multiple className="hidden" onChange={(e) => handleVariantImageUpload(e, idx)} />
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {color.images.map((img, i) => <img key={i} src={img} className="w-12 h-12 object-cover rounded border" alt="" />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. ESPECIFICACIONES TÉCNICAS (Orden Inteligente) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6 border-l-4 border-l-red-600">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon name="ScaleIcon" size={20} className="text-red-600" />
                        Especificaciones del Comparador
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">
                        Ordenado por: Validados primero ↓
                    </p>
                </div>

                {/* Presets Obligatorios */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {STANDARD_SPECS.map((suggestion) => {
                        const exists = specsList.find(s => s.label === suggestion);
                        return (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                    if (!exists) setSpecsList([...specsList, { label: suggestion, value: '' }]);
                                }}
                                className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all border ${
                                    exists 
                                    ? 'bg-red-600 border-red-600 text-white shadow-sm' 
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600'
                                }`}
                            >
                                {exists ? '✓ ' : '+ '} {suggestion}
                            </button>
                        );
                    })}
                </div>

                {/* Lista de Specs con el nuevo orden */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {orderedSpecs.map((spec) => {
                        const isStandard = STANDARD_SPECS.includes(spec.label);
                        const realIdx = specsList.findIndex(s => s === spec);

                        return (
                            <div key={spec.label + realIdx} className={`flex gap-3 items-center p-3 rounded-lg border transition-all ${
                                isStandard ? 'bg-white border-gray-100 shadow-sm' : 'bg-amber-50/50 border-amber-100 italic'
                            }`}>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className={`text-[9px] font-black uppercase absolute -top-2 left-2 px-1 ${
                                            isStandard ? 'text-gray-400 bg-white' : 'text-amber-600 bg-amber-50'
                                        }`}>
                                            {isStandard ? 'Atributo Validado' : '⚠️ Etiqueta Personalizada'}
                                        </label>
                                        <input 
                                            value={spec.label} 
                                            onChange={(e) => updateSpec(realIdx, 'label', e.target.value)} 
                                            className={`w-full p-2 border rounded-md text-sm font-bold outline-none ${
                                                isStandard ? 'border-gray-100' : 'border-amber-200 focus:ring-amber-400'
                                            }`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className={`text-[9px] font-black uppercase absolute -top-2 left-2 px-1 ${
                                            isStandard ? 'text-gray-400 bg-white' : 'text-amber-600 bg-amber-50'
                                        }`}>
                                            Valor
                                        </label>
                                        <input 
                                            value={spec.value} 
                                            onChange={(e) => updateSpec(realIdx, 'value', e.target.value)} 
                                            className="w-full p-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-red-500 outline-none" 
                                            placeholder="Completar dato..."
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => removeSpec(realIdx)} 
                                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                >
                                    <Icon name="TrashIcon" size={18}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* OTROS SECCIONES (STORY, FAQ, EXTRAS) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Preguntas Frecuentes</h3>
                {form.faq_content.map((faq, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded relative">
                        <button onClick={() => removeFAQ(idx)} className="absolute top-2 right-2 text-gray-400"><Icon name="XMarkIcon" size={14}/></button>
                        <input value={faq.question} onChange={e => updateFAQ(idx, 'question', e.target.value)} className="w-full p-2 border rounded mb-2 text-sm" placeholder="Pregunta" />
                        <textarea value={faq.answer} onChange={e => updateFAQ(idx, 'answer', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Respuesta" />
                    </div>
                ))}
                <button onClick={addFAQ} className="text-blue-600 text-sm font-medium">+ Agregar FAQ</button>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm(s => ({...s, is_active: e.target.checked}))}/> Activo</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.show_on_home} onChange={e => setForm(s => ({...s, show_on_home: e.target.checked}))}/> Ver en Home</label>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}