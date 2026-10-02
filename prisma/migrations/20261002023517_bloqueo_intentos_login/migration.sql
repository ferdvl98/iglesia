-- Freno a la fuerza bruta en el inicio de sesión.
ALTER TABLE "usuarios" ADD COLUMN "intentosFallidos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN "bloqueadoHasta" TIMESTAMP(3);
