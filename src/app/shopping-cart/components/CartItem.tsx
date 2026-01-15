'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
  stock: number;
  onQuantityChange: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({
  id,
  name,
  price,
  quantity,
  image,
  alt,
  stock,
  onQuantityChange,
  onRemove
}: CartItemProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleIncrement = () => {
    if (quantity < stock) {
      onQuantityChange(id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(id, quantity - 1);
    }
  };

  const handleRemoveClick = () => {
    setShowRemoveDialog(true);
  };

  const confirmRemove = () => {
    onRemove(id);
    setShowRemoveDialog(false);
  };

  const cancelRemove = () => {
    setShowRemoveDialog(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border border-border">
        {/* Product Image */}
        <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-background rounded-md overflow-hidden">
          <AppImage
            src={image}
            alt={alt}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground mb-2">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Stock disponible: {stock} unidades
            </p>
          </div>

          {/* Quantity Controls - Mobile */}
          <div className="flex sm:hidden items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
                aria-label="Disminuir cantidad"
              >
                <Icon name="MinusIcon" size={20} className="text-foreground" />
              </button>
              <span className="text-base font-mono font-medium text-foreground min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= stock}
                className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
                aria-label="Aumentar cantidad"
              >
                <Icon name="PlusIcon" size={20} className="text-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-mono font-semibold text-primary">
                ${(price * quantity).toLocaleString('es-UY')}
              </p>
              <button
                onClick={handleRemoveClick}
                className="flex items-center justify-center w-10 h-10 bg-error/10 hover:bg-error/20 rounded-md transition-smooth focus-ring"
                aria-label="Eliminar producto"
              >
                <Icon name="TrashIcon" size={20} className="text-error" />
              </button>
            </div>
          </div>
        </div>

        {/* Quantity Controls - Desktop */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
              aria-label="Disminuir cantidad"
            >
              <Icon name="MinusIcon" size={20} className="text-foreground" />
            </button>
            <span className="text-base font-mono font-medium text-foreground min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= stock}
              className="flex items-center justify-center w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-smooth focus-ring"
              aria-label="Aumentar cantidad"
            >
              <Icon name="PlusIcon" size={20} className="text-foreground" />
            </button>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-lg font-mono font-semibold text-primary">
              ${(price * quantity).toLocaleString('es-UY')}
            </p>
            <button
              onClick={handleRemoveClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-md transition-smooth focus-ring"
            >
              <Icon name="TrashIcon" size={16} className="text-error" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-error/10 rounded-full flex-shrink-0">
                <Icon name="ExclamationTriangleIcon" size={24} className="text-error" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  ¿Eliminar producto?
                </h3>
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar "{name}" de tu carrito?
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={cancelRemove}
                className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-md transition-smooth focus-ring"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2.5 bg-error hover:bg-error/90 text-error-foreground font-medium rounded-md transition-smooth focus-ring"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}