"use client";

import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, ChevronRight, TriangleAlert, X } from "lucide-react";

import {
  CenaBoasVindas,
  CenaCards,
  CenaCasos,
  CenaChat,
  CenaCriarCaso,
  CenaGravacao,
  CenaPecas,
  CenaPronto,
  CenaRelato,
  CenaRepositorio,
  COLUNAS_TUTORIAL,
} from "@/components/tutorial/cenas";
import { cn } from "@/lib/utils";

interface Passo {
  rotulo: string;
  /** Onde o passo acontece no sistema, do clique de partida até a tela. */
  caminho?: string[];
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
    texto: "Em poucos passos, a conversa com o cliente vira análise jurídica, chat e minutas. Este é o caminho:",
    itens: [
      { nome: "Novo caso", detalhe: "o cliente e a área jurídica" },
      { nome: "Repositório", detalhe: "grave, envie ou escreva o relato" },
      { nome: "Análise", detalhe: "teses, jurisprudência e perguntas" },
      { nome: "Chat e peças", detalhe: "tire dúvidas e gere minutas" },
    ],
    Cena: CenaBoasVindas,
  },
  {
    rotulo: "Novo caso",
    caminho: ["Barra lateral", "Novo caso"],
    titulo: "Crie um caso",
    texto:
      "Clique em + na barra lateral, informe o nome do caso, o cliente e a área jurídica e clique em Criar caso. O caso abre direto no Repositório.",
    itens: [{ nome: "Área jurídica", detalhe: "orienta a análise e sugere as peças certas" }],
    Cena: CenaCriarCaso,
  },
  {
    rotulo: "Relato",
    caminho: ["Repositório do caso"],
    titulo: "Registre o relato",
    texto: "No Repositório, escolha como trazer a conversa com o cliente:",
    itens: [
      { nome: "Gravar ao vivo", detalhe: "grave a conversa; a transcrição é feita ao finalizar" },
      { nome: "Enviar áudio ou documento", detalhe: "arraste um áudio, ou PDF, DOCX e TXT" },
      { nome: "Escrever o relato", detalhe: "digite ou cole o que o cliente contou" },
    ],
    Cena: CenaRelato,
  },
  {
    rotulo: "Gravação",
    caminho: ["Gravar ao vivo", "Sessão ativa"],
    titulo: "Grave e gere a análise",
    texto:
      "Clique em Iniciar gravação e converse com o cliente. No fim, clique em Finalizar: a Sophia transcreve, revisa e gera a análise.",
    itens: [
      { nome: "Pausar e Retomar", detalhe: "a gravação continua de onde parou" },
      { nome: "Ver análise", detalhe: "abre os cards assim que tudo termina" },
    ],
    aviso: "O áudio só sai do seu navegador ao finalizar. Mantenha a tela aberta até a transcrição terminar.",
    Cena: CenaGravacao,
  },
  {
    rotulo: "Análise",
    caminho: ["Análise preliminar de caso"],
    titulo: "Entenda os cards",
    texto: "A análise organiza o caso em cinco colunas. Clique num card para ver os detalhes e as fontes.",
    itens: COLUNAS_TUTORIAL.map((coluna) => ({ nome: coluna.titulo, detalhe: coluna.significado.toLowerCase() })),
    aviso: "Confira sempre as fontes: a IA pode errar.",
    Cena: CenaCards,
  },
  {
    rotulo: "Chat",
    caminho: ["Análise", "Chat com IA"],
    titulo: "Converse com a IA",
    texto: "No topo da análise, clique em Chat com IA para tirar dúvidas sobre o caso.",
    itens: [
      { nome: "Sugestões", detalhe: "perguntas prontas para começar" },
      { nome: "Fato novo?", detalhe: "conte no chat e clique em “Atualizar análise com a conversa”" },
    ],
    Cena: CenaChat,
  },
  {
    rotulo: "Peças",
    caminho: ["Análise", "Peças processuais"],
    titulo: "Gere as peças",
    texto:
      "No topo da análise, clique em Peças processuais e escolha um modelo. Os da área do caso aparecem primeiro.",
    itens: [
      { nome: "Orientações", detalhe: "opcional: juízo, pedidos e detalhes da peça" },
      { nome: "Minuta pronta", detalhe: "copie o texto ou baixe o .docx" },
    ],
    aviso: "A minuta é um rascunho: confira fatos, fundamentos e prazos antes de protocolar.",
    Cena: CenaPecas,
  },
  {
    rotulo: "Casos",
    caminho: ["Barra lateral", "Casos em análise"],
    titulo: "Gerencie seus casos",
    texto: "Em Casos em análise ficam todos os seus casos. Clique num caso para abrir a análise, com o chat e as peças.",
    itens: [
      { nome: "Arquivar", detalhe: "tira da lista sem apagar; fica em Arquivados" },
      { nome: "Excluir", detalhe: "remove o caso da sua lista" },
      { nome: "Lista da barra lateral", detalhe: "troca de caso sem sair da tela em que você está" },
    ],
    Cena: CenaCasos,
  },
  {
    rotulo: "Repositório",
    caminho: ["Barra lateral", "Repositório"],
    titulo: "Tudo do caso num só lugar",
    texto: "Com o caso aberto, clique no ícone de pasta da barra lateral para voltar ao Repositório:",
    itens: [
      { nome: "Adicionar ao caso", detalhe: "grave, envie ou escreva um relato novo" },
      { nome: "Transcrições e documentos", detalhe: "tudo o que já entrou no caso" },
      { nome: "Material novo", detalhe: "você escolhe se atualiza a análise com ele" },
    ],
    Cena: CenaRepositorio,
  },
  {
    rotulo: "Pronto",
    caminho: ["Sua conta", "Configurações"],
    titulo: "Tudo pronto",
    texto:
      "Crie seu primeiro caso agora. Para rever este tutorial, clique no círculo com suas iniciais e abra Configurações.",
    Cena: CenaPronto,
  },
];

/** Entrada em cascata do texto: cada linha chega um pouco depois da anterior. */
function cascata(ordem: number): { className: string; style: CSSProperties } {
  return {
    className: "motion-safe:animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500 ease-out",
    style: { animationDelay: `${80 + ordem * 55}ms` },
  };
}

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
          <Dialog.Popup className="bg-campo border-borda flex max-h-[92dvh] w-full max-w-[1040px] flex-col overflow-hidden rounded-[16px] border shadow-2xl outline-none transition-[opacity,transform] duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
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
  const linhas = [
    atual.caminho ? "caminho" : null,
    "titulo",
    "texto",
    ...(atual.itens ?? []).map((item) => item.nome),
    atual.aviso ? "aviso" : null,
  ].filter(Boolean) as string[];
  const ordem = (linha: string) => linhas.indexOf(linha);

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

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 pt-3 pb-4 md:grid-cols-[1.45fr_1fr] md:items-center md:gap-7">
        <div
          key={`cena-${passo}`}
          className={cn(
            "motion-safe:animate-in fade-in zoom-in-98 duration-500 ease-out",
            direcao === "frente" ? "slide-in-from-right-4" : "slide-in-from-left-4",
          )}
        >
          <Cena />
        </div>
        <div key={`texto-${passo}`} className="flex flex-col gap-3">
          {atual.caminho ? (
            <p
              aria-label={`Onde fica: ${atual.caminho.join(", ")}`}
              className={cn("flex flex-wrap items-center gap-1", cascata(ordem("caminho")).className)}
              style={cascata(ordem("caminho")).style}
            >
              {atual.caminho.map((etapa, indice) => (
                <span key={etapa} className="flex items-center gap-1" aria-hidden>
                  {indice > 0 ? <ChevronRight className="text-tinta-suave size-3" /> : null}
                  <span className="border-borda bg-chip text-tinta-suave rounded-full border px-2 py-0.5 text-[11px] font-medium">
                    {etapa}
                  </span>
                </span>
              ))}
            </p>
          ) : null}
          <Dialog.Title
            className={cn("text-[22px] leading-tight font-bold", cascata(ordem("titulo")).className)}
            style={cascata(ordem("titulo")).style}
          >
            {atual.titulo}
          </Dialog.Title>
          <Dialog.Description
            className={cn("text-tinta-suave text-[13px] leading-relaxed", cascata(ordem("texto")).className)}
            style={cascata(ordem("texto")).style}
          >
            {atual.texto}
          </Dialog.Description>
          {atual.itens ? (
            <ul className="flex flex-col gap-1.5">
              {atual.itens.map((item) => (
                <li
                  key={item.nome}
                  className={cn("flex gap-2 text-[12.5px] leading-snug", cascata(ordem(item.nome)).className)}
                  style={cascata(ordem(item.nome)).style}
                >
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
            <p
              className={cn(
                "border-borda bg-chip text-tinta-suave flex items-start gap-2 rounded-[8px] border px-3 py-2 text-[11.5px]",
                cascata(ordem("aviso")).className,
              )}
              style={cascata(ordem("aviso")).style}
            >
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
              title={item.rotulo}
              onClick={() => irPara(indice)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                indice === passo ? "bg-destaque w-6" : indice < passo ? "bg-destaque/45 w-2" : "bg-borda hover:bg-destaque/30 w-2",
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
