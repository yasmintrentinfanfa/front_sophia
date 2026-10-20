"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

export function FormularioCriarConta() {
  const router = useRouter();
  const idNome = useId();
  const idEmail = useId();
  const idSenha = useId();
  const idConfirmarSenha = useId();
  const idTermos = useId();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /**
   * Ainda não há autenticação: o backend está sendo construído em paralelo
   * (mesma nota da tela de login). O cadastro valida os campos no cliente e
   * segue para a assinatura; só depois do pagamento o usuário chega aos casos.
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
    if (!aceitouTermos) {
      setErro("Para continuar, aceite os Termos de uso e a Política de privacidade.");
      return;
    }

    setEnviando(true);
    router.push("/assinatura");
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
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

      <div className="flex items-start gap-2">
        <input
          id={idTermos}
          type="checkbox"
          checked={aceitouTermos}
          onChange={(evento) => setAceitouTermos(evento.target.checked)}
          className="accent-destaque mt-0.5 size-4 shrink-0 cursor-pointer"
        />
        <label htmlFor={idTermos} className="text-tinta-suave cursor-pointer text-[12px] leading-snug">
          Li e aceito os <span className="text-tinta font-semibold">Termos de uso</span> e a{" "}
          <span className="text-tinta font-semibold">Política de privacidade</span> da Sophia.
        </label>
      </div>

      {erro ? <p className="text-destructive text-[12px]">{erro}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="bg-acao text-acao-tinta flex h-10 w-full items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-60"
      >
        {enviando ? "Criando conta…" : "Criar conta e continuar"}
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
