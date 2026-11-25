import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
await db.exec(`
 create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 grant usage on schema auth to authenticated;
 grant execute on all functions in schema auth to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
`);
const migration = fs
  .readdirSync("supabase/migrations")
  .find((f) => f.endsWith("identity_security.sql"));
await db.exec(fs.readFileSync("supabase/migrations/" + migration, "utf8"));
const uid = (n) => "00000000-0000-0000-0000-" + String(n).padStart(12, "0");
for (let i = 1; i <= 4; i++)
  await db.query("insert into auth.users values($1,$2,now())", [
    uid(i),
    ["admin", "owner", "tenant", "other"][i - 1] + "@demo.invalid",
  ]);
for (let i = 1; i <= 2; i++) {
  await db.query("insert into public.organizations(id,name) values($1,$2)", [
    uid(10 + i),
    "Demo " + i,
  ]);
  await db.query(
    "insert into public.consortiums(id,organization_id,name) values($1,$2,$3)",
    [uid(20 + i), uid(10 + i), "Consorcio demo " + i],
  );
}
for (let i = 1; i <= 4; i++) {
  const org = i === 4 ? 12 : 11,
    con = i === 4 ? 22 : 21,
    role = ["ADMIN", "OWNER", "TENANT", "ADMIN"][i - 1];
  await db.query(
    "insert into public.organization_members(organization_id,user_id,role) values($1,$2,$3)",
    [uid(org), uid(i), role],
  );
  await db.query(
    "insert into public.consortium_members(organization_id,consortium_id,user_id,role) values($1,$2,$3,$4)",
    [uid(org), uid(con), uid(i), role],
  );
}
async function asUser(n, aal = "aal1") {
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [
      uid(n),
      JSON.stringify({
        sub: uid(n),
        email: ["admin", "owner", "tenant", "other"][n - 1] + "@demo.invalid",
        aal,
      }),
    ],
  );
  await db.exec("set role authenticated");
}
let checks = 0;
function assert(ok, label) {
  if (!ok) throw Error(label);
  checks++;
  console.log("PASS " + label);
}
await asUser(1);
assert(
  (await db.query("select * from organizations")).rows.length === 1,
  "Organización autorizada visible",
);
assert(
  (await db.query("select * from consortiums")).rows.length === 1,
  "Administrador aislado de otro consorcio",
);
await asUser(2);
assert(
  (await db.query("select * from consortiums")).rows.length === 1,
  "Propietario consulta consorcio autorizado",
);
assert(
  (await db.query("select * from organization_members")).rows.length === 1,
  "Propietario solo consulta su membresía",
);
await asUser(3);
assert(
  (await db.query("select * from profiles")).rows.length === 0,
  "Inquilino no consulta perfiles ajenos",
);
assert(
  (
    await db.query("select has_permission($1,'finance.read') as allowed", [
      uid(21),
    ])
  ).rows[0].allowed === false,
  "Inquilino sin permiso financiero",
);
async function denied(sql) {
  let failed = false;
  try {
    await db.exec(sql);
  } catch {
    failed = true;
  }
  assert(failed, "Solicitud manipulada rechazada");
}
await denied("update consortium_members set role='ADMIN'");
await denied(
  "insert into role_permissions(role,permission) values('TENANT','finance.read')",
);
await denied(
  "insert into invitations(organization_id,consortium_id,email,role) values('" +
    uid(11) +
    "','" +
    uid(21) +
    "','x@demo.invalid','OWNER')",
);
await asUser(1);
assert(
  (await db.query("update consortiums set name='Alterado' returning id")).rows
    .length === 0,
  "MFA requerido para modificar",
);
await asUser(1, "aal2");
assert(
  (
    await db.query(
      "update consortiums set name='Actualizado' where id=$1 returning id",
      [uid(22)],
    )
  ).rows.length === 0,
  "Ni MFA permite modificar otro consorcio",
);
assert(
  (
    await db.query(
      "update consortiums set name='Actualizado' where id=$1 returning id",
      [uid(21)],
    )
  ).rows.length === 1,
  "Administrador con MFA modifica su consorcio",
);
await db.exec("reset role");
assert(
  (await db.query("select name from consortiums where id=$1", [uid(22)]))
    .rows[0].name === "Consorcio demo 2",
  "Operaciones rechazadas conservan datos",
);
assert(
  (await db.query("select * from audit_logs")).rows.length === 1,
  "Auditoría inmutable de modificación autorizada",
);

await db.exec("reset role");
const invitation = (
  await db.query(
    "insert into invitations(organization_id,consortium_id,email,role,created_by) values($1,$2,'owner@demo.invalid','OWNER',$3) returning id",
    [uid(12), uid(22), uid(4)],
  )
).rows[0].id;
await asUser(3);
await denied("select accept_invitation('" + invitation + "')");
await asUser(2);
await db.query("select accept_invitation($1)", [invitation]);
assert(
  (await db.query("select * from consortium_members")).rows.length === 2,
  "Aceptación atómica de invitación con email confirmado",
);
await denied("select accept_invitation('" + invitation + "')");
await db.exec("reset role");
const columns = (
  await db.query(
    "select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position",
  )
).rows;
const names = [...new Set(columns.map((c) => c.table_name))];
const type = (c) =>
  c.data_type === "USER-DEFINED"
    ? '"SUPER_ADMIN"|"ADMIN"|"ACCOUNTANT"|"BOARD_MEMBER"|"OWNER"|"TENANT"|"MAINTENANCE"'
    : c.data_type === "boolean"
      ? "boolean"
      : "string";
let output =
  "// Generated from PostgreSQL information_schema by scripts/verify-database.mjs\nexport type Database = { public: { Tables: {\n";
for (const name of names) {
  const cols = columns.filter((c) => c.table_name === name);
  const row = cols
    .map(
      (c) =>
        JSON.stringify(c.column_name) +
        ": " +
        type(c) +
        (c.is_nullable === "YES" ? " | null" : ""),
    )
    .join(";");
  const insert = cols
    .map(
      (c) =>
        JSON.stringify(c.column_name) +
        (c.column_default || c.is_nullable === "YES" ? "?" : "") +
        ": " +
        type(c) +
        (c.is_nullable === "YES" ? " | null" : ""),
    )
    .join(";");
  output +=
    JSON.stringify(name) +
    ": {Row:{" +
    row +
    "};Insert:{" +
    insert +
    "};Update:Partial<{" +
    insert +
    "}>;Relationships:[]};\n";
}
output +=
  "}; Views:Record<string,never>; Functions:{has_permission:{Args:{target:string;action:string};Returns:boolean};accept_invitation:{Args:{invitation_id:string};Returns:undefined}};Enums:{app_role:" +
  type({ data_type: "USER-DEFINED" }) +
  "};CompositeTypes:Record<string,never> } };\n";
fs.mkdirSync("src/types", { recursive: true });
fs.writeFileSync("src/types/database.ts", output);
console.log(checks + " PostgreSQL security checks passed. Types generated.");
await db.close();
