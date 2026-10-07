-- Corregir y anular dejan de ir incluidos en "registrar actas": no es lo mismo
-- capturar una partida que enmendarla o darla de baja, y la parroquia quiere
-- poder confiarle lo primero a alguien sin darle lo segundo.
ALTER TYPE "Permiso" ADD VALUE 'CORREGIR_ACTAS';
ALTER TYPE "Permiso" ADD VALUE 'ANULAR_ACTAS';
