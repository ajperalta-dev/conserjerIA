"use server";
import { revalidatePath } from "next/cache";
import { requireScope } from "@/modules/identity/context";
import { serverClient } from "@/integrations/supabase/server";
import { parseFields, propertyId, tables, type PropertyTable } from "./fields";
import { z } from "zod";

const singleton = ["consortium_details", "property_bank_details"];
const historyEdits: Partial<Record<PropertyTable, string[]>> = {
  unit_ownerships: ["ends_on"],
  occupancies: ["ends_on"],
  lease_contracts: ["reference", "ends_on"],
  payment_responsibilities: ["ends_on"],
  unit_relationships: ["description"],
};
const unitTables = [
  "unit_coefficients",
  "unit_ownerships",
  "occupancies",
  "lease_contracts",
  "payment_responsibilities",
  "unit_relationships",
];
const title = z.string().trim().min(1).max(120);
export type ActionResult = { error?: string; message?: string; href?: string };
function fail(error: { code?: string; message: string }): ActionResult {
  const messages: Record<string, string> = {
    "23505":
      "Ya existe un registro con ese identificador, período o dato único.",
    "23503":
      "La referencia no existe en este consorcio o tiene datos relacionados.",
    "23514":
      "Revisá los valores, fechas, porcentajes y relaciones del formulario.",
    "42501":
      "La operación requiere un administrador autorizado con MFA verificado.",
    PGRST116: "El registro no está disponible o tu sesión requiere MFA.",
  };
  return {
    error: messages[error.code ?? ""] ?? "No se pudo guardar el cambio.",
  };
}
export async function saveProperty(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const client = await serverClient();
  const entity = String(form.get("entity"));
  const operation = String(form.get("operation"));
  if (entity === "consortium" && operation === "create") {
    const org = propertyId.safeParse(form.get("organization_id"));
    const label = title.safeParse(form.get("name"));
    if (!org.success || !label.success)
      return { error: "Completá la organización y el nombre." };
    const { error } = await client.rpc("create_property_consortium", {
      org: org.data,
      label: label.data,
    });
    if (error) return fail(error);
    revalidatePath("/seleccionar");
    revalidatePath("/dashboard/propiedades");
    return {
      message:
        "Consorcio creado. Seleccionalo en el listado para cargar sus datos.",
    };
  }
  const scope = await requireScope();
  if (scope.role !== "ADMIN")
    return {
      error: "Solo un administrador de este consorcio puede editar sus datos.",
    };
  if (entity === "consortium") {
    const label = title.safeParse(form.get("name"));
    if (operation === "save" && !label.success)
      return { error: "Ingresá el nombre del consorcio." };
    if (operation !== "save" && operation !== "archive")
      return { error: "Operación inválida." };
    const values =
      operation === "archive"
        ? { archived_at: new Date().toISOString() }
        : { name: label.data, updated_at: new Date().toISOString() };
    const { error } = await client
      .from("consortiums")
      .update(values)
      .eq("id", scope.consortium_id)
      .select("id")
      .single();
    if (error) return fail(error);
    revalidatePath("/dashboard");
    return operation === "archive"
      ? { message: "Consorcio archivado.", href: "/seleccionar" }
      : { message: "Nombre guardado." };
  }
  if (!Object.hasOwn(tables, entity))
    return { error: "Tipo de registro inválido." };
  const table = entity as PropertyTable;
  const id = propertyId.safeParse(form.get("id"));
  if (form.get("id") && !id.success) return { error: "Registro inválido." };
  const bucket = client.from(table);
  const filter = singleton.includes(table) ? "consortium_id" : "id";
  const key = singleton.includes(table) ? scope.consortium_id : id.data;
  if (
    operation === "archive" ||
    operation === "restore" ||
    operation === "unlink"
  ) {
    if (
      !key ||
      (operation === "unlink"
        ? table !== "unit_relationships"
        : !("archive" in tables[table]))
    )
      return { error: "Operación inválida." };
    const query =
      operation === "unlink"
        ? bucket.delete()
        : bucket.update({
            archived_at:
              operation === "restore" ? null : new Date().toISOString(),
          } as never);
    const { error } = await query
      .filter(filter, "eq", key)
      .eq("consortium_id", scope.consortium_id)
      .select(filter)
      .single();
    if (error) return fail(error);
    revalidatePath("/dashboard/propiedades");
    return { message: "Cambio guardado." };
  }
  if (operation !== "save" || (table === "unit_coefficients" && id.success))
    return { error: "Operación inválida." };
  let values;
  try {
    values = parseFields(
      table,
      Object.fromEntries(form),
      id.success ? historyEdits[table] : undefined,
    );
  } catch (error) {
    return { error: (error as Error).message };
  }
  let unitId;
  if (unitTables.includes(table) && !id.success) {
    const unit = propertyId.safeParse(form.get("unit_id"));
    if (!unit.success) return { error: "Seleccioná una unidad." };
    unitId = unit.data;
  }
  const payload = {
    ...values,
    consortium_id: scope.consortium_id,
    ...(unitId ? { unit_id: unitId } : {}),
  };
  const response =
    id.success || (singleton.includes(table) && form.get("existing") === "yes")
      ? await bucket
          .update(values as never)
          .filter(filter, "eq", key!)
          .eq("consortium_id", scope.consortium_id)
          .select(filter)
          .single()
      : await bucket
          .insert(payload as never)
          .select(filter)
          .single();
  if (response.error) return fail(response.error);
  revalidatePath("/dashboard/propiedades");
  return { message: "Registro guardado." };
}
export async function uploadPropertyFile(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const scope = await requireScope();
  if (scope.role !== "ADMIN")
    return { error: "Se requiere permiso de administración." };
  const client = await serverClient();
  const { data } = await client.auth.getClaims();
  if (data?.claims.aal !== "aal2")
    return { error: "Verificá MFA desde tu cuenta." };
  const file = form.get("file");
  const kinds = z
    .enum(["FOTO", "REGLAMENTO", "SEGURO", "UNIDAD"])
    .safeParse(form.get("kind"));
  const unit = propertyId.safeParse(form.get("unit_id"));
  if (
    !kinds.success ||
    (kinds.data === "UNIDAD") !== unit.success ||
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 10 * 1024 * 1024
  )
    return { error: "Elegí un archivo válido de hasta 10 MB." };
  const mime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "application/pdf": "pdf",
  };
  const ext = mime[file.type];
  if (!ext || (kinds.data === "FOTO" && ext === "pdf"))
    return { error: "Usá JPG, PNG o PDF según el tipo de archivo." };
  if (unit.success) {
    const { data } = await client
      .from("units")
      .select("id")
      .eq("id", unit.data)
      .eq("consortium_id", scope.consortium_id)
      .is("archived_at", null)
      .maybeSingle();
    if (!data) return { error: "La unidad no está disponible." };
  }
  const path =
    scope.consortium_id +
    "/property/" +
    (unit.data ?? "consortium") +
    "/" +
    crypto.randomUUID() +
    "." +
    ext;
  const storage = client.storage.from("consortium-private");
  const upload = await storage.upload(path, file);
  if (upload.error)
    return {
      error: "No se pudo cargar el archivo. Verificá el tamaño y el acceso.",
    };
  const { error } = await client.from("property_files").insert({
    consortium_id: scope.consortium_id,
    unit_id: unit.data,
    kind: kinds.data,
    label: file.name.slice(0, 180),
    path,
  });
  if (error) {
    await storage.remove([path]);
    return fail(error);
  }
  revalidatePath("/dashboard/propiedades");
  return { message: "Archivo cargado." };
}
