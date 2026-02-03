'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const FAQItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-red-500 transition-colors"
      >
        <span className="font-medium text-white">{question}</span>
        <Icon name={isOpen ? 'MinusIcon' : 'PlusIcon'} size={16} className="text-neutral-500" />
      </button>
      {isOpen && <div className="pb-4 text-neutral-400 text-sm leading-relaxed">{answer}</div>}
    </div>
  );
};

export default function SupportPageContent() {
  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-blue-500 font-bold tracking-widest text-sm uppercase">
            Centro de Ayuda
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">Soporte y Garantía</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Manuales, descargas, preguntas frecuentes y todo lo que necesitas para sacarle el máximo
            provecho a tu cámara.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* COLUMNA IZQUIERDA: Navegación Rápida / App */}
        <div className="lg:col-span-4 space-y-8">
          {/* Tarjeta APP */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Icon name="VideoCameraIcon" size={24} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white">SJCAM Zone</h3>
                <p className="text-xs text-neutral-500">App Oficial Gratuita</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-6">
              Controlá tu cámara, descargá tus videos al celular sin cables y compartí en redes al
              instante.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://apps.apple.com/us/app/sjcam-zone/id991679682"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 py-2 rounded-lg text-xs font-bold text-white transition-colors"
              >
                <Icon name="DevicePhoneMobileIcon" size={14} /> iOS Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=org.jght.sjcam.zone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 py-2 rounded-lg text-xs font-bold text-white transition-colors"
              >
                <Icon name="DevicePhoneMobileIcon" size={14} /> Android
              </a>
            </div>
          </div>

          {/* Tarjeta Manuales */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="DocumentTextIcon" size={20} className="text-yellow-500" />
              Manuales y Guias de Usuario
            </h3>
            <div className="space-y-3">
              <a
                href="/documents/manual-c100plus.pdf"
                download
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <span className="text-sm text-neutral-300">Descargar Manual C100+</span>
                <Icon
                  name="ArrowDownTrayIcon"
                  size={16}
                  className="text-neutral-500 group-hover:text-white"
                />
              </a>
              <a
                href="/documents/manual-c200.pdf"
                download
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <span className="text-sm text-neutral-300">Descargar Manual C200</span>
                <Icon
                  name="ArrowDownTrayIcon"
                  size={16}
                  className="text-neutral-500 group-hover:text-white"
                />
              </a>

              <a
                href="/documents/guia-configuracion-c100+.pdf"
                download
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <span className="text-sm text-neutral-300">
                  Descargar Guia de Configuración C100+
                </span>
                <Icon
                  name="ArrowDownTrayIcon"
                  size={16}
                  className="text-neutral-500 group-hover:text-white"
                />
              </a>
              <a
                href="/documents/guia-configuracion-c200.pdf"
                download
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <span className="text-sm text-neutral-300">
                  Descargar Guia de Configuración C200
                </span>
                <Icon
                  name="ArrowDownTrayIcon"
                  size={16}
                  className="text-neutral-500 group-hover:text-white"
                />
              </a>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FAQ, Envíos y Garantía */}
        <div className="lg:col-span-8 space-y-16">
          {/* FAQ */}
          <section id="faq">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Icon name="ChatBubbleLeftRightIcon" size={24} className="text-neutral-500" />
              Preguntas Frecuentes
            </h2>

            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
              <FAQItem
                question="¿Qué tarjeta de memoria necesito?"
                answer="Para un buen rendimiento recomendamos tarjetas MicroSD de alta velocidad (Clase 10 / U3). La capacidad ideal es 64GB o 128GB. El uso de memorias genéricas o lentas puede generar cortes, errores de grabación o archivos corruptos."
              />

              <FAQItem
                question="¿El producto tiene garantía?"
                answer="Sí. Todos nuestros productos cuentan con garantía del vendedor por 30 días ante fallas de funcionamiento (por ejemplo: no enciende, no carga o presenta un error que impide su uso normal). No cubre daños por golpes, agua por mal uso, desgaste estético ni disconformidad con el rendimiento esperado."
              />

              <FAQItem
                question="¿Cómo paso los videos al celular?"
                answer="La cámara crea su propia red WiFi. Solo tenés que conectarte desde la app oficial SJCAM Zone (gratuita para Android e iOS) y descargar los videos directamente al celular. No necesitás cables ni computadora."
              />

              <FAQItem
                question="¿Sirve para deportes acuáticos?"
                answer={
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>C100+:</strong> Apta para deportes acuáticos utilizando la carcasa
                      impermeable incluida.
                    </li>
                    <li>
                      <strong>C200:</strong> El cuerpo resiste salpicaduras y lluvia. Para inmersión
                      total o buceo, se debe usar la carcasa incluida.
                    </li>
                  </ul>
                }
              />

              <FAQItem
                question="¿Incluye accesorios?"
                answer="Sí. Ambos modelos incluyen un kit completo de accesorios con anclajes para casco, bici, superficies curvas y planas, además de la carcasa protectora."
              />
            </div>
          </section>

          {/* --- SECCIÓN NUEVA: ENVÍOS --- */}
          <section id="shipping" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Icon name="TruckIcon" size={24} className="text-green-500" />
              Envíos y Entregas
            </h2>
            <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 text-neutral-300 space-y-4">
              <p>
                <strong>¿Dónde envían?</strong>
                <br />
                Realizamos envíos a todo Uruguay a través de agencias confiables (DAC, PedidosYa,
                etc).
              </p>
              <p>
                <strong>¿Cuánto demora?</strong>
                <br />
                Despachamos dentro de las 24hs hábiles siguientes a tu compra. El tiempo de entrega
                de la agencia suele ser de 24 a 48hs dependiendo de tu localidad.
              </p>
              <p className="text-sm text-neutral-500 italic border-t border-neutral-800 pt-4 mt-4">
                Nota: POV Store no se responsabiliza por demoras ocasionadas exclusivamente por
                terceros (agencias de envío), aunque siempre te ayudaremos a gestionar cualquier
                reclamo.
              </p>
            </div>
          </section>

          {/* Garantía y Devoluciones */}
          <section id="warranty" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Icon name="ShieldCheckIcon" size={24} className="text-blue-500" />
              Garantía y Devoluciones
            </h2>

            <div className="space-y-6">
              {/* 1. Garantía */}
              <div className="bg-neutral-900/50 p-6 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-white mb-2">
                  1. Garantía por fallas de funcionamiento (30 días)
                </h3>
                <p className="text-neutral-400 text-sm mb-3">
                  En POV STORE UY brindamos <strong>30 días de garantía</strong> por fallas de
                  funcionamiento del equipo (por ejemplo: no enciende, no carga, no graba o presenta
                  un error que impide su uso normal).
                </p>

                <div className="bg-black/30 p-3 rounded text-xs text-neutral-500 space-y-2">
                  <p>
                    <strong>Para gestionar la garantía:</strong> necesitaremos tu número de pedido y
                    una breve evidencia (video o fotos) que muestre el inconveniente. Nuestro
                    objetivo es resolverlo rápido y sin vueltas.
                  </p>

                  <p>
                    <strong>No cubre:</strong> golpes, caídas, rayaduras, desgaste estético, daños
                    por agua por uso incorrecto (por ejemplo, usar sin carcasa cuando corresponde),
                    manipulación o reparación por terceros, accesorios dañados por mal uso, ni daños
                    por cargar con fuentes no recomendadas (cargadores de carga rápida o no
                    certificados).
                  </p>

                  <p>
                    <em>
                      Importante: la garantía cubre fallas de funcionamiento. No aplica por
                      disconformidad con el rendimiento esperado si el producto funciona según sus
                      especificaciones técnicas.
                    </em>
                  </p>
                </div>
              </div>

              {/* 2. Cambios y devoluciones */}
              <div className="bg-neutral-900/50 p-6 rounded-xl border-l-4 border-red-500">
                <h3 className="text-lg font-bold text-white mb-2">
                  2. Cambios y devoluciones (5 días hábiles)
                </h3>
                <p className="text-neutral-400 text-sm mb-3">
                  Si te arrepentiste de la compra, tenés <strong>5 días hábiles</strong> desde la
                  recepción para solicitar la devolución.
                </p>

                <ul className="text-sm text-neutral-400 list-disc pl-4 space-y-1">
                  <li>
                    <strong>Condición obligatoria:</strong> el producto debe estar{' '}
                    <strong>sin uso</strong>, con su caja, manuales y accesorios completos, y en el
                    mismo estado en que fue entregado.
                  </li>
                  <li>
                    Si el producto fue usado, presenta marcas, faltantes o daño, la devolución puede
                    rechazarse o aplicar una retención por reacondicionamiento.
                  </li>
                  <li>
                    Por motivos de seguridad e higiene, no aceptamos devoluciones de productos que
                    hayan sido expuestos a agua o que presenten señales de uso intensivo.
                  </li>
                </ul>

                <div className="bg-black/30 p-3 rounded text-xs text-neutral-500 mt-3">
                  <strong>Costos de envío:</strong> si la devolución es por arrepentimiento, el
                  costo de envío puede estar a cargo del comprador. Si es por falla de
                  funcionamiento dentro de la garantía, nos hacemos cargo del proceso de solución
                  según corresponda.
                </div>
              </div>

              {/* 3. Soporte */}
              <div className="bg-neutral-900/50 p-6 rounded-xl border-l-4 border-emerald-500">
                <h3 className="text-lg font-bold text-white mb-2">3. Soporte post-venta</h3>
                <p className="text-neutral-400 text-sm">
                  No te dejamos solo. Te ayudamos con la configuración inicial (tarjeta de memoria
                  recomendada, ajustes de video y uso de la app) para que puedas aprovechar la
                  cámara desde el primer día.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
