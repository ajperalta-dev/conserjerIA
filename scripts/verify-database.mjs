import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
await db.exec(`
 create role authenticated; create role anon;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
 grant usage on schema auth to authenticated;
 grant execute on all functions in schema auth to authenticated;
 create table storage.objects(id uuid primary key,bucket_id text,name text);
 alter table storage.objects enable row level security;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
`);
for (const file of fs
  .readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort())
  await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
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

await db.exec("reset role");
await db.exec(fs.readFileSync("supabase/seeds/pellegrini.sql", "utf8"));
const demo = "9bca0802-8020-4000-8000-000000000002";
const demoOrg = "9bca0802-8020-4000-8000-000000000001";
const fixture = (
  await db.query(
    "select count(*)::int units,count(distinct billing_group_id)::int groups,sum(ownership)::float domain,sum(expenses)::float expenses from units join unit_coefficients on units.id=unit_coefficients.unit_id where units.consortium_id=$1",
    [demo],
  )
).rows[0];
assert(
  fixture.units === 8 &&
    fixture.groups === 6 &&
    fixture.domain === 100 &&
    fixture.expenses === 100,
  "Pellegrini: ocho unidades, seis grupos y dos totales de 100%",
);
const linked = (
  await db.query(
    "select array_agg(u.registry_code order by u.registry_code) codes from units u where u.consortium_id=$1 group by u.billing_group_id having count(*)=2",
    [demo],
  )
).rows
  .map((row) => row.codes.join(","))
  .sort();
assert(
  linked.join(";") === "5,7;6,8",
  "Las cocheras están en los grupos de los dúplex correctos",
);
await db.query(
  "insert into organization_members(organization_id,user_id,role) values($1,$2,'ADMIN'),($1,$3,'OWNER'),($1,$4,'TENANT')",
  [demoOrg, uid(1), uid(2), uid(3)],
);
await db.query(
  "insert into consortium_members(organization_id,consortium_id,user_id,role) values($1,$2,$3,'ADMIN'),($1,$2,$4,'OWNER'),($1,$2,$5,'TENANT')",
  [demoOrg, demo, uid(1), uid(2), uid(3)],
);
await db.query(
  "update residents set user_id=$1 where email='titular1@pellegrini.demo.invalid'",
  [uid(2)],
);
await db.query(
  "update residents set user_id=$1 where email='inquilino1@pellegrini.demo.invalid'",
  [uid(3)],
);
const a = (
  await db.query(
    "select id from units where consortium_id=$1 and registry_code='1'",
    [demo],
  )
).rows[0].id;
await asUser(2);
assert(
  (await db.query("select registry_code from units")).rows
    .map((row) => row.registry_code)
    .join() === "1",
  "Propietario solo ve su unidad vigente",
);
assert(
  (await db.query("select * from residents")).rows.length === 1,
  "Propietario solo ve su ficha personal",
);
await asUser(3);
assert(
  (await db.query("select registry_code from units")).rows
    .map((row) => row.registry_code)
    .join() === "2",
  "Inquilino solo ve su unidad ocupada",
);
assert(
  (await db.query("select * from unit_ownerships")).rows.length === 0,
  "Inquilino no ve la titularidad ajena",
);
await asUser(4, "aal2");
assert(
  (await db.query("select * from units")).rows.length === 0,
  "Admin externo no ve las unidades",
);
await denied(
  "insert into residents(consortium_id,name) values('" + demo + "','Intruso')",
);
await asUser(1);
await denied(
  "insert into residents(consortium_id,name) values('" + demo + "','Sin MFA')",
);
await asUser(1, "aal2");
await denied(
  "update unit_coefficients set expenses=99 where unit_id='" + a + "'",
);
await denied(
  "update residents set user_id='" +
    uid(1) +
    "' where consortium_id='" +
    demo +
    "'",
);
await denied(
  "insert into units(consortium_id,floor_id,registry_code,name,kind) select '" +
    uid(21) +
    "',floor_id,'X','Cruzada','COCHERA' from units where id='" +
    a +
    "'",
);
await denied(
  "insert into unit_ownerships(consortium_id,unit_id,resident_id,starts_on,share) select '" +
    demo +
    "','" +
    a +
    "',id,'2026-04-01',1 from residents where email='titular2@pellegrini.demo.invalid'",
);
const history = (
  await db.query(
    "select count(*)::int total from property_history where consortium_id=$1",
    [demo],
  )
).rows[0].total;
assert(
  history > 8,
  "Historial de modificaciones disponible para el administrador",
);

await db.exec("reset role");
const unlinked = (
  await db.query(
    "insert into residents(consortium_id,name,email) values($1,'Ficha sin vincular','other@demo.invalid') returning id",
    [demo],
  )
).rows[0].id;
await db.query(
  "insert into organization_members(organization_id,user_id,role) values($1,$2,'OWNER')",
  [demoOrg, uid(4)],
);
await db.query(
  "insert into consortium_members(organization_id,consortium_id,user_id,role) values($1,$2,$3,'OWNER')",
  [demoOrg, demo, uid(4)],
);
const portalInvite = (
  await db.query(
    "insert into invitations(organization_id,consortium_id,email,role,created_by,resident_id) values($1,$2,'other@demo.invalid','TENANT',$3,$4) returning id",
    [demoOrg, demo, uid(1), unlinked],
  )
).rows[0].id;
await asUser(4);
await db.query("select accept_invitation($1)", [portalInvite]);
assert(
  (await db.query("select id from residents where user_id=$1", [uid(4)]))
    .rows[0].id === unlinked,
  "Se vincula una ficha a un miembro existente",
);
assert(
  (
    await db.query(
      "select role from consortium_members where consortium_id=$1",
      [demo],
    )
  ).rows[0].role === "OWNER",
  "La vinculación conserva el rol preexistente",
);
console.log(checks + " PostgreSQL security checks passed.");
await db.close();
