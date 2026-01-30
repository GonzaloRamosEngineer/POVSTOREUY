'use client';

import Icon from '@/components/ui/AppIcon';

export default function ContactPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200">
      
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-green-500 font-bold tracking-widest text-sm uppercase">Hablemos</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Contacto
          </h1>
          <p className="text-neutral-400">
            ¿Tenés dudas? Hablá directo con nosotros (Coni y Gonza).
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Opción 1: WhatsApp (La preferida) */}
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 flex flex-col items-center text-center space-y-4 hover:border-green-500/50 transition-colors group">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              {/* Usamos ChatBubble como simulación de WhatsApp si no tienes el ícono específico */}
              <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white">WhatsApp</h3>
            <p className="text-sm text-neutral-400">
              La forma más rápida de responderte. Estamos disponibles de Lunes a Viernes de 10 a 19hs.
            </p>
            <a 
              href="https://wa.me/59899123456" // REEMPLAZAR CON TU NÚMERO REAL
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors w-full"
            >
              Enviar Mensaje
            </a>
          </div>

          {/* Opción 2: Email */}
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-colors group">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="EnvelopeIcon" size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Email</h3>
            <p className="text-sm text-neutral-400">
              Para consultas más detalladas, propuestas comerciales o temas de garantía.
            </p>
            <a 
              href="mailto:contacto@povstore.uy" // REEMPLAZAR CON TU MAIL REAL
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors w-full"
            >
              contacto@povstore.uy
            </a>
          </div>

        </div>

        {/* Redes Sociales */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-bold text-white mb-6">Seguinos en redes</h3>
          <div className="flex justify-center gap-6">
            <a href="https://instagram.com/povstoreuruguay" target="_blank" className="p-4 bg-neutral-900 rounded-full hover:bg-neutral-800 text-white transition-colors">
              <Icon name="CameraIcon" size={24} />
            </a>
            {/* Agrega más redes si tienes */}
          </div>
        </div>

      </div>
    </div>
  );
}