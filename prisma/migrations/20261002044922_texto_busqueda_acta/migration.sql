-- Buscador que ignora acentos y que además encuentra por padres, padrinos y
-- testigos: una sola columna normalizada por acta en vez de seis condiciones OR.
ALTER TABLE "actas" ADD COLUMN "textoBusqueda" TEXT;

-- Relleno de las actas existentes. Se usa translate() en vez de la extensión
-- unaccent para no depender de que esté instalada en la base del cliente.
CREATE OR REPLACE FUNCTION pg_temp.sin_acentos(t TEXT) RETURNS TEXT AS $$
  SELECT lower(translate(coalesce(t, ''),
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'));
$$ LANGUAGE SQL IMMUTABLE;

UPDATE "actas" a SET "textoBusqueda" = trim(regexp_replace(
  pg_temp.sin_acentos(concat_ws(' ',
    b."nombreCompleto", b."nombrePadre", b."nombreMadre", b."padrino", b."madrina")),
  '\s+', ' ', 'g'))
FROM "bautizos" b WHERE b."actaId" = a."id";

UPDATE "actas" a SET "textoBusqueda" = trim(regexp_replace(
  pg_temp.sin_acentos(concat_ws(' ',
    p."nombre", p."apellidos", p."nombrePadre", p."nombreMadre", p."padrino", p."madrina")),
  '\s+', ' ', 'g'))
FROM "primeras_comuniones" p WHERE p."actaId" = a."id";

UPDATE "actas" a SET "textoBusqueda" = trim(regexp_replace(
  pg_temp.sin_acentos(concat_ws(' ',
    c."nombreCompleto", c."nombrePadre", c."nombreMadre", c."padrino", c."madrina")),
  '\s+', ' ', 'g'))
FROM "confirmaciones" c WHERE c."actaId" = a."id";

UPDATE "actas" a SET "textoBusqueda" = trim(regexp_replace(
  pg_temp.sin_acentos(concat_ws(' ',
    m."nombreEsposo", m."nombreEsposa", m."padreEsposo", m."madreEsposo",
    m."padreEsposa", m."madreEsposa", m."testigo1", m."testigo2")),
  '\s+', ' ', 'g'))
FROM "matrimonios" m WHERE m."actaId" = a."id";
