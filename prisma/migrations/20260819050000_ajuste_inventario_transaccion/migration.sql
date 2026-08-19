-- Rediseña el ajuste de inventario como una transacción con encabezado
-- (iglesia obligatoria, comentario, quién y cuándo) y varias partidas
-- (producto, cantidad, precio de compra y de venta).

DROP TABLE IF EXISTS "ajustes_inventario";

CREATE TABLE "ajustes_inventario" (
    "id" TEXT NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iglesiaId" TEXT NOT NULL,
    "realizadoPorId" TEXT,

    CONSTRAINT "ajustes_inventario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ajustes_inventario_iglesiaId_idx" ON "ajustes_inventario"("iglesiaId");

ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ajustes_inventario_items" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioCompra" DOUBLE PRECISION,
    "precioVenta" DOUBLE PRECISION,
    "ajusteId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "ajustes_inventario_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ajustes_inventario_items" ADD CONSTRAINT "ajustes_inventario_items_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "ajustes_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ajustes_inventario_items" ADD CONSTRAINT "ajustes_inventario_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
