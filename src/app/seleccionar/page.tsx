import { verifiedSubject } from "@/integrations/supabase/session";
import { serverClient } from "@/integrations/supabase/server";
import { selectScope } from "@/app/cuenta/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
export default async function Select() {
  if (!(await verifiedSubject())) redirect("/acceso");
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: orgs } = await client.from("organizations").select("id,name");
  const { data: consortiums } = await client
    .from("consortiums")
    .select("id,organization_id,name");
  return (
    <main className="gate">
      <h1>Tu espacio de trabajo</h1>
      {orgs?.map((org) => (
        <section key={org.id} className="account-form">
          <h2>{org.name}</h2>
          <form action={selectScope}>
            <label>
              Consorcio
              <select name="consortium" required>
                {consortiums
                  ?.filter((c) => c.organization_id === org.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <button className="primary">Ingresar al consorcio</button>
          </form>
        </section>
      ))}
      {!orgs?.length && (
        <p>
          No tenés organizaciones asignadas. Aceptá una invitación desde tu
          cuenta.
        </p>
      )}
      <Link className="outline" href="/cuenta">
        Gestionar cuenta e invitaciones
      </Link>
    </main>
  );
}
export const dynamic = "force-dynamic";
