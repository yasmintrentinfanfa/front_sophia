"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const TIPOS = "audio/mpeg,audio/mp4,video/mp4,.mp3,.mp4";

interface ModalUploadProps {
  aberto: boolean;
  aoFechar: () => void;
  aoAnexar: (arquivo: File) => void;
}

export function ModalUpload({ aberto, aoFechar, aoAnexar }: ModalUploadProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Carregar arquivo"
      descricao="Envie um áudio MP3 ou um vídeo MP4 da entrevista."
    >
      <ConteudoUpload aoFechar={aoFechar} aoAnexar={aoAnexar} />
    </Modal>
  );
}

function ConteudoUpload({ aoFechar, aoAnexar }: Omit<ModalUploadProps, "aberto">) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);

  function aceitar(lista: FileList | null) {
    const escolhido = lista?.[0];
    if (!escolhido) return;
    const nome = escolhido.name.toLowerCase();
    if (!nome.endsWith(".mp3") && !nome.endsWith(".mp4")) return;
    setArquivo(escolhido);
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(false);
    aceitar(evento.dataTransfer.files);
  }

  function aoMudar(evento: ChangeEvent<HTMLInputElement>) {
    aceitar(evento.target.files);
  }

  return (
    <>
      <label
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={cn(
          "border-borda mt-3 flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed px-3 py-4 text-center",
          arrastando && "border-destaque bg-destaque-suave",
        )}
      >
        <input type="file" accept={TIPOS} onChange={aoMudar} className="sr-only" />
        {arquivo ? (
          <p className="text-[12px] font-medium">{arquivo.name}</p>
        ) : (
          <>
            <p className="text-[12px] font-medium">Arraste o arquivo aqui</p>
            <p className="text-tinta-suave mt-1 text-[11px]">ou clique para escolher no computador</p>
          </>
        )}
      </label>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!arquivo}
          onClick={() => {
            if (arquivo) aoAnexar(arquivo);
          }}
          className="bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold disabled:opacity-40"
        >
          Anexar
        </button>
      </div>
    </>
  );
}
