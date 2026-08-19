-- Catálogo de ministros/sacerdotes con datos de contacto, referenciado desde
-- Acta. El campo de texto "ministro" se conserva (ahora como snapshot al
-- momento del registro); "ministroId" es la referencia al catálogo.

CREATE TABLE "ministros" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "titulo" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iglesiaId" TEXT NOT NULL,

    CONSTRAINT "ministros_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ministros_iglesiaId_idx" ON "ministros"("iglesiaId");

ALTER TABLE "ministros" ADD CONSTRAINT "ministros_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "actas" ADD COLUMN "ministroId" TEXT;

ALTER TABLE "actas" ADD CONSTRAINT "actas_ministroId_fkey" FOREIGN KEY ("ministroId") REFERENCES "ministros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
