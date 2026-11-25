"use server";
import { serverClient } from "@/integrations/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
export async function saveAccount(_: string, form: FormData) {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return "Sesión vencida.";
  const password = form.get("password");
  if (password) {
    const parsed = z.string().min(12).max(128).safeParse(password);
    if (!parsed.success) return "Usá entre 12 y 128 caracteres.";
    const { error } = await client.auth.updateUser({ password: parsed.data });
    return error
      ? "No se pudo actualizar la contraseña. Verificá tu identidad nuevamente."
      : "Contraseña actualizada.";
  }
  const name = z.string().trim().min(1).max(120).safeParse(form.get("name"));
  if (!name.success) return "Ingresá un nombre válido.";
  const existing = await client
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  const { error } = existing.data
    ? await client
        .from("profiles")
        .update({
          display_name: name.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    : await client
        .from("profiles")
        .insert({ id: user.id, display_name: name.data });
  return error ? "No se pudo guardar el perfil." : "Perfil actualizado.";
}
export async function selectScope(form: FormData) {
  const id = z.uuid().parse(form.get("consortium"));
  const client = await serverClient();
  const { data, error } = await client
    .from("consortium_members")
    .select("organization_id,consortium_id,role")
    .eq("consortium_id", id)
    .single();
  if (error || !data) throw new Error("Consorcio sin autorización");
  const jar = await cookies();
  jar.set("consortium", data.consortium_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect(
    ["OWNER", "TENANT"].includes(data.role)
      ? "/dashboard/comunicaciones"
      : "/dashboard",
  );
}
export async function signOut() {
  const client = await serverClient();
  await client.auth.signOut({ scope: "global" });
  (await cookies()).delete("consortium");
  redirect("/acceso");
}
export async function acceptInvitation(_: string, form: FormData) {
  const client = await serverClient();
  const id = z.uuid().safeParse(form.get("invitation"));
  if (!id.success) return "Código de invitación inválido.";
  const { error } = await client.rpc("accept_invitation", {
    invitation_id: id.data,
  });
  return error
    ? "La invitación no está disponible para esta cuenta."
    : "Invitación aceptada. Ya podés seleccionar el consorcio.";
}
