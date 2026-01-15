import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface RelatedProduct {
  id: string;
  name: string;
  model: string;
  price: number;
  image: string;
  imageAlt: string;
  rating: number;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        Productos Relacionados
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href="/product-details"
            className="group bg-muted rounded-md overflow-hidden hover:shadow-lg transition-smooth focus-ring"
          >
            <div className="relative aspect-square overflow-hidden bg-background">
              <AppImage
                src={product.image}
                alt={product.imageAlt}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-1 bg-primary rounded-full">
                <span className="text-xs font-medium text-primary-foreground">
                  {product.model}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
                {product.name}
              </h3>

              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    name="StarIcon"
                    size={12}
                    variant={i < Math.floor(product.rating) ? 'solid' : 'outline'}
                    className={i < Math.floor(product.rating) ? 'text-accent' : 'text-muted-foreground'}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {product.rating.toFixed(1)}
                </span>
              </div>

              <p className="text-lg font-mono font-bold text-primary">
                ${product.price.toLocaleString('es-UY')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}