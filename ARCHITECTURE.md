# Arquitectura
App Router separa la landing pública, la vista previa navegable sin datos y el punto de entrada privado. El servidor verifica las claims de Supabase antes de renderizar el área privada. Sin configuración o sesión válida redirige a acceso. La interfaz pública no consulta datos financieros ni proveedores.
 
## Capas
- src/app compone páginas y layouts. Los Server Components resuelven rutas y permisos de entrada.
- src/components contiene la presentación y la interacción de cliente. src/components/ui y components.json forman la base editable con convenciones de shadcn/ui.
- src/modules/navigation concentra identificadores, etiquetas, búsqueda y rutas. El shell y el directorio consumen el mismo catálogo.
- src/modules/consorcios/domain.ts define el contrato del repositorio con tenant explícito y un servicio que valida contexto y resultados. La etapa 2 resolverá la membresía en el servidor antes de construir ese contexto.
- src/integrations/supabase encapsula la lectura de sesión. Los adaptadores de datos se incorporan al implementar los dominios.
- src/lib contiene formatos regionales y utilidades compartidas.

## Modelo previsto
Una administración será un tenant con uno o más consorcios. Una persona podrá pertenecer a varias administraciones. Cada fila de negocio referenciará su tenant. Las claves compuestas impedirán vincular recursos de tenants distintos. Las políticas PostgreSQL comprobarán membresía, rol y alcance del consorcio para cada lectura y escritura. Storage seguirá los mismos permisos. La selección del navegador expresa una preferencia y debe revalidarse en servidor.

## Integraciones
Mercado Pago, Resend, WhatsApp y OpenAI usarán adaptadores de servidor por dominio. Los eventos financieros tendrán identificador externo único, auditoría y reintentos idempotentes. Edge Functions y Cron ejecutarán trabajos con contexto de tenant explícito. Realtime se habilitará después de probar las políticas. React Hook Form y Zod se incorporarán con el primer formulario transaccional, y TanStack Table y Recharts con consultas reales.

## Distribución
Vercel ejecutará Next.js con variables por entorno. El manifest e iconos preparan la instalación. La estrategia offline y el control de caché de información privada corresponden a la etapa 12.

## Implementación de la etapa 2
El aislamiento se aplica en PostgreSQL con membresías y permisos consultados en cada solicitud. Los roles no provienen de metadatos editables. La organización seleccionada se deriva de la membresía del consorcio y su FK compuesta. La cookie httpOnly guarda una preferencia que se revalida en servidor.

Las interfaces de datos usan src/types/database.ts generado desde PostgreSQL. Las operaciones sensibles exigen AAL2 en RLS. El contrato de unidades se documenta en DATABASE.md para la etapa 3. Las funciones privilegiadas se limitan a auditoría por trigger y aceptación atómica de invitación con email confirmado, rol predeterminado y validación actual del emisor. Su alcance y permisos están documentados en DATABASE.md.

La clave secreta solo se utiliza tras crear una invitación autorizada mediante RLS, para enviar la invitación de Auth. Las escrituras de negocio usan el cliente del usuario. El rol de plataforma se provisiona mediante SQL operativo y nunca mediante formularios de residentes.
