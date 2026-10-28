"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FileAudio, FileText, Mic, PenLine, RefreshCw, Sparkles } from "lucide-react";

import { IconeCasos, IconeNovoCaso, IconeRepositorio, IconeLixeira } from "@/components/casos/icones-trilha";
import { cn } from "@/lib/utils";

/** Índice que avança sozinho de 0 a n-1; parado em 0 para quem pede menos movimento. */
function useCiclo(total: number, intervalo = 1800) {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndice((atual) => (atual + 1) % total), intervalo);
    return () => window.clearInterval(id);
  }, [total, intervalo]);
  return indice;
}

/** Moldura de "janela" em que cada cena mostra uma miniatura da tela real. */
function MiniTela({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="bg-fundo border-borda flex h-full w-full flex-col overflow-hidden rounded-[12px] border shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <div className="border-borda bg-barra flex h-6 shrink-0 items-center gap-1 border-b px-2.5" aria-hidden>
        <span className="bg-borda size-1.5 rounded-full" />
        <span className="bg-borda size-1.5 rounded-full" />
        <span className="bg-borda size-1.5 rounded-full" />
      </div>
      <div className={cn("min-h-0 flex-1 p-3", className)}>{children}</div>
    </div>
  );
}

function Linha({ className }: { className?: string }) {
  return <span className={cn("bg-borda/70 block h-1.5 rounded-full", className)} />;
}

// ------------------------------------------------------------------- 1. boas-vindas
const ETAPAS_FLUXO = [
  { rotulo: "Caso", Icone: FileText },
  { rotulo: "Relato", Icone: Mic },
  { rotulo: "Análise", Icone: Sparkles },
  { rotulo: "Chat e peças", Icone: PenLine },
];

export function CenaBoasVindas() {
  const atual = useCiclo(ETAPAS_FLUXO.length, 1200);
  return (
    <MiniTela className="flex flex-col items-center justify-center gap-5">
      <p className="text-destaque text-[22px] font-bold tracking-tight">SOPHIA</p>
      <ol className="flex w-full max-w-[300px] items-center">
        {ETAPAS_FLUXO.map(({ rotulo, Icone }, indice) => (
          <li key={rotulo} className="flex flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition-all duration-500",
                  indice <= atual
                    ? "bg-destaque border-destaque scale-105 text-white"
                    : "bg-campo border-borda text-tinta-suave",
                )}
              >
                <Icone className="size-4" aria-hidden />
              </span>
              <span className={cn("text-[10px] font-semibold", indice <= atual ? "text-tinta" : "text-tinta-suave")}>
                {rotulo}
              </span>
            </span>
            {indice < ETAPAS_FLUXO.length - 1 ? (
              <span className="bg-borda relative mx-1 mb-5 h-[2px] flex-1 overflow-hidden rounded-full">
                <span
                  className={cn(
                    "bg-destaque absolute inset-y-0 left-0 transition-all duration-700",
                    indice < atual ? "w-full" : "w-0",
                  )}
                />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 2. criar caso
const CAMPOS = [
  { rotulo: "Nome do caso", valor: "Rescisão indireta" },
  { rotulo: "Cliente", valor: "Carlos Nunes" },
  { rotulo: "Área jurídica", valor: "Trabalhista" },
];

export function CenaCriarCaso() {
  const preenchidos = useCiclo(CAMPOS.length + 2, 1100);
  return (
    <MiniTela className="flex gap-3 p-0">
      <div className="bg-trilha flex w-9 shrink-0 flex-col items-center gap-2 py-3" aria-hidden>
        <span className="bg-destaque-suave border-destaque ring-destaque/25 flex size-7 items-center justify-center rounded-[8px] border-[1.5px] ring-4 tutorial-pulso">
          <IconeNovoCaso />
        </span>
        <span className="flex size-7 items-center justify-center">
          <IconeCasos />
        </span>
        <span className="flex size-7 items-center justify-center">
          <IconeRepositorio />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 py-3 pr-3">
        <p className="text-[13px] font-bold">Novo caso</p>
        {CAMPOS.map((campo, indice) => (
          <div key={campo.rotulo} className="flex flex-col gap-1">
            <span className="text-tinta-suave text-[9px] font-medium">{campo.rotulo}</span>
            <span
              className={cn(
                "bg-campo flex h-7 items-center rounded-[6px] border px-2 text-[11px] transition-colors duration-300",
                indice < preenchidos ? "border-destaque" : "border-borda text-tinta-suave",
              )}
            >
              {indice < preenchidos ? campo.valor : ""}
            </span>
          </div>
        ))}
        <span
          className={cn(
            "bg-acao text-acao-tinta mt-1 flex h-7 w-fit items-center rounded-[6px] px-3 text-[10px] font-semibold transition-transform duration-300",
            preenchidos > CAMPOS.length && "scale-105",
          )}
        >
          Criar caso
        </span>
      </div>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 3. relato
const MODOS = [
  { titulo: "Gravar ao vivo", detalhe: "Transcrição ao finalizar", Icone: Mic },
  { titulo: "Enviar arquivo", detalhe: "Áudio, PDF, DOCX ou TXT", Icone: FileAudio },
  { titulo: "Escrever", detalhe: "Digite ou cole o relato", Icone: PenLine },
];

export function CenaRelato() {
  const atual = useCiclo(MODOS.length, 1700);
  return (
    <MiniTela className="flex flex-col justify-center gap-3">
      <p className="text-[12px] font-semibold">Como você quer registrar o relato?</p>
      <div className="grid grid-cols-3 gap-2">
        {MODOS.map(({ titulo, detalhe, Icone }, indice) => {
          const ativo = indice === atual;
          return (
            <div
              key={titulo}
              className={cn(
                "bg-campo flex flex-col gap-1.5 rounded-[10px] border p-2.5 transition-all duration-500",
                ativo ? "border-destaque ring-destaque/20 -translate-y-0.5 ring-4" : "border-borda",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-[6px] transition-colors duration-500",
                  ativo ? "bg-destaque text-white" : "bg-destaque-suave text-destaque",
                )}
              >
                <Icone className="size-3.5" aria-hidden />
              </span>
              <span className="text-[10.5px] leading-tight font-bold">{titulo}</span>
              <span className="text-tinta-suave text-[9px] leading-tight">{detalhe}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-campo border-borda flex items-center gap-2 rounded-[8px] border px-2.5 py-2">
        <span className="bg-destaque size-1.5 rounded-full tutorial-pulso" />
        <span className="text-tinta-suave text-[10px]">
          {["Gravando a entrevista…", "contrato.pdf anexado ao caso", "Relato salvo no caso"][atual]}
        </span>
      </div>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 4. cards
export const COLUNAS_TUTORIAL = [
  { titulo: "Teses jurídicas", significado: "Argumentos que sustentam o pedido" },
  { titulo: "Temas STF/STJ", significado: "Precedentes das cortes superiores" },
  { titulo: "Jurisprudência", significado: "Decisões parecidas e se o entendimento é majoritário" },
  { titulo: "Perguntas", significado: "O que confirmar com o cliente" },
  { titulo: "Necessidades", significado: "Documentos, perícias e chance de acordo" },
];

export function CenaCards() {
  const atual = useCiclo(COLUNAS_TUTORIAL.length, 1500);
  return (
    <MiniTela className="flex flex-col gap-2.5">
      <div className="bg-campo border-borda flex flex-col gap-1 rounded-[8px] border px-2.5 py-2">
        <span className="text-[10px] font-semibold">Resumo do caso</span>
        <Linha className="w-full" />
        <Linha className="w-3/4" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-1.5">
        {COLUNAS_TUTORIAL.map((coluna, indice) => {
          const ativo = indice === atual;
          return (
            <div key={coluna.titulo} className="flex min-w-0 flex-col gap-1.5">
              <span
                className={cn(
                  "truncate text-[8.5px] font-bold transition-colors duration-300",
                  ativo ? "text-destaque" : "text-tinta",
                )}
              >
                {coluna.titulo}
              </span>
              {[0, 1].map((cartao) => (
                <span
                  key={cartao}
                  className={cn(
                    "bg-campo flex flex-col gap-1 rounded-[6px] border p-1.5 transition-all duration-500",
                    ativo ? "border-destaque ring-destaque/20 ring-2" : "border-borda",
                    cartao === 1 && "opacity-70",
                  )}
                >
                  <Linha className={cn("w-full", ativo && "bg-destaque/60")} />
                  <Linha className="w-2/3" />
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <p key={atual} className="text-destaque animate-in fade-in text-center text-[11px] font-semibold duration-500">
        {COLUNAS_TUTORIAL[atual].titulo}: {COLUNAS_TUTORIAL[atual].significado.toLowerCase()}
      </p>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 5. chat
const CONVERSA = [
  { papel: "advogado", texto: "Quais documentos ainda faltam?" },
  { papel: "assistente", texto: "Holerites, cartões de ponto e o extrato do FGTS." },
  { papel: "advogado", texto: "Ele recebia R$ 400 por Pix, fora do holerite." },
] as const;

export function CenaChat() {
  const etapa = useCiclo(CONVERSA.length + 2, 1300);
  return (
    <MiniTela className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold">Chat com IA</span>
        <span
          className={cn(
            "bg-campo flex items-center gap-1 rounded-[6px] border px-2 py-1 text-[9px] font-medium transition-all duration-500",
            etapa > CONVERSA.length ? "border-destaque text-destaque ring-destaque/20 ring-2" : "border-borda",
          )}
        >
          <RefreshCw className={cn("size-2.5", etapa > CONVERSA.length && "animate-spin")} aria-hidden />
          Atualizar análise com a conversa
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5">
        {CONVERSA.slice(0, Math.min(etapa + 1, CONVERSA.length)).map((mensagem, indice) => (
          <p
            key={indice}
            className={cn(
              "animate-in fade-in slide-in-from-bottom-1 max-w-[85%] rounded-[8px] px-2.5 py-1.5 text-[10px] leading-snug duration-500",
              mensagem.papel === "advogado"
                ? "bg-destaque-suave self-end"
                : "bg-campo border-borda self-start border",
            )}
          >
            {mensagem.texto}
          </p>
        ))}
      </div>
      <div className="bg-campo border-borda flex h-7 items-center rounded-[6px] border px-2 text-[9px]">
        <span className="text-tinta-suave">Pergunte algo sobre o caso…</span>
      </div>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 6. lista de casos
const CASOS_EXEMPLO = ["Rescisão indireta — Carlos", "Plano nega cirurgia — Mariana", "Briga de trânsito — Rafael"];

export function CenaCasos() {
  const passo = useCiclo(4, 1400);
  // 0: lista · 1: destaca arquivar · 2: destaca excluir · 3: caso foi para o Arquivo
  return (
    <MiniTela className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold">Casos em análise</span>
        <span
          className={cn(
            "text-tinta-suave flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[9px] font-semibold transition-colors duration-500",
            passo === 3 && "bg-destaque-suave text-destaque",
          )}
        >
          <span className="scale-75">
            <IconeRepositorio />
          </span>
          Arquivados {passo === 3 ? "(1)" : ""}
        </span>
      </div>
      {CASOS_EXEMPLO.map((caso, indice) => {
        const alvo = indice === 0;
        const saiu = alvo && passo === 3;
        return (
          <div
            key={caso}
            className={cn(
              "bg-superficie border-borda flex items-center gap-2 rounded-[8px] border px-2.5 py-2 transition-all duration-500",
              saiu && "translate-x-4 opacity-30",
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[10.5px] font-semibold">{caso}</span>
              <Linha className="w-1/2" />
            </span>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-[6px] transition-all duration-300 [&>span]:scale-75",
                alvo && passo === 1 && "bg-destaque-suave ring-destaque/30 ring-2",
              )}
              title="Arquivar"
            >
              <IconeRepositorio />
            </span>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-[6px] transition-all duration-300 [&>span]:scale-75",
                alvo && passo === 2 && "bg-destructive/15 ring-destructive/30 ring-2",
              )}
              title="Excluir"
            >
              <IconeLixeira />
            </span>
          </div>
        );
      })}
      <p className="text-tinta-suave mt-auto text-center text-[10px]">
        {["Todos os seus casos ficam aqui", "Arquivar: sai da lista, sem apagar", "Excluir: remove o caso da sua lista", "O caso arquivado fica em Arquivados"][passo]}
      </p>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 7. repositório
const ABAS = [
  { titulo: "Transcrição", conteudo: "Todos os relatos do caso, em ordem" },
  { titulo: "Documentos", conteudo: "Arquivos anexados (PDF, DOCX e TXT)" },
  { titulo: "Análise", conteudo: "Os cards da versão mais recente" },
  { titulo: "Histórico", conteudo: "Versões da análise e eventos do caso" },
];

export function CenaRepositorio() {
  const atual = useCiclo(ABAS.length, 1600);
  return (
    <MiniTela className="flex flex-col gap-2.5">
      <span className="text-[12px] font-bold">Repositório do caso</span>
      <div className="border-borda flex gap-3 border-b">
        {ABAS.map((aba, indice) => (
          <span
            key={aba.titulo}
            className={cn(
              "-mb-px border-b-2 pb-1.5 text-[10px] font-semibold transition-colors duration-300",
              indice === atual ? "border-destaque text-destaque" : "text-tinta-suave border-transparent",
            )}
          >
            {aba.titulo}
          </span>
        ))}
      </div>
      <div key={atual} className="animate-in fade-in slide-in-from-right-2 flex flex-1 flex-col gap-2 duration-500">
        <p className="text-[11px] font-semibold">{ABAS[atual].conteudo}</p>
        {[0, 1, 2].map((item) => (
          <span key={item} className="bg-campo border-borda flex items-center gap-2 rounded-[8px] border px-2.5 py-2">
            <FileText className="text-destaque size-3.5 shrink-0" aria-hidden />
            <span className="flex flex-1 flex-col gap-1">
              <Linha className="w-2/3" />
              <Linha className="w-1/3" />
            </span>
          </span>
        ))}
      </div>
    </MiniTela>
  );
}

// ------------------------------------------------------------------- 8. final
export function CenaPronto() {
  return (
    <MiniTela className="flex flex-col items-center justify-center gap-3">
      <span className="bg-destaque-suave text-destaque flex size-14 items-center justify-center rounded-full tutorial-pulso">
        <Sparkles className="size-6" aria-hidden />
      </span>
      <p className="text-[15px] font-bold">Tudo pronto</p>
      <span className="bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[11px] font-semibold">
        + Novo caso
      </span>
    </MiniTela>
  );
}
