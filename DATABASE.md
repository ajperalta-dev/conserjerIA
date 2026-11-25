# Modelo relacional
El esquema instalado contiene organizations, profiles, organization_members, consortiums, consortium_members, role_permissions, invitations y audit_logs. Todas usan UUID y timestamps. Las membresías son únicas por usuario y alcance. Las claves compuestas atan la membresía del consorcio a la organización correcta. El catálogo de permisos es solo lectura para clientes. SUPER_ADMIN se asigna mediante private.platform_admins por un operador SQL autorizado.

## Jerarquía y etapas
Cada tabla de negocio futura llevará organization_id y consortium_id y referencias compuestas que preservan ambos alcances. Los recursos por unidad llevarán unit_id. La autorización de una unidad deberá comprobar su relación vigente con el usuario, además del consorcio. Ninguna tabla de unidad está expuesta en esta etapa.

| Etapa | Tablas y relaciones previstas |
| --- | --- |
| 3 | buildings → consortiums, floors → buildings, units → floors. unit_relationships enlaza unidades relacionadas. unit_coefficients vincula unidad, vigencia y coeficiente NUMERIC. unit_ownerships referencia unidad y perfil con porcentaje y vigencia. occupancies vincula residente y unidad con fechas. lease_contracts enlaza ocupación, propietario e inquilino. |
| 4 | expense_categories por consorcio. expenses referencia categoría y proveedor. budgets → budget_items. allocation_rules define bases y vigencias. settlements → settlement_items → unit_charges, con referencias al período, regla y unidad. |
| 5 | bank_accounts por consorcio. payment_mandates referencia responsable y proveedor externo. payments → payment_allocations → unit_charges. payment_events conserva eventos externos únicos e inmutables. |
| 6 | suppliers por organización con asignaciones por consorcio mediante supplier_contracts. service_accounts referencia consorcio y proveedor. supplier_bills → supplier_payments enlaza factura, cuenta y pago. |
| 7 | bank_transactions → reconciliations referencia cuenta, pago y conciliación. chart_of_accounts → journal_entries → journal_lines con asientos balanceados. reserve_funds referencia cuenta y consorcio. |
| 8 | documents → document_versions. document_permissions asigna acceso por perfil, rol, unidad o consorcio. Objetos privados con rutas de organización y consorcio. |
| 9 | assets por edificio o unidad. maintenance_tasks y maintenance_tickets → work_orders enlazan activo, proveedor y responsable. common_areas → reservations con residente y rango horario excluyente. |
| 10 | assemblies → assembly_attendees y votes. votes referencia moción, unidad, participante y regla de ponderación. announcements → notifications con destinatario y estado de entrega. |
| 11 | automation_rules → automation_runs con alcance, resultado y clave idempotente. |
| 12 | subscription_plans → organization_subscriptions. Historial de plan, vigencia y proveedor de cobro. |

Los movimientos financieros usarán NUMERIC(20,2) o centavos BIGINT, moneda explícita y restricciones de no negatividad según dominio. Los asientos confirmados y eventos externos serán inmutables. Las correcciones se harán por reversión con referencia al registro original. Los catálogos y propiedades podrán archivarse cuando existan dependencias históricas. Membresías y contratos usarán vigencias explícitas al ampliar el modelo.

## Seguridad efectiva
Un rol de organización no concede acceso automático a sus consorcios. Cada consulta verifica membresía explícita del consorcio. ADMIN puede leer y modificar nombre con AAL2 e invitar roles subordinados. ACCOUNTANT tiene permiso financiero reservado para futuras tablas. OWNER, TENANT, BOARD_MEMBER y MAINTENANCE leen la identidad de su consorcio. La visibilidad de cada futuro módulo requiere sus propias políticas antes de exponerlo.

profiles es privado por usuario. organization_members y consortium_members son visibles únicamente para su titular y no admiten modificaciones directas. Las invitaciones no pueden otorgar ADMIN o SUPER_ADMIN. Su aceptación bloquea la fila, verifica email confirmado en auth.users, vigencia y permiso actual del emisor, y escribe ambas membresías atómicamente.

Las funciones con SECURITY DEFINER se limitan a aceptación atómica y auditoría por trigger, con search_path vacío, argumentos sin identidad o rol y permisos EXECUTE restringidos. No existe RPC genérica de SQL o modificación de roles. Los logs no admiten escrituras del cliente. La provisión inicial y cambios de administrador requieren operador de plataforma y deberán auditarse por el proceso operativo.

Storage crea consortium-private como bucket privado y deniega objetos hasta implementar document_permissions. Las URLs firmadas requieren primero permiso SELECT sobre el objeto. No se generan URLs que omitan esta autorización.

## Tipos y pruebas
npm run test:db ejecuta la migración en PostgreSQL embebido PGlite, crea roles y funciones Auth equivalentes para evaluar RLS y genera src/types/database.ts desde information_schema. Supabase Auth, correo, Storage y revocación real de sesiones requieren además el stack local. La generación oficial posterior se hace con supabase gen types typescript --local siguiendo su ayuda actual.
