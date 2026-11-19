"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";

import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { Paginacao } from "@/components/ui/paginacao";
import type { PrazoAgendado } from "@/lib/api/prazos";
import type { Caso } from "@/lib/api/types";
import { paginar } from "@/lib/paginacao";
import { formatarDataComSemana } from "@/lib/prazos/calendario";
import { descreverPrazo, ordenarPrazos, urgenciaDoPrazo, type UrgenciaPrazo } from "@/lib/prazos/estado";
import { formatarProcesso } from "@/lib/prazos/numeros";
import { rotuloCaso } from "@/lib/casos/rotulo";
import { cn } from "@/lib/utils";

const COR: Record<UrgenciaPrazo, string> = {
  vencido: "bg-red-500/10 text-red-700 dark:text-red-300",
  hoje: "bg-red-500/10 text-red-700 dark:text-red-300",
  proximo: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  futuro: "bg-destaque-suave text-destaque",
  cumprido: "bg-chip text-tinta-suave",
};

/** Prazos agendados pelo advogado, do mais urgente ao mais distante, 10 por página. */
export function ListaPrazos({
  prazos,
  hoje,
  casoPorId,
  mostrarCaso,
  cumpridosVisiveis = false,
  aoEditar,
  aoAlternarCumprido,
  aoExcluir,
}: {
  prazos: PrazoAgendado[];
  hoje: string;
  casoPorId: (id: string | null) => Caso | null;
  mostrarCaso: boolean;
  /** Começa mostrando os cumpridos (ex.: os prazos de um dia, no calendário). */
  cumpridosVisiveis?: boolean;
  aoEditar: (prazo: PrazoAgendado) => void;
  aoAlternarCumprido: (prazo: PrazoAgendado) => Promise<void>;
  aoExcluir: (prazo: PrazoAgendado) => Promise<void>;
}) {
  const [verCumpridos, setVerCumpridos] = useState(cumpridosVisiveis);
  const [paraExcluir, setParaExcluir] = useState<PrazoAgendado | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [alternando, setAlternando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const ordenados = ordenarPrazos(prazos);
  const cumpridos = ordenados.filter((prazo) => prazo.cumprido).length;
  const visiveis = verCumpridos ? ordenados : ordenados.filter((prazo) => !prazo.cumprido);
  const paginaAtual = paginar(visiveis, pagina);

  async function alternar(prazo: PrazoAgendado) {
    setAlternando(prazo.id);
    setErro("");
    try {
      await aoAlternarCumprido(prazo);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível atualizar o prazo.");
    } finally {
      setAlternando(null);
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    setErro("");
    try {
      await aoExcluir(paraExcluir);
      setParaExcluir(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível excluir o prazo.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {visiveis.length === 0 ? (
        <p className="text-tinta-suave text-[13px]">
          {prazos.length ? "Todos os prazos estão cumpridos." : "Nenhum prazo agendado ainda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {paginaAtual.itens.map((prazo) => {
            const urgencia = urgenciaDoPrazo(prazo, hoje);
            const caso = mostrarCaso ? casoPorId(prazo.casoId) : null;
            return (
              <li
                key={prazo.id}
                className={cn(
                  "bg-campo border-borda flex items-center gap-3 rounded-[10px] border px-3 py-2.5",
                  prazo.cumprido && "opacity-70",
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={prazo.cumprido}
                  aria-label={prazo.cumprido ? `Reabrir ${prazo.descricao}` : `Marcar ${prazo.descricao} como cumprido`}
                  title={prazo.cumprido ? "Reabrir" : "Marcar como cumprido"}
                  disabled={alternando !== null}
                  onClick={() => void alternar(prazo)}
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
                    prazo.cumprido ? "bg-destaque border-destaque text-white" : "border-borda hover:border-destaque",
                  )}
                >
                  {prazo.cumprido ? <Check className="size-3.5" aria-hidden /> : null}
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className={cn("truncate text-[13px] font-semibold", prazo.cumprido && "line-through")}>
                    {prazo.descricao}
                  </p>
                  <p className="text-tinta-suave flex flex-wrap items-center gap-x-2 text-[11px]">
                    <span>Vence {formatarDataComSemana(prazo.dataFinal)}</span>
                    {prazo.numeroProcesso ? (
                      <span className="font-mono tracking-tight">{formatarProcesso(prazo.numeroProcesso)}</span>
                    ) : null}
                    {caso ? <span className="text-destaque font-medium">{rotuloCaso(caso)}</span> : null}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", COR[urgencia])}>
                  {descreverPrazo(prazo, hoje)}
                </span>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => aoEditar(prazo)}
                    aria-label={`Editar ${prazo.descricao}`}
                    title="Editar"
                    className="text-tinta-suave hover:bg-tinta/5 flex size-7 items-center justify-center rounded-[6px]"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErro("");
                      setParaExcluir(prazo);
                    }}
                    aria-label={`Excluir ${prazo.descricao}`}
                    title="Excluir"
                    className="text-tinta-suave flex size-7 items-center justify-center rounded-[6px] hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Paginacao pagina={paginaAtual} rotulo="Páginas dos prazos agendados" aoMudar={setPagina} />
      {cumpridos ? (
        <button
          type="button"
          onClick={() => {
            setVerCumpridos((valor) => !valor);
            setPagina(1);
          }}
          className="text-tinta-suave hover:text-tinta w-fit text-[12px] font-medium"
        >
          {verCumpridos ? "Esconder cumpridos" : `Mostrar cumpridos (${cumpridos})`}
        </button>
      ) : null}
      {erro && !paraExcluir ? (
        <p role="alert" className="text-destructive text-[12px] font-medium">
          {erro}
        </p>
      ) : null}

      <ModalConfirmar
        aberto={paraExcluir !== null}
        titulo="Excluir este prazo?"
        descricao={
          paraExcluir
            ? `“${paraExcluir.descricao}”, com vencimento em ${formatarDataComSemana(paraExcluir.dataFinal)}, sai da agenda. Se veio de uma intimação, ela volta para “a tratar”.`
            : ""
        }
        confirmar={excluindo ? "Excluindo…" : "Excluir prazo"}
        processando={excluindo}
        erro={erro || undefined}
        aoFechar={() => {
          if (!excluindo) setParaExcluir(null);
        }}
        aoConfirmar={() => void confirmarExclusao()}
      />
    </div>
  );
}
