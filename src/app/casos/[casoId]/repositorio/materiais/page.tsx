"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@base-ui/react/tabs";
import { FileText, Plus } from "lucide-react";

import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type { ConteudoCaso as DadosCaso, DocumentoCaso } from "@/lib/api/analise";
import { formatarDataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

const VERIFICACAO: Record<DocumentoCaso["sanitizacao"]["status"], string> = {
  pendente: "Verificação pendente",
  limpo: "Verificado",
  suspeito: "Conteúdo suspeito",
};

/** Tudo o que já entrou no caso: os relatos (transcritos ou escritos) e os documentos anexados. */
export default function PaginaMateriais() {
  return <ConteudoCaso>{(dados) => <Materiais dados={dados} />}</ConteudoCaso>;
}

function Materiais({ dados }: { dados: DadosCaso }) {
  const [documento, setDocumento] = useState<DocumentoCaso | null>(null);
  const destinoRepositorio = `/casos/${dados.casoId}/repositorio`;
  const abas = [
    { id: "transcricao", titulo: "Transcrições", total: dados.transcricao.length },
    { id: "documentos", titulo: "Documentos", total: dados.documentos.length },
  ];

  return (
    <>
      {/* Mesma largura do conteúdo, como no repositório: o botão fica alinhado à lista. */}
      <header className="w-full shrink-0 px-7 pt-5 pb-2 max-[700px]:px-4">
        <div className="flex w-full max-w-[880px] flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <BotaoVoltar destino={destinoRepositorio} />
              <h1 className="text-[22px] leading-none font-bold">Transcrições e documentos</h1>
            </div>
            <p className="text-[13px]">{dados.titulo}</p>
          </div>
          <Link
            href={destinoRepositorio}
            className="pressionavel bg-acao text-acao-tinta flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold"
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar ao caso
          </Link>
        </div>
      </header>

      <Tabs.Root defaultValue="transcricao" className="flex min-h-0 flex-1 flex-col px-7 max-[700px]:px-4">
        <Tabs.List
          aria-label="Conteúdo do repositório"
          className="flex min-h-11 shrink-0 flex-wrap items-start gap-2"
        >
          {abas.map((aba) => (
            <Tabs.Tab
              key={aba.id}
              value={aba.id}
              className="bg-campo border-borda data-active:border-destaque data-active:bg-destaque-suave flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] data-active:font-semibold"
            >
              {aba.titulo}
              <span className="text-tinta-suave text-[11px] font-medium">{aba.total}</span>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="transcricao" className="flex w-full max-w-[880px] flex-col gap-[10px] pt-4 pb-6">
          {dados.transcricao.length ? (
            dados.transcricao.map((fala, indice) => (
              <article
                key={fala.id}
                className="bg-campo border-borda flex flex-col gap-2 rounded-[10px] border px-4 py-3"
              >
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-[12px] font-semibold">
                    Transcrição {indice + 1}
                    {fala.tempo && fala.tempo !== "00:00" ? ` · ${fala.tempo}` : ""}
                  </span>
                  {fala.criadoEm ? (
                    <span className="text-tinta-suave text-[11px]">{formatarDataHora(fala.criadoEm)}</span>
                  ) : null}
                </p>
                <p
                  className={cn(
                    "text-[13px] leading-5 whitespace-pre-wrap",
                    fala.papel === "cliente" && "text-tinta-suave",
                  )}
                >
                  {fala.texto}
                </p>
              </article>
            ))
          ) : (
            <Vazio texto="Nenhuma transcrição neste caso ainda." destino={destinoRepositorio} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="documentos" className="flex w-full max-w-[880px] flex-col gap-[10px] pt-4 pb-6">
          {dados.documentos.length ? (
            dados.documentos.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setDocumento(item)}
                className="pressionavel border-borda bg-campo hover:border-destaque/60 flex min-h-12 items-center gap-3 rounded-[10px] border px-4 py-3 text-left"
              >
                <FileText className="text-destaque size-4 shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium">{item.nome}</span>
                  <span className="text-tinta-suave text-[11px]">
                    {[item.tipo, VERIFICACAO[item.sanitizacao.status], item.criadoEm ? formatarDataHora(item.criadoEm) : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="text-destaque shrink-0 text-[12px] font-semibold">Ver texto</span>
              </button>
            ))
          ) : (
            <Vazio texto="Nenhum documento neste caso ainda." destino={destinoRepositorio} />
          )}
        </Tabs.Panel>
      </Tabs.Root>

      <ModalFluxo
        aberto={!!documento}
        aoFechar={() => setDocumento(null)}
        titulo={documento?.nome ?? "Documento"}
        descricao={documento?.texto ? undefined : "Não há texto legível neste documento."}
      >
        {documento?.texto ? (
          <p className="mt-3 max-h-[360px] overflow-y-auto text-[13px] leading-5 whitespace-pre-wrap">
            {documento.texto}
          </p>
        ) : null}
      </ModalFluxo>
    </>
  );
}

function Vazio({ texto, destino }: { texto: string; destino: string }) {
  return (
    <div className="border-borda flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed px-4 py-4">
      <p className="text-tinta-suave text-[13px]">{texto}</p>
      <Link href={destino} className="text-destaque text-[12px] font-semibold underline-offset-2 hover:underline">
        Adicionar ao caso
      </Link>
    </div>
  );
}
