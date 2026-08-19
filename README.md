# Control de Actas Parroquiales

Aplicación web para el registro, consulta y reimpresión de actas de **bautizo**,
**primera comunión**, **confirmación** y **matrimonio**, para una o varias iglesias
(multi-parroquia / diócesis).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth v5 (Credentials, sesión JWT) con roles por iglesia
- Generación de PDF con `@react-pdf/renderer`

## Roles

- **SUPERADMIN**: administra todas las iglesias y usuarios (nivel diócesis).
- **ADMIN_IGLESIA**: administra su parroquia (usuarios, actas).
- **CAPTURISTA**: registra y consulta actas de su parroquia.
- **CONSULTA**: solo consulta/reimprime actas de su parroquia.

## Configuración inicial

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y configurar `DATABASE_URL` con una base de
   datos PostgreSQL (local, Docker, o un proveedor como Neon/Supabase/RDS) y un
   `AUTH_SECRET` generado con `openssl rand -base64 32`.

3. Aplicar las migraciones y crear el esquema:

   ```bash
   npm run db:migrate
   ```

4. Cargar datos de ejemplo (una parroquia demo + usuario SUPERADMIN y ADMIN_IGLESIA):

   ```bash
   npm run db:seed
   ```

   Credenciales generadas por el seed:
   - `superadmin@actas.local` / `Superadmin123!`
   - `admin@parroquia-demo.local` / `Admin123!`

   **Cambia estas contraseñas antes de usar la app en producción.**

5. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` / `npm run start` — build y ejecución de producción.
- `npm run db:migrate` — aplica migraciones de Prisma.
- `npm run db:seed` — carga datos de ejemplo.
- `npm run db:studio` — abre Prisma Studio para explorar la base de datos.

## Estructura principal

- `prisma/schema.prisma` — modelo de datos (iglesias, usuarios, actas y sus
  detalles por sacramento).
- `src/app/(app)/actas` — registro, consulta y detalle de actas.
- `src/app/(app)/iglesias` — administración de iglesias (SUPERADMIN).
- `src/app/(app)/usuarios` — administración de usuarios.
- `src/app/api/actas/[id]/pdf` — generación del PDF reimprimible del acta.
- `src/lib/pdf/acta-pdf.tsx` — plantilla del documento PDF.
