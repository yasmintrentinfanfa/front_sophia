/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend real não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 */

import type { Caso, SophiaApi } from "@/lib/api/types";
import { pastaDoCaso } from "@/lib/casos/rotulo";

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

let casos = structuredClone(CASOS).map((caso) => ({
  ...caso,
  pasta: pastaDoCaso(caso),
}));

export const mockApi: SophiaApi = {
  async listarCasos() {
    await esperar(220);
    casos = casos.map((caso) => ({ ...caso, pasta: pastaDoCaso(caso) }));
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
      pasta: "ativo",
      atualizadoEm: new Date().toISOString(),
    };
    casos = [criado, ...casos];
    return structuredClone(criado);
  },

  async moverCaso(id, pasta) {
    await esperar(120);
    const atual = casos.find((caso) => caso.id === id);
    if (!atual) throw new Error("Caso não encontrado");
    const atualizado = { ...atual, pasta, atualizadoEm: new Date().toISOString() };
    casos = casos.map((caso) => (caso.id === id ? atualizado : caso));
    return structuredClone(atualizado);
  },

  async excluirCaso(id) {
    await esperar(120);
    casos = casos.filter((caso) => caso.id !== id);
  },
};
