import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente ligado a la sesión del usuario, para server components y route
 * handlers. Todo lo que use esto se vuelve dinámico — es lo correcto para
 * el panel de redacción, y por eso las páginas públicas usan `public.ts`.
 */
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los server components no pueden escribir cookies. El refresh de
          // sesión lo hace el middleware, así que ignorar acá es seguro.
        }
      },
    },
  });
}

export type Rol = "lector" | "editor" | "admin";

export interface Sesion {
  userId: string;
  email: string | null;
  displayName: string | null;
  rol: Rol;
}

/** Devuelve la sesión con su rol, o null si no hay nadie logueado. */
export async function getSesion(): Promise<Sesion | null> {
  const supabase = await createServerSupabase();

  // getUser() valida el token contra Supabase. getSession() lee la cookie sin
  // verificarla, así que no sirve para decidir permisos.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: perfil?.display_name ?? null,
    rol: (perfil?.role as Rol) ?? "lector",
  };
}

export function puedeEditar(sesion: Sesion | null): boolean {
  return sesion?.rol === "editor" || sesion?.rol === "admin";
}
