import type { Caso } from "@/lib/api/types";

/** Telas do repositório do caso: adicionar material (gravar, enviar, escrever) e a lista do que já entrou. */
export function estaNoRepositorio(caminho: string) {
  return /\/casos\/[^/]+\/(repositorio|sessao|gravacao)(\/|$)/.test(caminho);
}

/**
 * Para onde vai o clique num caso. Dentro do repositório, troca de caso sem sair dele (na mesma tela);
 * em qualquer outro lugar (Casos em análise, chat, peças), abre a análise do caso.
 */
export function destinoDoCaso(caso: Caso, origem = "") {
  if (origem.includes("/repositorio/materiais")) {
    return `/casos/${caso.id}/repositorio/materiais`;
  }
  if (estaNoRepositorio(origem)) {
    return `/casos/${caso.id}/repositorio`;
  }
  return `/casos/${caso.id}/analise`;
}
