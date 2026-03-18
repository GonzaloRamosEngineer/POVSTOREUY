# Stock observability runbook

## Objetivo

Dar visibilidad mínima a los dos puntos donde el sistema puede descontar stock de una orden:

- `src/app/api/mp-webhook/route.ts` cuando Mercado Pago confirma un pago aprobado.
- `src/app/api/admin/orders/[id]/route.ts` cuando un admin confirma manualmente una transferencia bancaria.

Ambos flujos usan `src/lib/stock/applyOrderStockOnce.ts`, que delega la idempotencia al RPC `apply_order_stock_once`.

## Logs a buscar

Todos los eventos nuevos usan el prefijo `[stock]`.

### Webhook Mercado Pago

- `mp-webhook:apply_attempt`: hubo intención de descontar stock.
- `mp-webhook:no_op`: el RPC no hizo cambios, normalmente porque el stock ya estaba aplicado.
- `mp-webhook:apply_success`: el descuento se aplicó correctamente.

### Admin PATCH de órdenes

- `admin-order-patch:apply_attempt`: un admin confirmó un pago y se intentó aplicar stock.
- `admin-order-patch:no_op`: el RPC respondió sin cambios.
- `admin-order-patch:apply_success`: el descuento se aplicó correctamente.

### Helper compartido

- `applyOrderStockOnce:start`: inicio del RPC con `orderId` y `source`.
- `applyOrderStockOnce:error`: error devuelto por Supabase/RPC.
- `applyOrderStockOnce:empty_response`: el RPC respondió sin fila utilizable.
- `applyOrderStockOnce:done`: resultado final normalizado (`ok`, `no_op`, `reason`).

## Procedimiento operativo

1. Identificar `orderId` u `orderNumber` del incidente.
2. Filtrar logs por `[stock]` y por ese identificador.
3. Verificar el `source` esperado:
   - `mp-webhook` para confirmaciones automáticas.
   - `admin-order-patch` para confirmaciones manuales.
4. Revisar el `reason` del evento `applyOrderStockOnce:done` o del `no_op`.
5. Si hay error, comparar el estado de la orden (`payment_status`, `stock_applied_at`) con el momento del log para confirmar si fue un fallo real o un reintento idempotente.

## Interpretación rápida

- `ok=true` y `no_op=false`: se descontó stock en ese intento.
- `ok=true` y `no_op=true`: reintento seguro; no debería requerir acción.
- `ok=false`: revisar `reason` y el RPC `apply_order_stock_once`.
- `mustRecoverStock=true` en el webhook: la orden ya estaba en `completed`, pero faltaba `stock_applied_at`, por lo que el flujo intentó recuperar una aplicación pendiente.

## Acciones recomendadas

- Si hay `no_op` repetidos pero el stock en DB es correcto, no hacer rollback manual.
- Si hay `ok=false`, validar en Supabase si la orden quedó con `payment_status='completed'` y sin `stock_applied_at`.
- Si la orden quedó aprobada sin stock aplicado, reintentar el flujo seguro desde el origen apropiado o ejecutar el RPC de forma controlada con el `orderId`.
