/**
 * Marca de "tutorial visto", por usuário e por navegador, como o aceite das cláusulas
 * (`src/lib/clausulas.ts`). Quem troca de navegador vê o tutorial de novo: é um passo a
 * passo de boas-vindas, não um dado da conta.
 */
const PREFIXO = "sophia-tutorial:";

export function viuTutorial(usuarioId: string): boolean {
  try {
    return localStorage.getItem(PREFIXO + usuarioId) === "visto";
  } catch {
    // Sem acesso ao armazenamento (modo privado): não insiste em abrir a cada tela.
    return true;
  }
}

export function gravarTutorialVisto(usuarioId: string) {
  try {
    localStorage.setItem(PREFIXO + usuarioId, "visto");
  } catch {
    /* private mode */
  }
}
