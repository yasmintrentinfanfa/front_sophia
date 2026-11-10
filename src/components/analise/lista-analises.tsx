"use client";

import type { ReactNode } from "react";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import type { AnalisePreliminar } from "@/lib/api/analise";
import { areaPorId } from "@/lib/casos/areas-juridicas";

export function ListaAnalises({
  analises,
  destinoChat,
  areaDoCaso,
  acaoArea,
}: {
  analises: AnalisePreliminar[];
  destinoChat: string;
  /** Área jurídica atual do caso, para avisar quando a análise mostrada ficou desatualizada. */
  areaDoCaso?: string;
  /**
   * Selo da área com edição (tela de análise), no lugar do "Analisada como". Quem passa o selo
   * também avisa da área desatualizada (lá isso fica no aviso de atualizar a análise).
   */
  acaoArea?: ReactNode;
}) {
  const analise = analises.at(-1);
  if (!analise) return null;
  const nomeAnaliseArea = areaPorId(analise.area)?.nome;
  const areaDesatualizada = !acaoArea && Boolean(analise.area && areaDoCaso && analise.area !== areaDoCaso);
  // Análise feita com o prompt genérico (caso antigo ou sem área) num caso que agora tem área.
  const analiseGenericaComArea =
    !acaoArea && Boolean(!analise.area && !analise.demonstracao && areaPorId(areaDoCaso));
  return (
    <section className="flex flex-col gap-[14px]">
      <div className="border-borda bg-campo flex min-h-[88px] flex-col gap-2 rounded-[10px] border px-[14px] py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] leading-4 font-semibold">Análise do caso</h2>
          {acaoArea ?? (
            <span className="bg-destaque-suave text-destaque rounded-full px-2 py-0.5 text-[10px] font-semibold">
              {nomeAnaliseArea ? `Analisada como: ${nomeAnaliseArea}` : "Análise genérica"}
            </span>
          )}
        </div>
        <p className="text-tinta-suave text-[12px] leading-[17px]">
          {analise.resumo || "Análise gerada a partir do relato e dos arquivos do caso."}
        </p>
        {areaDesatualizada ? (
          <p className="text-destaque text-[11px] leading-[13px]">
            A área do caso mudou para {areaPorId(areaDoCaso)?.nome ?? areaDoCaso}. Atualize a análise para usar a
            orientação atual.
          </p>
        ) : null}
        {analiseGenericaComArea ? (
          <p className="text-destaque text-[11px] leading-[13px]">
            Esta análise foi feita sem a orientação de área. Atualize a análise para usar a orientação de{" "}
            {areaPorId(areaDoCaso)?.nome}.
          </p>
        ) : null}
      </div>
      <ColunasAnalise analise={analise} destinoChat={destinoChat} />
    </section>
  );
}
