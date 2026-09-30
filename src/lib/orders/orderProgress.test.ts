import { describe, expect, it } from 'vitest';
import { getOrderProgress } from './orderProgress';

const p = (paymentStatus: string, orderStatus: string, isPickup = false) =>
  getOrderProgress({ paymentStatus, orderStatus, isPickup });

describe('getOrderProgress', () => {
  it('un pedido despachado se ve "en camino", no "confirmado" (bug de la página vieja)', () => {
    const r = p('completed', 'shipped');
    expect(r.kind).toBe('in_transit');
    expect(r.current).toBe(2);
  });

  it('recorre el camino feliz de un envío', () => {
    expect(p('completed', 'pending')).toMatchObject({ kind: 'confirmed', current: 0 });
    expect(p('completed', 'processing')).toMatchObject({ kind: 'preparing', current: 1 });
    expect(p('completed', 'ready')).toMatchObject({ kind: 'ready', current: 1 });
    expect(p('completed', 'shipped')).toMatchObject({ kind: 'in_transit', current: 2 });
    expect(p('completed', 'completed')).toMatchObject({ kind: 'delivered', current: 3, tone: 'success' });
  });

  it('en retiro, "listo" es la etapa de entrega al cliente', () => {
    expect(p('completed', 'ready', true)).toMatchObject({ kind: 'ready', current: 2 });
    expect(p('completed', 'completed', true)).toMatchObject({ kind: 'delivered', current: 3 });
  });

  it('un retiro marcado como despachado se muestra como listo para retirar', () => {
    expect(p('completed', 'shipped', true)).toMatchObject({ kind: 'ready', current: 2 });
  });

  it('con el pago pendiente, la primera etapa es el pago (caso más común: transferencias)', () => {
    const r = p('pending', 'pending', true);
    expect(r.kind).toBe('awaiting_payment');
    expect(r.tone).toBe('warning');
    expect(r.steps?.[0]).toBe('payment');
    expect(r.current).toBe(0);
  });

  it('los estados terminales no muestran barra de progreso', () => {
    expect(p('failed', 'cancelled')).toMatchObject({ kind: 'cancelled', steps: null });
    expect(p('failed', 'pending')).toMatchObject({ kind: 'payment_failed', steps: null, tone: 'danger' });
    expect(p('refunded', 'processing')).toMatchObject({ kind: 'refunded', steps: null });
  });

  it('cancelado gana sobre cualquier otro dato desfasado', () => {
    expect(p('completed', 'cancelled').kind).toBe('cancelled');
  });

  it('tolera estados ausentes sin romper', () => {
    expect(getOrderProgress({ paymentStatus: null, orderStatus: null, isPickup: false }).kind).toBe(
      'awaiting_payment'
    );
  });
});
