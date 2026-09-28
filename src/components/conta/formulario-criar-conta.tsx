"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampoConta } from "./campo-conta";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import styles from "@/components/fluxo/telas.module.css";

export function FormularioCriarConta() {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [googleAberto, setGoogleAberto] = useState(false);

  function validarSenhas() {
    const campos = formulario.current?.elements;
    const senha = campos?.namedItem("senha") as HTMLInputElement | null;
    const confirmar = campos?.namedItem(
      "confirmarSenha",
    ) as HTMLInputElement | null;
    confirmar?.setCustomValidity(
      senha?.value === confirmar.value ? "" : "As senhas devem ser iguais.",
    );
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    validarSenhas();
    if (!evento.currentTarget.reportValidity()) return;
    // Segue o fluxo demonstrativo do login; senhas nao sao armazenadas.
    router.push("/pagamento");
  }

  return (
    <form
      ref={formulario}
      onSubmit={aoEnviar}
      className="flex w-full max-w-[440px] flex-col gap-[10px]"
    >
      <h1 className="text-[24px] leading-[29px] font-bold">Criar conta</h1>
      <p className="text-tinta-suave text-[14px] leading-[17px]">
        Comece a usar a Sophia no seu escritorio
      </p>
      <button
        type="button"
        onClick={() => setGoogleAberto(true)}
        className="bg-campo border-borda flex h-11 items-center justify-center gap-[10px] rounded-[10px] border px-4 text-[14px] font-medium"
      >
        <span
          aria-hidden
          className="flex h-5 w-[10px] items-center justify-center rounded-[10px] bg-[#f2f2f5] text-[12px] font-bold text-[#4285f5] dark:bg-[#404047] dark:text-[#b2bff2]"
        >
          G
        </span>
        Continuar com Google
      </button>
      <div className="flex h-5 items-center gap-3 text-[12px] text-[var(--texto-discreto)]">
        <span className="bg-borda h-px w-[150px] max-w-[35%]" />
        ou
        <span className="bg-borda h-px w-[150px] max-w-[35%]" />
      </div>
      <CampoConta
        rotulo="Nome completo"
        name="nome"
        autoComplete="name"
        required
        maxLength={150}
      />
      <CampoConta
        rotulo="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <CampoConta
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        onChange={validarSenhas}
      />
      <CampoConta
        rotulo="Confirmar senha"
        name="confirmarSenha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        onChange={validarSenhas}
      />
      <button
        type="submit"
        className={`${styles.acao} bg-acao text-acao-tinta h-11 rounded-[10px] text-[14px] font-semibold`}
      >
        Criar conta
      </button>
      <p className="flex min-h-[100px] flex-wrap items-start gap-1 text-[13px] leading-4">
        <span className="text-tinta-suave">Ja tem uma conta?</span>
        <Link href="/login" className="pressionavel font-semibold">
          Entrar
        </Link>
      </p>
      <ModalFluxo
        aberto={googleAberto}
        aoFechar={() => setGoogleAberto(false)}
        titulo="Continuar com Google"
        descricao="O acesso com Google ainda nao esta disponivel. Voce pode continuar com o cadastro por email."
      />
    </form>
  );
}
