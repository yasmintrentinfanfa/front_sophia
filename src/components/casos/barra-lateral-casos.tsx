"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Hamburguer,
  IconeCasos,
  IconeConfiguracoes,
  IconeNovoCaso,
  IconeRepositorio,
} from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Caso } from "@/lib/api/types";
import { normalizar } from "@/lib/texto";
import { cn } from "@/lib/utils";

interface BarraLateralCasosProps {
  casos: Caso[];
  carregando?: boolean;
}

export function BarraLateralCasos({ casos, carregando = false }: BarraLateralCasosProps) {
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [expandida, setExpandida] = useState(true);

  const casosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return casos;
    return casos.filter((caso) => normalizar(`${caso.titulo} ${caso.cliente}`).includes(termo));
  }, [busca, casos]);

  /** Como no protótipo, o primeiro caso aparece em destaque até o usuário escolher outro. */
  const idEmDestaque = escolhido ?? casosFiltrados[0]?.id;

  return (
    <aside
      className={cn(
        "bg-barra flex shrink-0 items-start overflow-hidden px-[10px] py-[12px] transition-[width] duration-200 ease-out",
        expandida ? "w-[300px]" : "w-[68px]",
      )}
    >
      <TrilhaIcones expandida={expandida} aoAlternar={() => setExpandida((atual) => !atual)} />

      {expandida ? (
        <div
          id="painel-lista-casos"
          className="bg-painel flex h-full min-w-px flex-1 flex-col gap-[10px] rounded-[10px] px-[12px] py-[14px]"
        >
          <p className="text-[15px] font-bold">SOPHIA</p>
          <h2 className="text-[12px] font-semibold">Casos em análise</h2>

          <div className="border-borda focus-within:border-destaque bg-campo flex h-[32px] w-full items-center gap-[6px] rounded-[8px] border px-[10px]">
            <span aria-hidden className="text-tinta-suave text-[11px]">
              ⌕
            </span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar"
              aria-label="Buscar caso ou cliente"
              className="text-tinta-suave placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {carregando ? (
              <ListaEsqueleto />
            ) : casosFiltrados.length === 0 ? (
              <p className="text-tinta-suave py-4 text-[11px]">Nenhum caso encontrado.</p>
            ) : (
              <ul className="flex w-full flex-col gap-[6px]">
                {casosFiltrados.map((caso) => (
                  <li key={caso.id}>
                    <button
                      type="button"
                      onClick={() => setEscolhido(caso.id)}
                      aria-current={caso.id === idEmDestaque ? "true" : undefined}
                      className={cn(
                        "flex min-h-[36px] w-full items-center rounded-[8px] px-[10px] py-[8px] text-left text-[10px] leading-tight font-medium transition-colors",
                        caso.id === idEmDestaque
                          ? "border-destaque bg-ativo text-ativo-tinta border-[1.5px]"
                          : "bg-chip text-meta border-borda hover:border-destaque/60 border",
                      )}
                    >
                      <span className="line-clamp-2">{caso.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function TrilhaIcones({
  expandida,
  aoAlternar,
}: {
  expandida: boolean;
  aoAlternar: () => void;
}) {
  return (
    <nav className="bg-trilha flex h-full w-[48px] flex-col items-center gap-[8px] rounded-[10px] px-[4px] pt-[4px] pb-[8px]">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-expanded={expandida}
              aria-controls="painel-lista-casos"
              onClick={aoAlternar}
              className="hover:bg-tinta/5 flex h-[28px] w-full items-center justify-center rounded-[8px]"
            >
              <Hamburguer />
              <span className="sr-only">
                {expandida ? "Recolher lista de casos" : "Expandir lista de casos"}
              </span>
            </button>
          }
        />
        <TooltipContent side="right">
          {expandida ? "Recolher lista" : "Expandir lista"}
        </TooltipContent>
      </Tooltip>

      <BotaoTrilha rotulo="Novo caso">
        <IconeNovoCaso />
      </BotaoTrilha>

      <Tooltip>
        <TooltipTrigger
          render={
            <span
              aria-current="page"
              className="bg-destaque-suave border-destaque flex h-[36px] items-center justify-center rounded-[10px] border-[1.5px] px-[6px]"
            >
              <IconeCasos />
              <span className="sr-only">Casos em análise</span>
            </span>
          }
        />
        <TooltipContent side="right">Casos em análise</TooltipContent>
      </Tooltip>

      <BotaoTrilha rotulo="Repositório de casos">
        <IconeRepositorio />
      </BotaoTrilha>

      <span className="flex-1" />

      <Tooltip>
        <TooltipTrigger
          render={
            <span className="flex justify-center">
              <BotaoTema />
            </span>
          }
        />
        <TooltipContent side="right">
          <span className="dark:hidden">Modo escuro</span>
          <span className="hidden dark:inline">Modo claro</span>
        </TooltipContent>
      </Tooltip>

      <BotaoTrilha rotulo="Configurações">
        <IconeConfiguracoes />
      </BotaoTrilha>
    </nav>
  );
}

/** Telas que existem no protótipo mas ainda não foram implementadas. */
function BotaoTrilha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            disabled
            className="flex h-[36px] items-center justify-center rounded-[10px] px-[6px] disabled:pointer-events-auto"
          >
            {children}
            <span className="sr-only">{rotulo}</span>
          </button>
        }
      />
      <TooltipContent side="right">{rotulo} · em breve</TooltipContent>
    </Tooltip>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-[6px]" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li key={indice} className="bg-superficie h-[36px] animate-pulse rounded-[8px]" />
      ))}
    </ul>
  );
}
