import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase, getSesion, type Rol } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Redacción — Informal",
  robots: { index: false, follow: false },
};

// Depende de la sesión: nunca se cachea.
export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, string> = {
  published: "publicada",
  draft: "borrador",
  retired: "retirada",
};

interface FilaNota {
  slug: string;
  title: string;
  category: string;
  date: string;
  status: string;
  updated_at: string;
}

interface FilaPerfil {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Rol;
}

async function cambiarRol(formData: FormData) {
  "use server";

  // El trigger `profiles_proteger_rol` ya bloquea esto en la base. Lo
  // chequeamos igual acá para fallar con un mensaje claro y no depender de
  // una sola capa.
  const sesion = await getSesion();
  if (sesion?.rol !== "admin") {
    throw new Error("Solo un admin puede cambiar roles.");
  }

  const userId = String(formData.get("userId"));
  const rol = String(formData.get("rol")) as Rol;
  if (!["lector", "editor", "admin"].includes(rol)) {
    throw new Error(`Rol inválido: ${rol}`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ role: rol })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  const supabase = await createServerSupabase();

  // Con el rol de editor/admin, RLS deja ver también borradores y retiradas.
  const { data: notas } = await supabase
    .from("articles")
    .select("slug, title, category, date, status, updated_at")
    .order("date", { ascending: false });

  const { data: perfiles } =
    sesion.rol === "admin"
      ? await supabase
          .from("profiles")
          .select("id, email, display_name, role")
          .order("created_at", { ascending: true })
      : { data: null };

  return (
    <section className="section container">
      <div className="row-head">
        <div className="row-title">
          Redacción <span>panel interno</span>
        </div>
      </div>

      <div className="admin-sesion">
        <p>
          {sesion.displayName ?? sesion.email} · rol{" "}
          <strong>{sesion.rol}</strong>
        </p>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost" type="submit">
            Cerrar sesión
          </button>
        </form>
      </div>

      {sesion.rol === "lector" ? (
        <p className="hero-sub">
          Tu cuenta todavía no tiene permisos de redacción. Pedile a un admin
          que te asigne el rol de editor.
        </p>
      ) : (
        <>
          <h2 className="admin-h2">Notas</h2>
          <p className="admin-ayuda">
            Las notas se editan en el vault de Obsidian, no acá. Esta lista es
            el reflejo de lo que hay en la base después del último{" "}
            <code>npm run sync</code>.
          </p>
          <div className="admin-tabla-wrap">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Nota</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(notas as FilaNota[] | null)?.map((n) => (
                  <tr key={n.slug}>
                    <td>{n.title}</td>
                    <td>{n.category}</td>
                    <td>{n.date}</td>
                    <td>
                      <span className={`estado estado-${n.status}`}>
                        {ETIQUETA_ESTADO[n.status] ?? n.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!notas?.length ? (
                  <tr>
                    <td colSpan={4}>Todavía no hay notas sincronizadas.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {perfiles ? (
        <>
          <h2 className="admin-h2">Usuarios</h2>
          <p className="admin-ayuda">
            Las cuentas se crean por invitación desde el dashboard de Supabase
            (Authentication → Users → Invite). Acá solo se asignan roles.
          </p>
          <div className="admin-tabla-wrap">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Mail</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {(perfiles as FilaPerfil[]).map((p) => (
                  <tr key={p.id}>
                    <td>{p.display_name ?? "—"}</td>
                    <td>{p.email ?? "—"}</td>
                    <td>
                      <form action={cambiarRol} className="admin-rol-form">
                        <input type="hidden" name="userId" value={p.id} />
                        <select
                          name="rol"
                          defaultValue={p.role}
                          disabled={p.id === sesion.userId}
                        >
                          <option value="lector">lector</option>
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          className="btn btn-ghost"
                          type="submit"
                          disabled={p.id === sesion.userId}
                        >
                          Guardar
                        </button>
                      </form>
                      {p.id === sesion.userId ? (
                        <span className="admin-ayuda">
                          no podés cambiar tu propio rol
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
