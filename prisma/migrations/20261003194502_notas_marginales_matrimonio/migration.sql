-- El acta de matrimonio también recibe anotaciones al margen —declaración de
-- nulidad, dispensas—, igual que bautizo y confirmación.
ALTER TABLE "matrimonios" ADD COLUMN "notasMarginales" TEXT;
