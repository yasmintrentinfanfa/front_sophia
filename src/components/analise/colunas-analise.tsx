"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type {
  AnalisePreliminar,
  CategoriaInsight,
  Insight,
  NivelPrecedente,
} from "@/lib/api/analise";
import { agruparPorNivel, NIVEIS, rotuloDoPrecedente, SITUACOES } from "@/lib/analise/precedentes";
import { cn } from "@/lib/utils";
import styles from "@/components/fluxo/telas.module.css";

const COLUNAS: { titulo: string; categorias: CategoriaInsight[] }[] = [
  { titulo: "Teses jurídicas aplicáveis", categorias: ["tese"] },
  { titulo: "Precedentes qualificados", categorias: ["tema_superior"] },
  { titulo: "Jurisprudência", categorias: ["jurisprudencia"] },
  { titulo: "Perguntas sugeridas", categorias: ["pergunta"] },
  { titulo: "Necessidades adicionais", categorias: ["necessidade", "acordo"] },
];

const COR_SITUACAO: Record<string, string> = {
  vigente: "bg-destaque-suave border-destaque text-meta",
  em_atencao: "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  alterado: "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  superado: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function ColunasAnalise({
  analise,
  destinoChat,
}: {
  analise: AnalisePreliminar;
  destinoChat: string;
}) {
  const [selecionado, setSelecionado] = useState<Insight | null>(null);

  function cartao(item: Insight) {
    const precedente = item.categoria === "tema_superior";
    const rotulo = precedente ? rotuloDoPrecedente(item) : "";
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSelecionado(item)}
        className="border-borda bg-campo flex w-full flex-col gap-[6px] rounded-[8px] border p-[10px] text-left"
        aria-label={item.titulo}
      >
        {precedente && (rotulo || item.situacao) ? (
          <span className="flex w-full flex-wrap items-center gap-[4px]">
            {rotulo ? (
              <span className="text-destaque text-[9px] leading-[11px] font-semibold">{rotulo}</span>
            ) : null}
            {item.situacao ? (
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[9px] leading-[11px] font-medium",
                  COR_SITUACAO[item.situacao],
                )}
              >
                {SITUACOES[item.situacao]}
              </span>
            ) : null}
          </span>
        ) : null}
        <span className="flex w-full items-center gap-[6px]">
          <span className="text-tinta-suave min-w-0 flex-1 text-[11px] leading-[13px] font-semibold [overflow-wrap:anywhere]">
            {item.titulo}
          </span>
          {item.posicaoJurisprudencial ? (
            <span className="bg-destaque-suave border-destaque text-meta shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[9px] leading-[11px] font-medium">
              {item.posicaoJurisprudencial === "majoritaria"
                ? "Majoritária"
                : item.posicaoJurisprudencial === "minoritaria"
                  ? "Minoritária"
                  : "Em análise"}
            </span>
          ) : null}
        </span>
        <span className="text-tinta-suave text-[10px] leading-3">{item.detalhe}</span>
        {item.meta ? (
          <span className="text-tinta-suave flex w-full flex-wrap justify-between gap-1 text-[9px] leading-[11px]">
            <span>{item.meta[0]}</span>
            <span>{item.meta[1]}</span>
          </span>
        ) : null}
        {!analise.demonstracao &&
        ["tese", "tema_superior", "jurisprudencia"].includes(item.categoria) &&
        !item.fontes.some((fonte) => fonte.url) ? (
          <span className="text-tinta-suave text-[9px]">não verificado</span>
        ) : null}
      </button>
    );
  }

  return (
    <>
      <div className={styles.colunas}>
        {COLUNAS.map((coluna) => {
          const itens = (analise.insights ?? []).filter((item) => coluna.categorias.includes(item.categoria));
          if (coluna.categorias.includes("tema_superior")) {
            return (
              <ColunaPrecedentes key={coluna.titulo} titulo={coluna.titulo} itens={itens} cartao={cartao} />
            );
          }
          return (
            <section key={coluna.titulo} className="flex min-w-0 flex-col gap-[10px]">
              <h2 className="text-[12px] leading-[15px] font-semibold">
                {coluna.titulo} ({itens.length})
              </h2>
              {itens.map(cartao)}
            </section>
          );
        })}
      </div>
      <ModalFluxo
        aberto={!!selecionado}
        aoFechar={() => setSelecionado(null)}
        titulo={selecionado?.titulo ?? "Detalhes"}
        descricao={selecionado?.detalhe}
      >
        {selecionado ? (
          <>
            {selecionado.categoria === "tema_superior" && (selecionado.identificador || selecionado.situacao) ? (
              <p className="text-tinta-suave mt-3 text-[12px]">
                {[rotuloDoPrecedente(selecionado), selecionado.situacao ? SITUACOES[selecionado.situacao] : null]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            ) : null}
            {selecionado.fontes.length ? (
              selecionado.fontes.map((fonte) => (
                <p key={fonte.identificador} className="mt-3 text-[12px]">
                  {fonte.url && /^https?:\/\//.test(fonte.url) ? (
                    <a className="text-destaque underline" href={fonte.url} target="_blank" rel="noreferrer">
                      {fonte.tribunal} {fonte.identificador}
                    </a>
                  ) : (
                    `${fonte.tribunal} ${fonte.identificador} — não verificado`
                  )}
                </p>
              ))
            ) : (
              <p className="text-tinta-suave mt-3 text-[12px]">
                {analise.demonstracao
                  ? "Conteúdo demonstrativo do protótipo. Referências não verificadas."
                  : "Fonte não verificada."}
              </p>
            )}
            <Link
              href={`${destinoChat}?pergunta=${encodeURIComponent(selecionado.titulo)}`}
              className="text-destaque mt-4 inline-block text-[13px] underline"
            >
              Continuar no chat
            </Link>
          </>
        ) : null}
      </ModalFluxo>
    </>
  );
}

/** Precedentes em abas N1/N2/N3, como no catálogo: vinculantes, uniformização e regionais. */
function ColunaPrecedentes({
  titulo,
  itens,
  cartao,
}: {
  titulo: string;
  itens: Insight[];
  cartao: (item: Insight) => ReactNode;
}) {
  const grupos = agruparPorNivel(itens);
  const primeiroComItens = NIVEIS.find((nivel) => grupos[nivel.id].length)?.id ?? "N1";
  const [escolhida, setEscolhida] = useState<NivelPrecedente | null>(null);
  // Sem escolha do usuário, abre na primeira aba que tem itens (muda junto com a análise exibida).
  const aba = escolhida && grupos[escolhida].length ? escolhida : primeiroComItens;
  const atual = NIVEIS.find((nivel) => nivel.id === aba)!;

  return (
    <section className="flex min-w-0 flex-col gap-[10px]">
      <h2 className="text-[12px] leading-[15px] font-semibold">
        {titulo} ({itens.length})
      </h2>
      {itens.length ? (
        <>
          <div role="tablist" aria-label="Nível do precedente" className="bg-chip border-borda flex rounded-[7px] border p-[2px]">
            {NIVEIS.map((nivel) => (
              <button
                key={nivel.id}
                type="button"
                role="tab"
                aria-selected={aba === nivel.id}
                disabled={!grupos[nivel.id].length}
                title={`${nivel.rotulo}: ${nivel.descricao}`}
                onClick={() => setEscolhida(nivel.id)}
                className={cn(
                  "flex h-6 min-w-0 flex-1 items-center justify-center rounded-[5px] text-[10px] font-semibold disabled:opacity-40",
                  aba === nivel.id ? "bg-campo text-destaque shadow-sm" : "text-tinta-suave",
                )}
              >
                {nivel.id} ({grupos[nivel.id].length})
              </button>
            ))}
          </div>
          <p className="text-tinta-suave -mt-[4px] text-[9px] leading-[11px]">
            <span className="font-semibold">{atual.rotulo}:</span> {atual.descricao}
          </p>
          <div role="tabpanel" className="flex flex-col gap-[10px]">
            {grupos[aba].map(cartao)}
          </div>
        </>
      ) : null}
    </section>
  );
}
