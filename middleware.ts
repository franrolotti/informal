import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresca el token de Supabase en cada request y corta el paso a /admin.
 *
 * El middleware es el único lugar donde se pueden escribir las cookies de
 * sesión renovadas: los server components no pueden. Sin esto, la sesión se
 * vence sola a los pocos minutos.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales no hay forma de validar una sesión. Cerramos el panel en
  // vez de dejarlo pasar, y explicamos por qué en lugar de tirar un error
  // genérico del SDK.
  if (!url || !key) {
    return new NextResponse(
      "Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.local.example).",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Solo donde importa la sesión. El resto del sitio es público y no necesita
  // pagar una verificación de token por request.
  matcher: ["/admin/:path*", "/login"],
};
