"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";

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
  const [analise, setAnalise] = useState(dados.analise);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const temRelato = dados.transcricao.some((fala) => fala.texto.trim()) || dados.documentos.length > 0;

  async function gerarAnalise() {
    setGerando(true);
    setErro("");
    try {
      setAnalise(await api.solicitarAnalise(dados.casoId));
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
            {analise && !analise.demonstracao
              ? ` · versão ${analise.versao}${analise.origem === "chat" ? ", atualizada com o chat" : ""}`
              : ""}
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
        <section className="border-borda bg-campo flex min-h-[88px] flex-col gap-2 rounded-[10px] border px-[14px] py-3">
          <h2 className="text-[13px] leading-4 font-semibold">
            Transcrição do áudio do cliente e documentos juntados
          </h2>
          <p className="text-tinta-suave text-[11px] leading-[13px]">
            {analise?.resumo ?? "Nenhuma análise disponível para este caso."}
          </p>
        </section>
        {analise ? (
          <ColunasAnalise analise={analise} destinoChat={destinoChat} />
        ) : temRelato ? (
          <section className="bg-destaque-suave border-destaque/40 flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 rounded-[12px] border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-[14px] font-semibold">O relato está salvo, falta a análise</h2>
              <p className="text-tinta-suave text-[12px]">
                {gerando
                  ? "A IA está lendo o relato e os documentos. Isso pode levar até um minuto."
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
              {gerando ? "Gerando análise…" : "Gerar análise"}
            </button>
          </section>
        ) : (
          <Link
            href={`/casos/${dados.casoId}/gravacao`}
            className="text-destaque self-start text-[13px] underline"
          >
            Ir para a gravação
          </Link>
        )}
      </div>
    </>
  );
}
