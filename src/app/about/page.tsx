'use client';

import Icon from '@/components/ui/AppIcon';

export default function AboutPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200">
      
      {/* Header de la sección */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-red-600 font-bold tracking-widest text-sm uppercase">Mundo POV</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            La historia detrás de <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">POV Store</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        
        {/* El Problema */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <Icon name="ExclamationCircleIcon" size={24} />
            <h2 className="text-2xl font-bold text-white">El Problema</h2>
          </div>
          <p className="text-lg leading-relaxed text-neutral-400">
            Todo empezó con una búsqueda frustrada. Queríamos grabar nuestros viajes y momentos cotidianos con buena calidad, pero nos encontramos con una pared: en Uruguay solo había dos opciones.
          </p>
          <div className="pl-6 border-l-2 border-red-900/50 italic text-neutral-500">
            "O gastabas una fortuna en una cámara profesional (más de USD 400), o comprabas una cámara genérica barata que se rompía a la semana."
          </div>
        </section>

        {/* Nuestra Misión */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Icon name="LightBulbIcon" size={24} />
            <h2 className="text-2xl font-bold text-white">Nuestra Misión</h2>
          </div>
          <p className="text-lg leading-relaxed text-neutral-400">
            Ahí nos dimos cuenta de que faltaba algo. Faltaba el equilibrio. <strong className="text-white">Somos Constanza y Gonzalo</strong>, una pareja de emprendedores apasionados por la tecnología y los viajes.
          </p>
          <p className="text-lg leading-relaxed text-neutral-400">
            No somos influencers ni creadores de contenido; simplemente nos gusta coleccionar recuerdos. Queríamos capturar lo que vivimos, pero sentíamos que el celular nos "robaba" la experiencia: queríamos vivir el momento con las manos libres, sin una pantalla de por medio.
          </p>
          <p className="text-lg leading-relaxed text-neutral-400">
            Por eso decidimos buscar la solución. Investigamos, contactamos proveedores y trajimos a Uruguay la línea <strong className="text-white">SJCAM</strong>, la marca que lidera el mercado mundial en relación precio-calidad.
          </p>
        </section>

        {/* ¿Por qué POV? */}
        <section className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
          <h3 className="text-xl font-bold text-white mb-4">¿Por qué POV?</h3>
          <p className="text-neutral-400">
            POV significa <span className="text-white font-semibold">Point Of View (Punto de Vista)</span>. Creemos que las mejores historias son las que se muestran tal cual se viven.
          </p>
        </section>

        {/* Nuestro Compromiso */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-white">Nuestro Compromiso</h2>
          <p className="text-neutral-400">
            No somos una gran corporación ni un algoritmo. Somos una tienda atendida por sus dueños.
          </p>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-red-900/50 transition-colors">
              <Icon name="CheckCircleIcon" size={32} className="text-green-500 mb-4" />
              <h4 className="font-bold text-white mb-2">Stock Real</h4>
              <p className="text-sm text-neutral-500">Todo lo que ves en la web, está en Uruguay listo para despachar.</p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-red-900/50 transition-colors">
              <Icon name="ShieldCheckIcon" size={32} className="text-green-500 mb-4" />
              <h4 className="font-bold text-white mb-2">Garantía Local</h4>
              <p className="text-sm text-neutral-500">Si tenés un problema, hablás con nosotros, no con un bot en China.</p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-red-900/50 transition-colors">
              <Icon name="HeartIcon" size={32} className="text-green-500 mb-4" />
              <h4 className="font-bold text-white mb-2">Curaduría</h4>
              <p className="text-sm text-neutral-500">Solo vendemos lo que nosotros mismos usaríamos.</p>
            </div>
          </div>
        </section>

        <div className="text-center pt-8 border-t border-neutral-800">
          <p className="text-lg font-medium text-white">
            Gracias por confiar en este proyecto y por animarte a capturar tu mundo en primera persona.
          </p>
          <p className="text-red-500 font-bold mt-2">- Conti y Gonza</p>
        </div>

      </div>
    </div>
  );
}