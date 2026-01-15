'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface AddToCartSectionProps {
  productId: string;
  productName: string;
  price: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  availableModels: Array<{ id: string; name: string; price: number }>;
}

export default function AddToCartSection({
  productId,
  productName,
  price,
  stockStatus,
  availableModels,
}: AddToCartSectionProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);
  const [isAdding, setIsAdding] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      router.push('/shopping-cart');
    }, 800);
  };

  const handleBuyNow = () => {
    router.push('/checkout-payment');
  };

  const selectedModelData = availableModels.find((m) => m.id === selectedModel);
  const totalPrice = (selectedModelData?.price || price) * quantity;

  return (
    <div className="sticky top-20 bg-card rounded-lg p-6 space-y-6 shadow-lg">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Seleccionar Modelo
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-4 rounded-md border-2 transition-smooth focus-ring ${
                selectedModel === model.id
                  ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium text-foreground mb-1">
                {model.name}
              </p>
              <p className="text-lg font-mono font-bold text-primary">
                ${model.price.toLocaleString('es-UY')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Cantidad
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
          >
            <Icon name="MinusIcon" size={20} className="text-foreground" />
          </button>
          <span className="text-2xl font-mono font-bold text-foreground min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 10}
            className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
          >
            <Icon name="PlusIcon" size={20} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Price Summary */}
      <div className="p-4 bg-muted rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-base font-mono font-medium text-foreground">
            ${totalPrice.toLocaleString('es-UY')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Envío</span>
          <span className="text-base font-mono font-medium text-success">
            Gratis
          </span>
        </div>
        <div className="h-px bg-border my-3" />
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-foreground">Total</span>
          <span className="text-2xl font-mono font-bold text-primary">
            ${totalPrice.toLocaleString('es-UY')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={stockStatus === 'out-of-stock' || isAdding}
          className="w-full px-6 py-4 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium rounded-md transition-smooth focus-ring flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <Icon name="CheckCircleIcon" size={20} variant="solid" />
              Agregado al carrito
            </>
          ) : (
            <>
              <Icon name="ShoppingCartIcon" size={20} />
              Agregar al carrito
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={stockStatus === 'out-of-stock'}
          className="w-full px-6 py-4 bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed text-accent-foreground font-medium rounded-md transition-smooth focus-ring flex items-center justify-center gap-2"
        >
          <Icon name="BoltIcon" size={20} variant="solid" />
          Comprar ahora
        </button>
      </div>

      {/* Stock Warning */}
      {stockStatus === 'low-stock' && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-md">
          <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0" variant="solid" />
          <p className="text-sm text-warning">
            ¡Stock limitado! Solo quedan pocas unidades disponibles en Uruguay.
          </p>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Icon name="TruckIcon" size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground">Envío gratis</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="ShieldCheckIcon" size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground">Compra segura</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="ArrowPathIcon" size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground">Devolución 30 días</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="CreditCardIcon" size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground">Pago seguro</span>
        </div>
      </div>
    </div>
  );
}