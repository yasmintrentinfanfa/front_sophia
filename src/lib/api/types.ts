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
 * Conta do advogado. O cadastro é salvo no MongoDB pelo backend; a sessão vem num
 * cookie httpOnly, então o front nunca guarda token nem envia o id do usuário —
 * o backend descobre quem é pelo cookie.
 */

/** A conta só libera os casos depois que a assinatura é paga. */
export type StatusConta = "pagamento_pendente" | "ativa";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  statusConta: StatusConta;
  /** ISO 8601. */
  criadoEm: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  /** Vai em texto puro só pelo HTTPS; o backend guarda apenas o hash. */
  senha: string;
  /** Prova do aceite, guardada junto do usuário. */
  aceiteTermos: {
    /** Versão do texto aceito (`VERSAO_TERMOS` em `src/lib/conta.ts`). */
    versao: string;
    /** ISO 8601. */
    aceitoEm: string;
  };
}

export interface DadosEntrar {
  email: string;
  senha: string;
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
  /** Dono da assinatura; definido pelo backend a partir da sessão. */
  usuarioId: string;
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

  /** Cria a conta já com sessão aberta. Rejeita se o e-mail já estiver em uso. */
  criarConta(dados: DadosCadastro): Promise<Usuario>;
  /** Rejeita com `Error` de mensagem amigável quando e-mail ou senha não conferem. */
  entrar(dados: DadosEntrar): Promise<Usuario>;
  sair(): Promise<void>;
  /** `null` quando não há sessão. */
  obterUsuarioAtual(): Promise<Usuario | null>;

  obterOfertaAssinatura(): Promise<OfertaAssinatura>;
  /**
   * Assina para o usuário da sessão e passa a conta para `ativa`.
   * Rejeita com `Error` de mensagem amigável quando o pagamento é recusado.
   */
  assinar(dados: DadosAssinatura): Promise<Assinatura>;
}
