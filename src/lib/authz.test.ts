import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  puedeEscribir,
  puedeConsultarActas,
  puedeVerIngresos,
  puedeUsarPuntoDeVenta,
  puedeAdministrarCatalogo,
  puedeEditarRol,
  puedeAsignarRol,
  filtroIglesia,
  filtroRoles,
  type SesionActiva,
} from "./permisos";

function sesion(extra: Partial<SesionActiva> = {}): SesionActiva {
  return {
    id: "u1",
    esSuperAdmin: false,
    esAdministrador: false,
    rolId: "r1",
    rolNombre: "Capturista",
    permisos: [],
    iglesiaId: "igA",
    iglesiaNombre: "Parroquia A",
    nombre: "Quien Sea",
    email: "quien@sea.local",
    debeCambiarPassword: false,
    ...extra,
  };
}

describe("permisos sueltos", () => {
  it("concede solo lo que el rol tiene", () => {
    const s = sesion({ permisos: ["CONSULTAR_ACTAS"] });
    expect(puedeConsultarActas(s)).toBe(true);
    expect(puedeEscribir(s)).toBe(false);
    expect(puedeVerIngresos(s)).toBe(false);
  });

  it("el rol Administrador los tiene todos sin enumerarlos", () => {
    const s = sesion({ esAdministrador: true, permisos: [] });
    expect(puedeEscribir(s)).toBe(true);
    expect(puedeVerIngresos(s)).toBe(true);
  });

  it("el SUPERADMIN también", () => {
    const s = sesion({ esSuperAdmin: true, permisos: [] });
    expect(puedeEscribir(s)).toBe(true);
  });
});

describe("módulo de punto de venta", () => {
  const original = process.env.MODULO_PUNTO_DE_VENTA;
  beforeEach(() => delete process.env.MODULO_PUNTO_DE_VENTA);
  afterEach(() => {
    if (original === undefined) delete process.env.MODULO_PUNTO_DE_VENTA;
    else process.env.MODULO_PUNTO_DE_VENTA = original;
  });

  it("apagado, ningún permiso lo abre — ni siquiera al SUPERADMIN", () => {
    expect(puedeUsarPuntoDeVenta(sesion({ permisos: ["PUNTO_DE_VENTA"] }))).toBe(false);
    expect(puedeAdministrarCatalogo(sesion({ esSuperAdmin: true }))).toBe(false);
  });

  it("encendido, vuelve a depender del permiso", () => {
    process.env.MODULO_PUNTO_DE_VENTA = "true";
    expect(puedeUsarPuntoDeVenta(sesion({ permisos: ["PUNTO_DE_VENTA"] }))).toBe(true);
    expect(puedeUsarPuntoDeVenta(sesion({ permisos: [] }))).toBe(false);
  });
});

describe("aislamiento entre parroquias", () => {
  it("acota a la parroquia propia", () => {
    expect(filtroIglesia(sesion())).toEqual({ iglesiaId: "igA" });
  });

  it("ignora la parroquia que pida un usuario normal", () => {
    expect(filtroIglesia(sesion(), "igB")).toEqual({ iglesiaId: "igA" });
  });

  it("el SUPERADMIN ve todo, o la que pida", () => {
    expect(filtroIglesia(sesion({ esSuperAdmin: true }))).toEqual({});
    expect(filtroIglesia(sesion({ esSuperAdmin: true }), "igB")).toEqual({ iglesiaId: "igB" });
  });

  it("falla si un usuario normal no tiene parroquia, en vez de devolverlo todo", () => {
    expect(() => filtroIglesia(sesion({ iglesiaId: null }))).toThrow();
  });
});

describe("alcance de los roles", () => {
  const propio = { iglesiaId: "igA" };
  const ajeno = { iglesiaId: "igB" };
  const plantilla = { iglesiaId: null };

  it("se edita el rol propio, no el de otra parroquia ni la plantilla", () => {
    expect(puedeEditarRol(sesion(), propio)).toBe(true);
    expect(puedeEditarRol(sesion(), ajeno)).toBe(false);
    expect(puedeEditarRol(sesion(), plantilla)).toBe(false);
  });

  it("se asigna el propio y la plantilla, nunca el ajeno", () => {
    expect(puedeAsignarRol(sesion(), propio)).toBe(true);
    expect(puedeAsignarRol(sesion(), plantilla)).toBe(true);
    expect(puedeAsignarRol(sesion(), ajeno)).toBe(false);
  });

  it("el SUPERADMIN puede con todos", () => {
    const s = sesion({ esSuperAdmin: true });
    expect(puedeEditarRol(s, ajeno)).toBe(true);
    expect(filtroRoles(s)).toEqual({});
  });

  it("el listado de roles ofrece los propios y las plantillas", () => {
    expect(filtroRoles(sesion())).toEqual({ OR: [{ iglesiaId: "igA" }, { iglesiaId: null }] });
  });
});
