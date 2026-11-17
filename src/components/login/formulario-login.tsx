"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ModalClausulas } from "@/components/casos/modal-clausulas";
import { BotaoGoogle, type PedidoDeVinculo } from "@/components/login/botao-google";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { contaApi } from "@/lib/api/conta";
import { usuarioDaApi, type UsuarioApi } from "@/lib/api/http/mapeadores";
import type { Usuario } from "@/lib/api/types";
import { gravarAceiteClausulas, leuAceiteClausulas } from "@/lib/clausulas";
import { rotaInicial } from "@/lib/conta";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2 read-only:text-tinta-suave";

export function FormularioLogin() {
  const router = useRouter();
  const idEmail = useId();
  const idSenha = useId();
  const campoSenha = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [clausulasAbertas, setClausulasAbertas] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  /** Para onde seguir depois do aceite (`rotaInicial`; no MVP sem plano, sempre os casos). */
  const [destino, setDestino] = useState("/casos");
  /**
   * Entrou com o Google num email que já tem conta com senha: a senha é pedida uma vez
   * para ligar as duas formas de entrar (o backend exige as duas provas).
   */
  const [vinculo, setVinculo] = useState<PedidoDeVinculo | null>(null);

  async function entrar() {
    const res = await fetch(vinculo ? "/api/auth/google/vincular" : "/api/auth/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vinculo ? { credencial: vinculo.credencial, senha } : { email, senha }),
    });
    const dados = (await res.json().catch(() => ({}))) as { erro?: string; codigo?: string; usuario?: UsuarioApi };
    if (!res.ok || !dados.usuario) {
      if (vinculo && (dados.codigo === "token_invalido" || dados.codigo === "nonce")) {
        // O token do Google venceu enquanto digitava: volta para o botão do Google.
        setVinculo(null);
        throw new Error("O login com Google expirou. Clique no botão do Google de novo.");
      }
      throw new Error(dados.erro ?? "Não foi possível entrar.");
    }
    return usuarioDaApi(dados.usuario);
  }

  /** Depois de entrar (com senha ou com o Google): termos, se faltarem, e a rota inicial. */
  async function seguir(usuario: Usuario) {
    const proxima = rotaInicial(usuario);
    if (usuario.termosAceitosEm) {
      router.push(proxima);
      return;
    }
    if (leuAceiteClausulas()) {
      // Aceitou neste navegador antes de o aceite ir para a conta: só registra na conta.
      await contaApi.aceitarTermos().catch(() => undefined);
      router.push(proxima);
      return;
    }
    setDestino(proxima);
    setClausulasAbertas(true);
  }

  function pedirVinculo(pedido: PedidoDeVinculo) {
    setErro("");
    setVinculo(pedido);
    setEmail(pedido.email);
    setSenha("");
    requestAnimationFrame(() => campoSenha.current?.focus());
  }

  function cancelarVinculo() {
    setVinculo(null);
    setSenha("");
    setErro("");
  }

  /** O aceite fica na conta: vale em qualquer navegador e só é pedido uma vez. */
  async function aceitarTermos() {
    try {
      await contaApi.aceitarTermos();
      gravarAceiteClausulas();
      setClausulasAbertas(false);
      router.push(destino);
    } catch (falha) {
      setClausulasAbertas(false);
      setErro(falha instanceof Error ? falha.message : "Não foi possível registrar o aceite dos termos.");
    }
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      await seguir(await entrar());
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      {vinculo ? (
        <p role="status" className="border-borda bg-campo rounded-[8px] border px-3 py-2.5 text-[12px] leading-[17px]">
          Já existe uma conta Sophia com este email. Digite a senha dela uma vez para ligar o login com
          Google. Depois, é só usar o botão do Google.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idEmail} className="text-[12px] font-medium">
          Email
        </label>
        <input
          id={idEmail}
          type="email"
          autoComplete="email"
          required
          readOnly={Boolean(vinculo)}
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idSenha} className="text-[12px] font-medium">
          Senha
        </label>
        <input
          ref={campoSenha}
          id={idSenha}
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <AcaoFutura rotulo="Recuperação de senha">Esqueci minha senha</AcaoFutura>
        </div>
        {erro ? (
          <p role="alert" className="text-[12px]">
            {erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando}
          className="bg-acao text-acao-tinta hover:bg-acao/90 flex h-10 w-full items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-60"
        >
          {vinculo ? (enviando ? "Ligando…" : "Ligar ao Google e entrar") : enviando ? "Entrando…" : "Entrar"}
        </button>
        {vinculo ? (
          <button
            type="button"
            onClick={cancelarVinculo}
            className="text-tinta-suave hover:text-tinta self-center text-[12px] font-medium"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      {vinculo ? null : (
        <BotaoGoogle
          contexto="signin"
          aoEntrar={(usuario) => {
            setErro("");
            void seguir(usuario);
          }}
          aoPedirVinculo={pedirVinculo}
          aoFalhar={setErro}
        />
      )}

      <p className="flex justify-center gap-1 text-[12px]">
        <span className="text-tinta-suave">Não tem conta?</span>
        <Link href="/criar-conta" className="text-[12px] font-semibold">
          Criar conta
        </Link>
      </p>

      <ModalClausulas
        aberto={clausulasAbertas}
        modo="aceite"
        aoFechar={() => setClausulasAbertas(false)}
        aoConfirmar={() => void aceitarTermos()}
      />
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
            className={`text-[12px] font-medium disabled:pointer-events-auto ${className ?? ""}`}
          >
            {children}
          </button>
        }
      />
      <TooltipContent side="bottom">{rotulo} · em breve</TooltipContent>
    </Tooltip>
  );
}
