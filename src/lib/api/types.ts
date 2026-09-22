/**
 * Modelo de domínio consumido pelo front.
 *
 * O backend está sendo construído em paralelo. Este arquivo cobre apenas o que as
 * telas já implementadas usam; o contrato completo (análise preliminar, fontes,
 * sanitização de documentos e chat) está em `docs/contrato-api.md`.
 */

/** Estados exibidos na lista de casos do protótipo. */
export type StatusCaso = "gravacao_pendente" | "em_analise" | "concluido";

export interface Caso {
  id: string;
  /** "Rescisão contratual — Silva" */
  titulo: string;
  /** Nome do cliente atendido, exibido como "Cliente: …". */
  cliente: string;
  status: StatusCaso;
  /** ISO 8601. */
  atualizadoEm: string;
}

export interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
}
