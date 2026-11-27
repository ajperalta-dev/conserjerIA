import { parseFields, tables, type PropertyRow } from "./fields";
export type ImportTable = "units" | "residents";
export const importFields = (table: ImportTable) =>
  tables[table].fields.filter((field) => !field.relation);
export function duplicateKeys(table: ImportTable, row: PropertyRow) {
  const fields =
    table === "units" ? ["registry_code"] : ["dni", "cuit", "email"];
  return fields.flatMap((key) =>
    row[key] ? [key + ":" + String(row[key]).trim().toLowerCase()] : [],
  );
}
export function validateImport(
  table: ImportTable,
  rows: Record<string, unknown>[],
  existing: PropertyRow[],
) {
  const fields = importFields(table);
  const used = new Set(existing.flatMap((row) => duplicateKeys(table, row)));
  return rows.map((row, index) => {
    try {
      const data = parseFields(
        table,
        row,
        fields.map((field) => field.key),
      );
      const keys = duplicateKeys(table, data);
      const duplicate = keys.find((key) => used.has(key));
      keys.forEach((key) => used.add(key));
      if (duplicate)
        return {
          index,
          data,
          error:
            "Duplicado por " +
            fields.find((field) => field.key === duplicate.split(":")[0])
              ?.label,
        };
      return { index, data };
    } catch (error) {
      return { index, error: (error as Error).message };
    }
  });
}
