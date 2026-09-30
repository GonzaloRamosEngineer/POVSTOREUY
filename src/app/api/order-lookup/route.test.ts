import { beforeEach, describe, expect, it, vi } from 'vitest';
import { orderLookupMessages } from '@/messages/orderLookupMessages';
import { signOrderLookupToken } from '@/lib/orders/orderLookupToken';

let orderRow: any = null;
let dbError: any = null;
let lastFilter: { column: string; value: any } | null = null;

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
  },
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: (column: string, value: any) => {
          lastFilter = { column, value };
          return { maybeSingle: async () => ({ data: orderRow, error: dbError }) };
        },
      }),
    }),
  })),
}));

const applyRateLimit = vi.fn(async () => ({ blockedResponse: null as any }));
vi.mock('@/lib/rateLimit/apply', () => ({
  applyRateLimit: (...args: any[]) => applyRateLimit(...(args as [])),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/rateLimit/limiters', () => ({
  getOrderLookupLimiters: vi.fn(() => ({ perMinute: null, perHour: null })),
}));

import { POST } from './route';

const SECRET = 'secreto-de-test';
const ORDER_ID = '97b2839e-00b2-4d5d-bc66-3d6dc2056275';

function req(body: any) {
  return { json: async () => body, headers: { get: () => null } } as any;
}

beforeEach(() => {
  process.env.ORDER_LOOKUP_SECRET = SECRET;
  orderRow = { id: ORDER_ID, customer_email: 'cliente@mail.com' };
  dbError = null;
  lastFilter = null;
  applyRateLimit.mockClear();
  applyRateLimit.mockResolvedValue({ blockedResponse: null as any });
});

describe('POST /api/order-lookup', () => {
  it('devuelve id + token válido cuando el número y el email coinciden', async () => {
    const res: any = await POST(req({ orderNumber: 'POV-919687', email: 'cliente@mail.com' }));

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(ORDER_ID);
    expect(res.body.token).toBe(signOrderLookupToken(ORDER_ID, SECRET));
  });

  it('no filtra PII: sólo devuelve id y token', async () => {
    const res: any = await POST(req({ orderNumber: 'POV-919687', email: 'cliente@mail.com' }));
    expect(Object.keys(res.body).sort()).toEqual(['orderId', 'token']);
  });

  it('ignora mayúsculas y espacios del email', async () => {
    const res: any = await POST(req({ orderNumber: 'POV-919687', email: '  CLIENTE@Mail.com ' }));
    expect(res.status).toBe(200);
  });

  it('acepta el número sin prefijo o sin guion', async () => {
    for (const input of ['919687', 'pov919687', ' POV-919687 ']) {
      const res: any = await POST(req({ orderNumber: input, email: 'cliente@mail.com' }));
      expect(res.status, input).toBe(200);
      expect(lastFilter?.value, input).toBe('POV-919687');
    }
  });

  it('con el email equivocado responde 404 con el MISMO mensaje que si no existiera', async () => {
    const wrongEmail: any = await POST(req({ orderNumber: 'POV-919687', email: 'otro@mail.com' }));

    orderRow = null;
    const notFound: any = await POST(req({ orderNumber: 'POV-000000', email: 'otro@mail.com' }));

    expect(wrongEmail.status).toBe(404);
    expect(notFound.status).toBe(404);
    // Si los mensajes difirieran, el endpoint confirmaría qué pedidos existen.
    expect(wrongEmail.body.error).toBe(notFound.body.error);
    expect(wrongEmail.body.error).toBe(orderLookupMessages.errors.notFound);
  });

  it('valida campos faltantes y email inválido', async () => {
    const sinDatos: any = await POST(req({ orderNumber: '', email: '' }));
    expect(sinDatos.status).toBe(400);
    expect(sinDatos.body.error).toBe(orderLookupMessages.errors.missingFields);

    const mailMalo: any = await POST(req({ orderNumber: 'POV-919687', email: 'no-es-un-mail' }));
    expect(mailMalo.status).toBe(400);
    expect(mailMalo.body.error).toBe(orderLookupMessages.errors.invalidEmail);
  });

  it('corta por rate-limit antes de consultar la base', async () => {
    applyRateLimit.mockResolvedValue({ blockedResponse: { status: 429, body: {} } as any });

    const res: any = await POST(req({ orderNumber: 'POV-919687', email: 'cliente@mail.com' }));

    expect(res.status).toBe(429);
    expect(lastFilter).toBeNull();
  });

  it('sin ORDER_LOOKUP_SECRET no entrega tokens', async () => {
    delete process.env.ORDER_LOOKUP_SECRET;
    const res: any = await POST(req({ orderNumber: 'POV-919687', email: 'cliente@mail.com' }));
    expect(res.status).toBe(500);
    expect(res.body.token).toBeUndefined();
  });

  it('ante un error de base no expone el detalle', async () => {
    dbError = { message: 'connection refused at 10.0.0.1' };
    const res: any = await POST(req({ orderNumber: 'POV-919687', email: 'cliente@mail.com' }));
    expect(res.status).toBe(500);
    expect(res.body.error).toBe(orderLookupMessages.errors.serverError);
  });
});
