-- AlterTable
ALTER TABLE "confirmaciones" ADD COLUMN     "actaBautismo" INTEGER,
ADD COLUMN     "fechaBautismo" TIMESTAMP(3),
ADD COLUMN     "fojaBautismo" INTEGER,
ADD COLUMN     "libroBautismo" TEXT,
ADD COLUMN     "lugarNacimiento" TEXT,
ADD COLUMN     "notasMarginales" TEXT,
ADD COLUMN     "parroquiaBautismo" TEXT,
ADD COLUMN     "sexo" "Sexo";
