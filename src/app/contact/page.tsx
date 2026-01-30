'use client';

import Icon from '@/components/ui/AppIcon';

export default function ContactPage() {
  
  // 1. Configuración de WhatsApp con mensaje personalizado
  const phoneNumber = '59897801202';
  const message = '¡Hola POV Store! 👋 Vi su web y quiero consultar sobre las cámaras de acción y accesorios. ¿Me podrían asesorar?';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // 2. Enlace real de Google Maps para esa dirección (Rodó 2219)
  // Usé el embed oficial para que funcione perfecto.
  const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3271.782869824634!2d-56.17188742426867!3d-34.91196197284534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f81a762031023%3A0xc6f376483561730!2sJos%C3%A9%20Enrique%20Rod%C3%B3%202219%2C%2011200%20Montevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1sen!2suy!4v1706626000000!5m2!1sen!2suy";

  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-200">
      
      {/* HEADER */}
      <div className="bg-neutral-900/50 border-b border-neutral-800 py-20 px-4 relative overflow-hidden">
        {/* Fondo decorativo sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-green-500/5 blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-green-900/20 border border-green-900/30 text-green-500 font-bold tracking-widest text-xs uppercase animate-pulse">
            Estamos en línea
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight">
            Hablemos.
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            ¿Tenés dudas sobre qué cámara elegir? Hablá directo con nosotros (Conti y Gonza). Te asesoramos sin compromiso.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* COLUMNA IZQUIERDA: CONTACTO DIRECTO */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Icon name="ChatBubbleLeftRightIcon" size={24} className="text-green-500" />
              Canales de Atención
            </h2>

            {/* Opción 1: WhatsApp (Destacada) */}
            <a 
              href={whatsappUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="group block bg-neutral-900 p-8 rounded-2xl border border-neutral-800 hover:border-green-500/50 hover:bg-neutral-800 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon name="ChatBubbleLeftRightIcon" size={80} />
              </div>
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Icon name="ChatBubbleLeftRightIcon" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">WhatsApp Oficial</h3>
                  <p className="text-neutral-400 text-sm mt-1 mb-4">
                    Respuesta rápida. Ideal para consultas técnicas, ventas y dudas rápidas.
                  </p>
                  <span className="inline-flex items-center gap-2 text-green-500 font-bold text-sm underline decoration-green-500/30 underline-offset-4 group-hover:decoration-green-500 transition-all">
                    Enviar mensaje ahora
                    <Icon name="ArrowRightIcon" size={16} />
                  </span>
                </div>
              </div>
            </a>

            {/* Opción 2: Email */}
            <a 
              href="mailto:info@povstore.uy"
              className="group block bg-neutral-900 p-8 rounded-2xl border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-800 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Icon name="EnvelopeIcon" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Correo Electrónico</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Para propuestas comerciales, garantías o temas administrativos.
                  </p>
                  <p className="text-neutral-300 font-mono mt-3">info@povstore.uy</p>
                </div>
              </div>
            </a>
          </div>

          {/* COLUMNA DERECHA: UBICACIÓN Y MAPA */}
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Icon name="MapPinIcon" size={24} className="text-red-500" />
              Pickup Center
            </h2>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              {/* Info de Dirección */}
              <div className="p-8 border-b border-neutral-800">
                 <div className="flex items-start gap-4">
                    <div className="mt-1">
                       <Icon name="BuildingStorefrontIcon" size={24} className="text-neutral-400" />
                    </div>
                    <div>
                       <p className="text-white font-bold text-lg">Barrio Cordón Sur</p>
                       <p className="text-neutral-400 mt-1">José Enrique Rodó 2219</p>
                       <p className="text-neutral-500 text-sm mt-2">Montevideo, Uruguay</p>
                    </div>
                 </div>
                 <div className="mt-6 flex gap-4 text-sm">
                    <div className="px-3 py-1 bg-neutral-800 rounded text-neutral-300 border border-neutral-700">
                       Lunes a Viernes: 10:00 - 19:00
                    </div>
                 </div>
              </div>

              {/* MAPA EMBEBIDO (Con filtro Dark Mode) */}
              <div className="w-full h-[300px] relative bg-neutral-800">
                <iframe 
                  src={mapSrc}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }} // TRUCO PARA MAPA OSCURO
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa Ubicación POV Store"
                  className="absolute inset-0"
                />
                {/* Overlay para que no sea tan brillante el invert */}
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-overlay" />
              </div>
              
              <div className="p-4 bg-neutral-950 text-center">
                 <a 
                   href="https://maps.app.goo.gl/aA6gPgUvXruSeSfz8" // Puedes poner el link directo aquí si quieres
                   target="_blank"
                   className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                 >
                   Abrir en Google Maps <Icon name="ArrowUpRightIcon" size={12} />
                 </a>
              </div>
            </div>

          </div>

        </div>

        {/* REDES SOCIALES */}
        <div className="mt-20 pt-10 border-t border-neutral-900 text-center">
          <p className="text-neutral-500 mb-6">Seguinos para ver tips, reviews y aventuras de la comunidad</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://instagram.com/povstore.uy" 
              target="_blank" 
              className="w-12 h-12 flex items-center justify-center bg-neutral-900 rounded-full text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-red-500/20"
            >
              <Icon name="CameraIcon" size={24} /> {/* Icono simulando Instagram */}
            </a>
            {/* Puedes agregar TikTok u otros aquí */}
          </div>
        </div>

      </div>
    </div>
  );
}