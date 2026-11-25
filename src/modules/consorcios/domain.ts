export interface TenantContext {
  readonly userId: string;
  readonly tenantId: string;
}
export interface Consorcio {
  readonly id: string;
  readonly tenantId: string;
  readonly nombre: string;
}
export interface ConsorcioRepository {
  list(context: TenantContext): Promise<readonly Consorcio[]>;
}
/** Contrato del servicio de consulta. El adaptador de PostgreSQL deberá aplicar además RLS. */
export async function listConsorcios(
  context: TenantContext,
  repository: ConsorcioRepository,
) {
  if (!context.tenantId.trim() || !context.userId.trim())
    throw new Error("Falta el contexto de membresía");
  const rows = await repository.list(context);
  if (rows.some((row) => row.tenantId !== context.tenantId))
    throw new Error("Resultado fuera del tenant");
  return rows;
}
