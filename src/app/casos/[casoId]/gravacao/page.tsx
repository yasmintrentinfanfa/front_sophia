"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { ModalUpload } from "@/components/gravacao/modal-upload";
import { cn } from "@/lib/utils";

type FonteAudio = "ao_vivo" | "arquivo";

export default function PaginaGravacao() {
  const router = useRouter();
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando } = useListaCasos();
  const [fonte, setFonte] = useState<FonteAudio>("ao_vivo");
  const [modalAberto, setModalAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const caso = casos.find((item) => item.id === casoId);

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Caso não encontrado.</p>;
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <h1 className="text-[22px] leading-none font-bold">Gravação da entrevista</h1>
        <p className="text-[13px]">{caso.titulo}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pt-4 pb-7">
        <section className="bg-campo border-borda flex w-full flex-col gap-1.5 rounded-[10px] border px-4 py-3">
          <h2 className="text-[13px] font-semibold">Consentimento do cliente</h2>
          <p className="text-tinta-suave text-[12px]">
            O cliente foi informado e autorizou a gravação e o processamento dos dados para fins
            jurídicos.
          </p>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setFonte("ao_vivo");
              router.push(`/casos/${caso.id}/sessao`);
            }}
            aria-pressed={fonte === "ao_vivo"}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold",
              fonte === "ao_vivo" ? "border-destaque border-[1.5px]" : "border-borda",
            )}
          >
            Iniciar gravação
          </button>
          <button
            type="button"
            onClick={() => {
              setFonte("arquivo");
              setModalAberto(true);
            }}
            aria-pressed={fonte === "arquivo"}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold",
              fonte === "arquivo" ? "border-destaque border-[1.5px]" : "border-borda",
            )}
          >
            Carregar Arquivo
          </button>
        </div>

        {arquivo ? (
          <p className="text-tinta-suave text-[12px]">
            Arquivo selecionado: <span className="text-tinta font-medium">{arquivo.name}</span>
          </p>
        ) : null}
      </div>

      <ModalUpload
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoAnexar={(escolhido) => {
          setArquivo(escolhido);
          setModalAberto(false);
        }}
      />
    </>
  );
}
