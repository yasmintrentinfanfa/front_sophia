import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gravarTutorialVisto, viuTutorial } from "@/lib/tutorial";

describe("tutorial de primeiro acesso", () => {
  beforeEach(() => {
    const dados = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (chave: string) => dados.get(chave) ?? null,
      setItem: (chave: string, valor: string) => void dados.set(chave, valor),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre para quem nunca viu e fica marcado só para aquele usuário", () => {
    expect(viuTutorial("ana")).toBe(false);
    gravarTutorialVisto("ana");
    expect(viuTutorial("ana")).toBe(true);
    expect(viuTutorial("bruno")).toBe(false);
  });

  it("sem acesso ao armazenamento não insiste em abrir a cada tela", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(viuTutorial("ana")).toBe(true);
    expect(() => gravarTutorialVisto("ana")).not.toThrow();
  });
});
