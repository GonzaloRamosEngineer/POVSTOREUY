import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const FooterSection = () => {
  const currentYear = new Date()?.getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
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
                <Link href="/product-details" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  POV Básico
                </Link>
              </li>
              <li>
                <Link href="/product-details" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  POV Pro
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
          <h4 className="text-sm font-semibold text-foreground mb-4 text-center">
            Métodos de Pago Aceptados
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2">
              <Icon name="CreditCardIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">MercadoPago</span>
            </div>
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2">
              <Icon name="BanknotesIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">Transferencia</span>
            </div>
            <div className="px-4 py-2 bg-muted rounded-md flex items-center gap-2">
              <Icon name="DevicePhoneMobileIcon" size={20} className="text-primary" />
              <span className="text-sm text-foreground">Efectivo</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} POV Store Uruguay. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring"
              aria-label="Instagram"
            >
              <Icon name="CameraIcon" size={16} className="text-foreground hover:text-primary-foreground" />
            </a>
            <a
              href="https://facebook.com/povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring"
              aria-label="Facebook"
            >
              <Icon name="UserGroupIcon" size={16} className="text-foreground hover:text-primary-foreground" />
            </a>
            <a
              href="https://youtube.com/@povstoreuruguay"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-muted hover:bg-primary rounded-full transition-smooth focus-ring"
              aria-label="YouTube"
            >
              <Icon name="PlayIcon" size={16} className="text-foreground hover:text-primary-foreground" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;