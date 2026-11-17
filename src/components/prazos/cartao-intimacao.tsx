"use client";

import { useId, useRef, useState } from "react";
import { CalendarPlus, ChevronDown, ExternalLink, Loader2, Undo2 } from "lucide-react";

import { prazosApi, type Publicacao } from "@/lib/api/prazos";
import type { Caso } from "@/lib/api/types";
import { datasDaIntimacao, formatarData } from "@/lib/prazos/calendario";
import { formatarProcesso } from "@/lib/prazos/numeros";
import { rotuloCaso } from "@/lib/casos/rotulo";
import { mostrarInicio } from "@/lib/rolagem";
import { cn } from "@/lib/utils";

const SITUACAO: Record<Publicacao["situacao"], { rotulo: string; classe: string }> = {
  pendente: { rotulo: "A tratar", classe: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  agendada: { rotulo: "Prazo agendado", classe: "bg-destaque-suave text-destaque" },
  sem_prazo: { rotulo: "Sem prazo a cumprir", classe: "bg-chip text-tinta-suave border-borda border" },
};

const TAMANHO_RESUMO = 320;

/** Uma intimação do DJEN, com o teor recolhido e as ações do advogado. */
export function CartaoIntimacao({
  publicacao,
  caso,
  casosParaLigar,
  aoAgendar,
  aoMarcar,
  aoLigarCaso,
}: {
  publicacao: Publicacao;
  /** Caso ligado ao processo desta intimação, se houver. */
  caso: Caso | null;
  /** Casos que podem receber o processo (só na tela geral, quando ainda não há caso). */
  casosParaLigar?: Caso[];
  aoAgendar: () => void;
  aoMarcar: (situacao: "pendente" | "sem_prazo") => Promise<void>;
  aoLigarCaso?: (casoId: string) => Promise<void>;
}) {
  const idTeor = useId();
  const cartao = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState(false);
  const [inteiroTeor, setInteiroTeor] = useState<string | null>(publicacao.textoTruncado ? null : publicacao.texto);
  const [carregandoTeor, setCarregandoTeor] = useState(false);
  const [ocupado, setOcupado] = useState<"marcar" | "ligar" | null>(null);
  const [erro, setErro] = useState("");
  const datas = datasDaIntimacao(publicacao.dataDisponibilizacao);
  const situacao = SITUACAO[publicacao.situacao] ?? SITUACAO.pendente;
  const longo = publicacao.textoTruncado || publicacao.texto.length > TAMANHO_RESUMO;
  const resumo = longo ? `${publicacao.texto.slice(0, TAMANHO_RESUMO).trimEnd()}…` : publicacao.texto;

  async function alternarTeor() {
    if (aberto) {
      setAberto(false);
      // O inteiro teor abre na própria página (sem rolagem dentro do cartão); ao recolher um
      // texto longo, o começo do cartão pode ter ficado acima da tela: traz de volta.
      requestAnimationFrame(() => mostrarInicio(cartao.current));
      return;
    }
    if (inteiroTeor === null) {
      setCarregandoTeor(true);
      setErro("");
      try {
        setInteiroTeor((await prazosApi.obterPublicacao(publicacao.id)).texto);
      } catch (falha) {
        setErro(falha instanceof Error ? falha.message : "Não foi possível abrir o inteiro teor.");
        return;
      } finally {
        setCarregandoTeor(false);
      }
    }
    setAberto(true);
  }

  async function executar(tipo: "marcar" | "ligar", acao: () => Promise<void>) {
    setOcupado(tipo);
    setErro("");
    try {
      await acao();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível concluir. Tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <article
      ref={cartao}
      className={cn(
        "bg-campo border-borda flex scroll-mt-3 flex-col gap-2 rounded-[12px] border px-4 py-3",
        publicacao.situacao === "pendente" && "border-l-[3px] border-l-amber-500",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span className={cn("rounded-full px-2 py-0.5 font-semibold", situacao.classe)}>{situacao.rotulo}</span>
        {publicacao.cancelada ? (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-600 dark:text-red-400">
            Cancelada no DJEN
          </span>
        ) : null}
        <span className="text-tinta-suave">
          Disponibilizada em {formatarData(publicacao.dataDisponibilizacao)} · {publicacao.tribunal}
        </span>
      </header>

      <div className="flex flex-col gap-0.5">
        <h3 className="text-[14px] font-semibold">
          {publicacao.tipoDocumento || publicacao.tipoComunicacao || "Comunicação"}
          {publicacao.classe ? <span className="text-tinta-suave font-normal"> · {publicacao.classe}</span> : null}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          <span className="font-mono tracking-tight">{formatarProcesso(publicacao.numeroProcesso)}</span>
          {caso ? (
            <span className="bg-destaque-suave text-destaque rounded-full px-2 py-0.5 text-[11px] font-semibold">
              Caso: {rotuloCaso(caso)}
            </span>
          ) : null}
        </p>
        {publicacao.orgao ? <p className="text-tinta-suave text-[12px]">{publicacao.orgao}</p> : null}
      </div>

      <div className="text-[12px] leading-relaxed">
        <p id={idTeor} className="whitespace-pre-line">
          {aberto && inteiroTeor !== null ? inteiroTeor : resumo}
        </p>
        {longo ? (
          <button
            type="button"
            aria-expanded={aberto}
            aria-controls={idTeor}
            disabled={carregandoTeor}
            onClick={() => void alternarTeor()}
            className="text-destaque mt-1 flex items-center gap-1 text-[12px] font-semibold disabled:opacity-60"
          >
            {carregandoTeor ? "Abrindo…" : aberto ? "Recolher" : "Ler inteiro teor"}
            {carregandoTeor ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ChevronDown className={cn("size-3.5 transition-transform", aberto && "rotate-180")} aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <p className="text-tinta-suave text-[11px]">
        Publicação {formatarData(datas.publicacao)} · contagem a partir de {formatarData(datas.inicioContagem)}{" "}
        (estimativa, só feriados nacionais)
      </p>

      <footer className="flex flex-wrap items-center gap-2 pt-1">
        {publicacao.situacao !== "agendada" ? (
          <button
            type="button"
            onClick={aoAgendar}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold"
          >
            <CalendarPlus className="size-3.5" aria-hidden />
            Agendar prazo
          </button>
        ) : (
          <button
            type="button"
            onClick={aoAgendar}
            className="pressionavel border-borda flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            <CalendarPlus className="size-3.5" aria-hidden />
            Outro prazo
          </button>
        )}
        {publicacao.situacao === "pendente" ? (
          <button
            type="button"
            disabled={ocupado !== null}
            onClick={() => void executar("marcar", () => aoMarcar("sem_prazo"))}
            className="pressionavel border-borda flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-medium disabled:opacity-60"
          >
            {ocupado === "marcar" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Sem prazo a cumprir
          </button>
        ) : null}
        {publicacao.situacao === "sem_prazo" ? (
          <button
            type="button"
            disabled={ocupado !== null}
            onClick={() => void executar("marcar", () => aoMarcar("pendente"))}
            className="pressionavel text-tinta-suave hover:text-tinta flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-medium disabled:opacity-60"
          >
            <Undo2 className="size-3.5" aria-hidden />
            Voltar para “a tratar”
          </button>
        ) : null}
        {!caso && aoLigarCaso && casosParaLigar?.length && publicacao.numeroProcesso ? (
          <label className="text-tinta-suave flex items-center gap-1.5 text-[12px]">
            <span className="sr-only">Ligar o processo a um caso</span>
            <select
              value=""
              disabled={ocupado !== null}
              onChange={(evento) => {
                const casoId = evento.target.value;
                if (casoId) void executar("ligar", () => aoLigarCaso(casoId));
              }}
              className="border-borda bg-campo h-8 max-w-[220px] rounded-[8px] border px-2 text-[12px] disabled:opacity-60"
            >
              <option value="">{ocupado === "ligar" ? "Ligando…" : "Ligar a um caso…"}</option>
              {casosParaLigar.map((item) => (
                <option key={item.id} value={item.id}>
                  {rotuloCaso(item)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {publicacao.link ? (
          <a
            href={publicacao.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-destaque ml-auto flex items-center gap-1 text-[12px] font-semibold"
          >
            Abrir no tribunal
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </footer>
      {erro ? (
        <p role="alert" className="text-destructive text-[12px] font-medium">
          {erro}
        </p>
      ) : null}
    </article>
  );
}
