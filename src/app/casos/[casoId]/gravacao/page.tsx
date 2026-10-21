"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ModalUpload } from "@/components/gravacao/modal-upload";
import type { ConteudoCaso } from "@/lib/api/analise";
import { processarEntrevista } from "@/lib/transcricao/fluxo";
import { cn } from "@/lib/utils";

type FonteAudio = "ao_vivo" | "arquivo";

export default function PaginaGravacao() {
  const router = useRouter();
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando, finalizarSessao } = useListaCasos();
  const [fonte, setFonte] = useState<FonteAudio>("ao_vivo");
  const [modalAberto, setModalAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [revisado, setRevisado] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const caso = casos.find((item) => item.id === casoId);

  async function transcreverArquivo(escolhido: File) {
    setProcessando(true);
    setErro("");
    try {
      const resultado = await processarEntrevista(casoId, escolhido, escolhido.name, (bruto) => {
        setTexto(bruto);
        setRevisando(true);
      });
      setTexto(resultado.texto);
      setRevisado(resultado.revisado);
      setRevisando(false);
      const transcricao: ConteudoCaso["transcricao"] = [
        {
          id: `${casoId}-transcricao`,
          tempo: "00:00",
          texto: resultado.texto,
          papel: "cliente",
        },
      ];
      try {
        await finalizarSessao(casoId, transcricao);
      } catch {
        // A fala já foi salva no banco. O status local não impede abrir a análise.
      }
      setPronta(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível transcrever o arquivo.");
    } finally {
      setProcessando(false);
      setRevisando(false);
    }
  }

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Caso não encontrado.</p>;
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino="/casos" />
          <h1 className="text-[22px] leading-none font-bold">Gravação da entrevista</h1>
        </div>
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
            disabled={processando}
            onClick={() => {
              setFonte("ao_vivo");
              router.push(`/casos/${caso.id}/sessao`);
            }}
            aria-pressed={fonte === "ao_vivo"}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50",
              fonte === "ao_vivo" ? "border-destaque border-[1.5px]" : "border-borda",
            )}
          >
            Iniciar gravação
          </button>
          <button
            type="button"
            disabled={processando}
            onClick={() => {
              setFonte("arquivo");
              setModalAberto(true);
            }}
            aria-pressed={fonte === "arquivo"}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50",
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
        {processando && !texto ? (
          <p className="text-[13px]">Transcrevendo o arquivo. Isso pode levar alguns minutos.</p>
        ) : null}
        {texto ? (
          <section className="bg-campo border-borda flex flex-col gap-3 rounded-[10px] border p-4">
            <h2 className="text-[13px] font-semibold">Transcrição</h2>
            <p className="text-[13px] leading-5 whitespace-pre-wrap">{texto}</p>
            {revisando ? <p className="text-tinta-suave text-[12px]">Revisando a transcrição…</p> : null}
            {pronta && revisado ? (
              <p className="text-tinta-suave text-[12px]">Transcrição revisada.</p>
            ) : null}
            {pronta && !revisado ? (
              <p className="text-tinta-suave text-[12px]">
                Texto transcrito pelo Whisper. A revisão da Groq entra quando a chave estiver configurada.
              </p>
            ) : null}
            {pronta ? (
              <button
                type="button"
                onClick={() => router.push(`/casos/${casoId}/analise`)}
                className="pressionavel bg-acao text-acao-tinta flex h-8 w-fit items-center rounded-[8px] px-3 text-[12px] font-semibold"
              >
                Ver análise
              </button>
            ) : null}
          </section>
        ) : null}
        {erro ? (
          <p role="alert" className="text-[12px]">
            {erro}
          </p>
        ) : null}
      </div>

      <ModalUpload
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoAnexar={(escolhido) => {
          setArquivo(escolhido);
          setModalAberto(false);
          void transcreverArquivo(escolhido);
        }}
      />
    </>
  );
}
