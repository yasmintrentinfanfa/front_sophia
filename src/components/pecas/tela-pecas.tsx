"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, FileText, Search } from "lucide-react";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { IconeFase } from "@/components/pecas/icone-fase";
import { MinutaPeca } from "@/components/pecas/minuta-peca";
import { ModalModeloPeca } from "@/components/pecas/modal-modelo-peca";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";
import {
  gruposSugeridos,
  pecasApi,
  type CatalogoPecas,
  type ModeloPeca,
  type PecaGerada,
} from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

const TODOS = "todos";

/** Busca sem diferenciar acento e maiúscula: "contestacao" acha "Contestação". */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Catálogo de modelos de peça e minutas do caso. `destinoVoltar` e `destinoAnalise` recebem
 * o id do caso porque a tela abre tanto pela análise quanto pelo repositório.
 */
export function TelaPecas({
  destinoVoltar,
  destinoAnalise,
}: {
  destinoVoltar: (casoId: string) => string;
  destinoAnalise: (casoId: string) => string;
}) {
  return (
    <ConteudoCaso>
      {(dados) => (
        <Pecas dados={dados} destinoVoltar={destinoVoltar(dados.casoId)} destinoAnalise={destinoAnalise(dados.casoId)} />
      )}
    </ConteudoCaso>
  );
}

function Pecas({
  dados,
  destinoVoltar,
  destinoAnalise,
}: {
  dados: DadosCaso;
  destinoVoltar: string;
  destinoAnalise: string;
}) {
  const casoId = dados.casoId;
  const { casos } = useListaCasos();
  const area = casos.find((caso) => caso.id === casoId)?.area;
  const [catalogo, setCatalogo] = useState<CatalogoPecas | null>(null);
  const [pecas, setPecas] = useState<PecaGerada[]>([]);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState(TODOS);
  const [modeloAberto, setModeloAberto] = useState<ModeloPeca | null>(null);
  const [pecaAberta, setPecaAberta] = useState<PecaGerada | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const podeGerar = dados.analise !== null || dados.versoesAnalise.length > 0;

  useEffect(() => {
    let ativo = true;
    Promise.all([pecasApi.obterCatalogo(), pecasApi.listar(casoId)])
      .then(([novoCatalogo, lista]) => {
        if (!ativo) return;
        setCatalogo(novoCatalogo);
        setPecas(lista);
      })
      .catch((falha) => {
        if (ativo) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar os modelos.");
      });
    return () => {
      ativo = false;
    };
  }, [casoId, tentativa]);

  const sugeridos = useMemo(() => gruposSugeridos(area), [area]);

  const visiveis = useMemo(() => {
    if (!catalogo) return [];
    const termo = normalizar(busca.trim());
    return catalogo.modelos.filter(
      (modelo) =>
        (grupo === TODOS || modelo.grupo === grupo) &&
        (!termo || normalizar(`${modelo.nome} ${modelo.descricao} ${modelo.quandoUsar}`).includes(termo)),
    );
  }, [catalogo, busca, grupo]);

  // Sem filtro, os grupos da área do caso aparecem primeiro.
  const secoes = useMemo(() => {
    if (!catalogo) return [];
    const ordem = [...sugeridos, ...Object.keys(catalogo.grupos).filter((id) => !sugeridos.includes(id))];
    return ordem
      .map((id) => ({
        id,
        titulo: catalogo.grupos[id],
        sugerido: sugeridos.includes(id),
        modelos: visiveis.filter((modelo) => modelo.grupo === id),
      }))
      .filter((secao) => secao.modelos.length > 0);
  }, [catalogo, sugeridos, visiveis]);

  async function gerar(modelo: ModeloPeca, instrucoes: string) {
    const peca = await pecasApi.gerar(casoId, modelo.id, instrucoes);
    setPecas((atuais) => [{ ...peca, texto: undefined }, ...atuais]);
    setModeloAberto(null);
    setPecaAberta(peca);
  }

  async function abrirPeca(id: string) {
    setAbrindo(id);
    setErro("");
    try {
      setPecaAberta(await pecasApi.obter(casoId, id));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível abrir a minuta.");
    } finally {
      setAbrindo(null);
    }
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2 max-[700px]:px-4">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino={destinoVoltar} />
          <h1 className="text-[22px] leading-none font-bold">Peças processuais</h1>
        </div>
        <p className="text-tinta-suave text-[13px]">
          Minutas geradas pela IA a partir da análise do caso {dados.titulo}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-7 pt-4 pb-7 max-[700px]:px-4">
        {pecaAberta ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setPecaAberta(null)}
              className="text-destaque flex w-fit items-center gap-1.5 text-[13px] font-semibold"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar aos modelos
            </button>
            <MinutaPeca peca={pecaAberta} urlDocx={pecasApi.urlDocx(casoId, pecaAberta.id)} />
          </div>
        ) : (
          <>
            {!podeGerar ? (
              <section className="bg-destaque-suave border-destaque/40 flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 rounded-[12px] border px-5 py-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="text-[14px] font-semibold">Falta a análise preliminar</h2>
                  <p className="text-tinta-suave text-[12px]">
                    As minutas reaproveitam as teses e os fatos da análise. Gere a análise para liberar os modelos.
                  </p>
                </div>
                <Link
                  href={destinoAnalise}
                  className="pressionavel bg-acao text-acao-tinta flex h-10 shrink-0 items-center rounded-[8px] px-4 text-[13px] font-semibold"
                >
                  Ir para a análise
                </Link>
              </section>
            ) : null}

            {pecas.length ? (
              <section className="flex w-full max-w-[880px] flex-col gap-2" aria-label="Minutas deste caso">
                <h2 className="text-[15px] font-semibold">Minutas deste caso</h2>
                <ul className="flex flex-col gap-2">
                  {pecas.map((peca) => (
                    <li key={peca.id}>
                      <button
                        type="button"
                        onClick={() => void abrirPeca(peca.id)}
                        disabled={abrindo !== null}
                        className="pressionavel bg-campo border-borda hover:border-destaque/60 flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left disabled:opacity-60"
                      >
                        <FileText className="text-destaque size-4 shrink-0" aria-hidden />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] font-semibold">{peca.titulo}</span>
                          <span className="text-tinta-suave text-[11px]">
                            {formatarDataHora(peca.geradaEm)}
                          </span>
                        </span>
                        <span className="text-destaque shrink-0 text-[12px] font-semibold max-[450px]:hidden">
                          {abrindo === peca.id ? "Abrindo…" : "Abrir"}
                        </span>
                        <ChevronRight className="text-destaque size-4 shrink-0 min-[451px]:hidden" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="flex w-full flex-col gap-3" aria-label="Modelos de peça">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[15px] font-semibold">Escolha o modelo</h2>
                <p className="text-tinta-suave text-[12px]">
                  {catalogo ? `${catalogo.modelos.length} modelos` : "Carregando modelos…"}
                  {sugeridos.length && catalogo ? " · os da área deste caso aparecem primeiro" : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="border-borda bg-campo focus-within:border-destaque flex h-9 w-full max-w-[320px] items-center gap-2 rounded-[8px] border px-3">
                  <Search className="text-tinta-suave size-4 shrink-0" aria-hidden />
                  <span className="sr-only">Buscar modelo</span>
                  <input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar modelo (ex.: contestação, recurso)"
                    className="placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent text-[12px] outline-none"
                  />
                </label>
              </div>

              {catalogo ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por área">
                  {[[TODOS, "Todos"] as const, ...Object.entries(catalogo.grupos)].map(([id, rotulo]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={grupo === id}
                      onClick={() => setGrupo(id)}
                      className={cn(
                        "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium",
                        grupo === id ? "border-destaque text-destaque" : "border-borda",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              ) : null}

              {erro ? (
                <div role="alert" className="text-[13px]">
                  <p className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
                    {erro}
                  </p>
                  {!catalogo ? (
                    <button
                      type="button"
                      className="text-destaque mt-2 underline"
                      onClick={() => {
                        setErro("");
                        setTentativa((valor) => valor + 1);
                      }}
                    >
                      Tentar novamente
                    </button>
                  ) : null}
                </div>
              ) : null}

              {catalogo && !secoes.length ? (
                <p className="text-tinta-suave text-[13px]">Nenhum modelo encontrado para essa busca.</p>
              ) : null}

              {secoes.map((secao) => (
                <div key={secao.id} className="flex flex-col gap-2.5">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                    {secao.titulo}
                    {secao.sugerido ? (
                      <span className="bg-destaque-suave text-destaque rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Sugerido para este caso
                      </span>
                    ) : null}
                  </h3>
                  <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {secao.modelos.map((modelo) => (
                      <li key={modelo.id}>
                        <CartaoModelo
                          modelo={modelo}
                          rotuloFase={catalogo?.fases[modelo.fase] ?? ""}
                          aoAbrir={() => setModeloAberto(modelo)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      {catalogo ? (
        <ModalModeloPeca
          modelo={modeloAberto}
          catalogo={catalogo}
          podeGerar={podeGerar}
          destinoAnalise={destinoAnalise}
          aoFechar={() => setModeloAberto(null)}
          aoGerar={gerar}
        />
      ) : null}
    </>
  );
}

function CartaoModelo({
  modelo,
  rotuloFase,
  aoAbrir,
}: {
  modelo: ModeloPeca;
  rotuloFase: string;
  aoAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="pressionavel group bg-campo border-borda hover:border-destaque/60 flex h-full w-full flex-col gap-2.5 rounded-[12px] border p-4 text-left"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="bg-destaque-suave text-destaque flex size-9 items-center justify-center rounded-[8px]">
          <IconeFase fase={modelo.fase} className="size-4" />
        </span>
        <ChevronRight
          className="text-tinta-suave group-hover:text-destaque size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
      <span className="text-[14px] font-bold">{modelo.nome}</span>
      <span className="text-tinta-suave text-[12px] leading-snug">{modelo.descricao}</span>
      <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="border-borda bg-chip rounded-full border px-2 py-0.5 text-[10px] font-medium">
          {rotuloFase}
        </span>
        {modelo.prazo ? (
          <span className="text-tinta-suave flex items-center gap-1 text-[10px]">
            <Clock className="size-3" aria-hidden />
            {modelo.prazo.split(" (")[0]}
          </span>
        ) : null}
      </span>
    </button>
  );
}
