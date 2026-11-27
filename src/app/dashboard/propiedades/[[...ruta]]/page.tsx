import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Consortiums,
  ResidentDetail,
  Residents,
  UnitDetail,
  Units,
  propertyRoot,
} from "@/modules/properties/views";
import { ImportView } from "@/modules/properties/import-view";
import { propertyWorkspace } from "@/modules/properties/repository";

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ ruta?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ruta = [] } = await params;
  const filters = await searchParams;
  if (ruta.length > 2) notFound();
  const [page, id] = ruta;
  if (!page) return <Consortiums />;
  if (page === "unidades")
    return id ? <UnitDetail id={id} /> : <Units filters={filters} />;
  if (page === "residentes")
    return id ? <ResidentDetail id={id} /> : <Residents />;
  if (page === "importar" && !id) {
    const ws = await propertyWorkspace();
    if (!ws.isAdmin) notFound();
    const table = filters.tipo === "residents" ? "residents" : "units";
    const [rows, floors, buildings] = await Promise.all([
      ws.read(table),
      ws.read("floors"),
      ws.read("buildings"),
    ]);
    const options = floors
      .filter((floor) => !floor.archived_at)
      .map((floor) => ({
        id: String(floor.id),
        label:
          buildings.find((b) => b.id === floor.building_id)?.name +
          " · " +
          floor.name,
      }));
    return (
      <>
        <Link
          href={
            propertyRoot + (table === "units" ? "/unidades" : "/residentes")
          }
        >
          ‹ Volver
        </Link>
        <h1>Importar {table === "units" ? "unidades" : "residentes"}</h1>
        <ImportView
          table={table}
          floors={options}
          existing={rows.map((row) => ({
            registry_code: row.registry_code,
            dni: row.dni,
            cuit: row.cuit,
            email: row.email,
          }))}
        />
      </>
    );
  }
  notFound();
}
