/** Paginação das listas longas (prazos, intimações): só o recorte, sem estado de tela. */

export const ITENS_POR_PAGINA = 10;

export interface PaginaDeItens<T> {
  itens: T[];
  /** Página mostrada, já limitada ao intervalo válido (começa em 1). */
  pagina: number;
  totalPaginas: number;
  /** Posição (a partir de 1) do primeiro e do último item mostrado; 0 e 0 com a lista vazia. */
  de: number;
  ate: number;
  total: number;
}

/**
 * Recorta a página pedida. Uma página fora do intervalo cai na mais próxima: se a última
 * página esvaziou (item excluído, filtro trocado), mostra a nova última em vez de nada.
 */
export function paginar<T>(itens: T[], pagina: number, porPagina = ITENS_POR_PAGINA): PaginaDeItens<T> {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const atual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  const recorte = itens.slice(inicio, inicio + porPagina);
  return {
    itens: recorte,
    pagina: atual,
    totalPaginas,
    de: recorte.length ? inicio + 1 : 0,
    ate: inicio + recorte.length,
    total: itens.length,
  };
}

/**
 * Números dos botões de página. Até 7 páginas, todos; acima disso, a primeira, a última e as
 * vizinhas da atual, com "…" no lugar dos saltos. Perto das pontas entram as 5 primeiras (ou
 * últimas), então um "…" sempre esconde pelo menos duas páginas.
 */
export function paginasVisiveis(atual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const escolhidas = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 4) [2, 3, 4, 5].forEach((p) => escolhidas.add(p));
  if (atual >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((p) => escolhidas.add(p));
  const ordenadas = [...escolhidas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const resultado: (number | "…")[] = [];
  for (const pagina of ordenadas) {
    const anterior = resultado.at(-1);
    if (typeof anterior === "number" && pagina - anterior > 1) resultado.push("…");
    resultado.push(pagina);
  }
  return resultado;
}
