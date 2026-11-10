"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Clock, FileText, LoaderCircle, Sparkles } from "lucide-react";

import { IconeFase } from "@/components/pecas/icone-fase";
import { Modal } from "@/components/ui/modal";
import {
  modeloEscritorioPara,
  type CatalogoPecas,
  type ModeloEscritorio,
  type ModeloPeca,
} from "@/lib/api/pecas";

/**
 * Detalhes do modelo e pedido da minuta. O Modal só monta o conteúdo aberto, então
 * orientações e erro recomeçam do zero a cada modelo escolhido.
 */
export function ModalModeloPeca({
  modelo,
  catalogo,
  podeGerar,
  destinoAnalise,
  modelosEscritorio,
  aoAbrirModelosEscritorio,
  aoFechar,
  aoGerar,
}: {
  modelo: ModeloPeca | null;
  catalogo: CatalogoPecas;
  podeGerar: boolean;
  destinoAnalise: string;
  modelosEscritorio: ModeloEscritorio[];
  aoAbrirModelosEscritorio: () => void;
  aoFechar: () => void;
  aoGerar: (modelo: ModeloPeca, instrucoes: string, usarModeloEscritorio: boolean) => Promise<void>;
}) {
  const [gerando, setGerando] = useState(false);

  return (
    <Modal
      aberto={modelo !== null}
      aoFechar={aoFechar}
      bloqueado={gerando}
      titulo={modelo?.nome ?? ""}
      descricao={modelo ? `${catalogo.grupos[modelo.grupo] ?? modelo.grupo} · ${catalogo.fases[modelo.fase]}` : ""}
      className="max-h-[90dvh] max-w-[560px] overflow-y-auto p-5"
    >
      {modelo ? (
        <ConteudoModelo
          modelo={modelo}
          podeGerar={podeGerar}
          destinoAnalise={destinoAnalise}
          escritorio={modeloEscritorioPara(modelosEscritorio, modelo.id)}
          aoAbrirModelosEscritorio={aoAbrirModelosEscritorio}
          gerando={gerando}
          aoFechar={aoFechar}
          aoGerar={async (instrucoes, usarModeloEscritorio) => {
            setGerando(true);
            try {
              await aoGerar(modelo, instrucoes, usarModeloEscritorio);
            } finally {
              setGerando(false);
            }
          }}
        />
      ) : null}
    </Modal>
  );
}

function ConteudoModelo({
  modelo,
  podeGerar,
  destinoAnalise,
  escritorio,
  aoAbrirModelosEscritorio,
  gerando,
  aoFechar,
  aoGerar,
}: {
  modelo: ModeloPeca;
  podeGerar: boolean;
  destinoAnalise: string;
  escritorio: ModeloEscritorio | null;
  aoAbrirModelosEscritorio: () => void;
  gerando: boolean;
  aoFechar: () => void;
  aoGerar: (instrucoes: string, usarModeloEscritorio: boolean) => Promise<void>;
}) {
  const idOrientacoes = useId();
  const idUsarEscritorio = useId();
  const [instrucoes, setInstrucoes] = useState("");
  const [usarEscritorio, setUsarEscritorio] = useState(true);
  const [erro, setErro] = useState("");

  async function gerar() {
    setErro("");
    try {
      await aoGerar(instrucoes, escritorio !== null && usarEscritorio);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível gerar a minuta. Tente novamente.");
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="bg-destaque-suave text-destaque flex size-9 shrink-0 items-center justify-center rounded-[8px]">
          <IconeFase fase={modelo.fase} className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] leading-relaxed">{modelo.descricao}</p>
          <p className="text-tinta-suave text-[12px] leading-relaxed">
            <span className="font-semibold">Quando usar:</span> {modelo.quandoUsar}
          </p>
        </div>
      </div>

      {modelo.prazo || modelo.baseLegal.length ? (
        <div className="flex flex-wrap gap-2">
          {modelo.prazo ? (
            <span className="border-borda bg-chip flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
              <Clock className="size-3" aria-hidden />
              {modelo.prazo}
            </span>
          ) : null}
          {modelo.baseLegal.map((referencia) => (
            <span key={referencia} className="border-borda bg-chip rounded-full border px-2.5 py-1 text-[11px]">
              {referencia}
            </span>
          ))}
        </div>
      ) : null}

      <section className="border-borda flex flex-col gap-2 rounded-[10px] border px-4 py-3">
        <h3 className="text-[12px] font-semibold">Estrutura da minuta</h3>
        <ol className="text-tinta-suave grid gap-1 text-[12px] sm:grid-cols-2">
          {modelo.secoes.map((secao, indice) => (
            <li key={secao} className="flex gap-2">
              <span className="text-destaque w-4 shrink-0 text-right font-semibold">{indice + 1}</span>
              <span>{secao}</span>
            </li>
          ))}
        </ol>
      </section>

      {escritorio ? (
        <section className="bg-destaque-suave border-destaque/40 flex items-start gap-3 rounded-[10px] border px-4 py-3">
          <FileText className="text-destaque mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-[12px] leading-relaxed">
              Modelo do escritório: <strong>{escritorio.nome}</strong>
              {escritorio.comTimbre ? " · o Word baixado sai com o seu timbre" : ""}
            </p>
            <label htmlFor={idUsarEscritorio} className="flex w-fit items-center gap-2 text-[12px] font-medium">
              <input
                id={idUsarEscritorio}
                type="checkbox"
                checked={usarEscritorio}
                onChange={(evento) => setUsarEscritorio(evento.target.checked)}
                disabled={gerando}
                className="accent-destaque size-4"
              />
              Seguir o meu modelo nesta minuta
            </label>
          </div>
        </section>
      ) : (
        <p className="text-tinta-suave text-[12px]">
          Quer que a minuta siga o padrão do seu escritório?{" "}
          <button
            type="button"
            onClick={aoAbrirModelosEscritorio}
            disabled={gerando}
            className="text-destaque font-semibold underline"
          >
            Enviar um modelo
          </button>
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idOrientacoes} className="text-[13px] font-semibold">
          Orientações para esta minuta <span className="text-tinta-suave font-normal">(opcional)</span>
        </label>
        <textarea
          id={idOrientacoes}
          value={instrucoes}
          onChange={(evento) => setInstrucoes(evento.target.value)}
          maxLength={2000}
          rows={3}
          disabled={gerando || !podeGerar}
          placeholder="Ex.: incluir pedido de justiça gratuita; o juízo é a 2ª Vara Cível de Curitiba."
          className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo w-full resize-y rounded-[8px] border px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:ring-2 disabled:opacity-60"
        />
      </div>

      {!podeGerar ? (
        <p className="bg-destaque-suave rounded-[8px] px-3 py-2.5 text-[12px]">
          A minuta usa as teses e fatos da análise preliminar.{" "}
          <Link href={destinoAnalise} className="text-destaque font-semibold underline">
            Gere a análise do caso
          </Link>{" "}
          antes de pedir a peça.
        </p>
      ) : null}

      {gerando ? (
        <p role="status" className="text-tinta-suave text-[12px]">
          A IA está redigindo a minuta com base na análise do caso. Isso pode levar até um minuto.
        </p>
      ) : null}

      {erro ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
          {erro}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          disabled={gerando}
          className="pressionavel border-borda flex h-10 items-center rounded-[8px] border px-4 text-[13px] font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void gerar()}
          disabled={gerando || !podeGerar}
          className="pressionavel bg-acao text-acao-tinta flex h-10 items-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-50"
        >
          {gerando ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {gerando ? "Gerando minuta…" : "Gerar minuta"}
        </button>
      </div>
    </div>
  );
}
