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
      cancel_payment, // Para transferencias
      cancel_mp // ✅ NUEVO: Para cancelar pagos MercadoPago
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

    // ✅ Detectar tipo de pago y entrega
    const isPickup = !currentOrder.shipping_address;
    const isBankTransfer = currentOrder.payment_method === 'bank_transfer';
    const isMercadoPago = currentOrder.payment_method === 'mercadopago';

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

      // ✅ Si se cancela una transferencia bancaria, automáticamente marcar pago como fallido
      if (status === 'cancelled' && isBankTransfer && cancel_payment) {
        updateData.payment_status = 'failed';
        console.log(`🔴 Cancelando orden ${orderIdentifier}: pago marcado como fallido automáticamente`);
      }

      // ✅ NUEVO: Si se cancela un pago MercadoPago
      if (status === 'cancelled' && isMercadoPago && cancel_mp) {
        console.log(`🔵 Intentando cancelar pago MercadoPago para orden ${orderIdentifier}`);
        console.log(`📋 Datos orden actual:`, {
          payment_id: currentOrder.payment_id,
          payment_method: currentOrder.payment_method,
          payment_status: currentOrder.payment_status,
          mp_status: currentOrder.mp_status
        });
        
        // ✅ CASO 1: Si NO hay payment_id, el usuario nunca pagó (abandonó la orden)
        if (!currentOrder.payment_id) {
          console.log('⚠️ No hay payment_id - Usuario abandonó sin pagar. Solo cancelando en DB...');
          
          // Solo actualizar nuestra DB (no hay nada que cancelar en MercadoPago)
          updateData.payment_status = 'failed';
          updateData.mp_status = 'cancelled';
          updateData.mp_status_detail = 'abandoned_by_user';
          
          console.log('✅ Orden cancelada en DB (sin interacción con MP)');
        } 
        // ✅ CASO 2: Si HAY payment_id, intentar cancelar en MercadoPago
        else {
          console.log('💳 Payment ID encontrado - Cancelando en MercadoPago...');
          
          try {
            const mpAccessToken = process.env.MP_ACCESS_TOKEN;
            
            if (!mpAccessToken) {
              console.error('❌ No se encontró MP_ACCESS_TOKEN en variables de entorno');
              console.error('❌ Variables disponibles:', Object.keys(process.env).filter(k => k.includes('MP') || k.includes('MERCADO')));
              return NextResponse.json(
                { error: 'Configuración de MercadoPago no disponible. Verifica las variables de entorno.' },
                { status: 500 }
              );
            }

            console.log(`🔑 Token MP encontrado (primeros 10 chars): ${mpAccessToken.substring(0, 10)}...`);
            console.log(`🎯 URL a llamar: https://api.mercadopago.com/v1/payments/${currentOrder.payment_id}`);

            // Cancelar el pago en MercadoPago
            const cancelResponse = await fetch(
              `https://api.mercadopago.com/v1/payments/${currentOrder.payment_id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${mpAccessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'cancelled'
                })
              }
            );

            console.log(`📡 Respuesta MP - Status: ${cancelResponse.status} ${cancelResponse.statusText}`);

            if (!cancelResponse.ok) {
              const errorData = await cancelResponse.json().catch(() => ({}));
              console.error('❌ Error al cancelar pago en MercadoPago:');
              console.error('   Status:', cancelResponse.status);
              console.error('   Data:', JSON.stringify(errorData, null, 2));
              
              // Intentar obtener más detalles del error
              const errorMessage = errorData.message || errorData.error || 'Error desconocido';
              
              return NextResponse.json(
                { 
                  error: `Error al cancelar en MercadoPago: ${errorMessage}`,
                  details: errorData,
                  status_code: cancelResponse.status
                },
                { status: 400 }
              );
            }

            const mpData = await cancelResponse.json();
            console.log('✅ Pago cancelado exitosamente en MercadoPago:');
            console.log('   ID:', mpData.id);
            console.log('   Status:', mpData.status);
            console.log('   Status Detail:', mpData.status_detail);

            // Actualizar estados en nuestra DB
            updateData.payment_status = 'failed';
            updateData.mp_status = 'cancelled';
            updateData.mp_status_detail = 'cancelled_by_admin';
            
          } catch (mpError: any) {
            console.error('❌ Error crítico al cancelar pago MercadoPago:');
            console.error('   Tipo:', mpError.name);
            console.error('   Mensaje:', mpError.message);
            console.error('   Stack:', mpError.stack);
            return NextResponse.json(
              { 
                error: 'Error al comunicarse con MercadoPago',
                details: mpError.message
              },
              { status: 500 }
            );
          }
        }
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

    console.log(`✅ Orden ${orderIdentifier} actualizada exitosamente`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error crítico en PATCH:', error);
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    );
  }
}