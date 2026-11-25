"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
export function MfaForm() {
  const [factor, setFactor] = useState(""),
    [secret, setSecret] = useState(""),
    [message, setMessage] = useState("");
  function client() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  async function enroll() {
    const supabase = client();
    const { data: list, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMessage("No se pudieron consultar los factores.");
      return;
    }
    const existing = list.totp.find((f) => f.status === "verified");
    if (existing) {
      setFactor(existing.id);
      setMessage("Ingresá el código de tu autenticador.");
      return;
    }
    for (const item of list.all.filter((f) => f.factor_type==="totp" && f.status === "unverified"))
      await supabase.auth.mfa.unenroll({ factorId: item.id });
    const result = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (result.error) {
      setMessage("No se pudo iniciar MFA.");
      return;
    }
    setFactor(result.data.id);
    setSecret(result.data.totp.secret);
  }
  async function verify(form: FormData) {
    const code = String(form.get("code"));
    if (!/^\d{6}$/.test(code)) {
      setMessage("Ingresá los 6 dígitos.");
      return;
    }
    const { error } = await client().auth.mfa.challengeAndVerify({
      factorId: factor,
      code,
    });
    setMessage(
      error
        ? "Código inválido o vencido."
        : "Identidad verificada para operaciones sensibles.",
    );
    if (!error) setSecret("");
  }
  return (
    <section className="account-form">
      <h2>Autenticación multifactor</h2>
      <button className="outline" onClick={enroll}>
        Configurar o verificar autenticador
      </button>
      {secret && (
        <p>
          Agregá esta clave a tu autenticador TOTP <code>{secret}</code>
        </p>
      )}
      {factor && (
        <form action={verify}>
          <label>
            Código de 6 dígitos
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              autoComplete="one-time-code"
            />
          </label>
          <button className="primary">Verificar</button>
        </form>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
