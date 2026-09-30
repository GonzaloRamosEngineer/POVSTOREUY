import { describe, expect, it } from 'vitest';
import { catalogQueryTokens, searchCatalogRows } from './catalogSearch';

const rows = [
  { id: '1', name: 'Cámara POV Action 4K', model: 'X200', description: 'Cámara deportiva' },
  { id: '2', name: 'Tarjeta MicroSD 128GB', model: 'SD128', description: 'Memoria para cámara' },
  { id: '3', name: 'Arnés de pecho', model: 'CHEST-1', description: 'Accesorio ajustable' },
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

  it('prioriza coincidencias de modelo y nombre', () => {
    expect(searchCatalogRows('¿Cuánto cuesta la X200?', rows)[0]?.id).toBe('1');
    expect(searchCatalogRows('Necesito una microSD 128GB', rows)[0]?.id).toBe('2');
  });

  it('no devuelve productos sin una coincidencia relevante', () => {
    expect(searchCatalogRows('¿Cuál es el horario?', rows)).toEqual([]);
  });
});
