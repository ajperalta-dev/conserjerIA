import Overview from "@/components/overview";
import { propertyWorkspace } from "@/modules/properties/repository";

export default async function Page() {
  const { client, scope } = await propertyWorkspace();
  const [consortia, units, residents] = await Promise.all([
    client
      .from("consortiums")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
    client
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("consortium_id", scope.consortium_id)
      .is("archived_at", null),
    client
      .from("residents")
      .select("id", { count: "exact", head: true })
      .eq("consortium_id", scope.consortium_id)
      .is("archived_at", null),
  ]);
  if (consortia.error || units.error || residents.error)
    throw new Error("No se pudieron cargar los indicadores de propiedades.");
  return (
    <Overview
      base="/dashboard"
      propertyCounts={[
        consortia.count ?? 0,
        units.count ?? 0,
        residents.count ?? 0,
      ]}
    />
  );
}
