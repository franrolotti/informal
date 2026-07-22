-- Usuarios y roles.
--
-- Este login NO es para lectores: info.rmal se lee sin cuenta. Es la puerta
-- del panel de redacción en /admin. Por eso conviene dejar el signup público
-- DESACTIVADO en el dashboard (Authentication → Sign In / Providers →
-- "Allow new users to sign up" en off) e invitar a la gente a mano.

create type public.rol_usuario as enum ('lector', 'editor', 'admin');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  role         public.rol_usuario not null default 'lector',
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil y rol de cada usuario. El rol solo lo cambia un admin.';

/* ------------------------------------------------------------- helpers -- */

-- SECURITY DEFINER a propósito: si las policies de `profiles` consultaran
-- `profiles` directamente, RLS se llamaría a sí misma y Postgres cortaría por
-- recursión infinita. Esta función lee saltando RLS y rompe el ciclo.
--
-- Ojo: no puede llamarse `current_role` — es palabra reservada en Postgres.
create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Cada usuario nuevo de auth.users obtiene su perfil automáticamente.
create or replace function public.crear_perfil_para_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'alguien@informal'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario_nuevo();

-- Nadie se asciende solo. Sin esto, la policy "cada uno edita su perfil"
-- alcanzaría para que un lector se ponga admin con un solo UPDATE.
create or replace function public.proteger_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.rol_actual() is distinct from 'admin' then
    raise exception 'Solo un admin puede cambiar el rol de un usuario';
  end if;
  return new;
end;
$$;

create trigger profiles_proteger_rol
  before update on public.profiles
  for each row execute function public.proteger_rol();

/* ----------------------------------------------------------------- RLS -- */

alter table public.profiles enable row level security;

create policy "cada uno ve su perfil"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "los admin ven todos los perfiles"
  on public.profiles for select to authenticated
  using (public.rol_actual() = 'admin');

create policy "cada uno edita su perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "los admin editan cualquier perfil"
  on public.profiles for update to authenticated
  using (public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');

-- Editores y admin ven también borradores y retiradas desde el panel.
-- El público sigue viendo solo lo publicado (policy de 0001).
create policy "la redacción ve todas las notas"
  on public.articles for select to authenticated
  using (public.rol_actual() in ('editor', 'admin'));

/* --------------------------------------------------------------- setup -- */

-- Después de crear tu usuario desde /login (o invitándolo en el dashboard),
-- corré esto UNA vez con tu mail para tener el primer admin:
--
--   update public.profiles set role = 'admin' where email = 'franrolotti1@gmail.com';
--
-- No se hace automático a propósito: dejaría un admin escrito en un repo público.
