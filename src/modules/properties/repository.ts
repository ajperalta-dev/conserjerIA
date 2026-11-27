import { serverClient } from "@/integrations/supabase/server";
import { requireScope } from "@/modules/identity/context";
import type { Database } from "@/types/database";
import type { PropertyRow } from "./fields";

type Table = keyof Database["public"]["Tables"];
export async function propertyWorkspace() {
  const [scope, client] = await Promise.all([requireScope(), serverClient()]);
  const read = async (
    name: Table,
    key = "consortium_id",
    id = scope.consortium_id,
  ) => {
    const rows: PropertyRow[] = [];
    for (let offset = 0; ; offset += 250) {
      const { data, error } = await client
        .from(name)
        .select("*")
        .eq(key, id)
        .order(
          name === "consortium_details" || name === "property_bank_details"
            ? key
            : "id",
        )
        .range(offset, offset + 249);
      if (error) throw new Error("No se pudo consultar " + name);
      rows.push(...(data as unknown as PropertyRow[]));
      if (data.length < 250) return rows;
    }
  };
  return { scope, client, read, isAdmin: scope.role === "ADMIN" };
}
export function rowLabel(row: PropertyRow) {
  return String(row.name ?? row.registry_code ?? row.id ?? "");
}
export const rowOptions = (rows: PropertyRow[]) =>
  rows.map((row) => ({
    id: String(row.id),
    label: rowLabel(row) + (row.archived_at ? " (archivado)" : ""),
  }));
export type Workspace = Awaited<ReturnType<typeof propertyWorkspace>>;
