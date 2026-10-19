/**
 * Rascunhos de peças processuais gerados a partir do contexto do caso.
 * Nunca uma peça final pronta para protocolo — sempre um rascunho para revisão
 * do advogado (ver Seção 6.5 do documento de contexto do produto).
 *
 * Persistido em localStorage por enquanto, mesmo padrão de `lib/tema.ts` e
 * `lib/destaque.ts`, até existir backend.
 */

export type TipoPeca = "inicial" | "contestacao" | "replica" | "recurso";

export const ROTULO_TIPO_PECA: Record<TipoPeca, string> = {
  inicial: "Petição inicial",
  contestacao: "Contestação",
  replica: "Réplica",
  recurso: "Recurso",
};

export interface PecaGerada {
  id: string;
  tipo: TipoPeca;
  conteudo: string;
  geradaEm: string;
}

function chave(casoId: string) {
  return `sophia-pecas-${casoId}`;
}

export function listarPecas(casoId: string): PecaGerada[] {
  try {
    const bruto = localStorage.getItem(chave(casoId));
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as PecaGerada[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function salvarPeca(casoId: string, tipo: TipoPeca, conteudo: string): PecaGerada {
  const peca: PecaGerada = {
    id: `peca-${Date.now()}`,
    tipo,
    conteudo,
    geradaEm: new Date().toISOString(),
  };
  try {
    const atual = listarPecas(casoId);
    localStorage.setItem(chave(casoId), JSON.stringify([peca, ...atual]));
  } catch {
    /* private mode */
  }
  return peca;
}

/**
 * Rascunho é montado a partir do contexto já mapeado no fluxograma (teses e
 * jurisprudência selecionadas), evitando reconstrução manual do contexto —
 * ver Seção 6.5 do documento de contexto do produto.
 */
export function montarRascunho(params: {
  tipo: TipoPeca;
  caso: { titulo: string; cliente: string };
  teses: string[];
  jurisprudencia: string[];
}): string {
  const { tipo, caso, teses, jurisprudencia } = params;
  const linhas = [
    `${ROTULO_TIPO_PECA[tipo].toUpperCase()} — RASCUNHO`,
    "",
    `Caso: ${caso.titulo}`,
    `Cliente: ${caso.cliente}`,
    "",
    "Teses consideradas:",
    ...teses.map((tese) => `— ${tese}`),
    "",
    "Jurisprudência de apoio:",
    ...jurisprudencia.map((item) => `— ${item}`),
    "",
    "[Rascunho gerado automaticamente a partir da análise preliminar do caso.",
    "Revise todo o conteúdo antes de protocolar — este texto não substitui a checagem humana.]",
  ];
  return linhas.join("\n");
}
