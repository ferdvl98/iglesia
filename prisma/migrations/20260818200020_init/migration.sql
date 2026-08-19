-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPERADMIN', 'ADMIN_IGLESIA', 'CAPTURISTA', 'CONSULTA');

-- CreateEnum
CREATE TYPE "TipoActa" AS ENUM ('BAUTIZO', 'PRIMERA_COMUNION', 'CONFIRMACION', 'MATRIMONIO');

-- CreateTable
CREATE TABLE "iglesias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "diocesis" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "estado" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'México',
    "telefono" TEXT,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iglesias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iglesiaId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoActa" NOT NULL,
    "numeroActa" TEXT NOT NULL,
    "libro" TEXT,
    "folio" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "ministro" TEXT,
    "observaciones" TEXT,
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "motivoAnulacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "iglesiaId" TEXT NOT NULL,
    "creadoPorId" TEXT,

    CONSTRAINT "actas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bautizos" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "lugarNacimiento" TEXT,
    "nombrePadre" TEXT,
    "nombreMadre" TEXT,
    "padrino" TEXT,
    "madrina" TEXT,

    CONSTRAINT "bautizos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primeras_comuniones" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "nombrePadre" TEXT,
    "nombreMadre" TEXT,
    "padrino" TEXT,
    "madrina" TEXT,
    "catequista" TEXT,

    CONSTRAINT "primeras_comuniones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmaciones" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "nombrePadre" TEXT,
    "nombreMadre" TEXT,
    "padrino" TEXT,
    "madrina" TEXT,
    "obispoMinistro" TEXT,

    CONSTRAINT "confirmaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrimonios" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "nombreEsposo" TEXT NOT NULL,
    "fechaNacimientoEsposo" TIMESTAMP(3),
    "padreEsposo" TEXT,
    "madreEsposo" TEXT,
    "nombreEsposa" TEXT NOT NULL,
    "fechaNacimientoEsposa" TIMESTAMP(3),
    "padreEsposa" TEXT,
    "madreEsposa" TEXT,
    "testigo1" TEXT,
    "testigo2" TEXT,
    "actaCivilNumero" TEXT,

    CONSTRAINT "matrimonios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "actas_iglesiaId_tipo_idx" ON "actas"("iglesiaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "actas_iglesiaId_tipo_numeroActa_key" ON "actas"("iglesiaId", "tipo", "numeroActa");

-- CreateIndex
CREATE UNIQUE INDEX "bautizos_actaId_key" ON "bautizos"("actaId");

-- CreateIndex
CREATE UNIQUE INDEX "primeras_comuniones_actaId_key" ON "primeras_comuniones"("actaId");

-- CreateIndex
CREATE UNIQUE INDEX "confirmaciones_actaId_key" ON "confirmaciones"("actaId");

-- CreateIndex
CREATE UNIQUE INDEX "matrimonios_actaId_key" ON "matrimonios"("actaId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actas" ADD CONSTRAINT "actas_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "iglesias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actas" ADD CONSTRAINT "actas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bautizos" ADD CONSTRAINT "bautizos_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primeras_comuniones" ADD CONSTRAINT "primeras_comuniones_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmaciones" ADD CONSTRAINT "confirmaciones_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonios" ADD CONSTRAINT "matrimonios_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "actas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
