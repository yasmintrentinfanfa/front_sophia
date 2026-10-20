export interface MensagemChat {
  id: string;
  autor: "advogado" | "ia";
  conteudo: string;
}

/** Chips de atalho para caminhos já mapeados no fluxograma da análise. */
export const CHIPS_FLUXO = ["Cláusula penal", "Perdas e danos", "Tentativa de acordo"];

/** Troca inicial, igual ao frame "07 - Chat" do protótipo. */
export const MENSAGENS_INICIAIS: MensagemChat[] = [
  {
    id: "msg-1",
    autor: "advogado",
    conteudo: "Quais precedentes do STJ reforçam a tese de rescisão?",
  },
  {
    id: "msg-2",
    autor: "ia",
    conteudo: "Encontrei 3 decisões recentes com citação da fonte. Deseja incluir no rascunho da peça?",
  },
];

const RESPOSTAS_PADRAO = [
  "Localizei julgados recentes com citação da fonte. Quer que eu inclua no rascunho da peça?",
  "Posso resumir o relato do cliente ou levantar os documentos que ainda faltam — o que prefere?",
  "Essa linha aparece como jurisprudência minoritária, ainda em análise. Quer que eu aprofunde a busca?",
  "Por ser disputa contratual entre particulares, não há tema do STF aplicável. Quer que eu foque em precedentes do STJ?",
];

/** Resposta determinística (sem IA real) só para a demonstração funcionar offline. */
export function respostaSimulada(indice: number) {
  return RESPOSTAS_PADRAO[indice % RESPOSTAS_PADRAO.length];
}
