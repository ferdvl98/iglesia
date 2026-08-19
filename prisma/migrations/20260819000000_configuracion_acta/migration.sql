-- Configuración por iglesia y tipo de acta: tamaño de libro (fojas/partidas)
-- y precios de registro y reimpresión.

CREATE TABLE "configuraciones_acta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoActa" NOT NULL,
    "fojasPorLibro" INTEGER NOT NULL DEFAULT 200,
    "partidasPorFoja" INTEGER NOT NULL DEFAULT 4,
    "precioRegistro" DOUBLE PRECISION,
    "precioReimpresion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iglesiaId" TEXT NOT NULL,

    CONSTRAINT "configuraciones_acta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "configuraciones_acta_iglesiaId_tipo_key" ON "configuraciones_acta"("iglesiaId", "tipo");

ALTER TABLE "configuraciones_acta" ADD CONSTRAINT "configuraciones_acta_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
