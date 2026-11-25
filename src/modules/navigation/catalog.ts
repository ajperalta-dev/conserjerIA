export const modules = [
  ["inicio", "Inicio", "General"],
  ["consorcios", "Consorcios", "Administración"],
  ["unidades", "Unidades", "Administración"],
  ["residentes", "Residentes", "Administración"],
  ["expensas", "Expensas", "Economía"],
  ["cobranzas", "Cobranzas", "Economía"],
  ["servicios-y-pagos", "Servicios y pagos", "Economía"],
  ["finanzas", "Finanzas", "Economía"],
  ["proveedores", "Proveedores", "Operaciones"],
  ["documentacion", "Documentación", "Operaciones"],
  ["mantenimiento", "Mantenimiento", "Operaciones"],
  ["asambleas", "Asambleas", "Comunidad"],
  ["reservas", "Reservas", "Comunidad"],
  ["comunicaciones", "Comunicaciones", "Comunidad"],
  ["inteligencia-artificial", "Inteligencia artificial", "Herramientas"],
  ["reportes", "Reportes", "Herramientas"],
  ["configuracion", "Configuración", "Herramientas"],
] as const;
export type ModuleId = (typeof modules)[number][0];
export function modulePath(id: ModuleId, base = "/vista-previa") {
  return id === "inicio" ? base : base + "/" + id;
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function searchModules(query: string) {
  return modules.filter(([, name]) =>
    normalize(name).includes(normalize(query)),
  );
}
