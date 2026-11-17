import type { Metadata } from "next";
import Link from "next/link";

import { BotaoTema } from "@/components/tema/botao-tema";
import { CLAUSULAS } from "@/lib/clausulas";

export const metadata: Metadata = {
  title: "Termos de uso e Política de privacidade — Sophia",
  description: "Cláusulas do serviço Sophia e como tratamos os seus dados.",
};

/**
 * Página pública dos termos: o mesmo texto do modal de aceite (`CLAUSULAS`), com um endereço
 * próprio. O Google exige este link na tela de login com Google.
 */
export default function PaginaTermos() {
  return (
    <div className="tela-login flex min-h-dvh flex-col px-8 py-5">
      <header className="flex h-6 w-full items-center justify-between">
        <Link href="/" className="pressionavel text-[13px] font-semibold">
          SOPHIA
        </Link>
        <BotaoTema />
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Termos de uso e Política de privacidade</h1>
          <p className="text-tinta-suave text-sm">Cláusulas do serviço Sophia.</p>
        </div>

        <ol className="flex flex-col gap-5">
          {CLAUSULAS.map((clausula) => (
            <li key={clausula.titulo} className="flex flex-col gap-1.5">
              <h2 className="text-[14px] leading-snug font-semibold">{clausula.titulo}</h2>
              <p className="text-tinta-suave text-[13px] leading-relaxed">{clausula.texto}</p>
            </li>
          ))}
        </ol>

        <section className="border-borda flex flex-col gap-1.5 border-t pt-5">
          <h2 className="text-[14px] leading-snug font-semibold">Login com Google</h2>
          <p className="text-tinta-suave text-[13px] leading-relaxed">
            Ao entrar com o Google, a Sophia recebe do Google apenas o seu nome, o seu email e um
            identificador da sua conta Google, usados somente para criar a sua conta e permitir o seu
            acesso. A Sophia não acessa o seu Gmail, o seu Google Drive, os seus contatos nem outros dados
            da sua conta Google.
          </p>
        </section>

        <p className="text-[12px]">
          <Link href="/login" className="pressionavel font-semibold">
            Voltar para o login
          </Link>
        </p>
      </main>
    </div>
  );
}
