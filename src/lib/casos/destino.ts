import type { Caso } from "@/lib/api/types";

export function destinoDoCaso(caso: Caso) {
  const tela = caso.status === "gravacao_pendente" ? "gravacao" : "analise";
  return `/casos/${caso.id}/${tela}`;
}
