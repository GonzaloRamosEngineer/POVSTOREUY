import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; 

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id: orderIdentifier } = await params; 
    const body = await request.json();
    
    // ✅ Extraer todos los campos posibles del body
    const { 
      status, 
      tracking_number, 
      payment_status,
      cancel_payment // ✅ NUEVO: Flag para cancelar automáticamente el pago
    } = body;

    // ✅ Obtener la orden actual para validaciones
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderIdentifier)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // ✅ Detectar si es retiro en local
    const isPickup = !currentOrder.shipping_address;
    const isBankTransfer = currentOrder.payment_method === 'bank_transfer';

    // ✅ Construir objeto de actualización dinámicamente
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // ✅ VALIDACIÓN: Estado de pedido
    if (status !== undefined) {
      // Validar estados permitidos
      const allowedStatuses = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Estado inválido: ${status}` },
          { status: 400 }
        );
      }

      // ✅ VALIDACIÓN: Si es retiro, no permitir estado "shipped"
      if (isPickup && status === 'shipped') {
        return NextResponse.json(
          { error: 'Los pedidos de retiro en local no pueden pasar a estado "shipped"' },
          { status: 400 }
        );
      }

      // ✅ VALIDACIÓN: Si es envío y se intenta "shipped" sin tracking
      if (!isPickup && status === 'shipped' && !tracking_number && !currentOrder.tracking_number) {
        return NextResponse.json(
          { error: 'Se requiere número de tracking para despachar un envío' },
          { status: 400 }
        );
      }

      // ✅ NUEVO: Si se cancela una transferencia bancaria, automáticamente marcar pago como fallido
      if (status === 'cancelled' && isBankTransfer && cancel_payment) {
        updateData.payment_status = 'failed';
        console.log(`🔴 Cancelando orden ${orderIdentifier}: pago marcado como fallido automáticamente`);
      }

      updateData.order_status = status;
    }

    // ✅ Normalizar tracking_number y solo validar si tiene contenido real
    const normalizedTracking = 
      tracking_number === undefined ? undefined : String(tracking_number).trim();

    if (normalizedTracking !== undefined && normalizedTracking !== '') {
      // Solo validar si hay contenido real (no string vacío)
      if (isPickup) {
        return NextResponse.json(
          { error: 'No se puede asignar tracking a un pedido de retiro en local' },
          { status: 400 }
        );
      }
      updateData.tracking_number = normalizedTracking;
    }

    // ✅ Estado de pago (manual)
    if (payment_status !== undefined) {
      // Validar estados permitidos
      const allowedPaymentStatuses = ['pending', 'completed', 'failed'];
      if (!allowedPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: `Estado de pago inválido: ${payment_status}` },
          { status: 400 }
        );
      }

      updateData.payment_status = payment_status;
    }

    // ✅ Realizar la actualización
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', orderIdentifier)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar orden:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error crítico en PATCH:', error);
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    );
  }
}