// src/types/product.ts

// 1. Tipos para la nueva funcionalidad "Estilo SJCAM"
export type StorySectionType = 'full_banner' | 'image_left' | 'image_right' | 'full_video';

export interface StorySection {
  type: StorySectionType;
  title: string;
  description?: string;
  image_url: string;
  text_color?: 'dark' | 'light';
}

export interface TechSpecs {
  [key: string]: string; 
}

// NUEVO: Tipo para Preguntas Frecuentes
export interface FAQItem {
  question: string;
  answer: string;
}

// 2. Tipo auxiliar para el status de stock
export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';

// 3. LA DEFINICIÓN MAESTRA DEL PRODUCTO
export interface Product {
  id: string;
  name: string;
  model: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  stock_count: number;
  stock_status: StockStatus;
  
  features: string[] | null; 
  
  rating: number;
  review_count: number;
  badge: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  gallery: string[] | null;
  video_url: string | null;
  
  colors: any[] | null;
  addon_ids: string[] | null;
  show_on_home: boolean;

  // --- LAS NUEVAS COLUMNAS ---
  story_content: StorySection[] | null;
  tech_specs: TechSpecs | null;
  faq_content: FAQItem[] | null; // <--- AGREGADO
}