/**
 * Análise preliminar e chat de verdade: falam com as rotas `/api/analise` e `/api/chat` do
 * Next, que repassam ao backend (módulo `backend/analise`) com o dono tirado do cookie
 * assinado. Casos, conta e assinatura seguem no adapter de base; só estas cinco operações
 * mudam. Desligado nos testes e com `NEXT_PUBLIC_ANALISE_REAL=false` (ver `./index.ts`).
 */

import type { AnalisePreliminar, OpcoesAnalise, MensagemChat } from "./analise";
import { requisitarJson } from "./conta";
import type { SophiaApi } from "./types";

type ApiAnalise = Pick<
  SophiaApi,
  "obterCaso" | "finalizarSessao" | "solicitarAnalise" | "listarMensagens" | "enviarMensagem"
>;

const rotuloAnalise = (item: AnalisePreliminar) =>
  item.fonteNome ? `Análise ${item.indice + 1} · ${item.fonteNome}` : `Análise ${item.indice + 1}`;

function listaDeAnalises(
  analise: AnalisePreliminar | null | undefined,
  analises?: AnalisePreliminar[],
  versoes?: AnalisePreliminar[],
) {
  if (analises?.length) return analises;
  if (versoes?.length) return [...versoes].sort((a, b) => a.indice - b.indice);
  return analise ? [analise] : [];
}

export function criarAnaliseApi(base: SophiaApi): ApiAnalise {
  const consulta = (casoId: string) => `?casoId=${encodeURIComponent(casoId)}`;

  async function solicitarAnalise(
    casoId: string,
    opcoes: OpcoesAnalise = {},
  ): Promise<AnalisePreliminar[]> {
    const { analise, analises, versoes } = await requisitarJson<{
      analise: AnalisePreliminar | null;
      analises?: AnalisePreliminar[];
      versoes?: AnalisePreliminar[];
    }>("/api/analise", {
      method: "POST",
      body: JSON.stringify({
        casoId,
        ...(opcoes.incluirChat ? { incluirChat: true } : {}),
        ...(opcoes.tipo ? { fonteTipo: opcoes.tipo, ...(opcoes.id ? { fonteId: opcoes.id } : {}) } : {}),
      }),
    });
    return listaDeAnalises(analise, analises, versoes);
  }

  return {
    solicitarAnalise,

    async finalizarSessao(casoId, transcricao, analisar = true) {
      // O relato já foi salvo no MongoDB antes desta chamada. A análise só roda se pedirem.
      let falha: unknown = null;
      if (analisar) {
        try {
          await solicitarAnalise(casoId, { tipo: "transcricao" });
        } catch (erro) {
          falha = erro;
        }
      }
      const caso = await base.finalizarSessao(casoId, transcricao, false);
      if (falha) throw falha;
      return caso;
    },

    async obterCaso(casoId) {
      const conteudo = await base.obterCaso(casoId);
      try {
        const { analise, analises, versoes } = await requisitarJson<{
          analise: AnalisePreliminar | null;
          analises?: AnalisePreliminar[];
          versoes?: AnalisePreliminar[];
        }>(`/api/analise${consulta(casoId)}`);
        const lista = listaDeAnalises(analise, analises, versoes);
        const eventosReais = lista.map((item) => ({
          id: item.id,
          descricao: rotuloAnalise(item),
          data: item.geradaEm,
        }));
        // Os eventos de análise do adapter de base usam os mesmos ids; ficam só os reais.
        const outros = conteudo.historico.filter((evento) => !evento.id.includes("-analise-"));
        return {
          ...conteudo,
          analise: lista.at(-1) ?? analise,
          versoesAnalise: lista,
          historico: [...eventosReais, ...outros].sort((a, b) => b.data.localeCompare(a.data)),
        };
      } catch {
        // Sem a análise real, mostra o que o adapter de base tem em vez de travar a tela.
        return conteudo;
      }
    },

    async listarMensagens(casoId): Promise<MensagemChat[]> {
      const { mensagens } = await requisitarJson<{ mensagens: MensagemChat[] }>(
        `/api/chat${consulta(casoId)}`,
      );
      return mensagens;
    },

    async enviarMensagem(casoId, conteudo): Promise<MensagemChat[]> {
      const { mensagens } = await requisitarJson<{ mensagens: MensagemChat[] }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ casoId, mensagem: conteudo }),
      });
      return mensagens;
    },
  };
}
