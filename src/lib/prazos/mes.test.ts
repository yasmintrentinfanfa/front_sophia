import { describe, expect, it } from "vitest";

import {
  diaDaSemana,
  diaPorExtenso,
  mesDe,
  mesVizinho,
  mesmoMes,
  prazosPorDia,
  semanasDoMes,
  tituloDoMes,
} from "@/lib/prazos/mes";

describe("grade do mês", () => {
  it("dezembro de 2026 começa no domingo 29/11 e termina no sábado 02/01 (5 semanas)", () => {
    const semanas = semanasDoMes({ ano: 2026, mes: 12 });
    expect(semanas).toHaveLength(5);
    expect(semanas[0]).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
    ]);
    expect(semanas.at(-1)?.at(-1)).toBe("2027-01-02");
  });

  it("tem de 4 a 6 semanas, sempre de domingo a sábado", () => {
    expect(semanasDoMes({ ano: 2026, mes: 2 })).toHaveLength(4); // 01/02 é domingo e 28/02, sábado
    expect(semanasDoMes({ ano: 2026, mes: 8 })).toHaveLength(6); // 01/08 é sábado
    for (let mes = 1; mes <= 12; mes += 1) {
      for (const semana of semanasDoMes({ ano: 2027, mes })) {
        expect(semana).toHaveLength(7);
        expect(diaDaSemana(semana[0])).toBe(0);
        expect(diaDaSemana(semana[6])).toBe(6);
      }
    }
  });

  it("ano bissexto: fevereiro de 2028 vai até o dia 29", () => {
    const dias = semanasDoMes({ ano: 2028, mes: 2 }).flat();
    expect(dias).toContain("2028-02-29");
    expect(dias).not.toContain("2028-02-30");
  });
});

describe("navegação entre meses", () => {
  it("atravessa a virada do ano nos dois sentidos", () => {
    expect(mesVizinho({ ano: 2026, mes: 12 }, 1)).toEqual({ ano: 2027, mes: 1 });
    expect(mesVizinho({ ano: 2027, mes: 1 }, -1)).toEqual({ ano: 2026, mes: 12 });
    expect(mesVizinho({ ano: 2026, mes: 5 }, -17)).toEqual({ ano: 2024, mes: 12 });
  });

  it("mês de uma data, comparação e título", () => {
    expect(mesDe("2026-12-09")).toEqual({ ano: 2026, mes: 12 });
    expect(mesmoMes(mesDe("2026-12-31"), { ano: 2026, mes: 12 })).toBe(true);
    expect(tituloDoMes({ ano: 2026, mes: 3 })).toBe("Março de 2026");
    expect(diaPorExtenso("2026-12-01")).toBe("Terça-feira, 1 de dezembro de 2026");
  });
});

describe("prazos por dia", () => {
  it("agrupa pela data final, na ordem recebida", () => {
    const dias = prazosPorDia([
      { id: "a", dataFinal: "2026-12-01" },
      { id: "b", dataFinal: "2026-12-02" },
      { id: "c", dataFinal: "2026-12-01" },
    ]);
    expect(dias.get("2026-12-01")?.map((p) => p.id)).toEqual(["a", "c"]);
    expect(dias.get("2026-12-02")?.map((p) => p.id)).toEqual(["b"]);
    expect(dias.get("2026-12-03")).toBeUndefined();
  });
});
