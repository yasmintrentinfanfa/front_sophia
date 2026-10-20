"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IconeCheck } from "@/components/assinatura/icones";
import { useOfertaAssinatura } from "@/components/assinatura/use-oferta-assinatura";
import type { IdPlano, Plano } from "@/lib/api/types";
import { formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

export default function PaginaPlanos() {
  const router = useRouter();
  const { oferta, erro, carregando } = useOfertaAssinatura();
  const [escolhido, setEscolhido] = useState<IdPlano | null>(null);

  if (carregando) {
    return <p className="text-tinta-suave text-[13px]">Carregando planos…</p>;
  }

  if (erro || !oferta) {
    return <p className="text-destructive text-[13px]">Não foi possível carregar os planos. Recarregue a página.</p>;
  }

  const plano = oferta.planos.find((item) => item.id === escolhido);
  const total = oferta.plataforma.precoMensal + (plano?.precoMensal ?? 0);

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-6 pb-24">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Escolha seu plano</h1>
        <p className="text-tinta-suave text-sm">
          Assinatura mensal da plataforma + créditos de IA para usar nos seus casos.
        </p>
      </div>

      <section className="bg-campo border-borda flex flex-col gap-4 rounded-[12px] border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-destaque text-[11px] font-semibold tracking-wide uppercase">
              Incluído em toda assinatura
            </p>
            <h2 className="text-[17px] font-bold">{oferta.plataforma.nome}</h2>
          </div>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {oferta.plataforma.inclui.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px]">
                <IconeCheck className="text-destaque mt-px shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="flex shrink-0 items-baseline gap-1 sm:flex-col sm:items-end sm:gap-0">
          <span className="text-[22px] font-bold">{formatarMoeda(oferta.plataforma.precoMensal)}</span>
          <span className="text-tinta-suave text-[12px]">por mês</span>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">Créditos de IA</h2>
          <p className="text-tinta-suave text-[12px]">
            Os créditos são usados nas análises, no chat e na geração de peças. Escolha o volume do mês.
          </p>
        </div>

        <div role="radiogroup" aria-label="Plano de créditos de IA" className="grid gap-3 md:grid-cols-3">
          {oferta.planos.map((item) => (
            <CartaoPlano
              key={item.id}
              plano={item}
              selecionado={item.id === escolhido}
              aoSelecionar={() => setEscolhido(item.id)}
            />
          ))}
        </div>
      </section>

      <div className="bg-campo/95 border-borda fixed inset-x-0 bottom-0 z-10 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-tinta-suave text-[11px]">
              {plano
                ? `${oferta.plataforma.nome} + plano ${plano.nome}`
                : "Selecione um plano de créditos para continuar"}
            </p>
            <p className="text-[15px] font-bold">
              {formatarMoeda(total)}
              <span className="text-tinta-suave text-[12px] font-normal"> /mês</span>
            </p>
          </div>
          <button
            type="button"
            disabled={!plano}
            onClick={() => plano && router.push(`/assinatura/pagamento?plano=${plano.id}`)}
            className="bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-5 text-[13px] font-semibold disabled:opacity-40"
          >
            Continuar para pagamento
          </button>
        </div>
      </div>
    </div>
  );
}

function CartaoPlano({
  plano,
  selecionado,
  aoSelecionar,
}: {
  plano: Plano;
  selecionado: boolean;
  aoSelecionar: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={aoSelecionar}
      className={cn(
        "bg-campo relative flex h-full flex-col gap-3 rounded-[12px] border p-4 text-left",
        selecionado
          ? "border-destaque ring-destaque/20 border-[1.5px] ring-4"
          : "border-borda hover:border-destaque/60",
      )}
    >
      {plano.recomendado ? (
        <span className="bg-destaque absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white">
          Recomendado
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-bold">{plano.nome}</h3>
          <p className="text-tinta-suave text-[12px] leading-snug">{plano.descricao}</p>
        </div>
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            selecionado ? "bg-destaque border-destaque text-white" : "border-borda",
          )}
        >
          {selecionado ? <IconeCheck className="size-3" /> : null}
        </span>
      </div>

      <p className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold">{formatarMoeda(plano.precoMensal)}</span>
        <span className="text-tinta-suave text-[12px]">/mês</span>
      </p>

      <ul className="flex flex-col gap-1.5">
        {plano.beneficios.map((beneficio) => (
          <li key={beneficio} className="flex items-start gap-2 text-[12px]">
            <IconeCheck className="text-destaque mt-px shrink-0" />
            {beneficio}
          </li>
        ))}
      </ul>
    </button>
  );
}
