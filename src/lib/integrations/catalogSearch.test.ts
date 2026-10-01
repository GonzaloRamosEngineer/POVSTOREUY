import { describe, expect, it } from 'vitest';
import { catalogQueryTokens, searchCatalogRows } from './catalogSearch';

const rows = [
  {
    id: '1',
    name: 'Cámara POV Action 4K',
    model: 'X200',
    description: 'Cámara deportiva',
    is_accessory: false,
  },
  {
    id: '2',
    name: 'Tarjeta MicroSD 128GB',
    model: 'SD128',
    description: 'Memoria para cámara',
    is_accessory: true,
  },
  {
    id: '3',
    name: 'Arnés de pecho',
    model: 'CHEST-1',
    description: 'Accesorio ajustable',
    is_accessory: true,
  },
];

describe('búsqueda de catálogo para MatchBot', () => {
  it('quita palabras conversacionales y conserva modelo/producto', () => {
    expect(catalogQueryTokens('Hola, ¿tienen stock de la cámara X200?')).toEqual([
      'camara',
      'x200',
    ]);
  });

  it('ignora disponibilidad y encuentra singular cuando el cliente usa plural', () => {
    const results = searchCatalogRows('¿Qué cámaras tienen disponibles?', rows);

    expect(results.map((product) => product.id)).toEqual(['1', '2']);
    expect(results[0]?.name).toContain('Cámara');
  });

  it('prioriza accesorios cuando el cliente los pide explícitamente', () => {
    expect(searchCatalogRows('¿Qué accesorios tienen?', rows)[0]?.id).toBe('3');
  });

  it('para correr prioriza C200 con estabilizador y sus kits', () => {
    const movementRows = [
      {
        id: 'c100-kit',
        name: 'SJCAM C100+ — Kit Esencial',
        model: 'C100+',
        description: 'Cámara compacta',
        is_accessory: false,
        is_pack: true,
      },
      {
        id: 'c200',
        name: 'SJCAM C200',
        model: 'C200',
        description: 'Cámara con estabilizador gyro de 6 ejes',
        is_accessory: false,
        is_pack: false,
      },
      {
        id: 'c200-kit',
        name: 'SJCAM C200 — Kit Esencial',
        model: 'C200',
        description: 'Cámara con estabilizador gyro de 6 ejes',
        is_accessory: false,
        is_pack: true,
      },
    ];

    expect(
      searchCatalogRows('¿Cámaras para correr tienen?', movementRows).map(({ id }) => id)
    ).toEqual(['c200-kit', 'c200', 'c100-kit']);
  });

  it('prioriza coincidencias de modelo y nombre', () => {
    expect(searchCatalogRows('¿Cuánto cuesta la X200?', rows)[0]?.id).toBe('1');
    expect(searchCatalogRows('Necesito una microSD 128GB', rows)[0]?.id).toBe('2');
  });

  it('no devuelve productos sin una coincidencia relevante', () => {
    expect(searchCatalogRows('¿Cuál es el horario?', rows)).toEqual([]);
  });
});
