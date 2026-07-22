import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSesion } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Acceso a la redacción — Informal",
  description: "Panel interno de Informal.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const sesion = await getSesion();
  if (sesion) redirect("/admin");

  return (
    <section className="section container">
      <div className="row-head">
        <div className="row-title">
          Acceso <span>solo redacción</span>
        </div>
      </div>
      <LoginForm />
    </section>
  );
}
