'use client';

import Icon from '@/components/ui/AppIcon';

export default function TermsPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-red-600 font-bold tracking-widest text-sm uppercase">Legal</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Términos y Condiciones
          </h1>
          <p className="text-neutral-400">Última actualización: Enero 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="DocumentTextIcon" size={24} className="text-red-500" />
            1. Introducción
          </h2>
          <p className="text-neutral-400 leading-relaxed">
            Bienvenido a <strong>POV Store Uruguay</strong>. Al acceder y utilizar nuestro sitio web, aceptas estar sujeto a los siguientes términos y condiciones. Nos reservamos el derecho de actualizar o cambiar cualquier parte de estos términos sin previo aviso.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Productos y Precios</h2>
          <p className="text-neutral-400 leading-relaxed">
            Nos esforzamos por mostrar con la mayor precisión posible los colores, características y especificaciones de nuestros productos (cámaras SJCAM y accesorios). Sin embargo, no garantizamos que la descripción sea totalmente libre de errores.
          </p>
          <ul className="list-disc pl-5 text-neutral-400 space-y-2">
            <li>Todos los precios están expresados en Pesos Uruguayos ($) e incluyen IVA.</li>
            <li>Nos reservamos el derecho de modificar los precios en cualquier momento.</li>
            <li>Las ofertas y promociones son válidas mientras figuren en la web o hasta agotar stock.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. Envíos y Entregas</h2>
          <p className="text-neutral-400 leading-relaxed">
            Realizamos envíos a todo Uruguay. Los tiempos de entrega son estimados y pueden variar según la empresa logística. POV Store no se responsabiliza por demoras ocasionadas por terceros (agencias de envío), aunque siempre te ayudaremos a gestionar cualquier reclamo.
          </p>
        </section>

        <section className="space-y-4 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
          <h2 className="text-xl font-bold text-white mb-4">4. Política de Garantía y Devoluciones</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-bold mb-2">Garantía por Defectos (3 Meses)</h3>
              <p className="text-neutral-400 text-sm">
                Todos nuestros productos cuentan con 90 días de garantía exclusivamente por fallas de fabricación (ej: problemas de encendido, carga o software).
              </p>
              <p className="text-neutral-500 text-xs mt-2 italic">
                No cubre: Golpes, rayaduras, daños por agua, uso de cargadores incorrectos o desgaste estético.
              </p>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <h3 className="text-white font-bold mb-2">Cambios y Devoluciones (5 Días)</h3>
              <p className="text-neutral-400 text-sm">
                Si te arrepentiste de la compra, tenés 5 días hábiles desde la recepción para devolver el producto.
                <br/>
                <span className="text-red-400 font-medium">Condición obligatoria:</span> El producto debe estar cerrado, sellado con su film original y sin uso.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">5. Propiedad Intelectual</h2>
          <p className="text-neutral-400 leading-relaxed">
            Todo el contenido de este sitio (textos, imágenes, logos, videos) es propiedad de POV Store Uruguay o de sus proveedores y está protegido por las leyes de derechos de autor.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">6. Contacto</h2>
          <p className="text-neutral-400 leading-relaxed">
            Para cualquier duda sobre estos términos, por favor contáctanos a través de nuestras redes sociales o formulario de contacto.
          </p>
        </section>

      </div>
    </div>
  );
}