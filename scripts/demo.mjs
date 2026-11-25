// Local-only fictitious accounts. Never run against a hosted URL.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw Error("Solo entorno local");
const key = process.env.SUPABASE_SECRET_KEY;
if (!key)
  throw Error("Usar la clave real del entorno local desde supabase status");
const db = createClient(url, key);
const ids = [];
for (const role of [
  "ADMIN",
  "ACCOUNTANT",
  "BOARD_MEMBER",
  "OWNER",
  "TENANT",
  "MAINTENANCE",
]) {
  const password = randomBytes(20).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({
    email: role.toLowerCase() + "@demo.invalid",
    password,
    email_confirm: true,
  });
  if (error) throw error;
  ids.push({ id: data.user.id, role });
  console.log(role + " " + data.user.email + " " + password);
}
// Assign scopes explicitly via SQL using the created UUIDs. No financial seed data.

async function insert(table, rows) {
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw error;
  return data;
}
const organizations = await insert("organizations", [
  { name: "DEMO Administración A" },
  { name: "DEMO Administración B" },
]);
const consortiums = await insert(
  "consortiums",
  organizations.map((o) => ({
    name: "DEMO Consorcio " + o.name.at(-1),
    organization_id: o.id,
  })),
);
for (const person of ids) {
  for (let i = 0; i < (person.role === "ADMIN" ? 2 : 1); i++) {
    await insert("organization_members", [
      {
        organization_id: organizations[i].id,
        user_id: person.id,
        role: person.role,
      },
    ]);
    await insert("consortium_members", [
      {
        organization_id: organizations[i].id,
        consortium_id: consortiums[i].id,
        user_id: person.id,
        role: person.role,
      },
    ]);
  }
}
console.log(
  "Entorno ficticio listo. Las cuentas no contienen datos financieros.",
);
