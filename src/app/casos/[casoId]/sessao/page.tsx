"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import type { ConteudoCaso } from "@/lib/api/analise";
import { cn } from "@/lib/utils";

type EstadoGravacao = "gravando" | "pausada" | "encerrada";

const FALAS = [
  { papel: "Advogado", texto: "Pode descrever os fatos da rescisão?", tipo: "fala" as const },
  {
    papel: "Cliente",
    texto: "Assinei o contrato em janeiro e a empresa atrasou pagamentos…",
    tipo: "fala" as const,
  },
  {
    papel: "Anotação",
    texto: "verificar cláusula de multa e prazo de aviso prévio.",
    tipo: "nota" as const,
  },
];

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
  const [erro, setErro] = useState("");
  const envioEmCurso = useRef(false);
  const estadoAntesDoFim = useRef<EstadoGravacao>("gravando");
  const caso = casos.find((item) => item.id === casoId);

  async function encerrarSessao() {
    if (envioEmCurso.current) return;
    envioEmCurso.current = true;
    setProcessando(true);
    setErro("");
    const transcricao: ConteudoCaso["transcricao"] = FALAS.map((fala, indice) => ({
      id: `${casoId}-fala-${indice + 1}`,
      tempo: formatarCronometro(segundos),
      texto: fala.texto,
      papel: fala.tipo === "nota" ? "nota" : indice === 0 ? "advogado" : "cliente",
    }));
    try {
      await finalizarSessao(casoId, transcricao);
      setEstado("encerrada");
      setConfirmarAnalise(false);
      router.replace(`/casos/${casoId}/analise`);
    } catch {
      setErro("Não foi possível gerar a análise. Tente novamente; a transcrição continua nesta tela.");
    } finally {
      envioEmCurso.current = false;
      setProcessando(false);
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
    return <div className="px-7 pt-6"><BotaoVoltar destino="/casos" /><p className="text-tinta-suave mt-3 text-[13px]">Caso não encontrado.</p></div>;
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
            disabled={encerrada}
            aria-pressed={estado === "pausada"}
            onClick={() => setEstado((atual) => (atual === "gravando" ? "pausada" : "gravando"))}
            className="pressionavel border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50"
          >
            {estado === "pausada" ? "Retomar" : "Pausar"}
          </button>
          <button
            type="button"
            disabled={encerrada}
            onClick={() => {
              estadoAntesDoFim.current = estado;
              setEstado("pausada");
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
          {FALAS.map((fala) => (
            <p
              key={`${fala.papel}-${fala.texto}`}
              className={fala.tipo === "nota" ? "text-destaque text-[13px] font-medium" : "text-[13px] font-normal"}
            >
              {fala.papel}: {fala.texto}
            </p>
          ))}
        </section>
      </div>

      <ModalConfirmar
        aberto={confirmarAnalise}
        titulo="Gerar análise de IA"
        descricao="Finalizar a gravação e gerar a análise preliminar deste caso?"
        confirmar={processando ? "Gerando análise…" : "Gerar análise"}
        processando={processando}
        erro={erro}
        aoFechar={() => {
          if (envioEmCurso.current) return;
          setConfirmarAnalise(false);
          setEstado(estadoAntesDoFim.current);
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
        }}
        aoConfirmar={() => router.replace(`/casos/${casoId}/gravacao`)}
      />
    </>
  );
}

function formatarCronometro(total: number) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
