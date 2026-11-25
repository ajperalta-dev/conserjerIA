import { test, expect } from "@playwright/test";
test("landing, búsqueda, módulo pendiente y tema persistente", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Recorrer la plataforma" }).click();
  await expect(
    page.getByRole("heading", { name: "Inicio", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    /light|dark/,
  );
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", { name: "Nombre del módulo" })
    .fill("documentacion");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Documentación" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Módulo pendiente" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme!);
});
test("navegación móvil y acceso privado cerrado", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/acceso$/);
  await page.getByRole("link", { name: "Recorrer la vista previa" }).click();
  await page.getByRole("button", { name: "Módulos", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Asambleas" })
    .click();
  await expect(page.getByRole("heading", { name: "Asambleas" })).toBeVisible();
});
