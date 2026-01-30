'use client';

import Icon from '@/components/ui/AppIcon';

export default function PrivacyPage() {
  return (
    <div className="bg-black min-h-screen text-neutral-200 pb-24">
      
      <div className="bg-neutral-900 border-b border-neutral-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-green-600 font-bold tracking-widest text-sm uppercase">Legal</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Política de Privacidad
          </h1>
          <p className="text-neutral-400">Tus datos están seguros con nosotros.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-neutral-900 rounded-lg">
              <Icon name="LockClosedIcon" size={24} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Nuestro Compromiso</h2>
          </div>
          <p className="text-neutral-400 leading-relaxed">
            En POV Store Uruguay nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando visitas nuestro sitio web. No vendemos ni compartimos tus datos con terceros para fines comerciales.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">1. Información que Recopilamos</h2>
          <p className="text-neutral-400">Podemos recopilar la siguiente información cuando realizas una compra o te contactas con nosotros:</p>
          <ul className="grid gap-3 md:grid-cols-2 mt-4">
            <li className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 text-sm text-neutral-300">
              <strong className="text-white block mb-1">Datos de Contacto</strong>
              Nombre, dirección de correo electrónico, número de teléfono.
            </li>
            <li className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 text-sm text-neutral-300">
              <strong className="text-white block mb-1">Datos de Envío</strong>
              Dirección física para la entrega de productos.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Uso de la Información</h2>
          <p className="text-neutral-400 leading-relaxed">
            Utilizamos tus datos exclusivamente para:
          </p>
          <ul className="list-disc pl-5 text-neutral-400 space-y-2">
            <li>Procesar y enviar tus pedidos.</li>
            <li>Comunicarnos contigo sobre el estado de tu compra.</li>
            <li>Responder a tus consultas de soporte o garantía.</li>
            <li>Mejorar nuestra web y servicios (datos anónimos).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. Seguridad de Datos</h2>
          <p className="text-neutral-400 leading-relaxed">
            Implementamos medidas de seguridad para proteger tu información. Nuestro sitio web utiliza encriptación SSL (Secure Socket Layer) para garantizar que los datos transmitidos entre tu navegador y nuestro servidor sean privados y seguros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">4. Tus Derechos</h2>
          <p className="text-neutral-400 leading-relaxed">
            Tienes derecho a acceder, corregir o solicitar la eliminación de tu información personal de nuestra base de datos en cualquier momento. Solo tienes que escribirnos a través de nuestra sección de contacto.
          </p>
        </section>

      </div>
    </div>
  );
}