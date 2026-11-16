"use client";

import { useParams } from "next/navigation";

import { PainelPrazos } from "@/components/prazos/painel-prazos";

/** Prazos de um caso. Opcional: o caso só ganha acompanhamento se o advogado informar o processo. */
export default function PaginaPrazosDoCaso() {
  const { casoId } = useParams<{ casoId: string }>();
  return <PainelPrazos key={casoId} casoId={casoId} />;
}
