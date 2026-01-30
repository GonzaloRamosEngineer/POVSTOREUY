'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                <Icon name="VideoCameraIcon" size={24} className="text-primary-foreground" variant="solid" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground">POV Store</h3>
                <p className="text-xs text-muted-foreground">Uruguay</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Cámaras POV 4K para creadores de contenido. Calidad profesional a precio accesible.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Productos</h4>
            <ul className="space-y-2">
              <li>
                {/* CORREGIDO: Apunta al ancla de productos en la homepage */}
                <Link
                  href="/products/1aabfacb-5f35-4bcf-9e6d-0316483d8362"
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  C100 Plus
                </Link>
              </li>
              <li>
                {/* CORREGIDO: Apunta al ancla de productos en la homepage */}
                <Link
                  href="/products/c98290bd-884f-49ce-9554-71a0210638f8"
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  C200 Pro
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Ofertas
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Soporte</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Garantía
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/homepage" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-border pt-8 mb-8">
          <h4 className="text-sm font-semibold text-foreground mb-4 text-center">Métodos de Pago Aceptados</h4>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2 border border-border/50">
              <Icon name="CreditCardIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">MercadoPago</span>
            </div>
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2 border border-border/50">
              <Icon name="BanknotesIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">Transferencia</span>
            </div>
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2 border border-border/50">
              <Icon name="DevicePhoneMobileIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">Efectivo</span>
            </div>
          </div>
        </div>

        {/* ✅ MOBILE ACTIONS: Admin camuflado (solo ícono) */}
        <div className="md:hidden border-t border-border pt-6 mb-6">
          <div className="flex items-center justify-between gap-3">
            {/* Admin: solo ícono, chiquito, low-opacity */}
            <Link
              href="/admin-login"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/60 border border-border text-muted-foreground/40 hover:text-muted-foreground/70 transition-smooth focus-ring"
              aria-label="Admin"
              title="Admin"
            >
              <Icon name="LockClosedIcon" size={16} className="text-current" />
            </Link>

            {/* Subir */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-primary border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-smooth"
              aria-label="Subir"
            >
              <Icon name="ChevronUpIcon" size={16} className="text-current" />
              Subir
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} POV Store Uruguay. Todos los derechos reservados.
            </p>

            {/* Firma DigitalMatchGlobal */}
            <a
              href="https://www.digitalmatchglobal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border hover:border-primary/40 transition-all duration-500 overflow-hidden"
              aria-label="Made by DigitalMatchGlobal"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />
              <span className="relative text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Made by
              </span>
              <span className="relative text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                DigitalMatchGlobal
              </span>
              <Icon
                name="SparklesIcon"
                size={14}
                className="relative text-muted-foreground group-hover:text-primary transition-colors"
              />
            </a>
          </div>

          <div className="flex items-center gap-4">
            {/* Redes */}
            <a
              href="https://instagram.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring group"
              aria-label="Instagram"
            >
              <Icon name="CameraIcon" size={16} className="text-foreground group-hover:text-white" />
            </a>
            <a
              href="https://facebook.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring group"
              aria-label="Facebook"
            >
              <Icon name="UserGroupIcon" size={16} className="text-foreground group-hover:text-white" />
            </a>
            <a
              href="https://youtube.com/@povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring group"
              aria-label="YouTube"
            >
              <Icon name="PlayIcon" size={16} className="text-foreground group-hover:text-white" />
            </a>

            {/* 🔒 Admin camuflado SOLO desktop: solo ícono y bajita opacidad */}
            <Link
              href="/admin-login"
              className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted/20 hover:bg-muted/50 border border-border text-muted-foreground/35 hover:text-muted-foreground/70 transition-smooth focus-ring"
              aria-label="Admin"
              title="Admin"
            >
              <Icon name="LockClosedIcon" size={16} className="text-current" />
            </Link>

            {/* ⬆️ Scroll top SOLO desktop (mobile ya tiene arriba) */}
            <button
              type="button"
              onClick={scrollToTop}
              className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full bg-muted hover:bg-primary transition-smooth focus-ring group"
              aria-label="Scroll to top"
              title="Subir"
            >
              <Icon name="ChevronUpIcon" size={16} className="text-foreground group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;