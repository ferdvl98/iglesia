import { describe, it, expect } from "vitest";
import { normalizar, textoBusquedaDeDetalle } from "./busqueda";

describe("normalización para buscar", () => {
  it("quita acentos y baja a minúsculas", () => {
    expect(normalizar("José Muñoz Pérez")).toBe("jose munoz perez");
    expect(normalizar("MARÍA DOLORES")).toBe("maria dolores");
  });

  it("colapsa espacios y recorta", () => {
    expect(normalizar("  Juan   Carlos  ")).toBe("juan carlos");
  });

  it("deja igual lo que ya está normalizado, para que buscar sea simétrico", () => {
    expect(normalizar(normalizar("Ángel Ñuño"))).toBe(normalizar("Ángel Ñuño"));
  });
});

describe("texto de búsqueda de un acta", () => {
  it("incluye al titular y también a padres y padrinos", () => {
    const t = textoBusquedaDeDetalle({
      bautizo: {
        create: {
          nombreCompleto: "José Muñoz",
          nombrePadre: "Andrés Muñoz",
          nombreMadre: "María Ramírez",
          padrino: "Pedro Solís",
          madrina: "Ana Cruz",
        },
      },
    } as never);
    for (const quien of ["jose munoz", "andres munoz", "maria ramirez", "pedro solis", "ana cruz"]) {
      expect(t).toContain(quien);
    }
  });

  it("junta nombre y apellidos de una primera comunión", () => {
    const t = textoBusquedaDeDetalle({
      primeraComunion: { create: { nombre: "Ana", apellidos: "Gómez Ruiz" } },
    } as never);
    expect(t).toContain("ana gomez ruiz");
  });

  it("recoge a los dos contrayentes y a los testigos", () => {
    const t = textoBusquedaDeDetalle({
      matrimonio: {
        create: { nombreEsposo: "Luis Á.", nombreEsposa: "Rosa Ñ.", testigo1: "Juan Pérez" },
      },
    } as never);
    expect(t).toContain("luis a.");
    expect(t).toContain("rosa n.");
    expect(t).toContain("juan perez");
  });

  it("omite los campos vacíos en vez de dejar huecos", () => {
    const t = textoBusquedaDeDetalle({
      bautizo: { create: { nombreCompleto: "Ana", nombrePadre: null, padrino: "" } },
    } as never);
    expect(t).toBe("ana");
  });
});
