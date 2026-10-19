"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

const CHAVE_CONFIG_IA = "sophia-config-ia";

type Provedor = "openai" | "google" | "anthropic";

const PROVEDORES: { valor: Provedor; rotulo: string }[] = [
  { valor: "openai", rotulo: "OpenAI (GPT)" },
  { valor: "google", rotulo: "Google (Gemini)" },
  { valor: "anthropic", rotulo: "Anthropic (Claude)" },
];

interface ConfigIA {
  provedor: Provedor;
  chave: string;
}

function lerConfigSalva(): ConfigIA {
  try {
    const bruto = localStorage.getItem(CHAVE_CONFIG_IA);
    if (!bruto) return { provedor: "openai", chave: "" };
    return JSON.parse(bruto) as ConfigIA;
  } catch {
    return { provedor: "openai", chave: "" };
  }
}

interface ModalConfigurarIAProps {
  aberto: boolean;
  aoFechar: () => void;
}

export function ModalConfigurarIA({ aberto, aoFechar }: ModalConfigurarIAProps) {
  const idTitulo = useId();
  const idProvedor = useId();
  const idChave = useId();
  const [montado, setMontado] = useState(false);
  const [provedor, setProvedor] = useState<Provedor>("openai");
  const [chave, setChave] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const config = lerConfigSalva();
    setProvedor(config.provedor);
    setChave(config.chave);
    setSalvo(false);

    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, aoFechar]);

  function aoSalvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    try {
      localStorage.setItem(CHAVE_CONFIG_IA, JSON.stringify({ provedor, chave: chave.trim() }));
    } catch {
      /* private mode */
    }
    setSalvo(true);
  }

  if (!montado || !aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={aoFechar}
    >
      <form
        onSubmit={aoSalvar}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="bg-campo border-borda w-full max-w-[380px] rounded-[10px] border p-4 shadow-lg"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="text-[15px] font-semibold">
          Configurar IA
        </h2>
        <p className="text-tinta-suave mt-1 text-[12px]">
          Escolha o motor de IA e informe sua própria chave de API. Sophia organiza a análise; o
          &quot;combustível&quot; é seu.
        </p>

        <div className="mt-3 flex flex-col gap-1.5">
          <label htmlFor={idProvedor} className="text-[12px] font-medium">
            Provedor
          </label>
          <select
            id={idProvedor}
            value={provedor}
            onChange={(evento) => setProvedor(evento.target.value as Provedor)}
            className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2"
          >
            {PROVEDORES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <label htmlFor={idChave} className="text-[12px] font-medium">
            Chave de API
          </label>
          <input
            id={idChave}
            type="password"
            autoComplete="off"
            value={chave}
            onChange={(evento) => setChave(evento.target.value)}
            placeholder="sk-..."
            className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2"
          />
          <p className="text-tinta-suave text-[11px]">
            Armazenada só neste navegador por enquanto; nunca é enviada a servidores da Sophia.
          </p>
        </div>

        {salvo ? <p className="text-destaque mt-3 text-[12px] font-medium">Configuração salva.</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Fechar
          </button>
          <button
            type="submit"
            className="bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
