-- Catálogo de productos/servicios y registro de ventas (punto de venta).

CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iglesiaId" TEXT NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "productos_iglesiaId_idx" ON "productos"("iglesiaId");

CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iglesiaId" TEXT NOT NULL,
    "vendidoPorId" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ventas_iglesiaId_idx" ON "ventas"("iglesiaId");

CREATE TABLE "venta_items" (
    "id" TEXT NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT,

    CONSTRAINT "venta_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "productos" ADD CONSTRAINT "productos_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendidoPorId_fkey" FOREIGN KEY ("vendidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
