-- Split "nombreCompleto" into "nombre" and "apellidos" on primeras_comuniones,
-- backfilling existing rows (first word -> nombre, rest -> apellidos) before
-- enforcing NOT NULL and dropping the old column.
ALTER TABLE "primeras_comuniones" ADD COLUMN "nombre" TEXT;
ALTER TABLE "primeras_comuniones" ADD COLUMN "apellidos" TEXT;

UPDATE "primeras_comuniones"
SET "nombre" = split_part("nombreCompleto", ' ', 1),
    "apellidos" = CASE
      WHEN position(' ' in "nombreCompleto") > 0
      THEN trim(substring("nombreCompleto" from position(' ' in "nombreCompleto") + 1))
      ELSE ''
    END;

ALTER TABLE "primeras_comuniones" ALTER COLUMN "nombre" SET NOT NULL;
ALTER TABLE "primeras_comuniones" ALTER COLUMN "apellidos" SET NOT NULL;

ALTER TABLE "primeras_comuniones" DROP COLUMN "nombreCompleto";
