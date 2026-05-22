# CLAUDE.md — POV Store Uruguay

Contexto persistente para sesiones futuras. Due Diligence Técnico inicial: 2026-05-21. Última actualización: 2026-05-22.

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
- [src/lib/supabaseAdmin.ts](src/lib/supabaseAdmin.ts) — singleton service-role client (server-only)
- [src/lib/supabaseClient.js](src/lib/supabaseClient.js) — singleton browser client (anon)
- [src/lib/packs/packContractValidator.ts](src/lib/packs/packContractValidator.ts) — validación estructural de packs
- [src/lib/stock/applyOrderStockOnce.ts](src/lib/stock/applyOrderStockOnce.ts) — wrapper sobre RPC transaccional
- [src/messages/](src/messages/) — diccionarios de mensajes centralizados (no hardcodear strings de error)
- [migrations/](migrations/) — SQL versionado de esquema y RPCs

---

## Issues críticos de seguridad PENDIENTES

| Sev | Issue | Archivo |
|---|---|---|
| 🔴 Crítica | `.env` con credenciales reales commiteada al repo. Rotar todo y purgar del historial. Existe [.env.example](.env.example) como plantilla canónica desde 2026-05-22. | [.env](.env) |
| 🔴 Crítica | `/api/order-details` expone PII completa con sólo `?orderId=<uuid>` (UUID no es secreto). | [src/app/api/order-details/route.ts](src/app/api/order-details/route.ts) |
| 🟠 Alta | `typescript.ignoreBuildErrors: true` y `eslint.ignoreDuringBuilds: true`. | [next.config.mjs](next.config.mjs) |
| 🟠 Alta | `tsconfig.strict: false` + 106 usos de `: any` + 4 `@ts-ignore` en `src/`. | [tsconfig.json](tsconfig.json) |
| 🟠 Alta | Sin rate-limit ni captcha en `/api/create-order`, `/api/newsletter/subscribe`, `/api/mp-preference`. | — |
| 🟠 Alta | `package.json` → `"start": "next dev -p 4028"` (corre dev server si alguien hace `npm start`). | [package.json](package.json) |

---

## Deuda técnica relevante

- **Código muerto / duplicado:**
  - [api_/](api_/) — carpeta paralela con `create-order.js`, `mp-webhook.js`, etc. de la era Vercel Functions. Duplica lógica del App Router. Borrar.
  - [src/app/support/page.tsx.backup](src/app/support/page.tsx.backup), [src/app/product-details/page.backup.txt](src/app/product-details/page.backup.txt), `estructura.txt` (168K dump). Borrar.
- **Componentes-dios:**
  - [src/app/admin-dashboard/inventory/components/ProductForm.tsx](src/app/admin-dashboard/inventory/components/ProductForm.tsx) — 1965 líneas
  - [src/app/admin-dashboard/components/OrderDetailsModal.tsx](src/app/admin-dashboard/components/OrderDetailsModal.tsx) — 831 líneas
  - [src/app/product-details/components/ProductDetailsInteractive.tsx](src/app/product-details/components/ProductDetailsInteractive.tsx) — 718 líneas
- **Mezcla `.js`/`.ts`** en [src/lib/](src/lib/) — tipar todo.
- **Race condition en stock**: el chequeo en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts) NO es transaccional con la RPC `apply_order_stock_once` ([migrations/20260317_stage3_3a_stock_once_rpc.sql](migrations/20260317_stage3_3a_stock_once_rpc.sql)). La RPC usa `GREATEST(0, …)` y silenciosamente permite oversold. Debería `RAISE EXCEPTION` cuando `stock_count < qty`.
- **Estados libres** (`order_status`, `payment_status`) como `text` sin ENUM ni CHECK en DB.
- **Lógica de negocio hardcodeada** en route: shipping (`subtotal >= 2000 ? 0 : 300`), `URUGUAY_DEPARTMENTS`.
- **61 `console.log`/`console.error`** sin logger estructurado ni Sentry.
- **Tests sólo en API + validator.** No hay E2E del flujo de checkout.
- **`stockCount` puede mostrarse negativo en `ProductCard`** (visto en home: `ÚLTIMAS -2`). Falta `Math.max(0, …)` en la fuente del dato o en el render. Síntoma de que el oversold de la RPC (`GREATEST(0, …)`) no es la única ruta — alguien está restando stock sin clamp.
- **1 test pre-existente fallando** en `src/app/api/create-order/route.test.ts` (caso "same idempotency_key + different logical payload returns 409"). No introducido en sesiones recientes; pertenece a su propia investigación.

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

**Lado cliente:** todo `fetch` a `/api/admin/*` debe mandar `Authorization: Bearer ${session.access_token}`, obtenido con `supabase.auth.getSession()`. Ver `ProductForm.tsx`, `InventoryPageInteractive.tsx` y `OrderDetailsModal.tsx` como referencias.

**Tests:** mockear `supabase.auth.getUser` + `from('user_profiles')` con el rol deseado. Ver [src/app/api/admin/orders/[id]/route.test.ts](src/app/api/admin/orders/[id]/route.test.ts) — incluye tests negativos (401 sin token, 403 con role no admin).

### Idempotencia de órdenes
Patrón ya implementado en [src/app/api/create-order/route.ts](src/app/api/create-order/route.ts):
- Cliente envía `idempotency_key` (≤128 chars).
- Servidor hashea el payload normalizado (sha256) y lo guarda en `idempotency_payload_hash`.
- UNIQUE INDEX parcial en `orders(idempotency_key)` ([migrations/20260315_stage3_1_orders_idempotency.sql](migrations/20260315_stage3_1_orders_idempotency.sql)).
- Conflicto `23505` → reconsultar y devolver la orden existente si el hash coincide; `409` si difiere.

### Stock-once
Toda escritura que descuente stock pasa por [src/lib/stock/applyOrderStockOnce.ts](src/lib/stock/applyOrderStockOnce.ts), que invoca la RPC `apply_order_stock_once` con `FOR UPDATE` + flag `stock_applied_at`. Nunca actualizar `products.stock_count` directamente desde una route.

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
- Falla → `401`. (Resto del handler mantiene `200` en errores no críticos para no provocar reintentos masivos de MP.)

**Env vars requeridas** (server-only, sin prefijo `NEXT_PUBLIC_`):
- `MP_ACCESS_TOKEN` — credencial de la app, usada para `GET /v1/payments/:id`.
- `MP_WEBHOOK_SECRET` — clave secreta del webhook. **Distinta** del access token. Dashboard → Tus integraciones → la app → Webhooks → "Revelar clave secreta". Hay una por entorno (test/prod).

Tests del route mockean `MP_WEBHOOK_SECRET` y firman las requests con el helper `signManifest`. Ver [src/app/api/mp-webhook/route.test.ts](src/app/api/mp-webhook/route.test.ts) — incluye 2 tests negativos (sin signature → 401, signature tampered → 401).

**Verificado en producción (2026-05-22):** smoke test contra `https://povstore.uy/api/mp-webhook` pasó 4/4 casos: sin firma → 401 `missing_signature`, firma adulterada → 401 `invalid`, ts 10 min viejo → 401 `expired`, firma válida → 200. La env var `MP_WEBHOOK_SECRET` en Vercel matchea con la del dashboard MP (modo de prueba).

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

Estado al 2026-05-22: de los 4 issues 🔴 del audit original, **2 cerrados** (admin orders auth + MP webhook HMAC). Quedan 2 críticos + 4 de severidad alta. Orden recomendado:

1. **🔴 `/api/order-details` (IDOR de PII)** — *Esfuerzo: ~30 min. Impacto: alto.*
   Mismo patrón que el bug ya resuelto en orders admin. Hoy `GET /api/order-details?orderId=<uuid>` devuelve PII completa con solo conocer el UUID. Fix: exigir email + order_number en body (o token firmado/HMAC del orderId al crear la orden). Los call sites del cliente que lo usan ([src/app/order-confirmation/](src/app/order-confirmation/) presumiblemente) van a necesitar ajuste paralelo, como hicimos con `OrderDetailsModal`.

2. **🟠 Rate-limit en endpoints públicos** — *Esfuerzo: ~1.5 h. Impacto: alto.*
   `POST /api/create-order`, `POST /api/newsletter/subscribe`, `POST /api/mp-preference` están abiertos sin throttle. Recomendado: `@upstash/ratelimit` + `@upstash/redis` (free tier alcanza), wrapper middleware-style. Como bonus, captcha (hCaptcha o Turnstile) en el newsletter.

3. **🟠 `package.json` → `"start": "next start"`** — *Esfuerzo: ~2 min. Impacto: medio.*
   Trivial: cambiar `"start": "next dev -p 4028"` por `"start": "next start"` y mover el dev a `"dev": "next dev -p 4028"` (ya está). Cierra la trampa de "alguien corre npm start en prod y arranca el dev server".

4. **🔴 `.env` commiteada / rotación de credenciales** — *Esfuerzo: ~1 h. Impacto: alto pero destructivo.*
   Tres sub-pasos: (a) rotar las credenciales reales en Supabase + MercadoPago dashboard, (b) actualizar `.env` local y env vars en Vercel con los nuevos valores, (c) purgar el `.env` del historial con `git filter-repo` y `git push --force` (coordinar con cualquier otro dev que tenga la rama). El `.env.example` ya está commiteado como plantilla. Hacer cuando estés sin presión — `--force` push es irreversible para colaboradores.

5. **🟠 Endurecer TypeScript** — *Esfuerzo: ~2-4 h. Impacto: medio.*
   Quitar `ignoreBuildErrors` y `ignoreDuringBuilds` en `next.config.mjs`, poner `strict: true` en `tsconfig.json`, arreglar los errores que aparezcan (esperables: muchos `any` implícitos, algunos `@ts-ignore` que esconden bugs reales). Sin prisa pero acumula deuda silenciosa.

6. **🟠 Limpieza de código muerto** — *Esfuerzo: ~10 min. Impacto: bajo, pero higiene.*
   Borrar [api_/](api_/), `*.backup`, `estructura.txt`. Cero riesgo. Buen first-commit cuando se quiera demostrar que el repo es activo.

**Nota:** los componentes-dios (`ProductForm.tsx` 1965 LOC, etc.) y la falta de tests E2E son deuda mayor pero no urgente. Se atacan cuando se necesite tocar esas zonas — refactor incremental, no big-bang.

**No modificar archivos sin aprobación explícita del usuario.**

Aplica a todo el repo. Investigación, lectura, propuestas y diffs propuestos en respuesta SÍ. Edits, escrituras, comandos destructivos, commits, pushes, migraciones, cambios de config NO — pedir confirmación primero, indicando qué archivo y qué cambio. Esta regla supersede cualquier inferencia de "obvio que querés esto".
