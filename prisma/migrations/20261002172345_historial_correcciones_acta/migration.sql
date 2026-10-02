-- Historial de correcciones: qué campos cambiaron, qué decían antes, quién y cuándo.
CREATE TABLE "correcciones_acta" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cambios" JSONB NOT NULL,
    "motivo" TEXT,
    "actaId" TEXT NOT NULL,
    "corregidoPorId" TEXT,
    CONSTRAINT "correcciones_acta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "correcciones_acta_actaId_idx" ON "correcciones_acta"("actaId");

ALTER TABLE "correcciones_acta" ADD CONSTRAINT "correcciones_acta_actaId_fkey"
  FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "correcciones_acta" ADD CONSTRAINT "correcciones_acta_corregidoPorId_fkey"
  FOREIGN KEY ("corregidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
