import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { licenciasContratadas } from "./licencias";

describe("tope de licencias", () => {
  const original = process.env.LICENCIAS_USUARIOS;
  beforeEach(() => delete process.env.LICENCIAS_USUARIOS);
  afterEach(() => {
    if (original === undefined) delete process.env.LICENCIAS_USUARIOS;
    else process.env.LICENCIAS_USUARIOS = original;
  });

  it("sin la variable no hay tope", () => {
    expect(licenciasContratadas()).toBeNull();
  });

  it("lee un entero positivo", () => {
    process.env.LICENCIAS_USUARIOS = "10";
    expect(licenciasContratadas()).toBe(10);
  });

  it("falla abierto ante un valor inválido, para no dejar al cliente sin usuarios", () => {
    for (const malo of ["1O", "cinco", "0", "-3", "2.5", "  "]) {
      process.env.LICENCIAS_USUARIOS = malo;
      expect(licenciasContratadas()).toBeNull();
    }
  });
});
