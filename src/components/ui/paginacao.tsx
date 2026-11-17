"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { paginasVisiveis, type PaginaDeItens } from "@/lib/paginacao";
import { mostrarInicio } from "@/lib/rolagem";
import { cn } from "@/lib/utils";

const BOTAO =
  "pressionavel border-borda bg-campo flex h-8 min-w-8 items-center justify-center rounded-[8px] border px-2 text-[12px] font-semibold disabled:pointer-events-none disabled:opacity-40";

/**
 * Navegação entre páginas de uma lista (resultado de `paginar`). Com uma página só, não
 * aparece. Ao trocar de página, traz de volta à vista o começo do `section` em volta, para a
 * lista nova não começar acima da tela.
 */
export function Paginacao({
  pagina,
  rotulo,
  aoMudar,
}: {
  pagina: Pick<PaginaDeItens<unknown>, "pagina" | "totalPaginas" | "de" | "ate" | "total">;
  /** Nome da navegação para leitores de tela, ex.: "Páginas dos prazos agendados". */
  rotulo: string;
  aoMudar: (pagina: number) => void;
}) {
  const nav = useRef<HTMLElement>(null);
  if (pagina.totalPaginas <= 1) return null;

  function ir(destino: number) {
    aoMudar(destino);
    mostrarInicio(nav.current?.closest("section"));
  }

  return (
    <nav ref={nav} aria-label={rotulo} className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-tinta-suave text-[12px]" aria-live="polite">
        {pagina.de}–{pagina.ate} de {pagina.total}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={BOTAO}
          disabled={pagina.pagina === 1}
          onClick={() => ir(pagina.pagina - 1)}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        {paginasVisiveis(pagina.pagina, pagina.totalPaginas).map((numero, i) =>
          numero === "…" ? (
            <span key={`salto-${i}`} aria-hidden className="text-tinta-suave px-1 text-[12px]">
              …
            </span>
          ) : (
            <button
              key={numero}
              type="button"
              aria-current={numero === pagina.pagina ? "page" : undefined}
              aria-label={`Página ${numero}`}
              onClick={() => ir(numero)}
              className={cn(
                BOTAO,
                numero === pagina.pagina && "border-destaque bg-destaque-suave text-destaque pointer-events-none",
              )}
            >
              {numero}
            </button>
          ),
        )}
        <button
          type="button"
          className={BOTAO}
          disabled={pagina.pagina === pagina.totalPaginas}
          onClick={() => ir(pagina.pagina + 1)}
          aria-label="Próxima página"
          title="Próxima página"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
