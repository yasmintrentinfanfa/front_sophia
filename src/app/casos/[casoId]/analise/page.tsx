"use client";

import { TelaAnalise } from "@/components/analise/tela-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";

export default function PaginaAnalise() {
  return (
    <ConteudoCaso>
      {(dados) => (
        <TelaAnalise
          dados={dados}
          destinoVoltar="/casos"
          destinoChat={`/casos/${dados.casoId}/chat`}
          destinoPecas={`/casos/${dados.casoId}/pecas`}
        />
      )}
    </ConteudoCaso>
  );
}
