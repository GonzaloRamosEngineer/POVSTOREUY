'use client';

import { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  alt: string;
  rating: number;
  comment: string;
  location: string;
}

const TestimonialsSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Martín González',
      role: 'YouTuber de Deportes',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_18b7a37d2-1763296591359.png",
      alt: 'Young Hispanic man with short dark hair wearing sports jersey smiling at camera',
      rating: 5,
      comment: 'La mejor inversión para mi canal. La calidad 4K es increíble y el tamaño compacto me permite filmar en cualquier lugar. Mis suscriptores notaron la diferencia inmediatamente.',
      location: 'Montevideo'
    },
    {
      id: 2,
      name: 'Sofía Rodríguez',
      role: 'Travel Blogger',
      image: "https://images.unsplash.com/photo-1538576435936-9c9c32ec42a5",
      alt: 'Young woman with long brown hair in casual outdoor clothing holding camera with mountain backdrop',
      rating: 5,
      comment: 'Viajo por todo Uruguay documentando lugares increíbles. Esta cámara es perfecta: ligera, resistente y la batería dura todo el día. No puedo creer el precio tan accesible.',
      location: 'Punta del Este'
    },
    {
      id: 3,
      name: 'Diego Fernández',
      role: 'Emprendedor Digital',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_10c925a7f-1763294244184.png",
      alt: 'Professional man with beard wearing business casual attire in modern office environment',
      rating: 5,
      comment: 'Uso la POV Camera para crear contenido de mis productos. La calidad es profesional y el precio es una fracción de lo que costaría una GoPro. Totalmente recomendada.',
      location: 'Colonia'
    },
    {
      id: 4,
      name: 'Valentina Castro',
      role: 'Influencer de Fitness',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1f29350ee-1763300591956.png",
      alt: 'Athletic woman with ponytail in workout clothes doing exercise in modern gym',
      rating: 5,
      comment: 'Perfecta para grabar mis rutinas de entrenamiento. El ángulo POV hace que mis seguidores sientan que están entrenando conmigo. La estabilización es excelente.',
      location: 'Maldonado'
    }
  ];

  const handlePrevious = () => {
    setCurrentIndex((prev) => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev === testimonials.length - 1 ? 0 : prev + 1);
  };

  const currentTestimonial = testimonials[currentIndex];

  if (!isHydrated) {
    return (
      <section className="py-24 px-4 bg-black border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-neutral-400">
              Creadores uruguayos que ya confían en POV Camera
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-800">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-800" />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-lg text-white italic">Cargando testimonios...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 bg-black border-t border-neutral-900 relative overflow-hidden">
      {/* Efecto de luz ambiental roja muy sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-neutral-400 font-light">
            Creadores uruguayos que ya confían en <span className="text-red-500 font-semibold">POV Camera</span>
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-neutral-800 hover:border-red-900/30 transition-colors duration-500">
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start">
              
              {/* Imagen del Cliente */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                  <AppImage
                    src={currentTestimonial.image}
                    alt={currentTestimonial.alt}
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left">
                {/* Estrellas - Ahora doradas/ámbar para contraste premium */}
                <div className="flex gap-1.5 justify-center md:justify-start">
                  {[...Array(currentTestimonial.rating)].map((_, i) =>
                    <Icon key={i} name="StarIcon" size={20} className="text-yellow-500 drop-shadow-sm" variant="solid" />
                  )}
                </div>

                <div className="relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-neutral-800 font-serif opacity-50">"</span>
                  <p className="text-xl md:text-2xl text-neutral-200 italic leading-relaxed font-light relative z-10">
                    {currentTestimonial.comment}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <p className="font-bold text-white text-lg tracking-wide">
                    {currentTestimonial.name}
                  </p>
                  <p className="text-sm text-red-400 font-medium mb-2">
                    {currentTestimonial.role}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 justify-center md:justify-start">
                    <Icon name="MapPinIcon" size={14} className="text-neutral-600" />
                    <span>{currentTestimonial.location}, Uruguay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={handlePrevious}
              className="w-12 h-12 flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:border-red-600/50 hover:bg-neutral-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 group"
              aria-label="Previous testimonial"
            >
              <Icon name="ChevronLeftIcon" size={24} className="text-neutral-400 group-hover:text-white transition-colors" />
            </button>

            <div className="flex gap-3">
              {testimonials.map((_, index) =>
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-red-600 w-8 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                      : 'bg-neutral-800 w-2 hover:bg-neutral-600'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`} 
                />
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:border-red-600/50 hover:bg-neutral-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 group"
              aria-label="Next testimonial"
            >
              <Icon name="ChevronRightIcon" size={24} className="text-neutral-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;