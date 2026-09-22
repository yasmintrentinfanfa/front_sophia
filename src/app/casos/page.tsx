"use client";

import Link from "next/link";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import type { Caso } from "@/lib/api/types";
import { STATUS_CASO } from "@/lib/casos/status";
import { formatarDataCurta } from "@/lib/formato";

export default function PaginaCasos() {
  const { casos, carregando } = useListaCasos();

  return (
    <>
      <header className="flex h-16 w-full shrink-0 items-center justify-between px-7 pt-5 pb-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-[22px] leading-none font-bold">Casos em análise</h1>
          <p className="text-[13px]">Gerencie seus casos e acompanhe o progresso</p>
        </div>

        <Link
          href="/casos/novo"
          className="pressionavel bg-acao text-acao-tinta flex h-8 w-[112px] items-center justify-center rounded-[8px] text-[12px] font-semibold"
        >
          Novo caso
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-2 pb-7">
        {carregando ? (
          <ListaEsqueleto />
        ) : casos.length === 0 ? (
          <p className="text-tinta-suave text-sm">Nenhum caso cadastrado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {casos.map((caso) => (
              <li key={caso.id}>
                <CartaoCaso caso={caso} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function CartaoCaso({ caso }: { caso: Caso }) {
  return (
    <Link
      href={`/casos/${caso.id}/gravacao`}
      className="pressionavel bg-superficie border-borda flex h-[64px] w-full items-center justify-between rounded-[10px] border px-4 py-3"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="truncate text-[13px] font-semibold">{caso.titulo}</h2>
        <p className="text-tinta-suave truncate text-[12px]">Cliente: {caso.cliente}</p>
      </div>
      <div className="text-meta flex shrink-0 flex-col items-end gap-1 text-[11px]">
        <p className="font-medium">{STATUS_CASO[caso.status]}</p>
        <p>{formatarDataCurta(caso.atualizadoEm)}</p>
      </div>
    </Link>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li
          key={indice}
          className="bg-superficie border-borda h-[64px] animate-pulse rounded-[10px] border"
        />
      ))}
    </ul>
  );
}
