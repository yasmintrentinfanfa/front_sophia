"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { EXTENSOES_DOCUMENTO, ehAudio, ehDocumento } from "@/lib/arquivos/ler-documento";
import { salvarDocumentoDoCaso, type DocumentoSalvo } from "@/lib/transcricao/fluxo";

/** O mesmo teto do backend (TAMANHO_MAX_DOCUMENTO); conferido aqui para avisar antes do envio. */
const TAMANHO_MAXIMO = 15 * 1024 * 1024;

export const ACEITA_DOCUMENTO = EXTENSOES_DOCUMENTO.join(",");

/** Por que o arquivo não pode ser anexado fora do repositório; "" quando pode. */
export function problemaDoDocumento(arquivo: File) {
  if (ehAudio(arquivo)) {
    return "Áudios são transcritos no repositório do caso, em “Enviar áudio ou documento”.";
  }
  if (!ehDocumento(arquivo)) return `“${arquivo.name}” não é PDF, Word (DOCX) nem TXT.`;
  if (arquivo.size === 0) return `“${arquivo.name}” está vazio.`;
  if (arquivo.size > TAMANHO_MAXIMO) return `“${arquivo.name}” passa de 15 MB. Envie uma versão menor.`;
  return "";
}

export interface EventosDoAnexo {
  /**
   * Com este evento, escolher arquivos só os entrega aqui, sem subir: quem usa decide quando
   * enviar (o chat espera o advogado escrever algo ou mandar só o arquivo).
   */
  aoEscolher?: (arquivos: File[]) => void;
  /** O arquivo passou na conferência e começou a subir. */
  aoComecar?: (id: number, nome: string) => void;
  aoAnexar?: (id: number, documento: DocumentoSalvo) => void;
  /** `id` vem só quando o envio já tinha começado. */
  aoFalhar: (mensagem: string, id?: number) => void;
}

/**
 * Anexa PDF, DOCX ou TXT ao caso de qualquer tela (chat, análise). Usa a mesma rota do
 * repositório, então o arquivo aparece lá e entra no contexto do chat e da próxima análise.
 * Vários arquivos sobem um por vez, na ordem escolhida.
 */
export function useAnexarDocumento(casoId: string, eventos: EventosDoAnexo) {
  const entrada = useRef<HTMLInputElement>(null);
  const proximoId = useRef(0);
  const ocupado = useRef(false);
  const [enviando, setEnviando] = useState<string | null>(null);

  async function anexar(arquivos: File[]) {
    if (ocupado.current || arquivos.length === 0) return;
    ocupado.current = true;
    try {
      for (const arquivo of arquivos) {
        const problema = problemaDoDocumento(arquivo);
        if (problema) {
          eventos.aoFalhar(problema);
          continue;
        }
        const id = ++proximoId.current;
        setEnviando(arquivo.name);
        eventos.aoComecar?.(id, arquivo.name);
        try {
          eventos.aoAnexar?.(id, await salvarDocumentoDoCaso(casoId, arquivo));
        } catch (falha) {
          eventos.aoFalhar(falha instanceof Error ? falha.message : "Não foi possível anexar o documento.", id);
        }
      }
    } finally {
      ocupado.current = false;
      setEnviando(null);
    }
  }

  function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    // Limpa para que escolher o mesmo arquivo de novo dispare o onChange.
    evento.target.value = "";
    if (eventos.aoEscolher) eventos.aoEscolher(arquivos);
    else void anexar(arquivos);
  }

  return {
    anexar,
    /** Nome do arquivo subindo agora; null quando não há envio. */
    enviando,
    abrirSeletor: () => entrada.current?.click(),
    /** Espalhe num `<input>`: ele fica escondido e é aberto por `abrirSeletor`. */
    propsDaEntrada: {
      ref: entrada,
      type: "file" as const,
      accept: ACEITA_DOCUMENTO,
      multiple: true,
      hidden: true,
      tabIndex: -1,
      onChange: aoEscolher,
    },
  };
}
