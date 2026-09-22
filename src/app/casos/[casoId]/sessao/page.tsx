"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
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
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando } = useListaCasos();
  const [segundos, setSegundos] = useState(0);
  const [estado, setEstado] = useState<EstadoGravacao>("gravando");
  const caso = casos.find((item) => item.id === casoId);

  useEffect(() => {
    if (estado !== "gravando") return;
    const id = window.setInterval(() => setSegundos((atual) => atual + 1), 1000);
    return () => window.clearInterval(id);
  }, [estado]);

  if (carregando) {
    return <p className="text-tinta-suave px-10 pt-8 text-sm">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-10 pt-8 text-sm">Caso não encontrado.</p>;
  }

  const encerrada = estado === "encerrada";

  return (
    <>
      <header className="flex h-20 w-full shrink-0 items-center justify-between gap-4 px-10 pt-5 pb-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-xl leading-none font-bold">Sessão ativa</h1>
          <p className="text-tinta-suave truncate text-[13px]">{caso.titulo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={encerrada}
            aria-pressed={estado === "pausada"}
            onClick={() => setEstado((atual) => (atual === "gravando" ? "pausada" : "gravando"))}
            className="border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50"
          >
            {estado === "pausada" ? "Retomar" : "Pausar"}
          </button>
          <button
            type="button"
            disabled={encerrada}
            onClick={() => setEstado("encerrada")}
            className="bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold disabled:opacity-50"
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

      <div className="flex min-h-0 flex-1 px-10 pt-4 pb-6">
        <section className="bg-campo border-borda flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto rounded-[14px] border p-5">
          <h2 className="text-[15px] font-semibold">Transcrição da conversa</h2>
          {FALAS.map((fala) => (
            <p
              key={`${fala.papel}-${fala.texto}`}
              className={fala.tipo === "nota" ? "text-destaque text-sm font-medium" : "text-sm font-normal"}
            >
              {fala.papel}: {fala.texto}
            </p>
          ))}
        </section>
      </div>
    </>
  );
}

function formatarCronometro(total: number) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
