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

const ETAPAS_JORNADA: { titulo: string; detalhe: string; Miniatura: ComponentType }[] = [
  { titulo: "Novo caso", detalhe: "Cliente e área jurídica", Miniatura: MiniNovo },
  { titulo: "Repositório", detalhe: "Grave, envie ou escreva", Miniatura: MiniRepositorio },
  { titulo: "Análise", detalhe: "Teses e jurisprudência", Miniatura: MiniAnalise },
  { titulo: "Chat e peças", detalhe: "Dúvidas e minutas", Miniatura: MiniChat },
];

function Jornada() {
  const { compacto } = usePalco();
  const { indice } = useRoteiro(JORNADA.batidas, JORNADA.em.tudo);
  return (
    <Moldura tela="Sophia">
      <div className={cn("flex flex-1 flex-col items-center justify-center px-7", compacto ? "gap-5" : "gap-7")}>
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center gap-1.5 duration-700">
          <p className="text-destaque text-[30px] leading-none font-bold tracking-tight">SOPHIA</p>
          <p className="text-tinta-suave text-[12px]">Da conversa com o cliente à minuta</p>
        </div>
        <ol className={cn("grid w-full", compacto ? "max-w-[300px] grid-cols-2 gap-x-4 gap-y-3" : "grid-cols-4 gap-4")}>
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
  { nome: "resposta", ms: 1200, alvo: "campo-pergunta" },
  { nome: "digita", ms: 1900 },
  { nome: "irEnviar2", ms: 560, alvo: "enviar" },
  { nome: "envia2", ms: 380, clique: true },
  { nome: "pensando2", ms: 750 },
  { nome: "resposta2", ms: 1100, alvo: "atualizar" },
  { nome: "atualiza", ms: 380, clique: true },
  { nome: "atualizando", ms: 1300 },
  { nome: "atualizada", ms: 1800, alvo: "ver-cards" },
]);

const FATO_NOVO = "Ele recebia R$ 400 por Pix, fora do holerite.";

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
  { papel: "advogado", conteudo: FATO_NOVO },
  { papel: "assistente", conteudo: "Anotado. O valor pago por fora integra o salário e entra no cálculo das verbas." },
];

export function CenaChat() {
  const { indice, alvo, clique } = useRoteiro(CHAT.batidas, CHAT.em.atualizada);
  const { em } = CHAT;
  const naAnalise = indice <= em.abre;
  const mensagens = CONVERSA.slice(
    0,
    indice >= em.resposta2 ? 4 : indice >= em.pensando2 ? 3 : indice >= em.resposta ? 2 : indice >= em.pensando ? 1 : 0,
  );
  const pensando = indice === em.pensando || indice === em.pensando2;
  const atualizacao = indice >= em.atualizada ? "pronta" : indice >= em.atualizando ? "atualizando" : "nenhuma";
  const pergunta =
    indice >= em.irEnviar && indice <= em.envia ? (
      ASSUNTOS_CHAT[1]
    ) : indice === em.digita ? (
      <TextoDigitado texto={FATO_NOVO} fase="digitando" />
    ) : indice >= em.irEnviar2 && indice <= em.envia2 ? (
      FATO_NOVO
    ) : null;

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
          podeAtualizar={mensagens.length > 1 && !pensando && atualizacao !== "atualizando"}
          atualizacao={atualizacao}
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
  { nome: "documentos", ms: 1300, alvo: "adicionar-ao-caso" },
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

// ------------------------------------------------------------------- 10. pronto

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
