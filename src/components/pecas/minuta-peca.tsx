"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, FileText, TriangleAlert } from "lucide-react";

import { ErroApi } from "@/lib/api/conta";
import { pecasApi, type EstruturaMinuta, type PecaGerada } from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

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
const LIMITE_TEXTO = 200_000;

function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

/** Texto único para editar, copiar e baixar. */
export function textoDaMinuta(peca: PecaGerada): string {
  if (peca.texto?.trim()) return peca.texto;
  const m = peca.estrutura;
  if (!m) return "";
  const linhas: string[] = [];
  if (m.enderecamento) linhas.push(m.enderecamento);
  if (m.referencia) linhas.push("", m.referencia);
  for (const paragrafo of m.qualificacao) linhas.push("", paragrafo);
  linhas.push("", m.titulo);
  if (m.complemento_titulo) linhas.push("", m.complemento_titulo);
  m.secoes.forEach((secao, i) => {
    linhas.push("", `${romano(i + 1)} – ${secao.titulo}`);
    for (const bloco of secao.blocos) {
      if (bloco.tipo === "lista") {
        bloco.itens.forEach((item, k) => linhas.push(`${letra(k)}) ${item}`));
      } else if (bloco.tipo === "citacao") {
        linhas.push(`“${bloco.texto}”${bloco.fonte ? ` (${bloco.fonte})` : ""}`);
      } else {
        linhas.push(bloco.texto);
      }
    }
  });
  linhas.push("", m.fecho.encerramento, m.fecho.local_data, m.fecho.advogado, m.fecho.oab);
  return linhas.join("\n").trim();
}

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

export function MinutaPeca({
  peca,
  casoId,
  aoAtualizar,
}: {
  peca: PecaGerada;
  casoId: string;
  aoAtualizar?: (peca: PecaGerada) => void;
}) {
  const textoInicial = textoDaMinuta(peca);
  const [texto, setTexto] = useState(textoInicial);
  const [textoSalvo, setTextoSalvo] = useState(textoInicial);
  const [editando, setEditando] = useState(false);
  const [usarEstrutura, setUsarEstrutura] = useState(Boolean(peca.estrutura));
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState<"docx" | "pdf" | null>(null);
  const [menuBaixarAberto, setMenuBaixarAberto] = useState(false);
  const [erro, setErro] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const folha = useRef<HTMLElement>(null);
  const menuBaixar = useRef<HTMLDivElement>(null);
  const textoAtual = useRef(texto);
  textoAtual.current = texto;
  const pendencias = texto.match(MARCADOR)?.length ?? 0;

  useEffect(() => {
    setTexto(textoInicial);
    setTextoSalvo(textoInicial);
    setEditando(false);
    setUsarEstrutura(Boolean(peca.estrutura));
    setMenuBaixarAberto(false);
    setErro("");
  }, [peca.id, textoInicial, peca.estrutura]);

  useEffect(() => {
    if (editando) campo.current?.focus();
  }, [editando]);

  useEffect(() => {
    if (!editando || !campo.current) return;
    const area = campo.current;
    area.style.height = "auto";
    area.style.height = `${Math.max(area.scrollHeight, 420)}px`;
  }, [editando, texto]);

  useEffect(() => {
    if (!editando) return;
    function cliqueFora(evento: MouseEvent) {
      if (folha.current?.contains(evento.target as Node)) return;
      void sairDaEdicao();
    }
    document.addEventListener("mousedown", cliqueFora);
    return () => document.removeEventListener("mousedown", cliqueFora);
  }, [editando]);

  useEffect(() => {
    if (!menuBaixarAberto) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setMenuBaixarAberto(false);
    }
    function cliqueFora(evento: MouseEvent) {
      if (menuBaixar.current?.contains(evento.target as Node)) return;
      setMenuBaixarAberto(false);
    }
    window.addEventListener("keydown", tecla);
    document.addEventListener("mousedown", cliqueFora);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.removeEventListener("mousedown", cliqueFora);
    };
  }, [menuBaixarAberto]);

  async function sairDaEdicao() {
    const rascunho = textoAtual.current;
    setEditando(false);
    if (rascunho !== textoInicial) setUsarEstrutura(false);
    try {
      await gravarSeMudou(rascunho);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar a edição.");
    }
  }

  async function gravarSeMudou(rascunho: string) {
    if (rascunho === textoSalvo) return;
    try {
      const atualizada = await pecasApi.atualizar(casoId, peca.id, rascunho);
      const gravado = atualizada.texto ?? rascunho;
      setTextoSalvo(gravado);
      aoAtualizar?.({ ...peca, ...atualizada, texto: gravado, estrutura: undefined });
    } catch (falha) {
      if (falha instanceof ErroApi && [404, 405, 501].includes(falha.status)) return;
      throw falha;
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoAtual.current);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  async function baixar(formato: "docx" | "pdf") {
    setBaixando(formato);
    setErro("");
    const rascunho = textoAtual.current;
    try {
      await gravarSeMudou(rascunho);
      const { blob, nome } = await pecasApi.baixar(casoId, peca.id, rascunho, formato, peca.titulo);
      baixarArquivo(blob, nome);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível baixar a minuta.");
    } finally {
      setBaixando(null);
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
          <div ref={menuBaixar} className="relative flex">
            <button
              type="button"
              onClick={() => {
                setMenuBaixarAberto(false);
                void baixar("docx");
              }}
              disabled={Boolean(baixando) || !texto.trim()}
              className="pressionavel bg-acao text-acao-tinta flex h-8 items-center gap-1.5 rounded-l-[8px] px-3 text-[12px] font-semibold disabled:opacity-60"
            >
              <Download className="size-3.5" aria-hidden />
              {baixando ? "Baixando…" : "Baixar .docx"}
            </button>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuBaixarAberto}
              aria-label="Outros formatos para baixar"
              disabled={Boolean(baixando) || !texto.trim()}
              onClick={() => setMenuBaixarAberto((aberto) => !aberto)}
              className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-r-[8px] border-l border-current/25 px-2 disabled:opacity-60"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", menuBaixarAberto && "rotate-180")} aria-hidden />
            </button>
            {menuBaixarAberto ? (
              <div
                role="menu"
                className="border-borda bg-campo absolute top-[calc(100%+4px)] right-0 z-20 min-w-[160px] overflow-hidden rounded-[8px] border shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuBaixarAberto(false);
                    void baixar("pdf");
                  }}
                  className="pressionavel hover:bg-chip flex w-full items-center gap-1.5 px-3 py-2 text-left text-[12px] font-semibold"
                >
                  <FileText className="size-3.5" aria-hidden />
                  Baixar PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="border-borda bg-chip text-tinta-suave flex items-start gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {editando
            ? "Editando a minuta. Preencha os campos entre colchetes ou altere qualquer trecho. Copiar e baixar já usam este texto."
            : "Minuta gerada por IA para revisão. Clique no texto para preencher os campos destacados e alterar o que quiser antes de baixar."}
          {!editando && pendencias
            ? ` Há ${pendencias} ${pendencias === 1 ? "dado destacado" : "dados destacados"} para preencher.`
            : ""}
        </span>
      </p>

      {erro ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
          {erro}
        </p>
      ) : null}

      <article
        ref={folha}
        aria-label={`Minuta: ${peca.titulo}`}
        title={editando ? undefined : "Clique para editar"}
        onClick={() => {
          if (!editando) setEditando(true);
        }}
        className="bg-campo border-borda cursor-text rounded-[12px] border px-8 py-7 text-[13px] leading-[1.75] shadow-[0_1px_2px_rgba(0,0,0,0.04)] max-[700px]:px-4 max-[700px]:py-5"
      >
        {editando ? (
          <textarea
            ref={campo}
            value={texto}
            maxLength={LIMITE_TEXTO}
            aria-label={`Editar minuta: ${peca.titulo}`}
            onClick={(evento) => evento.stopPropagation()}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setUsarEstrutura(false);
            }}
            onBlur={() => {
              void gravarSeMudou(textoAtual.current).catch(() => undefined);
            }}
            className="min-h-[420px] w-full resize-y bg-transparent font-serif text-[14px] leading-[1.8] outline-none"
          />
        ) : usarEstrutura && peca.estrutura ? (
          <FolhaMinuta m={peca.estrutura} />
        ) : (
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
