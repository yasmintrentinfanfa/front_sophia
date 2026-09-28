import type { Insight, MensagemChat } from "../analise";

// Textos do frame 06. As referencias sao exemplos do layout, sem validacao juridica.
export const RESUMO =
  "Cliente Sebastiao alega vinculo laboral omitido no CNIS, com periodos de contribuicao nao reconhecidos. Documentos juntados incluem CTPS, comprovantes de pagamento e extratos previdenciarios. IA identificou teses e jurisprudencia aplicaveis ao pedido de aposentadoria.";

export const INSIGHTS: Insight[] = [
  {
    id: "tese-1",
    categoria: "tese",
    titulo: "Rescisao por inadimplencia",
    detalhe:
      "Fundamento no art. 475 do CC, com base em atraso reiterado de obrigacoes contratuais.",
    relevancia: "alta",
    fontes: [],
    meta: ["Relevancia: alta", "art. 475 CC"],
  },
  {
    id: "tese-2",
    categoria: "tese",
    titulo: "Dano material comprovavel",
    detalhe:
      "Pagamentos em atraso e perdas financeiras documentadas sustentam pedido indenizatorio.",
    relevancia: "alta",
    fontes: [],
    meta: ["Relevancia: alta", "STJ REsp 1.363.423"],
  },
  {
    id: "tese-3",
    categoria: "tese",
    titulo: "Acordo extrajudicial previo",
    detalhe:
      "Sugerido registrar tentativas de negociacao antes do ajuizamento.",
    relevancia: "media",
    fontes: [],
    meta: ["Relevancia: media", "art. 840 CC"],
  },
  {
    id: "tese-4",
    categoria: "tese",
    titulo: "Clausula penal aplicavel",
    detalhe: "Possivel cobrança de multa contratual por descumprimento.",
    relevancia: "media",
    fontes: [],
    meta: ["Relevancia: media", "art. 412 CC"],
  },
  {
    id: "tema-1",
    categoria: "tema_superior",
    titulo: "Tema 1065 do STF",
    detalhe:
      "Discute efeitos previdenciarios de vinculos nao anotados e prova documental.",
    relevancia: "alta",
    fontes: [],
    meta: ["Relevancia: alta", "STF 2021"],
  },
  {
    id: "tema-2",
    categoria: "tema_superior",
    titulo: "Tema 975 do STF",
    detalhe:
      "Trata de reconhecimento de periodos contributivos e impacto no beneficio.",
    relevancia: "alta",
    fontes: [],
    meta: ["Relevancia: alta", "STF"],
  },
  {
    id: "juris-1",
    categoria: "jurisprudencia",
    titulo: "STJ - REsp 1.363.423/RS",
    detalhe:
      "Consolidou entendimento sobre dano material em relacoes contratuais.",
    relevancia: "alta",
    posicaoJurisprudencial: "majoritaria",
    fontes: [],
    meta: ["STJ", "15/03/2018"],
  },
  {
    id: "juris-2",
    categoria: "jurisprudencia",
    titulo: "TRF4 - AC 5001234",
    detalhe:
      "Reconheceu periodo laboral mediante prova testemunhal e documental.",
    relevancia: "alta",
    posicaoJurisprudencial: "majoritaria",
    fontes: [],
    meta: ["TRF4", "02/08/2022"],
  },
  {
    id: "juris-3",
    categoria: "jurisprudencia",
    titulo: "STJ - AgInt no AREsp",
    detalhe: "Admitiu prova indireta para demonstrar vinculo omitido.",
    relevancia: "alta",
    posicaoJurisprudencial: "majoritaria",
    fontes: [],
    meta: ["STJ", "11/11/2020"],
  },
  {
    id: "juris-4",
    categoria: "jurisprudencia",
    titulo: "TRF3 - Apelacao",
    detalhe: "Valorou CTPS e recibos como prova suficiente do labor.",
    relevancia: "alta",
    posicaoJurisprudencial: "majoritaria",
    fontes: [],
    meta: ["TRF3", "09/05/2019"],
  },
  {
    id: "pergunta-1",
    categoria: "pergunta",
    titulo: "Havia anotacao em CTPS?",
    detalhe: "Comprovar vinculo omitido no CNIS.",
    relevancia: "alta",
    fontes: [],
  },
  {
    id: "pergunta-2",
    categoria: "pergunta",
    titulo: "Quais periodos de pagamento?",
    detalhe: "Mapear contribuicoes nao reconhecidas.",
    relevancia: "alta",
    fontes: [],
  },
  {
    id: "pergunta-3",
    categoria: "pergunta",
    titulo: "Existem testemunhas do labor?",
    detalhe: "Fortalecer prova do vinculo de fato.",
    relevancia: "alta",
    fontes: [],
  },
  {
    id: "pergunta-4",
    categoria: "pergunta",
    titulo: "Houve tentativa de acordo?",
    detalhe: "Documentar fase pre-processual.",
    relevancia: "media",
    fontes: [],
  },
  {
    id: "necessidade-1",
    categoria: "necessidade",
    titulo: "documento_faltante",
    detalhe: "Extrato CNIS atualizado e comprovantes de deposito.",
    relevancia: "alta",
    fontes: [],
    meta: ["Probabilidade: alta", "nao verificado"],
  },
  {
    id: "necessidade-2",
    categoria: "necessidade",
    titulo: "pericia",
    detalhe: "Eventual pericia contabel sobre periodos contributivos.",
    relevancia: "media",
    fontes: [],
    meta: ["Probabilidade: media", "nao verificado"],
  },
  {
    id: "necessidade-3",
    categoria: "acordo",
    titulo: "possibilidade_de_acordo",
    detalhe: "Negociacao previa pode reduzir litigio.",
    relevancia: "alta",
    fontes: [],
    meta: ["Probabilidade: alta", "nao verificado"],
  },
];

export const MENSAGENS: MensagemChat[] = [
  {
    id: "mensagem-1",
    papel: "advogado",
    conteudo: "Quais precedentes do STJ reforcam a tese de rescisao?",
    criadaEm: "2026-03-10T11:20:00.000Z",
  },
  {
    id: "mensagem-2",
    papel: "assistente",
    conteudo:
      "Encontrei 3 decisoes recentes com citacao da fonte. Deseja incluir no rascunho da peca?",
    criadaEm: "2026-03-10T11:20:01.000Z",
  },
];
