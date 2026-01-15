'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface MercadoPagoFormProps {
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}

export default function MercadoPagoForm({ onSubmit, isProcessing }: MercadoPagoFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    installments: '1'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Número de tarjeta inválido';
    }
    if (!formData.cardName || formData.cardName.length < 3) {
      newErrors.cardName = 'Nombre del titular requerido';
    }
    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Fecha inválida (MM/AA)';
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Badge */}
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
        <Icon name="LockClosedIcon" size={20} className="text-success" variant="solid" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Pago Seguro con MercadoPago
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Encriptación SSL de 256 bits
          </p>
        </div>
      </div>

      {/* Card Number */}
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-foreground mb-2">
          Número de Tarjeta
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className={`w-full px-4 py-3 pl-12 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.cardNumber ? 'border-error' : 'border-border'
            }`}
            disabled={isProcessing}
          />
          <Icon
            name="CreditCardIcon"
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        {errors.cardNumber && (
          <p className="text-xs text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
            {errors.cardNumber}
          </p>
        )}
      </div>

      {/* Card Name */}
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-foreground mb-2">
          Nombre del Titular
        </label>
        <input
          type="text"
          id="cardName"
          name="cardName"
          value={formData.cardName}
          onChange={handleChange}
          placeholder="JUAN PÉREZ"
          className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
            errors.cardName ? 'border-error' : 'border-border'
          }`}
          disabled={isProcessing}
        />
        {errors.cardName && (
          <p className="text-xs text-error mt-1 flex items-center gap-1">
            <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
            {errors.cardName}
          </p>
        )}
      </div>

      {/* Expiry & CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-foreground mb-2">
            Vencimiento
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/AA"
            maxLength={5}
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.expiryDate ? 'border-error' : 'border-border'
            }`}
            disabled={isProcessing}
          />
          {errors.expiryDate && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.expiryDate}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-foreground mb-2">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            maxLength={4}
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.cvv ? 'border-error' : 'border-border'
            }`}
            disabled={isProcessing}
          />
          {errors.cvv && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.cvv}
            </p>
          )}
        </div>
      </div>

      {/* Installments */}
      <div>
        <label htmlFor="installments" className="block text-sm font-medium text-foreground mb-2">
          Cuotas
        </label>
        <select
          id="installments"
          name="installments"
          value={formData.installments}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          disabled={isProcessing}
        >
          <option value="1">1 cuota sin interés</option>
          <option value="3">3 cuotas sin interés</option>
          <option value="6">6 cuotas sin interés</option>
          <option value="12">12 cuotas con interés</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Icon name="LockClosedIcon" size={20} className="text-primary-foreground" variant="solid" />
            Pagar Ahora
          </>
        )}
      </button>

      {/* Payment Logos */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">Aceptamos:</div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-muted rounded text-xs font-medium text-foreground">Visa</div>
          <div className="px-3 py-1 bg-muted rounded text-xs font-medium text-foreground">Mastercard</div>
          <div className="px-3 py-1 bg-muted rounded text-xs font-medium text-foreground">OCA</div>
        </div>
      </div>
    </form>
  );
}