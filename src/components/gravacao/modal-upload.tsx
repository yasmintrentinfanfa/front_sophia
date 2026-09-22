"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const TIPOS = "audio/mpeg,audio/mp4,video/mp4,.mp3,.mp4";

interface ModalUploadProps {
  aberto: boolean;
  aoFechar: () => void;
  aoAnexar: (arquivo: File) => void;
}

export function ModalUpload({ aberto, aoFechar, aoAnexar }: ModalUploadProps) {
  const idTitulo = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) {
      setArquivo(null);
      setArrastando(false);
      return;
    }

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

  if (!montado || !aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="bg-campo border-borda w-full max-w-[360px] rounded-[10px] border p-4 shadow-lg"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="text-[15px] font-semibold">
          Carregar arquivo
        </h2>
        <p className="text-tinta-suave mt-1 text-[12px]">Envie um áudio MP3 ou um vídeo MP4 da entrevista.</p>

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
          <input
            ref={entrada}
            type="file"
            accept={TIPOS}
            onChange={aoMudar}
            className="sr-only"
          />
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
      </div>
    </div>,
    document.body,
  );
}
