"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import { FileText } from "lucide-react";

import {
  CARLOS,
  CASOS_EXEMPLO,
  Cursor,
  JanelaApp,
  MARIANA,
  ModalMini,
  Moldura,
  Palco,
  RAFAEL,
  usePalco,
  useRoteiro,
  type Batida,
  type PropsBarra,
} from "@/components/tutorial/palco";
import {
  AgendarPrazoMini,
  DIA_LIVRE,
  DiaDoCalendarioMini,
  MES_DA_REPLICA,
  MES_DE_HOJE,
  PRAZOS_ANTERIORES,
  PRAZOS_COM_REPLICA,
  REPLICA,
  TelaCalendario,
  TelaPrazos,
  type PrazoMini,
} from "@/components/tutorial/telas-prazos";
import {
  ASSUNTOS_CHAT,
  ConfiguracoesMini,
  ConfirmarAnalise,
  DATA_RECENTE,
  DetalheCartao,
  ModeloReclamacao,
  PainelArquivo,
  PainelGravacao,
  PainelTexto,
  TelaAnalise,
  TelaCasos,
  TelaChat,
  TelaMateriais,
  TelaMinuta,
  TelaNovoCaso,
  TelaPecas,
  TelaRepositorio,
  TelaSessao,
  TextoDigitado,
  type FaseTexto,
  type ItemListaMini,
  type MensagemMini,
} from "@/components/tutorial/telas";
import { mesVizinho, semanasDoMes } from "@/lib/prazos/mes";
import { cn } from "@/lib/utils";

export { COLUNAS_TUTORIAL } from "@/components/tutorial/telas";

/*
 * Cada cena é um roteiro de batidas tocado em loop: o cursor vai até o botão real,
 * clica, e a miniatura navega para a tela seguinte, no mesmo caminho do sistema.
 */

/** Dá nome a cada batida, para a cena perguntar "já passou do clique em Criar caso?". */
function roteiro<const Nome extends string>(passos: readonly (Batida & { nome: Nome })[]) {
  const batidas: Batida[] = passos.map((passo) => ({ ms: passo.ms, alvo: passo.alvo, clique: passo.clique }));
  const em = {} as Record<Nome, number>;
  passos.forEach((passo, indice) => {
    em[passo.nome] = indice;
  });
  return { batidas, em };
}

/** Janela com a tela do momento; a tela é montada de novo a cada navegação. */
function Cena({
  tela,
  barra,
  sobreposicao,
  cursor,
  children,
}: {
  tela: string;
  barra: PropsBarra;
  sobreposicao?: ReactNode;
  cursor: { alvo: string | null; clique: boolean; marca: number; arrastando?: string };
  children: ReactNode;
}) {
  return (
    <Palco>
      <JanelaApp tela={tela} barra={barra} sobreposicao={sobreposicao}>
        <Fragment key={tela}>{children}</Fragment>
      </JanelaApp>
      <Cursor {...cursor} />
    </Palco>
  );
}

const MATERIAIS_DO_CARLOS = "2 transcrições · 1 documento";

// ------------------------------------------------------------------- 1. boas-vindas

const JORNADA = roteiro([
  { nome: "marca", ms: 1000 },
  { nome: "novo", ms: 1300 },
  { nome: "repositorio", ms: 1300 },
  { nome: "analise", ms: 1300 },
  { nome: "chat", ms: 1300 },
  { nome: "prazos", ms: 1300 },
  { nome: "tudo", ms: 2000 },
]);

function Traco({ className }: { className?: string }) {
  return <span className={cn("bg-borda/80 block h-[3px] rounded-full", className)} />;
}

function MiniNovo() {
  return (
    <span className="flex w-full flex-col justify-center gap-1.5">
      {[0, 1, 2].map((campo) => (
        <span key={campo} className="flex flex-col gap-[3px]">
          <Traco className="h-[2px] w-1/3" />
          <span className="border-borda h-[10px] rounded-[3px] border" />
        </span>
      ))}
      <span className="bg-acao mt-0.5 h-[10px] w-2/5 rounded-[3px]" />
    </span>
  );
}

function MiniRepositorio() {
  return (
    <span className="flex w-full flex-col gap-1.5">
      <span className="grid grid-cols-2 gap-1">
        <span className="border-borda h-[14px] rounded-[3px] border" />
        <span className="border-borda h-[14px] rounded-[3px] border" />
      </span>
      <Traco className="w-3/5" />
      <span className="grid grid-cols-3 gap-1">
        {[0, 1, 2].map((modo) => (
          <span
            key={modo}
            className={cn(
              "flex h-[28px] flex-col gap-[4px] rounded-[4px] border p-[3px]",
              modo === 0 ? "border-destaque ring-destaque/20 ring-2" : "border-borda",
            )}
          >
            <span className={cn("size-[8px] rounded-[2px]", modo === 0 ? "bg-destaque" : "bg-destaque-suave")} />
            <Traco className="h-[2px] w-4/5" />
          </span>
        ))}
      </span>
      <span className="border-borda h-[16px] rounded-[4px] border" />
    </span>
  );
}

function MiniAnalise() {
  return (
    <span className="flex w-full flex-col gap-1.5">
      <span className="border-borda flex h-[16px] flex-col justify-center gap-[3px] rounded-[3px] border px-1">
        <Traco className="h-[2px] w-2/5" />
        <Traco className="h-[2px] w-4/5" />
      </span>
      <span className="grid grid-cols-5 gap-[3px]">
        {[0, 1, 2, 3, 4].map((coluna) => (
          <span key={coluna} className="flex flex-col gap-[3px]">
            <Traco className="h-[2px] w-4/5" />
            <span className="border-borda h-[16px] rounded-[2px] border" />
            <span className="border-borda h-[16px] rounded-[2px] border" />
          </span>
        ))}
      </span>
    </span>
  );
}

function MiniChat() {
  return (
    <span className="flex w-full flex-col gap-1.5">
      <span className="bg-chip h-[12px] w-full rounded-[3px]" />
      <span className="border-borda flex h-[18px] flex-col justify-center gap-[3px] rounded-[3px] border px-1">
        <Traco className="h-[2px] w-4/5" />
        <Traco className="h-[2px] w-3/5" />
      </span>
      <span className="flex gap-1">
        <span className="border-borda flex h-[20px] flex-1 items-center justify-center rounded-[3px] border">
          <FileText className="text-destaque size-2.5" />
        </span>
        <span className="border-borda h-[20px] flex-1 rounded-[3px] border" />
      </span>
      <span className="flex gap-1">
        <span className="border-borda h-[10px] flex-1 rounded-[3px] border" />
        <span className="bg-acao h-[10px] w-1/4 rounded-[3px]" />
      </span>
    </span>
  );
}

/** O mês com os prazos do escritório: um vencido, um perto de vencer e um a vencer. */
function MiniPrazos() {
  return (
    <span className="flex w-full flex-col gap-1.5">
      <Traco className="h-[2px] w-2/5" />
      <span className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: 21 }, (_, dia) => (
          <span
            key={dia}
            className={cn(
              "h-[8px] rounded-[2px] border",
              dia === 8
                ? "border-red-500/60 bg-red-500/15"
                : dia === 11
                  ? "border-amber-500/60 bg-amber-500/20"
                  : dia === 17
                    ? "border-destaque/60 bg-destaque-suave"
                    : "border-borda",
            )}
          />
        ))}
      </span>
    </span>
  );
}

const ETAPAS_JORNADA: { titulo: string; detalhe: string; Miniatura: ComponentType }[] = [
  { titulo: "Novo caso", detalhe: "Cliente e área jurídica", Miniatura: MiniNovo },
  { titulo: "Repositório", detalhe: "Grave, envie ou escreva", Miniatura: MiniRepositorio },
  { titulo: "Análise", detalhe: "Teses e jurisprudência", Miniatura: MiniAnalise },
  { titulo: "Chat e peças", detalhe: "Dúvidas e minutas", Miniatura: MiniChat },
  { titulo: "Prazos", detalhe: "Intimações e calendário", Miniatura: MiniPrazos },
];

function Jornada() {
  const { compacto } = usePalco();
  const { indice } = useRoteiro(JORNADA.batidas, JORNADA.em.tudo);
  return (
    <Moldura tela="Sophia">
      <div className={cn("flex flex-1 flex-col items-center justify-center px-7", compacto ? "gap-5" : "gap-7")}>
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center gap-1.5 duration-700">
          <p className="text-destaque text-[30px] leading-none font-bold tracking-tight">SOPHIA</p>
          <p className="text-tinta-suave text-[12px]">Da conversa com o cliente à minuta, com os prazos em dia</p>
        </div>
        <ol className={cn("grid w-full", compacto ? "max-w-[330px] grid-cols-3 gap-x-3 gap-y-3" : "grid-cols-5 gap-4")}>
          {ETAPAS_JORNADA.map(({ titulo, detalhe, Miniatura }, posicao) => {
            const acesa = posicao < indice;
            const atual = posicao === indice - 1;
            return (
              <li key={titulo} className="flex flex-col items-center gap-2 text-center">
                <span className="relative w-full">
                  <span
                    className={cn(
                      "bg-campo flex w-full overflow-hidden rounded-[10px] border p-2 transition-[border-color,box-shadow,opacity,translate] duration-500",
                      compacto ? "aspect-[3/2]" : "aspect-[4/3]",
                      acesa ? "border-destaque shadow-[0_6px_18px_rgba(0,0,0,0.10)]" : "border-borda opacity-60",
                      atual && "ring-destaque/20 -translate-y-1 ring-4",
                    )}
                  >
                    <Miniatura />
                  </span>
                  {!compacto && posicao < ETAPAS_JORNADA.length - 1 ? (
                    <span className="bg-borda absolute top-1/2 left-full h-[2px] w-4 -translate-y-1/2 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "bg-destaque absolute inset-y-0 left-0 transition-[width] duration-700 ease-out",
                          posicao < indice - 1 ? "w-full" : "w-0",
                        )}
                      />
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex size-[18px] items-center justify-center rounded-full border text-[9.5px] font-bold transition-colors duration-500",
                      acesa ? "bg-destaque border-destaque text-white" : "bg-chip border-borda text-tinta-suave",
                    )}
                  >
                    {posicao + 1}
                  </span>
                  <span className="text-[11.5px] font-semibold">{titulo}</span>
                </span>
                <span className="text-tinta-suave -mt-1 text-[9.5px]">{detalhe}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </Moldura>
  );
}

export function CenaBoasVindas() {
  return (
    <Palco>
      <Jornada />
    </Palco>
  );
}

// ------------------------------------------------------------------- 2. criar caso

const NOVO = roteiro([
  { nome: "lista", ms: 900 },
  { nome: "irMais", ms: 850, alvo: "trilha-novo" },
  { nome: "clicaMais", ms: 420, clique: true },
  { nome: "formulario", ms: 650, alvo: "campo-nome" },
  { nome: "focaNome", ms: 280, clique: true },
  { nome: "digitaNome", ms: 950 },
  { nome: "irCliente", ms: 560, alvo: "campo-cliente" },
  { nome: "focaCliente", ms: 280, clique: true },
  { nome: "digitaCliente", ms: 800 },
  { nome: "irArea", ms: 600, alvo: "campo-area" },
  { nome: "abreArea", ms: 380, clique: true },
  { nome: "irTrabalho", ms: 750, alvo: "area-trabalhista" },
  { nome: "escolhe", ms: 380, clique: true },
  { nome: "irCriar", ms: 700, alvo: "criar-caso" },
  { nome: "cria", ms: 420, clique: true },
  { nome: "repositorio", ms: 2600, alvo: null },
]);

const OUTROS_CASOS: ItemListaMini[] = [
  { caso: MARIANA, status: "Em análise", data: "Ontem" },
  { caso: RAFAEL, status: "Gravação pendente", data: DATA_RECENTE },
];

export function CenaCriarCaso() {
  const { indice, alvo, clique } = useRoteiro(NOVO.batidas, NOVO.em.irCriar);
  const { em } = NOVO;
  const noFormulario = indice >= em.formulario && indice < em.repositorio;
  const criado = indice >= em.repositorio;
  const fase = (comeca: number, termina: number): FaseTexto =>
    indice < comeca ? "vazio" : indice < termina ? "digitando" : "pronto";
  const foco =
    indice >= em.focaNome && indice < em.irCliente
      ? "nome"
      : indice >= em.focaCliente && indice < em.irArea
        ? "cliente"
        : indice >= em.abreArea && indice <= em.escolhe
          ? "area"
          : null;

  return (
    <Cena
      tela={criado ? "Repositório do caso" : noFormulario ? "Criar novo caso" : "Casos em análise"}
      barra={{
        secao: criado ? "repositorio" : noFormulario ? "novo" : "casos",
        casos: criado ? CASOS_EXEMPLO : [MARIANA, RAFAEL],
        casoAberto: criado ? CARLOS.id : null,
        casoNovo: criado ? CARLOS.id : null,
      }}
      cursor={{ alvo, clique, marca: indice }}
    >
      {criado ? (
        <TelaRepositorio caso={CARLOS} modo="ao_vivo" resumo="Nada adicionado ainda">
          <PainelGravacao />
        </TelaRepositorio>
      ) : noFormulario ? (
        <TelaNovoCaso
          nome={fase(em.digitaNome, em.irCliente)}
          cliente={fase(em.digitaCliente, em.irArea)}
          area={indice > em.escolhe ? "trabalhista" : null}
          foco={foco}
          listaAberta={indice >= em.irTrabalho && indice <= em.escolhe}
        />
      ) : (
        <TelaCasos itens={OUTROS_CASOS} />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 3. relato

const RELATO = roteiro([
  { nome: "inicio", ms: 1300, alvo: "iniciar-gravacao" },
  { nome: "irArquivo", ms: 800, alvo: "modo-arquivo" },
  { nome: "escolheArquivo", ms: 380, clique: true },
  { nome: "pegaArquivo", ms: 420, alvo: "origem-arquivo" },
  { nome: "arrasta", ms: 950, alvo: "soltar" },
  { nome: "solta", ms: 450 },
  { nome: "irAnexar", ms: 900, alvo: "anexar" },
  { nome: "irTexto", ms: 800, alvo: "modo-texto" },
  { nome: "escolheTexto", ms: 380, clique: true },
  { nome: "focaRelato", ms: 600, alvo: "relato" },
  { nome: "digita", ms: 3700 },
  { nome: "irGerar", ms: 1300, alvo: "gerar-analise" },
]);

export function CenaRelato() {
  const { indice, alvo, clique } = useRoteiro(RELATO.batidas, RELATO.em.inicio);
  const { em } = RELATO;
  const modo = indice >= em.focaRelato ? "texto" : indice >= em.pegaArquivo ? "arquivo" : "ao_vivo";

  return (
    <Cena
      tela="Repositório do caso"
      barra={{ secao: "repositorio", casoAberto: CARLOS.id }}
      cursor={{
        alvo,
        clique,
        marca: indice,
        arrastando: indice === em.arrasta ? "contrato-de-trabalho.pdf" : undefined,
      }}
    >
      <TelaRepositorio caso={CARLOS} modo={modo} resumo="Nada adicionado ainda">
        {modo === "ao_vivo" ? (
          <PainelGravacao />
        ) : modo === "arquivo" ? (
          <PainelArquivo anexado={indice >= em.solta} arrastando={indice === em.arrasta} />
        ) : (
          <PainelTexto fase={indice < em.digita ? "vazio" : indice === em.digita ? "digitando" : "pronto"} />
        )}
      </TelaRepositorio>
    </Cena>
  );
}

// ------------------------------------------------------------------- 4. gravação

const GRAVACAO = roteiro([
  { nome: "inicio", ms: 900, alvo: "iniciar-gravacao" },
  { nome: "inicia", ms: 420, clique: true },
  { nome: "gravando", ms: 1300, alvo: null },
  { nome: "irPausar", ms: 650, alvo: "pausar" },
  { nome: "pausa", ms: 380, clique: true },
  { nome: "pausada", ms: 750 },
  { nome: "retoma", ms: 380, clique: true },
  { nome: "irFinalizar", ms: 800, alvo: "finalizar" },
  { nome: "finaliza", ms: 380, clique: true },
  { nome: "modal", ms: 750, alvo: "confirmar-analise" },
  { nome: "confirma", ms: 380, clique: true },
  { nome: "processando", ms: 2800, alvo: null },
  { nome: "pronto", ms: 900, alvo: "ver-analise" },
  { nome: "verAnalise", ms: 420, clique: true },
  { nome: "analise", ms: 2100, alvo: null },
]);

export function CenaGravacao() {
  const { indice, alvo, clique } = useRoteiro(GRAVACAO.batidas, GRAVACAO.em.irFinalizar);
  const { em } = GRAVACAO;
  const noRepositorio = indice <= em.inicia;
  const naAnalise = indice >= em.analise;
  const estado =
    indice >= em.processando
      ? "encerrada"
      : indice >= em.modal || (indice >= em.pausada && indice <= em.retoma)
        ? "pausada"
        : "gravando";

  return (
    <Cena
      tela={noRepositorio ? "Repositório do caso" : naAnalise ? "Análise preliminar de caso" : "Sessão ativa"}
      barra={{ secao: naAnalise ? "casos" : "repositorio", casoAberto: CARLOS.id }}
      sobreposicao={
        indice >= em.modal && indice <= em.confirma ? (
          <ModalMini className="max-w-[250px]">
            <ConfirmarAnalise />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      {noRepositorio ? (
        <TelaRepositorio caso={CARLOS} modo="ao_vivo" resumo="Nada adicionado ainda">
          <PainelGravacao />
        </TelaRepositorio>
      ) : naAnalise ? (
        <TelaAnalise caso={CARLOS} />
      ) : (
        <TelaSessao
          caso={CARLOS}
          estado={estado}
          corpo={indice >= em.pronto ? "pronto" : indice >= em.processando ? "processando" : "aguardando"}
        />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 5. cards

const CARDS = roteiro([
  { nome: "inicio", ms: 1500, alvo: null },
  { nome: "teses", ms: 1300, alvo: "card-0-0" },
  { nome: "temas", ms: 1300, alvo: "card-1-0" },
  { nome: "juris", ms: 1300, alvo: "card-2-0" },
  { nome: "perguntas", ms: 1300, alvo: "card-3-0" },
  { nome: "necessidades", ms: 1300, alvo: "card-4-0" },
  { nome: "volta", ms: 850, alvo: "card-0-0" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "detalhe", ms: 1000 },
  { nome: "irChat", ms: 1700, alvo: "continuar-chat" },
]);

export function CenaCards() {
  const { indice, alvo, clique } = useRoteiro(CARDS.batidas, CARDS.em.teses);
  const { em } = CARDS;
  const percorrendo = indice >= em.teses && indice <= em.necessidades;
  const realce = percorrendo ? indice - em.teses : indice >= em.volta && indice <= em.abre ? 0 : null;

  return (
    <Cena
      tela="Análise preliminar de caso"
      barra={{ secao: "casos", casoAberto: CARLOS.id }}
      sobreposicao={
        indice >= em.detalhe ? (
          <ModalMini className="max-w-[270px]">
            <DetalheCartao />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      <TelaAnalise caso={CARLOS} realce={realce} legenda={percorrendo} />
    </Cena>
  );
}

// ------------------------------------------------------------------- 6. chat

const CHAT = roteiro([
  { nome: "analise", ms: 1000, alvo: "botao-chat" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "chat", ms: 850, alvo: "assunto-1" },
  { nome: "escolhe", ms: 380, clique: true },
  { nome: "irEnviar", ms: 620, alvo: "enviar" },
  { nome: "envia", ms: 380, clique: true },
  { nome: "pensando", ms: 950 },
  // A resposta aponta o que falta; o advogado anexa o extrato ali mesmo, pelo "+". O arquivo
  // espera no campo; aqui ele envia só o documento, para ficar salvo no caso.
  { nome: "resposta", ms: 1500, alvo: "anexar" },
  { nome: "anexa", ms: 380, clique: true },
  { nome: "separado", ms: 1300, alvo: "enviar" },
  { nome: "enviaArquivo", ms: 380, clique: true },
  { nome: "anexando", ms: 900 },
  { nome: "anexado", ms: 1400, alvo: "atualizar" },
  { nome: "atualiza", ms: 380, clique: true },
  { nome: "atualizando", ms: 1300 },
  { nome: "atualizada", ms: 1800, alvo: "ver-cards" },
]);

const DOCUMENTO_ANEXADO = "extrato-fgts.pdf";

const CONVERSA: MensagemMini[] = [
  { papel: "advogado", conteudo: ASSUNTOS_CHAT[1] },
  {
    papel: "assistente",
    conteudo: (
      <>
        Faltam os <strong className="font-semibold">holerites</strong>, os{" "}
        <strong className="font-semibold">cartões de ponto</strong> e o{" "}
        <strong className="font-semibold">extrato do FGTS</strong>. Com eles você comprova os atrasos.
      </>
    ),
  },
];

export function CenaChat() {
  const { indice, alvo, clique } = useRoteiro(CHAT.batidas, CHAT.em.atualizada);
  const { em } = CHAT;
  const naAnalise = indice <= em.abre;
  const mensagens = CONVERSA.slice(0, indice >= em.resposta ? 2 : indice >= em.pensando ? 1 : 0);
  const pensando = indice === em.pensando;
  const atualizacao = indice >= em.atualizada ? "pronta" : indice >= em.atualizando ? "atualizando" : "nenhuma";
  const pergunta = indice >= em.irEnviar && indice <= em.envia ? ASSUNTOS_CHAT[1] : null;
  const anexo = indice >= em.anexando ? { nome: DOCUMENTO_ANEXADO, pronto: indice >= em.anexado } : null;
  const separado = indice >= em.separado && indice <= em.enviaArquivo ? DOCUMENTO_ANEXADO : null;

  return (
    <Cena
      tela={naAnalise ? "Análise preliminar de caso" : "Chat com IA"}
      barra={{ secao: "casos", casoAberto: CARLOS.id }}
      cursor={{ alvo, clique, marca: indice }}
    >
      {naAnalise ? (
        <TelaAnalise caso={CARLOS} />
      ) : (
        <TelaChat
          caso={CARLOS}
          mensagens={mensagens}
          pergunta={pergunta}
          assunto={indice >= em.irEnviar && indice <= em.envia ? 1 : null}
          pensando={pensando}
          podeAtualizar={Boolean(anexo?.pronto) && atualizacao !== "atualizando"}
          atualizacao={atualizacao}
          anexo={anexo}
          separado={separado}
        />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 7. peças

const PECAS = roteiro([
  { nome: "analise", ms: 1000, alvo: "botao-pecas" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "catalogo", ms: 1300, alvo: "modelo-reclamacao" },
  { nome: "escolhe", ms: 400, clique: true },
  { nome: "modelo", ms: 800, alvo: "orientacoes" },
  { nome: "foca", ms: 300, clique: true },
  { nome: "digita", ms: 1500 },
  { nome: "irGerar", ms: 650, alvo: "gerar-minuta" },
  { nome: "gera", ms: 400, clique: true },
  { nome: "gerando", ms: 1600 },
  { nome: "minuta", ms: 1200, alvo: "baixar-docx" },
  { nome: "baixa", ms: 400, clique: true },
  { nome: "fim", ms: 1500 },
]);

const ORIENTACOES = "Incluir pedido de justiça gratuita.";

export function CenaPecas() {
  const { indice, alvo, clique } = useRoteiro(PECAS.batidas, PECAS.em.minuta);
  const { em } = PECAS;
  const naAnalise = indice <= em.abre;
  const naMinuta = indice >= em.minuta;

  return (
    <Cena
      tela={naAnalise ? "Análise preliminar de caso" : "Peças processuais"}
      barra={{ secao: "casos", casoAberto: CARLOS.id }}
      sobreposicao={
        indice >= em.modelo && indice <= em.gerando ? (
          <ModalMini className="max-w-[330px]">
            <ModeloReclamacao
              gerando={indice === em.gerando}
              orientacoes={
                indice < em.digita ? null : <TextoDigitado texto={ORIENTACOES} fase={indice === em.digita ? "digitando" : "pronto"} />
              }
            />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      {naAnalise ? <TelaAnalise caso={CARLOS} /> : naMinuta ? <TelaMinuta /> : <TelaPecas caso={CARLOS} />}
    </Cena>
  );
}

// ------------------------------------------------------------------- 8. casos

const CASOS = roteiro([
  { nome: "inicio", ms: 1000, alvo: "trilha-casos" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "lista", ms: 900, alvo: "arquivar-mariana" },
  { nome: "dica", ms: 800 },
  { nome: "arquiva", ms: 400, clique: true },
  { nome: "saindo", ms: 520 },
  { nome: "saiu", ms: 800, alvo: "excluir-rafael" },
  { nome: "dicaExcluir", ms: 1000 },
  { nome: "irCaso", ms: 800, alvo: "caso-carlos" },
  { nome: "abreCaso", ms: 400, clique: true },
  { nome: "analise", ms: 2200, alvo: null },
]);

export function CenaCasos() {
  const { indice, alvo, clique } = useRoteiro(CASOS.batidas, CASOS.em.dica);
  const { em } = CASOS;
  const noRepositorio = indice <= em.abre;
  const naAnalise = indice >= em.analise;
  const arquivou = indice >= em.saindo;
  const itens: ItemListaMini[] = [
    { caso: CARLOS, status: "Em análise", data: "Hoje" },
    {
      caso: MARIANA,
      status: "Em análise",
      data: "Ontem",
      estado: indice >= em.saiu ? "saiu" : indice === em.saindo ? "saindo" : undefined,
    },
    { caso: RAFAEL, status: "Gravação pendente", data: DATA_RECENTE },
  ];

  return (
    <Cena
      tela={noRepositorio ? "Repositório do caso" : naAnalise ? "Análise preliminar de caso" : "Casos em análise"}
      barra={{
        secao: noRepositorio ? "repositorio" : "casos",
        casos: arquivou ? [CARLOS, RAFAEL] : CASOS_EXEMPLO,
        casoAberto: noRepositorio || naAnalise ? CARLOS.id : null,
      }}
      cursor={{ alvo, clique, marca: indice }}
    >
      {noRepositorio ? (
        <TelaRepositorio caso={CARLOS} modo="ao_vivo" resumo={MATERIAIS_DO_CARLOS}>
          <PainelGravacao />
        </TelaRepositorio>
      ) : naAnalise ? (
        <TelaAnalise caso={CARLOS} />
      ) : (
        <TelaCasos itens={itens} realceArquivados={arquivou && indice < em.irCaso} />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 9. repositório

const REPOSITORIO = roteiro([
  { nome: "analise", ms: 1000, alvo: "trilha-repositorio" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "repositorio", ms: 1300, alvo: "card-materiais" },
  { nome: "abreMateriais", ms: 400, clique: true },
  { nome: "materiais", ms: 1300, alvo: "aba-documentos" },
  { nome: "aba", ms: 400, clique: true },
  // Passa pela lixeira do documento (excluir o que subiu errado) antes de adicionar material novo.
  { nome: "documentos", ms: 1300, alvo: "excluir-documento" },
  { nome: "lixeira", ms: 1100, alvo: "adicionar-ao-caso" },
  { nome: "adiciona", ms: 400, clique: true },
  { nome: "volta", ms: 1800, alvo: null },
]);

export function CenaRepositorio() {
  const { indice, alvo, clique } = useRoteiro(REPOSITORIO.batidas, REPOSITORIO.em.materiais);
  const { em } = REPOSITORIO;
  const naAnalise = indice <= em.abre;
  const nosMateriais = indice > em.abreMateriais && indice <= em.adiciona;

  return (
    <Cena
      tela={naAnalise ? "Análise preliminar de caso" : nosMateriais ? "Transcrições e documentos" : "Repositório do caso"}
      barra={{ secao: naAnalise ? "casos" : "repositorio", casoAberto: CARLOS.id }}
      cursor={{ alvo, clique, marca: indice }}
    >
      {naAnalise ? (
        <TelaAnalise caso={CARLOS} />
      ) : nosMateriais ? (
        <TelaMateriais caso={CARLOS} aba={indice >= em.documentos ? "documentos" : "transcricao"} />
      ) : (
        <TelaRepositorio caso={CARLOS} modo="ao_vivo" resumo={MATERIAIS_DO_CARLOS}>
          <PainelGravacao />
        </TelaRepositorio>
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 10. prazos

// O advogado acompanha o processo pelo número; o DJEN traz a intimação e ele agenda o prazo
// pela calculadora. Prazos não mostra a lista de casos: a barra fica só com os ícones.
const PRAZOS = roteiro([
  { nome: "analise", ms: 1000, alvo: "trilha-prazos" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "tela", ms: 1000, alvo: "aba-processo" },
  { nome: "escolheAba", ms: 380, clique: true },
  { nome: "irCampo", ms: 600, alvo: "campo-processo" },
  { nome: "foca", ms: 280, clique: true },
  { nome: "digita", ms: 1300 },
  { nome: "irAcompanhar", ms: 650, alvo: "acompanhar" },
  { nome: "acompanha", ms: 400, clique: true },
  { nome: "consultando", ms: 1300 },
  { nome: "intimacao", ms: 1700, alvo: "agendar-intimacao" },
  { nome: "abreModal", ms: 400, clique: true },
  { nome: "modal", ms: 750, alvo: "campo-descricao" },
  { nome: "focaDescricao", ms: 280, clique: true },
  { nome: "digitaDescricao", ms: 800 },
  { nome: "irUsarData", ms: 800, alvo: "usar-data" },
  { nome: "usaData", ms: 400, clique: true },
  { nome: "irSalvar", ms: 1000, alvo: "salvar-prazo" },
  { nome: "salva", ms: 400, clique: true },
  { nome: "agendado", ms: 2400, alvo: null },
]);

export function CenaPrazos() {
  const { indice, alvo, clique } = useRoteiro(PRAZOS.batidas, PRAZOS.em.intimacao);
  const { em } = PRAZOS;
  const naAnalise = indice <= em.abre;
  const agendado = indice >= em.agendado;
  const fase = (comeca: number, termina: number): FaseTexto =>
    indice < comeca ? "vazio" : indice < termina ? "digitando" : "pronto";

  return (
    <Cena
      tela={naAnalise ? "Análise preliminar de caso" : "Prazos"}
      barra={naAnalise ? { secao: "casos", casoAberto: CARLOS.id } : { secao: "prazos" }}
      sobreposicao={
        indice >= em.modal && indice <= em.salva ? (
          <ModalMini className="max-w-[330px]">
            <AgendarPrazoMini
              origem="intimacao"
              descricao={fase(em.digitaDescricao, em.irUsarData)}
              focoDescricao={indice >= em.focaDescricao && indice < em.irUsarData}
              dataFinal={indice > em.usaData ? REPLICA.dataFinal : null}
              realceData={indice === em.irSalvar}
            />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      {naAnalise ? (
        <TelaAnalise caso={CARLOS} />
      ) : (
        <TelaPrazos
          aba={indice > em.escolheAba ? "processo" : "oab"}
          numero={fase(em.digita, em.irAcompanhar)}
          focoNumero={indice >= em.foca && indice <= em.acompanha}
          etapa={indice >= em.intimacao ? "acompanhando" : indice >= em.consultando ? "consultando" : "inicio"}
          mensagem={indice >= em.intimacao}
          intimacao={agendado ? "tratada" : indice >= em.intimacao ? "pendente" : null}
          prazos={agendado ? PRAZOS_COM_REPLICA : PRAZOS_ANTERIORES}
          novo={agendado ? REPLICA.id : null}
          rolarPara={agendado ? "prazo-novo" : indice >= em.intimacao ? "intimacao" : null}
        />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 11. calendário

// As datas da cena dependem de hoje (como na tela real): um prazo de três dias atrás pode cair
// fora da grade do mês, e a réplica pode vencer no mês seguinte (ou dois meses à frente, se o
// recesso de fim de ano suspender a contagem). O roteiro se ajusta a isso.
const NA_GRADE_DE_HOJE = new Set(semanasDoMes(MES_DE_HOJE).flat());
const alvoNaGrade = (prazo: PrazoMini) => (NA_GRADE_DE_HOJE.has(prazo.dataFinal) ? `chip-${prazo.id}` : null);
const MESES_ATE_A_REPLICA =
  MES_DA_REPLICA.ano * 12 + MES_DA_REPLICA.mes - (MES_DE_HOJE.ano * 12 + MES_DE_HOJE.mes);
const [VENCIDO, DE_HOJE, PROXIMO] = PRAZOS_ANTERIORES;

const CALENDARIO = roteiro([
  { nome: "prazos", ms: 1000, alvo: "trilha-calendario" },
  { nome: "abre", ms: 400, clique: true },
  { nome: "mes", ms: 1100, alvo: null },
  { nome: "vencido", ms: 1500, alvo: alvoNaGrade(VENCIDO) },
  { nome: "deHoje", ms: 1200, alvo: alvoNaGrade(DE_HOJE) },
  { nome: "proximo", ms: 1200, alvo: alvoNaGrade(PROXIMO) },
  // Só quando a réplica vence em outro mês: avança pela seta, como o advogado faria.
  { nome: "irMesSeguinte", ms: MESES_ATE_A_REPLICA > 0 ? 800 : 1, alvo: MESES_ATE_A_REPLICA > 0 ? "mes-seguinte" : undefined },
  { nome: "avanca", ms: MESES_ATE_A_REPLICA > 0 ? 450 : 1, clique: MESES_ATE_A_REPLICA > 0 },
  { nome: "avancaDeNovo", ms: MESES_ATE_A_REPLICA > 1 ? 450 : 1, clique: MESES_ATE_A_REPLICA > 1 },
  { nome: "replica", ms: 1300, alvo: `chip-${REPLICA.id}` },
  { nome: "abreDia", ms: 400, clique: true },
  { nome: "dia", ms: 1100, alvo: "dia-cumprido" },
  { nome: "editar", ms: 800, alvo: "dia-editar" },
  { nome: "excluir", ms: 800, alvo: "dia-excluir" },
  { nome: "irFechar", ms: 700, alvo: "dia-fechar" },
  { nome: "fecha", ms: 400, clique: true },
  { nome: "irMais", ms: 1100, alvo: `mais-${DIA_LIVRE}` },
  { nome: "clicaMais", ms: 400, clique: true },
  { nome: "novoNoDia", ms: 2200, alvo: "campo-data" },
  { nome: "fim", ms: 900, alvo: null },
]);

export function CenaCalendario() {
  const { indice, alvo, clique } = useRoteiro(CALENDARIO.batidas, CALENDARIO.em.vencido);
  const { em } = CALENDARIO;
  const naLista = indice <= em.abre;
  const mes =
    MESES_ATE_A_REPLICA > 1 && indice >= em.avancaDeNovo
      ? MES_DA_REPLICA
      : MESES_ATE_A_REPLICA > 0 && indice >= em.avanca
        ? mesVizinho(MES_DE_HOJE, 1)
        : MES_DE_HOJE;
  const realce =
    indice === em.vencido
      ? "vencido"
      : indice === em.deHoje
        ? "hoje"
        : indice === em.proximo
          ? "proximo"
          : indice === em.replica || indice === em.abreDia
            ? "futuro"
            : null;

  return (
    <Cena
      tela={naLista ? "Prazos" : "Calendário de prazos"}
      barra={{ secao: naLista ? "prazos" : "calendario" }}
      sobreposicao={
        indice >= em.dia && indice <= em.fecha ? (
          <ModalMini className="max-w-[340px]">
            <DiaDoCalendarioMini data={REPLICA.dataFinal} prazos={PRAZOS_COM_REPLICA} />
          </ModalMini>
        ) : indice >= em.novoNoDia && indice < em.fim ? (
          <ModalMini className="max-w-[330px]">
            <AgendarPrazoMini origem="dia" dataFinal={DIA_LIVRE} realceData />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      {naLista ? (
        <TelaPrazos etapa="acompanhando" intimacao="tratada" prazos={PRAZOS_COM_REPLICA} />
      ) : (
        <TelaCalendario mes={mes} prazos={PRAZOS_COM_REPLICA} realce={realce} />
      )}
    </Cena>
  );
}

// ------------------------------------------------------------------- 12. pronto

const PRONTO = roteiro([
  { nome: "inicio", ms: 1000, alvo: "conta" },
  { nome: "abreMenu", ms: 380, clique: true },
  { nome: "menu", ms: 750, alvo: "menu-configuracoes" },
  { nome: "abreConfiguracoes", ms: 380, clique: true },
  { nome: "configuracoes", ms: 900, alvo: "ver-tutorial" },
  { nome: "segura", ms: 1900 },
  { nome: "novo", ms: 1700, alvo: "trilha-novo" },
]);

export function CenaPronto() {
  const { indice, alvo, clique } = useRoteiro(PRONTO.batidas, PRONTO.em.configuracoes);
  const { em } = PRONTO;

  return (
    <Cena
      tela="Criar novo caso"
      barra={{ secao: "novo", casos: [], menuConta: indice >= em.menu && indice <= em.abreConfiguracoes }}
      sobreposicao={
        indice >= em.configuracoes && indice <= em.segura ? (
          <ModalMini className="max-w-[280px]">
            <ConfiguracoesMini />
          </ModalMini>
        ) : null
      }
      cursor={{ alvo, clique, marca: indice }}
    >
      <TelaNovoCaso />
    </Cena>
  );
}
