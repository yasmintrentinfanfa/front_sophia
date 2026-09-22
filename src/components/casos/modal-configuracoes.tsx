"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { BotaoTema } from "@/components/tema/botao-tema";
import { SeletorDestaque } from "@/components/tema/seletor-destaque";

interface ModalConfiguracoesProps {
  aberto: boolean;
  aoFechar: () => void;
}

export function ModalConfiguracoes({ aberto, aoFechar }: ModalConfiguracoesProps) {
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
        className="bg-campo border-borda w-full max-w-[340px] rounded-[10px] border p-4 shadow-lg"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="text-[15px] font-semibold">
          Configurações
        </h2>
        <p className="text-tinta-suave mt-1 text-[12px]">Tema, cor, pagamento e sessão</p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="border-borda flex items-center justify-between rounded-[10px] border px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-semibold">Aparência</p>
              <p className="text-tinta-suave text-[12px]">
                <span className="dark:hidden">Tema claro</span>
                <span className="hidden dark:inline">Tema escuro</span>
              </p>
            </div>
            <BotaoTema className="size-8" />
          </div>

          <SeletorDestaque />

          <div className="border-borda flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-[13px] font-semibold">Pagamento</p>
              <p className="text-[12px]">Plano mensal · R$ xx</p>
              <p className="text-tinta-suave text-[12px]">Cartão de crédito •••• 4242</p>
            </div>
            <button
              type="button"
              className="border-borda bg-campo flex h-8 shrink-0 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
            >
              Alterar
            </button>
          </div>

          <div className="border-borda flex items-center justify-between rounded-[10px] border px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-semibold">Sessão</p>
              <p className="text-tinta-suave text-[12px]">Voltar para a tela de login</p>
            </div>
            <Link
              href="/login"
              className="pressionavel border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
            >
              Sair
            </Link>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={aoFechar}
            className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
