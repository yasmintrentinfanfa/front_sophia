"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Calculator,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { Dica, MARIANA, RAFAEL, Tela, usePalco, type CasoMini } from "@/components/tutorial/palco";
import { Botao, Cabecalho, TextoDigitado, type FaseTexto } from "@/components/tutorial/telas";
import {
  datasDaIntimacao,
  ehDiaUtil,
  emRecesso,
  formatarData,
  formatarDataComSemana,
  hojeEmBrasilia,
  nomeDoFeriado,
  somarDias,
  vencimento,
  type DataIso,
} from "@/lib/prazos/calendario";
import { descreverPrazo, urgenciaDoPrazo, type UrgenciaPrazo } from "@/lib/prazos/estado";
import {
  DIAS_DA_SEMANA,
  diaDaSemana,
  diaPorExtenso,
  mesDe,
  mesmoMes,
  prazosPorDia,
  semanasDoMes,
  tituloDoMes,
  type Mes,
} from "@/lib/prazos/mes";
import { cn } from "@/lib/utils";

/*
 * Miniaturas de Prazos e do Calendário de prazos (`PainelPrazos`, `CalendarioPrazos`), com as
 * mesmas regras de data das telas reais: a intimação saiu no DJEN no último dia útil, e as
 * cores de cada prazo dependem de hoje. Assim a cena nunca mostra um prazo "do passado".
 */

// ------------------------------------------------------------------- dados da cena

const HOJE = hojeEmBrasilia();
const AGORA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
}).format(new Date());

function diaUtilAnterior(iso: DataIso) {
  let atual = somarDias(iso, -1);
  while (!ehDiaUtil(atual)) atual = somarDias(atual, -1);
  return atual;
}

/** A reclamação trabalhista do Carlos, já protocolada (número fictício, com dígito verificador válido). */
export const PROCESSO_CARLOS = "1000816-70.2026.5.02.0034";
const DISPONIBILIZADA = diaUtilAnterior(HOJE);
const { publicacao: PUBLICADA, inicioContagem: INICIO_CONTAGEM } = datasDaIntimacao(DISPONIBILIZADA);
const DIAS_DO_PRAZO = 15;

export interface PrazoMini {
  id: string;
  descricao: string;
  dataFinal: DataIso;
  cumprido: boolean;
  caso?: CasoMini;
  processo?: string;
}

/** Dois dias úteis antes de hoje: o prazo vencido do exemplo cai num dia de expediente. */
const VENCEU_EM = diaUtilAnterior(diaUtilAnterior(HOJE));
/** O dia útil mais distante nos próximos 3 dias (ainda "perto de vencer"), sem cair em fim de semana. */
const VENCE_EM_BREVE = [3, 2, 1].map((dias) => somarDias(HOJE, dias)).find(ehDiaUtil) ?? somarDias(HOJE, 1);

/** Prazos que o advogado já tinha, um de cada cor: vencido, de hoje e perto de vencer. */
export const PRAZOS_ANTERIORES: PrazoMini[] = [
  { id: "procuracao", descricao: "Juntar procuração", dataFinal: VENCEU_EM, cumprido: false, caso: MARIANA },
  { id: "laudo", descricao: "Manifestação sobre o laudo", dataFinal: HOJE, cumprido: false, caso: RAFAEL },
  { id: "contrarrazoes", descricao: "Contrarrazões", dataFinal: VENCE_EM_BREVE, cumprido: false, caso: MARIANA },
];

/** O prazo agendado na cena: 15 dias úteis contados como a calculadora real conta. */
export const REPLICA: PrazoMini = {
  id: "replica",
  descricao: "Réplica",
  dataFinal: vencimento(INICIO_CONTAGEM, DIAS_DO_PRAZO, "uteis"),
  cumprido: false,
  processo: PROCESSO_CARLOS,
};

export const PRAZOS_COM_REPLICA = [...PRAZOS_ANTERIORES, REPLICA];
export const MES_DE_HOJE = mesDe(HOJE);
export const MES_DA_REPLICA = mesDe(REPLICA.dataFinal);

/** Dia útil perto da réplica, no mesmo mês e sem prazo: onde a cena usa o "+" do dia. */
export const DIA_LIVRE = (() => {
  const ocupados = new Set(PRAZOS_COM_REPLICA.map((prazo) => prazo.dataFinal));
  for (const distancia of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
    const dia = somarDias(REPLICA.dataFinal, distancia);
    if (mesmoMes(mesDe(dia), MES_DA_REPLICA) && ehDiaUtil(dia) && !ocupados.has(dia)) return dia;
  }
  return somarDias(REPLICA.dataFinal, 1);
})();

// ------------------------------------------------------------------- peças comuns

const CAMPO =
  "bg-campo border-borda flex h-[22px] min-w-0 items-center rounded-[6px] border px-1.5 text-[8.5px] whitespace-nowrap transition-[border-color,box-shadow] duration-200";

/** Cores da lista de prazos (`ListaPrazos`). */
const COR: Record<UrgenciaPrazo, string> = {
  vencido: "bg-red-500/10 text-red-700 dark:text-red-300",
  hoje: "bg-red-500/10 text-red-700 dark:text-red-300",
  proximo: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  futuro: "bg-destaque-suave text-destaque",
  cumprido: "bg-chip text-tinta-suave",
};

/** Etiquetas do calendário (`CalendarioPrazos`): vencido fica riscado e em vermelho. */
const ESTILO: Record<UrgenciaPrazo, { chip: string; ponto: string; rotulo: string }> = {
  vencido: {
    chip: "border-t-red-500 bg-red-500/10 text-red-700 line-through decoration-current dark:text-red-300",
    ponto: "bg-red-500",
    rotulo: "Vencido",
  },
  hoje: {
    chip: "border-t-red-500 bg-red-500/10 font-semibold text-red-700 dark:text-red-300",
    ponto: "bg-red-500",
    rotulo: "Vence hoje",
  },
  proximo: {
    chip: "border-t-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300",
    ponto: "bg-amber-500",
    rotulo: "Vence em até 3 dias",
  },
  futuro: { chip: "border-t-destaque bg-destaque-suave text-destaque", ponto: "bg-destaque", rotulo: "A vencer" },
  cumprido: {
    chip: "border-t-tinta-suave/40 bg-chip text-tinta-suave line-through",
    ponto: "bg-tinta-suave/50",
    rotulo: "Cumprido",
  },
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Botões lado a lado de uma escolha (OAB ou processo; a tratar ou todas). */
function Segmentos({ opcoes, ativo }: { opcoes: { id: string; rotulo: string; alvo?: string }[]; ativo: string }) {
  return (
    <span className="bg-chip border-borda flex w-fit shrink-0 rounded-[7px] border p-0.5">
      {opcoes.map(({ id, rotulo, alvo }) => (
        <span
          key={id}
          data-alvo={alvo}
          className={cn(
            "flex h-5 items-center rounded-[5px] px-2 text-[8.5px] font-medium whitespace-nowrap transition-colors duration-200",
            id === ativo ? "bg-campo text-destaque shadow-sm" : "text-tinta-suave data-sobre:text-tinta",
          )}
        >
          {rotulo}
        </span>
      ))}
    </span>
  );
}

function SecaoMini({
  titulo,
  descricao,
  acao,
  foco,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  /** Marca para a rolagem da tela trazer a seção à vista. */
  foco?: string;
  children: ReactNode;
}) {
  return (
    <section data-foco={foco} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end justify-between gap-1.5">
        <div className="flex min-w-0 flex-col gap-px">
          <h2 className="text-[11px] leading-tight font-semibold">{titulo}</h2>
          {descricao ? <p className="text-tinta-suave line-clamp-2 text-[8.5px] leading-snug">{descricao}</p> : null}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Distância do elemento até o contêiner pela cadeia de `offsetTop` (sem efeito das animações). */
function distanciaAte(elemento: HTMLElement, contêiner: HTMLElement) {
  let topo = 0;
  let atual: HTMLElement | null = elemento;
  while (atual && atual !== contêiner) {
    topo += atual.offsetTop;
    atual = atual.offsetParent as HTMLElement | null;
  }
  return topo;
}

/**
 * Página que rola sozinha até o trecho marcado com `data-foco`, como o advogado rolaria a
 * tela real: o cabeçalho fica parado e o conteúdo sobe só o necessário.
 */
function RolarAte({ foco, children, className }: { foco: string | null; children: ReactNode; className?: string }) {
  const fora = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const atual = useRef(0);
  const [rolagem, setRolagem] = useState(0);

  useLayoutEffect(() => {
    const externo = fora.current;
    const interno = dentro.current;
    if (!externo || !interno) return;
    function medir() {
      if (!externo || !interno) return;
      const visivel = externo.clientHeight;
      const maximo = Math.max(0, interno.offsetHeight - visivel);
      const alvo = foco ? interno.querySelector<HTMLElement>(`[data-foco="${foco}"]`) : null;
      let proxima = 0;
      if (alvo) {
        const topo = distanciaAte(alvo, interno);
        const fim = topo + alvo.offsetHeight;
        proxima = Math.min(Math.max(atual.current, fim - visivel + 10), topo - 10);
      }
      proxima = Math.min(Math.max(proxima, 0), maximo);
      atual.current = proxima;
      setRolagem(proxima);
    }
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(externo);
    observador.observe(interno);
    return () => observador.disconnect();
  }, [foco]);

  return (
    <div ref={fora} className="min-h-0 flex-1 overflow-hidden">
      <div
        ref={dentro}
        className={cn("relative transition-transform duration-500 ease-out", className)}
        style={{ transform: `translateY(-${rolagem}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

function AcaoPrazo({
  alvo,
  rotulo,
  perigo = false,
  children,
}: {
  alvo?: string;
  rotulo: string;
  perigo?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-alvo={alvo}
      className={cn(
        "group text-tinta-suave relative flex size-5 items-center justify-center rounded-[5px] transition-colors [&_svg]:size-3",
        perigo
          ? "data-sobre:bg-red-500/10 data-sobre:text-red-600 dark:data-sobre:text-red-400"
          : "data-sobre:bg-tinta/5",
      )}
    >
      {children}
      {alvo ? <Dica texto={rotulo} lado="baixo" /> : null}
    </span>
  );
}

/** Uma linha de `ListaPrazos`: cumprido, o que fazer, vencimento, situação e as ações. */
function LinhaPrazo({ prazo, novo = false, comDicas = false }: { prazo: PrazoMini; novo?: boolean; comDicas?: boolean }) {
  const urgencia = urgenciaDoPrazo(prazo, HOJE);
  return (
    <li
      data-foco={novo ? "prazo-novo" : undefined}
      className={cn(
        "bg-campo border-borda flex h-[30px] shrink-0 items-center gap-2 rounded-[8px] border px-2.5",
        novo && "ring-destaque/25 animate-in fade-in slide-in-from-top-1 ring-2 duration-500",
      )}
    >
      <span
        data-alvo={comDicas ? "dia-cumprido" : undefined}
        className="group border-borda data-sobre:border-destaque relative flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors"
      >
        {comDicas ? <Dica texto="Marcar como cumprido" lado="baixo" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-[10px] leading-tight font-semibold">{prazo.descricao}</span>
        <span className="text-tinta-suave flex min-w-0 gap-1.5 text-[8px] leading-tight whitespace-nowrap">
          <span className="shrink-0">Vence {formatarDataComSemana(prazo.dataFinal)}</span>
          {prazo.processo ? <span className="truncate font-mono tracking-tight">{prazo.processo}</span> : null}
          {prazo.caso ? (
            <span className="text-destaque truncate font-medium">
              {prazo.caso.titulo} — {prazo.caso.cliente}
            </span>
          ) : null}
        </span>
      </span>
      <span className={cn("shrink-0 rounded-full px-1.5 py-[3px] text-[8px] leading-none font-semibold", COR[urgencia])}>
        {descreverPrazo(prazo, HOJE)}
      </span>
      <span className="flex shrink-0 gap-0.5">
        <AcaoPrazo alvo={comDicas ? "dia-editar" : undefined} rotulo="Editar">
          <Pencil />
        </AcaoPrazo>
        <AcaoPrazo alvo={comDicas ? "dia-excluir" : undefined} rotulo="Excluir" perigo>
          <Trash2 />
        </AcaoPrazo>
      </span>
    </li>
  );
}

// ------------------------------------------------------------------- prazos

const SITUACAO_INTIMACAO = {
  pendente: { rotulo: "A tratar", classe: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  agendada: { rotulo: "Prazo agendado", classe: "bg-destaque-suave text-destaque" },
} as const;

/** A intimação que chegou do DJEN (`CartaoIntimacao`), ainda a tratar. */
function CartaoIntimacaoMini() {
  const situacao = SITUACAO_INTIMACAO.pendente;
  return (
    <article
      data-foco="intimacao"
      className="bg-campo border-borda animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-1.5 rounded-[10px] border border-l-[3px] border-l-amber-500 px-3 py-2 duration-500"
    >
      <header className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8px]">
        <span className={cn("rounded-full px-1.5 py-[3px] leading-none font-semibold", situacao.classe)}>{situacao.rotulo}</span>
        <span className="text-tinta-suave">Disponibilizada em {formatarData(DISPONIBILIZADA)} · TRT2</span>
      </header>
      <div className="flex flex-col gap-px">
        <p className="text-[10.5px] leading-tight font-semibold">
          Despacho<span className="text-tinta-suave font-normal"> · Ação Trabalhista - Rito Ordinário</span>
        </p>
        <p className="font-mono text-[8.5px] leading-tight tracking-tight">{PROCESSO_CARLOS}</p>
        <p className="text-tinta-suave text-[8.5px] leading-tight">34ª Vara do Trabalho de São Paulo</p>
      </div>
      <p className="line-clamp-2 text-[8.5px] leading-snug">
        Intime-se o reclamante para, no prazo de 15 dias, manifestar-se sobre a contestação e os documentos juntados
        pela reclamada.
      </p>
      <p className="text-tinta-suave text-[7.5px] leading-tight">
        Publicação {formatarData(PUBLICADA)} · contagem a partir de {formatarData(INICIO_CONTAGEM)} (estimativa, só
        feriados nacionais)
      </p>
      <footer className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <Botao alvo="agendar-intimacao" className="h-6">
          <CalendarPlus />
          Agendar prazo
        </Botao>
        <Botao variante="contorno" className="h-6 font-medium">
          Sem prazo a cumprir
        </Botao>
        <span className={cn(CAMPO, "text-tinta-suave h-6 gap-1 px-2")}>
          Ligar a um caso…
          <ChevronDown className="size-2.5" />
        </span>
        <span className="text-destaque ml-auto flex items-center gap-0.5 text-[9px] font-semibold">
          Abrir no tribunal
          <ExternalLink className="size-2.5" />
        </span>
      </footer>
    </article>
  );
}

export type EtapaPrazos = "inicio" | "consultando" | "acompanhando";

/** Prazos da conta (`PainelPrazos` sem caso): o que acompanha, os prazos agendados e as intimações. */
export function TelaPrazos({
  aba = "oab",
  numero = "vazio",
  focoNumero = false,
  etapa = "inicio",
  mensagem = false,
  intimacao = null,
  prazos,
  novo = null,
  rolarPara = null,
}: {
  aba?: "oab" | "processo";
  /** Número do processo no campo: vazio, sendo digitado ou completo. */
  numero?: FaseTexto;
  focoNumero?: boolean;
  etapa?: EtapaPrazos;
  /** Aviso verde de "acompanhamento salvo". */
  mensagem?: boolean;
  /** A intimação do processo: a tratar (cartão na lista) ou já tratada (sai de "A tratar"). */
  intimacao?: "pendente" | "tratada" | null;
  prazos: PrazoMini[];
  /** Prazo que acabou de ser agendado: chega com destaque. */
  novo?: string | null;
  /** Trecho que a tela traz à vista (`data-foco`). */
  rolarPara?: string | null;
}) {
  const consultando = etapa === "consultando";
  const pendentes = intimacao === "pendente" ? 1 : 0;
  const todas = intimacao ? 1 : 0;
  return (
    <Tela>
      <Cabecalho
        titulo="Prazos"
        subtitulo={
          <span className="text-tinta-suave">
            Intimações do Diário de Justiça Eletrônico Nacional (DJEN) e os prazos que você agendou
          </span>
        }
        acoes={
          etapa === "acompanhando" ? (
            <>
              <span className="text-tinta-suave animate-in fade-in text-[8.5px] duration-300">
                Atualizado em {formatarData(HOJE)} às {AGORA}
              </span>
              <Botao variante="contorno" className="h-6">
                <RefreshCw />
                Atualizar agora
              </Botao>
            </>
          ) : undefined
        }
      />
      <RolarAte foco={rolarPara} className="flex flex-col gap-3 px-4 pt-1 pb-4">
        {mensagem ? (
          <p className="bg-destaque-suave text-destaque animate-in fade-in rounded-[7px] px-2.5 py-1.5 text-[9px] font-medium duration-300">
            Acompanhamento salvo e DJEN consultado.
          </p>
        ) : null}

        <SecaoMini
          titulo="Acompanhando"
          descricao="Informe sua OAB para receber todas as intimações em seu nome, ou um número de processo específico."
        >
          {etapa === "acompanhando" ? (
            <span className="bg-chip border-borda animate-in fade-in zoom-in-95 flex h-6 w-fit items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-[9px] duration-300">
              <span className="font-mono font-medium tracking-tight">{PROCESSO_CARLOS}</span>
              <X className="text-tinta-suave size-3" />
            </span>
          ) : null}
          <Segmentos
            ativo={aba}
            opcoes={[
              { id: "oab", rotulo: "Número da OAB" },
              { id: "processo", rotulo: "Número do processo", alvo: "aba-processo" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {aba === "oab" ? (
              <>
                <span className={cn(CAMPO, "text-tinta-suave w-[150px]")}>Número da OAB (ex.: 123456)</span>
                <span className={cn(CAMPO, "w-[46px] justify-between")}>
                  UF
                  <ChevronDown className="text-tinta-suave size-2.5" />
                </span>
              </>
            ) : (
              <span
                data-alvo="campo-processo"
                className={cn(
                  CAMPO,
                  "w-[168px] font-mono tracking-tight",
                  focoNumero ? "border-destaque ring-destaque/20 ring-2" : "",
                  consultando && "opacity-60",
                )}
              >
                {numero === "vazio" ? (
                  <span className="text-tinta-suave">0000000-00.0000.0.00.0000</span>
                ) : (
                  <TextoDigitado texto={PROCESSO_CARLOS} fase={numero} velocidade={42} />
                )}
              </span>
            )}
            <Botao alvo="acompanhar" desativado={consultando}>
              {consultando ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {consultando ? "Consultando o DJEN…" : "Acompanhar"}
            </Botao>
          </div>
        </SecaoMini>

        <SecaoMini
          titulo="Prazos agendados"
          acao={
            <span className="flex shrink-0 gap-1.5">
              <Botao alvo="ver-calendario" variante="contorno" className="h-6">
                <CalendarDays />
                Ver no calendário
              </Botao>
              <Botao variante="contorno" className="h-6">
                <CalendarPlus />
                Novo prazo
              </Botao>
            </span>
          }
        >
          <ul className="flex flex-col gap-[3px]">
            {prazos.map((prazo) => (
              <LinhaPrazo key={prazo.id} prazo={prazo} novo={prazo.id === novo} />
            ))}
          </ul>
        </SecaoMini>

        <SecaoMini
          titulo="Intimações"
          descricao="Leia, agende o prazo ou marque que não há providência. A Sophia não calcula o prazo por você."
          acao={
            <Segmentos
              ativo="pendentes"
              opcoes={[
                { id: "pendentes", rotulo: `A tratar (${pendentes})` },
                { id: "todas", rotulo: `Todas (${todas})` },
              ]}
            />
          }
        >
          {intimacao === "pendente" ? (
            <CartaoIntimacaoMini />
          ) : (
            <p key={intimacao ?? "nenhuma"} className="text-tinta-suave animate-in fade-in text-[9.5px] duration-300">
              {intimacao === "tratada"
                ? "Nenhuma intimação a tratar. Tudo em dia."
                : "Acompanhe uma OAB ou um processo para as intimações aparecerem aqui."}
            </p>
          )}
        </SecaoMini>
      </RolarAte>
    </Tela>
  );
}

// ------------------------------------------------------------------- agendar prazo

/**
 * Modal "Agendar prazo" (`ModalPrazo`). Vindo da intimação, mostra as datas do DJEN e a
 * calculadora começa na contagem; vindo do "+" de um dia, a data final já vem preenchida.
 */
export function AgendarPrazoMini({
  origem,
  descricao = "vazio",
  focoDescricao = false,
  dataFinal = null,
  realceData = false,
}: {
  origem: "intimacao" | "dia";
  descricao?: FaseTexto;
  focoDescricao?: boolean;
  dataFinal?: DataIso | null;
  /** Data final que acabou de ser preenchida: o campo acende. */
  realceData?: boolean;
}) {
  const daIntimacao = origem === "intimacao";
  const inicio = daIntimacao ? INICIO_CONTAGEM : HOJE;
  const calculada = vencimento(inicio, DIAS_DO_PRAZO, "uteis");
  return (
    <>
      <p className="text-[12.5px] leading-tight font-semibold">Agendar prazo</p>
      <p className="text-tinta-suave mt-0.5 text-[9px]">Você define a data final. A Sophia só lembra e organiza.</p>

      {daIntimacao ? (
        <div className="bg-chip border-borda mt-2 rounded-[7px] border px-2.5 py-1.5 text-[8.5px] leading-snug">
          <p className="font-semibold">Despacho · {PROCESSO_CARLOS}</p>
          <dl className="text-tinta-suave mt-0.5 grid grid-cols-[auto_1fr] gap-x-2.5">
            <dt>Disponibilizada</dt>
            <dd>{formatarDataComSemana(DISPONIBILIZADA)}</dd>
            <dt>Publicação*</dt>
            <dd>{formatarDataComSemana(PUBLICADA)}</dd>
            <dt>Início da contagem*</dt>
            <dd>{formatarDataComSemana(INICIO_CONTAGEM)}</dd>
          </dl>
        </div>
      ) : null}

      <p className="mt-2 text-[9px] font-medium">O que precisa ser feito</p>
      <span
        data-alvo="campo-descricao"
        className={cn(CAMPO, "mt-0.5 h-6 w-full text-[9px]", focoDescricao && "border-destaque ring-destaque/20 ring-2")}
      >
        {descricao === "vazio" ? (
          <span className="text-tinta-suave">Ex.: Contestação, Réplica, Apelação</span>
        ) : (
          <TextoDigitado texto={REPLICA.descricao} fase={descricao} velocidade={70} />
        )}
      </span>

      {daIntimacao ? null : (
        <>
          <p className="mt-2 text-[9px] font-medium">
            Número do processo <span className="text-tinta-suave font-normal">(opcional)</span>
          </p>
          <span className={cn(CAMPO, "text-tinta-suave mt-0.5 h-6 w-full font-mono text-[9px] tracking-tight")}>
            0000000-00.0000.0.00.0000
          </span>
        </>
      )}

      <fieldset className="border-borda mt-2 rounded-[8px] border border-dashed px-2.5 pb-2">
        <legend className="text-tinta-suave flex items-center gap-1 px-1 text-[8.5px] font-semibold">
          <Calculator className="size-3" />
          Calculadora (opcional)
        </legend>
        <div className="flex flex-wrap items-center gap-1.5 text-[8.5px]">
          <span className={cn(CAMPO, "w-[26px] justify-center")}>{DIAS_DO_PRAZO}</span>
          <span className={cn(CAMPO, "gap-1")}>
            dias úteis
            <ChevronDown className="text-tinta-suave size-2.5" />
          </span>
          <span>contados a partir de</span>
          <span className={CAMPO}>{formatarData(inicio)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-[9px]">
            Vence em <strong>{formatarDataComSemana(calculada)}</strong>
          </p>
          <Botao alvo="usar-data" variante="contorno" className="h-6">
            Usar esta data
          </Botao>
        </div>
        <p className="text-tinta-suave mt-1 truncate text-[7.5px]">
          Considera só feriados nacionais e, em dias úteis, o recesso de 20/12 a 20/01 (art. 220 do CPC).
        </p>
      </fieldset>

      <p className="mt-2 text-[9px] font-medium">Data final do prazo</p>
      <span
        data-alvo="campo-data"
        className={cn(
          CAMPO,
          "mt-0.5 h-6 w-[112px] justify-between text-[9px]",
          realceData && "border-destaque ring-destaque/20 ring-2",
        )}
      >
        {dataFinal ? (
          <span key={dataFinal} className="animate-in fade-in duration-300">
            {formatarData(dataFinal)}
          </span>
        ) : (
          <span className="text-tinta-suave">dd/mm/aaaa</span>
        )}
        <CalendarDays className="text-tinta-suave size-3" />
      </span>

      <div className="mt-2.5 flex justify-end gap-1.5">
        <Botao variante="contorno">Cancelar</Botao>
        <Botao alvo="salvar-prazo">Agendar prazo</Botao>
      </div>
    </>
  );
}

// ------------------------------------------------------------------- calendário

/** Um dia da grade: etiquetas e "+" na tela larga; pontos coloridos e o dia como botão na estreita. */
function CelulaDoDia({
  data,
  mes,
  prazos,
  estreita,
  ultimaLinha,
  ultimaColuna,
}: {
  data: DataIso;
  mes: Mes;
  prazos: PrazoMini[];
  estreita: boolean;
  ultimaLinha: boolean;
  ultimaColuna: boolean;
}) {
  const doMes = mesmoMes(mesDe(data), mes);
  const feriado = nomeDoFeriado(data);
  const fimDeSemana = diaDaSemana(data) === 0 || diaDaSemana(data) === 6;
  const ehHoje = data === HOJE;
  return (
    <div
      // Na tela estreita o dia inteiro é o botão (abre os prazos dele ou agenda um novo): o cursor
      // usa os mesmos alvos da tela larga, a etiqueta do prazo e o "+" do dia.
      data-alvo={estreita ? (prazos.length ? `chip-${prazos[0].id}` : `mais-${data}`) : undefined}
      className={cn(
        "border-borda relative flex min-h-0 min-w-0 flex-col gap-0.5 overflow-hidden p-[3px] transition-colors duration-300",
        !ultimaColuna && "border-r",
        !ultimaLinha && "border-b",
        emRecesso(data) ? (doMes ? "bg-tinta/[0.05]" : "bg-tinta/[0.08]") : !doMes && "bg-fundo/60",
        estreita && "data-sobre:bg-destaque-suave/60",
      )}
    >
      <div className={cn("flex items-center", estreita ? "justify-center" : "justify-between")}>
        <span
          className={cn(
            "flex size-[15px] shrink-0 items-center justify-center rounded-full text-[8px]",
            ehHoje
              ? "bg-acao text-acao-tinta font-semibold"
              : !doMes
                ? "text-tinta-suave/60"
                : fimDeSemana || feriado
                  ? "text-tinta-suave"
                  : "text-tinta font-medium",
          )}
        >
          {Number(data.slice(8))}
        </span>
        {estreita ? null : (
          <span
            data-alvo={`mais-${data}`}
            className="text-tinta-suave data-sobre:text-destaque data-sobre:bg-tinta/5 flex size-3.5 items-center justify-center rounded-[4px] opacity-0 transition-opacity duration-200 data-sobre:opacity-100"
          >
            <Plus className="size-2.5" />
          </span>
        )}
      </div>
      {estreita ? (
        prazos.length ? (
          <span className="absolute inset-x-0 bottom-[3px] flex justify-center gap-0.5">
            {prazos.slice(0, 3).map((prazo) => (
              <span key={prazo.id} className={cn("size-1 rounded-full", ESTILO[urgenciaDoPrazo(prazo, HOJE)].ponto)} />
            ))}
          </span>
        ) : null
      ) : (
        prazos.map((prazo) => (
          <span
            key={prazo.id}
            data-alvo={`chip-${prazo.id}`}
            className={cn(
              "flex min-w-0 shrink-0 items-center rounded-[4px] border-t-2 px-1 py-px text-[7.5px] leading-tight transition-[filter] data-sobre:brightness-95",
              ESTILO[urgenciaDoPrazo(prazo, HOJE)].chip,
            )}
          >
            <span className="truncate">{prazo.descricao}</span>
          </span>
        ))
      )}
    </div>
  );
}

/** Calendário de prazos (`CalendarioPrazos`): o mês, com cada prazo no dia em que vence. */
export function TelaCalendario({
  mes,
  prazos,
  realce = null,
}: {
  mes: Mes;
  prazos: PrazoMini[];
  /** Cor em destaque na legenda, enquanto o cursor passa pelos prazos. */
  realce?: UrgenciaPrazo | null;
}) {
  const { compacto } = usePalco();
  const semanas = semanasDoMes(mes);
  const porDia = prazosPorDia(prazos);
  const noMes = prazos.filter((prazo) => mesmoMes(mesDe(prazo.dataFinal), mes));
  const aCumprir = prazos.filter((prazo) => !prazo.cumprido).length;
  const aCumprirNoMes = noMes.filter((prazo) => !prazo.cumprido).length;
  const vencidosNoMes = noMes.filter((prazo) => urgenciaDoPrazo(prazo, HOJE) === "vencido").length;

  return (
    <Tela>
      <Cabecalho
        titulo="Calendário de prazos"
        subtitulo={<span className="text-tinta-suave">Os prazos que você agendou, no dia em que cada um vence.</span>}
        acoes={
          <>
            <Botao variante="contorno" className="font-medium">
              <List />
              Lista e intimações
            </Botao>
            <Botao>
              <Plus />
              Novo prazo
            </Botao>
          </>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-0.5 pb-3">
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Segmentos
            ativo="a_cumprir"
            opcoes={[
              { id: "a_cumprir", rotulo: `A cumprir (${aCumprir})` },
              { id: "todos", rotulo: `Todos (${prazos.length})` },
            ]}
          />
          <span className={cn(CAMPO, "h-6 gap-1.5")}>
            Todos os casos
            <ChevronDown className="text-tinta-suave size-2.5" />
          </span>
        </div>

        <section className="bg-campo border-borda flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border">
          <div className="border-borda flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
            <div key={tituloDoMes(mes)} className="animate-in fade-in flex min-w-0 items-baseline gap-2 duration-300">
              <h2 className="shrink-0 text-[12px] font-semibold">{tituloDoMes(mes)}</h2>
              <p className="text-tinta-suave truncate text-[8.5px]">
                {aCumprirNoMes ? plural(aCumprirNoMes, "prazo a cumprir", "prazos a cumprir") : "Nada a cumprir neste mês"}
                {vencidosNoMes ? (
                  <span className="font-semibold text-red-700 dark:text-red-300"> · {plural(vencidosNoMes, "vencido", "vencidos")}</span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Botao variante="contorno" desativado={mesmoMes(mes, MES_DE_HOJE)} className="h-6 px-2">
                Hoje
              </Botao>
              <Botao variante="contorno" className="size-6 px-0">
                <ChevronLeft />
              </Botao>
              <Botao alvo="mes-seguinte" variante="contorno" className="size-6 px-0">
                <ChevronRight />
              </Botao>
            </div>
          </div>
          <div className="border-borda grid shrink-0 grid-cols-7 border-b">
            {DIAS_DA_SEMANA.map((nome) => (
              <span key={nome} className="text-tinta-suave py-1 text-center text-[7.5px] font-semibold tracking-wide">
                {nome}
              </span>
            ))}
          </div>
          <div
            key={tituloDoMes(mes)}
            className="animate-in fade-in grid min-h-0 flex-1 grid-cols-7 duration-300"
            style={{ gridTemplateRows: `repeat(${semanas.length}, minmax(0, 1fr))` }}
          >
            {semanas.flat().map((data, indice) => (
              <CelulaDoDia
                key={data}
                data={data}
                mes={mes}
                prazos={porDia.get(data) ?? []}
                estreita={compacto}
                ultimaLinha={indice >= (semanas.length - 1) * 7}
                ultimaColuna={indice % 7 === 6}
              />
            ))}
          </div>
        </section>

        <ul className="text-tinta-suave flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-[7.5px]">
          {(["vencido", "hoje", "proximo", "futuro", "cumprido"] as const).map((urgencia) => (
            <li
              key={urgencia}
              className={cn("transition-opacity duration-300", realce && realce !== urgencia && "opacity-40")}
            >
              <span
                className={cn(
                  "inline-block rounded-[4px] border-t-2 px-1 py-px leading-tight transition-shadow duration-300",
                  ESTILO[urgencia].chip,
                  realce === urgencia && "ring-destaque/35 ring-2",
                )}
              >
                {ESTILO[urgencia].rotulo}
              </span>
            </li>
          ))}
          <li className={cn("flex items-center gap-1 transition-opacity duration-300", realce && "opacity-40")}>
            <span className="border-borda bg-tinta/[0.05] size-2 rounded-[2px] border" />
            Recesso forense (20/12 a 20/01)
          </li>
        </ul>
      </div>
    </Tela>
  );
}

/** Os prazos de um dia (modal do dia): as mesmas ações da lista e "Agendar prazo neste dia". */
export function DiaDoCalendarioMini({ data, prazos }: { data: DataIso; prazos: PrazoMini[] }) {
  const doDia = prazos.filter((prazo) => prazo.dataFinal === data);
  return (
    <>
      <p className="text-[12.5px] leading-tight font-semibold">{diaPorExtenso(data)}</p>
      <p className="text-tinta-suave mt-0.5 text-[9px]">{plural(doDia.length, "prazo neste dia.", "prazos neste dia.")}</p>
      <ul className="mt-2.5 flex flex-col gap-[3px]">
        {doDia.map((prazo) => (
          <LinhaPrazo key={prazo.id} prazo={prazo} comDicas />
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap justify-end gap-1.5">
        <Botao alvo="dia-fechar" variante="contorno">
          Fechar
        </Botao>
        <Botao alvo="dia-agendar">
          <Plus />
          Agendar prazo neste dia
        </Botao>
      </div>
    </>
  );
}
