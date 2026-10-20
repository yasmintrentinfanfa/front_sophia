"use client";

import { createContext, useContext } from "react";

import type { Caso } from "@/lib/api/types";

const ContextoCasoAtual = createContext<Caso | null>(null);

export const ProvedorCasoAtual = ContextoCasoAtual.Provider;

/**
 * Caso da rota `/casos/[casoId]/*`. O layout do segmento já trata carregamento e
 * caso inexistente, então as páginas sempre recebem um caso válido.
 */
export function useCasoAtual() {
  const caso = useContext(ContextoCasoAtual);
  if (!caso) throw new Error("ProvedorCasoAtual ausente");
  return caso;
}
