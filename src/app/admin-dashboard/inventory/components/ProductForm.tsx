'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { adminFetch, AdminFetchError } from '@/lib/api/adminFetch';
import { toast } from 'react-hot-toast';
import { computePackEffectiveStock, buildProductsLookup } from '@/lib/packs/computePackStock';

type Mode = 'create' | 'edit';
type SimpleProduct = { id: string; name: string; stock_count?: number | null; is_active?: boolean };

type StoryBlock =
| { type: 'full_video'; video_url: string; title?: string; subtitle?: string; text_color?: 'light' | 'dark' }
| { type: 'image_left'; image_url: string; title: string; description: string }
| { type: 'image_right'; image_url: string; title: string; description: string }
| { type: 'banner'; image_url: string; title?: string; text_color?: 'light' | 'dark' };

type TechSpec = { label: string; value: string };
type FAQItem = { question: string; answer: string };

type ColorVariant = {
id: string;
name: string;
hex: string;
images: string[];
stock: number;
};

type PackBadge = {
text: string;
variant: 'red' | 'green' | 'orange' | 'blue';
};

type PackComponentRole = 'primary' | 'component';

type ProductPackComponent = {
id: string;
product_id: string;
quantity: number;
role: PackComponentRole;
};

type ProductPack = {
id: string;
name: string;
tagline: string;
price: number;
original_price: number | null;
cash_price: number | null; // NUEVO: Precio Transferencia del KIT
card_price: number | null; // NUEVO: Precio Tarjeta del KIT
includes: string[];
images: string[];
show_on_home?: boolean;
featured_in_menu?: boolean;
stock?: number;
badge?: PackBadge;

// Contrato packs (2B.2 base): estado/modelo interno
status?: 'draft' | 'active' | string;
is_active?: boolean;
publicable?: boolean;
version?: number | null;
components?: ProductPackComponent[];
};

type ProductReview = {
id: string;
customer_name_manual: string;
rating: number;
review_text: string;
is_verified_purchase: boolean;
review_images_gallery: string[];
};

type ProductPayload = {
name: string;
slug: string;
model: string;
description: string;
price: number;
original_price: number | null;
cash_price: number | null;
card_price: number | null;
image_url: string;
gallery: string[];
video_url: string | null;
stock_count: number;
features: string[];
badge: string | null;
is_active: boolean;
is_outlet: boolean;
is_accessory: boolean;
colors: ColorVariant[];
addon_ids: string[];
show_on_home: boolean;
story_content: StoryBlock[];
tech_specs: Record<string, string>;
faq_content: FAQItem[];
packs: ProductPack[];
reviews: ProductReview[];
shipping_info: string;
warranty_info: string;
payment_info: string;
};

function normalizePackForForm(rawPack: any): ProductPack {
const badge =
    typeof rawPack?.badge === 'string'
    ? { text: rawPack.badge, variant: 'red' as const }
    : rawPack?.badge && typeof rawPack.badge === 'object'
        ? {
            text: String(rawPack.badge.text || ''),
            variant: ['red', 'green', 'orange', 'blue'].includes(String(rawPack.badge.variant))
            ? (rawPack.badge.variant as PackBadge['variant'])
            : 'red',
        }
        : { text: '', variant: 'red' as const };

const normalizedComponents: ProductPackComponent[] = Array.isArray(rawPack?.components)
    ? rawPack.components
        .map((c: any, idx: number) => {
        const productId = String(c?.product_id || '').trim();
        const role: PackComponentRole = c?.role === 'primary' ? 'primary' : 'component';
        const quantityRaw = Number(c?.quantity ?? 1);
        const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.trunc(quantityRaw) : 1;
        if (!productId) return null;
        return {
            id: String(c?.id || `cmp-${idx}-${productId}`),
            product_id: productId,
            quantity,
            role,
        };
        })
        .filter(Boolean) as ProductPackComponent[]
    : [];

const versionRaw = rawPack?.version;
const version = versionRaw == null || versionRaw === '' ? null : Number.isFinite(Number(versionRaw)) ? Math.trunc(Number(versionRaw)) : null;

return {
    id: String(rawPack?.id || generateUUID()),
    name: String(rawPack?.name || ''),
    tagline: String(rawPack?.tagline || ''),
    price: Number(rawPack?.price || 0),
    original_price: rawPack?.original_price != null ? Number(rawPack.original_price) : null,
    cash_price: rawPack?.cash_price != null ? Number(rawPack.cash_price) : null,
    card_price: rawPack?.card_price != null ? Number(rawPack.card_price) : null,
    includes: Array.isArray(rawPack?.includes) ? rawPack.includes.map((x: any) => String(x)) : [],
    images: Array.isArray(rawPack?.images) ? rawPack.images.map((x: any) => String(x)).filter(Boolean) : [],
    show_on_home: Boolean(rawPack?.show_on_home),
    featured_in_menu: Boolean(rawPack?.featured_in_menu),
    // stock de packs es derivado (ver src/lib/packs/computePackStock.ts). Se mantiene en el shape
    // para retrocompatibilidad de tipos, pero el valor real proviene del cómputo en render.
    stock: 0,
    badge,
    status: rawPack?.status ? String(rawPack.status) : undefined,
    is_active: rawPack?.is_active !== undefined ? Boolean(rawPack.is_active) : undefined,
    publicable: rawPack?.publicable !== undefined ? Boolean(rawPack.publicable) : undefined,
    version,
    components: normalizedComponents,
};
}



function serializePackForSubmit(rawPack: any): Record<string, any> {
const pack = normalizePackForForm(rawPack);

const components = Array.isArray(pack.components)
    ? pack.components
        .map((c) => ({
        product_id: String(c.product_id || '').trim(),
        quantity: Number.isFinite(Number(c.quantity)) && Number(c.quantity) > 0 ? Math.trunc(Number(c.quantity)) : 1,
        role: c.role === 'primary' ? 'primary' : 'component',
        }))
        .filter((c) => c.product_id)
    : [];

return {
    id: pack.id,
    name: pack.name,
    tagline: pack.tagline,
    price: Number(pack.price || 0),
    original_price: pack.original_price != null ? Number(pack.original_price) : null,
    cash_price: pack.cash_price != null ? Number(pack.cash_price) : null,
    card_price: pack.card_price != null ? Number(pack.card_price) : null,
    includes: Array.isArray(pack.includes) ? pack.includes.map((x) => String(x).trim()).filter(Boolean) : [],
    images: Array.isArray(pack.images) ? pack.images.map((x) => String(x).trim()).filter(Boolean) : [],
    show_on_home: Boolean(pack.show_on_home),
    featured_in_menu: Boolean(pack.featured_in_menu),
    // pack.stock NO se persiste: el stock del kit es derivado de los componentes.
    badge: pack.badge ? { text: String(pack.badge.text || ''), variant: pack.badge.variant || 'red' } : { text: '', variant: 'red' },
    status: pack.status || undefined,
    is_active: pack.is_active,
    publicable: pack.publicable,
    version: pack.version != null && Number.isFinite(Number(pack.version)) ? Math.trunc(Number(pack.version)) : undefined,
    components,
  };
}

function formatPackValidationIssue(issue: any): string {
const code = String(issue?.code || 'UNKNOWN');
const packIndex = issue?.packIndex != null ? Number(issue.packIndex) : null;
const componentIndex = issue?.componentIndex != null ? Number(issue.componentIndex) : null;
const packRef = issue?.packId ? `pack ${issue.packId}` : (packIndex != null ? `pack #${packIndex + 1}` : 'pack');

if (code === 'PACK_COMPONENT_INVALID_PRODUCT_ID') {
    return `${packRef}: componente${componentIndex != null ? ` #${componentIndex + 1}` : ''} con product_id inválido.`;
}
if (code === 'PACK_COMPONENT_INVALID_QUANTITY') {
    return `${packRef}: componente${componentIndex != null ? ` #${componentIndex + 1}` : ''} con cantidad inválida (debe ser entero > 0).`;
}
if (code === 'PACK_COMPONENT_INVALID_ROLE') {
    return `${packRef}: componente${componentIndex != null ? ` #${componentIndex + 1}` : ''} con rol inválido.`;
}
if (code === 'PACK_PRIMARY_COUNT_INVALID') {
    return `${packRef}: debe tener exactamente un componente primary.`;
}
if (code === 'PACK_COMPONENTS_REQUIRED') {
    return `${packRef}: debe incluir al menos un componente.`;
}
if (code === 'PACK_MISSING_ID') {
    return `${packRef}: falta id del pack.`;
}

if (issue?.message) return `${packRef}: ${String(issue.message)}`;
return `${packRef}: error de validación (${code}).`;
}

function formatAdminSaveError(err: any): string {
const codeOrError = String(err?.error || '').trim();

if (codeOrError === 'Invalid pack contract') {
    const details = Array.isArray(err?.details) ? err.details : [];
    if (details.length === 0) return 'No se pudo guardar: contrato de pack inválido.';
    const messages = details.slice(0, 6).map((d: any) => `• ${formatPackValidationIssue(d)}`);
    const suffix = details.length > 6 ? `
• ... y ${details.length - 6} error(es) más.` : '';
    return `No se pudo guardar el producto por validaciones de packs:
${messages.join('\n')}${suffix}`;
}

if (codeOrError === 'PACK_COMPONENT_NOT_FOUND') {
    const pid = err?.details?.product_id ? String(err.details.product_id) : 'desconocido';
    return `No se puede publicar: el componente ${pid} no existe.`;
}

if (codeOrError === 'PACK_COMPONENT_INACTIVE') {
    const pid = err?.details?.product_id ? String(err.details.product_id) : 'desconocido';
    return `No se puede publicar: el componente ${pid} está inactivo.`;
}

return codeOrError || 'Error al guardar';
}

function serializePacksForSubmit(packs: ProductPack[]) {
return (packs || []).map((pack) => serializePackForSubmit(pack));
}


// Generador de ID únicos seguro
function generateUUID() {
if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
}
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
}

// Convertidor automático de Slug (URL amigable)
function generateSlug(text: string) {
return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// --- COMPONENTE ACORDEÓN DESPLEGABLE ---
const FormAccordion = ({
title,
icon,
defaultOpen = false,
children,
isDark = false,
}: {
title: string;
icon: React.ReactNode;
defaultOpen?: boolean;
children: React.ReactNode;
isDark?: boolean;
}) => {
const [isOpen, setIsOpen] = useState(defaultOpen);

const containerClass = isDark
    ? 'bg-gray-900 border-gray-700 text-white shadow-xl'
    : 'bg-white border-gray-200 shadow-sm';
const headerClass = isDark
    ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
    : 'bg-gray-50 hover:bg-gray-100 border-gray-100';
const titleClass = isDark ? 'text-gray-200' : 'text-gray-800';

return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${containerClass}`}>
    <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors border-b ${headerClass} ${
        !isOpen ? 'border-b-transparent' : ''
        }`}
    >
        <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${titleClass}`}>
        <span className="text-base leading-none">{icon}</span> {title}
        </h3>
        <Icon
        name="ChevronDownIcon"
        size={18}
        className={`transition-transform duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${
            isOpen ? 'rotate-180' : ''
        }`}
        />
    </button>

    {isOpen && (
        <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>
    )}
    </div>
);
};

// --- MINI EDITOR DE TEXTO ---
const FormattedTextarea = ({
label,
emoji,
value,
onChange,
placeholder,
}: {
label: string;
emoji: string;
value: string;
onChange: (val: string) => void;
placeholder: string;
}) => {
const handleFormat = (tag: string) => {
    const textarea = document.getElementById(`textarea-${label.replace(/\s+/g, '-')}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    if (!selected) {
    toast.error('Primero seleccioná la palabra que querés formatear con el mouse.');
    return;
}

    const before = value.substring(0, start);
    const after = value.substring(end, value.length);

    let formatted = '';
    if (tag === 'bold') formatted = `<b>${selected}</b>`;
    if (tag === 'italic') formatted = `<i>${selected}</i>`;

    onChange(`${before}${formatted}${after}`);
};

return (
    <div>
    <label className="block text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
        <span className="text-sm">{emoji}</span> {label}
    </label>
    <div className="border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white">
        <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex gap-1">
        <button
            type="button"
            onClick={() => handleFormat('bold')}
            className="px-3 py-1 text-xs font-black hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Poner en Negrita"
        >
            B
        </button>
        <button
            type="button"
            onClick={() => handleFormat('italic')}
            className="px-3 py-1 text-xs italic font-serif hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Poner en Cursiva"
        >
            I
        </button>
        </div>
        <textarea
        id={`textarea-${label.replace(/\s+/g, '-')}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 text-sm h-24 outline-none resize-y"
        placeholder={placeholder}
        />
    </div>
    </div>
);
};

// --- GESTOR DE FOTOS POR PACK ---
const PackGalleryEditor = ({
images,
onChange,
onUpload,
}: {
images: string[];
onChange: (newImages: string[]) => void;
onUpload: (file: File) => Promise<string>;
}) => {
const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    for (const file of files) {
    if (file.type.startsWith('image/')) {
        const url = await onUpload(file);
        newUrls.push(url);
    }
    }
    onChange([...images, ...newUrls]);
};

const moveImage = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newImages = [...images];
    const [movedItem] = newImages.splice(fromIdx, 1);
    newImages.splice(toIdx, 0, movedItem);
    onChange(newImages);
};

return (
    <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={handleFileDrop}
    className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors"
    >
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {images.map((url, idx) => (
        <div
            key={url + idx}
            draggable
            onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', idx.toString());
            }}
            onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverIdx(idx);
            }}
            onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragOverIdx === idx) setDragOverIdx(null);
            }}
            onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverIdx(null);
            const draggedIdxStr = e.dataTransfer.getData('text/plain');
            if (draggedIdxStr) {
                const fromIdx = parseInt(draggedIdxStr, 10);
                if (!isNaN(fromIdx) && fromIdx !== idx) moveImage(fromIdx, idx);
            }
            }}
            className={`relative aspect-square rounded-lg overflow-hidden border bg-gray-50 cursor-move group transition-all ${
            dragOverIdx === idx ? 'ring-2 ring-blue-500 scale-95 opacity-50' : ''
            }`}
        >
            <img src={url} className="w-full h-full object-cover pointer-events-none" alt="Pack preview" />

            {idx === 0 && (
            <div className="absolute bottom-0 left-0 w-full bg-blue-600/80 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-normal py-0.5 uppercase tracking-widest text-center z-10">
                ⭐ Portada
            </div>
            )}

            <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(images.filter((_, i) => i !== idx));
            }}
            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
            type="button"
            >
            <Icon name="XMarkIcon" size={12} />
            </button>
        </div>
        ))}

        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-all text-gray-400">
        <Icon name="PlusIcon" size={24} />
        <input
            type="file"
            multiple
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
            if (!e.target.files) return;
            const urls = await Promise.all(Array.from(e.target.files).map(onUpload));
            onChange([...images, ...urls]);
            }}
        />
        </label>
    </div>
    <p className="text-[10px] text-gray-400 mt-3 text-center uppercase font-bold tracking-wider">
        Arrastrá fotos para subirlas o mantené presionado para reordenar
    </p>
    </div>
);
};

const ImageUploader = ({
onUpload,
previewUrl,
label,
onRemove,
}: {
onUpload: (file: File) => Promise<void>;
previewUrl?: string;
label: string;
onRemove?: () => void;
}) => {
const [uploading, setUploading] = useState(false);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
    await onUpload(e.target.files[0]);
  } catch (error) {
    console.error(error);
    toast.error('Error al subir');
  } finally {
    setUploading(false);
  }
};

return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group h-full">
    {label && <label className="block text-[10px] sm:text-xs font-medium uppercase text-gray-500 mb-2">{label}</label>}
    {previewUrl ? (
        <div className="relative w-full aspect-square bg-gray-50 rounded-md overflow-hidden border border-gray-100">
        {previewUrl.endsWith('.mp4') ? (
            <video src={previewUrl} className="w-full h-full object-cover" muted />
        ) : (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
        )}
        {onRemove && (
            <button
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition-colors"
            type="button"
            >
            <Icon name="TrashIcon" size={14} />
            </button>
        )}
        </div>
    ) : (
        <label
        className={`w-full aspect-square rounded-md border-2 border-dashed ${
            uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } flex flex-col items-center justify-center cursor-pointer transition-colors`}
        >
        {uploading ? (
            <Icon name="ArrowPathIcon" size={24} className="text-blue-500 animate-spin" />
        ) : (
            <Icon name="PhotoIcon" size={32} className="text-gray-300" />
        )}
        <input type="file" accept="image/*,video/mp4" onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
    )}
    </div>
);
};

function generateFileName(originalName: string) {
const fileExt = originalName.split('.').pop();
return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
}

function parseFeatures(v: string) {
return v.split('\n').map((x) => x.trim()).filter(Boolean);
}

function stringifyFeatures(arr: string[]) {
return (arr || []).join('\n');
}

export default function ProductForm({ mode, productId }: { mode: Mode; productId?: string }) {
const router = useRouter();
const supabase = useMemo(() => getSupabaseBrowserClient(), []);

const [loading, setLoading] = useState(mode === 'edit');
const [saving, setSaving] = useState(false);
const [errorMsg, setErrorMsg] = useState('');
const [allProducts, setAllProducts] = useState<SimpleProduct[]>([]);

const [form, setForm] = useState<ProductPayload>({
    name: '',
    slug: '',
    model: '',
    description: '',
    price: 0,
    original_price: null,
    cash_price: null,
    card_price: null,
    image_url: '',
    gallery: [],
    video_url: null,
    stock_count: 0,
    features: [],
    badge: null,
    is_active: true,
    is_outlet: false,
    is_accessory: false,
    colors: [],
    addon_ids: [],
    show_on_home: true,
    story_content: [],
    tech_specs: {},
    faq_content: [],
    packs: [],
    reviews: [],
    shipping_info: '',
    warranty_info: '',
    payment_info: '',
});

const [featuresText, setFeaturesText] = useState('');
const [specsList, setSpecsList] = useState<TechSpec[]>([]);
const [newColorName, setNewColorName] = useState('');
const [newColorHex, setNewColorHex] = useState('#000000');
const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

const STANDARD_SPECS = [
    'Resolución Máxima',
    'Estabilización',
    'Resistencia al Agua',
    'Duración Batería',
    'Ángulo de Visión',
    'Sensor',
    'Conectividad',
    'Peso',
];

const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
};

const orderedSpecs = useMemo(() => {
    return [...specsList].sort((a, b) => {
    const aIsStandard = STANDARD_SPECS.includes(a.label);
    const bIsStandard = STANDARD_SPECS.includes(b.label);
    if (aIsStandard && !bIsStandard) return -1;
    if (!aIsStandard && bIsStandard) return 1;
    return 0;
    });
}, [specsList]);

const updateSpec = (realIdx: number, field: 'label' | 'value', val: string) => {
    const newList = [...specsList];
    newList[realIdx][field] = val;
    setSpecsList(newList);
};

const removeSpec = (realIdx: number) => {
    setSpecsList(specsList.filter((_, i) => i !== realIdx));
};

const addFAQ = () =>
    setForm((s) => ({ ...s, faq_content: [...s.faq_content, { question: '', answer: '' }] }));

const updateFAQ = (idx: number, field: 'question' | 'answer', val: string) => {
    setForm((s) => {
    const newFAQ = [...s.faq_content];
    newFAQ[idx][field] = val;
    return { ...s, faq_content: newFAQ };
    });
};

const removeFAQ = (idx: number) =>
    setForm((s) => ({ ...s, faq_content: s.faq_content.filter((_, i) => i !== idx) }));

// --- LÓGICA DE RESEÑAS MANUALES ---
const addReview = () => {
    const newReview: ProductReview = {
    id: generateUUID(),
    customer_name_manual: '',
    rating: 5,
    review_text: '',
    is_verified_purchase: true,
    review_images_gallery: [],
    };
    setForm((s) => ({ ...s, reviews: [...(s.reviews || []), newReview] }));
};

const updateReview = (idx: number, field: keyof ProductReview, val: any) => {
    setForm((s) => {
    const newReviews = [...(s.reviews || [])];
    newReviews[idx] = { ...newReviews[idx], [field]: val };
    return { ...s, reviews: newReviews };
    });
};

const removeReview = (idx: number) => {
    setForm((s) => ({ ...s, reviews: (s.reviews || []).filter((_, i) => i !== idx) }));
};

const addVariant = () => {
    if (!newColorName) return;
    const newVariant: ColorVariant = {
    id: Math.random().toString(36).substr(2, 9),
    name: newColorName,
    hex: newColorHex,
    images: [],
    stock: 0,
    };
    setForm((s) => ({ ...s, colors: [...s.colors, newVariant] }));
    setNewColorName('');
    setNewColorHex('#000000');
};

const removeVariant = (idx: number) => {
    setForm((s) => ({ ...s, colors: s.colors.filter((_, i) => i !== idx) }));
    if (editingVariantIndex === idx) setEditingVariantIndex(null);
};

const updateVariantStock = (val: number, idx: number) => {
    setForm((s) => {
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
    for (const file of files) {
    try {
        urls.push(await uploadToSupabase(file));
    } catch (err) {
        console.error(err);
    }
    }
    setForm((s) => {
    const newColors = [...s.colors];
    newColors[variantIdx].images = [...newColors[variantIdx].images, ...urls];
    return { ...s, colors: newColors };
    });
    e.target.value = '';
};

// --- AÑADIR PACK CON NUEVOS PRECIOS ---
const addPack = () => {
    const newPack: ProductPack = normalizePackForForm({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    tagline: '',
    price: 0,
    original_price: null,
    cash_price: null,
    card_price: null,
    includes: [],
    images: [],
    show_on_home: false,
    featured_in_menu: false,
    stock: 0,
    status: 'draft',
    version: 1,
    components: [],
    badge: {
        text: '',
        variant: 'red',
    },
    });
    setForm((s) => ({ ...s, packs: [...(s.packs || []), newPack] }));
};

const updatePack = (idx: number, field: keyof ProductPack, val: any) => {
    setForm((s) => {
    const newPacks = [...s.packs];
    newPacks[idx] = { ...newPacks[idx], [field]: val };
    return { ...s, packs: newPacks };
    });
};

const removePack = (idx: number) => {
    setForm((s) => ({ ...s, packs: (s.packs || []).filter((_, i) => i !== idx) }));
};


const addPackComponent = (packIdx: number) => {
    setForm((s) => {
    const nextPacks = [...(s.packs || [])];
    const target = nextPacks[packIdx];
    if (!target) return s;

    const existing = Array.isArray(target.components) ? [...target.components] : [];
    const hasPrimary = existing.some((c) => c.role === 'primary');

    existing.push({
        id: generateUUID(),
        product_id: '',
        quantity: 1,
        role: hasPrimary ? 'component' : 'primary',
    });

    nextPacks[packIdx] = { ...target, components: existing };
    return { ...s, packs: nextPacks };
    });
};

const updatePackComponent = (
    packIdx: number,
    componentIdx: number,
    field: 'product_id' | 'quantity' | 'role',
    value: string | number,
) => {
    setForm((s) => {
    const nextPacks = [...(s.packs || [])];
    const target = nextPacks[packIdx];
    if (!target) return s;

    const components = Array.isArray(target.components) ? [...target.components] : [];
    const current = components[componentIdx];
    if (!current) return s;

    if (field === 'role') {
        const nextRole = value === 'primary' ? 'primary' : 'component';
        if (nextRole === 'primary') {
        for (let i = 0; i < components.length; i++) {
            components[i] = { ...components[i], role: i === componentIdx ? 'primary' : 'component' };
        }
        } else {
        components[componentIdx] = { ...current, role: 'component' };
        if (!components.some((c, i) => c.role === 'primary' && i !== componentIdx)) {
            components[0] = { ...components[0], role: 'primary' };
        }
        }
    } else if (field === 'quantity') {
        const n = Number(value);
        components[componentIdx] = {
        ...current,
        quantity: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1,
        };
    } else {
        components[componentIdx] = { ...current, product_id: String(value || '') };
    }

    nextPacks[packIdx] = { ...target, components };
    return { ...s, packs: nextPacks };
    });
};

const removePackComponent = (packIdx: number, componentIdx: number) => {
    setForm((s) => {
    const nextPacks = [...(s.packs || [])];
    const target = nextPacks[packIdx];
    if (!target) return s;

    let components = Array.isArray(target.components) ? [...target.components] : [];
    if (componentIdx < 0 || componentIdx >= components.length) return s;

    const removed = components[componentIdx];
    components = components.filter((_, i) => i !== componentIdx);

    if (components.length > 0 && removed?.role === 'primary' && !components.some((c) => c.role === 'primary')) {
        components[0] = { ...components[0], role: 'primary' };
    }

    nextPacks[packIdx] = { ...target, components };
    return { ...s, packs: nextPacks };
    });
};

useEffect(() => {
    (async () => {
    const { data: prods } = await supabase.from('products').select('id, name, stock_count, is_active').eq('is_active', true);
    if (prods) setAllProducts(prods);

    if (mode === 'edit' && productId) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
        router.push('/admin-login');
        return;
        }

        try {
        const { product: p } = await adminFetch<{ product: any }>(`/api/admin/products?id=${productId}`);
        const loadedSpecs = p.tech_specs
            ? Object.entries(p.tech_specs).map(([k, v]) => ({ label: k, value: String(v) }))
            : [];

        const { data: reviewsData } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: true });

        const normalizedPacks = Array.isArray(p.packs)
            ? p.packs.map((pack: any) => normalizePackForForm(pack))
            : [];

        setForm({
            ...p,
            slug: p.slug || '',
            price: Number(p.price),
            original_price: p.original_price ? Number(p.original_price) : null,
            cash_price: p.cash_price ? Number(p.cash_price) : null, 
            card_price: p.card_price ? Number(p.card_price) : null, 
            stock_count: Number(p.stock_count),
            gallery: p.gallery || [],
            features: p.features || [],
            colors: Array.isArray(p.colors) ? p.colors : [],
            addon_ids: p.addon_ids || [],
            show_on_home: p.show_on_home ?? true,
            is_outlet: p.is_outlet ?? false,
            is_accessory: p.is_accessory ?? false,
            story_content: Array.isArray(p.story_content) ? p.story_content : [],
            faq_content: Array.isArray(p.faq_content) ? p.faq_content : [],
            tech_specs: p.tech_specs || {},
            packs: normalizedPacks,
            reviews: reviewsData || [],
            shipping_info: p.shipping_info || '',
            warranty_info: p.warranty_info || '',
            payment_info: p.payment_info || '',
        });

        setFeaturesText(stringifyFeatures(p.features));
        setSpecsList(loadedSpecs);
        setLoading(false);
        } catch (err) {
          if (err instanceof AdminFetchError) {
            setErrorMsg(formatAdminSaveError(err.body));
          } else {
            console.error(err);
          }
          setLoading(false);
        }
    } else {
        setLoading(false);
    }
    })();
}, [productId, mode, supabase, router]);

const onSubmit = async () => {
    setSaving(true);
    setErrorMsg('');
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const specsObject = specsList.reduce((acc, item) => {
    if (item.label && item.value) acc[item.label] = item.value;
    return acc;
    }, {} as Record<string, string>);

    const { reviews, ...productData } = form;

    const finalSlug = form.slug.trim() !== '' ? generateSlug(form.slug) : generateSlug(form.name);

    const serializedPacks = serializePacksForSubmit(form.packs || []);

    const payload = {
    ...productData,
    packs: serializedPacks,
    slug: finalSlug,
    stock_count:
        form.colors.length > 0 ? form.colors.reduce((acc, c) => acc + (c.stock || 0), 0) : form.stock_count,
    features: parseFeatures(featuresText),
    tech_specs: specsObject,
    };

    let responseData: any = null;
    try {
    responseData = await adminFetch<any>(
        mode === 'create' ? '/api/admin/products' : `/api/admin/products?id=${productId}`,
        {
        method: mode === 'create' ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
        }
    );
    } catch (err) {
    setErrorMsg(formatAdminSaveError(err instanceof AdminFetchError ? err.body : err));
    setSaving(false);
    return;
    }

    try {
        let finalId = productId;
        if (mode === 'create') {
        finalId = responseData?.id || responseData?.product?.id;
        }

        if (finalId) {
        await supabase
            .from('products')
            .update({
            packs: serializedPacks,
            is_outlet: form.is_outlet,
            is_accessory: form.is_accessory,
            shipping_info: form.shipping_info,
            warranty_info: form.warranty_info,
            payment_info: form.payment_info,
            })
            .eq('id', finalId);

        const { data: existingReviews } = await supabase.from('product_reviews').select('id').eq('product_id', finalId);

        if (existingReviews) {
            const existingIds = existingReviews.map((r) => r.id);
            const currentIds = reviews.map((r) => r.id);
            const idsToDelete = existingIds.filter((id) => !currentIds.includes(id));
            if (idsToDelete.length > 0) {
            await supabase.from('product_reviews').delete().in('id', idsToDelete);
            }
        }

        if (reviews && reviews.length > 0) {
            const reviewsPayload = reviews.map((r) => ({
            id: r.id,
            product_id: finalId,
            customer_name_manual: r.customer_name_manual,
            rating: r.rating,
            review_text: r.review_text,
            is_verified_purchase: r.is_verified_purchase,
            review_images_gallery: r.review_images_gallery || [],
            }));
            await supabase.from('product_reviews').upsert(reviewsPayload);
        }
        }
    } catch (e) {
        console.error('Error guardando extras o reseñas:', e);
    }
    router.push('/admin-dashboard/inventory');
};

if (loading) {
    return (
    <div className="h-96 flex items-center justify-center">
        <Icon name="ArrowPathIcon" size={32} className="animate-spin text-gray-400" />
    </div>
    );
}

return (
    <div className="max-w-5xl mx-auto pb-24 space-y-4 px-4 sm:px-6 lg:px-8">
    <div className="sticky top-0 bg-[#F9F9F9]/95 backdrop-blur z-20 py-4 border-b flex justify-between items-center mb-4">
        <div>
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
        </h1>
        </div>
        <div className="flex gap-2">
        <Link
            href="/admin-dashboard/inventory"
            className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-xs font-bold transition-colors"
        >
            Cancelar
        </Link>
        <button
            onClick={onSubmit}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs font-bold shadow-md transition-colors"
            type="button"
        >
            {saving ? 'Guardando...' : 'Guardar Producto'}
        </button>
        </div>
    </div>

    {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 text-sm font-medium">
        {errorMsg}
        </div>
    )}

    <div className="flex flex-col gap-4">
        {/* 1. MULTIMEDIA */}
        <FormAccordion title="Multimedia Principal" icon="📸" defaultOpen={true}>
        <p className="text-xs text-gray-500 mb-4 -mt-2">
            La foto de portada es la que se mostrará como tarjeta principal en el Inicio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploader
            label="⭐ Portada Principal"
            previewUrl={form.image_url}
            onUpload={async (f) => {
                const url = await uploadToSupabase(f);
                setForm((s) => ({ ...s, image_url: url }));
            }}
            onRemove={() => setForm((s) => ({ ...s, image_url: '' }))}
            />
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Galería General</h3>
            <div className="grid grid-cols-3 gap-2">
                {form.gallery.map((url, idx) => (
                <div
                    key={url + idx}
                    draggable
                    onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', idx.toString());
                    }}
                    onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    }}
                    onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fromIdxStr = e.dataTransfer.getData('text/plain');
                    if (fromIdxStr) {
                        const fromIdx = parseInt(fromIdxStr, 10);
                        if (!isNaN(fromIdx) && fromIdx !== idx) {
                        const newGallery = [...form.gallery];
                        const [moved] = newGallery.splice(fromIdx, 1);
                        newGallery.splice(idx, 0, moved);
                        setForm((s) => ({ ...s, gallery: newGallery }));
                        }
                    }
                    }}
                    className="relative aspect-square rounded-md overflow-hidden border bg-white group cursor-move"
                >
                    <img src={url} alt="Gallery item" className="w-full h-full object-cover pointer-events-none" />
                    <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setForm((s) => ({ ...s, gallery: s.gallery.filter((_, i) => i !== idx) }));
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    type="button"
                    >
                    <Icon name="XMarkIcon" size={10} />
                    </button>
                </div>
                ))}
                <div className="aspect-square">
                <ImageUploader
                    label=""
                    onUpload={async (f) => {
                    const url = await uploadToSupabase(f);
                    setForm((s) => ({ ...s, gallery: [...s.gallery, url] }));
                    }}
                />
                </div>
            </div>
            </div>
        </div>
        </FormAccordion>

        {/* 2. INFORMACIÓN GENERAL */}
        <FormAccordion title="Información del Producto" icon="📝" defaultOpen={true}>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nombre</label>
                <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center justify-between">
                <span>URL Amigable (Slug)</span>
                <button
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, slug: generateSlug(s.name) }))}
                    className="text-blue-500 hover:underline lowercase text-[9px] font-bold"
                >
                    Autocompletar
                </button>
                </label>
                <input
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: generateSlug(e.target.value) }))}
                className="w-full p-2 border rounded-md text-sm bg-gray-50 focus:bg-white transition-colors"
                placeholder="ej: arnes-para-perro"
                />
            </div>
            </div>

            <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Modelo</label>
            <input
                value={form.model}
                onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
            />
            </div>

            <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                Descripción Corta / Resumen
            </label>
            <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full p-2 border rounded-md h-20 text-sm"
            />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Precio Base ($U)</label>
                <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))}
                className="w-full p-2 border border-blue-200 rounded-md font-black text-blue-700 text-sm focus:ring-2 outline-none"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Precio Tachado ($U)</label>
                <input
                type="number"
                value={form.original_price || ''}
                onChange={(e) =>
                    setForm((s) => ({ ...s, original_price: e.target.value ? Number(e.target.value) : null }))
                }
                className="w-full p-2 border rounded-md text-sm text-gray-500"
                placeholder="Opcional"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-green-600 mb-1">Precio Transf. ($U)</label>
                <input
                type="number"
                value={form.cash_price || ''}
                onChange={(e) =>
                    setForm((s) => ({ ...s, cash_price: e.target.value ? Number(e.target.value) : null }))
                }
                className="w-full p-2 border border-green-300 rounded-md font-black text-green-700 bg-green-50 text-sm focus:ring-2 ring-green-500 outline-none"
                placeholder="Opcional"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Precio Tarjeta ($U)</label>
                <input
                type="number"
                value={form.card_price || ''}
                onChange={(e) =>
                    setForm((s) => ({ ...s, card_price: e.target.value ? Number(e.target.value) : null }))
                }
                className="w-full p-2 border border-gray-300 rounded-md font-black text-gray-800 text-sm focus:ring-2 outline-none"
                placeholder="Opcional"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Stock Total
                </label>
                <input
                type="number"
                min={0}
                value={form.stock_count}
                onChange={(e) => setForm((s) => ({ ...s, stock_count: Math.max(0, Number(e.target.value) || 0) }))}
                className="w-full p-2 border rounded-md bg-white text-sm font-mono"
                />
            </div>
            </div>
        </div>
        </FormAccordion>

        {/* 3. PACKS CONFIGURABLES CON SUS PROPIOS PRECIOS */}
        <FormAccordion title="Packs y Kits Especiales" icon="📦" defaultOpen={true}>
        <div className="space-y-6">
            {(form.packs || []).map((pack, idx) => (
            <div
                key={pack.id || idx}
                className="p-5 bg-white border-2 border-gray-100 hover:border-blue-100 transition-colors rounded-xl relative shadow-sm space-y-4"
            >
                <button
                onClick={() => removePack(idx)}
                className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                type="button"
                >
                <Icon name="TrashIcon" size={18} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className="md:col-span-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Nombre del Pack</label>
                    <input
                    value={pack.name}
                    onChange={(e) => updatePack(idx, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-bold"
                    />
                </div>
                
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Precio Ref/Base ($U)</label>
                    <input
                    type="number"
                    value={pack.price}
                    onChange={(e) => updatePack(idx, 'price', Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-black text-blue-600"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-green-600">Precio Transf. ($U)</label>
                    <input
                    type="number"
                    value={pack.cash_price || ''}
                    onChange={(e) => updatePack(idx, 'cash_price', e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border border-green-300 rounded bg-green-50 text-sm font-black text-green-700"
                    placeholder="Opcional"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Precio Tarjeta ($U)</label>
                    <input
                    type="number"
                    value={pack.card_price || ''}
                    onChange={(e) => updatePack(idx, 'card_price', e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-black text-gray-800"
                    placeholder="Opcional"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Precio Tachado ($U)</label>
                    <input
                    type="number"
                    value={pack.original_price || ''}
                    onChange={(e) =>
                        updatePack(idx, 'original_price', e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-gray-500"
                    placeholder="Opcional"
                    />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Resumen (Tagline)</label>
                    <input
                    value={pack.tagline || ''}
                    onChange={(e) => updatePack(idx, 'tagline', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    placeholder="Ej: Cámara + Memoria"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-blue-600">
                    Stock disponible (calculado)
                    </label>
                    {(() => {
                      // El stock de un kit es derivado de sus componentes. Incluimos el producto
                      // que se está editando con su stock_count actual del form, así el cálculo
                      // refleja cambios sin guardar.
                      const lookup = buildProductsLookup([
                        ...allProducts,
                        ...(productId
                          ? [{ id: productId, name: form.name || 'Este producto', stock_count: form.stock_count, is_active: true }]
                          : []),
                      ]);
                      const r = computePackEffectiveStock(pack, lookup);
                      const bg = r.stock === 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-900';
                      return (
                        <div className={`w-full p-2 border rounded text-sm font-mono ${bg}`}>
                          <div className="font-black">{r.stock} kits</div>
                          {r.limiting && r.ok && (
                            <div className="text-[10px] font-normal mt-0.5 truncate" title={r.limiting.product_name || r.limiting.product_id}>
                              Limita: {r.limiting.product_name || r.limiting.product_id} ({r.limiting.available}/{r.limiting.per_kit})
                            </div>
                          )}
                          {!r.ok && (
                            <div className="text-[10px] font-normal mt-0.5">
                              {r.breakdown.length === 0 ? 'Sin componentes' : 'Componente faltante/inactivo'}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-red-600">Texto del Badge</label>
                    <input
                    value={pack.badge?.text || ''}
                    onChange={(e) =>
                        updatePack(idx, 'badge', {
                        text: e.target.value,
                        variant: pack.badge?.variant || 'red',
                        })
                    }
                    className="w-full p-2 border border-red-300 rounded bg-red-50 text-sm focus:ring-2 ring-red-500 outline-none font-bold text-red-800"
                    placeholder="Ej: REGALO GRATIS"
                    />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Color del Badge</label>
                    <select
                    value={pack.badge?.variant || 'red'}
                    onChange={(e) =>
                        updatePack(idx, 'badge', {
                        text: pack.badge?.text || '',
                        variant: e.target.value as 'red' | 'green' | 'orange' | 'blue',
                        })
                    }
                    className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                    >
                    <option value="red">Rojo</option>
                    <option value="green">Verde</option>
                    <option value="orange">Naranja</option>
                    <option value="blue">Azul</option>
                    </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer bg-blue-50/50 border border-blue-100 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={pack.show_on_home || false}
                        onChange={(e) => updatePack(idx, 'show_on_home', e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600 border-blue-300"
                    />
                    <span className="text-xs font-bold text-blue-800">Mostrar Kit en Home</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer bg-amber-50/50 border border-amber-100 p-3 rounded-lg hover:bg-amber-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={pack.featured_in_menu || false}
                        onChange={(e) => updatePack(idx, 'featured_in_menu', e.target.checked)}
                        className="w-5 h-5 rounded text-amber-500 border-amber-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-800">⭐ Destacar en Menú Superior</span>
                    </label>
                </div>
                </div>

                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Fotos de este Pack (Arrastrá la principal al inicio)
                </label>
                <PackGalleryEditor
                    images={pack.images || []}
                    onChange={(newImgs) => updatePack(idx, 'images', newImgs)}
                    onUpload={uploadToSupabase}
                />
                </div>

                <div className="space-y-2 border border-indigo-100 rounded-lg bg-indigo-50/40 p-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-indigo-700">Componentes del Pack</label>
                    <button
                    type="button"
                    onClick={() => addPackComponent(idx)}
                    className="text-[10px] font-bold px-2 py-1 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                    >
                    + Agregar componente
                    </button>
                </div>

                {(pack.components || []).length === 0 ? (
                    <div className="text-xs text-indigo-700 bg-white border border-dashed border-indigo-200 rounded p-2">
                    Este pack aún no tiene componentes cargados.
                    </div>
                ) : (
                    <div className="space-y-2">
                    {(pack.components || []).map((component, cIdx) => (
                        <div key={component.id || cIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white border border-indigo-100 rounded p-2">
                        <div className="md:col-span-6">
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Producto componente</label>
                            <select
                            value={component.product_id || ''}
                            onChange={(e) => updatePackComponent(idx, cIdx, 'product_id', e.target.value)}
                            className="w-full p-2 border rounded-md text-xs"
                            >
                            <option value="">Seleccionar producto</option>
                            {allProducts.map((ap) => (
                                <option key={ap.id} value={ap.id}>{ap.name}</option>
                            ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Cantidad</label>
                            <input
                            type="number"
                            min={1}
                            value={component.quantity ?? 1}
                            onChange={(e) => updatePackComponent(idx, cIdx, 'quantity', Number(e.target.value || 1))}
                            className="w-full p-2 border rounded-md text-xs"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Rol</label>
                            <select
                            value={component.role}
                            onChange={(e) => updatePackComponent(idx, cIdx, 'role', e.target.value)}
                            className="w-full p-2 border rounded-md text-xs"
                            >
                            <option value="primary">Primary</option>
                            <option value="component">Component</option>
                            </select>
                        </div>

                        <div className="md:col-span-1 flex items-end">
                            <button
                            type="button"
                            onClick={() => removePackComponent(idx, cIdx)}
                            className="w-full p-2 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50"
                            title="Eliminar componente"
                            >
                            ×
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>

                <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                    ¿Qué incluye? (Uno por línea)
                </label>
                <textarea
                    value={pack.includes?.join('\n') || ''}
                    onChange={(e) => updatePack(idx, 'includes', e.target.value.split('\n'))}
                    className="w-full p-3 border border-gray-300 rounded bg-white text-sm h-28 focus:ring-1 focus:ring-purple-500 outline-none"
                />
                </div>
            </div>
            ))}
        </div>

        <button
            onClick={addPack}
            className="mt-4 px-4 py-3 bg-purple-50 border-2 border-dashed border-purple-300 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors w-full flex items-center justify-center gap-2"
            type="button"
        >
            <Icon name="PlusIcon" size={16} /> Agregar Nuevo Pack
        </button>
        </FormAccordion>

        {/* 4. VARIANTES DE COLOR */}
        <FormAccordion title="Variantes de Color" icon="🎨">
        <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold uppercase text-gray-500">Color</label>
            <input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="Ej: Blanco"
            />
            </div>
            <div>
            <label className="text-[10px] font-bold uppercase text-gray-500">Hex</label>
            <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-12 h-9 p-0 border rounded cursor-pointer"
            />
            </div>
            <button
            onClick={addVariant}
            className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 font-bold h-9 w-full sm:w-auto"
            type="button"
            >
            Agregar
            </button>
        </div>

        <div className="space-y-3">
            {form.colors.map((color, idx) => (
            <div key={color.id || idx} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.hex }} />
                    <span className="font-bold text-gray-800 text-sm">{color.name}</span>
                    <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-full text-gray-500 shadow-sm">
                    Stock: {color.stock}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                    onClick={() => setEditingVariantIndex(editingVariantIndex === idx ? null : idx)}
                    className="text-blue-600 text-xs font-bold hover:underline"
                    type="button"
                    >
                    Editar
                    </button>
                    <button onClick={() => removeVariant(idx)} className="text-gray-400 hover:text-red-600 transition-colors" type="button">
                    <Icon name="TrashIcon" size={16} />
                    </button>
                </div>
                </div>

                {editingVariantIndex === idx && (
                <div className="p-4 border-t border-gray-100 flex flex-col gap-4 bg-white">
                    <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Stock Disponible:</label>
                    <input
                        type="number"
                        min={0}
                        value={color.stock}
                        onChange={(e) => updateVariantStock(Math.max(0, Number(e.target.value) || 0), idx)}
                        className="w-24 p-1.5 border border-gray-300 rounded-md text-sm font-mono"
                    />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                    {color.images.map((img, i) => (
                        <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" alt="" />
                    ))}
                    <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-blue-500">
                        <Icon name="PlusIcon" size={20} />
                        <input type="file" multiple className="hidden" onChange={(e) => handleVariantImageUpload(e, idx)} />
                    </label>
                    </div>
                </div>
                )}
            </div>
            ))}
        </div>
        </FormAccordion>

        {/* 5. ESPECIFICACIONES TÉCNICAS */}
        <FormAccordion title="Especificaciones del Comparador" icon={<Icon name="ScaleIcon" size={18} />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4">
            {STANDARD_SPECS.map((suggestion) => {
            const exists = specsList.find((s) => s.label === suggestion);
            return (
                <button
                key={suggestion}
                type="button"
                onClick={() => {
                    if (!exists) setSpecsList([...specsList, { label: suggestion, value: '' }]);
                }}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${
                    exists
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200'
                }`}
                >
                {exists ? '✓ ' : '+ '} {suggestion}
                </button>
            );
            })}
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {orderedSpecs.map((spec) => {
            const realIdx = specsList.findIndex((s) => s === spec);
            return (
                <div key={realIdx} className="flex gap-3 items-center p-3 rounded-lg border bg-white border-gray-100 shadow-sm">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                    value={spec.label}
                    onChange={(e) => updateSpec(realIdx, 'label', e.target.value)}
                    className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-md text-xs font-bold outline-none bg-gray-50 transition-colors"
                    placeholder="Ej: Peso"
                    />
                    <input
                    value={spec.value}
                    onChange={(e) => updateSpec(realIdx, 'value', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md text-xs outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ej: 150g"
                    />
                </div>
                <button onClick={() => removeSpec(realIdx)} className="p-2 text-gray-300 hover:text-red-600 transition-colors" type="button">
                    <Icon name="TrashIcon" size={18} />
                </button>
                </div>
            );
            })}
        </div>
        </FormAccordion>

        {/* 6. HISTORIA VISUAL */}
        <FormAccordion title="Historia Visual (Storytelling)" icon="📖">
        <p className="text-xs text-gray-500 mb-4 -mt-2 italic">
            Se recomienda subir las fotos/videos desde la Galería Multimedia y luego pegar la URL aquí para armar los bloques.
        </p>
        {form.story_content.map((block, idx) => (
            <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4 relative shadow-sm">
            <button
                onClick={() =>
                setForm((s) => ({ ...s, story_content: s.story_content.filter((_, i) => i !== idx) }))
                }
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors"
                type="button"
            >
                <Icon name="XMarkIcon" size={16} />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Tipo de Bloque</label>
                <select
                    value={block.type}
                    onChange={(e) => {
                    const newStory = [...form.story_content];
                    newStory[idx] = { ...newStory[idx], type: e.target.value as any };
                    setForm((s) => ({ ...s, story_content: newStory }));
                    }}
                    className="p-2 border rounded-md bg-white text-xs w-full outline-none"
                >
                    <option value="full_video">Video Full</option>
                    <option value="image_left">Imagen a la Izquierda</option>
                    <option value="image_right">Imagen a la Derecha</option>
                    <option value="banner">Banner Imagen</option>
                </select>
                </div>
                <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">URL del Recurso</label>
                <input
                    value={(block as any).image_url || (block as any).video_url}
                    onChange={(e) => {
                    const newStory = [...form.story_content];
                    if (block.type === 'full_video') (newStory[idx] as any).video_url = e.target.value;
                    else (newStory[idx] as any).image_url = e.target.value;
                    setForm((s) => ({ ...s, story_content: newStory }));
                    }}
                    className="p-2 border rounded-md bg-white text-xs w-full outline-none"
                    placeholder="https://..."
                />
                </div>
            </div>
            </div>
        ))}
        <button
            onClick={() =>
            setForm((s) => ({
                ...s,
                story_content: [...s.story_content, { type: 'full_video', video_url: '', title: '', description: '' }],
            }))
            }
            className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors"
            type="button"
        >
            + Agregar Bloque de Historia
        </button>
        </FormAccordion>

        {/* 7. RESEÑAS */}
        <FormAccordion title="Reseñas del Producto (Social Proof)" icon="⭐">
        <div className="space-y-4">
            {(form.reviews || []).map((rev, idx) => (
            <div key={rev.id} className="p-5 bg-white rounded-xl relative border border-gray-200 shadow-sm">
                <button
                onClick={() => removeReview(idx)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-600 transition-colors"
                type="button"
                >
                <Icon name="TrashIcon" size={18} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pr-6">
                <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Nombre del Cliente</label>
                    <input
                    value={rev.customer_name_manual}
                    onChange={(e) => updateReview(idx, 'customer_name_manual', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-bold text-gray-800 focus:bg-white transition-colors outline-none"
                    placeholder="Ej: Juan Pérez"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-yellow-600 mb-1 block">Estrellas (1 al 5)</label>
                    <input
                    type="number"
                    min="1"
                    max="5"
                    value={rev.rating}
                    onChange={(e) => updateReview(idx, 'rating', Number(e.target.value))}
                    className="w-full p-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm font-black text-yellow-900 outline-none focus:ring-2 ring-yellow-400"
                    />
                </div>
                </div>

                <div className="mb-4">
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Comentario</label>
                <textarea
                    value={rev.review_text}
                    onChange={(e) => updateReview(idx, 'review_text', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm h-20 resize-y focus:bg-white transition-colors outline-none"
                    placeholder="Excelente producto, muy recomendado..."
                />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 cursor-pointer bg-green-50 px-3 py-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                    <input
                    type="checkbox"
                    checked={rev.is_verified_purchase}
                    onChange={(e) => updateReview(idx, 'is_verified_purchase', e.target.checked)}
                    className="w-4 h-4 rounded text-green-600 border-green-300 focus:ring-green-500"
                    />
                    <span className="text-xs font-bold text-green-800">✅ Compra Verificada</span>
                </label>

                <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {rev.review_images_gallery?.map((img, i) => (
                    <div key={i} className="relative w-10 h-10 rounded border border-gray-300 overflow-hidden shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt="Review" />
                        <button
                        onClick={() =>
                            updateReview(
                            idx,
                            'review_images_gallery',
                            rev.review_images_gallery.filter((_, idxImg) => idxImg !== i)
                            )
                        }
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                        type="button"
                        >
                        <Icon name="XMarkIcon" size={10} />
                        </button>
                    </div>
                    ))}
                    <label className="text-[10px] font-bold text-blue-600 flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition-colors bg-white px-3 py-2 rounded border border-blue-200 shadow-sm h-10">
                    <Icon name="PhotoIcon" size={16} /> Sumar Foto
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                        if (!e.target.files?.length) return;
                        const urls: string[] = [];
                        for (const file of Array.from(e.target.files)) urls.push(await uploadToSupabase(file));
                        updateReview(idx, 'review_images_gallery', [...(rev.review_images_gallery || []), ...urls]);
                        }}
                    />
                    </label>
                </div>
                </div>
            </div>
            ))}
        </div>
        <button
            onClick={addReview}
            className="w-full py-3 mt-2 border-2 border-dashed border-yellow-400 text-yellow-700 bg-yellow-50/50 text-xs font-bold rounded-xl hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
            type="button"
        >
            <Icon name="PlusIcon" size={16} /> Agregar Nueva Reseña
        </button>
        </FormAccordion>

        {/* 8. PREGUNTAS FRECUENTES */}
        <FormAccordion title="Preguntas Frecuentes" icon="❓">
        <div className="space-y-4">
            {form.faq_content.map((faq, idx) => (
            <div key={idx} className="p-5 bg-white border border-gray-200 rounded-xl relative shadow-sm">
                <button
                onClick={() => removeFAQ(idx)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-600 transition-colors"
                type="button"
                >
                <Icon name="XMarkIcon" size={18} />
                </button>
                <div className="space-y-3 pr-6">
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Pregunta</label>
                    <input
                    value={faq.question}
                    onChange={(e) => updateFAQ(idx, 'question', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-semibold focus:bg-white outline-none transition-colors"
                    placeholder="Ej: ¿Tiene garantía?"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Respuesta</label>
                    <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(idx, 'answer', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm h-20 resize-y focus:bg-white outline-none transition-colors"
                    placeholder="Sí, tiene 1 año..."
                    />
                </div>
                </div>
            </div>
            ))}
        </div>
        <button
            onClick={addFAQ}
            className="w-full py-3 mt-2 border-2 border-dashed border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            type="button"
        >
            <Icon name="PlusIcon" size={16} /> Agregar Pregunta
        </button>
        </FormAccordion>

        {/* 9. POLÍTICAS Y CONDICIONES */}
        <FormAccordion title="Políticas y Condiciones (Desplegables)" icon="📜">
        <div className="space-y-6 max-w-4xl">
            <FormattedTextarea
            label="Garantía y Devoluciones"
            emoji="↩️"
            value={form.warranty_info}
            onChange={(val) => setForm((s) => ({ ...s, warranty_info: val }))}
            placeholder="Ej: Tenés 30 días para devoluciones..."
            />
            <FormattedTextarea
            label="Política de Envíos"
            emoji="🚚"
            value={form.shipping_info}
            onChange={(val) => setForm((s) => ({ ...s, shipping_info: val }))}
            placeholder="Ej: Envío gratis en compras mayores a $2000. Despachos en 24hs..."
            />
            <FormattedTextarea
            label="Medios de Pago"
            emoji="💳"
            value={form.payment_info}
            onChange={(val) => setForm((s) => ({ ...s, payment_info: val }))}
            placeholder="Ej: 12 cuotas sin recargo con MercadoPago. Compra 100% protegida."
            />
        </div>
        </FormAccordion>

        {/* 10. ESTADO DE PUBLICACIÓN */}
        <FormAccordion title="Estado de Publicación" icon={<Icon name="CheckBadgeIcon" size={18} />} isDark={true} defaultOpen={true}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 cursor-pointer border border-gray-700 bg-gray-800 px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors shadow-sm">
            <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                className="w-5 h-5 rounded text-green-500 bg-gray-900 border-gray-600 focus:ring-green-500 flex-shrink-0"
            />
            <span className="text-sm font-bold text-gray-200">🟢 Publicado</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border border-gray-700 bg-gray-800 px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors shadow-sm">
            <input
                type="checkbox"
                checked={form.show_on_home}
                onChange={(e) => setForm((s) => ({ ...s, show_on_home: e.target.checked }))}
                className="w-5 h-5 rounded text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-sm font-bold text-gray-200">🏠 Home</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border border-gray-700 bg-gray-800 px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors shadow-sm">
            <input
                type="checkbox"
                checked={form.is_accessory}
                onChange={(e) => setForm((s) => ({ ...s, is_accessory: e.target.checked }))}
                className="w-5 h-5 rounded text-blue-400 bg-gray-900 border-gray-600 focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-sm font-bold text-gray-200">🎧 Accesorio</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border border-gray-700 bg-gray-800 px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors shadow-sm">
            <input
                type="checkbox"
                checked={form.is_outlet}
                onChange={(e) => setForm((s) => ({ ...s, is_outlet: e.target.checked }))}
                className="w-5 h-5 rounded text-red-500 bg-gray-900 border-gray-600 focus:ring-red-500 flex-shrink-0"
            />
            <span className="text-sm font-bold text-gray-200">🔥 Outlet</span>
            </label>
        </div>
        </FormAccordion>
    </div>
    </div>
);
}