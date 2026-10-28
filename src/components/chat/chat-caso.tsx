"use client";

import { Fragment, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { api } from "@/lib/api";
import type { MensagemChat } from "@/lib/api/analise";
import { cn } from "@/lib/utils";

const ASSUNTOS = [
  "Quais são os pontos fortes deste caso?",
  "Que documentos ainda faltam?",
  "Quais riscos devo considerar?",
];

/**
 * Chat com IA sobre o caso aberto. `destinoVoltar` recebe o id do caso porque
 * cada tela que abre o chat volta para um lugar diferente.
 */
export function ChatCaso({ destinoVoltar }: { destinoVoltar: (casoId: string) => string }) {
  return (
    <Suspense
      fallback={
        <p className="text-tinta-suave p-8 text-[13px]">Carregando chat…</p>
      }
    >
      <ConteudoCaso>
        {(dados) => (
          <Chat casoId={dados.casoId} titulo={dados.titulo} destinoVoltar={destinoVoltar(dados.casoId)} />
        )}
      </ConteudoCaso>
    </Suspense>
  );
}

function Chat({
  casoId,
  titulo,
  destinoVoltar,
}: {
  casoId: string;
  titulo: string;
  destinoVoltar: string;
}) {
  const parametros = useSearchParams();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [pergunta, setPergunta] = useState(parametros.get("pergunta") ?? "");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const conversa = useRef<HTMLDivElement>(null);
  const envioEmCurso = useRef(false);
  const [atualizando, setAtualizando] = useState(false);
  const [versaoAtualizada, setVersaoAtualizada] = useState<number | null>(null);
  const temInformacoes = mensagens.some((mensagem) => mensagem.papel === "advogado");

  /** Nova versão dos cards com o que o advogado contou na conversa; a anterior fica no histórico. */
  async function atualizarAnalise() {
    setAtualizando(true);
    setErro("");
    setVersaoAtualizada(null);
    try {
      const lista = await api.solicitarAnalise(casoId, { incluirChat: true });
      setVersaoAtualizada(lista.at(-1)?.versao ?? null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível atualizar a análise. Tente novamente.");
    } finally {
      setAtualizando(false);
    }
  }

  // Respostas da IA são longas: a conversa sempre mostra a última mensagem.
  useEffect(() => {
    conversa.current?.scrollTo({ top: conversa.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, enviando]);

  useEffect(() => {
    let ativo = true;
    api
      .listarMensagens(casoId)
      .then((lista) => {
        if (ativo) setMensagens(lista);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar as mensagens.");
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
      // Só foca: a lista já rola sozinha, e scrollIntoView rolaria a página junto.
      campo.current?.focus({ preventScroll: true });
    } catch {
      setErro("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      setEnviando(false);
      envioEmCurso.current = false;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex w-full shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <BotaoVoltar destino={destinoVoltar} />
            <h1 className="text-[22px] leading-none font-bold">Chat com IA</h1>
          </div>
          <p className="text-tinta-suave text-[13px]">
            Tire dúvidas sobre o caso {titulo}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void atualizarAnalise()}
          disabled={!temInformacoes || atualizando || enviando || carregando}
          title={
            temInformacoes
              ? "Gera uma nova versão dos cards com as informações que você mandou no chat"
              : "Conte no chat as informações novas do caso para atualizar a análise"
          }
          className="pressionavel bg-campo border-borda flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-medium disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", atualizando && "animate-spin")} aria-hidden />
          {atualizando ? "Atualizando análise…" : "Atualizar análise com a conversa"}
        </button>
      </header>
      {atualizando || versaoAtualizada ? (
        <div className="shrink-0 px-7 pb-1">
          <p
            role="status"
            className="bg-destaque-suave border-destaque/40 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[10px] border px-4 py-2.5 text-[12px]"
          >
            {atualizando ? (
              "A IA está refazendo a análise com o relato, os documentos e o que você contou aqui. Isso pode levar até um minuto."
            ) : (
              <>
                <span>
                  Análise atualizada para a versão {versaoAtualizada} com o que você contou no chat. A versão
                  anterior fica no histórico.
                </span>
                <Link href={destinoVoltar} className="text-destaque font-semibold underline">
                  Ver cards atualizados
                </Link>
              </>
            )}
          </p>
        </div>
      ) : null}
      <div
        className="flex shrink-0 flex-wrap items-start gap-2 px-7 pt-2 pb-2"
        aria-label="Assuntos sugeridos"
      >
        {ASSUNTOS.map((assunto) => (
          <button
            type="button"
            key={assunto}
            onClick={() => {
              setPergunta(assunto);
              campo.current?.focus({ preventScroll: true });
            }}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium",
              pergunta === assunto
                ? "border-destaque text-destaque"
                : "border-borda",
            )}
          >
            {assunto}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-7 pt-2 pb-6">
        <div
          ref={conversa}
          role="log"
          aria-label="Conversa com a IA"
          aria-live="polite"
          aria-busy={carregando || enviando}
          className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
        >
          {carregando ? (
            <p role="status" className="text-tinta-suave text-[13px]">
              Carregando mensagens...
            </p>
          ) : mensagens.length === 0 && !erro ? (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma mensagem ainda. Pergunte algo sobre este caso.
            </p>
          ) : null}
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={cn(
                "bg-campo flex min-h-12 w-full shrink-0 items-center rounded-[10px] px-4 py-3 text-[13px] leading-relaxed [overflow-wrap:anywhere]",
                mensagem.papel === "assistente" && "border-borda border",
              )}
            >
              <span className="sr-only">
                {mensagem.papel === "assistente" ? "Sophia: " : "Você: "}
              </span>
              <p className="whitespace-pre-wrap">
                <TextoComDestaques texto={mensagem.conteudo} />
              </p>
            </div>
          ))}
          {enviando ? (
            <p role="status" className="text-tinta-suave shrink-0 text-[12px]">
              A Sophia está analisando o caso para responder…
            </p>
          ) : null}
        </div>
        <form
          onSubmit={enviar}
          className="flex w-full shrink-0 items-center gap-2 max-[450px]:flex-wrap"
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
            className="bg-campo border-borda placeholder:text-tinta-suave focus:border-destaque h-8 min-w-0 flex-1 rounded-[8px] border px-3 text-[12px] outline-none max-[450px]:basis-full"
          />
          <button
            type="submit"
            disabled={carregando || enviando}
            className="pressionavel bg-acao text-acao-tinta flex h-8 w-[74px] shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold disabled:opacity-60"
          >
            {enviando ? "Enviando" : "Enviar"}
          </button>
        </form>
        {erro ? (
          <div role="alert" className="text-tinta-suave shrink-0 text-[13px]">
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
    </div>
  );
}

/** A IA às vezes marca trechos com **negrito**: vira negrito de verdade em vez de asteriscos. */
function TextoComDestaques({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*\n]+\*\*)/g).map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
          <strong key={i} className="font-semibold">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{parte.replace(/^#{1,6}\s+/gm, "")}</Fragment>
        ),
      )}
    </>
  );
}
