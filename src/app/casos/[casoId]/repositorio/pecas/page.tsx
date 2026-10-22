"use client";

import { TelaPecas } from "@/components/pecas/tela-pecas";

export default function PaginaPecasRepositorio() {
  return (
    <TelaPecas
      destinoVoltar={(casoId) => `/casos/${casoId}/repositorio/analise`}
      destinoAnalise={(casoId) => `/casos/${casoId}/repositorio/analise`}
    />
  );
}
