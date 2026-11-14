"use client";

import { Fragment, Suspense, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, FileUp, Loader2, Paperclip, Plus, RefreshCw, X } from "lucide-react";

import { problemaDoDocumento, useAnexarDocumento } from "@/components/arquivos/use-anexar-documento";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { api } from "@/lib/api";
import type { MensagemChat } from "@/lib/api/analise";
import { comAnexos, separarAnexos, tamanhoDoArquivo } from "@/lib/chat/anexos";
import { salvarDocumentoDoCaso } from "@/lib/transcricao/fluxo";
import { cn } from "@/lib/utils";

/** Pergunta enviada e resposta ainda chegando. `etapa` diz se os anexos ainda estão subindo. */
interface RespostaAoVivo {
  pergunta: string;
  anexos: string[];
  etapa: "anexando" | "respondendo";
  texto: string;
  final: MensagemChat[] | null;
}

const chaveDoArquivo = (arquivo: File) => `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`;

/** Documento enviado sem texto: vira um cartão na conversa só nesta visita; o arquivo fica no caso. */
interface AnexoNaConversa {
  tipo: "anexo";
  id: string;
  nome: string;
  estado: "enviando" | "pronto";
}

type ItemConversa = MensagemChat | AnexoNaConversa;

const ehAnexo = (item: ItemConversa): item is AnexoNaConversa => "tipo" in item;

/** Só reage a arquivos do computador, não a texto ou links arrastados. */
const temArquivos = (evento: DragEvent) => Array.from(evento.dataTransfer.types).includes("Files");

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
  const [mensagens, setMensagens] = useState<ItemConversa[]>([]);
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
  const [aoVivo, setAoVivo] = useState<RespostaAoVivo | null>(null);
  /** Arquivos escolhidos no "+" (ou arrastados) esperando o Enviar, com ou sem texto. */
  const [separados, setSeparados] = useState<File[]>([]);
  const [erroAnexo, setErroAnexo] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const camadasDeArraste = useRef(0);
  const proximoAnexo = useRef(0);
  // Fato contado pelo advogado ou documento anexado: os dois entram na nova versão da análise.
  const temInformacoes = mensagens.some((item) =>
    ehAnexo(item) ? item.estado === "pronto" : item.papel === "advogado",
  );

  const { abrirSeletor, propsDaEntrada } = useAnexarDocumento(casoId, {
    aoEscolher: separar,
    aoFalhar: setErroAnexo,
  });

  /** O arquivo não sobe ainda: fica na mensagem até o advogado escrever algo ou enviar só ele. */
  function separar(arquivos: File[]) {
    setErroAnexo("");
    const problema = arquivos.map(problemaDoDocumento).find(Boolean);
    if (problema) setErroAnexo(problema);
    const validos = arquivos.filter((arquivo) => !problemaDoDocumento(arquivo));
    setSeparados((atuais) => [
      ...atuais,
      ...validos.filter((novo) => !atuais.some((atual) => chaveDoArquivo(atual) === chaveDoArquivo(novo))),
    ]);
    campo.current?.focus({ preventScroll: true });
  }

  function perguntarSobre(nome: string) {
    setPergunta(`Resuma o documento “${nome}” e diga o que ele muda no caso.`);
    campo.current?.focus({ preventScroll: true });
  }

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

  /**
   * A pergunta aparece na hora e a resposta vai sendo escrita conforme chega. Quando o backend
   * termina, `final` guarda as mensagens gravadas; elas entram na lista só depois que o texto
   * acabou de aparecer na tela (ver `concluirResposta`), para não haver salto.
   */
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = pergunta.trim();
    const arquivos = separados;
    if ((!texto && arquivos.length === 0) || envioEmCurso.current || carregando) return;
    envioEmCurso.current = true;
    setEnviando(true);
    setErro("");
    setErroAnexo("");
    setPergunta("");
    setSeparados([]);
    if (texto) {
      setAoVivo({
        pergunta: texto,
        anexos: arquivos.map((arquivo) => arquivo.name),
        etapa: arquivos.length ? "anexando" : "respondendo",
        texto: "",
        final: null,
      });
    }

    // Os arquivos sobem primeiro. Sem texto, cada um vira um cartão na conversa e pronto:
    // fica salvo no repositório e no contexto da IA, sem chamar a IA agora.
    const nomes: string[] = [];
    for (const [indice, arquivo] of arquivos.entries()) {
      proximoAnexo.current += 1;
      const id = `anexo-${proximoAnexo.current}`;
      if (!texto) setMensagens((itens) => [...itens, { tipo: "anexo", id, nome: arquivo.name, estado: "enviando" }]);
      try {
        const salvo = await salvarDocumentoDoCaso(casoId, arquivo);
        nomes.push(salvo.nome);
        if (!texto) {
          setMensagens((itens) =>
            itens.map((item) => (ehAnexo(item) && item.id === id ? { ...item, nome: salvo.nome, estado: "pronto" } : item)),
          );
        }
      } catch (falha) {
        // O que não subiu volta para a mensagem; o que já subiu fica no caso.
        if (!texto) setMensagens((itens) => itens.filter((item) => item.id !== id));
        setErroAnexo(falha instanceof Error ? falha.message : "Não foi possível anexar o documento.");
        setSeparados(arquivos.slice(indice));
        setPergunta(texto);
        setAoVivo(null);
        encerrarEnvio();
        return;
      }
    }
    if (!texto) {
      encerrarEnvio();
      return;
    }
    await responder(texto, nomes);
  }

  /**
   * A pergunta aparece na hora e a resposta vai sendo escrita conforme chega. Quando o backend
   * termina, `final` guarda as mensagens gravadas; elas entram na lista só depois que o texto
   * acabou de aparecer na tela (ver `concluirResposta`), para não haver salto.
   */
  async function responder(texto: string, anexos: string[]) {
    const mensagem = comAnexos(texto, anexos);
    setAoVivo((atual) => (atual ? { ...atual, etapa: "respondendo" } : atual));
    try {
      const novas = api.enviarMensagemAoVivo
        ? await api.enviarMensagemAoVivo(casoId, mensagem, (trecho) =>
            setAoVivo((atual) => (atual ? { ...atual, texto: atual.texto + trecho } : atual)),
          )
        : await api.enviarMensagem(casoId, mensagem);
      const resposta = novas.find((item) => item.papel === "assistente")?.conteudo;
      setAoVivo((atual) => (atual ? { ...atual, texto: resposta ?? atual.texto, final: novas } : atual));
    } catch (falha) {
      // A conversa não foi gravada: a pergunta volta para o campo para tentar de novo.
      setAoVivo(null);
      setPergunta(texto);
      const motivo =
        falha instanceof Error && falha.message ? falha.message : "Não foi possível enviar a mensagem. Tente novamente.";
      setErro(anexos.length ? `${motivo} O documento já ficou salvo no caso.` : motivo);
      encerrarEnvio();
    }
  }

  function encerrarEnvio() {
    setEnviando(false);
    envioEmCurso.current = false;
  }

  function concluirResposta(final: MensagemChat[]) {
    setMensagens((atuais) => [...atuais, ...final]);
    setAoVivo(null);
    encerrarEnvio();
    // Só foca: a lista já rola sozinha, e scrollIntoView rolaria a página junto.
    campo.current?.focus({ preventScroll: true });
  }

  /** Acompanha o texto que cresce, a menos que a pessoa tenha subido para reler algo. */
  function seguirFim() {
    const lista = conversa.current;
    if (lista && lista.scrollHeight - lista.scrollTop - lista.clientHeight < 160) {
      lista.scrollTop = lista.scrollHeight;
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
              : "Conte no chat ou anexe no + as informações novas do caso para atualizar a análise"
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
      <div
        className="relative flex min-h-0 flex-1 flex-col gap-3 px-7 pt-2 pb-6"
        onDragEnter={(evento) => {
          if (!temArquivos(evento)) return;
          evento.preventDefault();
          camadasDeArraste.current += 1;
          setArrastando(true);
        }}
        onDragOver={(evento) => {
          if (!temArquivos(evento)) return;
          evento.preventDefault();
          evento.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(evento) => {
          if (!temArquivos(evento)) return;
          camadasDeArraste.current = Math.max(0, camadasDeArraste.current - 1);
          if (camadasDeArraste.current === 0) setArrastando(false);
        }}
        onDrop={(evento) => {
          if (!temArquivos(evento)) return;
          evento.preventDefault();
          camadasDeArraste.current = 0;
          setArrastando(false);
          separar(Array.from(evento.dataTransfer.files));
        }}
      >
        {arrastando ? (
          <div
            aria-hidden
            className="border-destaque bg-fundo/85 animate-in fade-in pointer-events-none absolute inset-x-5 inset-y-1 z-10 flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed backdrop-blur-[2px] duration-150"
          >
            <span className="bg-destaque-suave text-destaque flex size-11 items-center justify-center rounded-full">
              <FileUp className="size-5" />
            </span>
            <p className="text-[14px] font-semibold">Solte para anexar à mensagem</p>
            <p className="text-tinta-suave text-[12px]">PDF, Word ou TXT · depois escreva algo ou envie só o arquivo</p>
          </div>
        ) : null}
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
          ) : mensagens.length === 0 && !erro && !aoVivo ? (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma mensagem ainda. Pergunte algo sobre este caso ou anexe um documento no +.
            </p>
          ) : null}
          {mensagens.map((mensagem) => {
            if (ehAnexo(mensagem)) {
              return <CartaoAnexo key={mensagem.id} anexo={mensagem} aoResumir={() => perguntarSobre(mensagem.nome)} />;
            }
            if (mensagem.papel === "advogado") {
              return <BolhaDoAdvogado key={mensagem.id} {...separarAnexos(mensagem.conteudo)} />;
            }
            return (
              <div key={mensagem.id} className={cn(BOLHA, "border-borda border")}>
                <span className="sr-only">Sophia: </span>
                <p className="whitespace-pre-wrap">
                  <TextoComDestaques texto={mensagem.conteudo} />
                </p>
              </div>
            );
          })}
          {aoVivo ? (
            <>
              <BolhaDoAdvogado
                anexos={aoVivo.anexos}
                texto={aoVivo.pergunta}
                anexando={aoVivo.etapa === "anexando"}
                className="animate-in fade-in slide-in-from-bottom-1 duration-200"
              />
              {aoVivo.texto ? (
                <div className={cn(BOLHA, "border-borda border")}>
                  <span className="sr-only">Sophia: </span>
                  <p className="whitespace-pre-wrap">
                    <TextoFluido
                      alvo={aoVivo.texto}
                      concluido={aoVivo.final !== null}
                      aoCrescer={seguirFim}
                      aoConcluir={() => aoVivo.final && concluirResposta(aoVivo.final)}
                    />
                  </p>
                </div>
              ) : (
                <p role="status" className="text-tinta-suave flex shrink-0 items-center gap-2 text-[12px]">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 150, 300].map((atraso) => (
                      <span
                        key={atraso}
                        style={{ animationDelay: `${atraso}ms` }}
                        className="bg-destaque/60 size-1.5 animate-pulse rounded-full"
                      />
                    ))}
                  </span>
                  {aoVivo.etapa === "anexando"
                    ? "Anexando o documento ao caso…"
                    : "A Sophia está analisando o caso para responder…"}
                </p>
              )}
            </>
          ) : null}
        </div>
        {separados.length ? (
          <div
            aria-label="Arquivos anexados a esta mensagem"
            className="animate-in fade-in slide-in-from-bottom-1 flex shrink-0 flex-wrap items-center gap-2 duration-200"
          >
            {separados.map((arquivo) => (
              <span
                key={chaveDoArquivo(arquivo)}
                className="bg-campo border-destaque/50 flex h-9 max-w-full items-center gap-2 rounded-[9px] border pr-1 pl-1.5"
              >
                <span className="bg-destaque-suave text-destaque flex size-6 shrink-0 items-center justify-center rounded-[6px]">
                  <FileText className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-[12px] font-medium">{arquivo.name}</span>
                <span className="text-tinta-suave shrink-0 text-[11px]">{tamanhoDoArquivo(arquivo.size)}</span>
                <button
                  type="button"
                  onClick={() => setSeparados((lista) => lista.filter((item) => item !== arquivo))}
                  disabled={enviando}
                  aria-label={`Tirar ${arquivo.name} da mensagem`}
                  className="text-tinta-suave hover:text-tinta hover:bg-tinta/5 flex size-7 shrink-0 items-center justify-center rounded-[6px] disabled:opacity-50"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
            <span className="text-tinta-suave text-[11px]">
              Escreva o que quer saber sobre o arquivo, ou envie só ele para guardar no caso.
            </span>
          </div>
        ) : null}
        <form
          onSubmit={enviar}
          className="flex w-full shrink-0 items-center gap-2 max-[450px]:flex-wrap"
        >
          <label htmlFor="pergunta-chat" className="sr-only">
            Pergunte algo sobre o caso
          </label>
          <button
            type="button"
            onClick={abrirSeletor}
            disabled={enviando}
            aria-label="Anexar documento"
            title="Anexar PDF, Word ou TXT. O arquivo espera você escrever algo ou enviar só ele. Também dá para arrastar para a conversa."
            className="pressionavel bg-campo border-borda text-tinta-suave hover:text-destaque hover:border-destaque/60 flex size-8 shrink-0 items-center justify-center rounded-[8px] border disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <input {...propsDaEntrada} />
          <input
            ref={campo}
            id="pergunta-chat"
            value={pergunta}
            onChange={(evento) => setPergunta(evento.target.value)}
            maxLength={4000}
            readOnly={enviando}
            placeholder={
              separados.length ? "O que você quer saber sobre o arquivo? (opcional)" : "Pergunte algo sobre o caso..."
            }
            autoComplete="off"
            className="bg-campo border-borda placeholder:text-tinta-suave focus:border-destaque h-8 min-w-0 flex-1 rounded-[8px] border px-3 text-[12px] outline-none max-[450px]:order-first max-[450px]:basis-full"
          />
          <button
            type="submit"
            disabled={carregando || enviando}
            className="pressionavel bg-acao text-acao-tinta flex h-8 w-[74px] shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold disabled:opacity-60 max-[450px]:ml-auto"
          >
            {enviando ? "Enviando" : "Enviar"}
          </button>
        </form>
        {erroAnexo ? (
          <p role="alert" className="text-destructive shrink-0 text-[12px]">
            {erroAnexo}
          </p>
        ) : null}
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

const BOLHA =
  "bg-campo flex min-h-12 w-full shrink-0 items-center rounded-[10px] px-4 py-3 text-[13px] leading-relaxed [overflow-wrap:anywhere]";

/**
 * Mostra `alvo` aos poucos, quadro a quadro, como se fosse digitado. Os trechos da IA chegam
 * em rajadas; aqui eles saem num ritmo contínuo, acelerando quando o texto fica para trás.
 * Com `concluido` e tudo à mostra, chama `aoConcluir` (a resposta vira mensagem salva).
 */
function TextoFluido({
  alvo,
  concluido,
  aoCrescer,
  aoConcluir,
}: {
  alvo: string;
  concluido: boolean;
  aoCrescer: () => void;
  aoConcluir: () => void;
}) {
  const [mostrados, setMostrados] = useState(0);

  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      if (mostrados < alvo.length) {
        const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const passo = reduzido ? alvo.length : Math.max(2, Math.ceil((alvo.length - mostrados) / 20));
        setMostrados(Math.min(alvo.length, mostrados + passo));
        aoCrescer();
      } else if (concluido) {
        aoConcluir();
      }
    });
    return () => cancelAnimationFrame(quadro);
  }, [mostrados, alvo, concluido, aoCrescer, aoConcluir]);

  const escrevendo = !concluido || mostrados < alvo.length;
  return (
    <>
      <TextoComDestaques texto={alvo.slice(0, mostrados)} />
      {escrevendo ? (
        <span
          aria-hidden
          className="bg-destaque ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse rounded-full"
        />
      ) : null}
    </>
  );
}

/** Mensagem do advogado; os documentos que foram junto aparecem acima do texto. */
function BolhaDoAdvogado({
  anexos,
  texto,
  anexando = false,
  className,
}: {
  anexos: string[];
  texto: string;
  anexando?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(BOLHA, anexos.length > 0 && "flex-col items-start gap-2", className)}>
      <span className="sr-only">Você: </span>
      {anexos.length ? (
        <span className="flex max-w-full flex-wrap gap-1.5">
          {anexos.map((nome) => (
            <span
              key={nome}
              className="bg-destaque-suave text-destaque inline-flex max-w-full items-center gap-1.5 rounded-[7px] px-2 py-1 text-[12px] font-medium"
            >
              {anexando ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Paperclip className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="sr-only">Documento anexado: </span>
              <span className="truncate">{nome}</span>
            </span>
          ))}
        </span>
      ) : null}
      {texto ? (
        <p className="whitespace-pre-wrap">
          <TextoComDestaques texto={texto} />
        </p>
      ) : null}
    </div>
  );
}

/** Documento anexado na conversa: discreto, com um atalho para perguntar sobre ele. */
function CartaoAnexo({ anexo, aoResumir }: { anexo: AnexoNaConversa; aoResumir: () => void }) {
  const pronto = anexo.estado === "pronto";
  return (
    <div className="bg-campo border-borda animate-in fade-in slide-in-from-bottom-2 flex w-fit max-w-full shrink-0 items-center gap-3 rounded-[10px] border py-2 pr-2 pl-2.5 duration-300">
      <span className="bg-destaque-suave text-destaque flex size-8 shrink-0 items-center justify-center rounded-[8px]">
        {pronto ? <FileText className="size-4" aria-hidden /> : <Loader2 className="size-4 animate-spin" aria-hidden />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="sr-only">Documento: </span>
        <span className="truncate text-[13px] font-semibold">{anexo.nome}</span>
        <span className="text-tinta-suave text-[11px]">
          {pronto ? "Adicionado ao caso. A Sophia já considera nas respostas." : "Anexando ao caso…"}
        </span>
      </span>
      {pronto ? (
        <button
          type="button"
          onClick={aoResumir}
          className="pressionavel text-destaque hover:bg-destaque-suave h-8 shrink-0 rounded-[8px] px-3 text-[12px] font-semibold"
        >
          Resumir
        </button>
      ) : null}
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
