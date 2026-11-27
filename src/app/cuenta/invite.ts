"use server";
import { serverClient } from "@/integrations/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
export async function inviteResident(_: string, form: FormData) {
  const parsed = z
    .object({
      email: z.email().transform((value) => value.toLowerCase()),
      resident_id: z.uuid().optional(),
      consortium_id: z.uuid(),
      organization_id: z.uuid(),
      role: z.enum([
        "OWNER",
        "TENANT",
        "ACCOUNTANT",
        "BOARD_MEMBER",
        "MAINTENANCE",
      ]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Revisá los datos de la invitación.";
  const client = await serverClient();
  const { data, error } = await client
    .from("invitations")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data)
    return "Se requiere permiso de invitación en este consorcio y MFA verificado.";
  const secret = process.env.SUPABASE_SECRET_KEY,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    origin = process.env.APP_URL;
  if (!secret || !url || !origin)
    return (
      "Invitación creada. Código para compartir con la persona: " +
      data.id +
      ". El envío por email está pendiente de configurar."
    );
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: origin + "/auth/callback",
  });
  return result.error
    ? "Invitación creada. Código: " + data.id + ". No se pudo enviar el email."
    : "Email enviado. Código de aceptación: " + data.id;
}
