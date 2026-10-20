"use client";

import { Modal } from "@/components/ui/modal";

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
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} descricao={descricao} className="max-w-[320px]">
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
    </Modal>
  );
}
