'use client';

import { useState, useEffect } from 'react';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import ProductSpecs from './ProductSpecs';
import AddToCartSection from './AddToCartSection';
import CustomerReviews from './CustomerReviews';
import RelatedProducts from './RelatedProducts';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
}

interface Specification {
  icon: string;
  label: string;
  value: string;
}

interface Review {
  id: string;
  author: string;
  authorImage: string;
  authorImageAlt: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface RelatedProduct {
  id: string;
  name: string;
  model: string;
  price: number;
  image: string;
  imageAlt: string;
  rating: number;
}

interface ProductModel {
  id: string;
  name: string;
  price: number;
}

export default function ProductDetailsInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const galleryImages: GalleryImage[] = [
  {
    id: '1',
    url: "https://images.unsplash.com/photo-1687313217063-0f1e74b04139",
    alt: 'Cámara POV 4K mini negra con lente gran angular sobre superficie blanca con iluminación profesional',
    type: 'image'
  },
  {
    id: '2',
    url: "https://images.unsplash.com/photo-1576530934139-64e185cec9f2",
    alt: 'Vista lateral de cámara POV mostrando botones de control y puerto de carga USB-C',
    type: 'image'
  },
  {
    id: '3',
    url: "https://images.unsplash.com/photo-1594063435209-c6effa6430e8",
    alt: 'Cámara POV montada en casco de ciclista con correa de seguridad ajustable',
    type: 'image'
  },
  {
    id: '4',
    url: "https://img.rocket.new/generatedImages/rocket_gen_img_111891fc3-1768293369748.png",
    alt: 'Pantalla LCD de cámara POV mostrando interfaz de grabación 4K con indicadores de batería',
    type: 'video'
  }];


  const specifications: Specification[] = [
  {
    icon: 'VideoCameraIcon',
    label: 'Resolución de video',
    value: '4K a 30fps / 1080p a 60fps'
  },
  {
    icon: 'CameraIcon',
    label: 'Resolución de foto',
    value: '12 megapíxeles'
  },
  {
    icon: 'BoltIcon',
    label: 'Batería',
    value: '1200mAh - Hasta 90 minutos de grabación'
  },
  {
    icon: 'CircleStackIcon',
    label: 'Almacenamiento',
    value: 'MicroSD hasta 128GB (no incluida)'
  },
  {
    icon: 'WifiIcon',
    label: 'Conectividad',
    value: 'WiFi 2.4GHz + Bluetooth 5.0'
  },
  {
    icon: 'DevicePhoneMobileIcon',
    label: 'Dimensiones',
    value: '59 x 41 x 30 mm - Peso: 58g'
  },
  {
    icon: 'BeakerIcon',
    label: 'Resistencia',
    value: 'Resistente a salpicaduras IPX4'
  },
  {
    icon: 'CubeIcon',
    label: 'Accesorios incluidos',
    value: 'Cable USB-C, manual, soporte adhesivo'
  }];


  const reviews: Review[] = [
  {
    id: '1',
    author: 'Martín González',
    authorImage: "https://images.unsplash.com/photo-1612993013894-3e0959edb6be",
    authorImageAlt: 'Hombre joven con barba corta y camisa azul sonriendo a la cámara',
    rating: 5,
    date: '15/12/2025',
    comment: 'Excelente calidad de imagen para el precio. La uso para grabar mis videos de skateboarding y la calidad 4K es impresionante. Muy fácil de usar y la batería dura bastante.',
    verified: true
  },
  {
    id: '2',
    author: 'Carolina Rodríguez',
    authorImage: "https://img.rocket.new/generatedImages/rocket_gen_img_109550d11-1766719301487.png",
    authorImageAlt: 'Mujer joven con cabello castaño largo y suéter gris en ambiente natural',
    rating: 4,
    date: '08/12/2025',
    comment: 'Muy buena cámara para crear contenido. La conectividad WiFi funciona perfecto con mi celular. Solo le faltaría un poco más de duración de batería para sesiones largas.',
    verified: true
  },
  {
    id: '3',
    author: 'Diego Fernández',
    authorImage: "https://images.unsplash.com/photo-1616100984013-d22e7f92af46",
    authorImageAlt: 'Hombre con barba y gafas de sol en exterior con luz natural',
    rating: 5,
    date: '02/12/2025',
    comment: 'Perfecta para mis vlogs de viaje. Compacta, liviana y la calidad de video es profesional. El envío fue rápido y llegó en perfecto estado. Totalmente recomendada.',
    verified: true
  }];


  const relatedProducts: RelatedProduct[] = [
  {
    id: '1',
    name: 'Cámara POV 4K Mini - Básico',
    model: 'Básico',
    price: 3990,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_145aa2022-1764901074668.png",
    imageAlt: 'Cámara POV modelo básico en color negro con diseño compacto',
    rating: 4.5
  },
  {
    id: '2',
    name: 'Kit de Accesorios POV',
    model: 'Accesorios',
    price: 1490,
    image: "https://images.unsplash.com/photo-1611488885465-3ff29ddcec53",
    imageAlt: 'Set completo de accesorios para cámara POV incluyendo soportes y correas',
    rating: 4.8
  },
  {
    id: '3',
    name: 'Tarjeta MicroSD 128GB',
    model: 'Almacenamiento',
    price: 890,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_118fff099-1768293368607.png",
    imageAlt: 'Tarjeta de memoria MicroSD de alta velocidad para grabación 4K',
    rating: 4.7
  },
  {
    id: '4',
    name: 'Batería Extra POV',
    model: 'Batería',
    price: 690,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_130ac41b9-1768293368741.png",
    imageAlt: 'Batería recargable de repuesto para cámara POV con cargador USB',
    rating: 4.6
  }];


  const availableModels: ProductModel[] = [
  { id: 'basico', name: 'Básico', price: 3990 },
  { id: 'pro', name: 'Pro', price: 5490 }];


  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 space-y-12">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-5">
            <ProductGallery images={galleryImages} productName="Cámara POV 4K Mini" />
          </div>

          {/* Product Info */}
          <div className="lg:col-span-4">
            <ProductInfo
              name="Cámara POV 4K Mini - Pro"
              model="Pro"
              price={5490}
              originalPrice={6990}
              rating={4.8}
              reviewCount={127}
              stockStatus="low-stock"
              stockCount={8}
              description="Filma en 4K lo que ven tus ojos. Cámara ultra compacta diseñada para creadores de contenido que buscan calidad profesional sin el precio de las marcas premium. Perfecta para vlogs, deportes extremos y grabación POV." />

          </div>

          {/* Add to Cart */}
          <div className="lg:col-span-3">
            <AddToCartSection
              productId="pov-pro"
              productName="Cámara POV 4K Mini - Pro"
              price={5490}
              stockStatus="low-stock"
              availableModels={availableModels} />

          </div>
        </div>

        {/* Specifications */}
        <ProductSpecs specifications={specifications} />

        {/* Customer Reviews */}
        <CustomerReviews
          reviews={reviews}
          averageRating={4.8}
          totalReviews={127} />


        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>);

}