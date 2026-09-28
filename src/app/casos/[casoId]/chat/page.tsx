"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { api } from "@/lib/api";
import type { MensagemChat } from "@/lib/api/analise";
import { cn } from "@/lib/utils";
import styles from "@/components/fluxo/telas.module.css";

const ASSUNTOS = ["Tema 975 STF", "Dano moral", "Pericia tecnica"];

export default function PaginaChat() {
  return (
    <Suspense
      fallback={
        <p className="text-tinta-suave p-8 text-[13px]">Carregando chat...</p>
      }
    >
      <ConteudoCaso>{(dados) => <Chat casoId={dados.casoId} />}</ConteudoCaso>
    </Suspense>
  );
}

function Chat({ casoId }: { casoId: string }) {
  const parametros = useSearchParams();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [pergunta, setPergunta] = useState(parametros.get("pergunta") ?? "");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    let ativo = true;
    api
      .listarMensagens(casoId)
      .then((lista) => {
        if (ativo) setMensagens(lista);
      })
      .catch(() => {
        if (ativo) setErro("Nao foi possivel carregar as mensagens.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [casoId, tentativa]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pergunta.trim() || envioEmCurso.current || carregando) return;
    envioEmCurso.current = true;
    setEnviando(true);
    setErro("");
    try {
      const novas = await api.enviarMensagem(casoId, pergunta);
      setMensagens((atuais) => [...atuais, ...novas]);
      setPergunta("");
      campo.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      campo.current?.focus();
    } catch {
      setErro("Nao foi possivel enviar a mensagem. Tente novamente.");
    } finally {
      setEnviando(false);
      envioEmCurso.current = false;
    }
  }

  return (
    <>
      <header className="flex shrink-0 flex-col gap-[6px] px-10 pt-7 pb-3 max-[700px]:px-4">
        <h1 className="text-[24px] leading-[29px] font-bold">
          Interacao com a IA juridica
        </h1>
        <p className="text-[14px] leading-[17px]">
          Continue o fluxo de analise com perguntas e novos caminhos
        </p>
      </header>
      <div
        className="flex min-h-11 shrink-0 flex-wrap items-start gap-2 px-10 pt-1 pb-[7px] max-[700px]:px-4"
        aria-label="Assuntos sugeridos"
      >
        {ASSUNTOS.map((assunto, indice) => (
          <button
            type="button"
            key={assunto}
            onClick={() => {
              setPergunta(assunto);
              campo.current?.focus();
            }}
            className={cn(
              "bg-campo h-[33px] rounded-[20px] border px-[10px] py-[6px] text-[11px] leading-[13px] font-medium dark:bg-[var(--fundo-cartao)] dark:text-[var(--texto-discreto)]",
              indice === 1
                ? "border-borda text-[var(--texto-discreto)]"
                : "border-destaque text-destaque",
              indice === 0 && "border-[#478c66]",
              ["w-[97px]", "w-[88px]", "w-[102px]"][indice],
            )}
          >
            {assunto}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-10 pt-2 pb-6 max-[700px]:px-4">
        <div
          role="log"
          aria-label="Conversa com a IA"
          aria-live="polite"
          aria-busy={carregando || enviando}
          className="flex flex-col gap-3"
        >
          {carregando ? (
            <p role="status" className="text-tinta-suave text-[13px]">
              Carregando mensagens...
            </p>
          ) : mensagens.length === 0 && !erro ? (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma mensagem neste caso.
            </p>
          ) : null}
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={cn(
                "flex w-full max-w-[900px] flex-col rounded-xl bg-[var(--fundo-cartao)] px-4 py-3 text-[14px] leading-[17px] [overflow-wrap:anywhere]",
                mensagem.papel === "assistente"
                  ? "border-borda min-h-[90px] border"
                  : "min-h-[60px]",
              )}
            >
              <span className="sr-only">
                {mensagem.papel === "assistente" ? "Sophia: " : "Voce: "}
              </span>
              <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
            </div>
          ))}
        </div>
        <form
          onSubmit={enviar}
          className="flex min-h-[100px] w-full max-w-[986px] items-start gap-3 max-[450px]:flex-wrap"
        >
          <label htmlFor="pergunta-chat" className="sr-only">
            Pergunte algo sobre o caso
          </label>
          <input
            ref={campo}
            id="pergunta-chat"
            value={pergunta}
            onChange={(evento) => setPergunta(evento.target.value)}
            maxLength={4000}
            readOnly={enviando}
            placeholder="Pergunte algo sobre o caso..."
            autoComplete="off"
            className="bg-campo border-borda placeholder:text-destaque focus:border-destaque h-12 min-w-0 flex-1 rounded-xl border px-4 text-[14px] outline-none max-[450px]:basis-full dark:bg-[var(--fundo-cartao)] dark:placeholder:text-tinta"
          />
          <button
            type="submit"
            disabled={carregando || enviando}
            className={`${styles.acao} bg-acao text-acao-tinta h-[42px] w-[74px] shrink-0 rounded-[10px] text-[13px] font-semibold disabled:opacity-60`}
          >
            {enviando ? "Enviando" : "Enviar"}
          </button>
        </form>
        {erro ? (
          <div role="alert" className="text-tinta-suave text-[13px]">
            <p>{erro}</p>
            {mensagens.length === 0 ? (
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => {
                  setErro("");
                  setCarregando(true);
                  setTentativa((valor) => valor + 1);
                }}
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
