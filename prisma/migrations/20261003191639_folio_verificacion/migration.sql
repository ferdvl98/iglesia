-- Folio de verificación: el código impreso en el acta, al que apunta su QR.
ALTER TABLE "actas" ADD COLUMN "folioVerificacion" TEXT;

-- Relleno de las actas existentes con md5, que está siempre disponible: no se
-- usa gen_random_bytes para no depender de la extensión pgcrypto, que no tiene
-- por qué estar instalada en la base de cada cliente.
--
-- El alfabeto aquí es hexadecimal con 0 y 1 cambiados por W y X, porque se
-- confunden con O e I al teclear un folio leído de un papel. Los folios nuevos
-- los genera la aplicación con un alfabeto más amplio; ambos conviven sin
-- problema, porque el folio solo se busca, nunca se valida por formato.
UPDATE "actas" a SET "folioVerificacion" = (
  SELECT upper(
           translate(substr(h, 1, 4), '01', 'WX') || '-' ||
           translate(substr(h, 5, 4), '01', 'WX') || '-' ||
           translate(substr(h, 9, 4), '01', 'WX'))
  FROM (SELECT md5(random()::text || a."id") AS h) t
)
WHERE "folioVerificacion" IS NULL;

CREATE UNIQUE INDEX "actas_folioVerificacion_key" ON "actas"("folioVerificacion");
