import { createClient } from "@supabase/supabase-js";

/**
 * Cliente para leer contenido público (las notas de la portada y del sitio).
 *
 * No toca cookies a propósito: sin sesión, las páginas siguen siendo
 * cacheables con `revalidate` en vez de volverse dinámicas en cada request.
 * Para todo lo que dependa del usuario logueado va el cliente de `server.ts`.
 *
 * Usa la clave publicable, que con RLS activa solo puede leer notas
 * publicadas.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copiá .env.local.example a .env.local.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
