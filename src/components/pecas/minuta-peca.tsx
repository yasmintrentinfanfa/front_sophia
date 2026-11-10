"use client";

import { Fragment, useState } from "react";
import { Check, Copy, Download, TriangleAlert } from "lucide-react";

import type { EstruturaMinuta, PecaGerada } from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";

const ROMANOS: [number, string][] = [
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function romano(n: number) {
  let saida = "";
  for (const [valor, letra] of ROMANOS) {
    while (n >= valor) {
      saida += letra;
      n -= valor;
    }
  }
  return saida;
}

/** a, b, …, z, aa, ab… (mesma regra do .docx). */
function letra(i: number): string {
  return (
    (i < 26 ? "" : letra(Math.floor(i / 26) - 1)) +
    "abcdefghijklmnopqrstuvwxyz"[i % 26]
  );
}

const PARAGRAFO = "text-justify indent-[2.5em] [overflow-wrap:anywhere]";

/** Mesmo leiaute do .docx: endereçamento, título centralizado, seções em romano, fecho. */
function FolhaMinuta({ m }: { m: EstruturaMinuta }) {
  return (
    <div className="flex flex-col gap-3 font-serif text-[14px] leading-[1.8]">
      {m.enderecamento ? (
        <p className="mb-8 font-bold [overflow-wrap:anywhere]">
          <ComMarcadores texto={m.enderecamento} />
        </p>
      ) : null}
      {m.referencia ? (
        <p className="mb-4 font-bold">
          <ComMarcadores texto={m.referencia} />
        </p>
      ) : null}
      {m.qualificacao.map((p, i) => (
        <p key={i} className={PARAGRAFO}>
          <ComMarcadores texto={p} />
        </p>
      ))}
      <h3 className="my-3 text-center text-[15px] font-bold">
        <ComMarcadores texto={m.titulo} />
      </h3>
      {m.complemento_titulo ? (
        <p className={PARAGRAFO}>
          <ComMarcadores texto={m.complemento_titulo} />
        </p>
      ) : null}
      {m.secoes.map((secao, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h4 className="mt-3 font-bold">
            {romano(i + 1)} – <ComMarcadores texto={secao.titulo} />
          </h4>
          {secao.blocos.map((bloco, j) => {
            if (bloco.tipo === "lista") {
              return (
                <ol key={j} className="flex flex-col gap-1.5 pl-[2.5em]">
                  {bloco.itens.map((item, k) => (
                    <li key={k} className="flex gap-2 text-justify">
                      <span className="shrink-0">{letra(k)})</span>
                      <span className="[overflow-wrap:anywhere]">
                        <ComMarcadores texto={item} />
                      </span>
                    </li>
                  ))}
                </ol>
              );
            }
            if (bloco.tipo === "citacao") {
              return (
                <blockquote
                  key={j}
                  className="my-1 ml-[25%] text-justify text-[13px] leading-[1.5] max-[700px]:ml-[10%]"
                >
                  <span className="italic">
                    “<ComMarcadores texto={bloco.texto} />”
                  </span>
                  {bloco.fonte ? <> ({bloco.fonte})</> : null}
                </blockquote>
              );
            }
            if (bloco.tipo === "subtitulo") {
              return (
                <p key={j} className="font-bold italic">
                  <ComMarcadores texto={bloco.texto} />
                </p>
              );
            }
            return (
              <p key={j} className={PARAGRAFO}>
                <ComMarcadores texto={bloco.texto} />
              </p>
            );
          })}
        </section>
      ))}
      <p className={`${PARAGRAFO} mt-4`}>
        <ComMarcadores texto={m.fecho.encerramento} />
      </p>
      <p className="text-center">
        <ComMarcadores texto={m.fecho.local_data} />
      </p>
      <div className="mt-10 flex flex-col items-center leading-[1.5]">
        <span
          className="border-tinta w-full max-w-[300px] border-t"
          aria-hidden
        />
        <span className="mt-1 font-bold">
          <ComMarcadores texto={m.fecho.advogado} />
        </span>
        <span>
          <ComMarcadores texto={m.fecho.oab} />
        </span>
      </div>
    </div>
  );
}

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
            {peca.modeloEscritorio ? ` · modelo do escritório: ${peca.modeloEscritorio.nome}` : ""}
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
        {peca.estrutura ? (
          <FolhaMinuta m={peca.estrutura} />
        ) : (
          // Minutas antigas, guardadas só como texto.
          texto.split("\n").map((linha, i) => {
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
          })
        )}
      </article>
    </div>
  );
}
