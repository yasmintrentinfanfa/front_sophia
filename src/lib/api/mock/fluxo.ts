import type { Caso } from "../types";
import type { AnalisePreliminar, ConteudoCaso, MensagemChat, OpcoesAnalise } from "../analise";

interface DependenciasFluxo {
  /** Só devolve casos do dono da sessão. */
  encontrarCaso: (id: string) => Caso | undefined;
  /** Persiste o caso alterado (status, data) na lista do dono. */
  salvarCaso: (caso: Caso) => void;
  /** Id do dono da sessão: análise e chat ficam separados por usuário mesmo quando os ids de caso coincidem. */
  escopo: () => string;
}

export function criarMockFluxo({ encontrarCaso, salvarCaso, escopo }: DependenciasFluxo) {
  const conteudos = new Map<string, ConteudoCaso>();
  const conversas = new Map<string, MensagemChat[]>();
  const chave = (casoId: string) => `${escopo()}:${casoId}`;

  function obterConteudo(casoId: string) {
    const caso = encontrarCaso(casoId);
    if (!caso) throw new Error("Caso nao encontrado.");
    const existente = conteudos.get(chave(casoId));
    if (existente) return existente;
    const conteudo: ConteudoCaso = {
      casoId,
      titulo: caso.titulo,
      analise: null,
      versoesAnalise: [],
      transcricao: [],
      documentos: [],
      historico: [],
    };
    conteudos.set(chave(casoId), conteudo);
    return conteudo;
  }

  function obterMensagens(casoId: string) {
    obterConteudo(casoId);
    if (!conversas.has(chave(casoId))) conversas.set(chave(casoId), []);
    return conversas.get(chave(casoId))!;
  }

  return {
    async finalizarSessao(casoId: string, transcricao: ConteudoCaso["transcricao"], analisar = true): Promise<Caso> {
      if (!transcricao.some((fala) => fala.papel !== "nota" && fala.texto.trim())) {
        throw new Error("A transcricao esta vazia.");
      }
      const conteudo = obterConteudo(casoId);
      conteudo.transcricao.push(...structuredClone(transcricao));
      if (analisar) await this.solicitarAnalise(casoId, { tipo: "transcricao" });
      const caso: Caso = {
        ...encontrarCaso(casoId)!,
        status: "em_analise",
        atualizadoEm: new Date().toISOString(),
      };
      salvarCaso(caso);
      return structuredClone(caso);
    },
    async obterCaso(casoId: string): Promise<ConteudoCaso> {
      return structuredClone(obterConteudo(casoId));
    },
    async solicitarAnalise(casoId: string, opcoes?: OpcoesAnalise): Promise<AnalisePreliminar[]> {
      const conteudo = obterConteudo(casoId);
      const fonte = opcoes?.tipo ? { tipo: opcoes.tipo, id: opcoes.id } : undefined;
      if (opcoes?.incluirChat) {
        const atual = conteudo.analise;
        if (!atual) throw new Error("Gere a analise preliminar do caso antes.");
        const indice = conteudo.versoesAnalise.length;
        const analise: AnalisePreliminar = {
          ...structuredClone(atual),
          id: `${casoId}-analise-${indice + 1}`,
          indice,
          versao: indice + 1,
          geradaEm: new Date().toISOString(),
          origem: "chat",
        };
        conteudo.analise = analise;
        conteudo.versoesAnalise.push(structuredClone(analise));
        conteudo.historico.unshift({
          id: analise.id,
          descricao: `Análise ${indice + 1} · conversa`,
          data: analise.geradaEm,
        });
        return structuredClone(conteudo.versoesAnalise);
      }
      const cobertos = new Set(conteudo.versoesAnalise.flatMap((item) => (item.fonteId ? [item.fonteId] : [])));
      const documento = fonte?.id ? conteudo.documentos.find((item) => item.id === fonte.id) : undefined;
      const novaFonteId = fonte?.id ?? documento?.id;
      if (!conteudo.analise || (novaFonteId && !cobertos.has(novaFonteId))) {
        const indice = conteudo.versoesAnalise.length;
        const fonteNome =
          fonte?.tipo === "documento"
            ? (documento?.nome ?? "Documento")
            : fonte?.tipo === "transcricao"
              ? "Transcrição"
              : conteudo.documentos.at(-1)?.nome ?? (conteudo.transcricao.length ? "Transcrição" : "Caso");
        const analise: AnalisePreliminar = {
          id: `${casoId}-analise-${indice + 1}`,
          casoId,
          indice,
          versao: indice + 1,
          geradaEm: new Date().toISOString(),
          resumo:
            conteudo.transcricao.length || conteudo.documentos.length
              ? "Relato recebido. A analise juridica e a consulta aos tribunais dependem da integracao com a IA."
              : "A analise deste caso estara disponivel apos o processamento da transcricao e dos documentos.",
          insights: structuredClone(conteudo.analise?.insights ?? []),
          demonstracao: true,
          fonteTipo: fonte?.tipo ?? (conteudo.documentos.length && !conteudo.transcricao.length ? "documento" : "transcricao"),
          fonteId: novaFonteId,
          fonteNome,
          fontesIds: [
            ...new Set(
              [
                ...conteudo.versoesAnalise.flatMap((item) => item.fontesIds ?? (item.fonteId ? [item.fonteId] : [])),
                novaFonteId,
                ...conteudo.documentos.map((item) => item.id),
              ].filter((item): item is string => Boolean(item)),
            ),
          ],
        };
        conteudo.analise = analise;
        conteudo.versoesAnalise.push(structuredClone(analise));
        conteudo.historico.unshift({
          id: analise.id,
          descricao: `Análise ${indice + 1} · ${fonteNome}`,
          data: analise.geradaEm,
        });
      }
      return structuredClone(conteudo.versoesAnalise);
    },
    async listarMensagens(casoId: string): Promise<MensagemChat[]> {
      return structuredClone(obterMensagens(casoId));
    },
    async enviarMensagem(
      casoId: string,
      conteudo: string,
    ): Promise<MensagemChat[]> {
      if (!conteudo.trim()) throw new Error("Digite uma mensagem.");
      const mensagens = obterMensagens(casoId);
      const criadaEm = new Date().toISOString();
      const novas: MensagemChat[] = [
        {
          id: crypto.randomUUID(),
          papel: "advogado",
          conteudo: conteudo.trim(),
          criadaEm,
        },
        {
          id: crypto.randomUUID(),
          papel: "assistente",
          conteudo:
            "Mensagem recebida. Este chat esta em demonstracao; as respostas sobre o caso estarao disponiveis com a integracao da IA.",
          criadaEm,
        },
      ];
      mensagens.push(...novas);
      obterConteudo(casoId).historico.unshift({
        id: novas[0].id,
        descricao: "Nova pergunta no chat",
        data: criadaEm,
      });
      return structuredClone(novas);
    },
  };
}
