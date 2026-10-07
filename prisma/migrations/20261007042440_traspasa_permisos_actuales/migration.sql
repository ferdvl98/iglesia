-- Quien hoy puede registrar actas ya podía corregirlas y anularlas, así que
-- conserva ambas cosas: el despliegue no le quita capacidades a nadie de golpe.
--
-- Lo que cambia es que ahora la parroquia puede retirárselas a quien no deba
-- tenerlas, que es justamente lo que pidió. Va en una migración aparte porque
-- Postgres no permite usar un valor de enum en la misma transacción que lo creó.
UPDATE "roles"
SET "permisos" = "permisos" || ARRAY['CORREGIR_ACTAS', 'ANULAR_ACTAS']::"Permiso"[]
WHERE 'REGISTRAR_ACTAS' = ANY("permisos")
  AND NOT ('CORREGIR_ACTAS' = ANY("permisos"));
