"use client";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import type { AnalisePreliminar } from "@/lib/api/analise";

export function ListaAnalises({
  analises,
  destinoChat,
}: {
  analises: AnalisePreliminar[];
  destinoChat: string;
}) {
  const analise = analises.at(-1);
  if (!analise) return null;
  return (
    <section className="flex flex-col gap-[14px]">
      <div className="border-borda bg-campo flex min-h-[88px] flex-col gap-2 rounded-[10px] border px-[14px] py-3">
        <h2 className="text-[13px] leading-4 font-semibold">Análise do caso</h2>
        <p className="text-tinta-suave text-[11px] leading-[13px]">
          {analise.resumo || "Análise gerada a partir do relato e dos arquivos do caso."}
        </p>
      </div>
      <ColunasAnalise analise={analise} destinoChat={destinoChat} />
    </section>
  );
}
