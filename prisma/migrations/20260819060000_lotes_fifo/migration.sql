-- Sistema de lotes con consumo FIFO: cada partida de un ajuste de inventario
-- es un lote con cantidad disponible propia; el ajuste ahora tiene una fecha
-- (distinta de createdAt) que determina el orden de consumo en las ventas.

ALTER TABLE "ajustes_inventario" ADD COLUMN "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "ajustes_inventario_iglesiaId_fecha_idx" ON "ajustes_inventario"("iglesiaId", "fecha");

ALTER TABLE "ajustes_inventario_items" ADD COLUMN "cantidadDisponible" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "ajustes_inventario_items_productoId_cantidadDisponible_idx" ON "ajustes_inventario_items"("productoId", "cantidadDisponible");

CREATE TABLE "venta_item_lotes" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" DOUBLE PRECISION,
    "ventaItemId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,

    CONSTRAINT "venta_item_lotes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "venta_item_lotes" ADD CONSTRAINT "venta_item_lotes_ventaItemId_fkey" FOREIGN KEY ("ventaItemId") REFERENCES "venta_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venta_item_lotes" ADD CONSTRAINT "venta_item_lotes_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "ajustes_inventario_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
