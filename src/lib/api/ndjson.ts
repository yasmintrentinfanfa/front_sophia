/**
 * Lê um corpo NDJSON (uma linha JSON por evento) e entrega cada evento assim que a linha
 * termina de chegar. Pedaços da rede podem cortar uma linha, ou um acento, ao meio: o resto
 * fica guardado até o próximo pedaço.
 */
export async function lerNdjson<T>(corpo: ReadableStream<Uint8Array>, aoEvento: (evento: T) => void) {
  const leitor = corpo.getReader();
  const decodificador = new TextDecoder();
  let resto = "";
  const entregar = (linha: string) => {
    const limpa = linha.trim();
    if (limpa) aoEvento(JSON.parse(limpa) as T);
  };
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    resto += decodificador.decode(value, { stream: true });
    const linhas = resto.split("\n");
    resto = linhas.pop() ?? "";
    linhas.forEach(entregar);
  }
  resto += decodificador.decode();
  entregar(resto);
}
