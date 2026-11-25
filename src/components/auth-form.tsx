"use client";
import { useActionState } from "react";
import { authenticate } from "@/app/acceso/actions";
export function AuthForm() {
  const [message, action, pending] = useActionState(authenticate, "");
  return (
    <form action={action} className="account-form">
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
        />
      </label>
      <button
        className="primary"
        name="mode"
        value="password"
        disabled={pending}
      >
        Iniciar sesión
      </button>
      <button className="outline" name="mode" value="magic" disabled={pending}>
        Recibir magic link
      </button>
      <button
        className="outline"
        name="mode"
        value="recovery"
        disabled={pending}
      >
        Recuperar contraseña
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
