import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion, filtroIglesia, puedeAdministrarUsuarios } from "@/lib/authz";

/**
 * Respaldo del archivo sacramental completo.
 *
 * No es la exportación del listado: esto se lleva todas las actas con el
 * detalle íntegro de cada sacramento, sus correcciones y su historial de
 * impresiones, en JSON. Si se pierde la base, con esto se reconstruye el
 * archivo; un CSV filtrado no serviría para eso.
 *
 * Lo reserva al administrador porque es, literalmente, todo el archivo de la
 * parroquia en un solo archivo descargable.
 */
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!puedeAdministrarUsuarios(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const where = filtroIglesia(sesion);

  const [iglesias, actas] = await Promise.all([
    prisma.iglesia.findMany({
      where: sesion.esSuperAdmin ? {} : { id: sesion.iglesiaId ?? undefined },
    }),
    prisma.acta.findMany({
      where,
      orderBy: [{ tipo: "asc" }, { libro: "asc" }, { numeroActa: "asc" }],
      include: {
        bautizo: true,
        primeraComunion: true,
        confirmacion: true,
        matrimonio: true,
        pagos: true,
        correcciones: { include: { corregidoPor: { select: { nombre: true, email: true } } } },
        impresiones: { include: { impresoPor: { select: { nombre: true } } } },
        creadoPor: { select: { nombre: true, email: true } },
        anuladoPor: { select: { nombre: true, email: true } },
        ministroRegistro: true,
      },
    }),
  ]);

  const respaldo = {
    generadoEl: new Date().toISOString(),
    generadoPor: { nombre: sesion.nombre, email: sesion.email },
    sistema: "Control de Actas Parroquiales",
    version: 1,
    totalActas: actas.length,
    iglesias,
    actas,
  };

  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(respaldo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="respaldo-actas-${fecha}.json"`,
    },
  });
}
