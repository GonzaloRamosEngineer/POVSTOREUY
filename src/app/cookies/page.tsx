'use client';

import Icon from '@/components/ui/AppIcon';

export default function CookiesPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-yellow-600 font-bold tracking-widest text-sm uppercase">Legal</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Política de Cookies
          </h1>
          <p className="text-neutral-400">Transparencia sobre cómo funciona nuestra web.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">¿Qué son las Cookies?</h2>
          <p className="text-neutral-400 leading-relaxed">
            Las cookies son pequeños archivos de texto que los sitios web guardan en tu computadora o celular. No son virus ni programas maliciosos. Sirven para que la web "recuerde" tus acciones y preferencias (como mantener tu carrito de compras lleno mientras navegas).
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">¿Qué Cookies usamos?</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="mt-1"><Icon name="ShoppingCartIcon" size={24} className="text-blue-500" /></div>
              <div>
                <h3 className="font-bold text-white">Cookies Esenciales</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Son estrictamente necesarias para que el sitio funcione. Por ejemplo, las que permiten que puedas agregar productos al carrito y finalizar la compra de forma segura.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="mt-1"><Icon name="ChartBarIcon" size={24} className="text-yellow-500" /></div>
              <div>
                <h3 className="font-bold text-white">Cookies de Analítica</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Nos ayudan a entender cómo los usuarios usan nuestra web (qué páginas visitan más, cuánto tiempo se quedan) para poder mejorar la experiencia. Esta información es anónima.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Control de Cookies</h2>
          <p className="text-neutral-400 leading-relaxed">
            Puedes controlar y/o eliminar las cookies como desees. Puedes borrar todas las cookies que ya están en tu computadora y puedes configurar la mayoría de los navegadores para que eviten su instalación. Sin embargo, si haces esto, es posible que algunas funcionalidades de nuestra tienda (como el carrito de compras) no funcionen correctamente.
          </p>
        </section>

      </div>
    </div>
  );
}