"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ListaAnalises } from "@/components/analise/lista-analises";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";

/** PDF/DOCX/TXT ainda fora dos cards: id não coberto, ou arquivo gravado depois da última análise. */
function documentosPendentes(dados: DadosCaso, analises: DadosCaso["versoesAnalise"]) {
  const docs = (dados.documentos ?? []).filter((documento) => documento.id);
  if (!analises?.length) return docs;
  const cobertos = new Set(
    analises.flatMap((item) => [...(item.fontesIds ?? []), item.fonteId].filter(Boolean) as string[]),
  );
  const gerada = Date.parse(analises.at(-1)?.geradaEm ?? "");
  return docs.filter((documento) => {
    if (documento.id && cobertos.has(documento.id)) return false;
    const criado = Date.parse(documento.criadoEm ?? "");
    if (Number.isFinite(criado) && Number.isFinite(gerada)) return criado > gerada;
    return cobertos.size > 0;
  });
}

export function TelaAnalise({
  dados,
  destinoVoltar,
  destinoChat,
  destinoPecas,
}: {
  dados: DadosCaso;
  destinoVoltar: string;
  destinoChat: string;
  destinoPecas: string;
}) {
  const [analises, setAnalises] = useState(dados.versoesAnalise ?? []);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [atualizou, setAtualizou] = useState(false);
  const temRelato =
    (dados.transcricao ?? []).some((fala) => fala.texto.trim()) || (dados.documentos ?? []).length > 0;
  const pendentes = documentosPendentes(dados, analises);
  const arquivoPendente = !atualizou && pendentes.length > 0;
  const visivel = analises.at(-1) ?? null;

  async function gerarAnalise() {
    setGerando(true);
    setErro("");
    try {
      const arquivo = pendentes.at(-1);
      const lista = await api.solicitarAnalise(
        dados.casoId,
        arquivo?.id ? { tipo: "documento", id: arquivo.id } : { tipo: "transcricao" },
      );
      setAnalises(lista);
      setAtualizou(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 px-8 pt-5 pb-3 min-[1050px]:h-[72px] min-[1050px]:flex-nowrap min-[1050px]:pt-[17px] min-[1050px]:pb-[9px] max-[700px]:px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <BotaoVoltar destino={destinoVoltar} />
            <h1 className="text-[22px] leading-[27px] font-bold">
              Análise preliminar de caso
            </h1>
          </div>
          <p className="text-tinta-suave text-[12px] leading-[15px]">
            Insights gerados a partir da transcrição e documentos
            {visivel && !visivel.demonstracao
              ? ` · versão ${visivel.versao}${visivel.origem === "chat" ? ", atualizada com o chat" : ""}`
              : ""}
            . Se um arquivo novo foi só gravado no repositório, você pode atualizar os cards depois.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={destinoPecas}
            className="pressionavel bg-campo border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium"
          >
            Peças processuais
          </Link>
          <Link
            href={destinoChat}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            Chat com IA
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-[14px] px-8 pt-1 pb-5 max-[700px]:px-4">
        {temRelato ? (
          <section className="bg-destaque-suave border-destaque/40 flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 rounded-[12px] border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-[14px] font-semibold">
                {arquivoPendente
                  ? "Há um arquivo novo. Deseja atualizar a análise?"
                  : analises.length
                    ? "Há um relato novo. Deseja atualizar os cards?"
                    : "O relato está salvo, falta a análise"}
              </h2>
              <p className="text-tinta-suave text-[12px]">
                {gerando
                  ? "A IA está atualizando os cards. Isso pode levar até um minuto."
                  : arquivoPendente
                    ? "PDF, DOCX ou TXT anexado só no repositório. Se quiser, os cards passam a considerá-lo."
                    : analises.length
                      ? "A transcrição já está no caso. Gere uma nova análise para os cards acompanharem o último relato."
                      : "Gere os cards de teses, jurisprudência, perguntas e necessidades a partir do relato."}
              </p>
              {erro ? (
                <p role="alert" className="text-destructive mt-1 text-[12px] font-medium">
                  {erro}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void gerarAnalise()}
              disabled={gerando}
              className="pressionavel bg-acao text-acao-tinta flex h-10 shrink-0 items-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-60"
            >
              <Sparkles className={gerando ? "size-4 animate-pulse" : "size-4"} aria-hidden />
              {gerando ? "Gerando análise…" : analises.length ? "Gerar nova análise" : "Gerar análise"}
            </button>
          </section>
        ) : !analises.length ? (
          <Link
            href={`/casos/${dados.casoId}/gravacao`}
            className="text-destaque self-start text-[13px] underline"
          >
            Ir para a gravação
          </Link>
        ) : null}
        {visivel ? <ListaAnalises analises={[visivel]} destinoChat={destinoChat} /> : null}
      </div>
    </>
  );
}
