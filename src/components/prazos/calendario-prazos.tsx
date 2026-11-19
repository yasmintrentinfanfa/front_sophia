"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, List, Plus, TriangleAlert } from "lucide-react";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ListaPrazos } from "@/components/prazos/lista-prazos";
import { ModalPrazo } from "@/components/prazos/modal-prazo";
import { Modal } from "@/components/ui/modal";
import { prazosApi, type NovoPrazo, type PrazoAgendado } from "@/lib/api/prazos";
import type { Caso } from "@/lib/api/types";
import { rotuloCaso } from "@/lib/casos/rotulo";
import { emRecesso, formatarData, hojeEmBrasilia, nomeDoFeriado, type DataIso } from "@/lib/prazos/calendario";
import { descreverPrazo, ordenarPrazos, urgenciaDoPrazo, type UrgenciaPrazo } from "@/lib/prazos/estado";
import {
  DIAS_DA_SEMANA,
  diaDaSemana,
  diaPorExtenso,
  mesDe,
  mesVizinho,
  mesmoMes,
  prazosPorDia,
  semanasDoMes,
  tituloDoMes,
  type Mes,
} from "@/lib/prazos/mes";
import { formatarProcesso } from "@/lib/prazos/numeros";
import { cn } from "@/lib/utils";

type Situacao = "a_cumprir" | "todos";
type Mensagem = { tipo: "ok" | "erro"; texto: string } | null;
type EstadoModal = { modo: "novo"; data: DataIso | null } | { modo: "editar"; prazo: PrazoAgendado } | null;

/** Até quantos prazos cabem na célula; acima disso, os primeiros e um "+N mais". */
const MAXIMO_NA_CELULA = 3;

/** Vencido: riscado e em vermelho. As demais cores seguem a lista de prazos. */
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

const BOTAO =
  "pressionavel border-borda bg-campo flex h-8 items-center justify-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50";
const BOTAO_PRINCIPAL =
  "pressionavel bg-acao text-acao-tinta flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Calendário de prazos da conta: cada prazo agendado aparece no dia da data final. Vencido e
 * não cumprido fica riscado e em vermelho. Clicar num prazo (ou num dia, no celular) abre os
 * prazos do dia, com as mesmas ações da lista; o "+" de cada dia agenda um prazo nele.
 */
export function CalendarioPrazos() {
  const { casos } = useListaCasos();
  const hoje = hojeEmBrasilia();
  const [mes, setMes] = useState<Mes>(() => mesDe(hojeEmBrasilia()));
  const [prazos, setPrazos] = useState<PrazoAgendado[] | null>(null);
  const [erroCarga, setErroCarga] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [situacao, setSituacao] = useState<Situacao>("a_cumprir");
  const [filtroCaso, setFiltroCaso] = useState("todos");
  const [dia, setDia] = useState<DataIso | null>(null);
  const [modal, setModal] = useState<EstadoModal>(null);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useEffect(() => {
    let ativo = true;
    prazosApi
      .obterPainel()
      .then((painel) => {
        if (ativo) setPrazos(painel.prazos);
      })
      .catch((falha: unknown) => {
        if (ativo) setErroCarga(falha instanceof Error ? falha.message : "Não foi possível carregar os prazos.");
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const casoPorId = useMemo(() => {
    const mapa = new Map(casos.map((item) => [item.id, item]));
    return (id: string | null) => (id ? (mapa.get(id) ?? null) : null);
  }, [casos]);

  const todos = useMemo(() => prazos ?? [], [prazos]);
  // Filtro de caso só aparece se algum prazo estiver ligado a um caso.
  const casosComPrazo = useMemo(() => {
    const ids = new Set(todos.map((prazo) => prazo.casoId).filter(Boolean));
    return casos.filter((caso) => ids.has(caso.id));
  }, [casos, todos]);
  // Caso escolhido que deixou de ter prazos (o último foi excluído, por exemplo) volta para
  // "todos": sem isso o calendário ficaria vazio e o seletor, sem a opção marcada.
  const casoFiltrado =
    filtroCaso === "todos" || filtroCaso === "sem_caso" || casosComPrazo.some((caso) => caso.id === filtroCaso)
      ? filtroCaso
      : "todos";
  const doCaso = todos.filter((prazo) =>
    casoFiltrado === "todos" ? true : casoFiltrado === "sem_caso" ? !prazo.casoId : prazo.casoId === casoFiltrado,
  );
  const aCumprir = doCaso.filter((prazo) => !prazo.cumprido);
  const visiveis = situacao === "todos" ? doCaso : aCumprir;
  const porDia = prazosPorDia(ordenarPrazos(visiveis));
  const semanas = semanasDoMes(mes);

  const noMes = doCaso.filter((prazo) => mesmoMes(mesDe(prazo.dataFinal), mes));
  const aCumprirNoMes = noMes.filter((prazo) => !prazo.cumprido).length;
  const vencidosNoMes = noMes.filter((prazo) => urgenciaDoPrazo(prazo, hoje) === "vencido").length;
  const vencidosForaDoMes = ordenarPrazos(
    aCumprir.filter((prazo) => prazo.dataFinal < hoje && !mesmoMes(mesDe(prazo.dataFinal), mes)),
  );
  const prazosDoDia = dia ? ordenarPrazos(doCaso.filter((prazo) => prazo.dataFinal === dia)) : [];

  function trocar(atualizado: PrazoAgendado) {
    setPrazos((atual) => atual && atual.map((prazo) => (prazo.id === atualizado.id ? atualizado : prazo)));
  }

  async function salvarPrazo(dados: NovoPrazo) {
    if (modal?.modo === "editar") {
      const atualizado = await prazosApi.alterarPrazo(modal.prazo.id, {
        descricao: dados.descricao,
        dataFinal: dados.dataFinal,
      });
      trocar(atualizado);
      setMes(mesDe(atualizado.dataFinal));
      setMensagem({ tipo: "ok", texto: `Prazo “${atualizado.descricao}” salvo para ${formatarData(atualizado.dataFinal)}.` });
    } else {
      const novo = await prazosApi.agendar(dados);
      setPrazos((atual) => [...(atual ?? []), novo]);
      setMes(mesDe(novo.dataFinal));
      setMensagem({ tipo: "ok", texto: `Prazo “${novo.descricao}” agendado para ${formatarData(novo.dataFinal)}.` });
    }
    setModal(null);
  }

  async function alternarCumprido(prazo: PrazoAgendado) {
    trocar(await prazosApi.alterarPrazo(prazo.id, { cumprido: !prazo.cumprido }));
  }

  async function excluirPrazo(prazo: PrazoAgendado) {
    await prazosApi.excluirPrazo(prazo.id);
    setPrazos((atual) => atual && atual.filter((item) => item.id !== prazo.id));
  }

  const feriadoDoDia = dia ? nomeDoFeriado(dia) : null;

  return (
    <>
      <header className="flex w-full shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-3 max-[700px]:px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <BotaoVoltar destino="/casos" />
            <h1 className="text-[22px] leading-none font-bold">Calendário de prazos</h1>
          </div>
          <p className="text-tinta-suave text-[13px]">Os prazos que você agendou, no dia em que cada um vence.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/casos/prazos" className={BOTAO}>
            <List className="size-3.5" aria-hidden />
            Lista e intimações
          </Link>
          <button type="button" onClick={() => setModal({ modo: "novo", data: null })} className={BOTAO_PRINCIPAL}>
            <Plus className="size-3.5" aria-hidden />
            Novo prazo
          </button>
        </div>
      </header>

      {/* Única rolagem da tela, como em Prazos; `relative` prende os rótulos `sr-only` aqui dentro. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex w-full max-w-[1120px] flex-col gap-3 px-7 pt-1 pb-8 max-[700px]:px-4">
          {mensagem ? (
            <p
              role={mensagem.tipo === "erro" ? "alert" : "status"}
              className={cn(
                "rounded-[8px] px-3 py-2.5 text-[12px] font-medium",
                mensagem.tipo === "erro" ? "bg-destructive/10 text-destructive" : "bg-destaque-suave text-destaque",
              )}
            >
              {mensagem.texto}
            </p>
          ) : null}

          {erroCarga ? (
            <div role="alert" className="text-[13px]">
              <p className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">{erroCarga}</p>
              <button
                type="button"
                className="text-destaque mt-2 underline"
                onClick={() => {
                  setErroCarga("");
                  setTentativa((valor) => valor + 1);
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : prazos === null ? (
            <p role="status" className="text-tinta-suave text-[13px]">
              Carregando prazos…
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Quais prazos mostrar" className="bg-chip border-borda flex rounded-[8px] border p-0.5">
                  {(
                    [
                      ["a_cumprir", `A cumprir (${aCumprir.length})`],
                      ["todos", `Todos (${doCaso.length})`],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={situacao === valor}
                      onClick={() => setSituacao(valor)}
                      className={cn(
                        "h-7 rounded-[6px] px-3 text-[12px] font-medium",
                        situacao === valor ? "bg-campo text-destaque shadow-sm" : "text-tinta-suave hover:text-tinta",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
                {casosComPrazo.length ? (
                  <select
                    aria-label="Filtrar por caso"
                    value={casoFiltrado}
                    onChange={(evento) => setFiltroCaso(evento.target.value)}
                    className="border-borda bg-campo focus:border-destaque h-8 max-w-[260px] rounded-[8px] border px-2 text-[12px] outline-none"
                  >
                    <option value="todos">Todos os casos</option>
                    <option value="sem_caso">Sem caso ligado</option>
                    {casosComPrazo.map((caso) => (
                      <option key={caso.id} value={caso.id}>
                        {rotuloCaso(caso)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              {!todos.length ? (
                <p className="bg-campo border-borda text-tinta-suave rounded-[10px] border px-3 py-2.5 text-[12px]">
                  Você ainda não agendou prazos. Use o <strong className="text-tinta">+</strong> de um dia ou o botão Novo
                  prazo, ou agende a partir de uma intimação em Prazos.
                </p>
              ) : null}

              {vencidosForaDoMes.length ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[8px] bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-700 dark:text-red-300">
                  <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                  <span>
                    {plural(vencidosForaDoMes.length, "prazo vencido", "prazos vencidos")} em outros meses, sem marcar como
                    cumprido.
                  </span>
                  <button
                    type="button"
                    onClick={() => setMes(mesDe(vencidosForaDoMes[0].dataFinal))}
                    className="underline underline-offset-2"
                  >
                    Ir para o mais antigo
                  </button>
                </div>
              ) : null}

              <section aria-label="Calendário" className="bg-campo border-borda @container overflow-hidden rounded-[12px] border">
                <div className="border-borda flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 max-[700px]:px-3">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <h2 className="text-[17px] font-semibold" aria-live="polite">
                      {tituloDoMes(mes)}
                    </h2>
                    <p className="text-tinta-suave text-[12px]">
                      {aCumprirNoMes ? plural(aCumprirNoMes, "prazo a cumprir", "prazos a cumprir") : "Nada a cumprir neste mês"}
                      {vencidosNoMes ? (
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          {" "}
                          · {plural(vencidosNoMes, "vencido", "vencidos")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={mesmoMes(mes, mesDe(hoje))}
                      onClick={() => setMes(mesDe(hoje))}
                      className={BOTAO}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setMes((atual) => mesVizinho(atual, -1))}
                      aria-label="Mês anterior"
                      title="Mês anterior"
                      className={cn(BOTAO, "w-8 px-0")}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMes((atual) => mesVizinho(atual, 1))}
                      aria-label="Próximo mês"
                      title="Próximo mês"
                      className={cn(BOTAO, "w-8 px-0")}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <div role="table" aria-label={`Prazos de ${tituloDoMes(mes)}`}>
                  <div role="row" className="border-borda grid grid-cols-7 border-b">
                    {DIAS_DA_SEMANA.map((nome) => (
                      <div
                        key={nome}
                        role="columnheader"
                        className="text-tinta-suave py-2 text-center text-[11px] font-semibold tracking-wide"
                      >
                        {nome}
                      </div>
                    ))}
                  </div>
                  {semanas.map((semana, indice) => (
                    <div
                      key={semana[0]}
                      role="row"
                      className={cn("grid grid-cols-7", indice === semanas.length - 1 && "[&>*]:border-b-0")}
                    >
                      {semana.map((data) => (
                        <CelulaDoDia
                          key={data}
                          data={data}
                          mes={mes}
                          hoje={hoje}
                          prazos={porDia.get(data) ?? []}
                          casoPorId={casoPorId}
                          aoAbrirDia={setDia}
                          aoAgendar={(alvo) => setModal({ modo: "novo", data: alvo })}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <ul aria-label="Legenda" className="text-tinta-suave flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                {(["vencido", "hoje", "proximo", "futuro", "cumprido"] as const).map((urgencia) => (
                  <li key={urgencia}>
                    <span className={cn("rounded-[5px] border-t-2 px-1.5 py-[2px]", ESTILO[urgencia].chip)}>
                      {ESTILO[urgencia].rotulo}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="border-borda bg-tinta/[0.05] size-3 rounded-[3px] border" />
                  Recesso forense (20/12 a 20/01)
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <Modal
        aberto={dia !== null}
        aoFechar={() => setDia(null)}
        titulo={dia ? diaPorExtenso(dia) : ""}
        descricao={
          [
            feriadoDoDia ? `Feriado nacional: ${feriadoDoDia}.` : "",
            dia && emRecesso(dia) ? "Recesso forense: prazos em dias úteis ficam suspensos (art. 220 do CPC)." : "",
            prazosDoDia.length ? plural(prazosDoDia.length, "prazo neste dia.", "prazos neste dia.") : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className="max-w-[560px]"
      >
        <div className="mt-3 flex flex-col gap-3">
          {prazosDoDia.length ? (
            <ListaPrazos
              prazos={prazosDoDia}
              hoje={hoje}
              casoPorId={casoPorId}
              mostrarCaso
              cumpridosVisiveis
              aoEditar={(prazo) => {
                setDia(null);
                setModal({ modo: "editar", prazo });
              }}
              aoAlternarCumprido={alternarCumprido}
              aoExcluir={excluirPrazo}
            />
          ) : (
            <p className="text-tinta-suave text-[13px]">Nenhum prazo neste dia.</p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setDia(null)} className={cn(BOTAO, "h-9")}>
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                const alvo = dia;
                setDia(null);
                setModal({ modo: "novo", data: alvo });
              }}
              className={cn(BOTAO_PRINCIPAL, "h-9")}
            >
              <Plus className="size-3.5" aria-hidden />
              Agendar prazo neste dia
            </button>
          </div>
        </div>
      </Modal>

      <ModalPrazo
        aberto={modal !== null}
        prazo={modal?.modo === "editar" ? modal.prazo : null}
        pedirProcesso={modal?.modo === "novo"}
        dataInicial={modal?.modo === "novo" ? modal.data : null}
        aoFechar={() => setModal(null)}
        aoSalvar={salvarPrazo}
      />
    </>
  );
}

/**
 * Um dia da grade. Na tela larga, os prazos aparecem como etiquetas (clicar abre o dia) e o
 * "+" agenda um prazo nele. Na estreita (celular, ou com a lista de casos aberta numa tela
 * pequena), viram pontos coloridos e o dia inteiro é um botão que abre os prazos dele.
 */
function CelulaDoDia({
  data,
  mes,
  hoje,
  prazos,
  casoPorId,
  aoAbrirDia,
  aoAgendar,
}: {
  data: DataIso;
  mes: Mes;
  hoje: DataIso;
  prazos: PrazoAgendado[];
  casoPorId: (id: string | null) => Caso | null;
  aoAbrirDia: (data: DataIso) => void;
  aoAgendar: (data: DataIso) => void;
}) {
  const doMes = mesmoMes(mesDe(data), mes);
  const feriado = nomeDoFeriado(data);
  const fimDeSemana = diaDaSemana(data) === 0 || diaDaSemana(data) === 6;
  const ehHoje = data === hoje;
  const cabem = prazos.length > MAXIMO_NA_CELULA ? MAXIMO_NA_CELULA - 1 : prazos.length;
  const resumo = `${diaPorExtenso(data)}${feriado ? ` (${feriado})` : ""}: ${
    prazos.length ? plural(prazos.length, "prazo", "prazos") : "nenhum prazo"
  }`;

  return (
    <div
      role="cell"
      className={cn(
        "group border-borda relative flex min-h-[116px] min-w-0 flex-col gap-1 border-r border-b p-1.5 last:border-r-0 @max-2xl:min-h-[64px] @max-2xl:p-1",
        emRecesso(data) && "bg-tinta/[0.05]",
        !doMes && "bg-fundo/60",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] @max-2xl:size-5 @max-2xl:text-[11px]",
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
        <button
          type="button"
          onClick={() => aoAgendar(data)}
          aria-label={`Agendar prazo em ${formatarData(data)}`}
          title="Agendar prazo neste dia"
          className="text-tinta-suave hover:bg-tinta/5 hover:text-destaque flex size-6 items-center justify-center rounded-[6px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 @max-2xl:hidden"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>

      {feriado ? (
        <p className="text-tinta-suave truncate text-[10px] leading-tight @max-2xl:hidden" title={`Feriado nacional: ${feriado}`}>
          {feriado}
        </p>
      ) : null}

      {prazos.length ? (
        <ul className="flex min-w-0 flex-col gap-1 @max-2xl:hidden">
          {prazos.slice(0, cabem).map((prazo) => {
            const urgencia = urgenciaDoPrazo(prazo, hoje);
            const caso = casoPorId(prazo.casoId);
            const detalhes = [
              descreverPrazo(prazo, hoje),
              prazo.numeroProcesso ? formatarProcesso(prazo.numeroProcesso) : "",
              caso ? rotuloCaso(caso) : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={prazo.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => aoAbrirDia(data)}
                  title={`${prazo.descricao} · ${detalhes}`}
                  aria-label={`${prazo.descricao}: ${detalhes}`}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-1 rounded-[5px] border-t-2 px-1.5 py-[3px] text-left text-[11px] leading-tight hover:brightness-95",
                    ESTILO[urgencia].chip,
                  )}
                >
                  {prazo.cumprido ? <Check className="size-3 shrink-0" aria-hidden /> : null}
                  <span className="truncate">{prazo.descricao}</span>
                </button>
              </li>
            );
          })}
          {prazos.length > cabem ? (
            <li>
              <button
                type="button"
                onClick={() => aoAbrirDia(data)}
                className="text-tinta-suave hover:text-tinta px-1 text-[11px] font-semibold"
              >
                + {prazos.length - cabem} mais
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => aoAbrirDia(data)}
        aria-label={resumo}
        className="absolute inset-0 hidden items-end justify-center pb-1.5 @max-2xl:flex"
      >
        {prazos.length ? (
          <span className="flex items-center gap-0.5" aria-hidden>
            {prazos.slice(0, 3).map((prazo) => (
              <span key={prazo.id} className={cn("size-1.5 rounded-full", ESTILO[urgenciaDoPrazo(prazo, hoje)].ponto)} />
            ))}
            {prazos.length > 3 ? <span className="text-tinta-suave text-[9px] leading-none">+</span> : null}
          </span>
        ) : null}
      </button>
    </div>
  );
}
