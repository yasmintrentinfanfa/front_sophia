"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo placeholder:text-destaque h-[52px] w-full rounded-[10px] border px-4 text-sm outline-none focus:ring-2";

export default function PaginaNovoCaso() {
  const router = useRouter();
  const { criarCaso } = useListaCasos();
  const idTitulo = useId();
  const idCliente = useId();
  const idArea = useId();
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [area, setArea] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!titulo.trim() || !cliente.trim() || enviando) return;
    setEnviando(true);
    try {
      const caso = await criarCaso({
        titulo: titulo.trim(),
        cliente: cliente.trim(),
        area: area.trim() || undefined,
      });
      router.push(`/casos/${caso.id}/gravacao`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-[6px] px-[40px] pt-[28px] pb-[12px]">
        <h1 className="text-[28px] leading-none font-bold">Criar novo caso</h1>
        <p className="text-tinta-suave text-sm">Vincule um cliente e inicie a análise</p>
      </header>

      <form
        onSubmit={aoEnviar}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-[40px] pt-8 pb-10"
      >
        <div className="flex w-full max-w-[520px] flex-col gap-2">
          <label htmlFor={idTitulo} className="text-[13px] font-medium">
            Nome do caso
          </label>
          <input
            id={idTitulo}
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ex: Rescisão contratual — Silva"
            required
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex w-full max-w-[520px] flex-col gap-2">
          <label htmlFor={idCliente} className="text-[13px] font-medium">
            Cliente
          </label>
          <input
            id={idCliente}
            value={cliente}
            onChange={(evento) => setCliente(evento.target.value)}
            placeholder="Nome do cliente"
            required
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex w-full max-w-[520px] flex-col gap-2">
          <label htmlFor={idArea} className="text-[13px] font-medium">
            Área jurídica
          </label>
          <input
            id={idArea}
            value={area}
            onChange={(evento) => setArea(evento.target.value)}
            placeholder="Ex: Civil, Trabalhista, Empresarial"
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/casos")}
            className="border-borda bg-campo flex h-11 w-[120px] items-center justify-center rounded-[10px] border text-[13px] font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="bg-acao text-acao-tinta flex h-11 w-[140px] items-center justify-center rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
          >
            Criar caso
          </button>
        </div>
      </form>
    </>
  );
}
