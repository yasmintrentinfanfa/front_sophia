/**
 * Análise preliminar e chat de verdade: falam com as rotas `/api/analise` e `/api/chat` do
 * Next, que repassam ao backend (módulo `backend/analise`) com o dono tirado do cookie
 * assinado. Casos, conta e assinatura seguem no adapter de base; só estas cinco operações
 * mudam. Desligado nos testes e com `NEXT_PUBLIC_ANALISE_REAL=false` (ver `./index.ts`).
 */

import type { AnalisePreliminar, OpcoesAnalise, MensagemChat } from "./analise";
import { ErroApi, requisitarJson } from "./conta";
import { lerNdjson } from "./ndjson";
import type { SophiaApi } from "./types";

type ApiAnalise = Pick<
  SophiaApi,
  "obterCaso" | "finalizarSessao" | "solicitarAnalise" | "listarMensagens" | "enviarMensagem" | "enviarMensagemAoVivo"
>;

type EventoDoChat =
  | { tipo: "trecho"; texto: string }
  | { tipo: "fim"; mensagens: MensagemChat[] }
  | { tipo: "erro"; erro: string };

async function enviarMensagem(casoId: string, conteudo: string): Promise<MensagemChat[]> {
  const { mensagens } = await requisitarJson<{ mensagens: MensagemChat[] }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ casoId, mensagem: conteudo }),
  });
  return mensagens;
}

/** Chat com a resposta em trechos (`/api/chat/stream`); sem streaming no backend, cai no envio normal. */
async function enviarMensagemAoVivo(
  casoId: string,
  conteudo: string,
  aoTrecho: (texto: string) => void,
): Promise<MensagemChat[]> {
  let resposta: Response;
  try {
    resposta = await fetch("/api/chat/stream", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ casoId, mensagem: conteudo }),
    });
  } catch {
    throw new ErroApi("Não foi possível conectar ao servidor. Verifique sua internet.", 0);
  }
  if (resposta.status === 501) return enviarMensagem(casoId, conteudo);
  if (!resposta.ok || !resposta.body) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
    throw new ErroApi(corpo?.erro ?? "Não foi possível enviar a mensagem.", resposta.status);
  }

  let mensagens: MensagemChat[] | null = null;
  let falha = "";
  try {
    await lerNdjson<EventoDoChat>(resposta.body, (evento) => {
      if (evento.tipo === "trecho") aoTrecho(evento.texto);
      else if (evento.tipo === "fim") mensagens = evento.mensagens;
      else if (evento.tipo === "erro") falha = evento.erro;
    });
  } catch {
    throw new ErroApi("A conexão caiu no meio da resposta. Tente de novo.", 0);
  }
  if (falha) throw new ErroApi(falha, 502);
  if (!mensagens) throw new ErroApi("A resposta foi interrompida. Tente de novo.", 0);
  return mensagens;
}

const rotuloAnalise = (item: AnalisePreliminar) =>
  item.fonteNome ? `Análise ${item.indice + 1} · ${item.fonteNome}` : `Análise ${item.indice + 1}`;

function ordemDaAnalise(item: AnalisePreliminar) {
  return item.versao ?? (item.indice ?? 0) + 1;
}

function listaDeAnalises(
  analise: AnalisePreliminar | null | undefined,
  analises?: AnalisePreliminar[],
  versoes?: AnalisePreliminar[],
) {
  const lista = analises?.length ? analises : versoes?.length ? versoes : analise ? [analise] : [];
  return [...lista].sort((a, b) => ordemDaAnalise(a) - ordemDaAnalise(b));
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
          await solicitarAnalise(casoId);
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

    enviarMensagem,
    enviarMensagemAoVivo,
  };
}
