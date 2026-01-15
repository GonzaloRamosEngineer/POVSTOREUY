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
  }];


  const handlePrevious = () => {
    setCurrentIndex((prev) => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev === testimonials.length - 1 ? 0 : prev + 1);
  };

  if (!isHydrated) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Creadores uruguayos que ya confían en POV Camera
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) =>
                    <Icon key={i} name="StarIcon" size={20} className="text-accent" variant="solid" />
                    )}
                  </div>
                  <p className="text-lg text-foreground italic">Cargando testimonios...</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Cliente</span>
                    <span>•</span>
                    <span>Uruguay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>);

  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-muted-foreground">
            Creadores uruguayos que ya confían en POV Camera
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-card rounded-xl shadow-lg p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-primary/20">
                  <AppImage
                    src={currentTestimonial.image}
                    alt={currentTestimonial.alt}
                    className="w-full h-full object-cover" />

                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex gap-1 justify-center md:justify-start">
                  {[...Array(currentTestimonial.rating)].map((_, i) =>
                  <Icon key={i} name="StarIcon" size={20} className="text-accent" variant="solid" />
                  )}
                </div>

                <p className="text-lg text-foreground italic leading-relaxed">
                  "{currentTestimonial.comment}"
                </p>

                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-lg">
                    {currentTestimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTestimonial.role}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center md:justify-start">
                    <Icon name="MapPinIcon" size={16} className="text-primary" />
                    <span>{currentTestimonial.location}, Uruguay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePrevious}
              className="w-12 h-12 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-smooth focus-ring"
              aria-label="Previous testimonial">

              <Icon name="ChevronLeftIcon" size={24} className="text-foreground" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) =>
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-smooth ${
                index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'}`
                }
                aria-label={`Go to testimonial ${index + 1}`} />

              )}
            </div>

            <button
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-smooth focus-ring"
              aria-label="Next testimonial">

              <Icon name="ChevronRightIcon" size={24} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;