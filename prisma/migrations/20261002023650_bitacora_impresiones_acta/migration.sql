-- Bitácora de impresiones del acta: deja rastro aunque la reimpresión sea
-- gratuita o se llegue al PDF por URL directa.
CREATE TABLE "impresiones_acta" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actaId" TEXT NOT NULL,
    "impresoPorId" TEXT,
    CONSTRAINT "impresiones_acta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "impresiones_acta_actaId_idx" ON "impresiones_acta"("actaId");

ALTER TABLE "impresiones_acta" ADD CONSTRAINT "impresiones_acta_actaId_fkey"
  FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "impresiones_acta" ADD CONSTRAINT "impresiones_acta_impresoPorId_fkey"
  FOREIGN KEY ("impresoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
