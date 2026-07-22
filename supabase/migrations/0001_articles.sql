-- Notas de info.rmal.
--
-- Esta tabla NO es un archivo histórico: es el estado actual del sitio.
-- El archivo completo (borradores, notas retiradas, investigación, fuentes)
-- vive en el repo privado informal-vault. Acá solo llega lo que el vault
-- marca como `published`, vía scripts/sync.mjs.
--
-- Consecuencia deliberada: retirar una nota es un UPDATE que no deja rastro
-- público, a diferencia de un commit revertido en un repo abierto.

create table public.articles (
  slug            text primary key,
  title           text        not null,
  subtitle        text        not null default '',
  category        text        not null,
  author          text        not null default 'Redacción Informal',
  date            date        not null,
  reading_minutes integer     not null default 1,
  color           text        not null default '#c6d7e2',
  featured        boolean     not null default false,
  -- `body` es el markdown ya convertido a los bloques que renderiza la app
  -- (y que consume el generador de PDF). Se convierte en el sync para no
  -- parsear markdown en cada request.
  body            jsonb       not null default '[]'::jsonb,
  -- El markdown original, por si hay que reconstruir o auditar.
  body_md         text        not null default '',
  status          text        not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint articles_category_check check (
    category in ('Cultura', 'Política', 'Economía', 'Teorías Conspirativas', 'Blogs')
  ),
  constraint articles_status_check check (
    status in ('draft', 'published', 'retired')
  )
);

comment on table public.articles is
  'Estado actual del sitio. El archivo completo está en el repo privado informal-vault.';

-- La portada ordena por fecha dentro de lo publicado.
create index articles_publicadas_por_fecha_idx
  on public.articles (date desc)
  where status = 'published';

create index articles_categoria_idx
  on public.articles (category)
  where status = 'published';

-- El hero de la portada es uno solo. Que la base lo garantice evita que dos
-- notas marcadas `featured: true` en el vault se peleen en silencio.
-- Se indexa la columna `featured` filtrando a las filas donde es true: todos
-- los valores indexados valen lo mismo, así que "único" equivale a "una sola".
create unique index articles_un_solo_destacado_idx
  on public.articles (featured)
  where featured and status = 'published';

-- updated_at se mantiene solo, aunque el sync también lo mande.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger articles_tocar_updated_at
  before update on public.articles
  for each row execute function public.tocar_updated_at();

/* ------------------------------------------------------------------ RLS -- */

alter table public.articles enable row level security;

-- El público lee únicamente lo publicado. Un borrador no puede filtrarse ni
-- con una query mal escrita en la app: la base directamente no lo devuelve.
create policy "lectura pública de notas publicadas"
  on public.articles
  for select
  to anon, authenticated
  using (status = 'published');

-- No hay policies de insert/update/delete a propósito. La única forma de
-- escribir es el sync con la service_role key, que saltea RLS y corre desde
-- la máquina del editor. Las policies de lectura para editores se agregan en
-- 0002, donde ya existen los roles.
