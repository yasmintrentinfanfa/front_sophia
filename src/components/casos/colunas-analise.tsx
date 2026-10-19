import type { CategoriaInsight, Insight } from "@/lib/analise/tipos";
import {
  ROTULO_CATEGORIA,
  ROTULO_POSICAO,
  ROTULO_PROBABILIDADE,
  ROTULO_RELEVANCIA,
} from "@/lib/analise/tipos";
import { cn } from "@/lib/utils";

const ORDEM_COLUNAS: CategoriaInsight[] = ["tese", "tema_superior", "jurisprudencia", "pergunta", "necessidade"];

interface ColunasAnaliseProps {
  insights: Insight[];
}

export function ColunasAnalise({ insights }: ColunasAnaliseProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-5">
      {ORDEM_COLUNAS.map((categoria) => {
        const itens = insights.filter((insight) => insight.categoria === categoria);
        if (itens.length === 0) return null;
        return (
          <div key={categoria} className="flex flex-col gap-2.5">
            <h3 className="text-[12px] font-semibold">
              {ROTULO_CATEGORIA[categoria]} ({itens.length})
            </h3>
            <div className="flex flex-col gap-2">
              {itens.map((insight) => (
                <CardInsight key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardInsight({ insight }: { insight: Insight }) {
  const exigeFonte = insight.categoria === "tese" || insight.categoria === "tema_superior" || insight.categoria === "jurisprudencia";
  const fonte = insight.fontes[0];

  return (
    <article className="bg-campo border-borda flex flex-col gap-1.5 rounded-[10px] border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[12px] font-semibold">{insight.titulo}</h4>
        {insight.posicaoJurisprudencial ? (
          <span className="bg-destaque-suave text-destaque shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
            {ROTULO_POSICAO[insight.posicaoJurisprudencial]}
          </span>
        ) : null}
      </div>

      <p className="text-tinta-suave text-[11px] leading-snug">{insight.detalhe}</p>

      <div className="text-tinta-suave flex flex-wrap items-center justify-between gap-1 text-[10px]">
        {insight.relevancia ? <span>{ROTULO_RELEVANCIA[insight.relevancia]}</span> : null}
        {insight.probabilidade ? <span>{ROTULO_PROBABILIDADE[insight.probabilidade]}</span> : null}

        {exigeFonte ? (
          fonte ? (
            <span className="font-medium">
              {fonte.tribunal} {fonte.identificador}
              {fonte.data ? ` · ${fonte.data}` : ""}
            </span>
          ) : (
            <span className={cn("font-medium", "text-destructive")}>Fonte não verificada</span>
          )
        ) : (
          <span>não verificado</span>
        )}
      </div>
    </article>
  );
}
