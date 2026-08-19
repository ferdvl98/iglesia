-- Sistema de roles y permisos: reemplaza el enum fijo Rol (SUPERADMIN,
-- ADMIN_IGLESIA, CAPTURISTA, CONSULTA) por roles configurables (tabla
-- "roles" con permisos de tipo Permiso[]), independientes de iglesia o
-- diócesis. SUPERADMIN pasa a ser un flag booleano en Usuario, fuera del
-- sistema de roles. Se preserva la asignación de cada usuario existente.

CREATE TYPE "Permiso" AS ENUM ('REGISTRAR_ACTAS', 'CONSULTAR_ACTAS', 'PUNTO_DE_VENTA', 'ADMINISTRAR_CATALOGO', 'CONFIGURAR');

CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esAdministrador" BOOLEAN NOT NULL DEFAULT false,
    "permisos" "Permiso"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- Roles por defecto, equivalentes a los valores del antiguo enum.
INSERT INTO "roles" ("id", "nombre", "esAdministrador", "permisos", "updatedAt") VALUES
  ('rol-administrador', 'Administrador', true, ARRAY['REGISTRAR_ACTAS','CONSULTAR_ACTAS','PUNTO_DE_VENTA','ADMINISTRAR_CATALOGO','CONFIGURAR']::"Permiso"[], CURRENT_TIMESTAMP),
  ('rol-capturista', 'Capturista', false, ARRAY['REGISTRAR_ACTAS','CONSULTAR_ACTAS','PUNTO_DE_VENTA']::"Permiso"[], CURRENT_TIMESTAMP),
  ('rol-consulta', 'Consulta', false, ARRAY['CONSULTAR_ACTAS','PUNTO_DE_VENTA']::"Permiso"[], CURRENT_TIMESTAMP);

ALTER TABLE "usuarios" ADD COLUMN "esSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN "rolId" TEXT;

UPDATE "usuarios" SET "esSuperAdmin" = true WHERE "rol" = 'SUPERADMIN';
UPDATE "usuarios" SET "rolId" = 'rol-administrador' WHERE "rol" = 'ADMIN_IGLESIA';
UPDATE "usuarios" SET "rolId" = 'rol-capturista' WHERE "rol" = 'CAPTURISTA';
UPDATE "usuarios" SET "rolId" = 'rol-consulta' WHERE "rol" = 'CONSULTA';

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "usuarios" DROP COLUMN "rol";
DROP TYPE "Rol";
