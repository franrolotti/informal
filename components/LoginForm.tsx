"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Sin distinguir "no existe" de "clave incorrecta": decirlo permitiría
      // averiguar qué mails tienen cuenta en la redacción.
      setError("Mail o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    // refresh() para que el server vuelva a leer la sesión de la cookie.
    router.refresh();
    router.push("/admin");
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="login-field">
        <span>Mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label className="login-field">
        <span>Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error ? (
        <p className="login-error" role="alert">
          ⚠ {error}
        </p>
      ) : null}

      <button className="btn" type="submit" disabled={cargando}>
        {cargando ? "Entrando…" : "▶ Entrar"}
      </button>

      <p className="login-nota">
        Las cuentas se crean por invitación. Si no tenés uno, pedíselo a un
        admin de la redacción.
      </p>
    </form>
  );
}
