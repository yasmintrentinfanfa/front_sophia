import Image from "next/image";

import { FormularioCriarConta } from "@/components/criar-conta/formulario-criar-conta";
import { BotaoTema } from "@/components/tema/botao-tema";

export default function PaginaCriarConta() {
  return (
    <div className="tela-login flex min-h-dvh flex-col px-8 py-5">
      <header className="flex h-6 w-full items-center justify-between">
        <span className="text-[13px] font-semibold">SOPHIA</span>
        <div className="flex items-center gap-2">
          <BotaoTema />
          <p className="text-destaque dark:text-tinta text-right text-[11px]">
            Termos de uso e Política de privacidade
          </p>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-6">
        <Image
          src="/logo-sophia.png"
          alt="Sophia"
          width={120}
          height={102}
          priority
          className="h-[102px] w-[120px] object-contain dark:hidden"
        />
        <Image
          src="/logo-sophia-escuro.png"
          alt="Sophia"
          width={80}
          height={82}
          priority
          className="hidden h-[82px] w-[80px] rounded-full dark:block"
        />

        <div className="flex w-[360px] flex-col gap-4">
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-sm">Comece a usar a Sophia no seu escritório</p>

          <FormularioCriarConta />
        </div>
      </main>
    </div>
  );
}
