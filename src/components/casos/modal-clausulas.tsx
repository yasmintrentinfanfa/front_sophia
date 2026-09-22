"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { CLAUSULAS } from "@/lib/clausulas";

interface ModalClausulasProps {
  aberto: boolean;
  modo: "aceite" | "consulta";
  aoFechar: () => void;
  aoConfirmar?: () => void;
}

export function ModalClausulas({ aberto, modo, aoFechar, aoConfirmar }: ModalClausulasProps) {
  const idTitulo = useId();
  const idAceite = useId();
  const [montado, setMontado] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  const exigeAceite = modo === "aceite";

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) {
      setAceitou(false);
      return;
    }

    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, aoFechar]);

  if (!montado || !aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="bg-campo border-borda flex max-h-[min(88dvh,640px)] w-full max-w-[480px] flex-col rounded-[10px] border p-4 shadow-lg"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="text-[15px] font-semibold">
          Termos de uso e Política de privacidade
        </h2>
        <p className="text-tinta-suave mt-1 text-[12px]">
          {exigeAceite
            ? "Na primeira entrada, leia e confirme as cláusulas para usar a Sophia."
            : "Cláusulas do serviço Sophia."}
        </p>

        <div className="border-borda mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border px-3 py-2.5">
          <ol className="flex flex-col gap-3">
            {CLAUSULAS.map((clausula) => (
              <li key={clausula.titulo}>
                <h3 className="text-[12px] leading-snug font-semibold">{clausula.titulo}</h3>
                <p className="text-tinta-suave mt-1 text-[11px] leading-relaxed">{clausula.texto}</p>
              </li>
            ))}
          </ol>
        </div>

        {exigeAceite ? (
          <label htmlFor={idAceite} className="mt-3 flex items-start gap-2">
            <input
              id={idAceite}
              type="checkbox"
              checked={aceitou}
              onChange={(evento) => setAceitou(evento.target.checked)}
              className="border-borda accent-destaque mt-0.5 size-3.5 shrink-0 rounded-[3px]"
            />
            <span className="text-[12px] leading-snug">
              Li e concordo com os termos de uso e a política de privacidade.
            </span>
          </label>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            {exigeAceite ? "Cancelar" : "Fechar"}
          </button>
          {exigeAceite ? (
            <button
              type="button"
              disabled={!aceitou}
              onClick={aoConfirmar}
              className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold disabled:opacity-40"
            >
              Concordo
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
