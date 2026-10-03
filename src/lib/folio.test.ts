import { describe, it, expect } from "vitest";
import { generarFolio, normalizarFolio } from "./folio";

describe("folio de verificación", () => {
  it("usa el formato impreso en el acta", () => {
    expect(generarFolio()).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });

  it("nunca usa caracteres que se confunden al teclearlo de un papel", () => {
    const juntos = Array.from({ length: 2000 }, generarFolio).join("");
    for (const confuso of ["0", "1", "I", "L", "O"]) {
      expect(juntos).not.toContain(confuso);
    }
  });

  it("no repite en diez mil", () => {
    const todos = new Set(Array.from({ length: 10000 }, generarFolio));
    expect(todos.size).toBe(10000);
  });
});

describe("folio tecleado a mano", () => {
  it("acepta minúsculas, sin guiones y con espacios", () => {
    expect(normalizarFolio("7bd7-7faf-4e6f")).toBe("7BD7-7FAF-4E6F");
    expect(normalizarFolio("7BD77FAF4E6F")).toBe("7BD7-7FAF-4E6F");
    expect(normalizarFolio("  7BD7 7FAF 4E6F ")).toBe("7BD7-7FAF-4E6F");
  });

  it("no inventa correcciones: una O no se vuelve Q", () => {
    // Adivinar erratas podría convertir un folio inexistente en el de otra acta.
    expect(normalizarFolio("OOOO-OOOO-OOOO")).toBe("OOOO-OOOO-OOOO");
  });
});
