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
