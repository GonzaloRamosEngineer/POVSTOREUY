import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
        <Icon name="ShoppingCartIcon" size={48} className="text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
        Tu carrito está vacío
      </h2>
      
      <p className="text-base text-muted-foreground mb-8 max-w-md">
        Descubre nuestras cámaras POV 4K y comienza a crear contenido profesional hoy mismo
      </p>
      
      <Link
        href="/homepage"
        className="flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-semibold rounded-md transition-smooth focus-ring"
      >
        <Icon name="VideoCameraIcon" size={20} className="text-primary-foreground" variant="solid" />
        Ver Productos
      </Link>
    </div>
  );
}