"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, TriangleAlert, X } from "lucide-react";

import {
  CenaBoasVindas,
  CenaCards,
  CenaCasos,
  CenaChat,
  CenaCriarCaso,
  CenaPronto,
  CenaRelato,
  CenaRepositorio,
  COLUNAS_TUTORIAL,
} from "@/components/tutorial/cenas";
import { cn } from "@/lib/utils";

interface Passo {
  rotulo: string;
  titulo: string;
  texto: string;
  itens?: { nome: string; detalhe: string }[];
  aviso?: string;
  Cena: ComponentType;
}

const PASSOS: Passo[] = [
  {
    rotulo: "Boas-vindas",
    titulo: "Boas-vindas à Sophia",
    texto: "Em poucos passos, a conversa com o cliente vira análise jurídica, chat e minutas.",
    Cena: CenaBoasVindas,
  },
  {
    rotulo: "Novo caso",
    titulo: "Crie um caso",
    texto: "Clique em + na barra lateral e informe o nome do caso, o cliente e a área jurídica.",
    Cena: CenaCriarCaso,
  },
  {
    rotulo: "Relato",
    titulo: "Registre o relato",
    texto: "Escolha como trazer a conversa com o cliente:",
    itens: [
      { nome: "Gravar ao vivo", detalhe: "transcrevemos ao finalizar" },
      { nome: "Enviar arquivo", detalhe: "áudio, ou PDF, DOCX e TXT como documentos" },
      { nome: "Escrever", detalhe: "digite ou cole o relato" },
    ],
    Cena: CenaRelato,
  },
  {
    rotulo: "Análise",
    titulo: "Entenda os cards",
    texto: "A IA organiza o caso em cinco colunas. Clique num card para ver detalhes e fontes.",
    itens: COLUNAS_TUTORIAL.map((coluna) => ({ nome: coluna.titulo, detalhe: coluna.significado })),
    aviso: "Confira sempre as fontes: a IA pode errar.",
    Cena: CenaCards,
  },
  {
    rotulo: "Chat",
    titulo: "Converse com a IA",
    texto: "Em Chat com IA, tire dúvidas sobre o caso.",
    itens: [
      { nome: "Fato novo?", detalhe: "use “Atualizar análise com a conversa” para refazer os cards" },
      { nome: "Peças processuais", detalhe: "gere minutas a partir da análise" },
    ],
    Cena: CenaChat,
  },
  {
    rotulo: "Casos",
    titulo: "Gerencie seus casos",
    texto: "Em Casos em análise ficam todos os seus casos.",
    itens: [
      { nome: "Arquivar", detalhe: "tira da lista sem apagar; fica em Arquivados" },
      { nome: "Excluir", detalhe: "remove o caso da sua lista" },
    ],
    Cena: CenaCasos,
  },
  {
    rotulo: "Repositório",
    titulo: "Tudo do caso num só lugar",
    texto: "Com o caso aberto, clique no ícone de pasta da barra lateral para abrir o Repositório:",
    itens: [
      { nome: "Transcrição", detalhe: "todos os relatos" },
      { nome: "Documentos", detalhe: "arquivos anexados" },
      { nome: "Análise", detalhe: "os cards do caso" },
      { nome: "Histórico", detalhe: "versões da análise e eventos" },
    ],
    Cena: CenaRepositorio,
  },
  {
    rotulo: "Pronto",
    titulo: "Tudo pronto",
    texto: "Crie seu primeiro caso agora. Você pode rever este tutorial em Configurações.",
    Cena: CenaPronto,
  },
];

export function Tutorial({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(proximo) => {
        if (!proximo) aoFechar();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="bg-campo border-borda flex max-h-[92dvh] w-full max-w-[860px] flex-col overflow-hidden rounded-[16px] border shadow-2xl outline-none transition-[opacity,transform] duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
            {/* Montado só aberto: cada abertura recomeça do primeiro passo. */}
            <ConteudoTutorial aoFechar={aoFechar} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConteudoTutorial({ aoFechar }: { aoFechar: () => void }) {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  function irPara(destino: number) {
    if (destino < 0 || destino >= PASSOS.length || destino === passo) return;
    setDirecao(destino > passo ? "frente" : "tras");
    setPasso(destino);
  }

  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest("input, textarea, [contenteditable=true]")) return;
      if (evento.key === "ArrowRight") irPara(passo + 1);
      if (evento.key === "ArrowLeft") irPara(passo - 1);
    }
    // Captura: o Dialog interrompe a propagação das teclas antes de chegarem à janela.
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  });

  function comecar() {
    aoFechar();
    router.push("/casos/novo");
  }

  const { Cena } = atual;
  const entrada = direcao === "frente" ? "slide-in-from-right-6" : "slide-in-from-left-6";

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <span className="text-destaque text-[11px] font-semibold tracking-[0.08em] uppercase">
          Tutorial · {passo + 1} de {PASSOS.length}
        </span>
        <Dialog.Close
          aria-label="Fechar tutorial"
          className="pressionavel text-tinta-suave hover:bg-tinta/5 flex size-8 items-center justify-center rounded-[8px]"
        >
          <X className="size-4" aria-hidden />
        </Dialog.Close>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 pt-3 pb-4 md:grid-cols-[1.15fr_1fr] md:gap-7">
        <div key={`cena-${passo}`} className={cn("animate-in fade-in h-[230px] duration-500 md:h-[290px]", entrada)}>
          <Cena />
        </div>
        <div key={`texto-${passo}`} className={cn("animate-in fade-in flex flex-col gap-3 duration-500", entrada)}>
          <Dialog.Title className="text-[22px] leading-tight font-bold">{atual.titulo}</Dialog.Title>
          <Dialog.Description className="text-tinta-suave text-[13px] leading-relaxed">{atual.texto}</Dialog.Description>
          {atual.itens ? (
            <ul className="flex flex-col gap-1.5">
              {atual.itens.map((item) => (
                <li key={item.nome} className="flex gap-2 text-[12.5px] leading-snug">
                  <span className="bg-destaque mt-[7px] size-1.5 shrink-0 rounded-full" aria-hidden />
                  <span>
                    <span className="font-semibold">{item.nome}</span>
                    <span className="text-tinta-suave"> — {item.detalhe}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {atual.aviso ? (
            <p className="border-borda bg-chip text-tinta-suave flex items-start gap-2 rounded-[8px] border px-3 py-2 text-[11.5px]">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {atual.aviso}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-borda flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Passos do tutorial">
          {PASSOS.map((item, indice) => (
            <button
              key={item.rotulo}
              type="button"
              role="tab"
              aria-selected={indice === passo}
              aria-label={`Passo ${indice + 1}: ${item.rotulo}`}
              onClick={() => irPara(indice)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                indice === passo ? "bg-destaque w-6" : indice < passo ? "bg-destaque/45 w-2" : "bg-borda w-2",
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {ultimo ? null : (
            <button
              type="button"
              onClick={aoFechar}
              className="text-tinta-suave hover:text-tinta h-9 px-2 text-[12px] font-medium"
            >
              Pular tutorial
            </button>
          )}
          {passo > 0 ? (
            <button
              type="button"
              onClick={() => irPara(passo - 1)}
              className="pressionavel border-borda bg-campo flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Voltar
            </button>
          ) : null}
          {ultimo ? (
            <button
              type="button"
              onClick={comecar}
              className="pressionavel bg-acao text-acao-tinta flex h-9 items-center rounded-[8px] px-4 text-[12px] font-semibold"
            >
              Criar meu primeiro caso
            </button>
          ) : (
            <button
              type="button"
              onClick={() => irPara(passo + 1)}
              className="pressionavel bg-acao text-acao-tinta flex h-9 items-center gap-1.5 rounded-[8px] px-4 text-[12px] font-semibold"
            >
              {passo === 0 ? "Começar" : "Próximo"}
              <ArrowRight className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
