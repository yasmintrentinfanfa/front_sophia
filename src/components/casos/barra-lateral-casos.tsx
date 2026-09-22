"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hamburguer,
  IconeCasos,
  IconeConfiguracoes,
  IconeNovoCaso,
  IconeRepositorio,
  IconeSair,
} from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { ModalConfiguracoes } from "@/components/casos/modal-configuracoes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Caso } from "@/lib/api/types";
import { normalizar } from "@/lib/texto";
import { cn } from "@/lib/utils";

interface BarraLateralCasosProps {
  casos: Caso[];
  carregando?: boolean;
}

export function BarraLateralCasos({ casos, carregando = false }: BarraLateralCasosProps) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");
  const [expandida, setExpandida] = useState(true);
  const segmento = pathname.match(/^\/casos\/([^/]+)/)?.[1] ?? null;
  const idDaRota = segmento && segmento !== "novo" ? segmento : null;

  const casosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return casos;
    return casos.filter((caso) => normalizar(`${caso.titulo} ${caso.cliente}`).includes(termo));
  }, [busca, casos]);

  /** Na lista, o primeiro caso; dentro de um caso, o da rota. Em /casos/novo, nenhum. */
  const idEmDestaque =
    idDaRota ?? (pathname === "/casos/novo" ? null : casosFiltrados[0]?.id);

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
                  <Link
                    href={`/casos/${caso.id}/gravacao`}
                    aria-current={caso.id === idEmDestaque ? "page" : undefined}
                    className={cn(
                      "flex min-h-[36px] w-full items-center rounded-[8px] px-[10px] py-[8px] text-left text-[10px] leading-tight font-medium transition-colors",
                      caso.id === idEmDestaque
                        ? "border-destaque bg-ativo text-ativo-tinta border-[1.5px]"
                        : "bg-chip text-meta border-borda hover:border-destaque/60 border",
                    )}
                  >
                    <span className="line-clamp-2">{caso.titulo}</span>
                  </Link>
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
  const pathname = usePathname();
  const [configuracoesAberta, setConfiguracoesAberta] = useState(false);

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

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/casos/novo"
              aria-current={pathname === "/casos/novo" ? "page" : undefined}
              className={cn(
                "flex h-[36px] items-center justify-center rounded-[10px] px-[6px]",
                pathname === "/casos/novo" && "bg-destaque-suave border-destaque border-[1.5px]",
              )}
            >
              <IconeNovoCaso />
              <span className="sr-only">Novo caso</span>
            </Link>
          }
        />
        <TooltipContent side="right">Novo caso</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/casos"
              aria-current={
                pathname === "/casos" ||
                pathname.includes("/gravacao") ||
                pathname.includes("/sessao")
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex h-[36px] items-center justify-center rounded-[10px] px-[6px]",
                (pathname === "/casos" ||
                  pathname.includes("/gravacao") ||
                  pathname.includes("/sessao")) &&
                  "bg-destaque-suave border-destaque border-[1.5px]",
              )}
            >
              <IconeCasos />
              <span className="sr-only">Casos em análise</span>
            </Link>
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

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={configuracoesAberta}
              onClick={() => setConfiguracoesAberta(true)}
              className={cn(
                "flex h-[36px] items-center justify-center rounded-[10px] px-[6px]",
                configuracoesAberta && "bg-destaque-suave border-destaque border-[1.5px]",
              )}
            >
              <IconeConfiguracoes />
              <span className="sr-only">Configurações</span>
            </button>
          }
        />
        <TooltipContent side="right">Configurações</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/login"
              className="flex h-[36px] items-center justify-center rounded-[10px] px-[6px]"
            >
              <IconeSair />
              <span className="sr-only">Sair</span>
            </Link>
          }
        />
        <TooltipContent side="right">Sair</TooltipContent>
      </Tooltip>

      <ModalConfiguracoes
        aberto={configuracoesAberta}
        aoFechar={() => setConfiguracoesAberta(false)}
      />
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
