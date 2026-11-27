import { describe, expect, it } from "vitest";
import { validateImport } from "../../src/modules/properties/import-data";
describe("Importación de propiedades", () => {
  it("marca duplicados existentes y del mismo lote tras normalizar", () => {
    const rows = validateImport(
      "residents",
      [
        { name: "Ejemplo A", dni: "12.345.678", email: "A@Example.org" },
        { name: "Ejemplo B", dni: "12345678" },
        { name: "Ejemplo C", email: "C@EXAMPLE.ORG" },
      ],
      [{ email: "c@example.org" }],
    );
    expect(rows[0]).toMatchObject({
      data: { dni: "12345678", email: "a@example.org" },
    });
    expect(rows[1].error).toBe("Duplicado por DNI");
    expect(rows[2].error).toBe("Duplicado por Email");
  });
  it("acepta área con coma decimal y rechaza filas sin identificador o con superficie negativa", () => {
    const base = { name: "Depósito", kind: "BAULERA", covered: "10,25" };
    const rows = validateImport(
      "units",
      [
        { ...base, registry_code: "A" },
        { ...base },
        { ...base, registry_code: "B", covered: "-1" },
      ],
      [],
    );
    expect(rows[0]).toMatchObject({ data: { covered: 10.25 } });
    expect(rows[1].error).toContain("Identificador");
    expect(rows[2].error).toContain("negativo");
  });
});
