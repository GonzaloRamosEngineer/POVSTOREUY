# CLAUDE.md — POV Store Uruguay

Contexto persistente para sesiones futuras. Due Diligence Técnico inicial: 2026-05-21. Última actualización: 2026-05-23 (audit externo PF-XX en 9/10 cerrados; queda PF-09 P2; rate-limit Upstash activo en endpoints públicos).

---

## Proyecto

E-commerce de cámaras POV 4K para el mercado uruguayo. Vende productos simples y "packs" (combos primary + components con descuento de stock por componente). Pagos vía MercadoPago + transferencia bancaria. Panel admin para gestión de órdenes/inventario.

**Stack:**
- Next.js 15.1.11 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 + framer-motion + lucide-react
- Supabase (Postgres + Auth + Storage) — anon client en browser, service-role client en server
- MercadoPago (preferencias + webhook)
- Vitest para tests unitarios
- Deploy en **Vercel** (production). Nota: `package.json` incluye `@netlify/plugin-nextjs` como dev dep histórico, pero el hosting activo es Vercel — env vars y deploys van por su dashboard.

**Estructura clave:**
- [src/app/api/](src/app/api/) — Route handlers (create-order, mp-preference, mp-webhook, admin/*, newsletter/*, order-details)
- [src/app/api/admin/orders/route.ts](src/app/api/admin/orders/route.ts) — GET con filtros del historial (paginado + summary con AOV real)
- [src/lib/supabaseAdmin.ts](src/lib/supabaseAdmin.ts) — singleton service-role client (server-only)
- [src/lib/supabaseClient.js](src/lib/supabaseClient.js) — singleton browser client (anon)
- [src/lib/api/adminFetch.ts](src/lib/api/adminFetch.ts) — wrapper canónico para llamadas client-side a `/api/admin/*` (inyecta Bearer + `AdminFetchError`)
- [src/lib/packs/packContractValidator.ts](src/lib/packs/packContractValidator.ts) — validación estructural de packs
- [src/lib/stock/applyOrderStockOnce.ts](src/lib/stock/applyOrderStockOnce.ts) — wrapper sobre RPC transaccional
- [src/config/admin.ts](src/config/admin.ts) — fuente de verdad para thresholds, page size, staleDays y patrones de email test/QA
- [src/messages/](src/messages/) — diccionarios de mensajes centralizados (no hardcodear strings de error)
- [migrations/](migrations/) — SQL versionado de esquema y RPCs (no autoritativo — schema canónico vive en Supabase)

---

## Esquema de base de datos (resumen)

Schema Postgres en Supabase. DDL completo verificable en Supabase Studio o vía `pg_dump --schema-only`. **El schema canónico vive en DB**; los archivos en `migrations/` son evolutivos, no autoritativos.

### Tablas core (commerce)

| Tabla | Notas clave |
|---|---|
| `orders` | PK uuid. `order_number` UNIQUE legible (POV-XXXXXX). FK opcional a `user_profiles` (checkout es guest por default — `user_id` queda null). Idempotencia: `idempotency_key` UNIQUE parcial + `idempotency_payload_hash`. Stock-once: `stock_applied_at`. Shipping denormalizado (snapshot al momento del pedido). MP fields: `mp_preference_id`, `mp_init_point`, `mp_status`, `mp_status_detail`, `payment_id`. |
| `order_items` | FK a `orders`. `line_type` ENUM-CHECK `{'simple','pack_primary','pack_component'}` + CHECK condicional de nulabilidad (ver [migrations/20260313](migrations/20260313_stage2a_order_items_pack_lines.sql)). `pack_group_id`, `pack_id`, `pack_parent_product_id`, `pack_version` (≥1 cuando no NULL). |
| `products` | Catálogo. `is_active` para soft-delete (no se hace DELETE). `packs jsonb` para combos. `addon_ids uuid[]` para accesorios cruzados. `tech_specs`, `features`, `story_content`, `faq_content`, `colors` todos `jsonb`. `gallery text[]`. `cash_price`/`card_price` separados de `price`. `slug` UNIQUE. `show_on_home`, `is_outlet`, `is_accessory` flags. |
| `cart_items` | Carrito server-side. `user_id` opcional + `session_id text` para guests. FK a `products`. |
| `inventory_logs` | Audit trail de cambios de stock: `change_type`, `quantity_change`, `previous_stock`, `new_stock`, `reason`, `created_by`. **Se puebla automáticamente vía trigger** `on_product_inventory_change` (AFTER UPDATE de `products` → `log_inventory_change()`). NO es feature huérfana — confirmado 2026-05-23 con auditoría de schema. La RPC `apply_order_stock_once` no escribe directo pero el trigger sí cuando ella actualiza `stock_count`. |

### Tablas usuarios

| Tabla | Notas |
|---|---|
| `user_profiles` | PK FK a `auth.users(id)` (Supabase Auth). `role` ENUM. **Sólo admin y customer**; toda orden hoy es guest (sin user_id). |
| `customer_addresses` | Libreta de direcciones. FK a `user_profiles`. ⚠ **No vista en uso activo** — `orders` denormaliza el shipping. Probablemente reservada para feature futura de "mis direcciones". |

### Tablas auxiliares

| Tabla | Notas |
|---|---|
| `product_reviews` | Reseñas. `customer_name_manual` + `customer_avatar_url` permiten reseñas curadas (sin user_id). `review_images_gallery text[]`. `is_verified_purchase`. |
| `newsletter_subscribers` | Email + `is_active` (soft unsubscribe). `unsubscribed_at`. |

### Custom ENUMs (Postgres)

Todos son `USER-DEFINED` types. **No usar `text` en columnas que apunten a estos ENUMs** — el cast `::enum_name` es obligatorio en inserts/updates.

| ENUM | Valores conocidos (inferidos del código) |
|---|---|
| `order_status` | `pending`, `processing`, `ready`, `shipped`, `completed`, `cancelled` (lista en [admin/orders/[id]/route.ts](src/app/api/admin/orders/[id]/route.ts)) |
| `payment_status` | `pending`, `completed`, `failed`, `refunded` |
| `payment_method` | `mercadopago`, `bank_transfer` |
| `stock_status` | `in_stock`, `low_stock`, `out_of_stock`. Se actualiza automáticamente vía trigger `on_product_stock_change` según `stock_count` — ver sección "Triggers activos". |
| `user_role` | `customer`, `admin` |
| `uruguay_department` | 19 departamentos de Uruguay. Confirmado 2026-05-23 — `orders.shipping_department` ya está tipado como este ENUM. La deuda real es la **divergencia** entre los valores del ENUM en DB y `URUGUAY_DEPARTMENTS` (hardcoded en [create-order/route.ts](src/app/api/create-order/route.ts) + [OrderFilters.tsx](src/app/admin-dashboard/components/OrderFilters.tsx)). |

### Triggers activos en `public`

Descubiertos vía `information_schema.triggers` en auditoría 2026-05-23. **No duplicar la lógica de estos triggers en código de aplicación** — la DB ya lo hace automáticamente.

| Tabla | Trigger | Cuándo | Qué hace |
|---|---|---|---|
| `orders` | `on_order_insert_set_number` | BEFORE INSERT | `set_order_number()` — si `order_number` viene NULL/'', genera `POV-YYYYMMDD-NNNN`. ⚠ Usa `COUNT(*) FROM orders + 1` → race latente (ver deuda técnica). Hoy el handler de `create-order` genera su propio `POV-XXXXXX` random, así que este trigger casi nunca dispara. |
| `orders` | `update_orders_updated_at` | BEFORE UPDATE | `update_updated_at_column()` — refresca `updated_at` automáticamente. |
| `products` | `on_product_inventory_change` | AFTER UPDATE | `log_inventory_change()` — escribe a `inventory_logs` el delta de stock. Esto es lo que mantiene viva esa tabla; cualquier UPDATE de `products.stock_count` (típicamente desde `apply_order_stock_once`) deja audit trail. |
| `products` | `on_product_stock_change` | BEFORE INSERT/UPDATE | `update_product_stock_status()` — recalcula el ENUM `stock_status` (`in_stock`/`low_stock`/`out_of_stock`) según `stock_count`. |
| `products` | `update_products_updated_at` | BEFORE UPDATE | `update_updated_at_column()` — idem orders. |

### Foreign keys principales

- `cart_items.product_id` → `products.id`
- `cart_items.user_id` → `user_profiles.id` (nullable)
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id` (nullable — referencia opcional)
- `orders.user_id` → `user_profiles.id` (nullable — guest checkout)
- `user_profiles.id` → `auth.users.id` (integración con Supabase Auth)
- `customer_addresses.user_id` → `user_profiles.id`
- `inventory_logs.product_id` → `products.id`
- `inventory_logs.created_by` → `user_profiles.id` (nullable)
- `product_reviews.product_id` → `products.id`
- `product_reviews.user_id` → `user_profiles.id` (nullable — review curada)

### CHECK constraints en DB (no duplicar en código de validación)

- `products.price >= 0`, `products.stock_count >= 0`, `products.rating BETWEEN 0 AND 5`, `products.review_count >= 0`
- `order_items.quantity > 0`, `unit_price >= 0`, `total_price >= 0`
- `order_items.line_type` IN closed set + nulabilidad condicional por `line_type`
- `order_items.pack_version >= 1` cuando no NULL
- `cart_items.quantity > 0`
- `product_reviews.rating BETWEEN 1 AND 5`

### Índices y constraints relevantes

- `orders.order_number` UNIQUE
- `orders.idempotency_key` UNIQUE INDEX parcial (`WHERE idempotency_key IS NOT NULL`)
- `products.slug` UNIQUE
- `user_profiles.email` UNIQUE
- `newsletter_subscribers.email` UNIQUE

### Observaciones para futuras sesiones

- Si vas a agregar un valor a un ENUM, hay que hacerlo vía `ALTER TYPE ... ADD VALUE` (no se puede en transacción para todos los Postgres versions). Crear migration explícito.
- Sobre `inventory_logs` y `customer_addresses` (tablas huérfanas marcadas con ⚠ arriba): ver "Features huérfanas en DB" en Deuda técnica para el estado y la decisión pendiente.

---

## Audit PF-XX — estado de cierre

Audit externo recibido 2026-05-23. 10 puntos catalogados PF-01 a PF-10. Esta tabla es la **fuente única de verdad** del estado de cada uno. Al cerrar uno: actualizar fecha + evidencia + commit ref.

| ID | Sev | Descripción | Estado | Evidencia / Pendiente |
|---|---|---|---|---|
| PF-01 | P0 | `order-details` expone PII por `orderId` sin auth | ✅ Cerrado 2026-05-23 | HMAC token en [src/lib/orders/orderLookupToken.ts](src/lib/orders/orderLookupToken.ts) + verificación en [order-details/route.ts:22-26](src/app/api/order-details/route.ts#L22-L26). Smoke 3/3 en prod. |
| PF-02 | P0 | Admin GET/PATCH sin control auth en handler | ✅ Cerrado 2026-05-22 | `requireAdmin` en [admin/orders/[id]/route.ts:17-38](src/app/api/admin/orders/%5Bid%5D/route.ts#L17-L38). Replicado en `/api/admin/orders` y `/api/admin/products`. |
| PF-03 | P0 | Webhook sin verificación de firma/origen | ✅ Cerrado 2026-05-22 | `verifyMpWebhookSignature` en [src/lib/mp/verifyWebhookSignature.ts](src/lib/mp/verifyWebhookSignature.ts) + check en [mp-webhook/route.ts:53-66](src/app/api/mp-webhook/route.ts#L53-L66). Smoke 4/4 en prod. |
| PF-04 | P1 | Webhook "traga" errores y responde `ok:true` | ✅ Cerrado 2026-05-23 | Logger estructurado nuevo en [src/lib/logging/webhookLogger.ts](src/lib/logging/webhookLogger.ts) (JSON output, sin deps). [mp-webhook/route.ts](src/app/api/mp-webhook/route.ts) refactorizado: errores transitorios (DB update failed, excepción no manejada) ahora devuelven `500` para que MP reintente; errores no recuperables (id missing, orderId missing, order_not_found) siguen `200` pero con `reason` explícito en body + log warn estructurado. 2 mensajes nuevos en `apiErrorMessages.mpWebhook` (`dbUpdateFailed`, `unhandledException`). 3 tests nuevos: order-not-found → 200, update-error → 500, exception → 500. Suite 83/83. **Verificado en prod 2026-05-23**: smoke 4/4 contra `https://povstore.uy/api/mp-webhook` (sin firma → `missing_signature`, ts futuro → `expired`, ts pasado → `expired`, ts actual + hash inválido → `invalid`) + confirmación en Vercel Logs que el JSON estructurado se emite correctamente (`level:"warn"` interno mapeado a `level:"warning"` outer de Vercel). |
| PF-05 | P0 | `create-order` no transaccional (orders + items separados) | ✅ Cerrado 2026-05-23 | RPC `create_order_transactional` en [migrations/20260523_pf05_create_order_transactional.sql](migrations/20260523_pf05_create_order_transactional.sql). Atomicidad real (orders + order_items en transacción implícita de la función) + idempotency via campo `status` (`created`/`idempotent_replay`/`payload_mismatch`) en lugar de excepciones. Handler refactoreado en [create-order/route.ts:474-515](src/app/api/create-order/route.ts#L474-L515). Suite 87/87 (4 tests nuevos del contrato RPC). Permisos: `service_role=true`, `anon/authenticated=false` (REVOKE explícito por gotcha de Supabase default privileges — ver comentario en el migration file). **Verificado en prod 2026-05-23**: smoke 2/2 vía `curl` contra `https://povstore.uy/api/create-order` (HTTP idempotency MATCH: orderId idéntico entre POST original y replay) + 4 queries SQL OK (`items_count=1` confirma atomicidad, `total_orders=1` confirma no-duplicación, `orphans_1h=0`, `historical_orphans=0`). El bug nunca materializó histórico — fix preventivo correcto. |
| PF-06 | P1 | Drift de precios UI vs backend | ✅ Cerrado 2026-05-23 | Modelo **hibrid** en [create-order/route.ts:451-466](src/app/api/create-order/route.ts#L451-L466). El cliente envía opcionalmente `expectedTotal` + `strictPricing`. Server detecta drift cuando `expectedTotal` provisto y \|diff\| > 0.01. **Modo informativo** (default, `strictPricing!==true`): orden se crea, response incluye `priceDrift: { expected, computed, diff }`. **Modo enterprise** (`strictPricing===true`): `409` + `priceDrift` en body, **NO** se crea orden. Backwards compatible 100% — front actual sigue funcionando. 4 tests nuevos (suite 80/80). Mensaje en `apiErrorMessages.createOrder.priceDriftRejected`. Frontend pendiente: wirear el flag en order-confirmation (informativo) o agregar modal de confirmación (strict). |
| PF-07 | P1 | `mp-preference` no valida estado de orden | ✅ Cerrado 2026-05-23 | Guard agregado en [mp-preference/route.ts:69-80](src/app/api/mp-preference/route.ts#L69-L80) post-load de orden. Rechaza `409` si `payment_status ∈ {completed, refunded}` o `order_status === 'cancelled'`. Permite `failed` (retry intencional). Mensajes en `apiErrorMessages.mpPreference.orderAlreadyPaid/orderCancelled/orderRefunded`. Suite 76/76. **Verificado en prod 2026-05-23**: smoke 2/2 contra `https://povstore.uy/api/mp-preference` con POV-889886 (completed) → `409 "ya está pagada"` y POV-356707 (cancelled) → `409 "está cancelada"`. Rama `refunded` no tiene data en prod para testear (sin órdenes refunded), cubierta por código. Tests específicos del guard: pendientes (~30 min, no bloqueantes). |
| PF-08 | P1 | Sin compensación de stock al revertir `payment_status` | ✅ Cerrado 2026-05-23 | RPC `revert_order_stock_once` en [migrations/20260523_pf08_revert_order_stock_once.sql](migrations/20260523_pf08_revert_order_stock_once.sql) — espejo de `apply_order_stock_once`. Wrapper en [src/lib/stock/revertOrderStockOnce.ts](src/lib/stock/revertOrderStockOnce.ts). Handler [admin/orders/[id]/route.ts:344-376](src/app/api/admin/orders/%5Bid%5D/route.ts#L344-L376) dispara revert cuando `currentOrder.payment_status === 'completed' && currentOrder.stock_applied_at !== null && finalPaymentStatus !== 'completed'` — cubre 4 caminos: admin manual a pending/failed, `cancel_payment` en bank_transfer, `cancel_mp` en MP, o cualquier otro flujo que setee `updateData.payment_status` a algo distinto de completed. Permisos: service_role only (REVOKE explícito anon/authenticated siguiendo el patrón canónico). 6 tests nuevos en `describe('PF-08')` cubren los 4 trigger paths + 2 negativos. Suite 93/93. **Verificado en DB 2026-05-23** vía smoke local en Studio: orden sintética con stock_applied_at NOT NULL + 1 item → revert OK (`stock_count` subió 8→9, `stock_applied_at` quedó NULL), segunda llamada → no_op. Verificado en prod: lightweight (la lógica del handler son 3 condiciones cubiertas exhaustivamente por tests + smoke DB real). |
| PF-09 | P2 | Detección pickup vía `!shipping_address` | ❌ Abierto | Patrón hardcodeado en 6 lugares ([admin/orders/[id]/route.ts:123](src/app/api/admin/orders/%5Bid%5D/route.ts#L123), [OrdersTable.tsx:76](src/app/admin-dashboard/components/OrdersTable.tsx#L76), [OrderHistoryTable.tsx:111](src/app/admin-dashboard/components/OrderHistoryTable.tsx#L111), [OrderDetailsModal.tsx](src/app/admin-dashboard/components/OrderDetailsModal.tsx), [OrderConfirmationInteractive.tsx:159](src/app/order-confirmation/components/OrderConfirmationInteractive.tsx#L159)). Solución: columna explícita `delivery_method` enum en `orders` + migration de backfill. |
| PF-10 | P2 | Test frágil por texto literal i18n | ✅ Cerrado 2026-05-23 | Confirmado: assertion en [route.test.ts:547](src/app/api/create-order/route.test.ts#L547) esperaba `'Idempotency key already used'` (inglés) pero el mensaje real era `apiErrorMessages.createOrder.idempotencyConflict` (español). Fix: assertion ahora referencia la constante del diccionario, así si el copy cambia el test sigue válido. Suite 76/76. |

**Estado consolidado al 2026-05-23:** 9/10 cerrados (los tres P0 de auth/firma + PF-10 + PF-07 + PF-06 + PF-04 + PF-05 + PF-08). Queda 1 P2 (PF-09).

**Orden sugerido de cierre** (severidad + ratio impacto/esfuerzo, ortogonal a "Próximos pasos recomendados"):

1. **PF-09** (~1 h): migration + reemplazar las 6 ocurrencias.

Follow-ups opcionales:
- **Tests del guard PF-07** (~30 min) — crear `mp-preference/route.test.ts` con 3 casos (completed → 409, cancelled → 409, pending → 200 normal).
- **Wirear `priceDrift` en frontend** (~1-2 h) — `order-confirmation` muestra el flag informativo, o `CheckoutInteractive` envía `expectedTotal` desde el carrito y maneja `409` con modal de confirmación si se activa `strictPricing`.
- **Sentry/Logtail integration** (~1 h) — reemplazar `console.log/warn/error` del `webhookLogger` por el client del proveedor elegido. La interfaz `logWebhookEvent` queda igual.

Total estimado para cerrar el último abierto: **~1 hora de trabajo**. Tras ese paso, el audit queda 10/10 cerrado.

**Nota sobre alcance:** los issues 🔴 `.env` commiteada y 🟠 rate-limit ausente **no** están en esta tabla — el audit externo no los cubrió. Son prioridad propia (ver "Próximos pasos recomendados" pasos 1 y 2).

---

## Deuda técnica relevante

- **Componentes-dios:**
  - [src/app/admin-dashboard/inventory/components/ProductForm.tsx](src/app/admin-dashboard/inventory/components/ProductForm.tsx) — 1965 líneas
  - [src/app/admin-dashboard/components/OrderDetailsModal.tsx](src/app/admin-dashboard/components/OrderDetailsModal.tsx) — 831 líneas
  - [src/app/product-details/components/ProductDetailsInteractive.tsx](src/app/product-details/components/ProductDetailsInteractive.tsx) — 718 líneas
- **Mezcla `.js`/`.ts`** en [src/lib/](src/lib/) — tipar todo.
- **Race condition en stock** (NO atacada por PF-05 — decisión consciente de scope): el chequeo en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts) NO es transaccional con la RPC `apply_order_stock_once` ([migrations/20260317_stage3_3a_stock_once_rpc.sql](migrations/20260317_stage3_3a_stock_once_rpc.sql)). La RPC usa `GREATEST(0, …)` y silenciosamente permite oversold. Debería `RAISE EXCEPTION` cuando `stock_count < qty`. PF-05 cerró atomicidad de orders+items pero deliberadamente dejó este RAISE EXCEPTION fuera para mantener el scope quirúrgico. Próxima sesión sobre stock: alterar `apply_order_stock_once` para validar y throw cuando insuficiente.
- **🟡 Race en `generate_order_number()`** (descubierto 2026-05-23 al auditar el schema para PF-05): el trigger usa `SELECT COUNT(*) FROM orders + 1` para generar `POV-YYYYMMDD-NNNN` cuando el handler no provee `order_number`. Dos inserts concurrentes leen el mismo count y generan el mismo número → uno falla con `23505` UNIQUE. Hoy NO se gatilla porque el handler genera su propio formato (`POV-XXXXXX` random, 900k posibilidades). Si en el futuro otro path inserta sin pasar `order_number` (script de importación, admin manual, endpoint nuevo), cae acá. Fix: secuencia dedicada (`CREATE SEQUENCE`) o subconsulta con bloqueo. Candidato a **PF-11** si quisiéramos numerar la deuda.
- ~~**Estados libres** (`order_status`, `payment_status`) como `text` sin ENUM ni CHECK en DB.~~ **CORRECCIÓN 2026-05-23:** los ENUMs sí existen en DB (revisión del schema). Ver sección "Esquema de base de datos". La deuda real acá es **mantener sincronizadas** las listas de valores permitidos del código (en `route.ts`, `OrderDetailsModal.tsx`, etc.) con los valores reales del ENUM — riesgo de divergencia silenciosa si alguien agrega un valor en DB sin actualizar el TypeScript.
- **Lógica de negocio hardcodeada en route:** shipping `subtotal >= 2000 ? 0 : 300` en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts). Debería vivir en config / tabla `tenant_settings`.
- **`URUGUAY_DEPARTMENTS` triplicado entre código y DB.** Existe como `Set` hardcodeado en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts), como array hardcodeado en [src/app/admin-dashboard/components/OrderFilters.tsx](src/app/admin-dashboard/components/OrderFilters.tsx) (filtro del historial, sumado 2026-05-23) Y como ENUM `department` en Postgres. Si alguien agrega un valor a uno solo, se rompe silenciosamente. Solución: derivar la lista del ENUM (lectura de `pg_enum` o `information_schema.columns`) o usar Supabase types autogenerados. Mientras tanto: si tocás uno, tocá los tres.
- **Features huérfanas en DB.** Una tabla existe en schema pero no se usa en flujos activos:
  - ~~`inventory_logs`~~ **NO es huérfana** — corrección 2026-05-23 tras auditoría de schema. El trigger `on_product_inventory_change` (AFTER UPDATE de products → `log_inventory_change()`) la pobla automáticamente cuando `apply_order_stock_once` decrementa stock. Funciona como audit trail real.
  - `customer_addresses` — libreta de direcciones para usuarios logueados. El checkout es 100% guest y `orders` denormaliza el shipping. Reservada para feature futura de "mis direcciones" o muerta de origen — confirmar intención antes de planificar trabajo encima.
- **`console.log`/`console.error` sin logger estructurado.** Resuelto **parcialmente 2026-05-23 (PF-04)**: `mp-webhook` ya usa [src/lib/logging/webhookLogger.ts](src/lib/logging/webhookLogger.ts) con output JSON. Resto del repo (~50 ocurrencias entre routes admin, MP preference, create-order, componentes) sigue con `console.*` plano. Cuando se sume Sentry/Logtail, esos `console.*` quedan capturados automáticamente al nivel error pero sin contexto estructurado (paymentId, orderId, etc.). Si se va a invertir en observabilidad, reemplazar `console.*` por un logger general (`appLogger` parallelo al `webhookLogger`) es el paso correcto.
- **Tests sólo en API + validator.** No hay E2E del flujo de checkout.
- ~~**🔴 Modelo de stock de packs incoherente.**~~ **RESUELTO 2026-05-23** — ver sección "Stock de packs es DERIVADO" en Convenciones (incluye SQL one-shot para limpieza del JSONB zombie pendiente, no bloqueante).
- **`products.stock_count` puede desfasarse de la suma de variantes** (detectado 2026-05-23: MicroSD tenía variante Negro=9 pero `stock_count=8`). El form re-sincroniza `stock_count = sum(variants.stock)` solo cuando se edita una variante en el form ([ProductForm.tsx:753](src/app/admin-dashboard/inventory/components/ProductForm.tsx#L753)). Si la data vino por SQL/migración o se editó sin re-guardar, queda desfasado. **Impacto:** el cálculo de stock de kits es conservador (usa `stock_count`), así que no oversold-ea, pero puede sub-estimar disponibilidad. SQL de sync one-shot para correr en Supabase Studio cuando convenga:
  ```sql
  UPDATE products SET stock_count = (
    SELECT COALESCE(SUM((c->>'stock')::int), 0)
    FROM jsonb_array_elements(colors) AS c
  ) WHERE jsonb_typeof(colors) = 'array' AND jsonb_array_length(colors) > 0;
  ```

---

## Convenciones y patrones de referencia

### Auth admin (patrón canónico)
Toda ruta admin DEBE replicar el helper `requireAdmin`. Implementaciones de referencia:
- [src/app/api/admin/products/route.ts:73-95](src/app/api/admin/products/route.ts#L73-L95)
- [src/app/api/admin/orders/[id]/route.ts](src/app/api/admin/orders/[id]/route.ts) (mismo helper, dict propio)

Pasos:
1. Extraer Bearer token del header `Authorization`.
2. `supabase.auth.getUser(token)` con el client admin.
3. Consultar `user_profiles.role === 'admin'`.
4. Devolver `401`/`403` con mensajes del diccionario del endpoint (cada uno tiene su sub-sección `auth`).

**Lado cliente:** preferí [src/lib/api/adminFetch.ts](src/lib/api/adminFetch.ts) (ver sección dedicada abajo para uso + pendientes de migración).

**Tests:** mockear `supabase.auth.getUser` + `from('user_profiles')` con el rol deseado. Ver [src/app/api/admin/orders/[id]/route.test.ts](src/app/api/admin/orders/[id]/route.test.ts) y [src/app/api/admin/orders/route.test.ts](src/app/api/admin/orders/route.test.ts) — incluyen tests negativos (401 sin token, 403 con role no admin).

**Nota sobre RLS:** la función SQL `is_admin()` (SECURITY DEFINER, en `public`) hace el mismo check pero a nivel Postgres y se usa en las RLS policies `admins_manage_all_orders` y `admins_manage_all_order_items`. Si cambia la lógica de "qué es admin" en TypeScript, mantener `is_admin()` en sync.

### `adminFetch` (cliente HTTP para admin)
Toda llamada client-side a `/api/admin/*` debe usar [src/lib/api/adminFetch.ts](src/lib/api/adminFetch.ts). Inyecta `Authorization: Bearer ${session.access_token}` automáticamente y lanza `AdminFetchError` (con `.status` y `.body`) si la respuesta no es 2xx. Ya en uso en `OrderHistorySection`. **Pendiente migrar**: `OrderDetailsModal.tsx`, `ProductForm.tsx`, `InventoryPageInteractive.tsx` siguen con `fetch` manual + `getAuthHeader()`. Migración incremental, no en bloque (riesgo bajo, beneficio: centraliza retry/refresh de token).

### Detección de órdenes test/QA
[src/config/admin.ts](src/config/admin.ts) tiene dos listas sincronizadas: `TEST_EMAIL_PATTERNS` (regex, uso client-side con `isTestEmail()`) y `TEST_EMAIL_ILIKE_PATTERNS` (ILIKE para Supabase, uso server-side en `/api/admin/orders` con `exclude_test=true`). Si aparece un patrón nuevo de email de prueba, sumarlo a **ambas** listas, no hardcodear en componentes ni en el route.

### Historial de órdenes con filtros
[src/app/admin-dashboard/components/OrderHistorySection.tsx](src/app/admin-dashboard/components/OrderHistorySection.tsx) orquesta filtros + URL sync (con `URLSearchParams` + `router.replace`, sin scroll, sin agregar al history) + paginación + resumen. Filtros soportados por [src/app/api/admin/orders/route.ts](src/app/api/admin/orders/route.ts): `q, status, payment_method, payment_status, department, from, to, min_total, max_total, exclude_test, stale_days, sort, page, limit`. El `summary` (revenue, AOV, paid_count) se calcula con una **segunda query sobre TODOS los matches del filtro**, no solo la página actual — sino sería una métrica engañosa.

**Sección colapsable.** La sección viene cerrada por default — sólo se renderiza el header. Al expandir se setea `history_open=1` en URL y recién ahí se dispara el fetch. Esto evita un GET al endpoint en cada carga del dashboard cuando el admin sólo viene a ver el snapshot de 30 días.

**`excludeTest` tiene default `true` con semántica de URL invertida.** Es intencional: el admin quiere ver datos reales por default. La URL guarda `exclude_test=false` **sólo** cuando el usuario destildó el toggle (override). Si no aparece en la URL → se asume `true`. No "arregles" esto invirtiéndolo a la convención normal de "ausente = false" sin pedir.

Si agregás un filtro nuevo:
1. Sumarlo al endpoint con validación + actualizar tests.
2. Sumarlo al `OrderFilterState` en `OrderFilters.tsx`.
3. Sumarlo a `filtersToParams` (URL sync) y `filtersToApiQuery` (request) en `OrderHistorySection.tsx`.
4. Si es una constante (lista de departamentos, etc.), considerarlo para `src/config/admin.ts` antes de hardcodear.

### Idempotencia de órdenes
Patrón ya implementado en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts):
- Cliente envía `idempotency_key` (≤128 chars).
- Servidor hashea el payload normalizado (sha256) y lo guarda en `idempotency_payload_hash`.
- UNIQUE INDEX parcial en `orders(idempotency_key)` ([migrations/20260315_stage3_1_orders_idempotency.sql](migrations/20260315_stage3_1_orders_idempotency.sql)).
- Conflicto `23505` → reconsultar y devolver la orden existente si el hash coincide; `409` si difiere.

### Stock-once
Toda escritura que descuente stock pasa por [src/lib/stock/applyOrderStockOnce.ts](src/lib/stock/applyOrderStockOnce.ts), que invoca la RPC `apply_order_stock_once` con `FOR UPDATE` + flag `stock_applied_at`. Nunca actualizar `products.stock_count` directamente desde una route.

### Permisos en RPCs nuevas (gotcha de Supabase)

**Problema:** Supabase aplica `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated`. Cualquier función nueva que crees en `public` queda automáticamente ejecutable por `anon` y `authenticated`. **`REVOKE ALL ... FROM PUBLIC` NO lo desarma** — afecta solo al pseudo-rol PUBLIC, no a roles nominados.

**Patrón canónico para RPCs sensibles (las que solo el backend debería llamar):**
```sql
REVOKE ALL ON FUNCTION public.<nombre>(<args>) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.<nombre>(<args>) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.<nombre>(<args>) TO service_role;
```

Verificación post-apply (esperado: `service_role=true`, `anon/authenticated=false`):
```sql
SELECT r.rolname, has_function_privilege(r.rolname, 'public.<nombre>(<args>)', 'EXECUTE')
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role');
```

**Implementación de referencia:** [migrations/20260523_pf05_create_order_transactional.sql](migrations/20260523_pf05_create_order_transactional.sql) cierra el bloque de permisos correctamente.

**Estado de la RPC vieja:** `apply_order_stock_once` está abierta a `anon`/`authenticated` por este mismo gotcha (creada antes de descubrirlo). Funciona porque RLS de `products` bloquea cambios desde esos roles, pero **NO es el patrón a seguir** para RPCs nuevas. Cerrar esos grants es una micro-tarea pendiente (~5 min).

### Stock de packs es DERIVADO (no editable)
El stock disponible de un kit/pack **no es un campo editable**. Se calcula en tiempo real con [src/lib/packs/computePackStock.ts](src/lib/packs/computePackStock.ts):

```
effective_stock = MIN( floor(component.stock_count / component.quantity) )
                  para cada component en pack.components
```

Si un componente está faltante o inactivo → `effective_stock = 0` y `ok = false`. La función devuelve también `limiting` (qué componente fue el cuello de botella) y `breakdown` (todos los componentes evaluados) para mostrar al admin **por qué** un kit tiene N unidades.

**Lugares que usan la helper (mantener sincronizados):**
- [src/app/admin-dashboard/inventory/components/ProductForm.tsx](src/app/admin-dashboard/inventory/components/ProductForm.tsx) — muestra el stock derivado como display read-only al lado de cada pack. **NO hay input editable.**
- [src/app/homepage/components/HomepageInteractive.tsx](src/app/homepage/components/HomepageInteractive.tsx) — cards de home leen el cálculo, no `pack.stock`.
- [src/app/product-details/components/ProductDetailsInteractive.tsx](src/app/product-details/components/ProductDetailsInteractive.tsx) — `currentStock` para gating del botón "Agregar al carrito".

**Server-side:**
- [src/app/api/admin/products/route.ts](src/app/api/admin/products/route.ts) — `sanitizePacksForPersistence()` elimina `stock` de cada pack en POST/PATCH antes de guardar (defensa en profundidad: aunque la UI ya no manda el campo, otros clientes podrían).
- [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts) y la RPC `apply_order_stock_once` ya operaban sobre `products.stock_count` de los componentes, no sobre `pack.stock`. Sin cambios.

**Data zombie pendiente (decisión 2026-05-23: limpiar cuando sea conveniente, no bloqueante):**
Los packs en DB tienen valores históricos de `stock` (incluyendo negativos: `-2`, `-1`). El código nuevo los ignora completamente, pero la data queda. SQL para limpieza one-shot (correr en Supabase Studio con backup previo):

```sql
UPDATE products SET packs = (
  SELECT jsonb_agg(pack - 'stock')
  FROM jsonb_array_elements(packs) AS pack
) WHERE packs IS NOT NULL AND jsonb_array_length(packs) > 0;
```

(Usa el operador `-` de jsonb para eliminar la clave `stock` de cada pack. Resultado: el campo desaparece del JSON, no queda como `null`.)

**Si en el futuro hace falta "desactivar" un pack:** usar `pack.status` o `pack.show_on_home`/`pack.featured_in_menu`. **No reintroducir** un campo editable de stock.

### Modelo de packs en `order_items`
- `line_type ∈ {'simple', 'pack_primary', 'pack_component'}`.
- Filas de pack comparten `pack_group_id` (uuid) y llevan `pack_id`, `pack_parent_product_id`, `pack_version`.
- Sólo `simple` y `pack_primary` cuentan para subtotal/MP items.
- Sólo `simple` y `pack_component` descuentan stock.
- CHECK constraint en DB garantiza la nulabilidad por `line_type` ([migrations/20260313_stage2a_order_items_pack_lines.sql](migrations/20260313_stage2a_order_items_pack_lines.sql)).

### Mensajes
Strings de UI/error viven en [src/messages/](src/messages/) (`apiErrorMessages`, `adminOrderApiMessages`, etc.). No hardcodear nuevos mensajes en routes/componentes — agregar al diccionario.

### Supabase clients
- Server: `import { getSupabaseAdmin } from '@/lib/supabaseAdmin'` (service-role, jamás exponer al cliente).
- Browser: `import { getSupabaseBrowserClient } from '@/lib/supabaseClient'` (anon).

### Forzar dinámico
Routes que leen/escriben DB usan `export const dynamic = 'force-dynamic'`. Mantenerlo en endpoints nuevos.

### Webhook MercadoPago (verificación de firma HMAC)
[src/app/api/mp-webhook/route.ts](src/app/api/mp-webhook/route.ts) valida cada notificación con HMAC-SHA256 antes de tocar DB o llamar a MP. La lógica está en [src/lib/mp/verifyWebhookSignature.ts](src/lib/mp/verifyWebhookSignature.ts) (con tests en `.test.ts`).

Reglas (siguiendo doc oficial MP):
- Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (con `;` final). `data.id` se lowercasea si es alfanumérico.
- `ts` del header `x-signature` está en **segundos** Unix. Ventana anti-replay: ±5 minutos (configurable vía `toleranceMs`).
- Comparación `crypto.timingSafeEqual`. Si los largos difieren → rechazo directo sin throw.

**Política de status codes (vigente, cerrada en PF-04):**
- Firma inválida o ts fuera de ventana → `401`. MP no debe reintentar.
- Errores **no recuperables** (id missing, orderId missing en payment, orden no existe en DB) → `200` con `reason` explícito en body. Reintentar no cambia el resultado.
- Errores **transitorios nuestros** (DB update failed, excepción no manejada) → `500`. MP reintenta automáticamente.
- Stock apply failed → `500`. MP reintenta y el camino de recovery (`mustRecoverStock`) ataca el stock pendiente.
- **No usar `console.log/warn/error` directamente** en este route — usar `logWebhookEvent` de [src/lib/logging/webhookLogger.ts](src/lib/logging/webhookLogger.ts) para que los logs sean JSON estructurado.

**Env vars requeridas** (server-only, sin prefijo `NEXT_PUBLIC_`):
- `MP_ACCESS_TOKEN` — credencial de la app, usada para `GET /v1/payments/:id`.
- `MP_WEBHOOK_SECRET` — clave secreta del webhook. **Distinta** del access token. Dashboard → Tus integraciones → la app → Webhooks → "Revelar clave secreta". Hay una por entorno (test/prod).

Tests del route mockean `MP_WEBHOOK_SECRET` y firman las requests con el helper `signManifest`. Ver [src/app/api/mp-webhook/route.test.ts](src/app/api/mp-webhook/route.test.ts) — incluye 5 tests negativos: sin signature → 401, signature tampered → 401, order-not-found → 200 con `reason`, DB update error → 500, excepción no manejada → 500.

**Verificado en producción:**
- **2026-05-22** (cierre PF-03, firma HMAC): smoke 4/4 — sin firma → 401 `missing_signature`, firma adulterada → 401 `invalid`, ts 10 min viejo → 401 `expired`, firma válida → 200.
- **2026-05-23** (cierre PF-04, status codes + logger): smoke 4/4 — `missing_signature`, ts futuro → `expired`, ts pasado → `expired`, ts actual + hash inválido → `invalid`. Vercel Logs confirma JSON estructurado emitido por `webhookLogger`.

La env var `MP_WEBHOOK_SECRET` en Vercel matchea con la del dashboard MP (modo de prueba).

### Order lookup token (protección de `/api/order-details`)
[src/app/api/order-details/route.ts](src/app/api/order-details/route.ts) exige `?orderId=<uuid>&token=<hmac>` para devolver PII de una orden. Token inválido o ausente → `404 "Order not found"` (mismo mensaje que orden-no-existe, **para no filtrar existencia**). Lógica en [src/lib/orders/orderLookupToken.ts](src/lib/orders/orderLookupToken.ts).

Flujo:
- [src/app/api/mp-preference/route.ts](src/app/api/mp-preference/route.ts) firma `HMAC-SHA256(ORDER_LOOKUP_SECRET, orderId).slice(0,32)` y lo incluye en los 3 `back_urls` (`success`/`pending`/`failure`) que pasa a MP.
- MP redirige al cliente con `?orderId=...&token=...` en el URL.
- [src/app/order-confirmation/components/OrderConfirmationInteractive.tsx](src/app/order-confirmation/components/OrderConfirmationInteractive.tsx) lee `token` del URL y lo pasa al fetch.
- `/api/order-details` verifica con `timingSafeEqual` antes de tocar DB.

**Limitaciones conscientes:**
- Si el link se comparte (screenshot, WhatsApp, etc.), quien lo reciba puede ver la orden. No protege contra ese caso — para eso habría que sumar una cookie httpOnly al crear la orden (opción C del análisis, descartada por costo/beneficio).
- El flujo `bank_transfer` NO usa esta ruta — va directo a WhatsApp tras crear la orden. Si en el futuro se quisiera landing propio para transferencias, hay que sumar otra ruta o reusar este pattern.
- Token sin expiración. Si querés invalidar links viejos, agregar `ts` al manifest (variante "opción E").

**Env var requerida:** `ORDER_LOOKUP_SECRET` (32 bytes hex, server-only). Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Si falta → `mp-preference` y `order-details` devuelven `500 "Server misconfigured"`.

Tests: [src/lib/orders/orderLookupToken.test.ts](src/lib/orders/orderLookupToken.test.ts) — 8 casos (round-trip válido, null/empty, length mismatch, tampered, secret distinto, token cruzado entre orderIds).

**Verificado en producción (2026-05-23):** smoke test contra `https://povstore.uy/api/order-details` con un orderId real (POV-889886) — 3/3 casos: sin token → 404, token inválido → 404, token válido → 200 con la orden completa.

### Home `ProductCard` (UI)
[src/app/homepage/components/ProductCard.tsx](src/app/homepage/components/ProductCard.tsx) (solo usado en [HomepageInteractive.tsx](src/app/homepage/components/HomepageInteractive.tsx)):
- Contenedor de imagen: `aspect-square` (NO `h-80`). Las fotos de kits son 1024×1024; el contenedor debe ser 1:1 para no recortar.
- **Imagen 100% limpia.** No agregar pills/badges encima de la foto (hubo un sistema viejo de overlays con shadow + `animate-pulse` que se eliminó por contaminar la composición).
- Badges (`MÁS VENDIDO`, `INCLUYE REGALO`, `ÚLTIMAS X`) van como **chips traslúcidos arriba del título**, en una fila propia. Estilo: `bg-X/10 + ring-1 + ring-X/30 + text-X-300`.
- Descuento (`−X%`) va **junto al precio**, no como pill flotante.
- Prohibido `animate-pulse` en badges/chips comerciales — la urgencia se comunica con color + ícono.

### Intentos UI descartados (no reintentar sin pedir)
- **Alineación uniforme del CTA "COMPRAR AHORA" en el grid de la home** vía flexbox (`flex flex-col h-full` + `flex-1` + `mt-auto`) y/o `auto-rows-fr` en el grid: aplicado y luego **revertido por pedido del usuario** (2026-05-22). Si el tema vuelve a surgir, preguntar antes de reintentar el mismo enfoque.

---

## Próximos pasos recomendados (orden sugerido)

Esta lista cubre las tareas **fuera** de la tabla PF-XX (audit externo) — son prioridades propias del proyecto. Para estado del audit externo ver sección "Audit PF-XX". Orden sugerido por ratio impacto/esfuerzo:

1. **🔴 `.env` commiteada / rotación de credenciales** — *Esfuerzo: ~1 h. Impacto: alto pero destructivo.*
   Único 🔴 que queda. Tres sub-pasos: (a) rotar las credenciales reales en Supabase + MercadoPago dashboard + regenerar `ORDER_LOOKUP_SECRET`, (b) actualizar `.env` local y env vars en Vercel, (c) purgar el `.env` del historial con `git filter-repo` y `git push --force` (coordinar con cualquier otro dev que tenga la rama). El `.env.example` ya está commiteado como plantilla. Hacer cuando estés sin presión — `--force` push es irreversible para colaboradores.

2. **🟠 Endurecer TypeScript** — *Esfuerzo: ~2-4 h. Impacto: medio.*
   Quitar `ignoreBuildErrors` y `ignoreDuringBuilds` en [next.config.mjs](next.config.mjs), poner `strict: true` en [tsconfig.json](tsconfig.json), arreglar los errores que aparezcan (esperables: 106 usos de `: any` + 4 `@ts-ignore` en `src/`, algunos esconden bugs reales). Sin prisa pero acumula deuda silenciosa.

3. **🟡 Migrar `OrderDetailsModal.tsx`, `ProductForm.tsx`, `InventoryPageInteractive.tsx` a `adminFetch`** — *Esfuerzo: ~1 h. Impacto: bajo, pero elimina deuda.*
   Centraliza retry/refresh de token y manejo de errores. Reemplazar `fetch` manual + `getAuthHeader()` por `adminFetch<T>()`. Riesgo de regresión bajo (la firma de respuesta no cambia). Hacer un componente por vez.

4. **🟡 Quick-action "marcar pagado" inline + export CSV** — *Esfuerzo: ~3-4 h. Impacto: alto operacional.*
   Diferido de la PR de historial filtrable (2026-05-23). Quick-action: botón check verde en cada fila de `OrdersTable` que llama `PATCH /api/admin/orders/[id]` con `payment_status=completed` sin abrir el modal — reduce ~80% de clics en el flujo diario de transferencias. Export CSV: botón en `OrderHistorySection` que descarga el resultado del filtro actual (ya tenemos el endpoint, solo falta endpoint nuevo `/api/admin/orders/export` o un toggle `format=csv`).

5. **🟡 Limpieza one-shot del JSONB `packs[].stock` zombie** — *Esfuerzo: ~5 min en Supabase Studio.*
   El refactor de stock derivado dejó el campo `stock` ignorado pero todavía persistido en el JSONB con valores históricos (incluso negativos). El código nuevo los ignora, así que NO es bloqueante. SQL de limpieza listo en la sección "Stock de packs es DERIVADO" de Convenciones. Correr con backup previo cuando convenga.

6. **🟡 Sync one-shot `products.stock_count` vs suma de variantes** — *Esfuerzo: ~5 min en Supabase Studio.*
   Detectado 2026-05-23: posibles desfasajes (caso MicroSD: variante Negro=9 pero `stock_count=8`). Impacto: el cálculo de stock de kits es conservador (sub-estima, no oversold-ea). SQL listo en sección "Deuda técnica" — bullet `products.stock_count puede desfasarse`. Correr con backup previo.

**Nota:** los componentes-dios (`ProductForm.tsx` 1965 LOC, etc.) y la falta de tests E2E son deuda mayor pero no urgente. Se atacan cuando se necesite tocar esas zonas — refactor incremental, no big-bang.

**Logros recientes** (referencia para futuras sesiones):
- 2026-05-21: audit inicial.
- 2026-05-22: cerrado admin orders auth (= **PF-02**) (commit + deploy verificado en prod).
- 2026-05-22: cerrado MP webhook HMAC (= **PF-03**) (commit + deploy + smoke test 4/4 contra prod).
- 2026-05-23: cerrado order-details IDOR (= **PF-01**) (commit + deploy + smoke test 3/3 contra prod, incluyendo happy path con orden real).
- 2026-05-23: historial filtrable de órdenes (`GET /api/admin/orders` + `OrderHistorySection` con URL sync, paginación y summary real). Tests 15/15. Resuelve los review items "sin filtros de órdenes", "AOV ausente" y "conversion rate fake" (este último parcial: el card viejo del dashboard sigue mostrando la métrica fake). Sentó la base de `adminFetch` y `src/config/admin.ts` para reuso futuro.
- 2026-05-23: refactor de stock de packs a modelo **derivado** (eliminado `pack.stock` editable). Nueva helper `src/lib/packs/computePackStock.ts` con 12 tests. Cierra el bug histórico de "ÚLTIMAS -2" y la deuda 🔴 de "modelo de stock incoherente". `min={0}` agregado a inputs de stock de variante y stock_count general en ProductForm. Endpoint `/api/admin/products` con `sanitizePacksForPersistence()` como defensa en profundidad. Cards de home con chip "AGOTADO" + CTA deshabilitado cuando stock = 0.
- 2026-05-23: cleanup CLAUDE.md (deduplicación de Issues críticos / Próximos pasos / Deuda técnica, cross-refs entre PF-XX y bugs relacionados, file pointers preservados). De 383 → 370 líneas con densidad informativa mayor.
- 2026-05-23: cleanup de repo: `package.json` → `"start": "next start"` (cierra trampa de `npm start` arrancando dev server por error) + borrado de código muerto (`api_/` con 5 archivos legacy de Vercel Functions, `estructura.txt` 168K dump, 2 `.backup` files). Cero imports a `api_/` verificados antes de borrar.
- 2026-05-23: cerrado **PF-10** (test frágil i18n). Assertion en `route.test.ts:547` referenciaba string en inglés cuando la respuesta era en español. Fix: importar `apiErrorMessages.createOrder.idempotencyConflict` del diccionario canónico — el test ahora sigue válido aunque el copy cambie. Suite full 76/76.
- 2026-05-23: cerrado **PF-07** (`mp-preference` sin guard de estado). Guard agregado post-load de orden en `mp-preference/route.ts`: rechaza `409` para `payment_status ∈ {completed, refunded}` o `order_status === 'cancelled'`. Permite `failed` para retries. 3 mensajes nuevos en `apiErrorMessages.mpPreference`. Suite 76/76. Tests específicos del guard pendientes como follow-up opcional. Smoke test 2/2 contra prod (POV-889886 completed + POV-356707 cancelled).
- 2026-05-23: cerrado **PF-06** (drift de precios UI/backend). Modelo **hibrid**: cliente opcionalmente envía `expectedTotal` + `strictPricing`. Default (`strictPricing!==true`) → modo informativo: orden se crea, response incluye `priceDrift: { expected, computed, diff }`. `strictPricing===true` → modo enterprise: `409` + breakdown, orden no se crea. 100% backwards compat (front actual sigue funcionando sin cambios). Mensaje `priceDriftRejected` agregado al diccionario. 4 tests nuevos. Suite 80/80. Front pendiente de wirear el flag.
- 2026-05-23: cerrado **PF-04** (webhook traga errores). Nuevo logger estructurado `src/lib/logging/webhookLogger.ts` (JSON output, sin deps). `mp-webhook/route.ts` refactorizado: errores transitorios (`upErr`, excepción no manejada) ahora devuelven `500` para que MP reintente; errores no recuperables (id/orderId/order_not_found) siguen `200` pero con `reason` explícito + log warn. 2 mensajes nuevos. 3 tests nuevos. Suite 83/83. Interfaz `logWebhookEvent` preparada para reemplazar por Sentry/Logtail más adelante sin tocar el route. Smoke 4/4 verificado en prod + JSON estructurado confirmado en Vercel Logs.
- 2026-05-23: cerrado **PF-05** (atomicidad de create-order). RPC `create_order_transactional` en pl/pgsql (`migrations/20260523_pf05_create_order_transactional.sql`) ejecuta orders + order_items en una sola transacción implícita de la función. Maneja idempotencia con campo `status` (`created`/`idempotent_replay`/`payload_mismatch`) en lugar de excepciones para control de flujo. SECURITY INVOKER + GRANT EXECUTE solo a service_role (con REVOKE explícito de anon/authenticated por el gotcha de Supabase default privileges). Handler refactoreado (96 líneas modificadas), 4 tests nuevos del contrato RPC, suite 87/87. Verificación operativa: smoke local en Studio (postgres role) → happy path + idempotent_replay + CASCADE delete OK; smoke en prod vía curl → 2/2 POSTs con misma idem_key devolvieron mismo orderId (`f919b193-...` / `POV-517220`); 4 queries SQL → `items_count=1` confirma atomicidad, `total_orders=1` confirma no-duplicación, `orphans_1h=0`, `historical_orphans=0`. Esta última métrica confirma que el bug nunca materializó en prod — fix 100% preventivo. Auditoría de schema previa a PF-05 también descubrió: `inventory_logs` NO es huérfana (poblada vía trigger), `uruguay_department` ya existe como ENUM, y hay race latente en `generate_order_number()` (deuda nueva candidata a PF-11).
- 2026-05-23: **rate-limit Upstash en endpoints públicos**. Nuevo módulo [src/lib/rateLimit/](src/lib/rateLimit/) (`client.ts` singleton Redis REST, `limiters.ts` por endpoint con sliding window, `apply.ts` helper + `getClientIp`). Límites: create-order **5/min + 20/h**, mp-preference **20/min**, newsletter/subscribe **3/min + 10/día**, buckets por IP (primer `x-forwarded-for` → `x-real-ip` → `'anonymous'`). Response `429` con headers `X-RateLimit-Limit/Remaining/Reset` + `Retry-After`, mensaje en `apiErrorMessages.common.rateLimited`. **Fail-open** si Upstash es inalcanzable o si faltan env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) — no bloquea ventas por glitch infra. Deps nuevas: `@upstash/ratelimit@^2.0.8`, `@upstash/redis@^1.38.0`. 10 tests nuevos en `apply.test.ts` (suite 103/103). Smoke test local 4/4: newsletter 1-3 → 201, #4 → 429 con headers correctos, IP nueva pasa → buckets aislados, create-order #6 desde misma IP → 429. Cierra el item 🟠 "Rate-limit en endpoints públicos" de Próximos pasos. Verificación en prod: pendiente post-deploy (env vars ya configuradas en Vercel).
- 2026-05-23: cerrado **PF-08** (compensación simétrica de stock). RPC `revert_order_stock_once` en pl/pgsql espeja `apply_order_stock_once` (mismas líneas elegibles: simple + pack_component, mismo patrón FOR UPDATE + flag `stock_applied_at`). Wrapper TS `src/lib/stock/revertOrderStockOnce.ts` mirror exacto del apply. Handler de admin PATCH dispara revert al detectar la **transición REAL fuera de completed** (no depende de la action del admin) — cubre admin manual + cancel_payment + cancel_mp + cualquier flujo que setee `updateData.payment_status` ≠ 'completed'. Permisos: SECURITY INVOKER + service_role only con REVOKE explícito (siguiendo el patrón canónico de "Permisos en RPCs nuevas (gotcha de Supabase)" sumado en este sprint). 6 tests nuevos del comportamiento simétrico (4 trigger paths + 2 negativos), suite 93/93. Smoke local en Studio (postgres role): orden sintética con stock pre-aplicado → revert OK (stock_count subió 8→9, stock_applied_at quedó NULL) + idempotencia confirmada (segunda llamada `no_op=true, reason='stock_already_reverted'`, stock no volvió a subir). `inventory_logs` registró automáticamente el delta positivo vía trigger `on_product_inventory_change`. Smoke en prod: skip activo (lógica del handler son 3 condiciones cubiertas exhaustivamente por tests + smoke DB real); monitoreo vía Vercel Logs los próximos días.

**No modificar archivos sin aprobación explícita del usuario.**

Aplica a todo el repo. Investigación, lectura, propuestas y diffs propuestos en respuesta SÍ. Edits, escrituras, comandos destructivos, commits, pushes, migraciones, cambios de config NO — pedir confirmación primero, indicando qué archivo y qué cambio. Esta regla supersede cualquier inferencia de "obvio que querés esto".

**Validación durante desarrollo: NO correr `npm run build` con el dev server arriba.**

Aprendido por incidente 2026-05-23: si corrés `next build` mientras hay un `next dev` activo, el build de producción machaca chunks en `.next/` que el dev server tiene referenciados, dejándolo en estado inconsistente con errores `Cannot find module './XXX.js'` o `vendor-chunks/*.js`. Fix: matar dev, `rm -rf .next`, `npm run dev` de nuevo.

Para validar durante desarrollo usar **`npm run type-check`** + **`npm test`** (rápidos, no tocan `.next/`). Reservar `npm run build` para validaciones pre-merge **cuando el dev server NO esté corriendo**.
