/**
 * Modelo de domínio consumido pelo front.
 *
 * O backend está sendo construído em paralelo. Este arquivo cobre apenas o que as
 * telas já implementadas usam; os modelos de análise, repositório e chat estão
 * em `./analise.ts`. O contrato compartilhado está em `docs/contrato-api.md`.
 */

import type { AnalisePreliminar, ConteudoCaso, MensagemChat } from "./analise";

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

export interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
  criarCaso(dados: DadosNovoCaso): Promise<Caso>;
  moverCaso(id: string, pasta: PastaCaso): Promise<Caso>;
  excluirCaso(id: string): Promise<void>;
  obterCaso(casoId: string): Promise<ConteudoCaso>;
  finalizarSessao(casoId: string, transcricao: ConteudoCaso["transcricao"]): Promise<Caso>;
  solicitarAnalise(casoId: string, instrucao?: string): Promise<AnalisePreliminar>;
  listarMensagens(casoId: string): Promise<MensagemChat[]>;
  enviarMensagem(casoId: string, conteudo: string): Promise<MensagemChat[]>;
}
