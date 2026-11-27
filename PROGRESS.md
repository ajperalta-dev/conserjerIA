# Etapa 1 · 25 de noviembre de 2026
**Completada en local.** Landing comercial, cinco variantes SVG, iconos PNG, ilustración residencial, manifest, shell responsive, navegación de 17 secciones, buscador, preferencias de tema, alertas y estados vacíos. Los módulos de negocio muestran su estado pendiente.

## Decisiones
El proyecto ocupa una carpeta independiente. El panel público usa /vista-previa y comparte componentes con /dashboard, que exige una sesión verificada en servidor. Se dejan el alta, el ingreso, la renovación de sesión y la selección por membresía para la etapa 2. El directorio de módulos usa HTML semántico y las tarjetas muestran indicadores sin valor hasta incorporar fuentes reales.

## Verificación
- ESLint y TypeScript estricto completados.
- Vitest pasó 5 pruebas de catálogo, búsqueda, formato monetario y contrato de tenant.
- Next.js generó el build de producción.
- Playwright con Edge pasó 2 recorridos de escritorio y móvil sobre ese build. Cubren búsqueda, tema persistente, navegación, estado pendiente y rechazo de acceso anónimo.
- No se verificó una sesión real contra un proyecto Supabase ni se desplegó en Vercel.

## Errores resueltos
El primer build detectó un conflicto entre CommonJS y los imports ESM, además de una ruta de fuente inexistente. Se corrigieron el tipo de paquete y la importación de Inter. El primer recorrido de teclado enviaba el atajo antes de terminar la navegación. Ahora espera el montaje del panel antes de interactuar.

## Próxima etapa
Implementar el flujo de identidad y la selección autorizada de tenant y consorcio. Crear migraciones y políticas RLS con pruebas entre usuarios de dos administraciones antes de conectar datos de negocio.

# Etapa 2 · 25 de noviembre de 2026
Implementación preparada y verificada en local con PostgreSQL embebido. Queda pendiente la integración de extremo a extremo con el stack Supabase real porque Docker no está iniciado y no se configuraron credenciales.

## Completado
- Migración versionada con identidad, organizaciones, consorcios, membresías, roles, permisos, invitaciones y auditoría.
- RLS en todas las tablas públicas y catálogo de permisos protegido contra modificaciones.
- Login, recuperación, magic link, confirmación por token o PKCE, perfiles, invitaciones, cierre de sesiones, selección de alcance y TOTP.
- Rutas privadas y verificación de membresía. OWNER y TENANT ingresan a comunicaciones.
- Bucket privado cerrado hasta incorporar permisos de documentos.
- Modelo futuro completo en DATABASE.md, configuración local y script de cuentas ficticias sin datos financieros.
- Tipos generados desde information_schema de PostgreSQL y usados por el cliente servidor.

## Verificación y límites
17 comprobaciones PostgreSQL verificaron aislamiento, permisos, rechazo de escalamiento, MFA para cambios, auditoría, aceptación y reutilización de invitaciones. Vitest conserva las 5 pruebas de la etapa 1. Lint, typecheck y build pasaron. El entorno embebido emula funciones de Auth y no verifica entrega de email, revocación real, API Storage ni TOTP con Supabase Auth.

## Decisiones y errores
Se mantiene la vista previa y el branding de la etapa 1. ADMIN de una organización necesita membresía explícita en cada consorcio. La provisión inicial de organizaciones y administradores queda a cargo del operador SQL. El registro público está deshabilitado. Las invitaciones requieren MFA y no permiten asignar ADMIN o SUPER_ADMIN.

Se corrigieron una referencia de columna ambigua en la política de organizaciones y la consulta de factores TOTP no verificados. Las pruebas incorporan lectura de organización para cubrir esa regresión.

## Pendientes para validar en Supabase
Iniciar Docker, ejecutar el stack y las migraciones, configurar variables y plantillas de correo, crear las cuentas demo y probar login, invitación, recuperación, renovación, MFA y revocación con los servicios reales. Implementar edificios, pisos, unidades y autorización por unidad en la etapa 3 antes de exponer esos datos.

Cierre de comprobaciones: ESLint sin advertencias, typecheck, 5 pruebas Vitest, build de producción y 2 recorridos Playwright con Edge completados correctamente. Las páginas de cuenta y selección se marcaron dinámicas para verificar la sesión en cada solicitud.

## Vinculación de infraestructura
Repositorio Git independiente vinculado a https://github.com/ajperalta-dev/conserjerIA. Proyecto Supabase indicado por el usuario: nqtweswtbwaxziballum. La conexión MCP devuelve falta de permisos para este proyecto. Las migraciones alojadas y la validación de Auth continúan pendientes de ese acceso.

## Conexión alojada y verificación · 25 de noviembre de 2026
La autorización de la organización alpha quedó verificada. ConserjerIA (nqtweswtbwaxziballum) está ACTIVE_HEALTHY. Se aplicaron identity_security e identity_indexes, con versiones locales alineadas con el historial remoto.

Las ocho tablas públicas tienen RLS y consortium-private es privado. Las pruebas SQL en supabase/tests/hosted_security.sql pasaron contra PostgreSQL alojado, cubriendo ADMIN, OWNER, TENANT, MFA, escalamiento y rechazo sin cambios. Los fixtures se revirtieron y se verificaron cero usuarios de prueba remanentes.

Se revocaron permisos predeterminados de anon/authenticated y se concedieron privilegios mínimos por columna. La aceptación privilegiada quedó en private, detrás de una función pública invoker. Se agregaron índices para FK y se optimizaron las consultas JWT en políticas. El asesor de seguridad quedó sin alertas. El asesor de rendimiento solo conserva avisos informativos de índices aún sin uso en la base nueva.

La aplicación local utiliza la URL y clave publicable reales en .env.local, excluido de Git. Los tipos oficiales se generaron desde Supabase. test:db conserva las 17 comprobaciones locales y ya no sobrescribe esos tipos.

Configuración alojada de Auth verificada en dashboard: registro público deshabilitado, confirmación de email habilitada, TOTP habilitado y callback exacto http://localhost:3000/auth/callback agregado. Las plantillas predeterminadas también son compatibles mediante /auth/complete, que verifica la sesión y elimina los tokens del fragmento de URL.

Pendientes concretos: cuenta inicial de administración, clave secreta de servidor para enviar invitaciones desde la app, proveedor SMTP propio para personalizar plantillas y pruebas con correo recibido y autenticador real. No se provisionaron usuarios permanentes ni se enviaron emails en esta verificación.

Verificación final de esta integración: 17 pruebas PostgreSQL locales, pruebas SQL alojadas con rollback, 5 pruebas Vitest y 3 recorridos Playwright con Edge aprobados. ESLint, TypeScript y build de producción aprobados. El tercer recorrido comprueba rechazo de tokens inválidos, eliminación del fragmento y protección posterior de /dashboard.

## Etapa 3 · 27 de noviembre de 2026

- Se conectaron Consorcios, Unidades y Residentes al panel autenticado. El consorcio activo se valida en el servidor. Las escrituras administrativas requieren MFA en PostgreSQL.
- Se agregaron fichas y formularios para consorcios, edificios, bloques, pisos, unidades, residentes, contratos, grupos de cobranza, vínculos y períodos de pago. Los registros principales se archivan para conservar su trazabilidad.
- Los coeficientes se registran como versiones inmutables con fecha de vigencia. La titularidad admite múltiples residentes y valida que la suma simultánea no supere 100 %. El historial registra autor, fecha, operación y campos modificados.
- Los archivos usan Storage privado y URLs firmadas. La aceptación de una invitación puede vincular la cuenta confirmada a su ficha de residente.
- CSV y Excel tienen vista previa, mapeo y detección de duplicados. La escritura se confirma como lote atómico.
- Supabase alojado recibió la migración property_administration y los datos ficticios de Pellegrini 802. Ocho unidades conservan sus porcentajes individuales y forman seis grupos de cobranza. Dominio y expensas suman 100 %.
- El saldo de cuenta se integrará en Expensas y Cobranzas. La responsabilidad registrada en esta etapa conserva la unidad y el período y no genera movimientos.

### Demostración y seguridad

El conjunto de demostración en Supabase incluye tres cuentas Auth ficticias, una administradora, una propietaria y una inquilina. Sus contraseñas se generaron de forma aleatoria y se guardaron en .env.pellegrini-demo.local, excluido de Git. No se enviaron correos a estas cuentas.

Los coeficientes informados se usaron para dominio y expensas desde el 1 de enero de 2026 como valores de demostración. Los grupos de los dúplex totalizan 20,23 % y 20,38 % respectivamente. No se inventaron CUIT, CBU, superficies o datos de contacto reales para el inmueble.

Las 23 tablas públicas tienen RLS. El asesor de seguridad informó que Auth tiene deshabilitada la detección de contraseñas filtradas. Supabase ofrece esa función a partir del plan Pro. Se verificó en PostgreSQL alojado que la cuenta autenticada no puede reemplazar un vínculo de residencia ni editar coeficientes previos. Un inicio de sesión de administración confirmó que Supabase emite AAL2 tras verificar un TOTP. El factor temporal de prueba se retiró al terminar.

Durante las pruebas se corrigió un formateador compartido que se exportaba desde un componente de cliente, y se explicitó la lectura del CSV como texto UTF-8 para evitar que SheetJS lo interpretara como Base64.

El envío de invitaciones a cuentas nuevas requiere configurar la clave de servidor y el correo de Supabase. El flujo de código y vinculación con una cuenta confirmada está implementado.

Cierre de la etapa: lint, TypeScript, build de producción, 7 pruebas Vitest, 33 comprobaciones PostgreSQL y 6 recorridos Playwright aprobados. Los recorridos autenticados verifican la importación de CSV y Excel, la detección de duplicados y la visibilidad por cuenta residente. Las migraciones alojadas también permiten vincular una ficha a un miembro existente y evitan que el CUIT revele registros de otro tenant por un error de unicidad.
