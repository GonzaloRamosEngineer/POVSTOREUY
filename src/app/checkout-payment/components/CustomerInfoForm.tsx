'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CustomerInfo {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
}

interface CustomerInfoFormProps {
  onUpdate: (data: CustomerInfo) => void;
  initialData?: Partial<CustomerInfo>;
}

export default function CustomerInfoForm({ onUpdate, initialData }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>({
    email: initialData?.email || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    department: initialData?.department || 'Montevideo',
    postalCode: initialData?.postalCode || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = [
    'Montevideo',
    'Canelones',
    'Maldonado',
    'Colonia',
    'Salto',
    'Paysandú',
    'Rivera',
    'Tacuarembó',
    'Artigas',
    'Cerro Largo',
    'Durazno',
    'Flores',
    'Florida',
    'Lavalleja',
    'Río Negro',
    'Rocha',
    'San José',
    'Soriano',
    'Treinta y Tres'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onUpdate(newData);

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (field: keyof CustomerInfo) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'email':
        if (!formData.email) {
          newErrors.email = 'Email requerido';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Email inválido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'fullName':
        if (!formData.fullName || formData.fullName.length < 3) {
          newErrors.fullName = 'Nombre completo requerido';
        } else {
          delete newErrors.fullName;
        }
        break;
      case 'phone':
        if (!formData.phone || formData.phone.length < 8) {
          newErrors.phone = 'Teléfono inválido';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'address':
        if (!formData.address || formData.address.length < 5) {
          newErrors.address = 'Dirección requerida';
        } else {
          delete newErrors.address;
        }
        break;
      case 'city':
        if (!formData.city) {
          newErrors.city = 'Ciudad requerida';
        } else {
          delete newErrors.city;
        }
        break;
    }

    setErrors(newErrors);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="UserIcon" size={24} className="text-primary" />
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Información de Contacto
        </h3>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            placeholder="tu@email.com"
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.email ? 'border-error' : 'border-border'
            }`}
          />
          {errors.email && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
            Nombre Completo <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={() => handleBlur('fullName')}
            placeholder="Juan Pérez"
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.fullName ? 'border-error' : 'border-border'
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
            Teléfono <span className="text-error">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur('phone')}
            placeholder="099 123 456"
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.phone ? 'border-error' : 'border-border'
            }`}
          />
          {errors.phone && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Icon name="TruckIcon" size={24} className="text-primary" />
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Dirección de Envío
        </h3>
      </div>

      <div className="space-y-4">
        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
            Dirección <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={() => handleBlur('address')}
            placeholder="Av. 18 de Julio 1234"
            className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
              errors.address ? 'border-error' : 'border-border'
            }`}
          />
          {errors.address && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
              {errors.address}
            </p>
          )}
        </div>

        {/* City & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
              Ciudad <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={() => handleBlur('city')}
              placeholder="Montevideo"
              className={`w-full px-4 py-3 bg-input border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
                errors.city ? 'border-error' : 'border-border'
              }`}
            />
            {errors.city && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={14} className="text-error" variant="solid" />
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-foreground mb-2">
              Departamento <span className="text-error">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-foreground mb-2">
            Código Postal
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="11000"
            maxLength={5}
            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          />
        </div>
      </div>

      {/* Guest Checkout Info */}
      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
        <Icon name="InformationCircleIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" variant="solid" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Compra sin Registro
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No necesitas crear una cuenta. Recibirás toda la información por email.
          </p>
        </div>
      </div>
    </div>
  );
}