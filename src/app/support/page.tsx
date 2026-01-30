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
        <Icon name={isOpen ? "MinusIcon" : "PlusIcon"} size={16} className="text-neutral-500" />
      </button>
      {isOpen && <div className="pb-4 text-neutral-400 text-sm leading-relaxed">{answer}</div>}
    </div>
  );
};

export default function SupportPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-blue-500 font-bold tracking-widest text-sm uppercase">Centro de Ayuda</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Soporte y Garantía
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Manuales, descargas, preguntas frecuentes y todo lo que necesitas para sacarle el máximo provecho a tu cámara.
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
              Controlá tu cámara, descargá tus videos al celular sin cables y compartí en redes al instante.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://apps.apple.com/us/app/sjcam-zone/id991679682" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                <Icon name="DevicePhoneMobileIcon" size={14} /> iOS Store
              </a>
              <a href="https://play.google.com/store/apps/details?id=org.jght.sjcam.zone" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                <Icon name="DevicePhoneMobileIcon" size={14} /> Android
              </a>
            </div>
          </div>

          {/* Tarjeta Manuales */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="DocumentTextIcon" size={20} className="text-yellow-500" />
              Manuales de Usuario
            </h3>
            <div className="space-y-3">
              <a href="/documents/manual-c100plus.pdf" download className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group">
                <span className="text-sm text-neutral-300">Descargar Manual C100+</span>
                <Icon name="ArrowDownTrayIcon" size={16} className="text-neutral-500 group-hover:text-white" />
              </a>
              <a href="/documents/manual-c200.pdf" download className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 border border-neutral-800 hover:border-neutral-700 transition-all group">
                <span className="text-sm text-neutral-300">Descargar Manual C200</span>
                <Icon name="ArrowDownTrayIcon" size={16} className="text-neutral-500 group-hover:text-white" />
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
                answer="Recomendamos tarjetas MicroSD Clase 10 / U3 de alta velocidad. Capacidad ideal: 64GB o 128GB. Nota: Las tarjetas genéricas antiguas pueden no soportar la grabación 4K y causar errores." 
              />
              <FAQItem 
                question="¿Tienen garantía?" 
                answer="Sí. Ofrecemos garantía local de 3 meses por defectos de fábrica. Si tienes un problema, lo resolvemos en Uruguay, sin intermediarios ni bots." 
              />
              <FAQItem 
                question="¿Cómo paso los videos al celular?" 
                answer="¡Es muy fácil! La cámara crea su propia red Wifi. Te conectas desde la App oficial de SJCAM Zone (gratuita) y descargas los videos a tu galería en segundos. Sin cables ni computadoras." 
              />
              <FAQItem 
                question="¿Sirve para deportes acuáticos?" 
                answer={
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>C100+:</strong> Resistente a salpicaduras. Para sumergirla hasta 30 metros, necesitas usar la carcasa impermeable (incluida en la caja).</li>
                    <li><strong>C200:</strong> El cuerpo es resistente IPX4 (Lluvia/Salpicaduras). Para buceo o inmersión total, debes usar la carcasa incluida (soporta hasta 40 metros de profundidad).</li>
                  </ul>
                } 
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
                <strong>¿Dónde envían?</strong><br/>
                Realizamos envíos a todo Uruguay a través de agencias confiables (DAC, Mirtrans, etc.).
              </p>
              <p>
                <strong>¿Cuánto demora?</strong><br/>
                Despachamos dentro de las 24hs hábiles siguientes a tu compra. El tiempo de entrega de la agencia suele ser de 24 a 48hs dependiendo de tu localidad.
              </p>
              <p className="text-sm text-neutral-500 italic border-t border-neutral-800 pt-4 mt-4">
                Nota: POV Store no se responsabiliza por demoras ocasionadas exclusivamente por terceros (agencias de envío), aunque siempre te ayudaremos a gestionar cualquier reclamo.
              </p>
            </div>
          </section>

          {/* Política de Garantía */}
          <section id="warranty" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Icon name="ShieldCheckIcon" size={24} className="text-blue-500" />
              Garantía y Devoluciones
            </h2>
            <div className="space-y-6">
              
              <div className="bg-neutral-900/50 p-6 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-white mb-2">1. Garantía por Defectos (3 Meses)</h3>
                <p className="text-neutral-400 text-sm mb-3">
                  Todos nuestros productos cuentan con 90 días de garantía exclusivamente por fallas de fabricación (ej: problemas de encendido, carga o software).
                </p>
                <div className="bg-black/30 p-3 rounded text-xs text-neutral-500">
                  <strong>No cubre:</strong> Golpes, rayaduras, daños por agua (por mal uso de carcasa), uso de cargadores incorrectos (carga rápida de celular) o desgaste estético.
                  <br/><br/>
                  <em>Importante: La garantía cubre el funcionamiento del equipo, no la disconformidad con las especificaciones técnicas del modelo.</em>
                </div>
              </div>

              <div className="bg-neutral-900/50 p-6 rounded-xl border-l-4 border-red-500">
                <h3 className="text-lg font-bold text-white mb-2">2. Cambios y Devoluciones (5 Días)</h3>
                <p className="text-neutral-400 text-sm mb-3">
                  Si te arrepentiste de la compra, tenés 5 días hábiles desde la recepción para devolver el producto.
                </p>
                <ul className="text-sm text-neutral-400 list-disc pl-4 space-y-1">
                  <li><strong>Condición obligatoria:</strong> El producto debe estar cerrado, sellado con su film original y sin uso.</li>
                  <li>No se aceptan devoluciones de productos abiertos o usados (por razones de higiene y garantía de que es un producto nuevo para el próximo cliente).</li>
                </ul>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}