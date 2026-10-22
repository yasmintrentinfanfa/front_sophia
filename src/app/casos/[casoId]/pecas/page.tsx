"use client";

import { TelaPecas } from "@/components/pecas/tela-pecas";

export default function PaginaPecas() {
  return (
    <TelaPecas
      destinoVoltar={(casoId) => `/casos/${casoId}/analise`}
      destinoAnalise={(casoId) => `/casos/${casoId}/analise`}
    />
  );
}
