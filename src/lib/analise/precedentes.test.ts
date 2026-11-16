import { describe, expect, it } from "vitest";

import type { Insight } from "@/lib/api/analise";
import { agruparPorNivel, nivelDoInsight, rotuloDoPrecedente } from "@/lib/analise/precedentes";

function insight(parcial: Partial<Insight>): Insight {
  return {
    id: "i",
    categoria: "tema_superior",
    titulo: "t",
    detalhe: "d",
    relevancia: "media",
    fontes: [],
    ...parcial,
  };
}

describe("precedentes da análise", () => {
  it("usa o nível que o backend mandou", () => {
    expect(nivelDoInsight(insight({ nivel: "N3", tribunal: "STF" }))).toBe("N3");
  });

  it("deduz o nível em análises antigas", () => {
    expect(nivelDoInsight(insight({ fontes: [{ tribunal: "STF", identificador: "Tema 709" }] }))).toBe("N1");
    expect(nivelDoInsight(insight({ titulo: "Súmula 385 do STJ", fontes: [{ tribunal: "STJ", identificador: "" }] }))).toBe("N2");
    expect(nivelDoInsight(insight({ fontes: [{ tribunal: "TNU", identificador: "Tema 174" }] }))).toBe("N2");
    expect(nivelDoInsight(insight({ tribunal: "TRF4" }))).toBe("N3");
    expect(nivelDoInsight(insight({ tribunal: "TJPR" }))).toBe("N3");
  });

  it("agrupa nas três abas e monta o rótulo do card", () => {
    const grupos = agruparPorNivel([
      insight({ id: "a", nivel: "N1" }),
      insight({ id: "b", nivel: "N2" }),
      insight({ id: "c", nivel: "N1" }),
    ]);
    expect(grupos.N1.map((i) => i.id)).toEqual(["a", "c"]);
    expect(grupos.N3).toEqual([]);
    expect(rotuloDoPrecedente(insight({ tribunal: "STJ", identificador: "Tema 1124" }))).toBe("STJ · Tema 1124");
    expect(rotuloDoPrecedente(insight({ fontes: [{ tribunal: "Fonte citada", identificador: "x" }] }))).toBe("");
  });
});
