-- Índice para el buscador de actas.
--
-- La búsqueda usa `contains`, que en SQL es LIKE '%texto%': ningún índice
-- normal sirve, así que recorre la tabla entera. Con unas cientos de actas es
-- instantáneo, pero digitalizar el archivo histórico de una parroquia son
-- decenas de miles de partidas, y ahí el buscador —lo que más se usa— empieza
-- a arrastrarse.
--
-- Va en un bloque que no interrumpe el despliegue si falla: es una mejora de
-- rendimiento, y una base donde no se pueda crear la extensión debe seguir
-- funcionando (más lenta) en vez de quedarse sin desplegar.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS "actas_textoBusqueda_trgm_idx"
    ON "actas" USING gin ("textoBusqueda" gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear el índice de búsqueda (%). El buscador seguirá funcionando sin él.', SQLERRM;
END $$;
