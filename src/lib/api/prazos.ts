/**
 * Acompanhamento de prazos: intimações do DJEN (CNJ) por OAB ou número do processo e os
 * prazos que o advogado agenda. Tudo passa pelas rotas `/api/prazos/*` do Next, que leem o
 * dono do cookie; nenhuma chamada manda id de usuário. Backend: `backend/prazos`.
 */

import { requisitarJson } from "./conta";

export type TipoMonitoramento = "oab" | "processo";
export type SituacaoPublicacao = "pendente" | "agendada" | "sem_prazo";

export interface Monitoramento {
  id: string;
  tipo: TipoMonitoramento;
  oabNumero: string | null;
  oabUf: string | null;
  /** 20 dígitos, sem máscara. */
  numeroProcesso: string | null;
  /** Caso da Sophia ligado ao processo. Opcional: nenhum caso precisa ter processo. */
  casoId: string | null;
  criadoEm: string;
  ultimaSincronizacao: string | null;
  ultimoErro: string | null;
}

export interface Publicacao {
  id: string;
  djenId: number;
  /** Dia em que a intimação saiu no DJEN ("AAAA-MM-DD"). */
  dataDisponibilizacao: string;
  tribunal: string;
  orgao: string;
  tipoComunicacao: string;
  tipoDocumento: string;
  classe: string;
  numeroProcesso: string;
  /** Teor já sem HTML. No painel vem resumido quando `textoTruncado`; o inteiro teor sai de `obterPublicacao`. */
  texto: string;
  textoTruncado: boolean;
  /** Documento no sistema do tribunal, quando o DJEN informa. */
  link: string | null;
  advogados: { nome: string; oab: string; uf: string }[];
  partes: { nome: string; polo: string }[];
  situacao: SituacaoPublicacao;
  cancelada: boolean;
  motivoCancelamento: string | null;
  capturadaEm: string;
}

export interface PrazoAgendado {
  id: string;
  publicacaoId: string | null;
  casoId: string | null;
  numeroProcesso: string | null;
  descricao: string;
  /** Data final escolhida pelo advogado ("AAAA-MM-DD"). */
  dataFinal: string;
  cumprido: boolean;
  cumpridoEm: string | null;
  criadoEm: string;
}

export interface PainelPrazos {
  monitoramentos: Monitoramento[];
  publicacoes: Publicacao[];
  prazos: PrazoAgendado[];
}

export interface ResultadoSincronizacao {
  novas: number;
  consultados: number;
  erros: string[];
  painel: PainelPrazos;
}

export type NovoMonitoramento =
  | { tipo: "oab"; oabNumero: string; oabUf: string }
  | { tipo: "processo"; numeroProcesso: string };

export interface NovoPrazo {
  descricao: string;
  dataFinal: string;
  publicacaoId?: string;
  casoId?: string;
  numeroProcesso?: string;
}

const id = (valor: string) => encodeURIComponent(valor);

export const prazosApi = {
  obterPainel(casoId?: string) {
    return requisitarJson<PainelPrazos>(`/api/prazos${casoId ? `?casoId=${id(casoId)}` : ""}`);
  },

  /** Sem `forcar`, só consulta o que não foi atualizado na última meia hora. */
  sincronizar(casoId?: string, forcar = false) {
    return requisitarJson<ResultadoSincronizacao>("/api/prazos/sincronizar", {
      method: "POST",
      body: JSON.stringify({ forcar, ...(casoId ? { casoId } : {}) }),
    });
  },

  acompanhar(dados: NovoMonitoramento, casoId?: string) {
    return requisitarJson<{ aviso: string | null; painel: PainelPrazos }>("/api/prazos/monitoramentos", {
      method: "POST",
      body: JSON.stringify({ ...dados, ...(casoId ? { casoId } : {}) }),
    });
  },

  async ligarAoCaso(monitoramentoId: string, casoId: string | null) {
    const { monitoramento } = await requisitarJson<{ monitoramento: Monitoramento }>(
      `/api/prazos/monitoramentos/${id(monitoramentoId)}`,
      { method: "PATCH", body: JSON.stringify({ casoId }) },
    );
    return monitoramento;
  },

  async deixarDeAcompanhar(monitoramentoId: string) {
    await requisitarJson<void>(`/api/prazos/monitoramentos/${id(monitoramentoId)}`, { method: "DELETE" });
  },

  async obterPublicacao(publicacaoId: string) {
    const { publicacao } = await requisitarJson<{ publicacao: Publicacao }>(`/api/prazos/publicacoes/${id(publicacaoId)}`);
    return publicacao;
  },

  async marcarSituacao(publicacaoId: string, situacao: "pendente" | "sem_prazo") {
    const { publicacao } = await requisitarJson<{ publicacao: Publicacao }>(
      `/api/prazos/publicacoes/${id(publicacaoId)}`,
      { method: "PATCH", body: JSON.stringify({ situacao }) },
    );
    return publicacao;
  },

  async agendar(dados: NovoPrazo) {
    const { prazo } = await requisitarJson<{ prazo: PrazoAgendado }>("/api/prazos/agenda", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    return prazo;
  },

  async alterarPrazo(prazoId: string, dados: Partial<Pick<PrazoAgendado, "descricao" | "dataFinal" | "cumprido">>) {
    const { prazo } = await requisitarJson<{ prazo: PrazoAgendado }>(`/api/prazos/agenda/${id(prazoId)}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
    return prazo;
  },

  async excluirPrazo(prazoId: string) {
    await requisitarJson<void>(`/api/prazos/agenda/${id(prazoId)}`, { method: "DELETE" });
  },
};
