"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { BotaoGoogle } from "@/components/criar-conta/botao-google";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

export function FormularioCriarConta() {
  const router = useRouter();
  const idNome = useId();
  const idEmail = useId();
  const idSenha = useId();
  const idConfirmarSenha = useId();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /**
   * Ainda não há autenticação: o backend está sendo construído em paralelo
   * (mesma nota da tela de login). O cadastro valida os campos no cliente e
   * leva direto ao painel de casos.
   */
  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    router.push("/casos");
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <BotaoGoogle />

      <div className="flex items-center gap-3">
        <span className="bg-borda h-px flex-1" aria-hidden />
        <span className="text-tinta-suave text-[12px]">ou</span>
        <span className="bg-borda h-px flex-1" aria-hidden />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idNome} className="text-[12px] font-medium">
          Nome completo
        </label>
        <input
          id={idNome}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          required
          autoComplete="name"
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idEmail} className="text-[12px] font-medium">
          Email
        </label>
        <input
          id={idEmail}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          required
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idSenha} className="text-[12px] font-medium">
          Senha
        </label>
        <input
          id={idSenha}
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          required
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idConfirmarSenha} className="text-[12px] font-medium">
          Confirmar senha
        </label>
        <input
          id={idConfirmarSenha}
          type="password"
          autoComplete="new-password"
          value={confirmarSenha}
          onChange={(evento) => setConfirmarSenha(evento.target.value)}
          required
          className={CLASSE_CAMPO}
        />
      </div>

      {erro ? <p className="text-destructive text-[12px]">{erro}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="bg-acao text-acao-tinta flex h-10 w-full items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-60"
      >
        {enviando ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="flex justify-center gap-1 text-[12px]">
        <span className="text-tinta-suave">Já tem uma conta?</span>
        <Link href="/login" className="font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}
