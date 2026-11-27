import { OperationForm, Disclosure } from "@/modules/properties/forms";
import "@/modules/properties/properties.css";
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
    .select("id,organization_id,name")
    .is("archived_at", null);
  const { data: admins } = await client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "ADMIN");
  return (
    <main className="gate">
      <h1>Tu espacio de trabajo</h1>
      {orgs?.map((org) => (
        <section key={org.id} className="account-form">
          <h2>{org.name}</h2>
          {consortiums?.some((c) => c.organization_id === org.id) ? (
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
          ) : (
            <p>Todavía no hay consorcios para seleccionar.</p>
          )}
          {admins?.some((a) => a.organization_id === org.id) && (
            <Disclosure title="Crear consorcio">
              <OperationForm
                hidden={{
                  entity: "consortium",
                  operation: "create",
                  organization_id: org.id,
                }}
                submit="Crear"
              >
                <label>
                  Nombre
                  <input name="name" maxLength={120} required />
                </label>
              </OperationForm>
            </Disclosure>
          )}
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
