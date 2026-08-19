-- Nuevo permiso delegable ADMINISTRAR_MINISTROS (catálogo de sacerdotes),
-- antes implícito dentro de REGISTRAR_ACTAS. Se agrega al rol Capturista
-- (que ya podía hacerlo) y al rol Administrador (aunque este último ya lo
-- tiene automáticamente vía esAdministrador en el código).

ALTER TYPE "Permiso" ADD VALUE 'ADMINISTRAR_MINISTROS';
