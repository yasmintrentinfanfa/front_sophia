"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import type { ConteudoCaso } from "@/lib/api/analise";
import { processarEntrevista } from "@/lib/transcricao/fluxo";
import { cn } from "@/lib/utils";

type EstadoGravacao = "gravando" | "pausada" | "encerrada";

const ROTULO_ESTADO: Record<EstadoGravacao, string> = {
  gravando: "Gravando",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

export default function PaginaSessaoAtiva() {
  const router = useRouter();
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando, finalizarSessao } = useListaCasos();
  const [segundos, setSegundos] = useState(0);
  const [estado, setEstado] = useState<EstadoGravacao>("gravando");
  const [confirmarAnalise, setConfirmarAnalise] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [revisado, setRevisado] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  const envioEmCurso = useRef(false);
  const encerrou = useRef(false);
  const estadoAntesDoFim = useRef<EstadoGravacao>("gravando");
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const caso = casos.find((item) => item.id === casoId);

  function soltarMicrofone() {
    streamRef.current?.getTracks().forEach((trilha) => trilha.stop());
    streamRef.current = null;
  }

  function pausarGravacao() {
    if (gravador.current?.state === "recording") gravador.current.pause();
  }

  function retomarGravacao() {
    if (gravador.current?.state === "paused") gravador.current.resume();
  }

  useEffect(() => {
    let cancelado = false;

    async function ligar() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
        });
        if (cancelado) {
          media.getTracks().forEach((trilha) => trilha.stop());
          return;
        }
        streamRef.current = media;
        pedacos.current = [];
        const tipo = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : undefined;
        const rec = new MediaRecorder(media, tipo ? { mimeType: tipo } : undefined);
        rec.ondataavailable = (evento) => {
          if (evento.data.size > 0) pedacos.current.push(evento.data);
        };
        rec.start();
        gravador.current = rec;
      } catch {
        if (!cancelado) {
          setErro("Não foi possível acessar o microfone. Use http://localhost e permita o áudio.");
          setEstado("pausada");
        }
      }
    }

    void ligar();
    return () => {
      cancelado = true;
      if (gravador.current?.state === "recording" || gravador.current?.state === "paused") {
        gravador.current.stop();
      }
      soltarMicrofone();
    };
  }, []);

  async function blobDaGravacao() {
    const rec = gravador.current;
    if (!rec || rec.state === "inactive") {
      return new Blob(pedacos.current, { type: rec?.mimeType || "audio/webm" });
    }
    return new Promise<Blob>((resolver) => {
      rec.onstop = () => {
        resolver(new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" }));
        soltarMicrofone();
      };
      rec.stop();
    });
  }

  async function encerrarSessao() {
    if (envioEmCurso.current) return;
    envioEmCurso.current = true;
    setProcessando(true);
    setErro("");
    try {
      const audio = await blobDaGravacao();
      if (!audio.size) {
        throw new Error("A gravação está vazia.");
      }
      const resultado = await processarEntrevista(casoId, audio, "gravacao.webm", (bruto) => {
        setConfirmarAnalise(false);
        setTexto(bruto);
        setEstado("encerrada");
        setRevisando(true);
      });
      setTexto(resultado.texto);
      setRevisado(resultado.revisado);
      setRevisando(false);
      const transcricao: ConteudoCaso["transcricao"] = [
        {
          id: `${casoId}-transcricao`,
          tempo: formatarCronometro(segundos),
          texto: resultado.texto,
          papel: "cliente",
        },
      ];
      try {
        await finalizarSessao(casoId, transcricao);
      } catch {
        // A fala já foi salva no banco. O status local não impede abrir a análise.
      }
      encerrou.current = true;
      setEstado("encerrada");
      setConfirmarAnalise(false);
      setPronta(true);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível transcrever. Tente novamente; a gravação continua nesta tela.",
      );
    } finally {
      envioEmCurso.current = false;
      setProcessando(false);
      setRevisando(false);
    }
  }

  useEffect(() => {
    if (estado !== "gravando") return;
    const id = window.setInterval(() => setSegundos((atual) => atual + 1), 1000);
    return () => window.clearInterval(id);
  }, [estado]);

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!caso) {
    return (
      <div className="px-7 pt-6">
        <BotaoVoltar destino="/casos" />
        <p className="text-tinta-suave mt-3 text-[13px]">Caso não encontrado.</p>
      </div>
    );
  }

  const encerrada = estado === "encerrada";

  return (
    <>
      <header className="flex min-h-14 w-full shrink-0 flex-wrap items-center justify-between gap-3 px-7 pt-4 pb-2 max-[700px]:px-4">
        <BotaoVoltar
          destino={`/casos/${casoId}/gravacao`}
          desabilitado={processando}
          aoVoltar={() => {
            estadoAntesDoFim.current = estado;
            setEstado("pausada");
            pausarGravacao();
            setConfirmarSaida(true);
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-lg leading-none font-bold">Sessão ativa</h1>
          <p className="text-tinta-suave truncate text-[12px]">{caso.titulo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={encerrada || processando}
            aria-pressed={estado === "pausada"}
            onClick={() => {
              setEstado((atual) => {
                const proximo = atual === "gravando" ? "pausada" : "gravando";
                if (proximo === "pausada") pausarGravacao();
                else retomarGravacao();
                return proximo;
              });
            }}
            className="pressionavel border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50"
          >
            {estado === "pausada" ? "Retomar" : "Pausar"}
          </button>
          <button
            type="button"
            disabled={encerrada || processando}
            onClick={() => {
              estadoAntesDoFim.current = estado;
              setEstado("pausada");
              pausarGravacao();
              setErro("");
              setConfirmarAnalise(true);
            }}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold disabled:opacity-50"
          >
            Finalizar
          </button>
          <p className="border-borda flex h-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                estado === "gravando" ? "bg-gravando" : "bg-tinta-suave",
              )}
              aria-hidden
            />
            <span>
              {ROTULO_ESTADO[estado]}  {formatarCronometro(segundos)}
            </span>
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 px-7 pt-3 pb-5">
        <section className="bg-campo border-borda flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto rounded-[10px] border p-4">
          <h2 className="text-[13px] font-semibold">Transcrição da conversa</h2>
          {processando && !texto ? (
            <p className="text-tinta-suave text-[13px]">
              Transcrevendo a entrevista inteira. Isso pode levar alguns minutos na primeira vez.
            </p>
          ) : texto ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-5 whitespace-pre-wrap">{texto}</p>
              {revisando ? (
                <p className="text-tinta-suave text-[12px]">Revisando a transcrição…</p>
              ) : null}
              {pronta && revisado ? (
                <p className="text-tinta-suave text-[12px]">Transcrição revisada.</p>
              ) : null}
              {pronta && !revisado ? (
                <p className="text-tinta-suave text-[12px]">
                  Texto transcrito pelo Whisper. A revisão da Groq entra quando a chave estiver configurada.
                </p>
              ) : null}
              {erro ? (
                <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
                  {erro}
                </p>
              ) : null}
              {pronta ? (
                <button
                  type="button"
                  onClick={() => router.push(`/casos/${casoId}/analise`)}
                  className="pressionavel bg-acao text-acao-tinta flex h-8 w-fit items-center rounded-[8px] px-3 text-[12px] font-semibold"
                >
                  Ver análise
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-tinta-suave text-[13px]">
              A transcrição aparece aqui assim que o Whisper terminar. Grave a entrevista inteira: o áudio
              só é enviado ao finalizar.
            </p>
          )}
        </section>
      </div>

      <ModalConfirmar
        aberto={confirmarAnalise}
        titulo="Gerar análise de IA"
        descricao="Finalizar a gravação, transcrever e gerar a análise preliminar deste caso?"
        confirmar={processando ? "Transcrevendo…" : "Gerar análise"}
        processando={processando}
        erro={erro}
        aoFechar={() => {
          if (envioEmCurso.current || encerrou.current) return;
          setConfirmarAnalise(false);
          setEstado(estadoAntesDoFim.current);
          if (estadoAntesDoFim.current === "gravando") retomarGravacao();
        }}
        aoConfirmar={() => void encerrarSessao()}
      />
      <ModalConfirmar
        aberto={confirmarSaida}
        titulo="Voltar para a gravação?"
        descricao="A sessão atual será interrompida sem gerar uma análise."
        confirmar="Voltar para a gravação"
        aoFechar={() => {
          setConfirmarSaida(false);
          setEstado(estadoAntesDoFim.current);
          if (estadoAntesDoFim.current === "gravando") retomarGravacao();
        }}
        aoConfirmar={() => {
          soltarMicrofone();
          router.replace(`/casos/${casoId}/gravacao`);
        }}
      />
    </>
  );
}

function formatarCronometro(total: number) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
