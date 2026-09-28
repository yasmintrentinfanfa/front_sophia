"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";
import styles from "@/components/fluxo/telas.module.css";

export default function PaginaAnalise() {
  return <ConteudoCaso>{(dados) => <Analise dados={dados} />}</ConteudoCaso>;
}

function Analise({ dados }: { dados: DadosCaso }) {
  const [analise, setAnalise] = useState(dados.analise);
  const [configurando, setConfigurando] = useState(false);
  const [instrucao, setInstrucao] = useState(analise?.instrucao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function configurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro("");
    try {
      setAnalise(
        await api.solicitarAnalise(dados.casoId, instrucao.trim() || undefined),
      );
      setConfigurando(false);
    } catch {
      setErro("Nao foi possivel salvar a configuracao.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 px-8 pt-5 pb-3 min-[1050px]:h-[72px] min-[1050px]:flex-nowrap min-[1050px]:pt-[17px] min-[1050px]:pb-[9px] max-[700px]:px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] leading-[27px] font-bold">
            Analise preliminar de caso
          </h1>
          <p className="text-tinta-suave text-[12px] leading-[15px]">
            Insights gerados a partir da transcricao e documentos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfigurando(true)}
            className="bg-campo border-borda rounded-[10px] border px-4 py-[10px] text-[13px] font-medium"
          >
            Configurar IA
          </button>
          <Link
            href={`/casos/${dados.casoId}/chat`}
            className={`${styles.acao} pressionavel bg-acao text-acao-tinta rounded-[10px] px-4 py-[10px] text-[13px] font-semibold`}
          >
            Gerar peca processual
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-[14px] px-8 pt-1 pb-5 max-[700px]:px-4">
        <section className="border-borda flex min-h-[88px] flex-col gap-2 rounded-[10px] border bg-[var(--fundo-cartao)] px-[14px] py-3">
          <h2 className="text-[13px] leading-4 font-semibold dark:text-tinta-suave">
            Transcricao do audio do cliente e documentos juntados
          </h2>
          <p className="text-tinta-suave text-[11px] leading-[13px] dark:text-[var(--texto-discreto)]">
            {analise?.resumo ?? "Nenhuma analise disponivel para este caso."}
          </p>
        </section>
        {analise ? (
          <ColunasAnalise analise={analise} />
        ) : (
          <Link
            href={`/casos/${dados.casoId}/gravacao`}
            className="text-destaque self-start text-[13px] underline"
          >
            Ir para a gravacao
          </Link>
        )}
      </div>
      <ModalFluxo
        aberto={configurando}
        aoFechar={() => {
          if (!salvando) setConfigurando(false);
        }}
        titulo="Configurar IA"
        descricao="Orientacoes para a analise deste caso."
      >
        <form onSubmit={configurar} className="mt-4 flex flex-col gap-3">
          <label htmlFor="instrucao-ia" className="text-[13px] font-medium">
            Instrucoes adicionais
          </label>
          <textarea
            id="instrucao-ia"
            value={instrucao}
            onChange={(evento) => setInstrucao(evento.target.value)}
            maxLength={4000}
            rows={5}
            className="bg-campo border-borda focus:border-destaque w-full resize-y rounded-[8px] border p-3 text-[13px] outline-none"
          />
          {erro ? (
            <p role="alert" className="text-[12px]">
              {erro}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={salvando}
            className={`${styles.acao} bg-acao text-acao-tinta h-10 rounded-[8px] text-[13px] font-semibold disabled:opacity-60`}
          >
            {salvando ? "Salvando..." : "Salvar configuracao"}
          </button>
        </form>
      </ModalFluxo>
    </>
  );
}
