import { existsSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import * as XLSX from "xlsx";

const demoEnv = ".env.pellegrini-demo.local";
if (existsSync(demoEnv)) process.loadEnvFile(demoEnv);
async function enter(page: Page, role: "ADMIN" | "OWNER" | "TENANT") {
  const email = process.env["PELLEGRINI_" + role + "_EMAIL"];
  const password = process.env["PELLEGRINI_" + role + "_PASSWORD"];
  test.skip(!email || !password, "Requiere credenciales ficticias locales.");
  await page.goto("/acceso");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/seleccionar$/);
  await page.getByRole("button", { name: "Ingresar al consorcio" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page
    .getByRole("navigation", { name: "Módulos" })
    .getByRole("link", { name: "Unidades", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Unidades", exact: true }),
  ).toBeVisible();
}
test("administrador consulta seis grupos y valida duplicados en CSV y Excel", async ({
  page,
}) => {
  await enter(page, "ADMIN");
  await expect(
    page.getByRole("row", { name: /Dúplex 1.*(?:5, 7|7, 5).*20,23/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: /Dúplex 2.*(?:6, 8|8, 6).*20,38/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Importar unidades" }).click();
  const data = [
    ["registro", "nombre", "tipo"],
    ["1", "Duplicada", "DEPARTAMENTO"],
    ["E2E-001", "Válida", "BAULERA"],
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(data));
  for (const file of [
    {
      name: "unidades.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(data.map((row) => row.join(";")).join("\n")),
    },
    {
      name: "unidades.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: XLSX.write(book, { bookType: "xlsx", type: "buffer" }) as Buffer,
    },
  ]) {
    await page.getByLabel("Archivo CSV o Excel").setInputFiles(file);
    await expect(
      page.getByRole("heading", { name: "Mapeo de columnas" }),
    ).toBeVisible();
    await page.getByLabel("Identificador registral").selectOption("0");
    await page.getByLabel("Denominación").selectOption("1");
    await page.getByLabel("Tipo", { exact: true }).selectOption("2");
    await expect(
      page.getByText("Duplicado por Identificador registral"),
    ).toBeVisible();
    await expect(page.getByText("1 válidas de 2 filas")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirmar importación" }),
    ).toBeDisabled();
  }
});
for (const role of ["OWNER", "TENANT"] as const) {
  test(
    role + " accede solo a su unidad y ficha de residente",
    async ({ page }) => {
      await enter(page, role);
      const own =
        role === "OWNER" ? "Planta baja 0-1 con cochera 06" : "Planta baja 0-2";
      const other =
        role === "OWNER" ? "Planta baja 0-2" : "Planta baja 0-1 con cochera 06";
      await expect(page.getByRole("link", { name: own })).toBeVisible();
      await expect(page.getByRole("link", { name: other })).toHaveCount(0);
      await page.getByRole("link", { name: own }).click();
      await expect(page.getByRole("heading", { name: own })).toBeVisible();
      await expect(page.getByText("Editar unidad")).toHaveCount(0);
      await page
        .getByRole("navigation", { name: "Módulos" })
        .getByRole("link", { name: "Residentes", exact: true })
        .click();
      await expect(
        page.getByRole("link", {
          name:
            role === "OWNER" ? "Titular ficticio 1" : "Inquilino ficticio 1",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Titular ficticio 3" }),
      ).toHaveCount(0);
    },
  );
}
