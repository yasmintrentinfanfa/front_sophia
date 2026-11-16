"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarPlus, Loader2, RefreshCw, TriangleAlert, X } from "lucide-react";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { CartaoIntimacao } from "@/components/prazos/cartao-intimacao";
import { FormularioAcompanhar } from "@/components/prazos/formulario-acompanhar";
import { ListaPrazos } from "@/components/prazos/lista-prazos";
import { ModalPrazo } from "@/components/prazos/modal-prazo";
import {
  prazosApi,
  type Monitoramento,
  type NovoMonitoramento,
  type NovoPrazo,
  type PainelPrazos as DadosPainel,
  type PrazoAgendado,
  type Publicacao,
  type ResultadoSincronizacao,
} from "@/lib/api/prazos";
import { pastaDoCaso, rotuloCaso } from "@/lib/casos/rotulo";
import { formatarDataHora } from "@/lib/formato";
import { hojeEmBrasilia } from "@/lib/prazos/calendario";
import { formatarProcesso, rotuloOab } from "@/lib/prazos/numeros";
import { cn } from "@/lib/utils";

type Mensagem = { tipo: "ok" | "erro"; texto: string } | null;
type EstadoModal = { modo: "novo"; publicacao: Publicacao | null } | { modo: "editar"; prazo: PrazoAgendado } | null;

function mensagemDaSincronizacao(resultado: ResultadoSincronizacao, manual: boolean): Mensagem {
  if (resultado.erros.length) return { tipo: "erro", texto: resultado.erros.join(" ") };
  if (resultado.novas) {
    const plural = resultado.novas === 1 ? "intimação nova chegou" : "intimações novas chegaram";
    return { tipo: "ok", texto: `${resultado.novas} ${plural} do DJEN.` };
  }
  return manual && resultado.consultados ? { tipo: "ok", texto: "Nada novo no DJEN desde a última consulta." } : null;
}

function rotuloMonitoramento(mon: Monitoramento) {
  return mon.tipo === "oab" ? rotuloOab(mon.oabNumero, mon.oabUf) : formatarProcesso(mon.numeroProcesso);
}

/**
 * Acompanhamento de prazos. Sem `casoId` é a tela geral (OAB e processos da conta); com
 * `casoId` mostra só os processos ligados ao caso — e tudo ali é opcional.
 */
export function PainelPrazos({ casoId }: { casoId?: string }) {
  const { casos } = useListaCasos();
  const [painel, setPainel] = useState<DadosPainel | null>(null);
  const [erroCarga, setErroCarga] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [filtro, setFiltro] = useState<"pendentes" | "todas">("pendentes");
  const [modal, setModal] = useState<EstadoModal>(null);
  const [remover, setRemover] = useState<Monitoramento | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemover, setErroRemover] = useState("");
  const hoje = hojeEmBrasilia();
  const modoCaso = Boolean(casoId);
  const caso = casoId ? casos.find((item) => item.id === casoId) ?? null : null;

  useEffect(() => {
    let ativo = true;
    let carregou = false;
    (async () => {
      try {
        const inicial = await prazosApi.obterPainel(casoId);
        if (!ativo) return;
        carregou = true;
        setPainel(inicial);
        if (!inicial.monitoramentos.length) return;
        // Ao abrir, consulta só o que está há mais de meia hora sem atualizar.
        setSincronizando(true);
        const resultado = await prazosApi.sincronizar(casoId);
        if (!ativo) return;
        setPainel(resultado.painel);
        setMensagem(mensagemDaSincronizacao(resultado, false));
      } catch (falha) {
        if (!ativo) return;
        const texto = falha instanceof Error ? falha.message : "Não foi possível carregar os prazos.";
        // Falha na carga = tela de erro; falha só na consulta ao DJEN = aviso sobre o painel já exibido.
        if (carregou) setMensagem({ tipo: "erro", texto });
        else setErroCarga(texto);
      } finally {
        if (ativo) setSincronizando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [casoId, tentativa]);

  const casoPorId = useMemo(() => {
    const mapa = new Map(casos.map((item) => [item.id, item]));
    return (id: string | null) => (id ? mapa.get(id) ?? null : null);
  }, [casos]);

  const casoDoProcesso = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const mon of painel?.monitoramentos ?? []) {
      if (mon.tipo === "processo" && mon.numeroProcesso && mon.casoId) mapa.set(mon.numeroProcesso, mon.casoId);
    }
    return mapa;
  }, [painel]);

  const casosAtivos = useMemo(() => casos.filter((item) => pastaDoCaso(item) === "ativo"), [casos]);

  const publicacoes = painel?.publicacoes ?? [];
  const pendentes = publicacoes.filter((pub) => pub.situacao === "pendente");
  const visiveis = filtro === "pendentes" ? pendentes : publicacoes;
  const ultimaAtualizacao = (painel?.monitoramentos ?? [])
    .map((mon) => mon.ultimaSincronizacao)
    .filter(Boolean)
    .sort()
    .at(-1);

  async function recarregar() {
    setPainel(await prazosApi.obterPainel(casoId));
  }

  async function atualizarAgora() {
    setSincronizando(true);
    setMensagem(null);
    try {
      const resultado = await prazosApi.sincronizar(casoId, true);
      setPainel(resultado.painel);
      setMensagem(mensagemDaSincronizacao(resultado, true));
    } catch (falha) {
      setMensagem({ tipo: "erro", texto: falha instanceof Error ? falha.message : "Não foi possível consultar o DJEN." });
    } finally {
      setSincronizando(false);
    }
  }

  async function acompanhar(dados: NovoMonitoramento) {
    setMensagem(null);
    const resposta = await prazosApi.acompanhar(dados, casoId);
    setPainel(resposta.painel);
    setMensagem(
      resposta.aviso
        ? { tipo: "erro", texto: `Acompanhamento salvo, mas a primeira consulta falhou: ${resposta.aviso}` }
        : { tipo: "ok", texto: "Acompanhamento salvo e DJEN consultado." },
    );
  }

  async function confirmarRemocao() {
    if (!remover) return;
    setRemovendo(true);
    setErroRemover("");
    try {
      await prazosApi.deixarDeAcompanhar(remover.id);
      await recarregar();
      setRemover(null);
    } catch (falha) {
      setErroRemover(falha instanceof Error ? falha.message : "Não foi possível remover.");
    } finally {
      setRemovendo(false);
    }
  }

  function trocarPublicacao(atualizada: Publicacao) {
    setPainel((atual) =>
      atual && { ...atual, publicacoes: atual.publicacoes.map((pub) => (pub.id === atualizada.id ? atualizada : pub)) },
    );
  }

  function definirSituacaoLocal(publicacaoId: string, situacao: Publicacao["situacao"]) {
    setPainel((atual) =>
      atual && {
        ...atual,
        publicacoes: atual.publicacoes.map((pub) => (pub.id === publicacaoId ? { ...pub, situacao } : pub)),
      },
    );
  }

  async function ligarAoCaso(publicacao: Publicacao, destino: string) {
    const existente = painel?.monitoramentos.find(
      (mon) => mon.tipo === "processo" && mon.numeroProcesso === publicacao.numeroProcesso,
    );
    if (existente) await prazosApi.ligarAoCaso(existente.id, destino);
    else await prazosApi.acompanhar({ tipo: "processo", numeroProcesso: publicacao.numeroProcesso }, destino);
    await recarregar();
    const ligado = casoPorId(destino);
    setMensagem({
      tipo: "ok",
      texto: `Processo ${formatarProcesso(publicacao.numeroProcesso)} ligado ao caso ${ligado ? rotuloCaso(ligado) : ""}.`,
    });
  }

  async function salvarPrazo(dados: NovoPrazo) {
    if (modal?.modo === "editar") {
      const atualizado = await prazosApi.alterarPrazo(modal.prazo.id, {
        descricao: dados.descricao,
        dataFinal: dados.dataFinal,
      });
      setPainel((atual) => atual && { ...atual, prazos: atual.prazos.map((p) => (p.id === atualizado.id ? atualizado : p)) });
    } else {
      const novo = await prazosApi.agendar({ ...dados, ...(casoId ? { casoId } : {}) });
      setPainel((atual) => atual && { ...atual, prazos: [...atual.prazos, novo] });
      if (dados.publicacaoId) definirSituacaoLocal(dados.publicacaoId, "agendada");
    }
    setModal(null);
  }

  async function alternarCumprido(prazo: PrazoAgendado) {
    const atualizado = await prazosApi.alterarPrazo(prazo.id, { cumprido: !prazo.cumprido });
    setPainel((atual) => atual && { ...atual, prazos: atual.prazos.map((p) => (p.id === atualizado.id ? atualizado : p)) });
  }

  async function excluirPrazo(prazo: PrazoAgendado) {
    await prazosApi.excluirPrazo(prazo.id);
    setPainel((atual) => {
      if (!atual) return atual;
      const prazos = atual.prazos.filter((p) => p.id !== prazo.id);
      const origem = prazo.publicacaoId;
      const aindaTem = origem && prazos.some((p) => p.publicacaoId === origem);
      return {
        ...atual,
        prazos,
        publicacoes: atual.publicacoes.map((pub) =>
          pub.id === origem && !aindaTem ? { ...pub, situacao: "pendente" as const } : pub,
        ),
      };
    });
  }

  const vazioNoCaso = modoCaso && painel && !painel.monitoramentos.length && !painel.prazos.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-3 max-[700px]:px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <BotaoVoltar destino={casoId ? `/casos/${casoId}/analise` : "/casos"} />
            <h1 className="text-[22px] leading-none font-bold">{modoCaso ? "Prazos do caso" : "Prazos"}</h1>
          </div>
          <p className="text-tinta-suave text-[13px]">
            {modoCaso && caso
              ? `${rotuloCaso(caso)} · intimações do DJEN e prazos deste caso`
              : "Intimações do Diário de Justiça Eletrônico Nacional (DJEN) e os prazos que você agendou"}
          </p>
        </div>
        {painel?.monitoramentos.length ? (
          <div className="flex items-center gap-3">
            <span className="text-tinta-suave text-[11px]" aria-live="polite">
              {sincronizando
                ? "Consultando o DJEN…"
                : ultimaAtualizacao
                  ? `Atualizado em ${formatarDataHora(ultimaAtualizacao)}`
                  : "Ainda não consultado"}
            </span>
            <button
              type="button"
              onClick={() => void atualizarAgora()}
              disabled={sincronizando}
              className="pressionavel border-borda bg-campo flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-60"
            >
              <RefreshCw className={cn("size-3.5", sincronizando && "animate-spin")} aria-hidden />
              Atualizar agora
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex w-full max-w-[960px] flex-col gap-6 px-7 pt-1 pb-8 max-[700px]:px-4">
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
        ) : !painel ? (
          <p role="status" className="text-tinta-suave text-[13px]">
            Carregando prazos…
          </p>
        ) : vazioNoCaso ? (
          <section className="bg-campo border-borda flex flex-col gap-3 rounded-[12px] border px-5 py-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold">Acompanhar os prazos deste caso (opcional)</h2>
              <p className="text-tinta-suave text-[12px] leading-relaxed">
                Se este caso já virou um processo, informe o número para receber aqui as intimações do DJEN e agendar os
                prazos. Se ainda não há processo — ou se ele não vai ser protocolado —, não precisa fazer nada.
              </p>
            </div>
            <FormularioAcompanhar somenteProcesso aoEnviar={acompanhar} />
            <button
              type="button"
              onClick={() => setModal({ modo: "novo", publicacao: null })}
              className="text-destaque w-fit text-[12px] font-semibold"
            >
              Agendar um prazo sem número de processo
            </button>
          </section>
        ) : (
          <>
            <Secao
              titulo={modoCaso ? "Processo acompanhado" : "Acompanhando"}
              descricao={
                modoCaso
                  ? "As intimações deste número chegam aqui e na tela geral de prazos."
                  : "Informe sua OAB para receber todas as intimações em seu nome, ou um número de processo específico."
              }
            >
              {painel.monitoramentos.length ? (
                <ul className="flex flex-wrap gap-2">
                  {painel.monitoramentos.map((mon) => {
                    const ligado = !modoCaso ? casoPorId(mon.casoId) : null;
                    return (
                      <li
                        key={mon.id}
                        className="bg-chip border-borda flex h-8 max-w-full items-center gap-2 rounded-full border pr-1 pl-3 text-[12px]"
                      >
                        <span className={cn("truncate font-medium", mon.tipo === "processo" && "font-mono tracking-tight")}>
                          {rotuloMonitoramento(mon)}
                        </span>
                        {ligado ? <span className="text-destaque truncate font-medium">· {rotuloCaso(ligado)}</span> : null}
                        {mon.ultimoErro ? (
                          <span title={mon.ultimoErro} className="text-amber-600 dark:text-amber-400">
                            <TriangleAlert className="size-3.5" aria-hidden />
                            <span className="sr-only">Última consulta falhou: {mon.ultimoErro}</span>
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setErroRemover("");
                            setRemover(mon);
                          }}
                          aria-label={`Deixar de acompanhar ${rotuloMonitoramento(mon)}`}
                          title="Deixar de acompanhar"
                          className="text-tinta-suave hover:bg-tinta/10 flex size-6 shrink-0 items-center justify-center rounded-full"
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <FormularioAcompanhar somenteProcesso={modoCaso} aoEnviar={acompanhar} />
            </Secao>

            <Secao
              titulo="Prazos agendados"
              acao={
                <button
                  type="button"
                  onClick={() => setModal({ modo: "novo", publicacao: null })}
                  className="pressionavel border-borda bg-campo flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold"
                >
                  <CalendarPlus className="size-3.5" aria-hidden />
                  Novo prazo
                </button>
              }
            >
              <ListaPrazos
                prazos={painel.prazos}
                hoje={hoje}
                casoPorId={casoPorId}
                mostrarCaso={!modoCaso}
                aoEditar={(prazo) => setModal({ modo: "editar", prazo })}
                aoAlternarCumprido={alternarCumprido}
                aoExcluir={excluirPrazo}
              />
            </Secao>

            <Secao
              titulo="Intimações"
              descricao="Leia, agende o prazo ou marque que não há providência. A Sophia não calcula o prazo por você."
              acao={
                <div role="group" aria-label="Filtrar intimações" className="bg-chip border-borda flex rounded-[8px] border p-0.5">
                  {(
                    [
                      ["pendentes", `A tratar (${pendentes.length})`],
                      ["todas", `Todas (${publicacoes.length})`],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={filtro === valor}
                      onClick={() => setFiltro(valor)}
                      className={cn(
                        "h-7 rounded-[6px] px-3 text-[12px] font-medium",
                        filtro === valor ? "bg-campo text-destaque shadow-sm" : "text-tinta-suave hover:text-tinta",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              }
            >
              {sincronizando && !publicacoes.length ? (
                <p className="text-tinta-suave flex items-center gap-2 text-[13px]">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Consultando o DJEN…
                </p>
              ) : visiveis.length === 0 ? (
                <p className="text-tinta-suave text-[13px]">
                  {!painel.monitoramentos.length
                    ? "Acompanhe uma OAB ou um processo para as intimações aparecerem aqui."
                    : filtro === "pendentes" && publicacoes.length
                      ? "Nenhuma intimação a tratar. Tudo em dia."
                      : "Nenhuma intimação encontrada no DJEN para o que você acompanha."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {visiveis.map((pub) => (
                    <li key={pub.id}>
                      <CartaoIntimacao
                        publicacao={pub}
                        caso={casoPorId(casoDoProcesso.get(pub.numeroProcesso) ?? null)}
                        casosParaLigar={modoCaso ? undefined : casosAtivos}
                        aoAgendar={() => setModal({ modo: "novo", publicacao: pub })}
                        aoMarcar={async (situacao) => trocarPublicacao(await prazosApi.marcarSituacao(pub.id, situacao))}
                        aoLigarCaso={modoCaso ? undefined : (destino) => ligarAoCaso(pub, destino)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Secao>

            <p className="text-tinta-suave text-[11px] leading-relaxed">
              Fonte: API pública de comunicações processuais do CNJ (DJEN). Ficam de fora citações pelo Domicílio Judicial
              Eletrônico, intimações feitas só dentro do sistema do tribunal e publicações do STF, que tem diário próprio.
              Continue acompanhando esses canais.
            </p>
          </>
        )}
      </div>

      <ModalPrazo
        aberto={modal !== null}
        publicacao={modal?.modo === "novo" ? modal.publicacao : null}
        prazo={modal?.modo === "editar" ? modal.prazo : null}
        pedirProcesso={modal?.modo === "novo" && !modal.publicacao}
        aoFechar={() => setModal(null)}
        aoSalvar={salvarPrazo}
      />

      <ModalConfirmar
        aberto={remover !== null}
        titulo="Deixar de acompanhar?"
        descricao={
          remover
            ? `${rotuloMonitoramento(remover)} deixa de ser consultado no DJEN. As intimações que ainda não viraram prazo saem da lista; os prazos agendados continuam.`
            : ""
        }
        confirmar={removendo ? "Removendo…" : "Deixar de acompanhar"}
        processando={removendo}
        erro={erroRemover || undefined}
        className="max-w-[360px]"
        aoFechar={() => {
          if (!removendo) setRemover(null);
        }}
        aoConfirmar={() => void confirmarRemocao()}
      />
    </div>
  );
}

function Secao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={titulo}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">{titulo}</h2>
          {descricao ? <p className="text-tinta-suave text-[12px]">{descricao}</p> : null}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
