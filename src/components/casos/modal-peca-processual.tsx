"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { INSIGHTS } from "@/lib/analise/dados";
import { montarRascunho, ROTULO_TIPO_PECA, salvarPeca, type TipoPeca } from "@/lib/pecas";

const TIPOS: TipoPeca[] = ["inicial", "contestacao", "replica", "recurso"];

interface ModalPecaProcessualProps {
  aberto: boolean;
  aoFechar: () => void;
  caso: { id: string; titulo: string; cliente: string };
  aoGerar?: () => void;
}

export function ModalPecaProcessual({ aberto, aoFechar, caso, aoGerar }: ModalPecaProcessualProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Gerar peça processual"
      descricao="Rascunho a partir do contexto já mapeado no caso. Revise antes de usar — não é uma peça final pronta para protocolo."
      className="flex max-w-[460px] flex-col"
    >
      <ConteudoPeca aoFechar={aoFechar} caso={caso} aoGerar={aoGerar} />
    </Modal>
  );
}

function ConteudoPeca({ aoFechar, caso, aoGerar }: Omit<ModalPecaProcessualProps, "aberto">) {
  const [tipo, setTipo] = useState<TipoPeca>("inicial");
  const [rascunho, setRascunho] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function gerar() {
    const teses = INSIGHTS.filter((insight) => insight.categoria === "tese").map((insight) => insight.titulo);
    const jurisprudencia = INSIGHTS.filter((insight) => insight.categoria === "jurisprudencia").map(
      (insight) => insight.titulo,
    );
    const conteudo = montarRascunho({ tipo, caso, teses, jurisprudencia });
    salvarPeca(caso.id, tipo, conteudo);
    setRascunho(conteudo);
    setCopiado(false);
    aoGerar?.();
  }

  async function copiar() {
    if (!rascunho) return;
    try {
      await navigator.clipboard.writeText(rascunho);
      setCopiado(true);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de peça">
        {TIPOS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            role="radio"
            aria-checked={tipo === opcao}
            onClick={() => {
              setTipo(opcao);
              setRascunho(null);
            }}
            className={`flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold ${
              tipo === opcao ? "border-destaque bg-destaque-suave border-[1.5px]" : "border-borda bg-campo"
            }`}
          >
            {ROTULO_TIPO_PECA[opcao]}
          </button>
        ))}
      </div>

      {rascunho ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            readOnly
            value={rascunho}
            rows={10}
            className="border-borda bg-superficie w-full resize-none rounded-[8px] border p-3 font-mono text-[11px] leading-relaxed outline-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-tinta-suave text-[11px]">Salvo no histórico do repositório.</p>
            <button
              type="button"
              onClick={copiar}
              className="border-borda bg-campo flex h-7 items-center rounded-[7px] border px-2.5 text-[11px] font-semibold"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Fechar
        </button>
        <button
          type="button"
          onClick={gerar}
          className="bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
        >
          {rascunho ? "Gerar novamente" : "Gerar rascunho"}
        </button>
      </div>
    </div>
  );
}
