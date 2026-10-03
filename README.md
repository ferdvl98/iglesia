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

### Monitoreo de errores

Sin `SENTRY_DSN` no se inicializa nada: la aplicación funciona igual y el
desarrollo local no manda ruido al panel. Se configura **por instancia**, de
modo que cada cliente reporta por separado y se sabe a qué parroquia avisar.

No se envían datos personales (`sendDefaultPii: false`) ni repeticiones de
sesión: un sistema de actas sacramentales maneja nombres, domicilios y
filiación, y eso no debe salir de la instalación del cliente.

### Pruebas

```bash
npm test
```

Cubren lo que, si se rompe, corrompe el libro o filtra datos: la ubicación de
una partida en el tomo, los permisos y el aislamiento entre parroquias, la
normalización de la búsqueda, el folio y la conversión de campos.

### Licencias y módulos

El precio es **por parroquia**, no por usuario: cada cliente es una instancia y
el costo de operarla no cambia con cuánta gente entre. Cobrar por asiento
empujaría a la parroquia a compartir una sola cuenta entre el párroco y la
secretaria, y eso anularía justo lo que hace confiable al sistema —quién
registró, quién anuló y quién imprimió cada acta.

| Variable | Qué hace |
|---|---|
| `LICENCIAS_USUARIOS` | Tope de usuarios **activos**. Es una baranda, no un precio: evita que una diócesis meta varias parroquias en una instancia pagada como una. Sin la variable no hay tope. |
| `MODULO_PUNTO_DE_VENTA` | Enciende el punto de venta y el catálogo. **Viene apagado**: una instalación nueva nace sin el módulo. |

Ambas viven en las variables de Vercel y no en la aplicación, para que el
administrador del cliente no pueda ampliarse el cupo ni encenderse un módulo
que no contrató. **Cambiarlas exige volver a desplegar ese proyecto.**

El tope de usuarios se comprueba al crear y al reactivar; desactivar a alguien
libera su asiento.

El módulo de punto de venta se apaga en un solo punto —`puedeUsarPuntoDeVenta`
y `puedeAdministrarCatalogo` en `src/lib/authz.ts`—, por donde pasan todas sus
pantallas y acciones. Con el módulo apagado desaparecen también su enlace del
menú, el resumen de ventas del panel y sus permisos del formulario de roles.
