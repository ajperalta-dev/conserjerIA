# Entorno local
La CLI generó config.jsonc y el nombre de migración. Docker debe estar iniciado para ejecutar supabase start y los comandos db locales. No hay proyecto alojado vinculado ni credenciales inventadas.

1. Iniciar Docker Desktop.
2. Ejecutar npx supabase start.
3. Obtener URL y claves locales con npx supabase status. Copiarlas a .env.local junto con APP_URL.
4. Aplicar las migraciones con npx supabase db reset únicamente sobre el entorno local descartable.
5. Ejecutar node --env-file=.env.local scripts/demo.mjs para crear cuentas ficticias y dos organizaciones. Las contraseñas se generan al ejecutar y se muestran solo en esa terminal.
6. Abrir la app y usar una cuenta demo. Configurar TOTP desde Tu cuenta antes de invitar.

Auth tiene registro público deshabilitado y confirmación de email habilitada. El registro se realiza mediante inviteUserByEmail en servidor. La clave secreta de Supabase se usa solo para ese envío y para la provisión local.

Configurar las plantillas Auth de invitación y recuperación para enlazar a {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite o type=recovery. El enlace de magic link utiliza type=magiclink. El callback PKCE también acepta code. Configurar la misma APP_URL y URLs exactas permitidas en el entorno alojado. El capturador de correo local permite revisar enlaces sin correo real.

La aceptación usa el código UUID generado al invitar y la cuenta con email confirmado. Para una persona ya registrada, compartir el código por el canal autorizado y entrar mediante contraseña o magic link. Si el envío falla, la invitación persiste y su código permite recuperar el flujo.

El fixture embebido de test:db comprueba políticas PostgreSQL. No reemplaza la prueba de extremo a extremo de Auth sobre el stack local.
