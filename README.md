# ConserjerIA
Administración inteligente de edificios. Primera etapa de la plataforma SaaS para Mendoza, Argentina.

## Ejecutar
Usar Node.js 24 y npm. Desde la carpeta del proyecto:
```sh
npm ci
npm run dev
```
Abrir http://localhost:3000. La landing vive en `/`, el recorrido sin datos en `/vista-previa` y la entrada protegida en `/dashboard`. La vista previa funciona sin cuentas ni variables. Para configurar la verificación de sesión copiar .env.example a .env.local y completar los dos campos públicos de Supabase.

## Verificar
```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run e2e
```
Playwright inicia el servidor de producción en el puerto 3485. Para usar Edge instalado, definir PLAYWRIGHT_CHANNEL=msedge en el entorno.

## Guías
Consultar [arquitectura](ARCHITECTURE.md), [etapas](PLAN.md), [reglas de desarrollo](AGENTS.md) y [avance](PROGRESS.md). Los recursos de marca viven en public/brand. Las versiones exactas están en package.json y package-lock.json.

## Referencias oficiales
[Instalación de Next.js](https://nextjs.org/docs/app/getting-started/installation) · [shadcn/ui con Next.js](https://ui.shadcn.com/docs/installation/next) · [RLS en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Etapa 2
Autenticación por contraseña, magic link, recuperación y verificación de email, invitaciones, perfil, cierre global de sesiones, TOTP y selección de organización/consorcio. La renovación de cookies ocurre en src/proxy.ts. Las páginas privadas verifican usuario y membresía en servidor. El acceso sin configuración muestra el formulario y devuelve un mensaje al intentar ingresar.

Consultar [modelo completo](DATABASE.md) y [preparación local](supabase/README.md). Ejecutar npm run test:db para verificar la migración sin sobrescribir los tipos oficiales. El envío de invitaciones requiere SUPABASE_SECRET_KEY exclusivamente en servidor y APP_URL configurada. Las plantillas Auth deben usar el endpoint /auth/confirm documentado en la guía local.

## Administración de propiedades

En el panel privado, Consorcios permite administrar edificios, bloques y pisos. Unidades ofrece filtros, fichas, coeficientes, ocupación y grupos de cobranza. Residentes reúne los datos personales, historiales, contratos y responsabilidades. Activá MFA en Tu cuenta para guardar cambios.

Para importar, abrí Unidades o Residentes y elegí Importar. El archivo puede ser CSV, XLS o XLSX. Usá encabezados en la primera fila, asigná cada columna a un campo y corregí las filas marcadas antes de confirmar. Cada lote de unidades se asigna a un piso. El máximo es de 500 filas. Se conservan como texto los identificadores con ceros iniciales cuando la planilla los guarda o muestra así.

El seed de referencia está en supabase/seeds/pellegrini.sql. Las pruebas de navegador autenticadas se habilitan con .env.pellegrini-demo.local y las variables PELLEGRINI_ADMIN_EMAIL, PELLEGRINI_ADMIN_PASSWORD y sus equivalentes OWNER y TENANT. Guardá esas credenciales fuera de Git.
