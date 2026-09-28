"use client";

import { useState } from "react";
import Link from "next/link";

import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type {
  AnalisePreliminar,
  CategoriaInsight,
  Insight,
} from "@/lib/api/analise";
import styles from "@/components/fluxo/telas.module.css";

const COLUNAS: { titulo: string; categorias: CategoriaInsight[] }[] = [
  { titulo: "Teses juridicas aplicaveis", categorias: ["tese"] },
  { titulo: "Temas do STF/STJ", categorias: ["tema_superior"] },
  { titulo: "Jurisprudencia", categorias: ["jurisprudencia"] },
  { titulo: "Perguntas sugeridas", categorias: ["pergunta"] },
  { titulo: "Necessidades adicionais", categorias: ["necessidade", "acordo"] },
];

export function ColunasAnalise({ analise }: { analise: AnalisePreliminar }) {
  const [selecionado, setSelecionado] = useState<Insight | null>(null);
  return (
    <>
      <div className={styles.colunas}>
        {COLUNAS.map((coluna) => {
          const itens = analise.insights.filter((item) =>
            coluna.categorias.includes(item.categoria),
          );
          return (
            <section
              key={coluna.titulo}
              className="flex min-w-0 flex-col gap-[10px]"
            >
              <h2 className="text-[12px] leading-[15px] font-semibold">
                {coluna.titulo} ({itens.length})
              </h2>
              {itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelecionado(item)}
                  className="border-borda flex w-full flex-col gap-[6px] rounded-[8px] border bg-[var(--fundo-cartao)] p-[10px] text-left"
                  aria-label={item.titulo}
                >
                  <span className="flex w-full items-center gap-[6px]">
                    <span
                      className={`${styles.tituloInsight} min-w-0 flex-1 text-[11px] leading-[13px] font-semibold [overflow-wrap:anywhere]`}
                    >
                      {item.titulo}
                    </span>
                    {item.posicaoJurisprudencial ? (
                      <span className="bg-destaque-suave border-destaque shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[9px] leading-[11px] font-medium text-[var(--texto-discreto)] dark:text-[#d1d1d6]">
                        {item.posicaoJurisprudencial === "majoritaria"
                          ? "Majoritaria"
                          : item.posicaoJurisprudencial === "minoritaria"
                            ? "Minoritaria"
                            : "Em analise"}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] leading-3 text-[var(--texto-discreto)]">
                    {item.detalhe}
                  </span>
                  {item.meta ? (
                    <span className="flex w-full flex-wrap justify-between gap-1 text-[9px] leading-[11px] text-[var(--texto-discreto)]">
                      <span
                        className={
                          item.categoria !== "jurisprudencia"
                            ? "dark:text-[#d1d1d6]"
                            : ""
                        }
                      >
                        {item.meta[0]}
                      </span>
                      <span
                        className={
                          ["jurisprudencia", "necessidade", "acordo"].includes(
                            item.categoria,
                          )
                            ? "dark:text-[#d1d1d6]"
                            : ""
                        }
                      >
                        {item.meta[1]}
                      </span>
                    </span>
                  ) : null}
                  {!analise.demonstracao &&
                  ["tese", "tema_superior", "jurisprudencia"].includes(
                    item.categoria,
                  ) &&
                  !item.fontes.some((fonte) => fonte.url) ? (
                    <span className="text-tinta-suave text-[9px]">
                      nao verificado
                    </span>
                  ) : null}
                </button>
              ))}
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
            {selecionado.fontes.length ? (
              selecionado.fontes.map((fonte) => (
                <p key={fonte.identificador} className="mt-3 text-[12px]">
                  {fonte.url && /^https?:\/\//.test(fonte.url) ? (
                    <a
                      className="text-destaque underline"
                      href={fonte.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {fonte.tribunal} {fonte.identificador}
                    </a>
                  ) : (
                    `${fonte.tribunal} ${fonte.identificador} - nao verificado`
                  )}
                </p>
              ))
            ) : (
              <p className="text-tinta-suave mt-3 text-[12px]">
                {analise.demonstracao
                  ? "Conteudo demonstrativo do prototipo. Referencias nao verificadas."
                  : "Fonte nao verificada."}
              </p>
            )}
            <Link
              href={`/casos/${analise.casoId}/chat?pergunta=${encodeURIComponent(selecionado.titulo)}`}
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
