"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampoConta } from "./campo-conta";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import { cn } from "@/lib/utils";
import styles from "@/components/fluxo/telas.module.css";

export function FormularioPagamento() {
  const router = useRouter();
  const [plano, setPlano] = useState("mensal");
  const [metodo, setMetodo] = useState("credito");
  const [numero, setNumero] = useState("");
  const [validade, setValidade] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campo = evento.currentTarget.elements.namedItem(
      "validade",
    ) as HTMLInputElement;
    const [mes, ano] = validade.split("/").map(Number);
    const agora = new Date();
    const expirou = new Date(2000 + ano, mes) <= agora;
    campo.setCustomValidity(
      mes < 1 || mes > 12 || expirou
        ? "Informe uma validade futura no formato MM/AA."
        : "",
    );
    if (!evento.currentTarget.reportValidity()) return;
    // O prototipo nao envia nem persiste dados de cartao e nao realiza cobrancas.
    setConfirmacao(true);
  }

  return (
    <form onSubmit={aoEnviar} className="flex w-full flex-col gap-3">
      <h1 className="text-[24px] leading-[29px] font-bold">
        Escolha seu plano
      </h1>
      <p className="text-tinta-suave text-[13px] leading-4">
        Cadastre o pagamento para assinar a Sophia
      </p>
      <fieldset
        aria-label="Plano"
        className="grid grid-cols-2 items-start gap-3 max-[400px]:grid-cols-1"
      >
        {[
          { id: "mensal", titulo: "Mensal", periodo: "por mes" },
          { id: "anual", titulo: "Anual", periodo: "por ano · economize xx%" },
        ].map((item) => (
          <label
            key={item.id}
            className={cn(
              "relative flex cursor-pointer flex-col gap-[6px] rounded-xl border px-4 py-[14px] has-focus-visible:ring-2 has-focus-visible:ring-destaque",
              plano === item.id
                ? "border-destaque h-[103px] border-[1.5px] bg-[var(--fundo-selecionado)]"
                : "bg-campo border-borda h-[101px]",
            )}
          >
            <input
              type="radio"
              name="plano"
              value={item.id}
              checked={plano === item.id}
              onChange={() => setPlano(item.id)}
              className="sr-only"
            />
            <span className="flex h-[18px] items-center justify-between gap-1">
              <span className="text-[14px] font-semibold">{item.titulo}</span>
              <span
                className={cn(
                  "rounded-[20px] bg-acao px-2 py-[3px] text-[10px] leading-3 font-medium text-acao-tinta dark:bg-destaque",
                  plano !== item.id && "invisible",
                )}
                aria-hidden={plano !== item.id}
              >
                Selecionado
              </span>
            </span>
            <span className="text-[22px] leading-[27px] font-bold">R$ xx</span>
            <span className="text-tinta-suave text-[12px] leading-[15px]">
              {item.periodo}
            </span>
          </label>
        ))}
      </fieldset>
      <h2 className="text-[14px] leading-[17px] font-semibold">
        Forma de pagamento
      </h2>
      <fieldset
        aria-label="Forma de pagamento"
        className="flex flex-wrap gap-2"
      >
        {[
          { id: "credito", titulo: "Cartao de credito" },
          { id: "debito", titulo: "Cartao de debito" },
        ].map((item) => (
          <label
            key={item.id}
            className={cn(
              "cursor-pointer rounded-[8px] border px-3 py-2 text-[12px] leading-[15px] font-medium has-focus-visible:ring-2 has-focus-visible:ring-destaque",
              metodo === item.id
                ? "border-destaque bg-[var(--fundo-selecionado)]"
                : "bg-campo border-borda",
            )}
          >
            <input
              type="radio"
              name="metodo"
              value={item.id}
              checked={metodo === item.id}
              onChange={() => setMetodo(item.id)}
              className="sr-only"
            />
            {item.titulo}
          </label>
        ))}
      </fieldset>
      <CampoConta
        compacto
        rotulo="Nome no cartao"
        name="titular"
        autoComplete="cc-name"
        required
      />
      <CampoConta
        compacto
        rotulo="Numero do cartao"
        name="numero"
        autoComplete="cc-number"
        inputMode="numeric"
        required
        pattern="[0-9 ]{15,23}"
        minLength={15}
        maxLength={23}
        value={numero}
        onChange={(evento) =>
          setNumero(
            evento.target.value
              .replace(/\D/g, "")
              .slice(0, 19)
              .replace(/(.{4})/g, "$1 ")
              .trim(),
          )
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <CampoConta
          compacto
          rotulo="Validade (MM/AA)"
          name="validade"
          autoComplete="cc-exp"
          inputMode="numeric"
          required
          pattern="[0-9]{2}/[0-9]{2}"
          maxLength={5}
          value={validade}
          onChange={(evento) => {
            evento.target.setCustomValidity("");
            setValidade(
              evento.target.value
                .replace(/\D/g, "")
                .slice(0, 4)
                .replace(/^(\d{2})(\d)/, "$1/$2"),
            );
          }}
        />
        <CampoConta
          compacto
          rotulo="CVV"
          name="cvv"
          type="password"
          autoComplete="cc-csc"
          inputMode="numeric"
          required
          pattern="[0-9]{3,4}"
          maxLength={4}
        />
      </div>
      <p className="text-[11px] leading-[13px] text-[var(--texto-discreto)] min-[700px]:whitespace-nowrap">
        Os valores serao confirmados antes da cobranca. Cobranca recorrente
        conforme o plano escolhido.
      </p>
      <button
        type="submit"
        className={`${styles.acao} bg-acao text-acao-tinta h-[46px] rounded-[10px] text-[14px] font-semibold`}
      >
        Assinar plano
      </button>
      <Link
        href="/criar-conta"
        className="pressionavel text-tinta-suave self-start text-[13px] leading-4 font-medium"
      >
        Voltar para criar conta
      </Link>
      <ModalFluxo
        aberto={confirmacao}
        aoFechar={() => setConfirmacao(false)}
        titulo="Pagamento de demonstracao"
        descricao="Nenhuma cobranca foi realizada. A assinatura estara disponivel quando o pagamento for integrado."
      >
        <button
          type="button"
          onClick={() => router.push("/casos")}
          className={`${styles.acao} bg-acao text-acao-tinta mt-4 h-10 w-full rounded-[8px] text-[13px] font-semibold`}
        >
          Continuar para os casos
        </button>
      </ModalFluxo>
    </form>
  );
}
