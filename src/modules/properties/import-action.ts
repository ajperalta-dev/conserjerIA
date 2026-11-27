"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireScope } from "@/modules/identity/context";
import { serverClient } from "@/integrations/supabase/server";
import { validateImport } from "./import-data";
import type { ActionResult } from "./actions";
export async function importProperties(raw: unknown): Promise<ActionResult> {
  const scope = await requireScope();
  if (scope.role !== "ADMIN")
    return { error: "Se requiere permiso de administración." };
  const client = await serverClient();
  const { data } = await client.auth.getClaims();
  if (data?.claims.aal !== "aal2")
    return { error: "Verificá MFA desde tu cuenta." };
  const input = z
    .object({
      table: z.enum(["units", "residents"]),
      floor: z.uuid().optional(),
      rows: z
        .array(
          z.record(
            z.string(),
            z.union([z.string().max(4000), z.number(), z.null()]),
          ),
        )
        .min(1)
        .max(500),
    })
    .safeParse(raw);
  if (!input.success)
    return { error: "La importación admite entre 1 y 500 filas válidas." };
  const { table, floor, rows } = input.data;
  if (table === "units") {
    if (!floor) return { error: "Seleccioná el piso de las unidades." };
    const { data } = await client
      .from("floors")
      .select("id")
      .eq("consortium_id", scope.consortium_id)
      .eq("id", floor)
      .is("archived_at", null)
      .maybeSingle();
    if (!data)
      return {
        error: "El piso no pertenece a este consorcio o está archivado.",
      };
  }
  const checked = validateImport(table, rows, []);
  const invalid = checked.find((row) => row.error);
  if (invalid)
    return { error: "Fila " + (invalid.index + 2) + ". " + invalid.error };
  const payload = checked.map((row) => ({
    ...row.data,
    consortium_id: scope.consortium_id,
    ...(table === "units" ? { floor_id: floor } : {}),
  }));
  const { error } = await client.from(table).insert(payload as never);
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Un identificador ya existe. No se importó ninguna fila."
          : "No se pudo importar el lote. No se guardó ninguna fila.",
    };
  revalidatePath("/dashboard/propiedades");
  return { message: "Se importaron " + payload.length + " registros." };
}
