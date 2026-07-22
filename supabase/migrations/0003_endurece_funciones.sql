-- Correcciones que marcó el linter de seguridad de Supabase.

-- 1. search_path fijo. Sin esto, quien invoque el trigger podría anteponer un
--    esquema propio y hacer que la función resuelva otra cosa.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2. PostgREST expone toda función de `public` como endpoint /rest/v1/rpc/...
--    Estas dos son funciones de trigger: no tienen por qué ser invocables
--    desde la API. Los triggers corren con los permisos del dueño de la
--    tabla, así que revocar no los afecta.
revoke all on function public.crear_perfil_para_usuario_nuevo() from public, anon, authenticated;
revoke all on function public.proteger_rol() from public, anon, authenticated;

-- 3. rol_actual() sí se sigue necesitando: las policies de RLS se evalúan con
--    los permisos de quien consulta, así que `authenticated` tiene que poder
--    ejecutarla o las policies fallarían. Se la sacamos a `anon`, que no tiene
--    sesión y por lo tanto nunca tiene un rol que consultar.
--
--    El linter la sigue marcando como warning: es intencional. Solo devuelve
--    el rol del propio usuario que la llama, así que no expone nada ajeno.
revoke all on function public.rol_actual() from public, anon;
grant execute on function public.rol_actual() to authenticated;
