"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

export default function CompleteAuthentication() {
  const [message, setMessage] = useState("Verificando el enlace…");
  useEffect(() => {
    async function complete() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      // Remove bearer credentials from browser history before any navigation.
      window.history.replaceState(null, "", window.location.pathname);
      if (!accessToken || !refreshToken) {
        setMessage("El enlace es inválido o venció. Solicitá uno nuevo.");
        return;
      }
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      const { error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        setMessage("No se pudo verificar el enlace. Solicitá uno nuevo.");
        return;
      }
      window.location.replace("/cuenta");
    }
    void complete();
  }, []);
  return (
    <main className="gate">
      <h1>Verificación de acceso</h1>
      <p role="status">{message}</p>
      <a className="outline" href="/acceso">
        Volver al acceso
      </a>
    </main>
  );
}
