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
    return <p className="text-tinta-suave px-10 pt-8 text-sm">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-10 pt-8 text-sm">Caso não encontrado.</p>;
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-[6px] px-[40px] pt-[28px] pb-[12px]">
        <h1 className="text-[28px] leading-none font-bold">Gravação da entrevista</h1>
        <p className="text-sm">{caso.titulo}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[40px] pt-5 pb-10">
        <section className="bg-campo border-borda flex w-full flex-col gap-2 rounded-[12px] border px-6 py-5">
          <h2 className="text-[15px] font-semibold">Consentimento do cliente</h2>
          <p className="text-tinta-suave text-[13px]">
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
              "bg-campo flex h-10 items-center rounded-[10px] border px-4 text-[13px] font-semibold",
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
              "bg-campo flex h-10 items-center rounded-[10px] border px-4 text-[13px] font-semibold",
              fonte === "arquivo" ? "border-destaque border-[1.5px]" : "border-borda",
            )}
          >
            Upload MP3 ou MP4
          </button>
        </div>

        {arquivo ? (
          <p className="text-tinta-suave text-[13px]">
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
