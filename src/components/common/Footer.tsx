'use client';

import Link from 'next/link';
import Image from 'next/image'; // Importamos Image de Next.js
import Icon from '@/components/ui/AppIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // Usamos bg-neutral-950 para mantener el estilo "Pro" oscuro consistente con el resto
    <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* --- GRID DE ENLACES PRINCIPALES --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* 1. Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* LOGO CON IMAGEN PNG TRANSPARENTE */}
              <div className="relative w-10 h-10 flex-shrink-0">
                 <Image 
                    src="/icon.png" // Ruta a tu icono en /public
                    alt="POV Store Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                 />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">POV Store</h3>
                <p className="text-xs text-neutral-500 font-medium">Uruguay</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Cámaras POV 4K para creadores de contenido. Calidad profesional a precio accesible.
            </p>
          </div>

          {/* 2. Productos (Links específicos recuperados) */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Productos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  href="/products/1aabfacb-5f35-4bcf-9e6d-0316483d8362" 
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                >
                  C100 Plus
                </Link>
              </li>
              <li>
                <Link 
                  href="/products/c98290bd-884f-49ce-9554-71a0210638f8" 
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                >
                  C200
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Ofertas
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Soporte */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Soporte</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/support#shipping" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/support#warranty" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/support#warranty" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Garantía
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Legal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-neutral-400 hover:text-red-500 transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- MÉTODOS DE PAGO (Recuperado y estilizado Dark) --- */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest text-center mb-6">
            Métodos de Pago Aceptados
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-neutral-900 rounded-md flex items-center gap-2 border border-neutral-800">
              <Icon name="CreditCardIcon" size={20} className="text-red-500" />
              <span className="text-sm text-neutral-300">MercadoPago</span>
            </div>
            <div className="px-4 py-2 bg-neutral-900 rounded-md flex items-center gap-2 border border-neutral-800">
              <Icon name="BanknotesIcon" size={20} className="text-green-500" />
              <span className="text-sm text-neutral-300">Transferencia</span>
            </div>
            <div className="px-4 py-2 bg-neutral-900 rounded-md flex items-center gap-2 border border-neutral-800">
              <Icon name="DevicePhoneMobileIcon" size={20} className="text-blue-500" />
              <span className="text-sm text-neutral-300">Efectivo</span>
            </div>
          </div>
        </div>

        {/* --- ACCIONES MÓVILES (Admin + Scroll Top) --- */}
        <div className="md:hidden border-t border-neutral-800 pt-6 mb-6">
          <div className="flex items-center justify-between gap-3">
            {/* Admin camuflado (Móvil) */}
            <Link
              href="/admin-login"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-white transition-colors"
              aria-label="Admin"
              title="Admin"
            >
              <Icon name="LockClosedIcon" size={16} />
            </Link>

            {/* Subir (Móvil) */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-900 hover:bg-red-600 border border-neutral-800 hover:border-red-600 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all"
              aria-label="Subir"
            >
              <Icon name="ChevronUpIcon" size={16} />
              Subir
            </button>
          </div>
        </div>

        {/* --- BARRA INFERIOR (Copyright + Firma + Redes + Admin Desktop) --- */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Copyright y Firma */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-sm text-neutral-500 text-center md:text-left">
              © {currentYear} POV Store Uruguay. Todos los derechos reservados.
            </p>

            {/* Firma DigitalMatchGlobal (Recuperada y estilizada para fondo oscuro) */}
            <a
              href="https://www.digitalmatchglobal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-red-500/30 transition-all duration-500 overflow-hidden"
              aria-label="Made by DigitalMatchGlobal"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />
              <span className="relative text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                Made by
              </span>
              <span className="relative text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">
                DigitalMatchGlobal
              </span>
              <Icon
                name="SparklesIcon"
                size={14}
                className="relative text-neutral-500 group-hover:text-yellow-400 transition-colors"
              />
            </a>
          </div>

          {/* Redes Sociales y Acciones Desktop */}
          <div className="flex items-center gap-4">
            {/* Redes */}
            <a
              href="https://instagram.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center bg-neutral-900 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-600 rounded-full text-neutral-400 hover:text-white transition-all duration-300"
              aria-label="Instagram"
            >
              <Icon name="CameraIcon" size={18} />
            </a>
            <a
              href="https://facebook.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center bg-neutral-900 hover:bg-blue-600 rounded-full text-neutral-400 hover:text-white transition-all duration-300"
              aria-label="Facebook"
            >
              <Icon name="UserGroupIcon" size={18} />
            </a>
            <a
              href="https://youtube.com/@povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center bg-neutral-900 hover:bg-red-600 rounded-full text-neutral-400 hover:text-white transition-all duration-300"
              aria-label="YouTube"
            >
              <Icon name="PlayIcon" size={18} />
            </a>

            {/* 🔒 Admin camuflado SOLO desktop */}
            <Link
              href="/admin-login"
              className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white transition-all"
              aria-label="Admin"
              title="Admin"
            >
              <Icon name="LockClosedIcon" size={16} />
            </Link>

            {/* ⬆️ Scroll top SOLO desktop */}
            <button
              type="button"
              onClick={scrollToTop}
              className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              aria-label="Scroll to top"
              title="Subir"
            >
              <Icon name="ChevronUpIcon" size={18} />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;