"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

interface ModalConfirmarProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  confirmar: string;
  aoFechar: () => void;
  aoConfirmar: () => void;
}

export function ModalConfirmar({
  aberto,
  titulo,
  descricao,
  confirmar,
  aoFechar,
  aoConfirmar,
}: ModalConfirmarProps) {
  const idTitulo = useId();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;

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
        className="bg-campo border-borda w-full max-w-[320px] rounded-[10px] border p-4 shadow-lg"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="text-[15px] font-semibold">
          {titulo}
        </h2>
        <p className="text-tinta-suave mt-1 text-[12px]">{descricao}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
