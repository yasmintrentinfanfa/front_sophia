/**
 * Minutas de peças processuais geradas pela IA a partir da análise do caso. O catálogo de
 * modelos vem do backend (`backend/analise/modelos_pecas.py`), o mesmo que orienta a IA.
 */

import { requisitarJson } from "./conta";

export type FasePeca =
  | "inicial"
  | "defesa"
  | "manifestacao"
  | "urgencia"
  | "recurso"
  | "execucao"
  | "extrajudicial";

export interface ModeloPeca {
  id: string;
  nome: string;
  grupo: string;
  fase: FasePeca;
  descricao: string;
  quandoUsar: string;
  baseLegal: string[];
  /** Prazo de referência para o advogado conferir. */
  prazo: string | null;
  secoes: string[];
}

export interface CatalogoPecas {
  modelos: ModeloPeca[];
  /** id do grupo → rótulo ("civel" → "Cível e processo civil"). */
  grupos: Record<string, string>;
  fases: Record<FasePeca, string>;
}

export interface PecaGerada {
  id: string;
  modeloId: string;
  titulo: string;
  geradaEm: string;
  analiseVersao?: number | null;
  instrucoes?: string;
  /** Ausente na listagem; vem ao abrir a minuta. */
  texto?: string;
}

const consulta = (casoId: string) => `?casoId=${encodeURIComponent(casoId)}`;

export const pecasApi = {
  obterCatalogo() {
    return requisitarJson<CatalogoPecas>("/api/pecas/modelos");
  },

  async listar(casoId: string) {
    const { pecas } = await requisitarJson<{ pecas: PecaGerada[] }>(`/api/pecas${consulta(casoId)}`);
    return pecas;
  },

  async obter(casoId: string, pecaId: string) {
    const { peca } = await requisitarJson<{ peca: PecaGerada }>(
      `/api/pecas/${encodeURIComponent(pecaId)}${consulta(casoId)}`,
    );
    return peca;
  },

  async gerar(casoId: string, modeloId: string, instrucoes?: string) {
    const { peca } = await requisitarJson<{ peca: PecaGerada }>("/api/pecas", {
      method: "POST",
      body: JSON.stringify({ casoId, modeloId, ...(instrucoes?.trim() ? { instrucoes: instrucoes.trim() } : {}) }),
    });
    return peca;
  },

  urlDocx(casoId: string, pecaId: string) {
    return `/api/pecas/${encodeURIComponent(pecaId)}/docx${consulta(casoId)}`;
  },
};

/** Grupos de modelos mais úteis para a área jurídica do caso, na ordem de prioridade. */
const GRUPOS_POR_AREA: Record<string, string[]> = {
  civil: ["civel", "juizados"],
  "familia-sucessoes": ["familia", "civel"],
  trabalhista: ["trabalhista"],
  previdenciario: ["previdenciario"],
  consumidor: ["juizados", "civel"],
  empresarial: ["civel", "extrajudicial"],
  tributario: ["tributario", "administrativo"],
  penal: ["penal"],
  administrativo: ["administrativo"],
  imobiliario: ["civel", "extrajudicial"],
  ambiental: ["administrativo", "civel"],
  digital: ["civel", "juizados"],
};

export function gruposSugeridos(area?: string) {
  return (area && GRUPOS_POR_AREA[area]) || [];
}
