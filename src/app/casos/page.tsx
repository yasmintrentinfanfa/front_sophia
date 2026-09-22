"use client";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Caso } from "@/lib/api/types";
import { STATUS_CASO } from "@/lib/casos/status";
import { formatarDataCurta } from "@/lib/formato";

export default function PaginaCasos() {
  const { casos, carregando } = useListaCasos();

  return (
    <>
      <header className="flex h-[80px] w-full shrink-0 items-center justify-between px-[40px] pt-[28px] pb-[12px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <h1 className="text-[28px] leading-none font-bold">Casos em análise</h1>
          <p className="text-sm">Gerencie seus casos e acompanhe o progresso</p>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                disabled
                className="bg-acao text-acao-tinta flex h-[40px] w-[140px] items-center justify-center rounded-[10px] text-[13px] font-semibold disabled:pointer-events-auto"
              >
                Novo caso
              </button>
            }
          />
          <TooltipContent side="bottom">Criação de caso · em breve</TooltipContent>
        </Tooltip>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[40px] pt-[8px] pb-[40px]">
        {carregando ? (
          <ListaEsqueleto />
        ) : casos.length === 0 ? (
          <p className="text-tinta-suave text-sm">Nenhum caso cadastrado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-[12px]">
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

/**
 * Apresentação apenas: a tela de análise do caso ("06 - Análise IA" no protótipo)
 * ainda não existe, então o cartão não navega para lugar nenhum.
 */
function CartaoCaso({ caso }: { caso: Caso }) {
  return (
    <article className="bg-superficie border-borda flex h-[88px] w-full items-center justify-between rounded-[12px] border px-[20px] py-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <h2 className="truncate text-[15px] font-semibold">{caso.titulo}</h2>
        <p className="text-tinta-suave truncate text-[13px]">Cliente: {caso.cliente}</p>
      </div>
      <div className="text-meta flex shrink-0 flex-col items-end gap-[6px] text-[12px]">
        <p className="font-medium">{STATUS_CASO[caso.status]}</p>
        <p>{formatarDataCurta(caso.atualizadoEm)}</p>
      </div>
    </article>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-[12px]" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li
          key={indice}
          className="bg-superficie border-borda h-[88px] animate-pulse rounded-[12px] border"
        />
      ))}
    </ul>
  );
}
