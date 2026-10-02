# Control de Actas Parroquiales

Aplicación web para el registro, consulta y reimpresión de actas de **bautizo**,
**primera comunión**, **confirmación** y **matrimonio**, para una o varias iglesias
(multi-parroquia / diócesis).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth v5 (Credentials, sesión JWT) con roles por iglesia
- Generación de PDF con `@react-pdf/renderer`

## Roles y permisos

- **SUPERADMIN**: nivel diócesis. Administra todas las parroquias y usuarios, y
  es el único que edita las plantillas de rol globales.
- **Administrador** (rol fijo): administra su parroquia —usuarios, roles y
  actas—. Tiene todos los permisos de forma implícita.
- Los demás roles se definen por parroquia con permisos sueltos:
  `REGISTRAR_ACTAS`, `CONSULTAR_ACTAS`, `VER_INGRESOS`, `PUNTO_DE_VENTA`,
  `ADMINISTRAR_CATALOGO`, `ADMINISTRAR_MINISTROS` y `CONFIGURAR`.

Un rol pertenece a una parroquia: el administrador de una no puede ver ni
editar los roles de otra. Los roles con `iglesiaId` nulo son plantillas de
diócesis, de solo lectura salvo para el SUPERADMIN.

## Puesta en marcha local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env`. Hace falta `DATABASE_URL` (PostgreSQL local,
   Docker o un proveedor como Neon) y `AUTH_SECRET`, generado con
   `openssl rand -base64 32`.

3. Aplicar las migraciones:

   ```bash
   npm run db:migrate
   ```

4. Opcional, datos de ejemplo (una parroquia y los roles base, **sin usuarios**):

   ```bash
   npm run db:seed
   ```

5. Levantar el servidor y abrir **`/configuracion-inicial`** para crear el
   administrador general:

   ```bash
   npm run dev
   ```

### Por qué no hay usuarios de ejemplo

El seed no crea cuentas con contraseñas escritas en el código: este archivo
vive en el repositorio, así que cualquier contraseña puesta aquí es pública.
El primer SUPERADMIN se crea desde `/configuracion-inicial`, que **solo está
disponible mientras el sistema no tiene ningún usuario** y deja de existir en
cuanto se crea el primero.

Para automatizar un entorno de desarrollo se pueden pasar por variable de
entorno, nunca en producción:

```bash
SEED_SUPERADMIN_EMAIL=tu@correo SEED_SUPERADMIN_PASSWORD=... npm run db:seed
```

### Contraseñas

- El alta de un usuario fija una **contraseña temporal**: al entrar por primera
  vez no puede usar el sistema hasta elegir una propia.
- Un administrador puede restablecerla desde **Usuarios**, lo que la vuelve
  temporal otra vez y levanta cualquier bloqueo por intentos fallidos.
- Cualquiera cambia la suya desde **Contraseña**, en la barra superior.
- Cinco intentos fallidos bloquean la cuenta diez minutos.

## Despliegue: una instancia por cliente

Cada cliente —parroquia o diócesis— corre su **propia instancia con su propia
base de datos**. Es deliberado: un SUPERADMIN ve toda su base, así que la
separación entre clientes es física, no una condición en las consultas que
pueda fallar.

En Vercel varios proyectos pueden apuntar al mismo repositorio, de modo que un
solo `git push` a `main` despliega todas las instancias, y cada build corre
`prisma migrate deploy` contra su propia base.

### Alta de un cliente

1. Crear la base de datos del cliente y copiar su cadena de conexión.
2. Crear un proyecto nuevo en Vercel apuntando a este repositorio.
3. Configurar sus variables de entorno:

   | Variable | Para qué |
   |---|---|
   | `DATABASE_URL` | La base de ese cliente, y de nadie más |
   | `AUTH_SECRET` | Propio de la instancia (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | El dominio de esa instancia |
   | `LICENCIAS_USUARIOS` | Usuarios activos contratados |

4. Desplegar. Las migraciones se aplican solas sobre la base vacía.
5. Abrir `/configuracion-inicial`, crear el administrador general y entregarle
   las credenciales. A partir de ahí el cliente configura sus parroquias, sus
   sacerdotes y sus usuarios.

### Licencias

`LICENCIAS_USUARIOS` limita los **usuarios activos**. Se comprueba al crear y
al reactivar usuarios, y desactivar a alguien libera su asiento. Vive en las
variables de Vercel y no en la aplicación justamente para que el administrador
del cliente no pueda ampliárselo. Sin la variable no hay tope.

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
