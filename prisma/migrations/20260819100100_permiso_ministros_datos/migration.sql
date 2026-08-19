-- Otorga el nuevo permiso ADMINISTRAR_MINISTROS a los roles que ya podían
-- hacerlo antes de que existiera como permiso independiente.

UPDATE "roles"
SET "permisos" = array_append("permisos", 'ADMINISTRAR_MINISTROS'::"Permiso")
WHERE "nombre" IN ('Administrador', 'Capturista')
  AND NOT ('ADMINISTRAR_MINISTROS'::"Permiso" = ANY("permisos"));
