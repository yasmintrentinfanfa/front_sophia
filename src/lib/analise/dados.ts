import type { Insight } from "./tipos";

/**
 * Análise de demonstração, igual ao conteúdo do frame "06 - Análise IA" do
 * protótipo Figma. Usada enquanto o pipeline de IA (transcrição → insights)
 * não existe — mesmo padrão do `FALAS` estático na tela de sessão ativa.
 */
export const RESUMO_ANALISE =
  "Cliente relata vínculo omitido no relato inicial, com pontos de contribuição/obrigação não reconhecidos. Documentos juntados incluem comprovantes e extratos. A IA identificou teses e jurisprudência aplicáveis ao pedido.";

export const INSIGHTS: Insight[] = [
  {
    id: "tese-rescisao",
    categoria: "tese",
    titulo: "Rescisão por inadimplência",
    detalhe: "Fundamento no art. 475 do CC, com base em atraso reiterado de obrigações contratuais.",
    relevancia: "alta",
    fontes: [{ tribunal: "CC", identificador: "art. 475" }],
  },
  {
    id: "tese-dano-material",
    categoria: "tese",
    titulo: "Dano material comprovável",
    detalhe: "Pagamentos em atraso e perdas financeiras documentadas sustentam pedido indenizatório.",
    relevancia: "alta",
    fontes: [{ tribunal: "STJ", identificador: "REsp 1.363.423" }],
  },
  {
    id: "tese-acordo",
    categoria: "tese",
    titulo: "Acordo extrajudicial prévio",
    detalhe: "Sugerido registrar tentativas de negociação antes do ajuizamento.",
    relevancia: "media",
    fontes: [{ tribunal: "CC", identificador: "art. 840" }],
  },
  {
    id: "tese-clausula-penal",
    categoria: "tese",
    titulo: "Cláusula penal aplicável",
    detalhe: "Possível cobrança de multa contratual por descumprimento.",
    relevancia: "media",
    fontes: [{ tribunal: "CC", identificador: "art. 412" }],
  },
  {
    id: "tema-1065",
    categoria: "tema_superior",
    titulo: "Tema 1065 do STF",
    detalhe: "Discute efeitos de vínculos não anotados e prova documental.",
    relevancia: "alta",
    fontes: [{ tribunal: "STF", identificador: "Tema 1065", data: "2021" }],
  },
  {
    id: "tema-975",
    categoria: "tema_superior",
    titulo: "Tema 975 do STF",
    detalhe: "Trata de reconhecimento de períodos contributivos e impacto no benefício.",
    relevancia: "alta",
    fontes: [{ tribunal: "STF", identificador: "Tema 975" }],
  },
  {
    id: "juris-resp",
    categoria: "jurisprudencia",
    titulo: "STJ — REsp 1.363.423/RS",
    detalhe: "Consolidou entendimento sobre dano material em relações contratuais.",
    posicaoJurisprudencial: "majoritaria",
    fontes: [{ tribunal: "STJ", identificador: "REsp 1.363.423/RS", data: "2018-03-15" }],
  },
  {
    id: "juris-trf4",
    categoria: "jurisprudencia",
    titulo: "TRF4 — AC 5001234",
    detalhe: "Reconheceu período mediante prova testemunhal e documental.",
    posicaoJurisprudencial: "majoritaria",
    fontes: [{ tribunal: "TRF4", identificador: "AC 5001234", data: "2022-08-02" }],
  },
  {
    id: "juris-agint",
    categoria: "jurisprudencia",
    titulo: "STJ — AgInt no AREsp",
    detalhe: "Admitiu prova indireta para demonstrar vínculo omitido.",
    posicaoJurisprudencial: "majoritaria",
    fontes: [{ tribunal: "STJ", identificador: "AgInt no AREsp", data: "2020-11-11" }],
  },
  {
    id: "juris-trf3",
    categoria: "jurisprudencia",
    titulo: "TRF3 — Apelação",
    detalhe: "Valorou documentos e recibos como prova suficiente.",
    posicaoJurisprudencial: "majoritaria",
    fontes: [{ tribunal: "TRF3", identificador: "Apelação", data: "2019-05-09" }],
  },
  {
    id: "pergunta-anotacao",
    categoria: "pergunta",
    titulo: "Havia anotação formal?",
    detalhe: "Comprovar vínculo omitido no cadastro.",
    fontes: [],
  },
  {
    id: "pergunta-periodos",
    categoria: "pergunta",
    titulo: "Quais períodos de pagamento?",
    detalhe: "Mapear contribuições não reconhecidas.",
    fontes: [],
  },
  {
    id: "pergunta-testemunhas",
    categoria: "pergunta",
    titulo: "Existem testemunhas do fato?",
    detalhe: "Fortalecer prova do vínculo de fato.",
    fontes: [],
  },
  {
    id: "pergunta-acordo",
    categoria: "pergunta",
    titulo: "Houve tentativa de acordo?",
    detalhe: "Documentar fase pré-processual.",
    fontes: [],
  },
  {
    id: "necessidade-documento",
    categoria: "necessidade",
    titulo: "Documento faltante",
    detalhe: "Extrato atualizado e comprovantes de depósito.",
    probabilidade: "alta",
    fontes: [],
  },
  {
    id: "necessidade-pericia",
    categoria: "necessidade",
    titulo: "Perícia",
    detalhe: "Eventual perícia contábil sobre os períodos.",
    probabilidade: "media",
    fontes: [],
  },
  {
    id: "necessidade-acordo",
    categoria: "necessidade",
    titulo: "Possibilidade de acordo",
    detalhe: "Negociação prévia pode reduzir o litígio.",
    probabilidade: "alta",
    fontes: [],
  },
];
