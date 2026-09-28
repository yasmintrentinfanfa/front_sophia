import type { Caso } from "../types";
import type { AnalisePreliminar, ConteudoCaso, MensagemChat } from "../analise";
import { INSIGHTS, MENSAGENS, RESUMO } from "./detalhes";

export function criarMockFluxo(
  encontrarCaso: (id: string) => Caso | undefined,
) {
  const conteudos = new Map<string, ConteudoCaso>();
  const conversas = new Map<string, MensagemChat[]>();

  function obterConteudo(casoId: string) {
    const caso = encontrarCaso(casoId);
    if (!caso) throw new Error("Caso nao encontrado.");
    const existente = conteudos.get(casoId);
    if (existente) return existente;
    const exemplo = casoId === "rescisao-silva";
    const conteudo: ConteudoCaso = {
      casoId,
      titulo: exemplo ? "Rescisao contratual - Silva" : caso.titulo,
      analise: exemplo
        ? {
            id: `${casoId}-analise-1`,
            casoId,
            versao: 1,
            geradaEm: "2026-03-10T11:20:00.000Z",
            resumo: RESUMO,
            insights: structuredClone(INSIGHTS),
            demonstracao: true,
          }
        : null,
      versoesAnalise: [],
      transcricao: exemplo
        ? [
            {
              id: "fala-1",
              tempo: "00:12",
              texto: "Cliente descreve atraso de pagamentos",
              papel: "cliente",
            },
            {
              id: "fala-2",
              tempo: "00:45",
              texto: "Advogado questiona sobre clausula penal",
              papel: "advogado",
            },
            {
              id: "fala-3",
              tempo: "01:20",
              texto: "Cliente menciona tentativa de acordo",
              papel: "cliente",
            },
          ]
        : [],
      documentos: exemplo
        ? [
            {
              id: "doc-1",
              nome: "CTPS",
              tipo: "PDF",
              sanitizacao: { status: "pendente" },
            },
            {
              id: "doc-2",
              nome: "Comprovantes de pagamento",
              tipo: "PDF",
              sanitizacao: { status: "pendente" },
            },
            {
              id: "doc-3",
              nome: "Extratos previdenciarios",
              tipo: "PDF",
              sanitizacao: { status: "pendente" },
            },
          ]
        : [],
      historico: exemplo
        ? [
            {
              id: "evento-1",
              descricao: "Analise preliminar - versao 1",
              data: "2026-03-10T11:20:00.000Z",
            },
          ]
        : [],
    };
    if (conteudo.analise) {
      conteudo.versoesAnalise.push(structuredClone(conteudo.analise));
    }
    conteudos.set(casoId, conteudo);
    return conteudo;
  }

  function obterMensagens(casoId: string) {
    obterConteudo(casoId);
    if (!conversas.has(casoId))
      conversas.set(
        casoId,
        casoId === "rescisao-silva" ? structuredClone(MENSAGENS) : [],
      );
    return conversas.get(casoId)!;
  }

  return {
    async finalizarSessao(casoId: string, transcricao: ConteudoCaso["transcricao"]): Promise<Caso> {
      if (!transcricao.some((fala) => fala.papel !== "nota" && fala.texto.trim())) {
        throw new Error("A transcricao esta vazia.");
      }
      const conteudo = obterConteudo(casoId);
      conteudo.transcricao = structuredClone(transcricao);
      await this.solicitarAnalise(casoId);
      const caso = encontrarCaso(casoId)!;
      caso.status = "em_analise";
      caso.atualizadoEm = new Date().toISOString();
      return structuredClone(caso);
    },
    async obterCaso(casoId: string): Promise<ConteudoCaso> {
      return structuredClone(obterConteudo(casoId));
    },
    async solicitarAnalise(
      casoId: string,
      instrucao?: string,
    ): Promise<AnalisePreliminar> {
      const conteudo = obterConteudo(casoId);
      const versao = (conteudo.analise?.versao ?? 0) + 1;
      const analise: AnalisePreliminar = {
        id: `${casoId}-analise-${versao}`,
        casoId,
        versao,
        geradaEm: new Date().toISOString(),
        resumo:
          conteudo.analise?.resumo ??
          (conteudo.transcricao.length
            ? "Transcricao recebida. A analise juridica e a consulta aos tribunais dependem da integracao com a IA."
            : "A analise deste caso estara disponivel apos o processamento da transcricao e dos documentos."),
        insights: structuredClone(conteudo.analise?.insights ?? []),
        demonstracao: true,
        instrucao,
      };
      conteudo.analise = analise;
      conteudo.versoesAnalise.unshift(structuredClone(analise));
      conteudo.historico.unshift({
        id: analise.id,
        descricao: `Analise preliminar - versao ${versao}`,
        data: analise.geradaEm,
      });
      return structuredClone(analise);
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
            "Mensagem recebida. Este chat esta em demonstracao; a resposta juridica e a geracao da peca estarao disponiveis com a integracao da IA.",
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
