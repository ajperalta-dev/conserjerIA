import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@/integrations/supabase/server";
export async function requireScope() {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/acceso");
  const id = (await cookies()).get("consortium")?.value;
  if (!id) redirect("/seleccionar");
  const { data, error } = await client
    .from("consortium_members")
    .select("organization_id,consortium_id,role")
    .eq("consortium_id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) redirect("/seleccionar");
  const consortium = await client
    .from("consortiums")
    .select("id,name")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  if (!consortium.data) redirect("/seleccionar");
  return { ...data, userId: user.id, consortiumName: consortium.data.name };
}
