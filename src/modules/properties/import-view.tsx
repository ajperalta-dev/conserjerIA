"use client";
import { useMemo, useState, useTransition } from "react";
import { importProperties } from "./import-action";
import { importFields, validateImport, type ImportTable } from "./import-data";
import { unitKinds, type PropertyRow } from "./fields";

export function ImportView({
  table,
  existing,
  floors,
}: {
  table: ImportTable;
  existing: PropertyRow[];
  floors: { id: string; label: string }[];
}) {
  const fields = importFields(table);
  const [matrix, setMatrix] = useState<string[][]>([]),
    [mapping, setMapping] = useState<Record<string, number>>({});
  const [floor, setFloor] = useState(""),
    [feedback, setFeedback] = useState<{ message?: string; error?: string }>(
      {},
    );
  const [pending, start] = useTransition();
  const [head, ...rows] = matrix;
  const mapped = useMemo(
    () =>
      matrix.slice(1).map((row) =>
        Object.fromEntries(
          Object.entries(mapping)
            .filter(([, column]) => column >= 0)
            .map(([key, column]) => [key, row[column] ?? ""]),
        ),
      ),
    [matrix, mapping],
  );
  const preview = useMemo(
    () => validateImport(table, mapped, existing),
    [table, mapped, existing],
  );
  async function readFile(file: File | undefined) {
    setMatrix([]);
    setFeedback({});
    if (!file) return;
    if (!/\.(csv|xlsx|xls)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setFeedback({ error: "Elegí CSV, XLSX o XLS de hasta 5 MB." });
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const csv = /\.csv$/i.test(file.name);
      const workbook = XLSX.read(
        csv ? await file.text() : await file.arrayBuffer(),
        {
          type: csv ? "string" : "array",
          sheetRows: 502,
          raw: true,
          sheets: 0,
        },
      );
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
        defval: "",
      });
      const grid = values.map((row) =>
        row.map((cell) => String(cell ?? "").trim()),
      );
      if (
        grid.length < 2 ||
        grid.length > 501 ||
        grid.some((row) => row.length > 100)
      )
        throw new Error(
          "Se admite una primera hoja con encabezados, hasta 100 columnas y entre 1 y 500 filas.",
        );
      const normalize = (value: string) =>
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
      setMapping(
        Object.fromEntries(
          fields.map((spec) => [
            spec.key,
            grid[0].findIndex((cell) =>
              [normalize(spec.key), normalize(spec.label)].includes(
                normalize(cell),
              ),
            ),
          ]),
        ),
      );
      setMatrix(grid);
    } catch (error) {
      setFeedback({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el archivo.",
      });
    }
  }
  return (
    <section className="property-section property-form">
      <label>
        Archivo CSV o Excel
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          disabled={pending}
          onChange={(e) => void readFile(e.target.files?.[0])}
        />
      </label>
      <p className="muted">
        La primera hoja debe tener encabezados. Podés importar hasta 500
        registros por lote.
      </p>
      {table === "units" && (
        <>
          <label>
            Piso de destino
            <select value={floor} onChange={(e) => setFloor(e.target.value)}>
              <option value="">Seleccionar</option>
              {floors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">Valores de tipo: {unitKinds.join(", ")}.</p>
        </>
      )}
      {head && (
        <>
          <h2>Mapeo de columnas</h2>
          <div className="property-fields">
            {fields.map((spec) => (
              <label key={spec.key}>
                {spec.label}
                {spec.required ? " *" : ""}
                <select
                  aria-label={spec.label}
                  value={mapping[spec.key] ?? -1}
                  onChange={(e) =>
                    setMapping({
                      ...mapping,
                      [spec.key]: Number(e.target.value),
                    })
                  }
                >
                  <option value={-1}>Sin asignar</option>
                  {head.map((label, index) => (
                    <option key={index} value={index}>
                      {label || "Columna " + (index + 1)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <h2>Vista previa</h2>
          <p>
            {preview.filter((row) => !row.error).length} válidas de{" "}
            {rows.length} filas
          </p>
          <div className="property-table">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  {fields.map((spec) => (
                    <th key={spec.key}>{spec.label}</th>
                  ))}
                  <th>Validación</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.index}>
                    <td>{row.index + 2}</td>
                    {fields.map((spec) => (
                      <td key={spec.key}>
                        {mapped[row.index]?.[spec.key] || "—"}
                      </td>
                    ))}
                    <td>{row.error ?? "Válida"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="primary"
            disabled={
              pending ||
              !preview.length ||
              preview.some((row) => row.error) ||
              (table === "units" && !floor) ||
              !!feedback.message
            }
            onClick={() =>
              start(async () => {
                try {
                  setFeedback(
                    await importProperties({
                      table,
                      floor: floor || undefined,
                      rows: mapped,
                    }),
                  );
                } catch {
                  setFeedback({
                    error:
                      "No se pudo procesar el lote. Volvé a cargar la página antes de reintentar.",
                  });
                }
              })
            }
          >
            {pending ? "Importando…" : "Confirmar importación"}
          </button>
        </>
      )}
      {feedback.error && (
        <p role="alert" className="property-error">
          {feedback.error}
        </p>
      )}
      {feedback.message && <p role="status">{feedback.message}</p>}
    </section>
  );
}
