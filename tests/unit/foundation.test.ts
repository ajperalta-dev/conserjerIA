import { describe, it, expect } from "vitest";
import {
  modules,
  modulePath,
  searchModules,
} from "../../src/modules/navigation/catalog";
import { listConsorcios } from "../../src/modules/consorcios/domain";
import { formatMoney } from "../../src/lib/region";
describe("Base de la plataforma", () => {
  it("publica 17 rutas únicas", () =>
    expect(new Set(modules.map(([id]) => modulePath(id))).size).toBe(17));
  it("encuentra módulos sin tildes", () =>
    expect(searchModules(" DOCUMENTACION ")[0][0]).toBe("documentacion"));
  it("formatea pesos con decimales argentinos", () =>
    expect(formatMoney(1234.5)).toContain("1.234,50"));
  it("rechaza un contexto incompleto", async () => {
    await expect(
      listConsorcios({ userId: "", tenantId: "a" }, { list: async () => [] }),
    ).rejects.toThrow("membresía");
  });
  it("rechaza resultados de otro tenant", async () => {
    await expect(
      listConsorcios(
        { userId: "u", tenantId: "a" },
        { list: async () => [{ id: "1", nombre: "", tenantId: "b" }] },
      ),
    ).rejects.toThrow("tenant");
  });
});
