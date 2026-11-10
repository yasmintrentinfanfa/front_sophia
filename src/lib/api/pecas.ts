/**
 * Minutas de peças processuais geradas pela IA a partir da análise do caso. O catálogo de
 * modelos vem do backend (`backend/analise/modelos_pecas.py`), o mesmo que orienta a IA.
 */

import type { AreaJuridica } from "./areas";
import { ErroApi, requisitarJson } from "./conta";

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
  /** Modelo do escritório que orientou a minuta, se houve. */
  modeloEscritorio?: { id: string; nome: string };
}

/** Escopo do modelo do escritório: todas as peças ou o id de um modelo do catálogo. */
export const TODAS_AS_PECAS = "todas";

/** Peça-modelo enviada pelo advogado (backend `analise/modelos_escritorio.py`). */
export interface ModeloEscritorio {
  id: string;
  nome: string;
  aplicaA: string;
  arquivoNome: string;
  tipo: "docx" | "pdf" | "txt";
  /** Enviado em Word: o .docx das minutas sai com o cabeçalho e o rodapé dele. */
  comTimbre: boolean;
  criadoEm: string;
}

/** O modelo que vale para a peça: o específico dela ou, sem ele, o de todas as peças. */
export function modeloEscritorioPara(modelos: ModeloEscritorio[], modeloPecaId: string) {
  return (
    modelos.find((modelo) => modelo.aplicaA === modeloPecaId) ??
    modelos.find((modelo) => modelo.aplicaA === TODAS_AS_PECAS) ??
    null
  );
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

  async gerar(casoId: string, modeloId: string, instrucoes?: string, usarModeloEscritorio = true) {
    const { peca } = await requisitarJson<{ peca: PecaGerada }>("/api/pecas", {
      method: "POST",
      body: JSON.stringify({
        casoId,
        modeloId,
        usarModeloEscritorio,
        ...(instrucoes?.trim() ? { instrucoes: instrucoes.trim() } : {}),
      }),
    });
    return peca;
  },

  urlDocx(casoId: string, pecaId: string) {
    return `/api/pecas/${encodeURIComponent(pecaId)}/docx${consulta(casoId)}`;
  },

  async listarModelosEscritorio() {
    const { modelos } = await requisitarJson<{ modelos: ModeloEscritorio[] }>("/api/modelos-escritorio");
    return modelos;
  },

  /** Envia o arquivo como multipart (sem o Content-Type JSON de `requisitarJson`). */
  async enviarModeloEscritorio(arquivo: File, nome: string, aplicaA: string) {
    const form = new FormData();
    form.append("arquivo", arquivo, arquivo.name);
    form.append("nome", nome.trim());
    form.append("aplicaA", aplicaA);
    let resposta: Response;
    try {
      resposta = await fetch("/api/modelos-escritorio", { method: "POST", body: form, credentials: "include" });
    } catch {
      throw new ErroApi("Não foi possível conectar ao servidor. Verifique sua internet.", 0);
    }
    const corpo = (await resposta.json().catch(() => null)) as { modelo?: ModeloEscritorio; erro?: string } | null;
    if (!resposta.ok || !corpo?.modelo) {
      throw new ErroApi(corpo?.erro ?? "Não foi possível enviar o modelo.", resposta.status);
    }
    return corpo.modelo;
  },

  excluirModeloEscritorio(id: string) {
    return requisitarJson<void>(`/api/modelos-escritorio/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

/**
 * Grupos de modelos mais úteis para a área jurídica do caso, na ordem de prioridade.
 * `areas` vem do catálogo de `GET /areas` (`src/lib/api/areas.ts`), que já traz `gruposPecas`.
 */
export function gruposSugeridos(areas: AreaJuridica[], area?: string) {
  return (area && areas.find((item) => item.id === area)?.gruposPecas) || [];
}
