-- Seed de reseñas dummy para entorno actual
-- Objetivo: cargar entre 26 y 31 reseñas por producto principal
-- Tabla destino: public.product_reviews
-- Requisitos previos:
-- 1) Deben existir user_profiles con estos IDs
-- 2) Deben existir products con los IDs indicados

begin;

-- Limpieza opcional SOLO para estos dos productos (evita duplicados al re-ejecutar)
delete from public.product_reviews
where product_id in (
  '1aabfacb-5f35-4bcf-9e6d-0316483d8362', -- SJCAM C100Plus
  'c98290bd-884f-49ce-9554-71a0210638f8'  -- SJCAM C200
);

with
seed_users as (
  select *
  from (
    values
      ('2db7f7af-3bb5-4f5e-8ac3-3d1bad561054'::uuid),
      ('a9fc4897-3997-4592-9b14-cb261f71fbaa'::uuid)
  ) as u(user_id)
),
seed_products as (
  select *
  from (
    values
      ('1aabfacb-5f35-4bcf-9e6d-0316483d8362'::uuid),
      ('c98290bd-884f-49ce-9554-71a0210638f8'::uuid)
  ) as p(product_id)
),
seed_comments as (
  select *
  from (
    values
      (1,  'La calidad de imagen me sorprendió para este tamaño.', 5),
      (2,  'La usé en moto y quedó súper estable.', 5),
      (3,  'Muy buena relación precio/calidad.', 5),
      (4,  'Llegó rápido y era lo que esperaba.', 5),
      (5,  'Batería correcta para salidas cortas.', 4),
      (6,  'Fácil de configurar desde el celular.', 5),
      (7,  'Buen audio para vlogs casuales.', 4),
      (8,  'La imagen nocturna está mejor de lo que pensé.', 4),
      (9,  'El tamaño mini la hace comodísima.', 5),
      (10, 'La carcasa acuática me sirvió en la playa.', 5),
      (11, 'Se nota robusta y bien construida.', 5),
      (12, 'Con buena luz graba excelente.', 5),
      (13, 'Ideal para POV en bici.', 5),
      (14, 'Buena nitidez y colores lindos.', 4),
      (15, 'No tuve cortes grabando en 4K.', 5),
      (16, 'El envío a tiempo, todo impecable.', 5),
      (17, 'Muy recomendable para empezar contenido.', 5),
      (18, 'Me gustó que no pesa nada.', 5),
      (19, 'Perfecta para registrar rutas largas.', 4),
      (20, 'La app respondió bien en iPhone.', 4),
      (21, 'La volvería a comprar sin duda.', 5),
      (22, 'Video fluido y fácil de editar después.', 5),
      (23, 'Excelente para TikTok y Reels.', 5),
      (24, 'Los accesorios suman muchísimo.', 5),
      (25, 'Cumple totalmente con lo prometido.', 5),
      (26, 'Muy buena cámara para uso diario.', 4),
      (27, 'La llevé de viaje y rindió impecable.', 5),
      (28, 'El ángulo es muy útil para POV.', 5),
      (29, 'Para este rango de precio, excelente.', 5),
      (30, 'Muy conforme con la compra.', 5),
      (31, 'La recomiendo a cualquiera que cree contenido.', 5)
  ) as c(idx, review_text, rating)
),
seed_plan as (
  -- 26 reseñas para C100Plus + 27 reseñas para C200
  select p.product_id, c.idx, c.review_text, c.rating
  from seed_products p
  join seed_comments c on
    (p.product_id = '1aabfacb-5f35-4bcf-9e6d-0316483d8362'::uuid and c.idx <= 26)
    or
    (p.product_id = 'c98290bd-884f-49ce-9554-71a0210638f8'::uuid and c.idx <= 27)
)
insert into public.product_reviews (
  product_id,
  user_id,
  rating,
  review_text,
  is_verified_purchase,
  created_at,
  updated_at
)
select
  s.product_id,
  (array_agg(u.user_id order by u.user_id))[((s.idx - 1) % 2) + 1] as user_id,
  s.rating,
  s.review_text,
  true as is_verified_purchase,
  (now() - ((60 - s.idx) || ' days')::interval + ((s.idx % 7) || ' hours')::interval) as created_at,
  now() as updated_at
from seed_plan s
cross join seed_users u
group by s.product_id, s.idx, s.review_text, s.rating
order by s.product_id, s.idx;

commit;

-- Verificación rápida
-- select product_id, count(*) as qty, round(avg(rating)::numeric, 2) as avg_rating
-- from public.product_reviews
-- where product_id in ('1aabfacb-5f35-4bcf-9e6d-0316483d8362','c98290bd-884f-49ce-9554-71a0210638f8')
-- group by product_id;
