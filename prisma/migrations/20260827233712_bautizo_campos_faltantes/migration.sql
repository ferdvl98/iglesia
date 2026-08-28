-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- AlterTable
ALTER TABLE "bautizos" ADD COLUMN     "domicilio" TEXT,
ADD COLUMN     "notasMarginales" TEXT,
ADD COLUMN     "sexo" "Sexo";
