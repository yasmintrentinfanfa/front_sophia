"use client";

import { useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampoConta } from "./campo-conta";

export function FormularioCriarConta() {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);

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
        Comece a usar a Sophia no seu escritório
      </p>
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
        className="pressionavel bg-acao text-acao-tinta flex h-10 items-center justify-center rounded-[8px] text-[13px] font-semibold"
      >
        Criar conta
      </button>
      <p className="flex min-h-[100px] flex-wrap items-start gap-1 text-[13px] leading-4">
        <span className="text-tinta-suave">Já tem uma conta?</span>
        <Link href="/login" className="pressionavel font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}
