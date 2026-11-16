"use client";

import { useState, type FormEvent } from "react";
import { Calculator, Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import type { NovoPrazo, PrazoAgendado, Publicacao } from "@/lib/api/prazos";
import {
  datasDaIntimacao,
  formatarDataComSemana,
  hojeEmBrasilia,
  vencimento,
  type TipoContagem,
} from "@/lib/prazos/calendario";
import { formatarProcesso, mascararProcesso, processoValido, soDigitos } from "@/lib/prazos/numeros";
import { cn } from "@/lib/utils";

const SUGESTOES = ["Contestação", "Réplica", "Manifestação", "Embargos de declaração", "Apelação", "Recurso inominado"];

/**
 * Agenda (ou edita) um prazo. A data final é sempre do advogado; a calculadora só ajuda a
 * preencher o campo e ele confere antes de salvar.
 */
export function ModalPrazo({
  aberto,
  publicacao,
  prazo,
  pedirProcesso,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  /** Intimação de origem (ao agendar a partir dela). */
  publicacao?: Publicacao | null;
  /** Prazo existente (ao editar). */
  prazo?: PrazoAgendado | null;
  /** Prazo avulso: mostra o campo opcional de número do processo. */
  pedirProcesso?: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: NovoPrazo) => Promise<void>;
}) {
  const [salvando, setSalvando] = useState(false);
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      bloqueado={salvando}
      titulo={prazo ? "Editar prazo" : "Agendar prazo"}
      descricao="Você define a data final. A Sophia só lembra e organiza."
      className="max-w-[520px]"
    >
      <Formulario
        publicacao={publicacao ?? null}
        prazo={prazo ?? null}
        pedirProcesso={!!pedirProcesso && !prazo && !publicacao}
        salvando={salvando}
        setSalvando={setSalvando}
        aoFechar={aoFechar}
        aoSalvar={aoSalvar}
      />
    </Modal>
  );
}

function Formulario({
  publicacao,
  prazo,
  pedirProcesso,
  salvando,
  setSalvando,
  aoFechar,
  aoSalvar,
}: {
  publicacao: Publicacao | null;
  prazo: PrazoAgendado | null;
  pedirProcesso: boolean;
  salvando: boolean;
  setSalvando: (valor: boolean) => void;
  aoFechar: () => void;
  aoSalvar: (dados: NovoPrazo) => Promise<void>;
}) {
  const datas = publicacao ? datasDaIntimacao(publicacao.dataDisponibilizacao) : null;
  const [descricao, setDescricao] = useState(prazo?.descricao ?? "");
  const [dataFinal, setDataFinal] = useState(prazo?.dataFinal ?? "");
  const [processo, setProcesso] = useState("");
  const [quantidade, setQuantidade] = useState("15");
  const [tipo, setTipo] = useState<TipoContagem>("uteis");
  const [inicio, setInicio] = useState(datas?.inicioContagem ?? hojeEmBrasilia());
  const [erro, setErro] = useState("");

  const dias = Number(quantidade);
  const calculada = /^\d{4}-\d{2}-\d{2}$/.test(inicio) && dias >= 1 && dias <= 365 ? vencimento(inicio, dias, tipo) : null;

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    if (!descricao.trim()) return setErro("Descreva o prazo (ex.: Contestação).");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFinal)) return setErro("Informe a data final.");
    if (processo && !processoValido(processo)) return setErro("Confira o número do processo ou deixe em branco.");
    setSalvando(true);
    try {
      await aoSalvar({
        descricao: descricao.trim(),
        dataFinal,
        ...(publicacao ? { publicacaoId: publicacao.id } : {}),
        ...(processo ? { numeroProcesso: soDigitos(processo) } : {}),
      });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o prazo.");
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    "border-borda bg-campo focus:border-destaque h-9 w-full rounded-[8px] border px-3 text-[13px] outline-none disabled:opacity-60";

  return (
    <form onSubmit={(evento) => void salvar(evento)} className="mt-3 flex flex-col gap-3">
      {publicacao && datas ? (
        <div className="bg-chip border-borda rounded-[8px] border px-3 py-2 text-[12px]">
          <p className="font-semibold">
            {publicacao.tipoDocumento || publicacao.tipoComunicacao} · {formatarProcesso(publicacao.numeroProcesso)}
          </p>
          <dl className="text-tinta-suave mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt>Disponibilizada</dt>
            <dd>{formatarDataComSemana(publicacao.dataDisponibilizacao)}</dd>
            <dt>Publicação*</dt>
            <dd>{formatarDataComSemana(datas.publicacao)}</dd>
            <dt>Início da contagem*</dt>
            <dd>{formatarDataComSemana(datas.inicioContagem)}</dd>
          </dl>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-[12px] font-medium">
        O que precisa ser feito
        <input
          value={descricao}
          disabled={salvando}
          maxLength={200}
          list="sugestoes-prazo"
          onChange={(evento) => setDescricao(evento.target.value)}
          placeholder="Ex.: Contestação, Réplica, Apelação"
          className={campo}
        />
        <datalist id="sugestoes-prazo">
          {SUGESTOES.map((sugestao) => (
            <option key={sugestao} value={sugestao} />
          ))}
        </datalist>
      </label>

      {pedirProcesso ? (
        <label className="flex flex-col gap-1 text-[12px] font-medium">
          Número do processo <span className="text-tinta-suave font-normal">(opcional)</span>
          <input
            value={processo}
            disabled={salvando}
            inputMode="numeric"
            onChange={(evento) => setProcesso(mascararProcesso(evento.target.value))}
            placeholder="0000000-00.0000.0.00.0000"
            className={cn(campo, "font-mono tracking-tight")}
          />
        </label>
      ) : null}

      <fieldset className="border-borda flex flex-col gap-2 rounded-[8px] border border-dashed px-3 py-2.5">
        <legend className="text-tinta-suave flex items-center gap-1 px-1 text-[11px] font-semibold">
          <Calculator className="size-3.5" aria-hidden />
          Calculadora (opcional)
        </legend>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <input
            aria-label="Quantidade de dias"
            inputMode="numeric"
            value={quantidade}
            disabled={salvando}
            onChange={(evento) => setQuantidade(soDigitos(evento.target.value).slice(0, 3))}
            className={cn(campo, "w-[64px] text-center")}
          />
          <select
            aria-label="Tipo de contagem"
            value={tipo}
            disabled={salvando}
            onChange={(evento) => setTipo(evento.target.value as TipoContagem)}
            className={cn(campo, "w-auto")}
          >
            <option value="uteis">dias úteis</option>
            <option value="corridos">dias corridos</option>
          </select>
          <span>contados a partir de</span>
          <input
            aria-label="Primeiro dia do prazo"
            type="date"
            value={inicio}
            disabled={salvando}
            onChange={(evento) => setInicio(evento.target.value)}
            className={cn(campo, "w-auto")}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px]">
            {calculada ? (
              <>
                Vence em <strong>{formatarDataComSemana(calculada)}</strong>
              </>
            ) : (
              <span className="text-tinta-suave">Informe de 1 a 365 dias.</span>
            )}
          </p>
          <button
            type="button"
            disabled={!calculada || salvando}
            onClick={() => calculada && setDataFinal(calculada)}
            className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-50"
          >
            Usar esta data
          </button>
        </div>
        <p className="text-tinta-suave text-[11px] leading-snug">
          Considera só feriados nacionais e, em dias úteis, o recesso de 20/12 a 20/01 (art. 220 do CPC). Feriados
          locais, Carnaval, Corpus Christi e suspensões do tribunal ficam de fora: confira antes de salvar.
        </p>
      </fieldset>

      <label className="flex flex-col gap-1 text-[12px] font-medium">
        Data final do prazo
        <input
          type="date"
          required
          value={dataFinal}
          disabled={salvando}
          onChange={(evento) => setDataFinal(evento.target.value)}
          className={cn(campo, "w-[180px]")}
        />
      </label>

      {publicacao ? (
        <p className="text-tinta-suave text-[11px]">
          * Estimativa pela regra do DJEN (publicação no dia útil seguinte à disponibilização; contagem no dia útil
          seguinte à publicação), só com feriados nacionais.
        </p>
      ) : null}

      {erro ? (
        <p role="alert" className="text-destructive text-[12px] font-medium">
          {erro}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={salvando}
          onClick={aoFechar}
          className="pressionavel border-borda flex h-9 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="pressionavel bg-acao text-acao-tinta flex h-9 items-center gap-1.5 rounded-[8px] px-4 text-[12px] font-semibold disabled:opacity-60"
        >
          {salvando ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          {prazo ? "Salvar alterações" : "Agendar prazo"}
        </button>
      </div>
    </form>
  );
}
