export type CategoriaInsight =
  | "tese"
  | "tema_superior"
  | "jurisprudencia"
  | "pergunta"
  | "necessidade"
  | "acordo";
export type NivelRelevancia = "alta" | "media" | "baixa";

export interface Fonte {
  tribunal: string;
  identificador: string;
  data?: string;
  url?: string;
}

export interface Insight {
  id: string;
  categoria: CategoriaInsight;
  titulo: string;
  detalhe: string;
  relevancia: NivelRelevancia;
  posicaoJurisprudencial?: "majoritaria" | "minoritaria" | "em_analise";
  fontes: Fonte[];
  meta?: [string, string];
}

export interface AnalisePreliminar {
  id: string;
  casoId: string;
  versao: number;
  geradaEm: string;
  resumo: string;
  insights: Insight[];
  demonstracao: boolean;
  /** "chat": versão que incorporou o que o advogado contou no chat. */
  origem?: "relato" | "chat";
}

export interface MensagemChat {
  id: string;
  papel: "advogado" | "assistente";
  conteudo: string;
  criadaEm: string;
}

export interface DocumentoCaso {
  id: string;
  nome: string;
  tipo: string;
  /** Texto lido do arquivo, quando ele foi anexado ao caso. */
  texto?: string;
  sanitizacao:
    | { status: "pendente" }
    | { status: "limpo" }
    | { status: "suspeito"; trechosRemovidos: number; descricao: string };
}

export interface ConteudoCaso {
  casoId: string;
  titulo: string;
  analise: AnalisePreliminar | null;
  versoesAnalise: AnalisePreliminar[];
  transcricao: {
    id: string;
    tempo: string;
    texto: string;
    papel: "cliente" | "advogado" | "nota";
  }[];
  documentos: DocumentoCaso[];
  historico: { id: string; descricao: string; data: string }[];
}
