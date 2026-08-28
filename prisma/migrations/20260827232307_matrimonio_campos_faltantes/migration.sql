-- AlterTable
ALTER TABLE "ajustes_inventario_items" ALTER COLUMN "cantidadDisponible" DROP DEFAULT;

-- AlterTable
ALTER TABLE "matrimonios" ADD COLUMN     "domicilioEsposa" TEXT,
ADD COLUMN     "domicilioEsposo" TEXT,
ADD COLUMN     "edadEsposa" INTEGER,
ADD COLUMN     "edadEsposo" INTEGER,
ADD COLUMN     "estadoCivilEsposa" TEXT,
ADD COLUMN     "estadoCivilEsposo" TEXT,
ADD COLUMN     "lugarTramite" TEXT,
ADD COLUMN     "origenEsposa" TEXT,
ADD COLUMN     "origenEsposo" TEXT;
