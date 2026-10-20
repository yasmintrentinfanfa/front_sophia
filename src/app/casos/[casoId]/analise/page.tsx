"use client";

import { useState } from "react";
import Link from "next/link";

import { ColunasAnalise } from "@/components/casos/colunas-analise";
import { ModalConfigurarIA } from "@/components/casos/modal-configurar-ia";
import { ModalPecaProcessual } from "@/components/casos/modal-peca-processual";
import { useCasoAtual } from "@/components/casos/contexto-caso-atual";
import { INSIGHTS, RESUMO_ANALISE } from "@/lib/analise/dados";

export default function PaginaAnaliseIA() {
  const caso = useCasoAtual();
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalPecaAberto, setModalPecaAberto] = useState(false);

  return (
    <>
      <header className="flex w-full shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] leading-none font-bold">Análise preliminar de caso</h1>
          <p className="text-tinta-suave text-[13px]">
            Insights gerados a partir da transcrição e documentos · {caso.titulo}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setModalConfigAberto(true)}
            className="border-borda bg-campo flex h-9 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Configurar IA
          </button>
          <button
            type="button"
            onClick={() => setModalPecaAberto(true)}
            className="bg-acao text-acao-tinta flex h-9 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            Gerar peça processual
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-7 pt-3 pb-7">
        <section className="bg-campo border-borda flex flex-col gap-1 rounded-[10px] border px-4 py-3">
          <h2 className="text-[13px] font-semibold">Transcrição do áudio do cliente e documentos juntados</h2>
          <p className="text-tinta-suave text-[12px] leading-relaxed">{RESUMO_ANALISE}</p>
        </section>

        <ColunasAnalise insights={INSIGHTS} />

        <Link href={`/casos/${caso.id}/chat`} className="text-destaque w-fit text-[12px] font-semibold">
          Conversar com a IA sobre este caso →
        </Link>
      </div>

      <ModalConfigurarIA aberto={modalConfigAberto} aoFechar={() => setModalConfigAberto(false)} />
      <ModalPecaProcessual
        aberto={modalPecaAberto}
        aoFechar={() => setModalPecaAberto(false)}
        caso={caso}
      />
    </>
  );
}
