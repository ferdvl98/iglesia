import { describe, it, expect } from "vitest";
import { calcularUbicacion, partidasPorLibro, libroLleno } from "./libro";

/**
 * La ubicación de una partida dentro del libro es el dato que no se puede
 * equivocar: si foja o posición salen mal, el acta queda apuntando a un lugar
 * del tomo físico donde no está.
 */
describe("ubicación de una partida en el libro", () => {
  it("coloca las primeras cuatro partidas en la foja 1", () => {
    expect(calcularUbicacion(1, 4)).toEqual({ foja: 1, posicionEnFoja: 1 });
    expect(calcularUbicacion(2, 4)).toEqual({ foja: 1, posicionEnFoja: 2 });
    expect(calcularUbicacion(3, 4)).toEqual({ foja: 1, posicionEnFoja: 3 });
    expect(calcularUbicacion(4, 4)).toEqual({ foja: 1, posicionEnFoja: 4 });
  });

  it("pasa a la foja siguiente justo después de llenar la anterior", () => {
    expect(calcularUbicacion(5, 4)).toEqual({ foja: 2, posicionEnFoja: 1 });
    expect(calcularUbicacion(8, 4)).toEqual({ foja: 2, posicionEnFoja: 4 });
    expect(calcularUbicacion(9, 4)).toEqual({ foja: 3, posicionEnFoja: 1 });
  });

  it("acierta en partidas altas, como las de una captura histórica", () => {
    // 137 = foja 35 (136/4 = 34 fojas llenas), primera posición
    expect(calcularUbicacion(137, 4)).toEqual({ foja: 35, posicionEnFoja: 1 });
    expect(calcularUbicacion(138, 4)).toEqual({ foja: 35, posicionEnFoja: 2 });
  });

  it("respeta un número de partidas por foja distinto del habitual", () => {
    expect(calcularUbicacion(1, 2)).toEqual({ foja: 1, posicionEnFoja: 1 });
    expect(calcularUbicacion(3, 2)).toEqual({ foja: 2, posicionEnFoja: 1 });
    expect(calcularUbicacion(10, 5)).toEqual({ foja: 2, posicionEnFoja: 5 });
  });
});

describe("capacidad del libro", () => {
  it("multiplica fojas por partidas de cada foja", () => {
    expect(partidasPorLibro(200, 4)).toBe(800);
    expect(partidasPorLibro(100, 2)).toBe(200);
  });

  it("solo da el libro por lleno cuando la partida excede su capacidad", () => {
    expect(libroLleno(800, 200, 4)).toBe(false); // la última que cabe
    expect(libroLleno(801, 200, 4)).toBe(true);
  });
});
