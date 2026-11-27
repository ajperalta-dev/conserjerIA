import { z } from "zod";

type Field = {
  key: string;
  label: string;
  input?: "date" | "number" | "email" | "textarea";
  choices?: string[];
  relation?: string;
  required?: boolean;
};
const field = (
  key: string,
  label: string,
  extra: Omit<Field, "key" | "label"> = {},
): Field => ({ key, label, ...extra });
const number = (key: string, label: string, required = false) =>
  field(key, label, { input: "number", required });
const relation = (
  key: string,
  label: string,
  source: string,
  required = true,
) => field(key, label, { relation: source, required });
const starts = field("starts_on", "Desde", { input: "date", required: true });
const ends = field("ends_on", "Hasta (fecha excluida)", { input: "date" });
export const unitKinds = [
  "DEPARTAMENTO",
  "DUPLEX",
  "COCHERA",
  "BAULERA",
  "LOCAL",
  "COMPLEMENTARIA",
  "COMUN",
];
export const tables = {
  consortium_details: {
    label: "Datos del consorcio",
    fields: [
      field("cuit", "CUIT"),
      field("address", "Dirección"),
      field("province", "Provincia"),
      field("department", "Departamento"),
      field("locality", "Localidad"),
      field("postal_code", "Código postal"),
      number("latitude", "Latitud"),
      number("longitude", "Longitud"),
      number("construction_year", "Año de construcción"),
      field("cadastral_code", "Nomenclatura catastral"),
      number("closing_month", "Mes de cierre contable"),
      number("closing_day", "Día de cierre contable"),
      field("bylaws", "Referencia del reglamento", { input: "textarea" }),
      field("insurance", "Seguro", { input: "textarea" }),
      field("emergency_contacts", "Contactos de emergencia", {
        input: "textarea",
      }),
    ],
  },
  property_bank_details: {
    label: "Datos bancarios",
    fields: [
      field("bank_name", "Banco"),
      field("cbu", "CBU"),
      field("bank_alias", "Alias"),
      field("account_holder", "Titular"),
    ],
  },
  buildings: {
    label: "Edificios y bloques",
    archive: true,
    fields: [
      field("name", "Nombre", { required: true }),
      field("kind", "Tipo", {
        choices: ["EDIFICIO", "BLOQUE"],
        required: true,
      }),
    ],
  },
  floors: {
    label: "Pisos",
    archive: true,
    fields: [
      field("name", "Nombre", { required: true }),
      number("level", "Nivel", true),
      relation("building_id", "Edificio o bloque", "buildings"),
    ],
  },
  billing_groups: {
    label: "Grupos de cobranza",
    fields: [field("name", "Nombre", { required: true })],
  },
  units: {
    label: "Unidades",
    archive: true,
    fields: [
      field("registry_code", "Identificador registral", { required: true }),
      field("name", "Denominación", { required: true }),
      field("kind", "Tipo", { choices: unitKinds, required: true }),
      relation("floor_id", "Piso", "floors"),
      relation(
        "billing_group_id",
        "Grupo de cobranza",
        "billing_groups",
        false,
      ),
      number("covered", "Superficie cubierta propia"),
      number("semi_covered", "Superficie semicubierta"),
      number("common_area", "Superficie común"),
      number("uncovered", "Superficie descubierta"),
      field("cadastral_code", "Nomenclatura catastral"),
      field("meters", "Medidores", { input: "textarea" }),
    ],
  },
  residents: {
    label: "Propietarios e inquilinos",
    archive: true,
    fields: [
      field("name", "Nombre y apellido", { required: true }),
      field("dni", "DNI"),
      field("cuit", "CUIT"),
      field("email", "Email", { input: "email" }),
      field("phone", "Teléfono"),
      field("emergency_contact", "Contacto de emergencia"),
    ],
  },
  unit_coefficients: {
    label: "Coeficientes",
    fields: [
      field("effective_from", "Vigente desde", {
        input: "date",
        required: true,
      }),
      number("ownership", "Dominio (%)", true),
      number("expenses", "Expensas (%)", true),
    ],
  },
  unit_ownerships: {
    label: "Titularidad",
    fields: [
      relation("resident_id", "Propietario", "residents"),
      starts,
      ends,
      number("share", "Titularidad (%)", true),
    ],
  },
  occupancies: {
    label: "Ocupación",
    fields: [
      relation("resident_id", "Residente", "residents"),
      field("kind", "Vínculo", {
        choices: ["PROPIETARIO", "INQUILINO", "OTRO"],
        required: true,
      }),
      starts,
      ends,
    ],
  },
  lease_contracts: {
    label: "Contratos de alquiler",
    fields: [
      relation("occupancy_id", "Ocupación del inquilino", "occupancies"),
      relation("landlord_id", "Locador", "residents"),
      starts,
      { ...ends, required: true },
      field("reference", "Referencia del contrato"),
    ],
  },
  payment_responsibilities: {
    label: "Responsabilidades de pago",
    fields: [
      relation("resident_id", "Responsable", "residents"),
      field("concept", "Concepto", {
        choices: ["ORDINARIAS", "EXTRAORDINARIAS", "SERVICIOS"],
        required: true,
      }),
      starts,
      ends,
    ],
  },
  unit_relationships: {
    label: "Unidades vinculadas",
    fields: [
      relation("related_unit_id", "Unidad relacionada", "units"),
      field("description", "Descripción"),
    ],
  },
} satisfies Record<
  string,
  { label: string; fields: Field[]; archive?: boolean }
>;
export type PropertyTable = keyof typeof tables;
export type PropertyRow = Record<string, string | number | null | undefined>;
export const unitSections = [
  "unit_coefficients",
  "unit_ownerships",
  "occupancies",
  "lease_contracts",
  "payment_responsibilities",
  "unit_relationships",
] as const;

export const propertyId = z.uuid();
const digits = (value: string) => value.replace(/[.\s-]/g, "");
export function parseFields(
  table: PropertyTable,
  input: Record<string, unknown>,
  restrict?: string[],
) {
  const result: PropertyRow = {};
  for (const spec of tables[table].fields) {
    const { key, label } = spec;
    if (restrict && !restrict.includes(key)) continue;
    let value = String(input[key] ?? "").trim();
    if (!value) {
      if (spec.required) throw new Error(label + " es obligatorio.");
      result[key] = null;
      continue;
    }
    if (value.length > (spec.input === "textarea" ? 4000 : 180))
      throw new Error(label + " excede la longitud permitida.");
    if (key === "dni" || key === "cuit" || key === "cbu") {
      value = digits(value);
      const pattern =
        key === "dni" ? /^\d{7,8}$/ : key === "cuit" ? /^\d{11}$/ : /^\d{22}$/;
      if (!pattern.test(value))
        throw new Error(label + " tiene un formato inválido.");
    }
    if (
      (spec.relation && !propertyId.safeParse(value).success) ||
      (spec.choices && !spec.choices.includes(value))
    )
      throw new Error(label + " no es válido.");
    if (spec.input === "date" && !z.iso.date().safeParse(value).success)
      throw new Error(label + " debe ser una fecha válida.");
    if (spec.input === "email") {
      value = value.toLowerCase();
      if (!z.email().safeParse(value).success)
        throw new Error("Email inválido.");
    }
    if (spec.input === "number") {
      const normalized = value.replace(",", ".");
      const decimal = Number(normalized);
      if (!/^-?\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(decimal))
        throw new Error(label + " debe ser un número.");
      if (
        ["level", "construction_year", "closing_month", "closing_day"].includes(
          key,
        ) &&
        !Number.isInteger(decimal)
      )
        throw new Error(label + " debe ser entero.");
      if (
        ["ownership", "expenses", "share"].includes(key) &&
        (decimal < (key === "share" ? 0.000001 : 0) || decimal > 100)
      )
        throw new Error(label + " está fuera de rango.");
      if (
        ["covered", "semi_covered", "common_area", "uncovered"].includes(key) &&
        decimal < 0
      )
        throw new Error(label + " no puede ser negativo.");
      result[key] = decimal;
      continue;
    }
    result[key] = value;
  }
  if (result.starts_on && result.ends_on && result.starts_on >= result.ends_on)
    throw new Error("La fecha final debe ser posterior a la inicial.");
  if (
    table === "consortium_details" &&
    ((result.latitude === null) !== (result.longitude === null) ||
      (result.closing_month === null) !== (result.closing_day === null))
  )
    throw new Error(
      "Completá ambos campos de coordenadas o ambos campos de cierre.",
    );
  return result;
}
export function currentDate() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Mendoza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function currentPeriod(row: PropertyRow, today: string) {
  return (
    String(row.starts_on) <= today &&
    (!row.ends_on || String(row.ends_on) > today)
  );
}

export const displayChoice = (value: string) =>
  ({
    EDIFICIO: "Edificio",
    BLOQUE: "Bloque",
    DEPARTAMENTO: "Departamento",
    DUPLEX: "Dúplex",
    COCHERA: "Cochera",
    BAULERA: "Baulera",
    LOCAL: "Local comercial",
    COMPLEMENTARIA: "Complementaria",
    COMUN: "Espacio común",
    PROPIETARIO: "Propietario",
    INQUILINO: "Inquilino",
    OTRO: "Otro",
    ORDINARIAS: "Expensas ordinarias",
    EXTRAORDINARIAS: "Expensas extraordinarias",
    SERVICIOS: "Servicios",
  })[value] ?? value;
