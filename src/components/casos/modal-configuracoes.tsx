"use client";

import { IconeTelefone } from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { SeletorDestaque } from "@/components/tema/seletor-destaque";
import { Modal } from "@/components/ui/modal";

interface ModalConfiguracoesProps {
  aberto: boolean;
  aoFechar: () => void;
  aoPedirSaida: () => void;
}

export function ModalConfiguracoes({
  aberto,
  aoFechar,
  aoPedirSaida,
}: ModalConfiguracoesProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Configurações"
      descricao="Tema, cor, pagamento e sessão"
      className="max-w-[340px]"
    >
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
            disabled
            title="Troca de plano · em breve"
            className="border-borda bg-campo flex h-8 shrink-0 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-60"
          >
            Alterar
          </button>
        </div>

        <div className="border-borda flex items-center justify-between rounded-[10px] border px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold">Sessão</p>
            <p className="text-tinta-suave text-[12px]">Voltar para a tela de login</p>
          </div>
          <button
            type="button"
            onClick={aoPedirSaida}
            className="pressionavel border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          title="Entre em contato o suporte"
          aria-label="Entre em contato o suporte"
          className="text-tinta-suave flex size-8 items-center justify-center rounded-[8px]"
        >
          <IconeTelefone />
        </span>
        <button
          type="button"
          onClick={aoFechar}
          className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}
