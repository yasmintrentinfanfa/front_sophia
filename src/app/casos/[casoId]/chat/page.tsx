"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { useCasoAtual } from "@/components/casos/contexto-caso-atual";
import { CHIPS_FLUXO, MENSAGENS_INICIAIS, respostaSimulada, type MensagemChat } from "@/lib/chat/dados";
import { cn } from "@/lib/utils";

export default function PaginaChat() {
  const caso = useCasoAtual();
  const idCampo = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>(MENSAGENS_INICIAIS);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);

  function enviar(conteudo: string) {
    const pergunta = conteudo.trim();
    if (!pergunta || pensando) return;

    const mensagemAdvogado: MensagemChat = {
      id: `msg-${Date.now()}`,
      autor: "advogado",
      conteudo: pergunta,
    };
    setMensagens((atual) => [...atual, mensagemAdvogado]);
    setTexto("");
    setPensando(true);

    window.setTimeout(() => {
      setMensagens((atual) => [
        ...atual,
        {
          id: `msg-${Date.now()}-ia`,
          autor: "ia",
          conteudo: respostaSimulada(atual.length),
        },
      ]);
      setPensando(false);
    }, 700);
  }

  function aoEnviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar(texto);
  }

  function aoClicarChip(chip: string) {
    setTexto(`Quais as melhores teses considerando ${chip}?`);
    entrada.current?.focus();
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <h1 className="text-[22px] leading-none font-bold">Interação com a IA jurídica</h1>
        <p className="text-tinta-suave text-[13px]">
          Continue o fluxo de análise com perguntas e novos caminhos · {caso.titulo}
        </p>
      </header>

      <div className="flex shrink-0 flex-wrap gap-2 px-7 pt-3">
        {CHIPS_FLUXO.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => aoClicarChip(chip)}
            className="border-borda bg-chip hover:border-destaque/60 flex h-8 items-center rounded-full border px-3 text-[12px] font-medium"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pt-4 pb-4">
        {mensagens.map((mensagem) => (
          <BolhaMensagem key={mensagem.id} mensagem={mensagem} />
        ))}
        {pensando ? (
          <p className="text-tinta-suave text-[12px] italic">A IA está analisando…</p>
        ) : null}
      </div>

      <form
        onSubmit={aoEnviarFormulario}
        className="flex shrink-0 items-center gap-2 px-7 pt-2 pb-6"
      >
        <label htmlFor={idCampo} className="sr-only">
          Pergunte algo sobre o caso
        </label>
        <input
          id={idCampo}
          ref={entrada}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Pergunte algo sobre o caso..."
          className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-12 w-full max-w-[900px] rounded-[8px] border px-4 text-[13px] outline-none focus:ring-2"
        />
        <button
          type="submit"
          disabled={!texto.trim() || pensando}
          className="bg-acao text-acao-tinta flex h-[42px] shrink-0 items-center rounded-[8px] px-4 text-[12px] font-semibold disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </>
  );
}

function BolhaMensagem({ mensagem }: { mensagem: MensagemChat }) {
  const daIA = mensagem.autor === "ia";
  return (
    <div
      className={cn(
        "max-w-[640px] rounded-[10px] border px-4 py-3 text-[13px] leading-relaxed",
        daIA ? "bg-destaque-suave border-transparent self-start" : "bg-campo border-borda self-end",
      )}
    >
      {mensagem.conteudo}
    </div>
  );
}
