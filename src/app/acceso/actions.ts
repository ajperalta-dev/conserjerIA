"use server";
import { serverClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
export async function authenticate(_: string, form: FormData) {
  const mode = form.get("mode"),
    email = z.email().safeParse(form.get("email"));
  if (!email.success) return "Ingresá un email válido.";
  try {
    const client = await serverClient(),
      origin = process.env.APP_URL;
    if (mode === "password") {
      const password = z.string().min(8).safeParse(form.get("password"));
      if (!password.success)
        return "La contraseña debe tener al menos 8 caracteres.";
      const { error } = await client.auth.signInWithPassword({
        email: email.data,
        password: password.data,
      });
      if (error)
        return "No se pudo iniciar sesión. Revisá tus datos y la confirmación de email.";
    } else {
      if (!origin) return "Falta configurar APP_URL en el servidor.";
      const redirectTo = origin + "/auth/callback";
      const result =
        mode === "recovery"
          ? await client.auth.resetPasswordForEmail(email.data, { redirectTo })
          : await client.auth.signInWithOtp({
              email: email.data,
              options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
            });
      if (result.error)
        return "No se pudo procesar la solicitud. Intentá nuevamente más tarde.";
      return "Si la cuenta está habilitada, recibirás un email con el enlace.";
    }
  } catch {
    return "Supabase está pendiente de configuración.";
  }
  redirect("/seleccionar");
}
