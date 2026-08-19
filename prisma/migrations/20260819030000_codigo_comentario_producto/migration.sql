-- Código de producto para búsqueda rápida y bandera de "requiere comentario"
-- al venderse (ej. mencionar a quién va dedicada una misa).

ALTER TABLE "productos" ADD COLUMN "codigo" TEXT;
ALTER TABLE "productos" ADD COLUMN "requiereComentario" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "productos_iglesiaId_codigo_key" ON "productos"("iglesiaId", "codigo");

ALTER TABLE "venta_items" ADD COLUMN "comentario" TEXT;
