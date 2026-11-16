"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";

import type { NovoMonitoramento, TipoMonitoramento } from "@/lib/api/prazos";
import { mascararProcesso, processoValido, soDigitos, UFS } from "@/lib/prazos/numeros";
import { cn } from "@/lib/utils";

/**
 * Entrada manual do que acompanhar: número da OAB (com a seccional) ou número do processo.
 * No caso, `somenteProcesso` esconde a OAB: o caso acompanha o processo dele.
 */
export function FormularioAcompanhar({
  somenteProcesso = false,
  aoEnviar,
}: {
  somenteProcesso?: boolean;
  aoEnviar: (dados: NovoMonitoramento) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoMonitoramento>(somenteProcesso ? "processo" : "oab");
  const [oab, setOab] = useState("");
  const [uf, setUf] = useState("");
  const [processo, setProcesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function validar(): NovoMonitoramento | null {
    if (tipo === "oab") {
      if (!soDigitos(oab)) return falhar("Informe o número da OAB.");
      if (!uf) return falhar("Escolha a seccional (UF).");
      return { tipo: "oab", oabNumero: soDigitos(oab), oabUf: uf };
    }
    if (soDigitos(processo).length !== 20) return falhar("O número do processo tem 20 dígitos.");
    if (!processoValido(processo)) return falhar("Confira o número: o dígito verificador não bate.");
    return { tipo: "processo", numeroProcesso: soDigitos(processo) };
  }

  function falhar(mensagem: string) {
    setErro(mensagem);
    return null;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    const dados = validar();
    if (!dados) return;
    setEnviando(true);
    try {
      await aoEnviar(dados);
      setOab("");
      setProcesso("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o acompanhamento.");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "border-borda bg-campo focus:border-destaque h-9 rounded-[8px] border px-3 text-[13px] outline-none disabled:opacity-60";

  return (
    <form onSubmit={(evento) => void enviar(evento)} className="flex w-full flex-col gap-2">
      {!somenteProcesso ? (
        <div role="radiogroup" aria-label="Acompanhar por" className="bg-chip border-borda flex w-fit rounded-[8px] border p-0.5">
          {(
            [
              ["oab", "Número da OAB"],
              ["processo", "Número do processo"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={tipo === valor}
              onClick={() => {
                setTipo(valor);
                setErro("");
              }}
              className={cn(
                "h-7 rounded-[6px] px-3 text-[12px] font-medium",
                tipo === valor ? "bg-campo text-destaque shadow-sm" : "text-tinta-suave hover:text-tinta",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {tipo === "oab" ? (
          <>
            <label className="sr-only" htmlFor="oab-numero">
              Número da OAB
            </label>
            <input
              id="oab-numero"
              inputMode="numeric"
              autoComplete="off"
              value={oab}
              disabled={enviando}
              onChange={(evento) => setOab(soDigitos(evento.target.value).slice(0, 7))}
              placeholder="Número da OAB (ex.: 123456)"
              className={cn(campo, "w-[220px] max-[480px]:w-full")}
            />
            <label className="sr-only" htmlFor="oab-uf">
              Seccional
            </label>
            <select
              id="oab-uf"
              value={uf}
              disabled={enviando}
              onChange={(evento) => setUf(evento.target.value)}
              className={cn(campo, "w-[96px] pr-2")}
            >
              <option value="">UF</option>
              {UFS.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {sigla}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor="numero-processo">
              Número do processo
            </label>
            <input
              id="numero-processo"
              inputMode="numeric"
              autoComplete="off"
              value={processo}
              disabled={enviando}
              onChange={(evento) => setProcesso(mascararProcesso(evento.target.value))}
              placeholder="0000000-00.0000.0.00.0000"
              className={cn(campo, "w-[260px] font-mono tracking-tight max-[480px]:w-full")}
            />
          </>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="pressionavel bg-acao text-acao-tinta flex h-9 items-center gap-1.5 rounded-[8px] px-4 text-[12px] font-semibold disabled:opacity-60"
        >
          {enviando ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
          {enviando ? "Consultando o DJEN…" : "Acompanhar"}
        </button>
      </div>
      {erro ? (
        <p role="alert" className="text-destructive text-[12px] font-medium">
          {erro}
        </p>
      ) : null}
    </form>
  );
}
