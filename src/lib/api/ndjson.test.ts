import { describe, expect, it } from "vitest";

import { lerNdjson } from "@/lib/api/ndjson";

function corpo(pedacos: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controle) {
      pedacos.forEach((pedaco) => controle.enqueue(pedaco));
      controle.close();
    },
  });
}

describe("lerNdjson", () => {
  it("entrega cada linha mesmo com a linha e o acento cortados entre pedaços", async () => {
    const bytes = new TextEncoder().encode('{"tipo":"trecho","texto":"Atenção"}\n\n{"tipo":"fim"}');
    // Corta no meio do "ç" (2 bytes) e no meio da segunda linha.
    const corte = bytes.indexOf(0xc3) + 1;
    const eventos: unknown[] = [];
    await lerNdjson(corpo([bytes.slice(0, corte), bytes.slice(corte, corte + 20), bytes.slice(corte + 20)]), (e) =>
      eventos.push(e),
    );
    expect(eventos).toEqual([{ tipo: "trecho", texto: "Atenção" }, { tipo: "fim" }]);
  });

  it("não entrega nada de um corpo vazio", async () => {
    const eventos: unknown[] = [];
    await lerNdjson(corpo([]), (e) => eventos.push(e));
    expect(eventos).toEqual([]);
  });
});
