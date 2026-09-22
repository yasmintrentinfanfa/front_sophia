/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend real não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 */

import type { Caso, SophiaApi } from "@/lib/api/types";

import { CASOS } from "./dados";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `caso-${Date.now()}`;
}

let casos = structuredClone(CASOS);

export const mockApi: SophiaApi = {
  async listarCasos() {
    await esperar(220);
    return structuredClone(casos);
  },

  async criarCaso(dados) {
    await esperar(180);
    let id = slug(dados.titulo);
    if (casos.some((caso) => caso.id === id)) {
      id = `${id}-${Date.now()}`;
    }
    const criado: Caso = {
      id,
      titulo: dados.titulo.trim(),
      cliente: dados.cliente.trim(),
      area: dados.area?.trim() || undefined,
      status: "gravacao_pendente",
      atualizadoEm: new Date().toISOString(),
    };
    casos = [criado, ...casos];
    return structuredClone(criado);
  },
};
