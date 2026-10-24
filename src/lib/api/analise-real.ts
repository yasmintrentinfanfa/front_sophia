/**
 * Análise preliminar e chat de verdade: falam com as rotas `/api/analise` e `/api/chat` do
 * Next, que repassam ao backend (módulo `backend/analise`) com o dono tirado do cookie
 * assinado. Casos, conta e assinatura seguem no adapter de base; só estas cinco operações
 * mudam. Desligado nos testes e com `NEXT_PUBLIC_ANALISE_REAL=false` (ver `./index.ts`).
 */

import type { AnalisePreliminar, MensagemChat } from "./analise";
import { requisitarJson } from "./conta";
import type { SophiaApi } from "./types";

type ApiAnalise = Pick<
  SophiaApi,
  "obterCaso" | "finalizarSessao" | "solicitarAnalise" | "listarMensagens" | "enviarMensagem"
>;

const rotuloVersao = (versao: number) => `Análise preliminar - versão ${versao}`;

export function criarAnaliseApi(base: SophiaApi): ApiAnalise {
  const consulta = (casoId: string) => `?casoId=${encodeURIComponent(casoId)}`;

  async function solicitarAnalise(
    casoId: string,
    opcoes: { incluirChat?: boolean } = {},
  ): Promise<AnalisePreliminar> {
    const { analise } = await requisitarJson<{ analise: AnalisePreliminar }>("/api/analise", {
      method: "POST",
      body: JSON.stringify({ casoId, ...(opcoes.incluirChat ? { incluirChat: true } : {}) }),
    });
    return analise;
  }

  return {
    solicitarAnalise,

    async finalizarSessao(casoId, transcricao) {
      // O relato já foi salvo no MongoDB antes desta chamada. A análise real roda primeiro, mas
      // o status do caso avança de qualquer jeito: se a IA falhar, a tela de análise oferece
      // "Gerar análise" para tentar de novo, e o erro volta para quem chamou.
      let falha: unknown = null;
      try {
        await solicitarAnalise(casoId);
      } catch (erro) {
        falha = erro;
      }
      const caso = await base.finalizarSessao(casoId, transcricao);
      if (falha) throw falha;
      return caso;
    },

    async obterCaso(casoId) {
      const conteudo = await base.obterCaso(casoId);
      try {
        const { analise, versoes } = await requisitarJson<{
          analise: AnalisePreliminar | null;
          versoes: AnalisePreliminar[];
        }>(`/api/analise${consulta(casoId)}`);
        const eventosReais = versoes.map((versao) => ({
          id: versao.id,
          descricao: rotuloVersao(versao.versao),
          data: versao.geradaEm,
        }));
        // Os eventos de análise do adapter de base usam os mesmos ids; ficam só os reais.
        const outros = conteudo.historico.filter((evento) => !evento.id.includes("-analise-"));
        return {
          ...conteudo,
          analise,
          versoesAnalise: versoes,
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
