"use client";

import { createContext, useContext } from "react";

import type { Caso, DadosNovoCaso } from "@/lib/api/types";

interface ValorListaCasos {
  casos: Caso[];
  carregando: boolean;
  criarCaso: (dados: DadosNovoCaso) => Promise<Caso>;
}

const ContextoListaCasos = createContext<ValorListaCasos>({
  casos: [],
  carregando: true,
  criarCaso: async () => {
    throw new Error("ProvedorListaCasos ausente");
  },
});

export const ProvedorListaCasos = ContextoListaCasos.Provider;

export function useListaCasos() {
  return useContext(ContextoListaCasos);
}
