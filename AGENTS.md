# Reglas permanentes
- Inspeccionar el repositorio, su estado y la etapa activa antes de editar. Preservar módulos existentes y justificar toda eliminación.
- Implementar solo la etapa solicitada. Etiquetar funciones pendientes y mantener cada acción habilitada operativa.
- Mantener TypeScript estricto, módulos por dominio y componentes de presentación independientes del proveedor de datos.
- Exigir contexto de membresía verificado y RLS para datos de negocio. Nunca confiar en un tenant enviado por el navegador.
- Mantener secretos en el servidor. Nunca registrar tokens o datos financieros personales. Identificar cualquier ejemplo como tal.
- Reutilizar componentes, tokens y convenciones es-AR, ARS y America/Argentina/Mendoza. Verificar teclado y móvil.
- Justificar las dependencias y fijar versiones compatibles en el lockfile.
- Ejecutar lint, typecheck, Vitest, build y Playwright al cerrar cada etapa. Actualizar PROGRESS.md con resultados, decisiones, errores y pendientes.
