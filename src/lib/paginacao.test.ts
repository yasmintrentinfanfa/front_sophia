import { describe, expect, it } from "vitest";

import { ITENS_POR_PAGINA, paginar, paginasVisiveis } from "@/lib/paginacao";

const lista = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("paginar", () => {
  it("mostra 10 por página", () => {
    expect(ITENS_POR_PAGINA).toBe(10);
    const primeira = paginar(lista(27), 1);
    expect(primeira.itens).toEqual(lista(10));
    expect(primeira).toMatchObject({ pagina: 1, totalPaginas: 3, de: 1, ate: 10, total: 27 });

    const ultima = paginar(lista(27), 3);
    expect(ultima.itens).toEqual([21, 22, 23, 24, 25, 26, 27]);
    expect(ultima).toMatchObject({ pagina: 3, de: 21, ate: 27 });
  });

  it("página que deixou de existir cai na última (item excluído, filtro trocado)", () => {
    const depois = paginar(lista(20), 3);
    expect(depois.pagina).toBe(2);
    expect(depois.itens).toEqual(lista(20).slice(10));
  });

  it("página inválida vira a primeira; lista vazia tem uma página sem itens", () => {
    expect(paginar(lista(15), 0).pagina).toBe(1);
    expect(paginar(lista(15), Number.NaN).pagina).toBe(1);
    expect(paginar([], 4)).toEqual({ itens: [], pagina: 1, totalPaginas: 1, de: 0, ate: 0, total: 0 });
  });

  it("até 10 itens é uma página só", () => {
    expect(paginar(lista(10), 1).totalPaginas).toBe(1);
    expect(paginar(lista(11), 1).totalPaginas).toBe(2);
  });
});

describe("paginasVisiveis", () => {
  it("até 7 páginas mostra todas", () => {
    expect(paginasVisiveis(1, 1)).toEqual([1]);
    expect(paginasVisiveis(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("acima de 7 encurta com reticências em volta da atual", () => {
    expect(paginasVisiveis(1, 20)).toEqual([1, 2, 3, 4, 5, "…", 20]);
    expect(paginasVisiveis(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    expect(paginasVisiveis(20, 20)).toEqual([1, "…", 16, 17, 18, 19, 20]);
  });

  it("em qualquer tamanho: tem a primeira, a última e a atual, e cada … esconde 2+ páginas", () => {
    for (let total = 8; total <= 40; total++) {
      for (let atual = 1; atual <= total; atual++) {
        const paginas = paginasVisiveis(atual, total);
        expect(paginas).toContain(1);
        expect(paginas).toContain(total);
        expect(paginas).toContain(atual);
        expect(paginas.length).toBeLessThanOrEqual(9);
        paginas.forEach((p, i) => {
          if (p !== "…") return;
          expect((paginas[i + 1] as number) - (paginas[i - 1] as number)).toBeGreaterThanOrEqual(3);
        });
      }
    }
  });
});
