import Link from "next/link";
import { notFound } from "next/navigation";
import {
  propertyWorkspace,
  rowLabel,
  rowOptions,
  type Workspace,
} from "./repository";
import { Disclosure, OperationForm, RecordForm } from "./forms";
import { uploadPropertyFile } from "./actions";
import {
  displayChoice,
  currentDate,
  currentPeriod,
  propertyId,
  tables,
  unitKinds,
  unitSections,
  type PropertyRow,
  type PropertyTable,
} from "./fields";
import { InviteForm } from "@/components/invite-form";

export const propertyRoot = "/dashboard/propiedades";
const unitsHref = propertyRoot + "/unidades";
const residentsHref = propertyRoot + "/residentes";
const emptyOptions = {};
const active = (rows: PropertyRow[]) => rows.filter((row) => !row.archived_at);
const percent = (value: unknown) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("es-AR", { maximumFractionDigits: 6 }).format(
        Number(value),
      ) + " %";

function Records({
  rows,
  columns,
}: {
  rows: PropertyRow[];
  columns: [string, string][];
}) {
  if (!rows.length) return <p className="muted">Todavía no hay registros.</p>;
  return (
    <div className="property-table">
      <table>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map(([key]) => (
                <td key={key}>
                  {row[key] === null || row[key] === undefined
                    ? "—"
                    : displayChoice(String(row[key]))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Manage({
  table,
  rows,
  options,
  editable,
}: {
  table: PropertyTable;
  rows: PropertyRow[];
  options: Record<string, { id: string; label: string }[]>;
  editable: boolean;
}) {
  return (
    <section className="property-section">
      <h2>{tables[table].label}</h2>
      {editable && (
        <Disclosure title="Agregar">
          <RecordForm table={table} options={options} />
        </Disclosure>
      )}
      {!rows.length && <p className="muted">Todavía no hay registros.</p>}
      {rows.map((row) => (
        <Disclosure
          key={row.id}
          title={rowLabel(row) + (row.archived_at ? " · Archivado" : "")}
        >
          {editable ? (
            <>
              <RecordForm table={table} entry={row} options={options} />
              {"archive" in tables[table] && (
                <OperationForm
                  hidden={{
                    entity: table,
                    id: String(row.id),
                    operation: row.archived_at ? "restore" : "archive",
                  }}
                  submit={row.archived_at ? "Restaurar" : "Archivar"}
                  outline
                />
              )}
            </>
          ) : (
            <p>{row.kind ? displayChoice(String(row.kind)) : row.level}</p>
          )}
        </Disclosure>
      ))}
    </section>
  );
}
async function Files({ ws, unitId }: { ws: Workspace; unitId?: string }) {
  const { client, scope, isAdmin } = ws;
  let query = client
    .from("property_files")
    .select("id,label,path,kind")
    .eq("consortium_id", scope.consortium_id);
  query = unitId ? query.eq("unit_id", unitId) : query.is("unit_id", null);
  const { data, error } = await query;
  if (error) throw new Error("No se pudieron consultar los archivos.");
  const files = await Promise.all(
    data.map(async (file) => ({
      ...file,
      url: (
        await client.storage
          .from("consortium-private")
          .createSignedUrl(file.path, 120)
      ).data?.signedUrl,
    })),
  );
  return (
    <section className="property-section">
      <h2>{unitId ? "Documentación" : "Fotografías, reglamento y seguro"}</h2>
      {files.length ? (
        <ul className="property-files">
          {files.map((file) => (
            <li key={file.id}>
              {file.url ? (
                <a href={file.url} target="_blank" rel="noreferrer">
                  {file.kind} · {file.label}
                </a>
              ) : (
                <span>{file.label} · Archivo no disponible</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Todavía no hay archivos.</p>
      )}
      {isAdmin && (
        <Disclosure title="Cargar archivo">
          <OperationForm
            action={uploadPropertyFile}
            hidden={unitId ? { unit_id: unitId, kind: "UNIDAD" } : undefined}
            submit="Cargar"
          >
            {!unitId && (
              <label>
                Tipo
                <select name="kind">
                  <option value="FOTO">Fotografía</option>
                  <option value="REGLAMENTO">Reglamento</option>
                  <option value="SEGURO">Seguro</option>
                </select>
              </label>
            )}
            <label>
              Archivo
              <input
                name="file"
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                required
              />
            </label>
          </OperationForm>
        </Disclosure>
      )}
    </section>
  );
}
async function History({
  ws,
  ids,
  tables: entities,
}: {
  ws: Workspace;
  ids: string[];
  tables?: string[];
}) {
  if (!ws.isAdmin) return null;
  let query = ws.client
    .from("property_history")
    .select("id,entity,operation,fields,created_at,actor_id")
    .eq("consortium_id", ws.scope.consortium_id)
    .in("entity_id", ids);
  if (entities) query = query.in("entity", entities);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudo consultar el historial.");
  return (
    <section className="property-section">
      <h2>Historial de cambios</h2>
      <Records
        rows={data.map((row) => ({
          ...row,
          actor_id: row.actor_id ?? "Sistema",
          fields: row.fields.join(", "),
          created_at: new Date(row.created_at).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Mendoza",
          }),
        }))}
        columns={[
          ["created_at", "Fecha"],
          ["entity", "Registro"],
          ["operation", "Acción"],
          ["fields", "Campos"],
          ["actor_id", "Usuario"],
        ]}
      />
    </section>
  );
}
export async function Consortiums() {
  const ws = await propertyWorkspace();
  const { client, scope, isAdmin, read } = ws;
  const [
    consortia,
    orgs,
    memberships,
    details,
    banks,
    buildings,
    floors,
    units,
    groups,
    admins,
  ] = await Promise.all([
    client
      .from("consortiums")
      .select("id,name,organization_id")
      .is("archived_at", null)
      .order("name"),
    client.from("organizations").select("id,name").is("archived_at", null),
    client
      .from("organization_members")
      .select("organization_id")
      .eq("role", "ADMIN")
      .eq("user_id", scope.userId),
    read("consortium_details"),
    read("property_bank_details"),
    read("buildings"),
    read("floors"),
    read("units"),
    read("billing_groups"),
    client.rpc("property_admins", { target: scope.consortium_id }),
  ]);
  if ([consortia, orgs, memberships, admins].some((result) => result.error))
    throw new Error("No se pudo cargar el consorcio.");
  const organizations =
    orgs.data?.filter((org) =>
      memberships.data?.some((member) => member.organization_id === org.id),
    ) ?? [];
  const current = consortia.data?.find((row) => row.id === scope.consortium_id);
  return (
    <>
      <h1>Consorcios</h1>
      <div className="property-cards">
        {consortia.data?.map((row) => (
          <article key={row.id} className="property-section">
            <h2>{row.name}</h2>
            <p>
              {orgs.data?.find((org) => org.id === row.organization_id)?.name}
            </p>
            {row.id === scope.consortium_id ? (
              <p className="muted">Consorcio seleccionado</p>
            ) : (
              <Link className="outline" href="/seleccionar">
                Cambiar consorcio
              </Link>
            )}
          </article>
        ))}
      </div>
      {!!organizations.length && (
        <Disclosure title="Crear consorcio">
          <OperationForm
            hidden={{ entity: "consortium", operation: "create" }}
            submit="Crear"
          >
            <label>
              Organización
              <select name="organization_id" required>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre
              <input name="name" maxLength={120} required />
            </label>
          </OperationForm>
        </Disclosure>
      )}
      <section className="property-section">
        <h2>{current?.name}</h2>
        <p>
          {active(buildings).length} edificios o bloques ·{" "}
          {active(floors).length} pisos · {active(units).length} unidades
          visibles
        </p>
        <p>
          Administradores asignados:{" "}
          {admins.data?.map((row) => row.display_name).join(", ") ||
            "Sin asignaciones"}
        </p>
        {isAdmin && (
          <Disclosure title="Editar nombre o archivar">
            <OperationForm hidden={{ entity: "consortium", operation: "save" }}>
              <label>
                Nombre
                <input name="name" defaultValue={current?.name} required />
              </label>
            </OperationForm>
            <OperationForm
              hidden={{ entity: "consortium", operation: "archive" }}
              submit="Archivar consorcio"
              outline
            >
              <label className="property-confirm">
                <input type="checkbox" required /> Confirmo el archivo del
                consorcio y la salida del espacio de trabajo.
              </label>
            </OperationForm>
          </Disclosure>
        )}
      </section>
      <section className="property-section">
        <h2>Datos del consorcio</h2>
        {isAdmin ? (
          <RecordForm
            table="consortium_details"
            entry={details[0]}
            options={emptyOptions}
          />
        ) : (
          <dl className="property-data">
            {tables.consortium_details.fields.map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>{details[0]?.[f.key] ?? "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      {isAdmin && (
        <section className="property-section">
          <h2>Datos bancarios</h2>
          <RecordForm
            table="property_bank_details"
            entry={banks[0]}
            options={emptyOptions}
          />
        </section>
      )}
      <Manage
        table="buildings"
        rows={buildings}
        options={emptyOptions}
        editable={isAdmin}
      />
      <Manage
        table="floors"
        rows={floors}
        options={{ buildings: rowOptions(buildings) }}
        editable={isAdmin}
      />
      {(isAdmin || groups.length > 0) && (
        <Manage
          table="billing_groups"
          rows={groups}
          options={emptyOptions}
          editable={isAdmin}
        />
      )}
      <Files ws={ws} />
      <History
        ws={ws}
        ids={[
          scope.consortium_id,
          ...buildings.map((row) => String(row.id)),
          ...floors.map((row) => String(row.id)),
          ...groups.map((row) => String(row.id)),
        ]}
      />
    </>
  );
}
export async function Units({
  filters,
}: {
  filters: Record<string, string | string[] | undefined>;
}) {
  const ws = await propertyWorkspace();
  const [
    buildings,
    floors,
    units,
    owners,
    occupancies,
    people,
    coefficients,
    groups,
  ] = await Promise.all(
    [
      "buildings",
      "floors",
      "units",
      "unit_ownerships",
      "occupancies",
      "residents",
      "unit_coefficients",
      "billing_groups",
    ].map((name) => ws.read(name as Parameters<Workspace["read"]>[0])),
  );
  const today = currentDate();
  const currentCoefficients = coefficients
    .filter((row) => String(row.effective_from) <= today)
    .sort((a, b) =>
      String(b.effective_from).localeCompare(String(a.effective_from)),
    );
  const occupied = new Set(
    occupancies
      .filter((row) => currentPeriod(row, today))
      .map((row) => row.unit_id),
  );
  const filtered = units.filter((unit) => {
    const floor = floors.find((row) => row.id === unit.floor_id);
    const ownerMatch =
      !filters.owner ||
      owners.some(
        (row) =>
          row.unit_id === unit.id &&
          row.resident_id === filters.owner &&
          currentPeriod(row, today),
      );
    return (
      (filters.archived === "yes" || !unit.archived_at) &&
      (!filters.building || floor?.building_id === filters.building) &&
      (!filters.kind || unit.kind === filters.kind) &&
      ownerMatch &&
      (!filters.occupancy ||
        occupied.has(unit.id) === (filters.occupancy === "occupied"))
    );
  });
  const total = (subset: PropertyRow[], key: "ownership" | "expenses") =>
    subset.reduce(
      (sum, row) =>
        sum +
        Math.round(
          Number(
            currentCoefficients.find((c) => c.unit_id === row.id)?.[key] ?? 0,
          ) * 1e6,
        ),
      0,
    ) / 1e6;
  return (
    <>
      <h1>Unidades</h1>
      {ws.isAdmin && (
        <div className="property-actions">
          <Link
            className="outline"
            href={propertyRoot + "/importar?tipo=units"}
          >
            Importar unidades
          </Link>
          <Disclosure title="Nueva unidad">
            <RecordForm
              table="units"
              options={{
                floors: rowOptions(active(floors)),
                billing_groups: rowOptions(groups),
              }}
            />
          </Disclosure>
        </div>
      )}
      <form className="property-fields property-section" action={unitsHref}>
        <label>
          Edificio o bloque
          <select name="building" defaultValue={String(filters.building ?? "")}>
            <option value="">Todos</option>
            {buildings.map((row) => (
              <option key={row.id} value={row.id ?? ""}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select name="kind" defaultValue={String(filters.kind ?? "")}>
            <option value="">Todos</option>
            {unitKinds.map((kind) => (
              <option key={kind} value={kind}>
                {displayChoice(kind)}
              </option>
            ))}
          </select>
        </label>
        {ws.isAdmin && (
          <label>
            Ocupación
            <select
              name="occupancy"
              defaultValue={String(filters.occupancy ?? "")}
            >
              <option value="">Todas</option>
              <option value="occupied">Ocupada</option>
              <option value="empty">Sin ocupación activa</option>
            </select>
          </label>
        )}
        {ws.isAdmin && (
          <label>
            Propietario
            <select name="owner" defaultValue={String(filters.owner ?? "")}>
              <option value="">Todos</option>
              {people.map((row) => (
                <option key={row.id} value={row.id ?? ""}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {ws.isAdmin && (
          <label className="property-confirm">
            <input
              type="checkbox"
              name="archived"
              value="yes"
              defaultChecked={filters.archived === "yes"}
            />{" "}
            Incluir archivadas
          </label>
        )}
        <button className="outline">Aplicar filtros</button>
      </form>
      {groups.length > 0 && (
        <section className="property-section">
          <h2>Grupos de cobranza</h2>
          <p>
            Dominio {percent(total(active(units), "ownership"))} · Expensas{" "}
            {percent(total(active(units), "expenses"))}
          </p>
          <Records
            rows={groups.map((group) => ({
              ...group,
              units: active(units)
                .filter((row) => row.billing_group_id === group.id)
                .map((row) => row.registry_code)
                .join(", "),
              coefficient: percent(
                total(
                  active(units).filter(
                    (row) => row.billing_group_id === group.id,
                  ),
                  "expenses",
                ),
              ),
            }))}
            columns={[
              ["name", "Grupo"],
              ["units", "Unidades"],
              ["coefficient", "Expensas"],
            ]}
          />
        </section>
      )}
      {!filtered.length && (
        <p className="muted">No se encontraron unidades con estos filtros.</p>
      )}
      {buildings.map((building) => {
        const levels = floors
          .filter(
            (f) =>
              f.building_id === building.id &&
              filtered.some((unit) => unit.floor_id === f.id),
          )
          .sort((a, b) => Number(a.level) - Number(b.level));
        if (!levels.length) return null;
        return (
          <section className="property-section" key={building.id}>
            <h2>{building.name}</h2>
            {levels.map((floor) => (
              <div key={floor.id} className="property-level">
                <h3>{floor.name}</h3>
                <div className="property-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Registro</th>
                        <th>Denominación</th>
                        <th>Tipo</th>
                        {ws.isAdmin && <th>Ocupación</th>}
                        <th>Expensas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .filter((unit) => unit.floor_id === floor.id)
                        .sort((a, b) =>
                          String(a.registry_code).localeCompare(
                            String(b.registry_code),
                            "es",
                            { numeric: true },
                          ),
                        )
                        .map((unit) => (
                          <tr key={unit.id}>
                            <td>{unit.registry_code}</td>
                            <td>
                              <Link href={unitsHref + "/" + unit.id}>
                                {unit.name}
                                {unit.archived_at ? " · Archivada" : ""}
                              </Link>
                            </td>
                            <td>{displayChoice(String(unit.kind))}</td>
                            {ws.isAdmin && (
                              <td>
                                {occupied.has(unit.id)
                                  ? "Ocupada"
                                  : "Sin ocupación activa"}
                              </td>
                            )}
                            <td>
                              {percent(
                                currentCoefficients.find(
                                  (c) => c.unit_id === unit.id,
                                )?.expenses,
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
const sectionColumns: Record<
  (typeof unitSections)[number],
  [string, string][]
> = {
  unit_coefficients: [
    ["effective_from", "Vigente desde"],
    ["ownership", "Dominio (%)"],
    ["expenses", "Expensas (%)"],
  ],
  unit_ownerships: [
    ["person", "Propietario"],
    ["share", "Titularidad (%)"],
    ["starts_on", "Desde"],
    ["ends_on", "Hasta"],
  ],
  occupancies: [
    ["person", "Residente"],
    ["kind", "Vínculo"],
    ["starts_on", "Desde"],
    ["ends_on", "Hasta"],
  ],
  lease_contracts: [
    ["person", "Locador"],
    ["reference", "Referencia"],
    ["starts_on", "Desde"],
    ["ends_on", "Hasta"],
  ],
  payment_responsibilities: [
    ["person", "Responsable"],
    ["concept", "Concepto"],
    ["starts_on", "Desde"],
    ["ends_on", "Hasta"],
  ],
  unit_relationships: [
    ["related", "Unidad vinculada"],
    ["description", "Descripción"],
  ],
};
export async function UnitDetail({ id }: { id: string }) {
  if (!propertyId.safeParse(id).success) notFound();
  const ws = await propertyWorkspace();
  const [units, floors, buildings, people, groups, ...sections] =
    await Promise.all([
      ws.read("units"),
      ws.read("floors"),
      ws.read("buildings"),
      ws.read("residents"),
      ws.read("billing_groups"),
      ...unitSections.map((name) => ws.read(name)),
    ]);
  const unit = units.find((row) => row.id === id);
  if (!unit) notFound();
  const floor = floors.find((row) => row.id === unit.floor_id);
  const building = buildings.find((row) => row.id === floor?.building_id);
  const options = {
    residents: rowOptions(active(people)),
    units: rowOptions(active(units).filter((row) => row.id !== id)),
    floors: rowOptions(floors),
    billing_groups: rowOptions(groups),
    occupancies: sections[2]
      .filter((row) => row.unit_id === id && row.kind === "INQUILINO")
      .map((row) => ({
        id: String(row.id),
        label:
          (people.find((p) => p.id === row.resident_id)?.name ?? "Inquilino") +
          " · " +
          row.starts_on,
      })),
  };
  const historyIds = [id];
  return (
    <>
      <Link href={unitsHref}>‹ Unidades</Link>
      <h1>{unit.name}</h1>
      <p>
        Registro {unit.registry_code} · {building?.name} · {floor?.name}{" "}
        {unit.archived_at ? "· Archivada" : ""}
      </p>
      <section className="property-section">
        <h2>Ficha de la unidad</h2>
        <dl className="property-data">
          {tables.units.fields
            .filter((f) => !f.relation)
            .map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>{unit[f.key] ?? "—"}</dd>
              </div>
            ))}
          <div>
            <dt>Superficie total</dt>
            <dd>{unit.total_area ?? "—"}</dd>
          </div>
          {ws.isAdmin && (
            <div>
              <dt>Ocupación</dt>
              <dd>
                {sections[2].some(
                  (row) =>
                    row.unit_id === id && currentPeriod(row, currentDate()),
                )
                  ? "Ocupada"
                  : "Sin ocupación activa"}
              </dd>
            </div>
          )}
        </dl>
        {ws.isAdmin && (
          <Disclosure title="Editar unidad">
            <RecordForm table="units" entry={unit} options={options} />
            <OperationForm
              hidden={{
                entity: "units",
                id,
                operation: unit.archived_at ? "restore" : "archive",
              }}
              submit={unit.archived_at ? "Restaurar" : "Archivar"}
              outline
            />
          </Disclosure>
        )}
      </section>
      {unitSections.map((table, index) => {
        const rows = sections[index].filter(
          (row) =>
            row.unit_id === id ||
            (table === "unit_relationships" && row.related_unit_id === id),
        );
        historyIds.push(...rows.map((row) => String(row.id)));
        const mapped: PropertyRow[] = rows.map((row) => ({
          ...row,
          person: people.find(
            (p) => p.id === (row.resident_id ?? row.landlord_id),
          )?.name,
          related: units.find(
            (u) =>
              u.id === (row.unit_id === id ? row.related_unit_id : row.unit_id),
          )?.name,
        }));
        if (!ws.isAdmin && !rows.length) return null;
        return (
          <section className="property-section" key={table}>
            <h2>{tables[table].label}</h2>
            <Records rows={mapped} columns={sectionColumns[table]} />
            {ws.isAdmin && (
              <Disclosure
                title={
                  table === "unit_coefficients"
                    ? "Registrar nueva vigencia"
                    : "Agregar registro"
                }
              >
                <RecordForm table={table} unitId={id} options={options} />
              </Disclosure>
            )}
            {ws.isAdmin &&
              table !== "unit_coefficients" &&
              rows.map((row) => (
                <Disclosure
                  key={row.id}
                  title={
                    "Editar registro · " +
                    String(
                      row.starts_on ??
                        mapped.find((item) => item.id === row.id)?.related ??
                        "",
                    )
                  }
                >
                  <RecordForm
                    table={table}
                    entry={row}
                    unitId={id}
                    options={options}
                    editKeys={
                      table === "unit_relationships"
                        ? ["description"]
                        : table === "lease_contracts"
                          ? ["reference", "ends_on"]
                          : ["ends_on"]
                    }
                  />
                  {table === "unit_relationships" && (
                    <OperationForm
                      hidden={{
                        entity: table,
                        operation: "unlink",
                        id: String(row.id),
                      }}
                      submit="Quitar vínculo"
                      outline
                    />
                  )}
                </Disclosure>
              ))}
          </section>
        );
      })}
      <Files ws={ws} unitId={id} />
      <History ws={ws} ids={historyIds} />
    </>
  );
}
export async function Residents() {
  const ws = await propertyWorkspace();
  const people = await ws.read("residents");
  return (
    <>
      <h1>Propietarios e inquilinos</h1>
      {ws.isAdmin && (
        <div className="property-actions">
          <Link
            className="outline"
            href={propertyRoot + "/importar?tipo=residents"}
          >
            Importar residentes
          </Link>
          <Disclosure title="Nueva ficha">
            <RecordForm table="residents" options={emptyOptions} />
          </Disclosure>
        </div>
      )}
      {!people.length && (
        <p className="muted">No hay fichas disponibles para tu cuenta.</p>
      )}
      <div className="property-cards">
        {people.map((row) => (
          <article className="property-section" key={row.id}>
            <h2>
              <Link href={residentsHref + "/" + row.id}>{row.name}</Link>
            </h2>
            <p>
              {row.archived_at
                ? "Ficha archivada"
                : row.user_id
                  ? "Portal vinculado"
                  : "Ficha de residente"}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
export async function ResidentDetail({ id }: { id: string }) {
  if (!propertyId.safeParse(id).success) notFound();
  const ws = await propertyWorkspace();
  const [people, units, owners, occupancies, contracts, charges] =
    await Promise.all([
      ws.read("residents"),
      ws.read("units"),
      ws.read("unit_ownerships"),
      ws.read("occupancies"),
      ws.read("lease_contracts"),
      ws.read("payment_responsibilities"),
    ]);
  const person = people.find((row) => row.id === id);
  if (!person) notFound();
  const rows = owners.concat(occupancies);
  const associated = units.filter((unit) =>
    rows.some((row) => row.unit_id === unit.id && row.resident_id === id),
  );
  const unitName = (unitId: unknown) =>
    associated.find((unit) => unit.id === unitId)?.name;
  const leases = contracts.filter(
    (row) =>
      row.landlord_id === id ||
      occupancies.some(
        (o) => o.id === row.occupancy_id && o.resident_id === id,
      ),
  );
  const sections = [
    ["unit_ownerships", owners],
    ["occupancies", occupancies],
    ["lease_contracts", leases],
    ["payment_responsibilities", charges],
  ] as const;
  return (
    <>
      <Link href={residentsHref}>‹ Residentes</Link>
      <h1>{person.name}</h1>
      <section className="property-section">
        <h2>Datos personales</h2>
        <dl className="property-data">
          {tables.residents.fields.map((f) => (
            <div key={f.key}>
              <dt>{f.label}</dt>
              <dd>{person[f.key] ?? "—"}</dd>
            </div>
          ))}
        </dl>
        {ws.isAdmin && (
          <Disclosure title="Editar ficha">
            <RecordForm
              table="residents"
              entry={person}
              options={emptyOptions}
            />
            <OperationForm
              hidden={{
                entity: "residents",
                id,
                operation: person.archived_at ? "restore" : "archive",
              }}
              submit={person.archived_at ? "Restaurar" : "Archivar"}
              outline
            />
          </Disclosure>
        )}
      </section>
      {ws.isAdmin && person.email && !person.user_id && !person.archived_at && (
        <Disclosure title="Invitar al portal">
          <InviteForm
            resident={{
              id,
              email: String(person.email),
              organizationId: ws.scope.organization_id,
              consortiumId: ws.scope.consortium_id,
            }}
          />
        </Disclosure>
      )}
      <section className="property-section">
        <h2>Unidades asociadas</h2>
        {associated.length ? (
          associated.map((u) => (
            <p key={u.id}>
              <Link href={unitsHref + "/" + u.id}>{u.name}</Link>
            </p>
          ))
        ) : (
          <p className="muted">Sin unidades visibles.</p>
        )}
      </section>
      {sections.map(([table, list]) => (
        <section key={table} className="property-section">
          <h2>{tables[table].label}</h2>
          <Records
            rows={list
              .filter(
                (row) => table === "lease_contracts" || row.resident_id === id,
              )
              .map((row) => ({ ...row, unit: unitName(row.unit_id) }))}
            columns={[
              ["unit", "Unidad"],
              ...sectionColumns[table].filter(([key]) => key !== "person"),
            ]}
          />
        </section>
      ))}
      <section className="property-section">
        <h2>Estado de cuenta</h2>
        <p className="muted">
          Los saldos por unidad y período estarán disponibles con Expensas y
          Cobranzas.
        </p>
      </section>
      <History
        ws={ws}
        ids={[
          id,
          ...rows
            .filter((row) => row.resident_id === id)
            .map((row) => String(row.id)),
        ]}
      />
    </>
  );
}
