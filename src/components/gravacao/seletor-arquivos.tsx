"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { FileAudio, FileText, X } from "lucide-react";

import { EXTENSOES_AUDIO, EXTENSOES_DOCUMENTO, ehAudio } from "@/lib/arquivos/ler-documento";
import { cn } from "@/lib/utils";

const ACEITOS = [
  "audio/*",
  "video/mp4",
  "video/webm",
  "video/3gpp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  ...EXTENSOES_AUDIO,
  ...EXTENSOES_DOCUMENTO,
].join(",");

/** Um arquivo na fila de envio; `erro` fica preenchido quando o envio dele falhou. */
export interface ItemFila {
  id: string;
  arquivo: File;
  erro?: string;
}

export function idDoArquivo(arquivo: File) {
  return `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`;
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Fila de arquivos da entrevista. A área de arrastar fica sempre visível, então dá para ir
 * somando arquivos (um por vez ou vários juntos) sem perder os que já estão na lista.
 */
export function SeletorArquivos({
  fila,
  aoAdicionar,
  aoRemover,
  vagas,
  maximo,
  desabilitado = false,
}: {
  fila: ItemFila[];
  aoAdicionar: (arquivos: File[]) => void;
  aoRemover: (id: string) => void;
  /** Quantos documentos ainda cabem no caso. */
  vagas: number;
  maximo: number;
  desabilitado?: boolean;
}) {
  const [arrastando, setArrastando] = useState(false);
  const cheio = vagas <= 0 && !fila.some((item) => ehAudio(item.arquivo));
  const bloqueado = desabilitado || cheio;

  return (
    <div className="flex flex-col gap-2">
      {fila.length ? (
        <ul className="flex flex-col gap-2">
          {fila.map((item) => (
            <li
              key={item.id}
              className={cn(
                "bg-superficie flex items-center gap-3 rounded-[10px] border px-4 py-3",
                item.erro ? "border-destructive/60" : "border-borda",
              )}
            >
              <span className="bg-destaque-suave text-destaque flex size-9 shrink-0 items-center justify-center rounded-[8px]">
                {ehAudio(item.arquivo) ? (
                  <FileAudio className="size-4" aria-hidden />
                ) : (
                  <FileText className="size-4" aria-hidden />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-[13px] font-semibold">{item.arquivo.name}</p>
                <p className="text-tinta-suave text-[11px]">{formatarTamanho(item.arquivo.size)}</p>
                {item.erro ? (
                  <p role="alert" className="text-destructive mt-0.5 text-[11px]">
                    {item.erro}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={desabilitado}
                onClick={() => aoRemover(item.id)}
                aria-label={`Remover ${item.arquivo.name}`}
                className="hover:bg-tinta/5 flex size-8 items-center justify-center rounded-[8px] disabled:opacity-40"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label
        onDragOver={(evento: DragEvent<HTMLLabelElement>) => {
          evento.preventDefault();
          if (!bloqueado) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(evento: DragEvent<HTMLLabelElement>) => {
          evento.preventDefault();
          setArrastando(false);
          if (!bloqueado) aoAdicionar(Array.from(evento.dataTransfer.files));
        }}
        className={cn(
          "border-borda flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 text-center transition-colors",
          fila.length ? "min-h-[84px] py-4" : "min-h-[132px] py-6",
          arrastando ? "border-destaque bg-destaque-suave" : "hover:border-destaque/60",
          bloqueado && "cursor-not-allowed opacity-60 hover:border-borda",
        )}
      >
        <input
          type="file"
          multiple
          accept={ACEITOS}
          disabled={bloqueado}
          onChange={(evento: ChangeEvent<HTMLInputElement>) => {
            aoAdicionar(Array.from(evento.target.files ?? []));
            // Limpa a escolha para o mesmo arquivo poder ser selecionado de novo depois de removido.
            evento.target.value = "";
          }}
          className="sr-only"
        />
        {fila.length ? null : (
          <span className="bg-destaque-suave text-destaque flex size-10 items-center justify-center rounded-full">
            <FileText className="size-5" aria-hidden />
          </span>
        )}
        <p className="text-[13px] font-semibold">
          {cheio
            ? `Limite de ${maximo} documentos por caso atingido`
            : fila.length
              ? "Arraste mais arquivos aqui ou clique para adicionar"
              : "Arraste os arquivos aqui ou clique para escolher"}
        </p>
        <p className="text-tinta-suave text-[11px]">
          Áudio (um por vez), ou até {maximo} documentos PDF, DOCX ou TXT por caso
        </p>
      </label>
    </div>
  );
}
