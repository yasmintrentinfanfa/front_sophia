/**
 * Mensagem do chat que leva documentos junto: o nome de cada arquivo vai numa linha
 * `[Documento anexado: nome]` antes do texto. A IA sabe de qual arquivo o advogado fala (o
 * conteúdo dele já está no contexto do caso), e a conversa salva mostra o anexo ao recarregar.
 */
const MARCA = /^\[Documento anexado: (.+)\]$/;

export function comAnexos(texto: string, nomes: string[]) {
  return [...nomes.map((nome) => `[Documento anexado: ${nome}]`), texto].join("\n");
}

/** Separa as linhas de anexo do começo da mensagem; o resto é o texto que o advogado escreveu. */
export function separarAnexos(conteudo: string) {
  const linhas = conteudo.split("\n");
  const anexos: string[] = [];
  let indice = 0;
  for (; indice < linhas.length; indice += 1) {
    const achado = linhas[indice].trim().match(MARCA);
    if (!achado) break;
    anexos.push(achado[1]);
  }
  return { anexos, texto: linhas.slice(indice).join("\n").trim() };
}

/** "820 KB", "1,4 MB": tamanho curto para o arquivo que espera ser enviado. */
export function tamanhoDoArquivo(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
