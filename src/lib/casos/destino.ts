import type { Caso } from "@/lib/api/types";

/** Telas do repositório do caso: adicionar material (gravar, enviar, escrever) e a lista do que já entrou. */
export function estaNoRepositorio(caminho: string) {
  return /\/casos\/[^/]+\/(repositorio|sessao|gravacao)(\/|$)/.test(caminho);
}

/**
 * Para onde vai o clique num caso. Dentro do repositório, troca de caso sem sair dele (na mesma tela);
 * nos prazos de um caso, abre os prazos do outro; em qualquer outro lugar (Casos em análise,
 * chat, peças, prazos da conta), abre a análise do caso.
 */
export function destinoDoCaso(caso: Caso, origem = "") {
  if (origem.includes("/repositorio/materiais")) {
    return `/casos/${caso.id}/repositorio/materiais`;
  }
  if (estaNoRepositorio(origem)) {
    return `/casos/${caso.id}/repositorio`;
  }
  // Nos prazos de um caso, continua nos prazos do outro. A tela geral (/casos/prazos) abre a análise.
  if (/^\/casos\/[^/]+\/prazos(\/|$)/.test(origem)) {
    return `/casos/${caso.id}/prazos`;
  }
  return `/casos/${caso.id}/analise`;
}
