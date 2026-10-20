"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import { ProvedorCasoAtual } from "@/components/casos/contexto-caso-atual";
import { useListaCasos } from "@/components/casos/contexto-lista-casos";

export default function LayoutCaso({ children }: { children: ReactNode }) {
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando } = useListaCasos();
  const caso = casos.find((item) => item.id === casoId);

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Caso não encontrado.</p>;
  }

  return <ProvedorCasoAtual value={caso}>{children}</ProvedorCasoAtual>;
}
