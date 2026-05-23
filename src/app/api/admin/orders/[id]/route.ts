import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { applyOrderStockOnce } from '../../../../../lib/stock/applyOrderStockOnce';
import { revertOrderStockOnce } from '../../../../../lib/stock/revertOrderStockOnce';
import { isPickup } from '@/lib/orders/deliveryMethod';
// IMPORTAMOS EL NUEVO DICCIONARIO
import { adminOrderApiMessages } from '@/messages/adminOrderApiMessages';

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getBearerToken(req: Request) {
  const h = req.headers.get('authorization') || '';
  if (!h.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim();
}

async function requireAdmin(req: Request) {
  const { auth: authMsgs } = adminOrderApiMessages;
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, res: json(401, { error: authMsgs.missingToken }) };

  const supabase = getSupabaseAdmin();
  const { data: userData, error: uErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (uErr || !user) return { ok: false as const, res: json(401, { error: authMsgs.invalidToken }) };

  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (pErr || !profile || profile.role !== 'admin') {
    return { ok: false as const, res: json(403, { error: authMsgs.adminRequired }) };
  }

  return { ok: true as const, supabase };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const msgs = adminOrderApiMessages.get;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res;
    const supabase = auth.supabase;
    const { id: orderIdentifier } = await params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderIdentifier)
      .single();

    if (orderError || !order) {
      console.error('Orden no encontrada:', orderIdentifier);
      return NextResponse.json(
        { error: msgs.notFound },
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
      { error: msgs.serverError },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const msgs = adminOrderApiMessages.patch;

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res;
    const supabase = auth.supabase;
    const { id: orderIdentifier } = await params;
    const body = await request.json();
    
    // ✅ Extraer todos los campos posibles del body
    const { 
      status, 
      tracking_number, 
      payment_status,
      cancel_payment, 
      cancel_mp 
    } = body;

    // ✅ Obtener la orden actual para validaciones
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderIdentifier)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: msgs.notFound },
        { status: 404 }
      );
    }

    // PF-09: detección por columna explícita en lugar de inferir por shipping_address vacío.
    const isPickupOrder = isPickup(currentOrder);
    const isBankTransfer = currentOrder.payment_method === 'bank_transfer';
    const isMercadoPago = currentOrder.payment_method === 'mercadopago';

    // ✅ Construir objeto de actualización dinámicamente
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // ✅ VALIDACIÓN: Estado de pedido
    if (status !== undefined) {
      const allowedStatuses = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: msgs.invalidStatus(status) },
          { status: 400 }
        );
      }

      // ✅ VALIDACIÓN: Si es retiro, no permitir estado "shipped"
      if (isPickupOrder && status === 'shipped') {
        return NextResponse.json(
          { error: msgs.pickupShippedError },
          { status: 400 }
        );
      }

      // ✅ VALIDACIÓN: Si es envío y se intenta "shipped" sin tracking
      if (!isPickupOrder && status === 'shipped' && !tracking_number && !currentOrder.tracking_number) {
        return NextResponse.json(
          { error: msgs.shippingRequiresTracking },
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
              return NextResponse.json(
                { error: msgs.mpConfigMissing },
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
              
              const errorMessage = errorData.message || errorData.error || 'Error desconocido';
              
              return NextResponse.json(
                { 
                  error: msgs.mpCancelError(errorMessage),
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
            return NextResponse.json(
              { 
                error: msgs.mpCommunicationError,
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
      if (isPickupOrder) {
        return NextResponse.json(
          { error: msgs.pickupTrackingError },
          { status: 400 }
        );
      }
      updateData.tracking_number = normalizedTracking;
    }

    // ✅ Estado de pago (manual)
    if (payment_status !== undefined) {
      const allowedPaymentStatuses = ['pending', 'completed', 'failed'];
      if (!allowedPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: msgs.invalidPaymentStatus(payment_status) },
          { status: 400 }
        );
      }

      if (payment_status === 'completed') {
        if (!isBankTransfer) {
          return NextResponse.json(
            { error: msgs.manualConfirmBankOnly },
            { status: 409 }
          );
        }

        if (!['pending', 'completed'].includes(currentOrder.payment_status)) {
          return NextResponse.json(
            {
              error: msgs.invalidPaymentTransition(currentOrder.payment_status),
            },
            { status: 409 }
          );
        }
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

    if (payment_status === 'completed' && isBankTransfer) {
      const stockResult = await applyOrderStockOnce({
        supabase,
        orderId: currentOrder.id,
      });

      if (!stockResult.ok) {
        // Stock insuficiente al confirmar pago (race con otra orden, o admin
        // decidió marcar como pagada una orden cuyo stock ya se consumió).
        // Devolvemos 409 para que el admin sepa que NO se completó la operación
        // y vea el detalle del producto que falta.
        if (stockResult.reason === 'insufficient_stock') {
          return NextResponse.json(
            {
              error: msgs.insufficientStockOnApply,
              shortfall: stockResult.shortfall,
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: msgs.stockApplyError, details: stockResult.reason },
          { status: 500 }
        );
      }

      if (stockResult.no_op) {
        return NextResponse.json({ ...data, no_op: true, stock_reason: stockResult.reason });
      }
    }

    // PF-08: Compensación simétrica. Si la orden tenía stock aplicado y el PATCH
    // la "des-completa", restituir stock vía RPC simétrica.
    // Trigger es la transición real, no la action del admin — cubre los 4 caminos:
    // (1) admin baja payment_status manualmente, (2) cancel_payment en bank_transfer,
    // (3) cancel_mp en MercadoPago, (4) cualquier otro flujo que setee
    // updateData.payment_status a algo != 'completed'.
    const finalPaymentStatus = updateData.payment_status ?? currentOrder.payment_status;
    const wasCompletedAndApplied =
      currentOrder.payment_status === 'completed' && currentOrder.stock_applied_at !== null;
    const transitioningOut = finalPaymentStatus !== 'completed';

    if (wasCompletedAndApplied && transitioningOut) {
      const revertResult = await revertOrderStockOnce({
        supabase,
        orderId: currentOrder.id,
      });

      if (!revertResult.ok) {
        return NextResponse.json(
          { error: msgs.stockRevertError, details: revertResult.reason },
          { status: 500 }
        );
      }

      if (revertResult.no_op) {
        return NextResponse.json({
          ...data,
          no_op_revert: true,
          stock_revert_reason: revertResult.reason,
        });
      }
    }

    console.log(`✅ Orden ${orderIdentifier} actualizada exitosamente`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error crítico en PATCH:', error);
    return NextResponse.json(
      { error: msgs.serverError },
      { status: 500 }
    );
  }
}