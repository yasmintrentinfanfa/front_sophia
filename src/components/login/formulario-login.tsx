"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-[52px] w-full rounded-[10px] border px-4 text-sm outline-none focus:ring-2";

export function FormularioLogin() {
  const router = useRouter();
  const idEmail = useId();
  const idSenha = useId();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  /**
   * Ainda não há autenticação: o backend está sendo construído em paralelo.
   * Por ora o envio apenas leva ao painel de casos.
   */
  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    router.push("/casos");
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={idEmail} className="text-[13px] font-medium">
          Email
        </label>
        <input
          id={idEmail}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={idSenha} className="text-[13px] font-medium">
          Senha
        </label>
        <input
          id={idSenha}
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <AcaoFutura rotulo="Recuperação de senha">Esqueci minha senha</AcaoFutura>
        </div>
        <button
          type="submit"
          className="bg-acao text-acao-tinta hover:bg-acao/90 flex h-[52px] w-full items-center justify-center rounded-[10px] text-[15px] font-semibold transition-colors"
        >
          Entrar
        </button>
      </div>

      <p className="flex justify-center gap-1 text-[13px]">
        <span className="text-tinta-suave">Não tem conta?</span>
        <AcaoFutura rotulo="Criação de conta" className="font-semibold">
          Criar conta
        </AcaoFutura>
      </p>
    </form>
  );
}

/** Telas que existem no protótipo mas ainda não foram implementadas. */
function AcaoFutura({
  rotulo,
  className,
  children,
}: {
  rotulo: string;
  className?: string;
  children: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            disabled
            className={`text-[13px] font-medium disabled:pointer-events-auto ${className ?? ""}`}
          >
            {children}
          </button>
        }
      />
      <TooltipContent side="bottom">{rotulo} · em breve</TooltipContent>
    </Tooltip>
  );
}
