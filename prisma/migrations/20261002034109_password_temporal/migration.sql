-- La contraseña de alta y la que restablece un administrador son temporales:
-- el usuario debe cambiarla antes de poder usar el sistema.
ALTER TABLE "usuarios" ADD COLUMN "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false;
