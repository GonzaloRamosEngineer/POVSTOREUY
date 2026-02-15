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
  ),
  // Icono de Imán (Herradura) - Versión Limpia y Clara
MagnetIcon: (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 510.676"
    fill="currentColor"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    imageRendering="optimizeQuality"
    fillRule="evenodd"
    clipRule="evenodd"
    {...props}
  >
    <path d="M223.695 51.658l54.506 68.533c4.998 6.279 3.969 15.562-2.34 20.516l-50.283 39.482-73.929-90.362 51.528-40.508c6.317-4.964 15.519-3.948 20.518 2.339zm216.124 122.419l66.164-13.289c1.414-.292 2.665-.051 3.646.487a4.624 4.624 0 011.813 1.798c.35.632.546 1.343.558 2.075l-.004.445c-.086 1.035-.535 2.055-1.392 2.88l-28.469 27.298 23.901 24.193c2.291 2.232 3.575 4.166 3.5 6.242-.088 2.461-1.715 4.162-5.263 5.378l-1.315.411c-24.6 5.941-51.865 10.248-76.927 15.173-1.897.393-3.636.24-4.95-.322-.926-.395-1.683-.99-2.222-1.756l-.196-.286c-.591-.979-.804-2.122-.577-3.357.237-1.275.979-2.63 2.334-3.936l27.143-26.178-.904-.86c-5.759-5.472-16.066-15.268-21.446-21.815-2.526-3.076-3.677-5.512-3.194-7.738.572-2.634 2.81-4.055 6.974-4.676l10.826-2.167zM346.381.125c4.917-1.017 7.985 4.429 4.627 7.679l-28.475 27.304 23.901 24.193c4.683 4.563 5.28 9.206-1.762 11.62l-1.316.411c-24.6 5.941-51.865 10.248-76.927 15.172-6.876 1.426-10.923-4.536-5.611-9.656l27.143-26.178-.905-.86c-5.758-5.472-16.064-15.268-21.445-21.815-4.887-5.941-4.82-10.685 3.781-12.414L346.381.125zm19.449 426.447c14.486-16.466 20.484-22.796 35.455-42.973l-88.103-74.254c-40.947 52.311-101.642 130.726-172.323 60.388-70.583-70.243 7.56-132.682 62.565-172.615l-72.968-89.385c-20.269 14.849-28.911 21.86-45.472 36.248-236.321 205.307 73.622 518.151 280.846 282.591zm91.725-139.583l-67.28-54.195c-6.168-4.971-15.302-4-20.255 2.183l-40.581 50.663 88.097 74.26 42.2-52.656c4.957-6.183 3.986-15.284-2.181-20.255z" />
  </svg>
),


// Giroscopio - versión original adaptada
GyroscopeIcon: (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="currentColor"
    {...props}
  >
    <path d="M88.721,14.814C89.132,14.923,89.555,15,90,15C92.762,15,95,12.762,95,10S92.762,5,90,5S85,7.238,85,10C85,10.445,85.077,10.868,85.186,11.279L79.998,16.466C72.037,9.339,61.526,5,50,5C25.147,5,5,25.147,5,50C5,61.526,9.339,72.037,16.466,79.998L11.279,85.186C10.868,85.077,10.445,85,10,85C7.239,85,5,87.238,5,90S7.239,95,10,95S15,92.762,15,90C15,89.555,14.923,89.132,14.814,88.721L20.001,83.533C27.963,90.661,38.473,95,50,95C74.853,95,95,74.853,95,50C95,38.473,90.661,27.963,83.533,20.001L88.721,14.814ZM50,90C27.944,90,10,72.056,10,50C10,27.944,27.944,10,50,10C72.056,10,90,27.944,90,50C90,72.056,72.056,90,50,90Z" />
    
    <path d="M50.967,21.661C51.816,22.474,52.666,23.403,53.511,24.444C61.277,21.907,68.54,22.58,72.981,27.019C80.656,34.693,77.086,50.809,65.098,63.362C64.816,63.658,64.535,63.953,64.244,64.244C63.701,64.787,63.148,65.308,62.592,65.818C58.951,69.158,55.039,71.799,51.136,73.677C50.248,74.104,49.361,74.486,48.477,74.833C39.981,78.18,31.836,77.798,27.02,72.981C19.343,65.302,22.917,49.181,34.911,36.624C35.502,44.093,36.4,48.791,37.835,53.616C40.188,61.533,43.56,68.382,47.17,73.189C48.879,72.501,49.736,72.104C46.112,67.936,42.549,61.069,40.131,52.934C38.567,47.67,37.697,42.592,37.481,38.179C37.575,32.38,37.792,30.812,38.131,29.443C38.876,26.383,40.246,24.323,42.199,23.743C43.313,23.412,44.532,23.592,45.803,24.206C44.237,25.088,42.677,26.062,41.139,27.154C42.623,29.808,45.713,27.85,48.799,26.361C49.562,27.081,50.329,27.928,51.09,28.891C54.426,33.114,57.64,39.545,59.875,47.065C61.591,52.838,62.472,58.388,62.569,63.081C63.562,62.099,64.262,61.355,64.934,60.598C64.559,56.198,63.651,51.358,62.171,46.383C59.912,38.785,56.716,32.174,53.271,27.404C49.142,21.688,44.657,18.619,40.999,19.706C37.45,20.761,35.386,25.52,34.961,32.238C18.941,48.184,14.419,67.453,23.483,76.517C29.566,82.6,40.244,82.556,51.029,77.456C53.822,79.92,56.594,81.013,59.006,80.296C62.549,79.242,64.61,74.493,65.039,67.793C81.06,51.817,85.581,32.547,76.517,23.483C70.811,17.776,61.058,17.465,50.967,21.661Z" />
    
    <path d="M42.5,50C42.5,45.856,45.856,42.5,50,42.5C54.144,42.5,57.5,45.856,57.5,50C57.5,54.144,54.144,57.5,50,57.5C45.856,57.5,42.5,54.144,42.5,50Z" />
  </svg>
),


// Pluma - versión outline
FeatherIcon: (props: any) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 4c-6 0-12 6-12 12 0 2.5 1.5 4 4 4 6 0 12-6 12-12 0-2.5-1.5-4-4-4z" />
    <path d="M9 15l6-6" />
    <path d="M8 16l-2 2" />
  </svg>
),



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