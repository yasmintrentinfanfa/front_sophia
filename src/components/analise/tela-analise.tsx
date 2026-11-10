"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ListaAnalises } from "@/components/analise/lista-analises";
import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { EditorAreaCaso } from "@/components/casos/editor-area-caso";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";
import { areaPorId } from "@/lib/casos/areas-juridicas";

/** PDF/DOCX/TXT ainda fora dos cards: id não coberto, ou arquivo gravado depois da última análise. */
function documentosPendentes(dados: DadosCaso, analises: DadosCaso["versoesAnalise"]) {
  const docs = (dados.documentos ?? []).filter((documento) => documento.id);
  if (!analises?.length) return docs;
  const cobertos = new Set(
    analises.flatMap((item) => [...(item.fontesIds ?? []), item.fonteId].filter(Boolean) as string[]),
  );
  const gerada = Date.parse(analises.at(-1)?.geradaEm ?? "");
  return docs.filter((documento) => {
    if (documento.id && cobertos.has(documento.id)) return false;
    const criado = Date.parse(documento.criadoEm ?? "");
    if (Number.isFinite(criado) && Number.isFinite(gerada)) return criado > gerada;
    return cobertos.size > 0;
  });
}

/** Relato registrado depois da última análise. Relato sem data não conta, para não avisar à toa. */
function haRelatoNovo(dados: DadosCaso, analises: DadosCaso["versoesAnalise"]) {
  const gerada = Date.parse(analises.at(-1)?.geradaEm ?? "");
  if (!Number.isFinite(gerada)) return false;
  return (dados.transcricao ?? []).some((fala) => {
    const criado = Date.parse(fala.criadoEm ?? "");
    return fala.texto.trim() !== "" && Number.isFinite(criado) && criado > gerada;
  });
}

/** Por que a tela pede para gerar ou atualizar a análise; null = está em dia. */
type Motivo = "sem_analise" | "arquivo" | "relato" | "area" | null;

const TITULOS: Record<Exclude<Motivo, null>, string> = {
  sem_analise: "O relato está salvo, falta a análise",
  arquivo: "Há um arquivo novo no caso",
  relato: "Há um relato novo no caso",
  area: "A área do caso mudou",
};

export function TelaAnalise({
  dados,
  destinoVoltar,
  destinoChat,
  destinoPecas,
}: {
  dados: DadosCaso;
  destinoVoltar: string;
  destinoChat: string;
  destinoPecas: string;
}) {
  const { casos } = useListaCasos();
  const areaDoCaso = casos.find((caso) => caso.id === dados.casoId)?.area;
  const [analises, setAnalises] = useState(dados.versoesAnalise ?? []);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [atualizou, setAtualizou] = useState(false);
  const temRelato =
    (dados.transcricao ?? []).some((fala) => fala.texto.trim()) || (dados.documentos ?? []).length > 0;
  const pendentes = documentosPendentes(dados, analises);
  const visivel = analises.at(-1) ?? null;
  const nomeArea = areaPorId(areaDoCaso)?.nome;
  const nomeAreaDaAnalise = areaPorId(visivel?.area)?.nome;

  // Um motivo por vez, do mais concreto para o mais geral.
  const motivo: Motivo = !visivel
    ? temRelato
      ? "sem_analise"
      : null
    : !atualizou && pendentes.length > 0
      ? "arquivo"
      : !atualizou && haRelatoNovo(dados, analises)
        ? "relato"
        : !visivel.demonstracao && nomeArea && visivel.area !== areaDoCaso
          ? "area"
          : null;
  const mostrarAviso = motivo !== null || gerando || erro !== "";

  async function gerarAnalise() {
    setGerando(true);
    setErro("");
    try {
      const arquivo = motivo === "arquivo" ? pendentes.at(-1) : undefined;
      const lista = await api.solicitarAnalise(
        dados.casoId,
        arquivo?.id ? { tipo: "documento", id: arquivo.id } : { tipo: "transcricao" },
      );
      setAnalises(lista);
      setAtualizou(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  const textoDoAviso = gerando
    ? `A IA está ${visivel ? "refazendo" : "gerando"} os cards. Isso pode levar de 1 a 2 minutos.`
    : motivo === "sem_analise"
      ? "Gere os cards de teses, jurisprudência, perguntas e necessidades a partir do relato."
      : motivo === "arquivo"
        ? "Um PDF, DOCX ou TXT entrou depois da última análise. Atualize para os cards considerarem o arquivo."
        : motivo === "relato"
          ? "Ele foi registrado depois da última análise. Atualize para os cards acompanharem o que foi dito."
          : motivo === "area"
            ? `A análise atual usou ${nomeAreaDaAnalise ? `a orientação de ${nomeAreaDaAnalise}` : "a orientação genérica"}. Atualize para usar a de ${nomeArea}.`
            : "";

  return (
    <>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-8 pt-5 pb-3 max-[700px]:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <BotaoVoltar destino={destinoVoltar} />
          <h1 className="text-[22px] leading-[27px] font-bold">Análise preliminar de caso</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {visivel && temRelato && !mostrarAviso ? (
            <button
              type="button"
              onClick={() => void gerarAnalise()}
              className="pressionavel text-destaque hover:bg-destaque-suave flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold"
            >
              <Sparkles className="size-3.5" aria-hidden />
              Gerar nova análise
            </button>
          ) : null}
          <Link
            href={destinoPecas}
            className="pressionavel bg-campo border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium"
          >
            Peças processuais
          </Link>
          <Link
            href={destinoChat}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            Chat com IA
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-[14px] px-8 pt-1 pb-5 max-[700px]:px-4">
        {mostrarAviso ? (
          <section
            aria-live="polite"
            className="bg-destaque-suave border-destaque/40 flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 rounded-[12px] border px-5 py-4"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-[14px] font-semibold">
                {motivo
                  ? TITULOS[motivo]
                  : gerando
                    ? "Atualizando a análise"
                    : "Não foi possível atualizar a análise"}
              </h2>
              {textoDoAviso ? <p className="text-tinta-suave text-[12px]">{textoDoAviso}</p> : null}
              {motivo === "sem_analise" ? (
                // Antes da primeira análise, a área mostra qual orientação a IA vai usar.
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-tinta-suave text-[11px]">Área do caso:</span>
                  <EditorAreaCaso casoId={dados.casoId} area={areaDoCaso} />
                </div>
              ) : null}
              {erro ? (
                <p role="alert" className="text-destructive mt-1 text-[12px] font-medium">
                  {erro}
                </p>
              ) : null}
            </div>
            {temRelato ? (
              <button
                type="button"
                onClick={() => void gerarAnalise()}
                disabled={gerando}
                className="pressionavel bg-acao text-acao-tinta flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-60 max-[700px]:w-full"
              >
                <Sparkles className={gerando ? "size-4 animate-pulse" : "size-4"} aria-hidden />
                {gerando
                  ? "Gerando análise…"
                  : !visivel
                    ? "Gerar análise"
                    : erro && !motivo
                      ? "Tentar de novo"
                      : "Atualizar análise"}
              </button>
            ) : null}
          </section>
        ) : !visivel && !temRelato ? (
          <Link
            href={`/casos/${dados.casoId}/gravacao`}
            className="text-destaque self-start text-[13px] underline"
          >
            Ir para a gravação
          </Link>
        ) : null}
        {visivel ? (
          <ListaAnalises
            analises={[visivel]}
            destinoChat={destinoChat}
            areaDoCaso={areaDoCaso}
            acaoArea={<EditorAreaCaso casoId={dados.casoId} area={areaDoCaso} className="items-end" />}
          />
        ) : null}
      </div>
    </>
  );
}
