-- Reorganiza el registro de actas según el archivo físico parroquial:
-- cada libro numera sus partidas de forma continua, y cada foja contiene
-- 4 partidas. `foja` y `posicionEnFoja` se calculan a partir de `numeroActa`.

-- DropIndex
DROP INDEX IF EXISTS "actas_iglesiaId_tipo_numeroActa_key";

-- AlterTable: numeroActa pasa de texto libre a entero (número de partida
-- continuo dentro del libro); libro deja de ser opcional; folio se
-- reemplaza por foja + posicionEnFoja (calculados).
ALTER TABLE "actas"
  ALTER COLUMN "numeroActa" TYPE INTEGER USING ("numeroActa"::integer),
  ALTER COLUMN "libro" SET NOT NULL,
  DROP COLUMN IF EXISTS "folio",
  ADD COLUMN "foja" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "posicionEnFoja" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "actas" ALTER COLUMN "foja" DROP DEFAULT;
ALTER TABLE "actas" ALTER COLUMN "posicionEnFoja" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "actas_iglesiaId_tipo_libro_numeroActa_key" ON "actas"("iglesiaId", "tipo", "libro", "numeroActa");

-- CreateIndex
CREATE INDEX "actas_iglesiaId_tipo_libro_foja_idx" ON "actas"("iglesiaId", "tipo", "libro", "foja");
