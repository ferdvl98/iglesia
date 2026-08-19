-- Transferencia de inventario entre iglesias: otra forma (junto al ajuste)
-- de mover stock de productos, descontando lotes elegidos a mano en el
-- origen y generando lotes nuevos con el mismo costo en el destino.

CREATE TABLE "transferencias_inventario" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iglesiaOrigenId" TEXT NOT NULL,
    "iglesiaDestinoId" TEXT NOT NULL,
    "realizadoPorId" TEXT,

    CONSTRAINT "transferencias_inventario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transferencias_inventario_iglesiaOrigenId_idx" ON "transferencias_inventario"("iglesiaOrigenId");
CREATE INDEX "transferencias_inventario_iglesiaDestinoId_idx" ON "transferencias_inventario"("iglesiaDestinoId");

ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_iglesiaOrigenId_fkey" FOREIGN KEY ("iglesiaOrigenId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_iglesiaDestinoId_fkey" FOREIGN KEY ("iglesiaDestinoId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transferencias_inventario" ADD CONSTRAINT "transferencias_inventario_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "transferencias_inventario_items" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "productoOrigenId" TEXT NOT NULL,
    "productoDestinoId" TEXT NOT NULL,

    CONSTRAINT "transferencias_inventario_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "transferencias_inventario_items" ADD CONSTRAINT "transferencias_inventario_items_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "transferencias_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transferencias_inventario_items" ADD CONSTRAINT "transferencias_inventario_items_productoOrigenId_fkey" FOREIGN KEY ("productoOrigenId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transferencias_inventario_items" ADD CONSTRAINT "transferencias_inventario_items_productoDestinoId_fkey" FOREIGN KEY ("productoDestinoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "transferencia_lotes" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "loteOrigenId" TEXT NOT NULL,
    "loteDestinoId" TEXT NOT NULL,

    CONSTRAINT "transferencia_lotes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "transferencia_lotes" ADD CONSTRAINT "transferencia_lotes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "transferencias_inventario_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transferencia_lotes" ADD CONSTRAINT "transferencia_lotes_loteOrigenId_fkey" FOREIGN KEY ("loteOrigenId") REFERENCES "ajustes_inventario_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transferencia_lotes" ADD CONSTRAINT "transferencia_lotes_loteDestinoId_fkey" FOREIGN KEY ("loteDestinoId") REFERENCES "ajustes_inventario_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
