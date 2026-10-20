"use client";

import { useState } from "react";
import Link from "next/link";

import { ColunasAnalise, exigeFonte, IconeInfo } from "@/components/casos/colunas-analise";
import { ModalConfigurarIA } from "@/components/casos/modal-configurar-ia";
import { ModalPecaProcessual } from "@/components/casos/modal-peca-processual";
import { useCasoAtual } from "@/components/casos/contexto-caso-atual";
import { INSIGHTS, RESUMO_ANALISE } from "@/lib/analise/dados";
import type { CategoriaInsight } from "@/lib/analise/tipos";
import { STATUS_CASO } from "@/lib/casos/status";

const INDICADORES: { categoria: CategoriaInsight; rotulo: string }[] = [
  { categoria: "tese", rotulo: "Teses" },
  { categoria: "jurisprudencia", rotulo: "Jurisprudência" },
  { categoria: "pergunta", rotulo: "Perguntas" },
  { categoria: "necessidade", rotulo: "Necessidades" },
];

export default function PaginaAnaliseIA() {
  const caso = useCasoAtual();
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalPecaAberto, setModalPecaAberto] = useState(false);

  const comFonteExigida = INSIGHTS.filter((insight) => exigeFonte(insight.categoria));
  const verificadas = comFonteExigida.filter((insight) => insight.fontes.length > 0).length;
  const percentualVerificado = comFonteExigida.length ? (verificadas / comFonteExigida.length) * 100 : 0;

  return (
    <>
      <header className="flex w-full shrink-0 flex-wrap items-end justify-between gap-4 px-7 pt-6 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-destaque text-[11px] font-semibold tracking-wide uppercase">Análise preliminar de caso</p>
          <h1 className="truncate text-[24px] leading-tight font-bold">{caso.titulo}</h1>
          <p className="text-tinta-suave flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span>Cliente: {caso.cliente}</span>
            {caso.area ? (
              <>
                <span aria-hidden>·</span>
                <span>{caso.area}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span className="bg-destaque-suave text-destaque rounded-full px-2 py-px text-[11px] font-semibold">
              {STATUS_CASO[caso.status]}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setModalConfigAberto(true)}
            className="border-borda bg-campo hover:border-destaque/60 flex h-10 items-center rounded-[8px] border px-4 text-[13px] font-semibold"
          >
            Configurar IA
          </button>
          <button
            type="button"
            onClick={() => setModalPecaAberto(true)}
            className="bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-4 text-[13px] font-semibold"
          >
            Gerar peça processual
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-7 pt-1 pb-8">
        <section className="bg-campo border-borda grid gap-5 rounded-[12px] border p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-2">
            <p className="text-destaque text-[11px] font-semibold tracking-wide uppercase">Resumo do caso</p>
            <p className="text-[13px] leading-relaxed">{RESUMO_ANALISE}</p>
            <p className="text-tinta-suave mt-1 flex items-start gap-2 text-[11px] leading-snug">
              <IconeInfo className="mt-px size-3.5 shrink-0" />
              Gerado a partir da transcrição e dos documentos juntados. É um ponto de partida: revise as fontes
              antes de usar.
            </p>
          </div>

          <div className="bg-superficie border-borda flex flex-col gap-4 rounded-[10px] border p-4">
            <dl className="grid grid-cols-2 gap-3">
              {INDICADORES.map(({ categoria, rotulo }) => (
                <div key={categoria} className="flex flex-col">
                  <dt className="text-tinta-suave order-2 text-[11px]">{rotulo}</dt>
                  <dd className="order-1 text-[22px] leading-tight font-bold">
                    {INSIGHTS.filter((insight) => insight.categoria === categoria).length}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-borda flex flex-col gap-1.5 border-t pt-3">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="font-medium">Fontes verificadas</span>
                <span className="font-semibold">
                  {verificadas} de {comFonteExigida.length}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Fontes verificadas"
                aria-valuemin={0}
                aria-valuemax={comFonteExigida.length}
                aria-valuenow={verificadas}
                className="bg-borda/50 h-1.5 overflow-hidden rounded-full"
              >
                <div className="bg-destaque h-full rounded-full" style={{ width: `${percentualVerificado}%` }} />
              </div>
            </div>
          </div>
        </section>

        <ColunasAnalise insights={INSIGHTS} />

        <section className="bg-destaque-suave flex flex-wrap items-center justify-between gap-4 rounded-[12px] px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[14px] font-semibold">Quer aprofundar alguma tese?</h2>
            <p className="text-tinta-suave text-[12px]">
              Converse com a IA sobre este caso para testar hipóteses ou pedir novos caminhos.
            </p>
          </div>
          <Link
            href={`/casos/${caso.id}/chat`}
            className="pressionavel bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-4 text-[13px] font-semibold"
          >
            Conversar com a IA →
          </Link>
        </section>
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
