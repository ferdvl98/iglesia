-- Registro de cobros (tipo punto de venta) por registro o reimpresión de acta.

CREATE TYPE "ConceptoPago" AS ENUM ('REGISTRO', 'REIMPRESION');
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "concepto" "ConceptoPago" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actaId" TEXT NOT NULL,
    "cobradoPorId" TEXT,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pagos_actaId_idx" ON "pagos"("actaId");

ALTER TABLE "pagos" ADD CONSTRAINT "pagos_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cobradoPorId_fkey" FOREIGN KEY ("cobradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
