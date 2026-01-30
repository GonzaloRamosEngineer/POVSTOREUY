import { NextResponse } from 'next/server';
// @ts-ignore
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// IMPORTANTE: Esto evita que Next.js cachee la respuesta. 
// Queremos datos frescos siempre que consultamos una orden.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1) Obtener la Orden
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        subtotal,
        shipping_cost,
        total,
        order_status,
        payment_method,
        payment_status,
        payment_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_department,
        shipping_postal_code,
        notes,
        mp_status,
        mp_status_detail
      `)
      .eq('id', orderId)
      .single();

    if (oErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2) Obtener los Items
    const { data: items, error: iErr } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        product_name,
        product_model,
        product_image_url,
        quantity,
        unit_price,
        total_price
      `)
      .eq('order_id', orderId)
      .order('id', { ascending: true });

    if (iErr) {
      return NextResponse.json({ error: 'Failed to load order items', details: iErr.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      order, 
      items: items || [] 
    });

  } catch (e: any) {
    console.error("API Error order-details:", e);
    return NextResponse.json({ error: 'Unexpected error', details: e.message }, { status: 500 });
  }
}