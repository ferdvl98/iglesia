-- Trazabilidad de la anulación y de la última edición de un acta.
ALTER TABLE "actas" ADD COLUMN "fechaAnulacion" TIMESTAMP(3);
ALTER TABLE "actas" ADD COLUMN "anuladoPorId" TEXT;
ALTER TABLE "actas" ADD COLUMN "actualizadoPorId" TEXT;

ALTER TABLE "actas" ADD CONSTRAINT "actas_anuladoPorId_fkey"
  FOREIGN KEY ("anuladoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actas" ADD CONSTRAINT "actas_actualizadoPorId_fkey"
  FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
