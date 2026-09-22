/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend real não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 */

import type { SophiaApi } from "@/lib/api/types";

import { CASOS } from "./dados";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockApi: SophiaApi = {
  async listarCasos() {
    await esperar(220);
    return structuredClone(CASOS);
  },
};
