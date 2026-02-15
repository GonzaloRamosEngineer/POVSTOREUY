'use client';

import React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

type IconVariant = 'outline' | 'solid';

interface IconProps {
    name: string;
    variant?: IconVariant;
    size?: number;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    [key: string]: any;
}

// --- ICONOS PERSONALIZADOS ---
const CustomIcons: Record<string, React.FC<any>> = {
  // Gota de Agua
  WaterDropIcon: (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
// Patita de Mascota - Versión Orgánica (La de la imagen)
  PawIcon: (props: any) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      {/* Los 4 dedos en arco graduado */}
      <circle cx="4.5" cy="11.5" r="2.4" />
      <circle cx="9" cy="7" r="2.8" />
      <circle cx="15" cy="7" r="2.8" />
      <circle cx="19.5" cy="11.5" r="2.4" />
      {/* Almohadilla central con forma de huella real */}
      <path d="M12 11c-3.5 0-6.5 2.5-6.5 6s2.5 5.5 6.5 5.5 6.5-2 6.5-5.5-3-6-6.5-6z" />
    </svg>
  ),
  // Bicicleta
  BikeIcon: (props) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

function Icon({
    name,
    variant = 'outline',
    size = 24,
    className = '',
    onClick,
    disabled = false,
    ...props
}: IconProps) {
    // 1. Intentamos buscar en los iconos de Heroicons
    const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIcons;
    let IconComponent = iconSet[name as keyof typeof iconSet] as React.ComponentType<any>;

    // 2. Si no existe en Heroicons, buscamos en nuestros iconos personalizados
    if (!IconComponent && CustomIcons[name]) {
        IconComponent = CustomIcons[name];
    }

    if (!IconComponent) {
        return (
            <QuestionMarkCircleIcon
                width={size}
                height={size}
                className={`text-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
                onClick={disabled ? undefined : onClick}
                {...props}
            />
        );
    }

    return (
        <IconComponent
            width={size}
            height={size}
            className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
            onClick={disabled ? undefined : onClick}
            {...props}
        />
    );
}

export default Icon;