"use client";

import { useId, useState } from "react";
import { ChevronDown, FileText, History, Trash2 } from "lucide-react";

import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import type { PecaGerada } from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Minutas já geradas do caso, recolhidas num cartão só: o resumo mostra quantas são e a mais
 * recente, e a lista abre ao clicar. Cada minuta pode ser aberta ou excluída (some do banco).
 */
export function HistoricoMinutas({
  pecas,
  abrindo,
  aoAbrir,
  aoExcluir,
}: {
  /** Da mais recente para a mais antiga, como o backend devolve. */
  pecas: PecaGerada[];
  /** Id da minuta que está carregando para abrir. */
  abrindo: string | null;
  aoAbrir: (id: string) => void;
  aoExcluir: (peca: PecaGerada) => Promise<void>;
}) {
  const idLista = useId();
  const [aberto, setAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<PecaGerada | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string>();
  const ultima = pecas[0];

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    setErro(undefined);
    try {
      await aoExcluir(paraExcluir);
      setParaExcluir(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível excluir a minuta.");
    } finally {
      setExcluindo(false);
    }
  }

  if (!ultima) return null;

  return (
    <section
      aria-label="Histórico de minutas"
      // shrink-0: com overflow-hidden, a coluna flex da tela espremeria o cartão até sumir.
      className="bg-campo border-borda w-full max-w-[880px] shrink-0 overflow-hidden rounded-[12px] border"
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((valor) => !valor)}
        className="hover:bg-tinta/[0.03] flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      >
        <span className="bg-destaque-suave text-destaque flex size-9 shrink-0 items-center justify-center rounded-[9px]">
          <History className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2 text-[14px] font-semibold">
            Histórico de minutas
            <span className="bg-destaque-suave text-destaque rounded-full px-2 py-px text-[11px] font-semibold">
              {pecas.length}
            </span>
          </span>
          <span className="text-tinta-suave truncate text-[12px]">
            Última: {ultima.titulo} · {formatarDataHora(ultima.geradaEm)}
          </span>
        </span>
        <span className="text-tinta-suave shrink-0 text-[12px] font-medium max-[450px]:hidden">
          {aberto ? "Recolher" : "Ver todas"}
        </span>
        <ChevronDown
          className={cn("text-tinta-suave size-4 shrink-0 transition-transform duration-300", aberto && "rotate-180")}
          aria-hidden
        />
      </button>

      {/* grid-rows de 0fr a 1fr anima a altura sem medir o conteúdo. */}
      <div
        id={idLista}
        inert={!aberto}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="border-borda flex max-h-[320px] flex-col gap-0.5 overflow-y-auto border-t p-1.5">
            {pecas.map((peca) => (
              <li key={peca.id} className="hover:bg-tinta/[0.04] flex items-center gap-1 rounded-[8px] pr-1.5">
                <button
                  type="button"
                  onClick={() => aoAbrir(peca.id)}
                  disabled={abrindo !== null}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[8px] px-2.5 py-2 text-left disabled:opacity-60"
                >
                  <FileText className="text-destaque size-4 shrink-0" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold">{peca.titulo}</span>
                    <span className="text-tinta-suave text-[11px]">{formatarDataHora(peca.geradaEm)}</span>
                  </span>
                  <span className="text-destaque shrink-0 text-[12px] font-semibold">
                    {abrindo === peca.id ? "Abrindo…" : "Abrir"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErro(undefined);
                    setParaExcluir(peca);
                  }}
                  aria-label={`Excluir a minuta ${peca.titulo} de ${formatarDataHora(peca.geradaEm)}`}
                  title="Excluir minuta"
                  className="text-tinta-suave flex size-8 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ModalConfirmar
        aberto={paraExcluir !== null}
        titulo="Excluir esta minuta?"
        descricao={
          paraExcluir
            ? `“${paraExcluir.titulo}”, de ${formatarDataHora(paraExcluir.geradaEm)}, sai do histórico e é apagada de vez. Um .docx que você já baixou continua no seu computador.`
            : ""
        }
        confirmar={excluindo ? "Excluindo…" : "Excluir minuta"}
        processando={excluindo}
        erro={erro}
        aoFechar={() => {
          if (!excluindo) setParaExcluir(null);
        }}
        aoConfirmar={() => void confirmarExclusao()}
      />
    </section>
  );
}
