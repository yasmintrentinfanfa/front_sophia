"use client";

import { Fragment, useState } from "react";
import { Check, Copy, Download, TriangleAlert } from "lucide-react";

import type { PecaGerada } from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";

const MARCADOR = /(\[[^\]\n]{1,80}\])/g;
/** Sem a flag `g`: `test` não guarda estado entre as chamadas. */
const EH_MARCADOR = /^\[[^\]\n]{1,80}\]$/;

/** Linha em maiúsculas e curta é título de seção (a IA é orientada a escrever assim). */
function ehTitulo(linha: string) {
  const limpa = linha.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
  return limpa.length > 0 && limpa.length < 90 && /[A-ZÀ-Ú]/.test(limpa) && limpa === limpa.toUpperCase();
}

/** Destaca os dados que o advogado precisa preencher, como [NOME DO RÉU]. */
function ComMarcadores({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(MARCADOR).map((parte, i) =>
        EH_MARCADOR.test(parte) ? (
          <mark key={i} className="bg-destaque-suave text-destaque rounded-[4px] px-1 font-medium">
            {parte}
          </mark>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}

export function MinutaPeca({ peca, urlDocx }: { peca: PecaGerada; urlDocx: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = peca.texto ?? "";
  const pendencias = texto.match(MARCADOR)?.length ?? 0;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">{peca.titulo}</h2>
          <p className="text-tinta-suave text-[12px]">
            Gerada em {formatarDataHora(peca.geradaEm)}
            {peca.analiseVersao ? ` · com base na análise versão ${peca.analiseVersao}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copiar()}
            className="pressionavel border-borda bg-campo flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            {copiado ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copiado ? "Copiado" : "Copiar texto"}
          </button>
          <a
            href={urlDocx}
            download
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold"
          >
            <Download className="size-3.5" aria-hidden />
            Baixar .docx
          </a>
        </div>
      </div>

      <p className="border-borda bg-chip text-tinta-suave flex items-start gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Minuta gerada por IA para revisão. Confira fatos, fundamentos e prazos antes de protocolar.
          {pendencias
            ? ` Há ${pendencias} ${pendencias === 1 ? "dado destacado" : "dados destacados"} para preencher.`
            : ""}
        </span>
      </p>

      <article
        aria-label={`Minuta: ${peca.titulo}`}
        className="bg-campo border-borda rounded-[12px] border px-8 py-7 text-[13px] leading-[1.75] shadow-[0_1px_2px_rgba(0,0,0,0.04)] max-[700px]:px-4 max-[700px]:py-5"
      >
        {texto.split("\n").map((linha, i) => {
          const conteudo = linha.trim();
          if (!conteudo) return <div key={i} className="h-3" aria-hidden />;
          if (ehTitulo(conteudo)) {
            return (
              <h3 key={i} className="mt-4 mb-1 text-[12px] font-bold tracking-[0.04em] first:mt-0">
                <ComMarcadores texto={conteudo.replace(/^#+\s*/, "").replace(/\*\*/g, "")} />
              </h3>
            );
          }
          return (
            <p key={i} className="text-justify [overflow-wrap:anywhere]">
              <ComMarcadores texto={conteudo.replace(/\*\*/g, "")} />
            </p>
          );
        })}
      </article>
    </div>
  );
}
