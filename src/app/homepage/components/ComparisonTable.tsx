'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ComparisonItem {
  category: string;
  smartphone: string | boolean;
  povCamera: string | boolean;
  gopro: string | boolean;
}

const ComparisonTable = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const comparisonData: ComparisonItem[] = [
    {
      category: 'Resolución de Video',
      smartphone: '1080p - 4K',
      povCamera: '4K Ultra HD',
      gopro: '4K - 5K',
    },
    {
      category: 'Estabilización',
      smartphone: 'Digital básica',
      povCamera: 'Estabilización avanzada',
      gopro: 'HyperSmooth',
    },
    {
      category: 'Tamaño y Peso',
      smartphone: '150-200g',
      povCamera: '45g ultra compacta',
      gopro: '120-150g',
    },
    {
      category: 'Batería',
      smartphone: '2-4 horas',
      povCamera: '3-5 horas',
      gopro: '1.5-2.5 horas',
    },
    {
      category: 'Resistencia al Agua',
      smartphone: false,
      povCamera: 'IPX4 resistente',
      gopro: true,
    },
    {
      category: 'Precio',
      smartphone: '$15.000 - $50.000',
      povCamera: '$3.990 - $5.990',
      gopro: '$18.000 - $35.000',
    },
    {
      category: 'Manos Libres',
      smartphone: false,
      povCamera: true,
      gopro: true,
    },
    {
      category: 'Ángulo POV Real',
      smartphone: false,
      povCamera: true,
      gopro: 'Limitado',
    },
  ];

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Icon name="CheckCircleIcon" size={24} className="text-success mx-auto" variant="solid" />
      ) : (
        <Icon name="XCircleIcon" size={24} className="text-error mx-auto" variant="solid" />
      );
    }
    return <span className="text-sm md:text-base">{value}</span>;
  };

  if (!isHydrated) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              ¿Por qué elegir POV Camera?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comparamos nuestra cámara con las alternativas más populares del mercado
            </p>
          </div>
          <div className="bg-card rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Característica</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Smartphone</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary">POV Camera</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">GoPro/Insta360</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-6 py-4 font-medium text-foreground">{item.category}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{renderValue(item.smartphone)}</td>
                      <td className="px-6 py-4 text-center text-primary font-semibold">{renderValue(item.povCamera)}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{renderValue(item.gopro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isMobile) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              ¿Por qué elegir POV Camera?
            </h2>
            <p className="text-lg text-muted-foreground">
              Comparamos nuestra cámara con las alternativas más populares
            </p>
          </div>

          <div className="space-y-4">
            {comparisonData.map((item, index) => (
              <div key={index} className="bg-card rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left focus-ring"
                >
                  <span className="font-semibold text-foreground">{item.category}</span>
                  <Icon
                    name={expandedRow === index ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                    size={20}
                    className="text-muted-foreground"
                  />
                </button>

                {expandedRow === index && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Smartphone</span>
                      <div className="text-muted-foreground">{renderValue(item.smartphone)}</div>
                    </div>
                    <div className="flex items-center justify-between bg-primary/10 px-3 py-2 rounded-md">
                      <span className="text-sm font-semibold text-primary">POV Camera</span>
                      <div className="text-primary font-semibold">{renderValue(item.povCamera)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">GoPro/Insta360</span>
                      <div className="text-muted-foreground">{renderValue(item.gopro)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            ¿Por qué elegir POV Camera?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comparamos nuestra cámara con las alternativas más populares del mercado
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Característica
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                    Smartphone
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary bg-primary/10">
                    <div className="flex items-center justify-center gap-2">
                      <Icon name="VideoCameraIcon" size={20} className="text-primary" variant="solid" />
                      POV Camera
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                    GoPro/Insta360
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-border hover:bg-muted/20 transition-smooth"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{item.category}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {renderValue(item.smartphone)}
                    </td>
                    <td className="px-6 py-4 text-center text-primary font-semibold bg-primary/5">
                      {renderValue(item.povCamera)}
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {renderValue(item.gopro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            * Precios en pesos uruguayos (UYU). Datos actualizados a enero 2026.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;