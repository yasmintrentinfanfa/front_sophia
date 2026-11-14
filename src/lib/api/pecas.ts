/**
 * Minutas de peças processuais geradas pela IA a partir da análise do caso. O catálogo de
 * modelos vem do backend (`backend/analise/modelos_pecas.py`), o mesmo que orienta a IA.
 */

import type { AreaJuridica } from "./areas";
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
  /** Partes da peça (backend `analise/minuta.py`). Minutas antigas só têm `texto`. */
  estrutura?: EstruturaMinuta;
}

export type BlocoMinuta =
  | { tipo: "paragrafo" | "subtitulo"; texto: string }
  | { tipo: "citacao"; texto: string; fonte?: string }
  | { tipo: "lista"; itens: string[] };

export interface EstruturaMinuta {
  enderecamento: string | null;
  referencia: string | null;
  qualificacao: string[];
  titulo: string;
  complemento_titulo: string | null;
  /** Títulos sem numeração: a tela e o .docx numeram em romano (I – DOS FATOS). */
  secoes: { titulo: string; blocos: BlocoMinuta[] }[];
  fecho: { encerramento: string; local_data: string; advogado: string; oab: string };
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

  /** Apaga a minuta do histórico e do banco; o .docx já baixado não é afetado. */
  async excluir(casoId: string, pecaId: string) {
    await requisitarJson<{ ok: boolean }>(`/api/pecas/${encodeURIComponent(pecaId)}${consulta(casoId)}`, {
      method: "DELETE",
    });
  },

  urlDocx(casoId: string, pecaId: string) {
    return `/api/pecas/${encodeURIComponent(pecaId)}/docx${consulta(casoId)}`;
  },
};

/**
 * Grupos de modelos mais úteis para a área jurídica do caso, na ordem de prioridade.
 * `areas` vem do catálogo de `GET /areas` (`src/lib/api/areas.ts`), que já traz `gruposPecas`.
 */
export function gruposSugeridos(areas: AreaJuridica[], area?: string) {
  return (area && areas.find((item) => item.id === area)?.gruposPecas) || [];
}
