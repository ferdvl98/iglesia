-- Distingue productos (con inventario) de servicios (sin inventario) y agrega
-- el historial de ajustes de inventario (quién y cuándo agregó existencias).

CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO', 'SERVICIO');

ALTER TABLE "productos" ADD COLUMN "tipo" "TipoProducto" NOT NULL DEFAULT 'SERVICIO';
ALTER TABLE "productos" ADD COLUMN "stock" INTEGER;

CREATE TABLE "ajustes_inventario" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productoId" TEXT NOT NULL,
    "realizadoPorId" TEXT,

    CONSTRAINT "ajustes_inventario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ajustes_inventario_productoId_idx" ON "ajustes_inventario"("productoId");

ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
