/**
 * Modelo de domínio consumido pelo front.
 *
 * O backend está sendo construído em paralelo. Este arquivo cobre apenas o que as
 * telas já implementadas usam; o contrato completo (análise preliminar, fontes,
 * sanitização de documentos e chat) está em `docs/contrato-api.md`.
 */

/** Estados exibidos na lista de casos do protótipo. */
export type StatusCaso = "gravacao_pendente" | "em_analise" | "concluido";

export type PastaCaso = "ativo" | "arquivo";

export interface Caso {
  id: string;
  /** "Rescisão contratual — Silva" */
  titulo: string;
  /** Nome do cliente atendido, exibido como "Cliente: …". */
  cliente: string;
  /** Campo do formulário "Área jurídica" no protótipo. */
  area?: string;
  status: StatusCaso;
  pasta: PastaCaso;
  /** ISO 8601. */
  atualizadoEm: string;
}

export interface DadosNovoCaso {
  titulo: string;
  cliente: string;
  area?: string;
}

/*
 * Assinatura: mensalidade fixa da plataforma + um plano de créditos de IA.
 * Valores monetários sempre em centavos, para não ter erro de ponto flutuante.
 */

export type IdPlano = "basico" | "intermediario" | "pro";

export interface Plano {
  id: IdPlano;
  nome: string;
  /** Centavos. */
  precoMensal: number;
  descricao: string;
  beneficios: string[];
  recomendado?: boolean;
}

export interface OfertaAssinatura {
  plataforma: {
    nome: string;
    /** Centavos. */
    precoMensal: number;
    inclui: string[];
  };
  planos: Plano[];
}

export type BandeiraCartao = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "desconhecida";

/** Só o que é seguro guardar e exibir; número completo e CVV nunca saem do gateway. */
export interface CartaoSalvo {
  bandeira: BandeiraCartao;
  /** Últimos 4 dígitos. */
  final: string;
  /** "MM/AA". */
  validade: string;
}

export interface DadosAssinatura {
  planoId: IdPlano;
  /**
   * Token devolvido pelo gateway de pagamento (`src/lib/pagamento`). Os dados do
   * cartão vão direto do navegador para o gateway e nunca passam pela API da Sophia.
   */
  tokenCartao: string;
  titular: {
    nome: string;
    /** Só dígitos. */
    cpf: string;
  };
}

export type StatusAssinatura = "ativa" | "pendente" | "recusada";

export interface Assinatura {
  id: string;
  planoId: IdPlano;
  status: StatusAssinatura;
  /** Plataforma + plano, em centavos. */
  valorMensal: number;
  cartao: CartaoSalvo;
  /** ISO 8601. */
  criadaEm: string;
}

export interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
  criarCaso(dados: DadosNovoCaso): Promise<Caso>;
  moverCaso(id: string, pasta: PastaCaso): Promise<Caso>;
  excluirCaso(id: string): Promise<void>;
  obterOfertaAssinatura(): Promise<OfertaAssinatura>;
  /** Rejeita com `Error` de mensagem amigável quando o pagamento é recusado. */
  assinar(dados: DadosAssinatura): Promise<Assinatura>;
}
