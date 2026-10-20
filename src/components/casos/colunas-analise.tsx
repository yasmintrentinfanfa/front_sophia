import type { ReactNode } from "react";

import { IconeCheck } from "@/components/assinatura/icones";
import type { CategoriaInsight, Insight, NivelRelevancia } from "@/lib/analise/tipos";
import {
  ROTULO_CATEGORIA,
  ROTULO_POSICAO,
  ROTULO_PROBABILIDADE,
  ROTULO_RELEVANCIA,
} from "@/lib/analise/tipos";
import { cn } from "@/lib/utils";

/**
 * Coluna vazia é informação, não erro: em disputa entre particulares, por exemplo,
 * não existe tema do STF, e a IA não deve preencher a coluna "para não ficar vazia".
 */
const VAZIO_CATEGORIA: Record<CategoriaInsight, string> = {
  tese: "Nenhuma tese identificada até agora.",
  tema_superior: "Nenhum tema aplicável. Sem questão constitucional, não há repercussão geral do STF.",
  jurisprudencia: "Nenhuma jurisprudência com fonte verificável.",
  pergunta: "Nenhuma pergunta pendente.",
  necessidade: "Nenhuma necessidade adicional.",
};

const DESCRICAO_CATEGORIA: Record<CategoriaInsight, string> = {
  tese: "Linhas de argumentação aplicáveis ao caso",
  tema_superior: "Repercussão geral e recursos repetitivos",
  jurisprudencia: "Decisões anteriores sobre o tema, sempre com fonte",
  pergunta: "Para confirmar ou descartar teses com o cliente",
  necessidade: "Perícia, documentos e possibilidade de acordo",
};

/** Teses, temas e jurisprudência são afirmações sobre o direito e exigem fonte. */
export function exigeFonte(categoria: CategoriaInsight) {
  return categoria === "tese" || categoria === "tema_superior" || categoria === "jurisprudencia";
}

interface ColunasAnaliseProps {
  insights: Insight[];
}

export function ColunasAnalise({ insights }: ColunasAnaliseProps) {
  const daCategoria = (categoria: CategoriaInsight) =>
    insights.filter((insight) => insight.categoria === categoria);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        {(["tese", "tema_superior", "jurisprudencia"] as const).map((categoria) => {
          const itens = daCategoria(categoria);
          return (
            <Secao key={categoria} categoria={categoria} total={itens.length}>
              {itens.length === 0 ? (
                <Vazio categoria={categoria} />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {itens.map((insight) => (
                    <CardInsight key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </Secao>
          );
        })}
      </div>

      <div className="flex flex-col gap-6">
        <Secao categoria="pergunta" total={daCategoria("pergunta").length}>
          <ListaPerguntas itens={daCategoria("pergunta")} />
        </Secao>
        <Secao categoria="necessidade" total={daCategoria("necessidade").length}>
          <ListaNecessidades itens={daCategoria("necessidade")} />
        </Secao>
      </div>
    </div>
  );
}

function Secao({ categoria, total, children }: { categoria: CategoriaInsight; total: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            {ROTULO_CATEGORIA[categoria]}
            <span className="bg-chip border-borda text-tinta-suave rounded-full border px-2 py-px text-[11px] font-medium">
              {total}
            </span>
          </h2>
          <p className="text-tinta-suave text-[12px]">{DESCRICAO_CATEGORIA[categoria]}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Vazio({ categoria }: { categoria: CategoriaInsight }) {
  return (
    <p className="border-borda text-tinta-suave flex items-start gap-2 rounded-[12px] border border-dashed px-4 py-3.5 text-[12px] leading-snug">
      <IconeInfo className="mt-px shrink-0" />
      {VAZIO_CATEGORIA[categoria]}
    </p>
  );
}

function CardInsight({ insight }: { insight: Insight }) {
  const fonte = insight.fontes[0];

  return (
    <article className="bg-campo border-borda hover:border-destaque/60 flex flex-col gap-3 rounded-[12px] border p-4 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        {insight.relevancia ? <SeloNivel nivel={insight.relevancia} rotulo={ROTULO_RELEVANCIA[insight.relevancia]} /> : null}
        {insight.posicaoJurisprudencial ? (
          <span className="bg-destaque-suave text-destaque rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            {ROTULO_POSICAO[insight.posicaoJurisprudencial]}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[14px] leading-snug font-semibold">{insight.titulo}</h3>
        <p className="text-tinta-suave text-[12px] leading-relaxed">{insight.detalhe}</p>
      </div>

      {exigeFonte(insight.categoria) ? (
        <div className="border-borda mt-auto border-t pt-3">
          {fonte ? (
            <p className="flex items-center gap-1.5 text-[12px]">
              <IconeCheck className="text-destaque size-3.5 shrink-0" />
              <span className="font-semibold">{fonte.origem}</span>
              <span className="text-tinta-suave truncate">
                {fonte.identificador}
                {fonte.data ? ` · ${fonte.data}` : ""}
              </span>
            </p>
          ) : (
            <p className="bg-destructive/10 text-destructive flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium">
              <IconeAlerta className="shrink-0" />
              Fonte não verificada — confira antes de usar
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ListaPerguntas({ itens }: { itens: Insight[] }) {
  if (itens.length === 0) return <Vazio categoria="pergunta" />;

  return (
    <ol className="bg-campo border-borda divide-borda flex flex-col divide-y rounded-[12px] border">
      {itens.map((insight, indice) => (
        <li key={insight.id} className="flex items-start gap-3 px-4 py-3.5">
          <span className="bg-destaque-suave text-destaque flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
            {indice + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[13px] leading-snug font-semibold">{insight.titulo}</p>
            <p className="text-tinta-suave text-[12px] leading-snug">{insight.detalhe}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ListaNecessidades({ itens }: { itens: Insight[] }) {
  if (itens.length === 0) return <Vazio categoria="necessidade" />;

  return (
    <ul className="flex flex-col gap-2">
      {itens.map((insight) => (
        <li key={insight.id} className="bg-campo border-borda flex flex-col gap-2 rounded-[12px] border px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-snug font-semibold">{insight.titulo}</p>
            {insight.probabilidade ? (
              <SeloNivel nivel={insight.probabilidade} rotulo={ROTULO_PROBABILIDADE[insight.probabilidade]} />
            ) : null}
          </div>
          <p className="text-tinta-suave text-[12px] leading-snug">{insight.detalhe}</p>
        </li>
      ))}
    </ul>
  );
}

function SeloNivel({ nivel, rotulo }: { nivel: NivelRelevancia; rotulo: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        nivel === "alta" && "border-destaque/40 text-destaque",
        nivel === "media" && "border-borda text-tinta",
        nivel === "baixa" && "border-borda text-tinta-suave",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          nivel === "alta" && "bg-destaque",
          nivel === "media" && "bg-tinta-suave",
          nivel === "baixa" && "bg-borda",
        )}
      />
      {rotulo}
    </span>
  );
}

export function IconeInfo({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("size-4", className)}>
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4.5M10 6.6v.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconeAlerta({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("size-3.5", className)}>
      <path
        d="M10 3.2 17.4 16H2.6L10 3.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8.2v3.6M10 13.9v.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
