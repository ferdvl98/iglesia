-- Los reportes de ingresos dejan de ser visibles para cualquier usuario con
-- sesión y pasan a depender de un permiso asignable por rol.
ALTER TYPE "Permiso" ADD VALUE 'VER_INGRESOS';
