import { describe, it, expect } from "vitest";
import { camposDelSacramento, convertirCampo, comoTexto, etiquetaDeCampo } from "./campos-acta";

describe("campos de cada sacramento", () => {
  it("salen del esquema de validación, no de una lista escrita aparte", () => {
    // Si se escribieran aparte, una corrección borraría en silencio los campos
    // que no conociera. Esta prueba falla si alguien los desconecta.
    expect(camposDelSacramento("BAUTIZO")).toContain("nombreCompleto");
    expect(camposDelSacramento("MATRIMONIO")).toContain("nombreEsposa");
    expect(camposDelSacramento("CONFIRMACION")).toContain("obispoMinistro");
  });

  it("nunca incluye los campos que viven en el acta", () => {
    for (const tipo of ["BAUTIZO", "PRIMERA_COMUNION", "CONFIRMACION", "MATRIMONIO"] as const) {
      for (const base of ["libro", "fecha", "lugar", "ministro", "observaciones"]) {
        expect(camposDelSacramento(tipo)).not.toContain(base);
      }
    }
  });
});

describe("conversión de lo que llega del formulario", () => {
  it("recorta el texto y conserva los obligatorios aunque vengan vacíos", () => {
    expect(convertirCampo("nombreCompleto", "  José  ")).toBe("José");
    expect(convertirCampo("nombreCompleto", "")).toBe("");
  });

  it("deja en nulo los opcionales vacíos, para no guardar cadenas vacías", () => {
    expect(convertirCampo("padrino", "")).toBeNull();
    expect(convertirCampo("padrino", "   ")).toBeNull();
  });

  it("convierte fechas y enteros", () => {
    expect(comoTexto(convertirCampo("fechaNacimiento", "1985-03-10"))).toBe("1985-03-10");
    expect(convertirCampo("edadEsposo", "28")).toBe(28);
  });

  it("descarta un entero no numérico en vez de guardar basura", () => {
    expect(convertirCampo("edadEsposo", "veintiocho")).toBeNull();
  });

  it("solo admite los dos valores de sexo", () => {
    expect(convertirCampo("sexo", "FEMENINO")).toBe("FEMENINO");
    expect(convertirCampo("sexo", "OTRO")).toBeNull();
  });
});

describe("etiquetas para la exportación", () => {
  it("usa el nombre que entiende una persona", () => {
    expect(etiquetaDeCampo("nombreCompleto")).toBe("Nombre completo");
    expect(etiquetaDeCampo("fechaNacimientoEsposa")).toBe("Fecha de nacimiento de la esposa");
  });

  it("inventa una legible si el campo es nuevo, en vez del identificador crudo", () => {
    expect(etiquetaDeCampo("algunCampoNuevo")).toBe("Algun campo nuevo");
  });
});
