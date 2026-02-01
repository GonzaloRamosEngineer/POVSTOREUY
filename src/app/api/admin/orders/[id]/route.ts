import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; 

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Cambio: params es una Promesa
) {
  try {
    const supabase = getSupabaseAdmin();
    // Cambio: await params para obtener el id
    const { id: orderIdentifier } = await params; 

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderIdentifier)
      .single();

    if (orderError || !order) {
      console.error('Orden no encontrada:', orderIdentifier);
      return NextResponse.json(
        { error: 'La orden no existe en la base de datos' },
        { status: 404 }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      ...order,
      items: items || []
    });

  } catch (error) {
    console.error('Error crítico en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Cambio: params es una Promesa
) {
  try {
    const supabase = getSupabaseAdmin();
    // Cambio: await params
    const { id: orderIdentifier } = await params; 
    const { status, tracking_number } = await request.json();

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        order_status: status,
        tracking_number: tracking_number,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', orderIdentifier)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}