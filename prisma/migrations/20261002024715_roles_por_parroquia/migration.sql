-- Los roles dejan de ser globales: pasan a pertenecer a una parroquia.
-- `iglesiaId` nulo = plantilla a nivel diócesis (ahí queda el rol Administrador).
ALTER TABLE "roles" ADD COLUMN "iglesiaId" TEXT;

-- Migración de los datos existentes: un rol que hoy usan usuarios de una sola
-- parroquia pasa a ser de esa parroquia. Si lo comparten varias (o no lo usa
-- nadie), se queda como plantilla global para no quitarle el rol a nadie.
UPDATE "roles" r
SET "iglesiaId" = sub."iglesiaId"
FROM (
  SELECT u."rolId" AS "rolId", MIN(u."iglesiaId") AS "iglesiaId"
  FROM "usuarios" u
  WHERE u."rolId" IS NOT NULL AND u."iglesiaId" IS NOT NULL
  GROUP BY u."rolId"
  HAVING COUNT(DISTINCT u."iglesiaId") = 1
) sub
WHERE r."id" = sub."rolId" AND r."esAdministrador" = false;

-- Caso de una sola parroquia (lo habitual): los roles que nadie usa todavía
-- también son suyos, para que su administrador los siga pudiendo editar.
UPDATE "roles"
SET "iglesiaId" = (SELECT "id" FROM "iglesias" LIMIT 1)
WHERE "iglesiaId" IS NULL
  AND "esAdministrador" = false
  AND (SELECT COUNT(*) FROM "iglesias") = 1;

-- El nombre ya no es único en todo el sistema, sino dentro de cada parroquia.
DROP INDEX IF EXISTS "roles_nombre_key";
CREATE UNIQUE INDEX "roles_iglesiaId_nombre_key" ON "roles"("iglesiaId", "nombre");

ALTER TABLE "roles" ADD CONSTRAINT "roles_iglesiaId_fkey"
  FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
