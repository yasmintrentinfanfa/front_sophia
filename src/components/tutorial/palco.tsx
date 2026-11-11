"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { FileText } from "lucide-react";

import { IconeArea } from "@/components/casos/icone-area";
import {
  Hamburguer,
  IconeCasos,
  IconeConfiguracoes,
  IconeNovoCaso,
  IconeRepositorio,
  IconeSair,
} from "@/components/casos/icones-trilha";
import { cn } from "@/lib/utils";

/*
 * Base das cenas do tutorial: uma tela de tamanho fixo, reduzida para caber na coluna
 * da cena, com a barra lateral de verdade e um cursor que percorre os botões reais.
 * Os estilos de :hover da miniatura usam `data-sobre`, que o cursor põe no alvo.
 */

// ------------------------------------------------------------------- movimento

const CONSULTA_MOVIMENTO = "(prefers-reduced-motion: reduce)";

function assinarMovimento(aoMudar: () => void) {
  const consulta = window.matchMedia(CONSULTA_MOVIMENTO);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

/** Quem pede menos movimento vê cada cena parada no quadro que resume o passo. */
export function useMovimentoReduzido() {
  return useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia(CONSULTA_MOVIMENTO).matches,
    () => false,
  );
}

// ------------------------------------------------------------------- roteiro

/** Um momento da cena: quanto dura, onde está o cursor e se ele clica. */
export interface Batida {
  ms: number;
  /** `data-alvo` sob o cursor; `null` leva o cursor ao canto. Sem valor, ele fica onde estava. */
  alvo?: string | null;
  clique?: boolean;
}

/**
 * Toca as batidas em sequência e recomeça, como um vídeo em loop. Com movimento
 * reduzido, a cena fica parada em `quadroFixo`.
 */
export function useRoteiro(roteiro: readonly Batida[], quadroFixo: number) {
  const reduzido = useMovimentoReduzido();
  const [tocando, setTocando] = useState(0);

  useEffect(() => {
    if (reduzido) return;
    const id = window.setTimeout(
      () => setTocando((atual) => (atual + 1) % roteiro.length),
      roteiro[tocando].ms,
    );
    return () => window.clearTimeout(id);
  }, [tocando, reduzido, roteiro]);

  const indice = reduzido ? quadroFixo : tocando;
  let alvo: string | null = null;
  for (let anterior = indice; anterior >= 0; anterior -= 1) {
    const definido = roteiro[anterior].alvo;
    if (definido !== undefined) {
      alvo = definido;
      break;
    }
  }
  return { indice, alvo, clique: !reduzido && Boolean(roteiro[indice].clique) };
}

// ------------------------------------------------------------------- palco

const ALTURA = 420;
const LARGURA_LARGA = 680;
/** Coluna estreita (celular): barra lateral recolhida, como numa tela pequena. */
const LARGURA_COMPACTA = 470;
const LIMITE_COMPACTO = 520;

interface DadosPalco {
  escala: number;
  compacto: boolean;
  largura: number;
  altura: number;
  raiz: RefObject<HTMLDivElement | null>;
}

const ContextoPalco = createContext<DadosPalco>({
  escala: 1,
  compacto: false,
  largura: LARGURA_LARGA,
  altura: ALTURA,
  raiz: { current: null },
});

export function usePalco() {
  return useContext(ContextoPalco);
}

/** A miniatura mantém as proporções das telas reais em qualquer largura da coluna. */
export function Palco({ children }: { children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const [larguraReal, setLarguraReal] = useState(0);

  useLayoutEffect(() => {
    const elemento = caixa.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => setLarguraReal(entrada.contentRect.width));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const compacto = larguraReal > 0 && larguraReal < LIMITE_COMPACTO;
  const largura = compacto ? LARGURA_COMPACTA : LARGURA_LARGA;
  const escala = larguraReal / largura;

  return (
    <div
      ref={caixa}
      aria-hidden
      className="tutorial-palco relative w-full select-none"
      style={{ aspectRatio: `${largura} / ${ALTURA}` }}
    >
      {larguraReal ? (
        // Camada própria: o texto miúdo reduzido sai em tons de cinza, sem a franja
        // colorida da suavização de subpixel do Windows.
        <div
          ref={raiz}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: largura, height: ALTURA, transform: `scale(${escala})` }}
        >
          <ContextoPalco value={{ escala, compacto, largura, altura: ALTURA, raiz }}>{children}</ContextoPalco>
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------- cursor

/** Ponta do cursor sobre o alvo: abaixo do centro e, em alvos largos, perto do rótulo. */
function pontoDoAlvo(alvo: HTMLElement, tela: HTMLElement, escala: number) {
  const caixaTela = tela.getBoundingClientRect();
  const caixa = alvo.getBoundingClientRect();
  return {
    x: (caixa.left - caixaTela.left) / escala + Math.min(caixa.width / escala / 2, 56),
    y: (caixa.top - caixaTela.top) / escala + (caixa.height / escala) * 0.58,
  };
}

export function Cursor({
  alvo,
  clique,
  marca,
  arrastando,
}: {
  alvo: string | null;
  clique: boolean;
  /** Muda a cada batida: refaz a medida e recomeça o efeito de clique. */
  marca: number;
  /** Nome do arquivo que o cursor carrega, para simular o arrastar. */
  arrastando?: string;
}) {
  const { raiz, escala, largura, altura } = usePalco();
  const [posicao, setPosicao] = useState<{ x: number; y: number } | null>(null);
  const [deslizar, setDeslizar] = useState(false);

  useEffect(() => {
    const tela = raiz.current;
    if (!tela) return;
    function medir() {
      if (!tela) return;
      const elemento = alvo ? tela.querySelector<HTMLElement>(`[data-alvo="${alvo}"]`) : null;
      setPosicao(elemento ? pontoDoAlvo(elemento, tela, escala) : { x: largura * 0.76, y: altura * 0.84 });
    }
    // Mede de novo depois das animações de entrada, que deslocam o alvo por um instante.
    const quadro = window.requestAnimationFrame(medir);
    const depois = window.setTimeout(medir, 560);
    return () => {
      window.cancelAnimationFrame(quadro);
      window.clearTimeout(depois);
    };
  }, [alvo, marca, escala, largura, altura, raiz]);

  // A transição liga só depois da primeira posição: o cursor não chega voando do canto.
  useEffect(() => {
    if (!posicao || deslizar) return;
    const quadro = window.requestAnimationFrame(() => setDeslizar(true));
    return () => window.cancelAnimationFrame(quadro);
  }, [posicao, deslizar]);

  // :hover da miniatura: o alvo ganha `data-sobre` quando o cursor chega.
  useEffect(() => {
    const elemento = alvo ? raiz.current?.querySelector<HTMLElement>(`[data-alvo="${alvo}"]`) : null;
    if (!elemento) return;
    const id = window.setTimeout(() => elemento.setAttribute("data-sobre", ""), 380);
    return () => {
      window.clearTimeout(id);
      elemento.removeAttribute("data-sobre");
    };
  }, [alvo, raiz]);

  // Clique: o alvo afunda como os botões reais (.pressionavel).
  useEffect(() => {
    if (!clique || !alvo) return;
    const elemento = raiz.current?.querySelector<HTMLElement>(`[data-alvo="${alvo}"]`);
    elemento?.animate?.(
      [{ scale: "1" }, { scale: "0.95", filter: "brightness(0.93)" }, { scale: "1" }],
      { duration: 280, easing: "ease-out" },
    );
  }, [clique, alvo, marca, raiz]);

  if (!posicao) return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-50",
        deslizar && "transition-transform duration-[760ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
      style={{ transform: `translate3d(${posicao.x}px, ${posicao.y}px, 0)` }}
    >
      {/* Tamanho constante em qualquer escala do palco. */}
      <div className="relative" style={{ transform: `scale(${1 / escala})`, transformOrigin: "0 0" }}>
        {clique ? (
          <span
            key={marca}
            className="tutorial-clique border-destaque bg-destaque/25 absolute -top-3.5 -left-3.5 size-7 rounded-full border-2"
          />
        ) : null}
        {arrastando ? (
          <span className="bg-campo border-borda absolute top-4 left-3 flex items-center gap-1 rounded-[6px] border px-1.5 py-1 text-[10px] font-semibold whitespace-nowrap shadow-md">
            <FileText className="text-destaque size-3" />
            {arrastando}
          </span>
        ) : null}
        <svg
          key={clique ? `toque-${marca}` : "cursor"}
          viewBox="0 0 16 22"
          className={cn(
            "relative block h-[21px] w-[15px] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)]",
            clique && "tutorial-toque",
          )}
        >
          <path
            d="M1.5 1.5v16.3l4.2-4.1 2.9 6.6 2.8-1.2-2.9-6.5h5.9z"
            fill="#fff"
            stroke="#1c1b1a"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- janela

/** Moldura de janela; o nome da tela muda no topo a cada navegação. */
export function Moldura({ tela, children }: { tela: string; children: ReactNode }) {
  return (
    <div className="bg-fundo border-borda flex h-full w-full flex-col overflow-hidden rounded-[14px] border shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
      <div className="bg-barra border-borda relative flex h-[26px] shrink-0 items-center border-b px-3">
        <span className="flex gap-1.5">
          <span className="bg-borda size-2 rounded-full" />
          <span className="bg-borda size-2 rounded-full" />
          <span className="bg-borda size-2 rounded-full" />
        </span>
        <span
          key={tela}
          className="animate-in fade-in slide-in-from-bottom-1 bg-campo border-borda text-tinta-suave absolute left-1/2 flex h-[17px] -translate-x-1/2 items-center rounded-full border px-3 text-[9.5px] font-medium whitespace-nowrap duration-300"
        >
          {tela}
        </span>
      </div>
      {children}
    </div>
  );
}

/** O sistema por dentro: barra lateral real e a tela do momento. */
export function JanelaApp({
  tela,
  barra,
  sobreposicao,
  children,
}: {
  tela: string;
  barra?: PropsBarra;
  /** Modal da cena: cobre a janela inteira, como os modais reais. */
  sobreposicao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Moldura tela={tela}>
      <div className="relative flex min-h-0 flex-1">
        <BarraMini {...barra} />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        {sobreposicao}
      </div>
    </Moldura>
  );
}

/** Tela que acabou de abrir: entra deslizando, como a navegação para a frente. */
export function Tela({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-right-3 relative flex min-h-0 flex-1 flex-col duration-500 ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Modal da miniatura, sobre a janela inteira. */
export function ModalMini({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
      <span className="animate-in fade-in absolute inset-0 bg-black/40 duration-200" />
      <div
        className={cn(
          "bg-campo border-borda animate-in fade-in zoom-in-95 relative w-full rounded-[10px] border p-3.5 shadow-lg duration-200",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Dica escura, como o Tooltip da barra lateral; aparece quando o cursor para no item. */
export function Dica({ texto, lado = "direita" }: { texto: string; lado?: "direita" | "baixo" }) {
  return (
    <span
      className={cn(
        "bg-tinta text-fundo pointer-events-none absolute z-40 rounded-[6px] px-2 py-1 text-[10px] leading-none font-medium whitespace-nowrap opacity-0 shadow-md transition-[opacity,translate] duration-200 group-data-sobre:opacity-100",
        lado === "direita"
          ? "top-1/2 left-full ml-2 -translate-x-1 -translate-y-1/2 group-data-sobre:translate-x-0"
          : "top-full left-1/2 mt-1.5 -translate-x-1/2 -translate-y-1 group-data-sobre:translate-y-0",
      )}
    >
      <span
        className={cn(
          "bg-tinta absolute size-2 rotate-45 rounded-[1px]",
          lado === "direita" ? "top-1/2 -left-[3px] -mt-1" : "-top-[3px] left-1/2 -ml-1",
        )}
      />
      <span className="relative">{texto}</span>
    </span>
  );
}

// ------------------------------------------------------------------- barra lateral

export interface CasoMini {
  id: string;
  titulo: string;
  cliente: string;
  area: string;
}

export const CARLOS: CasoMini = { id: "carlos", titulo: "Rescisão indireta", cliente: "Carlos Nunes", area: "trabalhista" };
export const MARIANA: CasoMini = { id: "mariana", titulo: "Plano nega cirurgia", cliente: "Mariana Alves", area: "consumidor" };
export const RAFAEL: CasoMini = { id: "rafael", titulo: "Acidente de trânsito", cliente: "Rafael Lima", area: "civil" };
export const CASOS_EXEMPLO = [CARLOS, MARIANA, RAFAEL];

type SecaoTrilha = "novo" | "casos" | "repositorio";

export interface PropsBarra {
  /** Item aceso na trilha, como o `aria-current` da barra real. */
  secao?: SecaoTrilha | null;
  casos?: CasoMini[];
  casoAberto?: string | null;
  /** Caso que acabou de entrar na lista: aparece com animação. */
  casoNovo?: string | null;
  menuConta?: boolean;
}

function ItemTrilha({
  id,
  rotulo,
  ativo,
  children,
}: {
  id: SecaoTrilha;
  rotulo: string;
  ativo: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-alvo={`trilha-${id}`}
      className={cn(
        "group relative flex h-8 w-full items-center justify-center rounded-[8px] border-[1.5px] transition-colors duration-300",
        ativo ? "bg-destaque-suave border-destaque" : "data-sobre:bg-tinta/5 border-transparent",
      )}
    >
      {children}
      <Dica texto={rotulo} />
    </span>
  );
}

function BarraMini({
  secao = null,
  casos = CASOS_EXEMPLO,
  casoAberto = null,
  casoNovo = null,
  menuConta = false,
}: PropsBarra) {
  const { compacto } = usePalco();
  const expandida = !compacto;

  return (
    <aside
      className={cn(
        "bg-barra relative z-20 flex h-full shrink-0 items-stretch px-1.5 py-2",
        expandida ? "w-[196px]" : "w-[52px]",
      )}
    >
      <nav
        className={cn(
          "bg-trilha relative z-20 flex w-10 flex-col items-center gap-1.5 px-1 pt-1 pb-2",
          expandida ? "rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px]" : "rounded-[8px]",
        )}
      >
        <span className="flex h-6 w-full items-center justify-center">
          <Hamburguer />
        </span>
        <ItemTrilha id="novo" rotulo="Novo caso" ativo={secao === "novo"}>
          <IconeNovoCaso />
        </ItemTrilha>
        <ItemTrilha id="casos" rotulo="Casos em análise" ativo={secao === "casos"}>
          <IconeCasos />
        </ItemTrilha>
        {casos.length ? (
          <ItemTrilha id="repositorio" rotulo="Repositório" ativo={secao === "repositorio"}>
            <IconeRepositorio />
          </ItemTrilha>
        ) : null}
        <span className="flex-1" />
        <span
          data-alvo="conta"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#c4a35a] text-[10px] font-semibold text-[#241c10] transition-[box-shadow] duration-300 data-sobre:ring-2 data-sobre:ring-[#c4a35a]/40"
        >
          AS
        </span>
      </nav>

      {expandida ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="bg-painel relative z-10 flex min-h-0 flex-1 flex-col gap-2 rounded-[8px] px-2 py-2.5">
            <p className="text-[11.5px] font-bold">SOPHIA</p>
            <p className="text-[9.5px] font-semibold">Casos em análise</p>
            <span className="border-borda bg-campo text-tinta-suave flex h-6 items-center gap-1 rounded-[6px] border px-1.5 text-[9px]">
              <span className="text-[10px]">⌕</span>
              Buscar
            </span>
            {casos.length === 0 ? <p className="text-tinta-suave py-3 text-[9px]">Nenhum caso encontrado.</p> : null}
            <ul className="flex flex-col gap-[5px]">
              {casos.map((caso) => (
                <li
                  key={caso.id}
                  data-alvo={`lista-${caso.id}`}
                  className={cn(
                    "flex min-h-7 items-start gap-1 rounded-[6px] px-1.5 py-1 text-[8.5px] leading-tight font-medium transition-colors duration-300",
                    caso.id === casoAberto
                      ? "border-destaque bg-ativo text-ativo-tinta border-[1.5px]"
                      : "bg-chip text-meta border-borda data-sobre:border-destaque/60 border",
                    caso.id === casoNovo && "animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-500",
                  )}
                >
                  <IconeArea area={caso.area} className="mt-px size-2.5" />
                  <span className="line-clamp-2">
                    {caso.titulo} — {caso.cliente}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-trilha -mt-2 flex shrink-0 flex-col rounded-br-[8px] pt-4">
            <div className="flex h-8 flex-col justify-center pr-2 pb-1.5 pl-2">
              <p className="truncate text-[10.5px] leading-tight font-semibold">Ana Souza</p>
              <p className="text-tinta-suave truncate text-[9px] leading-tight">Básico</p>
            </div>
          </div>
        </div>
      ) : null}

      {menuConta ? (
        <div
          className={cn(
            "border-borda bg-campo animate-in fade-in zoom-in-95 absolute z-30 flex flex-col gap-0.5 rounded-[9px] border p-1 shadow-lg duration-200",
            expandida ? "right-1.5 bottom-[52px] left-1.5" : "bottom-2 left-[calc(100%+6px)] w-[150px]",
          )}
        >
          <span className="flex h-7 items-center justify-between rounded-[7px] px-1.5 text-[10.5px] font-medium">
            Tema
            <IconeLua />
          </span>
          <span
            data-alvo="menu-configuracoes"
            className="data-sobre:bg-destaque-suave flex h-7 items-center gap-1.5 rounded-[7px] px-1.5 text-[10.5px] font-medium transition-colors [&>span]:scale-90"
          >
            <IconeConfiguracoes />
            Configurações
          </span>
          <span className="flex h-7 items-center gap-1.5 rounded-[7px] px-1.5 text-[10.5px] font-medium [&_svg]:size-4">
            <IconeSair />
            Sair
          </span>
        </div>
      ) : null}
    </aside>
  );
}

/** Mesmo desenho do botão de tema do menu da conta. */
export function IconeLua() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-3.5">
      <path
        d="M11.2 3.4a6.6 6.6 0 1 0 5.4 5.4A5.1 5.1 0 0 1 11.2 3.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
