"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@base-ui/react/tabs";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type {
  ConteudoCaso as DadosCaso,
  DocumentoCaso,
} from "@/lib/api/analise";
import { cn } from "@/lib/utils";
import styles from "@/components/fluxo/telas.module.css";

const ABAS = [
  { id: "transcricao", titulo: "Transcricao" },
  { id: "documentos", titulo: "Documentos" },
  { id: "analise", titulo: "Analise" },
  { id: "historico", titulo: "Historico" },
];

export default function PaginaRepositorio() {
  return (
    <ConteudoCaso>{(dados) => <Repositorio dados={dados} />}</ConteudoCaso>
  );
}

function Repositorio({ dados }: { dados: DadosCaso }) {
  const [documento, setDocumento] = useState<DocumentoCaso | null>(null);
  return (
    <>
      <header className="flex shrink-0 flex-col gap-[6px] px-10 pt-7 pb-3 max-[700px]:px-4">
        <h1 className="text-[24px] leading-[29px] font-bold">
          Repositorio do caso
        </h1>
        <p className="text-[14px] leading-[17px]">{dados.titulo}</p>
      </header>
      <Tabs.Root
        defaultValue="transcricao"
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List
          aria-label="Conteudo do repositorio"
          className="flex min-h-11 shrink-0 flex-wrap items-start gap-2 px-10 max-[700px]:px-4"
        >
          {ABAS.map((aba) => (
            <Tabs.Tab
              key={aba.id}
              value={aba.id}
              className={cn(
                "bg-campo border-borda h-10 rounded-[8px] border px-4 py-2 text-[13px] data-active:font-semibold dark:bg-[var(--fundo-cartao)]",
                aba.id === "analise" && "text-tinta-suave",
              )}
            >
              {aba.titulo}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel
          value="transcricao"
          className="flex flex-col gap-[10px] pt-4 pr-5 pb-6 pl-10 max-[700px]:px-4"
        >
          {dados.transcricao.length ? (
            dados.transcricao.map((fala) => (
              <p
                key={fala.id}
                className={cn(
                  "bg-campo border-borda min-h-12 rounded-[10px] border px-4 text-[13px] leading-4 dark:bg-[var(--fundo-cartao)]",
                  fala.papel === "cliente" && "text-tinta-suave",
                )}
              >
                [{fala.tempo}] {fala.texto}
              </p>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma transcricao neste caso.
            </p>
          )}
          <GerarPeca casoId={dados.casoId} />
        </Tabs.Panel>
        <Tabs.Panel
          value="documentos"
          className="flex flex-col gap-[10px] px-10 pt-4 pb-6 max-[700px]:px-4"
        >
          {dados.documentos.length ? (
            dados.documentos.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setDocumento(item)}
                className="border-borda flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[10px] border bg-[var(--fundo-cartao)] px-4 py-3 text-left text-[13px]"
              >
                <span>{item.nome}</span>
                <span className="text-tinta-suave text-[11px]">
                  {item.tipo} ·{" "}
                  {item.sanitizacao.status === "pendente"
                    ? "Verificacao pendente"
                    : item.sanitizacao.status === "limpo"
                      ? "Verificado"
                      : "Conteudo suspeito"}
                </span>
              </button>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhum documento neste caso.
            </p>
          )}
          <GerarPeca casoId={dados.casoId} />
        </Tabs.Panel>
        <Tabs.Panel
          value="analise"
          className="flex flex-col gap-4 px-10 pt-4 pb-6 max-[700px]:px-4"
        >
          {dados.analise ? (
            <ColunasAnalise analise={dados.analise} />
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma analise neste caso.
            </p>
          )}
          <Link
            className="text-destaque self-start text-[13px] underline"
            href={`/casos/${dados.casoId}/analise`}
          >
            Abrir analise do caso
          </Link>
          <GerarPeca casoId={dados.casoId} />
        </Tabs.Panel>
        <Tabs.Panel
          value="historico"
          className="flex flex-col gap-[10px] px-10 pt-4 pb-6 max-[700px]:px-4"
        >
          {dados.historico.length ? (
            dados.historico.map((evento) => (
              <div
                key={evento.id}
                className="border-borda flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[10px] border bg-[var(--fundo-cartao)] px-4 py-3 text-[13px]"
              >
                <p>{evento.descricao}</p>
                <time
                  dateTime={evento.data}
                  className="text-tinta-suave text-[11px]"
                >
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(evento.data))}
                </time>
              </div>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhum evento neste caso.
            </p>
          )}
          <GerarPeca casoId={dados.casoId} />
        </Tabs.Panel>
      </Tabs.Root>
      <ModalFluxo
        aberto={!!documento}
        aoFechar={() => setDocumento(null)}
        titulo={documento?.nome ?? "Documento"}
        descricao="Documento de demonstracao do caso. O arquivo original estara disponivel apos a integracao do repositorio."
      />
    </>
  );
}

function GerarPeca({ casoId }: { casoId: string }) {
  return (
    <Link
      href={`/casos/${casoId}/chat`}
      className={`${styles.acao} pressionavel bg-acao text-acao-tinta flex h-11 w-[180px] max-w-full items-center justify-center rounded-[10px] text-[13px] font-semibold`}
    >
      Gerar peca processual
    </Link>
  );
}
