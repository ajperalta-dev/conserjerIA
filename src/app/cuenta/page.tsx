import { verifiedSubject } from "@/integrations/supabase/session";
import { serverClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountForm } from "@/components/account-form";
import { InviteForm } from "@/components/invite-form";
import { MfaForm } from "@/components/mfa-form";
import { signOut } from "./actions";
export default async function Account() {
  if (!(await verifiedSubject())) redirect("/acceso");
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/acceso");
  const { data } = await client
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return (
    <main className="gate">
      <h1>Tu cuenta</h1>
      <p>{user.email}</p>
      <AccountForm name={data?.display_name ?? ""} />
      <MfaForm />
      <InviteForm />
      <Link className="outline" href="/seleccionar">
        Seleccionar organización y consorcio
      </Link>
      <form action={signOut}>
        <button className="outline">Cerrar todas las sesiones</button>
      </form>
    </main>
  );
}
export const dynamic = "force-dynamic";
