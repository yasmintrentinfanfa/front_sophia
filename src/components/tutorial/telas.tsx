"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileAudio,
  FileText,
  FolderOpen,
  LoaderCircle,
  Mic,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { IconeArea } from "@/components/casos/icone-area";
import { IconeLixeira, IconeRepositorio } from "@/components/casos/icones-trilha";
import { IconeFase } from "@/components/pecas/icone-fase";
import { Dica, IconeLua, Tela, useMovimentoReduzido, type CasoMini } from "@/components/tutorial/palco";
import { AREAS_JURIDICAS, areaPorId } from "@/lib/casos/areas-juridicas";
import { formatarDuracao } from "@/lib/formato";
import { cn } from "@/lib/utils";

/*
 * Miniaturas das telas reais, com os mesmos textos, botões e posições. Cada elemento que
 * o cursor visita tem `data-alvo`; os estilos `data-sobre:` fazem o papel do :hover.
 */

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const HOJE = dataCurta.format(new Date());
const ONTEM = dataCurta.format(new Date(Date.now() - 86_400_000));
/** Data de um caso parado há alguns dias, como a lista real mostra. */
export const DATA_RECENTE = dataCurta.format(new Date(Date.now() - 4 * 86_400_000));

// ------------------------------------------------------------------- peças comuns

export function Botao({
  alvo,
  variante = "acao",
  desativado = false,
  className,
  children,
}: {
  alvo?: string;
  variante?: "acao" | "contorno";
  desativado?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      data-alvo={alvo}
      className={cn(
        "flex h-7 shrink-0 items-center justify-center gap-1 rounded-[7px] px-2.5 text-[10px] font-semibold whitespace-nowrap transition-[background-color,border-color,opacity,filter] duration-300 [&_svg]:size-3",
        variante === "acao" ? "bg-acao text-acao-tinta data-sobre:brightness-110" : "bg-campo border-borda data-sobre:border-destaque/60 border",
        desativado && "opacity-40",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Voltar() {
  return (
    <span className="text-tinta-suave flex size-5 shrink-0 items-center justify-center">
      <ArrowLeft className="size-3.5" />
    </span>
  );
}

function Cabecalho({
  titulo,
  subtitulo,
  voltar = true,
  acoes,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  voltar?: boolean;
  acoes?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 px-4 pt-3.5 pb-2">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-1">
          {voltar ? <Voltar /> : null}
          <h1 className="truncate text-[15px] leading-none font-bold">{titulo}</h1>
        </div>
        {subtitulo ? <p className="truncate text-[10px]">{subtitulo}</p> : null}
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-1.5">{acoes}</div> : null}
    </header>
  );
}

function Quadrado({
  children,
  forte = false,
  pequeno = false,
}: {
  children: ReactNode;
  forte?: boolean;
  pequeno?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[7px] transition-colors duration-300",
        pequeno ? "size-6 [&_svg]:size-3" : "size-7 [&_svg]:size-3.5",
        forte ? "bg-destaque text-white" : "bg-destaque-suave text-destaque",
      )}
    >
      {children}
    </span>
  );
}

// ------------------------------------------------------------------- texto digitado

export type FaseTexto = "vazio" | "digitando" | "pronto";

function Caret() {
  return <span className="animate-caret-blink bg-tinta ml-px inline-block h-[1.1em] w-px align-[-0.2em]" />;
}

/** Letras digitadas até agora; cada digitação monta de novo e começa do zero. */
function useDigitacao(texto: string, velocidade: number) {
  const reduzido = useMovimentoReduzido();
  const [letras, setLetras] = useState(0);
  useEffect(() => {
    if (reduzido) return;
    const id = window.setInterval(() => setLetras((atual) => Math.min(atual + 1, texto.length)), velocidade);
    return () => window.clearInterval(id);
  }, [texto, velocidade, reduzido]);
  return reduzido ? texto.length : letras;
}

function Digitando({ texto, velocidade }: { texto: string; velocidade: number }) {
  const letras = useDigitacao(texto, velocidade);
  return (
    <>
      {texto.slice(0, letras)}
      <Caret />
    </>
  );
}

/** Texto que some, aparece letra a letra ou já está inteiro. */
export function TextoDigitado({ texto, fase, velocidade = 40 }: { texto: string; fase: FaseTexto; velocidade?: number }) {
  if (fase === "vazio") return null;
  if (fase === "pronto") return <>{texto}</>;
  return <Digitando texto={texto} velocidade={velocidade} />;
}

// ------------------------------------------------------------------- casos em análise

export interface ItemListaMini {
  caso: CasoMini;
  status: string;
  data: string;
  /** "saindo" desliza para fora; "saiu" fecha o espaço do cartão. */
  estado?: "saindo" | "saiu";
}

function AcaoCaso({ alvo, rotulo, children }: { alvo: string; rotulo: string; children: ReactNode }) {
  return (
    <span
      data-alvo={alvo}
      className="group data-sobre:bg-tinta/5 relative flex size-6 items-center justify-center rounded-[6px] transition-colors [&_span]:scale-90 [&_svg]:size-4"
    >
      {children}
      <Dica texto={rotulo} lado="baixo" />
    </span>
  );
}

export function TelaCasos({ itens, realceArquivados = false }: { itens: ItemListaMini[]; realceArquivados?: boolean }) {
  return (
    <Tela>
      <header className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3.5 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[15px] leading-none font-bold">Casos em análise</h1>
          <p className="truncate text-[10px]">Gerencie seus casos e acompanhe o progresso</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "text-tinta-suave flex h-7 items-center rounded-[7px] px-1.5 text-[10px] font-semibold transition-colors duration-500",
              realceArquivados && "bg-destaque-suave text-destaque",
            )}
          >
            Arquivados
          </span>
          <Botao alvo="novo-caso" className="w-[78px]">
            Novo caso
          </Botao>
        </div>
      </header>
      <ul className="flex flex-col px-4 pt-1">
        {itens.map(({ caso, status, data, estado }) => (
          <li
            key={caso.id}
            className={cn(
              "grid transition-[grid-template-rows,margin,opacity,translate] duration-500 ease-out",
              estado === "saiu" ? "mb-0 grid-rows-[0fr] opacity-0" : "mb-1.5 grid-rows-[1fr]",
              estado && "translate-x-8 opacity-0",
            )}
          >
            <div className={cn("min-h-0", estado === "saiu" && "overflow-hidden")}>
              <div className="bg-superficie border-borda flex h-[50px] items-center gap-2 rounded-[9px] border px-3">
                <span data-alvo={`caso-${caso.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex min-w-0 items-center gap-1 text-[11px] font-semibold">
                    <IconeArea area={caso.area} className="size-3" />
                    <span className="truncate">{caso.titulo}</span>
                  </span>
                  <span className="text-tinta-suave truncate text-[9.5px]">Cliente: {caso.cliente}</span>
                </span>
                <span className="text-meta flex shrink-0 flex-col items-end gap-0.5 text-[9px]">
                  <span className="font-medium">{status}</span>
                  <span>{data}</span>
                </span>
                <span className="flex shrink-0 gap-0.5">
                  <AcaoCaso alvo={`arquivar-${caso.id}`} rotulo="Arquivar">
                    <IconeRepositorio />
                  </AcaoCaso>
                  <AcaoCaso alvo={`excluir-${caso.id}`} rotulo="Excluir">
                    <IconeLixeira />
                  </AcaoCaso>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Tela>
  );
}

// ------------------------------------------------------------------- criar novo caso

/** As primeiras áreas da lista real, na mesma ordem. */
const AREAS_DA_LISTA = AREAS_JURIDICAS.slice(0, 4);

function CampoFormulario({
  alvo,
  rotulo,
  focado,
  vazio,
  placeholder,
  children,
}: {
  alvo: string;
  rotulo: string;
  focado: boolean;
  vazio: boolean;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[270px] flex-col gap-1">
      <span className="text-[9.5px] font-medium">{rotulo}</span>
      <span
        data-alvo={alvo}
        className={cn(
          "bg-campo flex h-8 items-center justify-between gap-2 rounded-[7px] border px-2.5 text-[10.5px] transition-[border-color,box-shadow] duration-200",
          focado ? "border-destaque ring-destaque/20 ring-2" : "border-borda",
        )}
      >
        <span className="min-w-0 truncate">{vazio ? <span className="text-destaque text-[9px]">{placeholder}</span> : children}</span>
      </span>
    </div>
  );
}

export function TelaNovoCaso({
  nome = "vazio",
  cliente = "vazio",
  area = null,
  foco = null,
  listaAberta = false,
}: {
  nome?: FaseTexto;
  cliente?: FaseTexto;
  area?: string | null;
  foco?: "nome" | "cliente" | "area" | null;
  listaAberta?: boolean;
}) {
  return (
    <Tela>
      <header className="flex shrink-0 flex-col gap-1 px-4 pt-3.5 pb-1">
        <h1 className="text-[15px] leading-none font-bold">Criar novo caso</h1>
        <p className="text-tinta-suave text-[10px]">Vincule um cliente e inicie a análise</p>
      </header>
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        <CampoFormulario alvo="campo-nome" rotulo="Nome do caso" focado={foco === "nome"} vazio={nome === "vazio"} placeholder="Ex: Rescisão contratual">
          <TextoDigitado texto="Rescisão indireta" fase={nome} />
        </CampoFormulario>
        <CampoFormulario alvo="campo-cliente" rotulo="Cliente" focado={foco === "cliente"} vazio={cliente === "vazio"} placeholder="Nome do cliente">
          <TextoDigitado texto="Carlos Nunes" fase={cliente} />
        </CampoFormulario>
        <div className="relative flex w-full max-w-[270px] flex-col gap-1">
          <span className="text-[9.5px] font-medium">Área jurídica</span>
          <span
            data-alvo="campo-area"
            className={cn(
              "bg-campo flex h-8 items-center justify-between gap-2 rounded-[7px] border px-2.5 text-[10.5px] transition-[border-color,box-shadow] duration-200",
              foco === "area" || listaAberta ? "border-destaque ring-destaque/20 ring-2" : "border-borda",
            )}
          >
            {area ? (
              <span className="animate-in fade-in duration-300">{areaPorId(area)?.nome}</span>
            ) : (
              <span className="text-destaque text-[9px]">Selecione a área jurídica</span>
            )}
            <ChevronDown className={cn("text-tinta-suave size-3.5 transition-transform duration-200", listaAberta && "rotate-180")} />
          </span>
          {listaAberta ? (
            <div className="border-borda bg-campo animate-in fade-in slide-in-from-top-1 absolute top-full z-20 mt-1 flex w-full flex-col rounded-[7px] border py-1 shadow-lg duration-200">
              {AREAS_DA_LISTA.map((item) => (
                <span
                  key={item.id}
                  data-alvo={`area-${item.id}`}
                  className={cn(
                    "data-sobre:bg-destaque-suave flex flex-col gap-0.5 px-2.5 py-1.5 text-[10px] transition-colors",
                    item.id === area && "bg-destaque-suave font-semibold",
                  )}
                >
                  <span>{item.nome}</span>
                  <span className="text-tinta-suave line-clamp-1 text-[8px] font-normal">{item.descricao}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex gap-2 pt-1">
          <Botao variante="contorno" className="w-[74px] font-medium">
            Cancelar
          </Botao>
          <Botao alvo="criar-caso" className="w-[82px]">
            Criar caso
          </Botao>
        </div>
      </div>
    </Tela>
  );
}

// ------------------------------------------------------------------- repositório do caso

export type ModoMini = "ao_vivo" | "arquivo" | "texto";

const MODOS_MINI: { valor: ModoMini; titulo: string; descricao: string; Icone: typeof Mic }[] = [
  { valor: "ao_vivo", titulo: "Gravar ao vivo", descricao: "Grave a conversa com o cliente; a transcrição é feita ao finalizar.", Icone: Mic },
  { valor: "arquivo", titulo: "Enviar áudio ou documento", descricao: "Envie um áudio ou um documento em PDF, Word (DOCX) ou TXT.", Icone: FileAudio },
  { valor: "texto", titulo: "Escrever o relato", descricao: "Digite ou cole o relato do cliente, sem gravação.", Icone: PenLine },
];

/**
 * Conteúdo que rola sozinho quando passa da tela, como a página real quando um painel
 * cresce: o cabeçalho fica parado e o resto sobe só o necessário.
 */
function Rolavel({ children, className }: { children: ReactNode; className?: string }) {
  const fora = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const [rolagem, setRolagem] = useState(0);

  useLayoutEffect(() => {
    const externo = fora.current;
    const interno = dentro.current;
    if (!externo || !interno) return;
    const observador = new ResizeObserver(() => {
      const excesso = interno.offsetHeight - externo.clientHeight;
      setRolagem(excesso > 0 ? excesso + 10 : 0);
    });
    observador.observe(externo);
    observador.observe(interno);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={fora} className="min-h-0 flex-1 overflow-hidden">
      <div
        ref={dentro}
        className={cn("transition-transform duration-500 ease-out", className)}
        style={{ transform: `translateY(-${rolagem}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

export function TelaRepositorio({
  caso,
  modo,
  resumo,
  children,
}: {
  caso: CasoMini;
  modo: ModoMini;
  /** Contagem do atalho "Transcrições e documentos". */
  resumo: string;
  /** Painel do modo escolhido. */
  children: ReactNode;
}) {
  return (
    <Tela>
      <Cabecalho titulo="Repositório do caso" subtitulo={caso.titulo} />
      <Rolavel className="flex flex-col gap-2 px-4 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <section className="bg-campo border-borda flex items-center gap-2 rounded-[9px] border px-2.5 py-1.5">
            <Quadrado pequeno>
              <ShieldCheck />
            </Quadrado>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] font-semibold">Consentimento do cliente</span>
              <span className="text-tinta-suave line-clamp-2 text-[8px] leading-snug">
                O cliente foi informado e autorizou a gravação e o processamento dos dados para fins jurídicos.
              </span>
            </span>
          </section>
          <span
            data-alvo="card-materiais"
            className="group bg-campo border-borda data-sobre:border-destaque/60 flex items-center gap-2 rounded-[9px] border px-2.5 py-1.5 transition-colors duration-300"
          >
            <Quadrado pequeno>
              <FolderOpen />
            </Quadrado>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[10px] font-semibold">Transcrições e documentos</span>
              <span className="text-tinta-suave truncate text-[8.5px]">{resumo}</span>
            </span>
            <ChevronRight className="text-tinta-suave group-data-sobre:text-destaque size-3.5 shrink-0 transition-transform duration-300 group-data-sobre:translate-x-0.5" />
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <h2 className="text-[12px] font-semibold">O que você quer adicionar ao caso?</h2>
          <p className="text-tinta-suave truncate text-[8.5px]">
            Cada gravação, arquivo ou relato novo entra no repositório sem apagar o que já estava lá.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MODOS_MINI.map(({ valor, titulo, descricao, Icone }) => {
            const selecionado = valor === modo;
            return (
              <span
                key={valor}
                data-alvo={`modo-${valor}`}
                className={cn(
                  "bg-campo flex flex-col gap-1 rounded-[10px] border p-2 transition-[border-color,box-shadow] duration-300",
                  selecionado ? "border-destaque ring-destaque/20 ring-4" : "border-borda data-sobre:border-destaque/60",
                )}
              >
                <span className="flex items-center justify-between">
                  <Quadrado forte={selecionado} pequeno>
                    <Icone />
                  </Quadrado>
                  <span
                    className={cn(
                      "size-3 rounded-full border transition-[border-width,border-color] duration-300",
                      selecionado ? "border-destaque border-[4px]" : "border-borda",
                    )}
                  />
                </span>
                <span className="text-[10px] leading-tight font-bold">{titulo}</span>
                <span className="text-tinta-suave line-clamp-2 text-[8px] leading-snug">{descricao}</span>
              </span>
            );
          })}
        </div>

        <section key={modo} className="bg-campo border-borda animate-in fade-in relative flex shrink-0 flex-col gap-1.5 rounded-[10px] border p-2.5 duration-300">
          {children}
        </section>
      </Rolavel>
    </Tela>
  );
}

export function PainelGravacao() {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[11px] font-semibold">Gravação ao vivo</h3>
        <p className="text-tinta-suave line-clamp-2 text-[8.5px] leading-relaxed">
          O áudio fica no seu navegador durante a conversa e só é enviado quando você finalizar. Você pode pausar e
          retomar quando precisar.
        </p>
      </div>
      <Botao alvo="iniciar-gravacao" className="w-fit">
        <Mic />
        Iniciar gravação
      </Botao>
    </>
  );
}

export function PainelArquivo({ anexado, arrastando }: { anexado: boolean; arrastando: boolean }) {
  return (
    <>
      <span data-alvo="origem-arquivo" className="absolute top-3 right-10 size-1" />
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[11px] font-semibold">Áudio ou documentos</h3>
        <p className="text-tinta-suave truncate text-[8.5px]">
          O áudio é transcrito e revisado. Documentos (PDF, DOCX e TXT) são lidos e somados ao caso.
        </p>
      </div>
      {anexado ? (
        <span className="bg-superficie border-borda animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-[9px] border px-2.5 py-1 duration-300">
          <Quadrado pequeno>
            <FileText />
          </Quadrado>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[10px] font-semibold">contrato-de-trabalho.pdf</span>
            <span className="text-tinta-suave text-[8.5px]">240 KB</span>
          </span>
          <X className="text-tinta-suave size-3" />
        </span>
      ) : null}
      <span
        data-alvo="soltar"
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-[9px] border border-dashed px-3 text-center transition-colors duration-200",
          anexado ? "py-1" : "py-2.5",
          arrastando ? "data-sobre:border-destaque data-sobre:bg-destaque-suave border-borda" : "border-borda",
        )}
      >
        <span className="text-[9.5px] font-semibold">
          {anexado ? "Arraste mais arquivos aqui ou clique para adicionar" : "Arraste os arquivos aqui ou clique para escolher"}
        </span>
        <span className="text-tinta-suave text-[8px]">Áudio (um por vez), ou até 10 documentos PDF, DOCX ou TXT por caso</span>
      </span>
      <Botao alvo="anexar" desativado={!anexado} className="w-fit">
        Anexar documento
      </Botao>
    </>
  );
}

const RELATO =
  "O cliente trabalha há quatro anos na empresa. Desde março o salário atrasa e o FGTS não é depositado. Ele recebe R$ 400 por Pix, fora do holerite.";

function CorpoRelato({ letras, digitando }: { letras: number; digitando: boolean }) {
  const pronto = letras >= 50;
  return (
    <>
      <span
        data-alvo="relato"
        className={cn(
          "bg-campo flex h-[46px] items-start overflow-hidden rounded-[7px] border px-2.5 py-1.5 text-[9.5px] leading-relaxed transition-[border-color,box-shadow] duration-200",
          digitando ? "border-destaque ring-destaque/20 ring-2" : "border-borda",
        )}
      >
        {letras ? (
          <span>
            {RELATO.slice(0, letras)}
            {digitando ? <Caret /> : null}
          </span>
        ) : (
          <span className="text-tinta-suave line-clamp-2">
            Ex.: O cliente assinou um contrato de prestação de serviços em janeiro. A empresa atrasou três pagamentos…
          </span>
        )}
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className={cn("text-[9px] transition-colors", pronto ? "text-destaque" : "text-tinta-suave")}>
          {pronto ? `${letras} caracteres` : `Escreva pelo menos 50 caracteres (${letras}/50).`}
        </span>
        <Botao alvo="gerar-analise" desativado={!pronto}>
          Gerar análise
        </Botao>
      </span>
    </>
  );
}

function RelatoDigitando() {
  const letras = useDigitacao(RELATO, 24);
  return <CorpoRelato letras={letras} digitando={letras < RELATO.length} />;
}

export function PainelTexto({ fase }: { fase: FaseTexto }) {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[11px] font-semibold">Relato do cliente</h3>
        <p className="text-tinta-suave truncate text-[8.5px]">
          Conte os fatos como o cliente narrou: datas, valores, documentos e o que ele espera.
        </p>
      </div>
      {fase === "digitando" ? (
        <RelatoDigitando />
      ) : (
        <CorpoRelato letras={fase === "pronto" ? RELATO.length : 0} digitando={false} />
      )}
    </>
  );
}

// ------------------------------------------------------------------- sessão ativa

export type EstadoGravacaoMini = "gravando" | "pausada" | "encerrada";

const ROTULO_GRAVACAO: Record<EstadoGravacaoMini, string> = {
  gravando: "Gravando",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

/** Cronômetro da gravação: conta enquanto grava e para na pausa. */
function Cronometro({ correndo }: { correndo: boolean }) {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (!correndo) return;
    const id = window.setInterval(() => setSegundos((atual) => atual + 1), 1000);
    return () => window.clearInterval(id);
  }, [correndo]);
  return <>{formatarDuracao(segundos)}</>;
}

const ETAPAS_MINI = ["Transcrevendo o áudio", "Revisando o texto", "Salvando no caso", "Gerando a análise preliminar"];

/** Mesmas etapas de `ProgressoProcessamento`, avançando sozinhas. */
function ProgressoMini() {
  const reduzido = useMovimentoReduzido();
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    if (reduzido) return;
    const id = window.setInterval(() => setAtual((indice) => Math.min(indice + 1, ETAPAS_MINI.length - 1)), 680);
    return () => window.clearInterval(id);
  }, [reduzido]);
  const indiceAtual = reduzido ? 2 : atual;
  return (
    <div className="flex flex-col gap-2.5">
      <ol className="flex flex-col gap-2">
        {ETAPAS_MINI.map((rotulo, indice) => {
          const concluida = indice < indiceAtual;
          const andamento = indice === indiceAtual;
          return (
            <li key={rotulo} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                  concluida && "bg-destaque border-destaque text-white",
                  andamento && "border-destaque",
                  !concluida && !andamento && "border-borda",
                )}
              >
                {concluida ? <Check className="animate-in zoom-in-50 size-2.5 duration-200" strokeWidth={3} /> : null}
                {andamento ? <span className="border-destaque size-2.5 animate-spin rounded-full border-2 border-r-transparent" /> : null}
              </span>
              <span className={cn("text-[10.5px]", andamento ? "font-semibold" : concluida ? "text-tinta" : "text-tinta-suave")}>
                {rotulo}
                {andamento ? "…" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-tinta-suave text-[9px]">A primeira transcrição pode levar alguns minutos. Mantenha esta tela aberta.</p>
    </div>
  );
}

export function TelaSessao({
  caso,
  estado,
  corpo,
}: {
  caso: CasoMini;
  estado: EstadoGravacaoMini;
  corpo: "aguardando" | "processando" | "pronto";
}) {
  const encerrada = estado === "encerrada";
  return (
    <Tela>
      <header className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2">
        <Voltar />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-[14px] leading-none font-bold">Sessão ativa</h1>
          <p className="text-tinta-suave truncate text-[9.5px]">{caso.titulo}</p>
        </div>
        <Botao alvo="pausar" variante="contorno" desativado={encerrada} className="w-[58px]">
          {estado === "pausada" ? "Retomar" : "Pausar"}
        </Botao>
        <Botao alvo="finalizar" desativado={encerrada}>
          Finalizar
        </Botao>
        <span className="border-borda flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[9.5px] font-medium">
          <span className="relative flex size-2">
            {estado === "gravando" ? <span className="bg-gravando absolute inset-0 animate-ping rounded-full opacity-60" /> : null}
            <span className={cn("relative size-2 rounded-full", estado === "gravando" ? "bg-gravando" : "bg-tinta-suave")} />
          </span>
          {ROTULO_GRAVACAO[estado]}
          <span className="tabular-nums">
            <Cronometro correndo={estado === "gravando"} />
          </span>
        </span>
      </header>
      <div className="flex min-h-0 flex-1 px-4 pt-1 pb-4">
        <section className="bg-campo border-borda flex min-h-0 w-full flex-1 flex-col gap-2 rounded-[10px] border p-3.5">
          <h2 className="text-[11px] font-semibold">Transcrição da conversa</h2>
          {corpo === "processando" ? (
            <ProgressoMini />
          ) : corpo === "pronto" ? (
            <div className="animate-in fade-in flex flex-col gap-2 duration-500">
              <p className="text-[10px] leading-relaxed">
                Trabalho na empresa há quatro anos. Desde março o salário atrasa e o FGTS não é depositado. Recebo R$ 400
                por Pix, fora do holerite, e quero saber se posso sair e receber tudo.
              </p>
              <p className="text-tinta-suave text-[9px]">Transcrição revisada.</p>
              <Botao alvo="ver-analise" className="w-fit">
                Ver análise
              </Botao>
            </div>
          ) : (
            <p className="text-tinta-suave text-[10px] leading-relaxed">
              A transcrição aparece aqui assim que o Whisper terminar. Grave a entrevista inteira: o áudio só é enviado ao
              finalizar.
            </p>
          )}
        </section>
      </div>
    </Tela>
  );
}

export function ConfirmarAnalise() {
  return (
    <>
      <p className="text-[12.5px] font-semibold">Gerar análise de IA</p>
      <p className="text-tinta-suave mt-1 text-[10px] leading-snug">
        Finalizar a gravação, transcrever e gerar a análise preliminar deste caso?
      </p>
      <div className="mt-3 flex justify-end gap-1.5">
        <Botao variante="contorno">Cancelar</Botao>
        <Botao alvo="confirmar-analise">Gerar análise</Botao>
      </div>
    </>
  );
}

// ------------------------------------------------------------------- análise preliminar

interface CartaoMini {
  titulo: string;
  detalhe: string;
  selo?: string;
}

/** Mesmas cinco colunas e na mesma ordem de `ColunasAnalise`. */
export const COLUNAS_TUTORIAL: { titulo: string; significado: string; cartoes: CartaoMini[] }[] = [
  {
    titulo: "Teses jurídicas aplicáveis",
    significado: "Argumentos que sustentam o pedido",
    cartoes: [
      { titulo: "Rescisão indireta por falta grave", detalhe: "Salário atrasado e FGTS sem depósito (CLT, art. 483, d)." },
      { titulo: "Salário pago por fora", detalhe: "O Pix fora do holerite integra a remuneração." },
    ],
  },
  {
    titulo: "Temas do STF/STJ",
    significado: "Precedentes das cortes superiores",
    cartoes: [{ titulo: "Tema 608 do STF", detalhe: "Prazo de 5 anos para cobrar o FGTS não depositado." }],
  },
  {
    titulo: "Jurisprudência",
    significado: "Decisões parecidas e se o entendimento é majoritário",
    cartoes: [
      { titulo: "Atraso salarial reiterado", detalhe: "Justifica a rescisão indireta.", selo: "Majoritária" },
      { titulo: "FGTS não depositado", detalhe: "Falta grave do empregador.", selo: "Majoritária" },
    ],
  },
  {
    titulo: "Perguntas sugeridas",
    significado: "O que confirmar com o cliente",
    cartoes: [
      { titulo: "Desde quando o salário atrasa?", detalhe: "Confirme os meses e os valores." },
      { titulo: "Há comprovantes dos Pix?", detalhe: "Extratos e conversas com a empresa." },
    ],
  },
  {
    titulo: "Necessidades adicionais",
    significado: "Documentos, perícias e chance de acordo",
    cartoes: [
      { titulo: "Extrato do FGTS", detalhe: "Comprova os depósitos em atraso." },
      { titulo: "Chance de acordo", detalhe: "Média: o cliente tem pressa." },
    ],
  },
];

export function TelaAnalise({
  caso,
  realce = null,
  legenda = false,
}: {
  caso: CasoMini;
  /** Coluna em destaque. */
  realce?: number | null;
  /** Mostra o significado da coluna em destaque, como legenda. */
  legenda?: boolean;
}) {
  const coluna = realce === null ? null : COLUNAS_TUTORIAL[realce];
  return (
    <Tela>
      <Cabecalho
        titulo="Análise preliminar de caso"
        acoes={
          <>
            <Botao alvo="botao-pecas" variante="contorno" className="font-medium">
              Peças processuais
            </Botao>
            <Botao alvo="botao-chat">Chat com IA</Botao>
          </>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 pt-1">
        <section className="border-borda bg-campo animate-in fade-in flex flex-col gap-1.5 rounded-[9px] border px-3 py-2 duration-500">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-semibold">Análise do caso</span>
            <span className="bg-destaque-suave text-destaque inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-[8.5px] font-semibold">
              {areaPorId(caso.area)?.nome}
              <PenLine className="size-2.5" />
            </span>
          </span>
          <span className="text-tinta-suave line-clamp-2 text-[8.5px] leading-snug">
            {caso.cliente.split(" ")[0]} relata salário atrasado desde março e FGTS sem depósito. Há base para pedir a
            rescisão indireta, com as verbas de uma dispensa sem justa causa.
          </span>
        </section>
        <div className="grid grid-cols-5 items-start gap-1.5">
          {COLUNAS_TUTORIAL.map((item, indiceColuna) => {
            const acesa = indiceColuna === realce;
            return (
              <section key={item.titulo} className="flex min-w-0 flex-col gap-1.5">
                <h2
                  className={cn(
                    "line-clamp-2 min-h-[22px] text-[8.5px] leading-[11px] font-semibold transition-colors duration-300",
                    acesa && "text-destaque",
                  )}
                >
                  {item.titulo} ({item.cartoes.length})
                </h2>
                {item.cartoes.map((cartao, indiceCartao) => (
                  <span
                    key={cartao.titulo}
                    data-alvo={`card-${indiceColuna}-${indiceCartao}`}
                    style={{ animationDelay: `${180 + indiceColuna * 90 + indiceCartao * 160}ms` }}
                    className={cn(
                      "bg-campo animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-col gap-1 rounded-[7px] border p-1.5 transition-[border-color,box-shadow] duration-500",
                      acesa ? "border-destaque ring-destaque/20 ring-2" : "border-borda data-sobre:border-destaque/60",
                    )}
                  >
                    <span className="text-tinta-suave line-clamp-2 text-[8px] leading-[10px] font-semibold">{cartao.titulo}</span>
                    {cartao.selo ? (
                      <span className="bg-destaque-suave border-destaque text-meta w-fit rounded-[3px] border px-1 text-[6.5px] leading-[10px] font-medium">
                        {cartao.selo}
                      </span>
                    ) : null}
                    <span className="text-tinta-suave line-clamp-3 text-[7.5px] leading-[9.5px]">{cartao.detalhe}</span>
                  </span>
                ))}
              </section>
            );
          })}
        </div>
      </div>
      {legenda && coluna ? (
        <p
          key={coluna.titulo}
          className="bg-tinta text-fundo animate-in fade-in slide-in-from-bottom-1 absolute bottom-3 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full px-3 py-1.5 text-[10px] shadow-lg duration-300"
        >
          <span className="font-semibold">{coluna.titulo}:</span> {coluna.significado.toLowerCase()}
        </p>
      ) : null}
    </Tela>
  );
}

export function DetalheCartao() {
  return (
    <>
      <p className="text-[12.5px] font-semibold">Rescisão indireta por falta grave</p>
      <p className="text-tinta-suave mt-1.5 text-[10px] leading-relaxed">
        O atraso reiterado do salário e a falta de depósito do FGTS são descumprimento das obrigações do contrato.
      </p>
      <p className="text-destaque mt-2 text-[10px] underline">CLT, art. 483 — planalto.gov.br</p>
      <span data-alvo="continuar-chat" className="text-destaque mt-2.5 inline-block w-fit text-[10.5px] underline">
        Continuar no chat
      </span>
      <div className="mt-2 flex justify-end">
        <Botao variante="contorno">Fechar</Botao>
      </div>
    </>
  );
}

// ------------------------------------------------------------------- chat com IA

export const ASSUNTOS_CHAT = [
  "Quais são os pontos fortes deste caso?",
  "Que documentos ainda faltam?",
  "Quais riscos devo considerar?",
];

export interface MensagemMini {
  papel: "advogado" | "assistente";
  conteudo: ReactNode;
}

export function TelaChat({
  caso,
  mensagens,
  pergunta,
  assunto = null,
  pensando = false,
  podeAtualizar = false,
  atualizacao = "nenhuma",
}: {
  caso: CasoMini;
  mensagens: MensagemMini[];
  pergunta: ReactNode;
  /** Sugestão escolhida. */
  assunto?: number | null;
  pensando?: boolean;
  podeAtualizar?: boolean;
  atualizacao?: "nenhuma" | "atualizando" | "pronta";
}) {
  const atualizando = atualizacao === "atualizando";
  return (
    <Tela>
      <header className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3.5 pb-1.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1">
            <Voltar />
            <h1 className="text-[15px] leading-none font-bold">Chat com IA</h1>
          </div>
          <p className="text-tinta-suave truncate text-[10px]">Tire dúvidas sobre o caso {caso.titulo}</p>
        </div>
        <Botao alvo="atualizar" variante="contorno" desativado={!podeAtualizar} className="font-medium">
          <RefreshCw className={cn(atualizando && "animate-spin")} />
          {atualizando ? "Atualizando análise…" : "Atualizar análise com a conversa"}
        </Botao>
      </header>
      {atualizacao !== "nenhuma" ? (
        <p
          key={atualizacao}
          className="bg-destaque-suave border-destaque/40 animate-in fade-in slide-in-from-top-1 mx-4 mb-1 rounded-[9px] border px-3 py-1.5 text-[9px] leading-snug duration-300"
        >
          {atualizando ? (
            "A IA está refazendo a análise com o relato, os documentos e o que você contou aqui."
          ) : (
            <>
              Análise atualizada para a versão 2 com o que você contou no chat.{" "}
              <span data-alvo="ver-cards" className="text-destaque font-semibold underline">
                Ver cards atualizados
              </span>
            </>
          )}
        </p>
      ) : null}
      <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pt-1 pb-1.5">
        {ASSUNTOS_CHAT.map((item, indice) => (
          <span
            key={item}
            data-alvo={`assunto-${indice}`}
            className={cn(
              "bg-campo flex h-6 items-center rounded-[7px] border px-2 text-[9px] font-medium transition-colors duration-300",
              assunto === indice ? "border-destaque text-destaque" : "border-borda data-sobre:border-destaque/60",
            )}
          >
            {item}
          </span>
        ))}
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-4 pt-1",
          mensagens.length ? "justify-end" : "justify-start",
        )}
      >
        {mensagens.length === 0 ? (
          <p className="text-tinta-suave text-[10px]">Nenhuma mensagem ainda. Pergunte algo sobre este caso.</p>
        ) : null}
        {mensagens.map((mensagem, indice) => (
          <p
            key={indice}
            className={cn(
              "bg-campo animate-in fade-in slide-in-from-bottom-2 shrink-0 rounded-[9px] px-3 py-2 text-[9.5px] leading-relaxed duration-400",
              mensagem.papel === "assistente" && "border-borda border",
            )}
          >
            {mensagem.conteudo}
          </p>
        ))}
        {pensando ? (
          <p className="text-tinta-suave animate-in fade-in shrink-0 text-[9px] duration-300">
            A Sophia está analisando o caso para responder…
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 px-4 pt-2 pb-3.5">
        <span
          data-alvo="campo-pergunta"
          className="bg-campo border-borda flex h-7 min-w-0 flex-1 items-center truncate rounded-[7px] border px-2.5 text-[9.5px]"
        >
          {pergunta ?? <span className="text-tinta-suave">Pergunte algo sobre o caso...</span>}
        </span>
        <Botao alvo="enviar" className="w-[56px]">
          Enviar
        </Botao>
      </div>
    </Tela>
  );
}

// ------------------------------------------------------------------- peças processuais

const GRUPOS_FILTRO = ["Todos", "Cível e processo civil", "Família e sucessões", "Trabalhista", "Penal", "Previdenciário"];

const MODELOS_TRABALHISTAS = [
  {
    id: "reclamacao",
    nome: "Reclamação trabalhista",
    descricao: "Ação do trabalhador com os pedidos decorrentes do contrato de trabalho.",
    fase: "inicial",
    rotuloFase: "Petição inicial",
  },
  {
    id: "contestacao",
    nome: "Contestação trabalhista",
    descricao: "Defesa da empresa na reclamação trabalhista.",
    fase: "defesa",
    rotuloFase: "Defesa",
    prazo: "Até a audiência",
  },
  {
    id: "recurso",
    nome: "Recurso ordinário trabalhista",
    descricao: "Recurso contra sentença da Vara do Trabalho.",
    fase: "recurso",
    rotuloFase: "Recurso",
    prazo: "8 dias",
  },
] as const;

export function TelaPecas({ caso }: { caso: CasoMini }) {
  return (
    <Tela>
      <Cabecalho
        titulo="Peças processuais"
        subtitulo={<span className="text-tinta-suave">Minutas geradas pela IA a partir da análise do caso {caso.titulo}</span>}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[12px] font-semibold">Escolha o modelo</h2>
          <p className="text-tinta-suave text-[8.5px]">49 modelos · os da área deste caso aparecem primeiro</p>
        </div>
        <span className="border-borda bg-campo text-tinta-suave flex h-7 w-full max-w-[230px] items-center gap-1.5 rounded-[7px] border px-2.5 text-[9px]">
          <Search className="size-3 shrink-0" />
          Buscar modelo (ex.: contestação, recurso)
        </span>
        <div className="flex gap-1.5 overflow-hidden">
          {GRUPOS_FILTRO.map((grupo, indice) => (
            <span
              key={grupo}
              className={cn(
                "bg-campo flex h-6 shrink-0 items-center rounded-[7px] border px-2 text-[9px] font-medium",
                indice === 0 ? "border-destaque text-destaque" : "border-borda",
              )}
            >
              {grupo}
            </span>
          ))}
        </div>
        <h3 className="flex items-center gap-1.5 pt-0.5 text-[10.5px] font-semibold">
          Trabalhista
          <span className="bg-destaque-suave text-destaque rounded-full px-1.5 py-0.5 text-[8px] font-semibold">
            Sugerido para este caso
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {MODELOS_TRABALHISTAS.map((modelo, indice) => (
            <span
              key={modelo.id}
              data-alvo={`modelo-${modelo.id}`}
              style={{ animationDelay: `${120 + indice * 90}ms` }}
              className="group bg-campo border-borda data-sobre:border-destaque/60 animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-col gap-1.5 rounded-[10px] border p-2.5 transition-colors duration-300"
            >
              <span className="flex items-center justify-between">
                <Quadrado>
                  <IconeFase fase={modelo.fase} />
                </Quadrado>
                <ChevronRight className="text-tinta-suave group-data-sobre:text-destaque size-3 transition-transform duration-300 group-data-sobre:translate-x-0.5" />
              </span>
              <span className="text-[10px] leading-tight font-bold">{modelo.nome}</span>
              <span className="text-tinta-suave line-clamp-2 text-[8px] leading-snug">{modelo.descricao}</span>
              <span className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="border-borda bg-chip rounded-full border px-1.5 text-[7.5px] leading-[13px] font-medium">
                  {modelo.rotuloFase}
                </span>
                {"prazo" in modelo ? (
                  <span className="text-tinta-suave flex items-center gap-0.5 text-[7.5px]">
                    <Clock className="size-2.5" />
                    {modelo.prazo}
                  </span>
                ) : null}
              </span>
            </span>
          ))}
        </div>
      </div>
    </Tela>
  );
}

const SECOES_RECLAMACAO = [
  "Endereçamento",
  "Qualificação das partes",
  "Do contrato de trabalho",
  "Dos fatos",
  "Dos direitos e de cada pedido",
  "Do pedido líquido de cada verba",
];

export function ModeloReclamacao({ orientacoes, gerando }: { orientacoes: ReactNode; gerando: boolean }) {
  return (
    <>
      <p className="text-[12.5px] font-semibold">Reclamação trabalhista</p>
      <p className="text-tinta-suave mt-0.5 text-[9px]">Trabalhista · Petição inicial</p>
      <div className="mt-2.5 flex items-start gap-2">
        <Quadrado>
          <IconeFase fase="inicial" />
        </Quadrado>
        <div className="flex flex-col gap-0.5">
          <p className="text-[9.5px] leading-snug">Ação do trabalhador com os pedidos decorrentes do contrato de trabalho.</p>
          <p className="text-tinta-suave text-[8.5px] leading-snug">
            <span className="font-semibold">Quando usar:</span> verbas não pagas, horas extras, rescisão irregular.
          </p>
        </div>
      </div>
      <span className="border-borda bg-chip mt-2 inline-block rounded-full border px-2 py-0.5 text-[8.5px]">CLT, art. 840</span>
      <div className="border-borda mt-2 rounded-[8px] border px-2.5 py-2">
        <p className="text-[9.5px] font-semibold">Estrutura da minuta</p>
        <ol className="text-tinta-suave mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px]">
          {SECOES_RECLAMACAO.map((secao, indice) => (
            <li key={secao} className="flex gap-1">
              <span className="text-destaque w-2.5 shrink-0 text-right font-semibold">{indice + 1}</span>
              <span className="truncate">{secao}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-2 text-[9.5px] font-semibold">
        Orientações para esta minuta <span className="text-tinta-suave font-normal">(opcional)</span>
      </p>
      <span
        data-alvo="orientacoes"
        className="border-borda bg-campo mt-1 flex h-[34px] items-start rounded-[7px] border px-2 py-1.5 text-[9px] leading-snug"
      >
        {orientacoes ?? (
          <span className="text-tinta-suave truncate">Ex.: incluir pedido de justiça gratuita; o juízo é a 2ª Vara.</span>
        )}
      </span>
      {gerando ? (
        <p className="text-tinta-suave animate-in fade-in mt-1.5 text-[8.5px] duration-300">
          A IA está redigindo a minuta com base na análise do caso. Isso pode levar até um minuto.
        </p>
      ) : null}
      <div className="mt-2.5 flex justify-end gap-1.5">
        <Botao variante="contorno" desativado={gerando}>
          Cancelar
        </Botao>
        <Botao alvo="gerar-minuta" desativado={gerando}>
          {gerando ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          {gerando ? "Gerando minuta…" : "Gerar minuta"}
        </Botao>
      </div>
    </>
  );
}

function Marcador({ children }: { children: ReactNode }) {
  return <mark className="bg-destaque-suave text-destaque rounded-[3px] px-0.5 font-medium">{children}</mark>;
}

export function TelaMinuta() {
  return (
    <Tela>
      <Cabecalho
        titulo="Peças processuais"
        subtitulo={<span className="text-tinta-suave">Minutas geradas pela IA a partir da análise do caso Rescisão indireta</span>}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-0.5">
        <span className="text-destaque flex items-center gap-1 text-[10px] font-semibold">
          <ArrowLeft className="size-3" />
          Voltar aos modelos
        </span>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[11.5px] font-semibold">Reclamação trabalhista</p>
            <p className="text-tinta-suave truncate text-[8.5px]">Gerada em {HOJE} às 14:05 · com base na análise versão 1</p>
          </div>
          <span className="flex shrink-0 gap-1.5">
            <Botao variante="contorno">
              <Copy />
              Copiar texto
            </Botao>
            <Botao alvo="baixar-docx">
              <Download />
              Baixar .docx
            </Botao>
          </span>
        </div>
        <p className="border-borda bg-chip text-tinta-suave flex items-start gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-[8.5px] leading-snug">
          <TriangleAlert className="mt-px size-3 shrink-0" />
          Minuta gerada por IA para revisão. Confira fatos, fundamentos e prazos antes de protocolar. Há 4 dados
          destacados para preencher.
        </p>
        <article className="bg-campo border-borda animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-1.5 rounded-[10px] border px-5 py-3 font-serif text-[8.5px] leading-[1.65] duration-500">
          <p className="font-bold">
            EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) DA <Marcador>[Nº]</Marcador> VARA DO TRABALHO DE <Marcador>[CIDADE]</Marcador>
          </p>
          <p className="indent-[2.5em] text-justify">
            CARLOS NUNES, <Marcador>[NACIONALIDADE]</Marcador>, vem, por seu advogado, propor a presente
          </p>
          <p className="text-center text-[9px] font-bold">RECLAMAÇÃO TRABALHISTA</p>
          <p className="indent-[2.5em] text-justify">
            em face de <Marcador>[EMPRESA RECLAMADA]</Marcador>, pelos fatos e fundamentos a seguir.
          </p>
          <p className="font-bold">I – DOS FATOS</p>
          <p className="indent-[2.5em] text-justify">
            O reclamante trabalha para a reclamada há quatro anos. Desde março, os salários são pagos com atraso e o FGTS
            não é depositado.
          </p>
        </article>
      </div>
    </Tela>
  );
}

// ------------------------------------------------------------------- transcrições e documentos

export function TelaMateriais({ caso, aba }: { caso: CasoMini; aba: "transcricao" | "documentos" }) {
  return (
    <Tela>
      <Cabecalho
        titulo="Transcrições e documentos"
        subtitulo={caso.titulo}
        acoes={
          <Botao alvo="adicionar-ao-caso">
            <Plus />
            Adicionar ao caso
          </Botao>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col px-4">
        <div className="flex shrink-0 gap-1.5 pt-0.5">
          {(
            [
              ["transcricao", "Transcrições", 2],
              ["documentos", "Documentos", 1],
            ] as const
          ).map(([id, titulo, total]) => (
            <span
              key={id}
              data-alvo={`aba-${id}`}
              className={cn(
                "bg-campo flex h-7 items-center gap-1 rounded-[7px] border px-2.5 text-[10px] transition-colors duration-300",
                aba === id ? "border-destaque bg-destaque-suave font-semibold" : "border-borda data-sobre:border-destaque/60",
              )}
            >
              {titulo}
              <span className="text-tinta-suave text-[9px] font-medium">{total}</span>
            </span>
          ))}
        </div>
        <div key={aba} className="animate-in fade-in slide-in-from-bottom-1 flex flex-col gap-2 pt-3 duration-300">
          {aba === "transcricao" ? (
            <>
              <article className="bg-campo border-borda flex flex-col gap-1 rounded-[9px] border px-3 py-2">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold">Transcrição 1 · 12:40</span>
                  <span className="text-tinta-suave text-[8.5px]">{ONTEM} às 14:05</span>
                </p>
                <p className="text-tinta-suave line-clamp-2 text-[9.5px] leading-snug">
                  Trabalho na empresa há quatro anos. Desde março o salário atrasa e o FGTS não é depositado. Recebo R$ 400
                  por Pix, fora do holerite.
                </p>
              </article>
              <article className="bg-campo border-borda flex flex-col gap-1 rounded-[9px] border px-3 py-2">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold">Transcrição 2 · Escrito à mão</span>
                  <span className="text-tinta-suave text-[8.5px]">{HOJE} às 09:12</span>
                </p>
                <p className="text-tinta-suave line-clamp-2 text-[9.5px] leading-snug">
                  O cliente trouxe os extratos dos Pix e as mensagens em que o gerente promete pagar os atrasados.
                </p>
              </article>
            </>
          ) : (
            <span className="bg-campo border-borda flex items-center gap-2.5 rounded-[9px] border px-3 py-2">
              <FileText className="text-destaque size-3.5 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[10.5px] font-medium">contrato-de-trabalho.pdf</span>
                <span className="text-tinta-suave text-[8.5px]">PDF · Verificado · {ONTEM} às 14:20</span>
              </span>
              <span className="text-destaque shrink-0 text-[9.5px] font-semibold">Ver texto</span>
            </span>
          )}
        </div>
      </div>
    </Tela>
  );
}

// ------------------------------------------------------------------- configurações

function LinhaConfiguracao({ titulo, detalhe, children }: { titulo: string; detalhe: ReactNode; children: ReactNode }) {
  return (
    <span className="border-borda flex items-center justify-between gap-2 rounded-[9px] border px-2.5 py-1.5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-semibold">{titulo}</span>
        <span className="text-tinta-suave truncate text-[9px]">{detalhe}</span>
      </span>
      {children}
    </span>
  );
}

const AMOSTRAS_DESTAQUE = ["bg-[#356660]", "bg-white", "bg-[#2f5a8c]", "bg-[#b05620]", "bg-[#5a3d82]"];

export function ConfiguracoesMini() {
  return (
    <>
      <span className="text-tinta-suave absolute top-2.5 right-2.5">
        <X className="size-3.5" />
      </span>
      <p className="text-[12.5px] font-semibold">Configurações</p>
      {/* MVP sem plano. Texto original: "Tema, cor, pagamento, tutorial e sessão" */}
      <p className="text-tinta-suave mt-0.5 text-[9.5px]">Tema, cor, tutorial e sessão</p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        <LinhaConfiguracao
          titulo="Aparência"
          detalhe={
            <>
              <span className="dark:hidden">Tema claro</span>
              <span className="hidden dark:inline">Tema escuro</span>
            </>
          }
        >
          <IconeLua />
        </LinhaConfiguracao>
        <LinhaConfiguracao titulo="Cor de destaque" detalhe="Cor dos botões">
          <span className="flex gap-1">
            {AMOSTRAS_DESTAQUE.map((cor) => (
              <span key={cor} className={cn("border-borda size-3 rounded-full border", cor)} />
            ))}
          </span>
        </LinhaConfiguracao>
        {/* MVP sem plano: o modal real não tem mais o cartão de Pagamento. Original:
        <LinhaConfiguracao titulo="Pagamento" detalhe="Plano Básico">
          <Botao variante="contorno">Alterar</Botao>
        </LinhaConfiguracao> */}
        <LinhaConfiguracao titulo="Tutorial" detalhe="Rever o passo a passo da Sophia">
          <Botao
            alvo="ver-tutorial"
            variante="contorno"
            className="data-sobre:ring-destaque/25 data-sobre:border-destaque transition-[box-shadow,border-color] data-sobre:ring-4"
          >
            Ver
          </Botao>
        </LinhaConfiguracao>
        <LinhaConfiguracao titulo="Sessão" detalhe="Voltar para a tela de login">
          <Botao variante="contorno">Sair</Botao>
        </LinhaConfiguracao>
      </div>
    </>
  );
}
