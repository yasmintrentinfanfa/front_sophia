import { describe, expect, it } from "vitest";

import type { Caso } from "@/lib/api/types";
import { destinoDoCaso, estaNoRepositorio } from "@/lib/casos/destino";

const caso = { id: "caso-b" } as Caso;

describe("destinoDoCaso", () => {
  it("em Casos em análise, abre a análise do caso", () => {
    expect(destinoDoCaso(caso)).toBe("/casos/caso-b/analise");
    expect(destinoDoCaso(caso, "/casos")).toBe("/casos/caso-b/analise");
    expect(destinoDoCaso(caso, "/casos/caso-a/analise")).toBe("/casos/caso-b/analise");
    expect(destinoDoCaso(caso, "/casos/caso-a/chat")).toBe("/casos/caso-b/analise");
    expect(destinoDoCaso(caso, "/casos/caso-a/pecas")).toBe("/casos/caso-b/analise");
  });

  it("no repositório, troca de caso sem sair da tela", () => {
    expect(destinoDoCaso(caso, "/casos/caso-a/repositorio")).toBe("/casos/caso-b/repositorio");
    expect(destinoDoCaso(caso, "/casos/caso-a/sessao")).toBe("/casos/caso-b/repositorio");
    expect(destinoDoCaso(caso, "/casos/caso-a/repositorio/materiais")).toBe("/casos/caso-b/repositorio/materiais");
  });
});

describe("estaNoRepositorio", () => {
  it("reconhece as telas do repositório e mais nenhuma", () => {
    expect(estaNoRepositorio("/casos/x/repositorio")).toBe(true);
    expect(estaNoRepositorio("/casos/x/repositorio/materiais")).toBe(true);
    expect(estaNoRepositorio("/casos/x/sessao")).toBe(true);
    expect(estaNoRepositorio("/casos/x/analise")).toBe(false);
    expect(estaNoRepositorio("/casos/arquivo")).toBe(false);
  });
});
