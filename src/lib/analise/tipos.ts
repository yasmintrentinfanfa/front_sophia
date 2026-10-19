/**
 * Tipos da análise preliminar de caso (frame "06 - Análise IA" do protótipo).
 * Espelha o contrato modelado em `docs/contrato-api.md`: nenhuma tese, tema ou
 * jurisprudência aparece sem fonte rastreável, e relevância é sempre qualitativa.
 */

export type CategoriaInsight = "tese" | "tema_superior" | "jurisprudencia" | "pergunta" | "necessidade";

export type NivelRelevancia = "alta" | "media" | "baixa";

export type PosicaoJurisprudencial = "majoritaria" | "minoritaria" | "em_analise";

export interface Fonte {
  /** "STF", "STJ", "TRF4"… */
  tribunal: string;
  /** "art. 475 CC", "Tema 975", "REsp 1.363.423/RS"… */
  identificador: string;
  data?: string;
}

export interface Insight {
  id: string;
  categoria: CategoriaInsight;
  titulo: string;
  detalhe: string;
  relevancia?: NivelRelevancia;
  /** Só para categoria "necessidade": leitura do caso, não afirmação sobre o direito. */
  probabilidade?: NivelRelevancia;
  posicaoJurisprudencial?: PosicaoJurisprudencial;
  /** Teses, temas e jurisprudência exigem fonte; vazio = "não verificado" na interface. */
  fontes: Fonte[];
}

export const ROTULO_CATEGORIA: Record<CategoriaInsight, string> = {
  tese: "Teses jurídicas aplicáveis",
  tema_superior: "Temas do STF/STJ",
  jurisprudencia: "Jurisprudência",
  pergunta: "Perguntas sugeridas",
  necessidade: "Necessidades adicionais",
};

export const ROTULO_RELEVANCIA: Record<NivelRelevancia, string> = {
  alta: "Relevância: alta",
  media: "Relevância: média",
  baixa: "Relevância: baixa",
};

export const ROTULO_PROBABILIDADE: Record<NivelRelevancia, string> = {
  alta: "Probabilidade: alta",
  media: "Probabilidade: média",
  baixa: "Probabilidade: baixa",
};

export const ROTULO_POSICAO: Record<PosicaoJurisprudencial, string> = {
  majoritaria: "Majoritária",
  minoritaria: "Minoritária",
  em_analise: "Em análise",
};
