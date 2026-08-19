import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const iglesia = await prisma.iglesia.upsert({
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

  const rolAdministrador = await prisma.rol.upsert({
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
      ],
    },
  });

  const passwordSuperadmin = await bcrypt.hash("Superadmin123!", 10);
  await prisma.usuario.upsert({
    where: { email: "superadmin@actas.local" },
    update: {},
    create: {
      nombre: "Administrador General",
      email: "superadmin@actas.local",
      passwordHash: passwordSuperadmin,
      esSuperAdmin: true,
    },
  });

  const passwordAdmin = await bcrypt.hash("Admin123!", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@parroquia-demo.local" },
    update: {},
    create: {
      nombre: "Administrador Parroquia",
      email: "admin@parroquia-demo.local",
      passwordHash: passwordAdmin,
      rolId: rolAdministrador.id,
      iglesiaId: iglesia.id,
    },
  });

  console.log("Seed completado.");
  console.log("SUPERADMIN -> superadmin@actas.local / Superadmin123!");
  console.log("ADMIN_IGLESIA -> admin@parroquia-demo.local / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
