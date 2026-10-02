import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.iglesia.upsert({
    where: { id: "iglesia-demo" },
    update: {},
    create: {
      id: "iglesia-demo",
      nombre: "Parroquia Demo",
      diocesis: "Diócesis Demo",
      ciudad: "Ciudad de México",
      estado: "CDMX",
    },
  });

  await prisma.rol.upsert({
    where: { id: "rol-administrador" },
    update: {},
    create: {
      id: "rol-administrador",
      nombre: "Administrador",
      esAdministrador: true,
      permisos: [
        "REGISTRAR_ACTAS",
        "CONSULTAR_ACTAS",
        "PUNTO_DE_VENTA",
        "ADMINISTRAR_CATALOGO",
        "CONFIGURAR",
        "ADMINISTRAR_MINISTROS",
      ],
    },
  });

  // Las cuentas ya no se crean con una contraseña escrita aquí: este archivo
  // vive en el repositorio, así que cualquier contraseña puesta en el código
  // es pública. El primer SUPERADMIN se crea desde /configuracion-inicial, que
  // solo está disponible mientras el sistema no tiene ningún usuario.
  //
  // Para un entorno de desarrollo se pueden pasar por variable de entorno:
  //   SEED_SUPERADMIN_EMAIL=... SEED_SUPERADMIN_PASSWORD=... npm run db:seed
  const emailSeed = process.env.SEED_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const passwordSeed = process.env.SEED_SUPERADMIN_PASSWORD;

  if (emailSeed && passwordSeed) {
    if (passwordSeed.length < 8) {
      throw new Error("SEED_SUPERADMIN_PASSWORD debe tener al menos 8 caracteres.");
    }
    await prisma.usuario.upsert({
      where: { email: emailSeed },
      update: {},
      create: {
        nombre: "Administrador General",
        email: emailSeed,
        passwordHash: await bcrypt.hash(passwordSeed, 10),
        esSuperAdmin: true,
      },
    });
    console.log(`SUPERADMIN creado: ${emailSeed}`);
  } else {
    console.log(
      "Sin SEED_SUPERADMIN_EMAIL/PASSWORD: no se creó ningún usuario.\n" +
        "Abre /configuracion-inicial para crear el administrador general.",
    );
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
