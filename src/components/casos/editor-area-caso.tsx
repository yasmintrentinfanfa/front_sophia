"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PenLine } from "lucide-react";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { SeletorAreaJuridica } from "@/components/casos/seletor-area-juridica";
import { areaPorId } from "@/lib/casos/areas-juridicas";
import { cn } from "@/lib/utils";

const DICA = "A área orienta a IA na análise, no chat e nas minutas, e ordena as peças sugeridas.";

/**
 * Área jurídica do caso num selo compacto, com um lápis para trocar. A área escolhe a
 * orientação que a IA recebe na análise, no chat e nas minutas; trocar não refaz os cards
 * já gerados (a tela de análise avisa para atualizar).
 */
export function EditorAreaCaso({ casoId, area, className }: { casoId: string; area?: string; className?: string }) {
  const idCampo = useId();
  const { alterarArea } = useListaCasos();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const lapis = useRef<HTMLButtonElement>(null);
  // Ao desistir pelo teclado ou pela seta, o foco volta ao lápis (o campo some da tela).
  const focarLapis = useRef(false);
  const nomeAtual = areaPorId(area)?.nome;

  useEffect(() => {
    if (editando || !focarLapis.current) return;
    focarLapis.current = false;
    lapis.current?.focus();
  }, [editando]);

  async function salvar(novaArea: string) {
    if (novaArea === area) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await alterarArea(casoId, novaArea);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível alterar a área.");
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  /** Fechou a lista sem escolher (clique fora, Esc ou seta): volta ao selo. */
  function desistir(motivo: "fora" | "tecla" | "seta") {
    if (salvando) return;
    focarLapis.current = motivo !== "fora";
    setEditando(false);
  }

  if (editando) {
    return (
      <div className={cn("flex w-full max-w-[280px] flex-col gap-1.5", className)}>
        <SeletorAreaJuridica
          id={idCampo}
          valor={area ?? ""}
          aoMudar={(novaArea) => void salvar(novaArea)}
          aoFechar={desistir}
          abertoInicial
        />
        {salvando ? <p className="text-tinta-suave text-[11px]">Salvando…</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-full min-w-0 flex-col items-start gap-1", className)}>
      <span
        title={DICA}
        className={cn(
          "inline-flex max-w-full items-center gap-0.5 rounded-full py-0.5 pr-0.5 pl-2.5 text-[11px] font-semibold",
          nomeAtual ? "bg-destaque-suave text-destaque" : "border-destaque/50 text-destaque border border-dashed",
        )}
      >
        <span className="truncate">{nomeAtual ?? "Área não definida"}</span>
        <button
          ref={lapis}
          type="button"
          onClick={() => {
            setErro("");
            setEditando(true);
          }}
          aria-label={nomeAtual ? `Alterar a área do caso (atual: ${nomeAtual})` : "Escolher a área do caso"}
          title={nomeAtual ? "Alterar área" : "Escolher área"}
          className="hover:bg-destaque/15 focus-visible:ring-destaque/40 flex size-5 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2"
        >
          <PenLine className="size-3" aria-hidden />
        </button>
      </span>
      {erro ? (
        <p role="alert" className="text-destructive text-[11px] font-medium">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
