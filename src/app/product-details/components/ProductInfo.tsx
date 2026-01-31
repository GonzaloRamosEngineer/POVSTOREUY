import Icon from '@/components/ui/AppIcon';

interface ProductInfoProps {
  name: string;
  model: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockCount?: number;
  description: string;
}

export default function ProductInfo({
  name,
  model,
  price,
  originalPrice,
  rating,
  reviewCount,
  stockStatus,
  stockCount,
  description,
}: ProductInfoProps) {
  const stockMessages = {
    'in-stock': 'En stock',
    'low-stock': `¡Solo quedan ${stockCount} unidades!`,
    'out-of-stock': 'Agotado',
  };

  const stockColors = {
    'in-stock': 'text-success',
    'low-stock': 'text-warning',
    'out-of-stock': 'text-error',
  };

  return (
    <div className="space-y-6">
      {/* Product Title */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {model}
          </span>
          <div className={`flex items-center gap-1 ${stockColors[stockStatus]}`}>
            <Icon name="CheckCircleIcon" size={16} variant="solid" />
            <span className="text-xs font-medium">{stockMessages[stockStatus]}</span>
          </div>
        </div>
        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
          {name}
        </h1>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Icon
              key={i}
              name="StarIcon"
              size={20}
              variant={i < Math.floor(rating) ? 'solid' : 'outline'}
              className={i < Math.floor(rating) ? 'text-accent' : 'text-muted-foreground'}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)} ({reviewCount} reseñas)
        </span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-mono font-bold text-primary">
          ${price.toLocaleString('es-UY')}
        </span>
        {originalPrice && (
          <span className="text-xl font-mono text-muted-foreground line-through">
            ${originalPrice.toLocaleString('es-UY')}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="prose prose-invert max-w-none">
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Icon name="VideoCameraIcon" size={20} className="text-primary" variant="solid" />
          <span className="text-sm text-foreground">Grabación 4K</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Icon name="BoltIcon" size={20} className="text-primary" variant="solid" />
          <span className="text-sm text-foreground">Carga rápida</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Icon name="WifiIcon" size={20} className="text-primary" variant="solid" />
          <span className="text-sm text-foreground">WiFi integrado</span>
        </div>
        {/* <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Icon name="ShieldCheckIcon" size={20} className="text-primary" variant="solid" />
          <span className="text-sm text-foreground">Garantía 1 año</span>
        </div> */}
      </div>
    </div>
  );
}