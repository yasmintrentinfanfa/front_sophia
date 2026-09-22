"use client";

import { createContext, useContext } from "react";

import type { Caso } from "@/lib/api/types";

interface ValorListaCasos {
  casos: Caso[];
  carregando: boolean;
}

/** A lista é carregada uma vez no layout e compartilhada com a barra lateral e o painel. */
const ContextoListaCasos = createContext<ValorListaCasos>({
  casos: [],
  carregando: true,
});

export const ProvedorListaCasos = ContextoListaCasos.Provider;

export function useListaCasos() {
  return useContext(ContextoListaCasos);
}
