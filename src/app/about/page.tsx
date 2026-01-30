'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function AboutPage() {
  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-200">
      
      {/* Header de la sección */}
      <div className="bg-neutral-900/30 border-b border-neutral-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-900/30 text-red-500 text-xs font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
            Nuestra Historia
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white leading-tight">
            La historia detrás de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-600">
              POV Store
            </span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            De una frustración personal a tu tienda de confianza en Uruguay
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-20 space-y-24">
        
        {/* El Problema */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
              <Icon name="ExclamationCircleIcon" size={24} className="text-red-500" variant="solid" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">El Problema</h2>
          </div>
          
          <p className="text-xl leading-relaxed text-neutral-300">
            Todo empezó con una búsqueda frustrada. Queríamos grabar nuestros viajes y momentos cotidianos con buena calidad, pero nos encontramos con una pared: en Uruguay solo había dos opciones.
          </p>
          
          <div className="relative pl-8 py-6 border-l-4 border-red-900/50 bg-neutral-900/30 rounded-r-xl pr-6">
            <Icon name="QuoteIcon" size={32} className="absolute -left-4 top-4 text-red-900/30" />
            <p className="text-lg italic text-neutral-400 leading-relaxed">
              "O gastabas una fortuna en una cámara profesional (más de USD 400), o comprabas una cámara genérica barata que se rompía a la semana."
            </p>
          </div>
        </section>

        {/* Nuestra Misión */}
        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center">
              <Icon name="LightBulbIcon" size={24} className="text-blue-500" variant="solid" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">Nuestra Misión</h2>
          </div>
          
          <p className="text-xl leading-relaxed text-neutral-300">
            Ahí nos dimos cuenta de que faltaba algo. Faltaba el equilibrio.{' '}
            <strong className="text-white font-semibold">Somos Constanza y Gonzalo</strong>, una pareja de emprendedores apasionados por la tecnología y los viajes.
          </p>
          
          <p className="text-lg leading-relaxed text-neutral-400">
            No somos influencers ni creadores de contenido; simplemente nos gusta coleccionar recuerdos. Queríamos capturar lo que vivimos, pero sentíamos que el celular nos "robaba" la experiencia: queríamos vivir el momento con las manos libres, sin una pantalla de por medio.
          </p>
          
          <p className="text-lg leading-relaxed text-neutral-400">
            Por eso decidimos buscar la solución. Investigamos, contactamos proveedores y trajimos a Uruguay la línea{' '}
            <strong className="text-white font-semibold">SJCAM</strong>, la marca que lidera el mercado mundial en relación precio-calidad.
          </p>
        </section>

        {/* ¿Por qué POV? */}
        <section className="bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 p-10 rounded-2xl border border-neutral-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-900/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="EyeIcon" size={32} className="text-red-500" variant="solid" />
              <h3 className="text-2xl font-bold text-white">¿Por qué POV?</h3>
            </div>
            <p className="text-lg text-neutral-300 leading-relaxed">
              POV significa <span className="text-white font-semibold">Point Of View (Punto de Vista)</span>. 
              Creemos que las mejores historias son las que se muestran tal cual se viven, desde tu propia perspectiva, 
              sin filtros ni ediciones excesivas.
            </p>
          </div>
        </section>

        {/* Nuestro Compromiso */}
        <section className="space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">Nuestro Compromiso</h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              No somos una gran corporación ni un algoritmo. Somos una tienda atendida por sus dueños.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: 'CheckCircleIcon',
                title: 'Stock Real',
                desc: 'Todo lo que ves en la web, está en Uruguay listo para despachar.',
                color: 'text-green-500',
                bgColor: 'bg-green-900/10',
                borderColor: 'border-green-900/30'
              },
              {
                icon: 'ShieldCheckIcon',
                title: 'Garantía Local',
                desc: 'Si tenés un problema, hablás con nosotros, no con un bot en China.',
                color: 'text-blue-500',
                bgColor: 'bg-blue-900/10',
                borderColor: 'border-blue-900/30'
              },
              {
                icon: 'HeartIcon',
                title: 'Curaduría',
                desc: 'Solo vendemos lo que nosotros mismos usaríamos.',
                color: 'text-red-500',
                bgColor: 'bg-red-900/10',
                borderColor: 'border-red-900/30'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`${item.bgColor} p-8 rounded-2xl border ${item.borderColor} hover:scale-105 transition-all duration-300`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full ${item.bgColor} flex items-center justify-center`}>
                    <Icon name={item.icon as any} size={32} className={item.color} variant="solid" />
                  </div>
                  <h4 className="text-xl font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cierre personal */}
        <div className="text-center pt-12 space-y-6">
          <div className="space-y-4">
            <p className="text-xl font-medium text-white leading-relaxed">
              Gracias por confiar en este proyecto y por animarte a capturar tu mundo en primera persona.
            </p>
            <p className="text-2xl font-bold text-red-500">
              — Conti y Gonza
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <Link
              href="/homepage"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all shadow-lg"
            >
              Conocé nuestros productos
              <Icon name="ArrowRightIcon" size={18} />
            </Link>
          </div>

          {/* Redes sociales */}
          <div className="flex items-center justify-center gap-6 pt-8">
            <a
              href="https://www.instagram.com/povstore.uy/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-red-500 hover:bg-neutral-800 transition-all"
            >
              <Icon name="CameraIcon" size={20} className="text-neutral-400 hover:text-white" />
            </a>
            <a
              href="https://www.tiktok.com/@povstore.uy"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-red-500 hover:bg-neutral-800 transition-all"
            >
              <Icon name="MusicalNoteIcon" size={20} className="text-neutral-400 hover:text-white" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}