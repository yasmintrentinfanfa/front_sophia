import type { Insight } from "./tipos";

/**
 * Análise de demonstração do caso "Rescisão contratual — João Silva", coerente
 * com a transcrição de exemplo da sessão ativa e do repositório. Usada enquanto
 * o pipeline de IA (transcrição → insights) não existe.
 *
 * Segue as regras da Seção 7 do documento de contexto:
 * - disputa contratual entre particulares não tem questão constitucional, então
 *   não há tema do STF (a coluna aparece vazia de propósito);
 * - artigos de lei são reais; identificadores de precedentes são marcados como
 *   exemplo para nunca parecerem uma citação verdadeira;
 * - pelo menos um item chega sem fonte, para exibir o selo "Fonte não verificada".
 */
export const RESUMO_ANALISE =
  "Cliente relata contrato assinado em janeiro com a empresa, que passou a atrasar pagamentos de forma reiterada. Houve tentativa de acordo, sem sucesso. Documentos juntados: contrato assinado, comprovantes de pagamento e troca de e-mails. Pontos a confirmar: cláusula de multa e prazo de aviso prévio. Disputa contratual entre particulares, sem questão constitucional — por isso não há tema de repercussão geral do STF.";

export const INSIGHTS: Insight[] = [
  {
    id: "tese-resolucao",
    categoria: "tese",
    titulo: "Resolução do contrato por inadimplemento",
    detalhe: "A parte lesada pode pedir a resolução do contrato diante do atraso reiterado nos pagamentos.",
    relevancia: "alta",
    fontes: [{ origem: "Código Civil", identificador: "art. 475" }],
  },
  {
    id: "tese-perdas-danos",
    categoria: "tese",
    titulo: "Perdas e danos pelo inadimplemento",
    detalhe: "Devedor responde por perdas e danos, juros e atualização monetária das parcelas em atraso.",
    relevancia: "alta",
    fontes: [{ origem: "Código Civil", identificador: "art. 389" }],
  },
  {
    id: "tese-clausula-penal",
    categoria: "tese",
    titulo: "Cobrança da cláusula penal",
    detalhe: "Aplicável se o contrato prever multa; o valor não pode exceder o da obrigação principal.",
    relevancia: "media",
    fontes: [{ origem: "Código Civil", identificador: "arts. 408 e 412" }],
  },
  {
    id: "tese-acordo",
    categoria: "tese",
    titulo: "Acordo extrajudicial (transação)",
    detalhe: "Registrar a tentativa de negociação; um acordo pode encerrar o litígio por concessões mútuas.",
    relevancia: "media",
    fontes: [{ origem: "Código Civil", identificador: "art. 840" }],
  },
  {
    id: "juris-reducao-multa",
    categoria: "jurisprudencia",
    titulo: "Redução de multa manifestamente excessiva",
    detalhe: "Entendimento de que o juiz deve reduzir a cláusula penal excessiva (CC, art. 413). Precedente de demonstração.",
    posicaoJurisprudencial: "majoritaria",
    fontes: [{ origem: "STJ", identificador: "REsp (exemplo de demonstração)" }],
  },
  {
    id: "juris-cumulacao",
    categoria: "jurisprudencia",
    titulo: "Cumulação de multa com perdas e danos",
    detalhe: "A IA não encontrou fonte verificável para este ponto. Confirme antes de usar na peça.",
    posicaoJurisprudencial: "em_analise",
    fontes: [],
  },
  {
    id: "pergunta-multa",
    categoria: "pergunta",
    titulo: "O contrato prevê cláusula de multa?",
    detalhe: "Define se a cobrança da cláusula penal é cabível e qual o limite.",
    fontes: [],
  },
  {
    id: "pergunta-parcelas",
    categoria: "pergunta",
    titulo: "Quais parcelas estão em atraso?",
    detalhe: "Mapear datas e valores a partir dos comprovantes.",
    fontes: [],
  },
  {
    id: "pergunta-notificacao",
    categoria: "pergunta",
    titulo: "A empresa foi notificada formalmente?",
    detalhe: "Ajuda a comprovar a mora e a tentativa de solução.",
    fontes: [],
  },
  {
    id: "pergunta-acordo",
    categoria: "pergunta",
    titulo: "A tentativa de acordo ficou registrada?",
    detalhe: "E-mails ou mensagens documentam a fase pré-processual.",
    fontes: [],
  },
  {
    id: "necessidade-documento",
    categoria: "necessidade",
    titulo: "Documento faltante",
    detalhe: "Cópia integral do contrato com eventuais aditivos.",
    probabilidade: "alta",
    fontes: [],
  },
  {
    id: "necessidade-acordo",
    categoria: "necessidade",
    titulo: "Possibilidade de acordo",
    detalhe: "Já houve negociação; vale avaliar nova proposta antes do ajuizamento.",
    probabilidade: "media",
    fontes: [],
  },
  {
    id: "necessidade-pericia",
    categoria: "necessidade",
    titulo: "Perícia",
    detalhe: "Perícia contábil só se houver divergência sobre os valores devidos.",
    probabilidade: "baixa",
    fontes: [],
  },
];
