"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { CLAUSULAS } from "@/lib/clausulas";

interface ModalClausulasProps {
  aberto: boolean;
  modo: "aceite" | "consulta";
  aoFechar: () => void;
  aoConfirmar?: () => void;
}

export function ModalClausulas({ aberto, modo, aoFechar, aoConfirmar }: ModalClausulasProps) {
  const exigeAceite = modo === "aceite";

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Termos de uso e Política de privacidade"
      descricao={
        exigeAceite
          ? "Na primeira entrada, leia e confirme as cláusulas para usar a Sophia."
          : "Cláusulas do serviço Sophia."
      }
      className="flex max-h-[min(88dvh,640px)] max-w-[480px] flex-col"
    >
      <ConteudoClausulas exigeAceite={exigeAceite} aoFechar={aoFechar} aoConfirmar={aoConfirmar} />
    </Modal>
  );
}

/** Montado só com o modal aberto: o aceite recomeça desmarcado a cada abertura. */
function ConteudoClausulas({
  exigeAceite,
  aoFechar,
  aoConfirmar,
}: {
  exigeAceite: boolean;
  aoFechar: () => void;
  aoConfirmar?: () => void;
}) {
  const idAceite = useId();
  const [aceitou, setAceitou] = useState(false);

  return (
    <>
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
        <label htmlFor={idAceite} className="mt-3 flex cursor-pointer items-start gap-2">
          {/* Caixa própria: a nativa some no tema escuro (cinza-escuro sobre cinza-escuro). */}
          <span className="relative mt-px flex size-4 shrink-0">
            <input
              id={idAceite}
              type="checkbox"
              checked={aceitou}
              onChange={(evento) => setAceitou(evento.target.checked)}
              className="peer border-tinta-suave bg-campo checked:border-destaque checked:bg-destaque focus-visible:ring-destaque/30 size-4 cursor-pointer appearance-none rounded-[4px] border-[1.5px] outline-none focus-visible:ring-2"
            />
            <Check
              aria-hidden
              strokeWidth={3}
              className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-white peer-checked:block"
            />
          </span>
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
            className="pressionavel bg-acao text-acao-tinta disabled:bg-chip disabled:text-tinta-suave flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold disabled:cursor-not-allowed"
          >
            Concordo
          </button>
        ) : null}
      </div>
    </>
  );
}
