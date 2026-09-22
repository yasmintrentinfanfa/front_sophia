import Image from "next/image";

import { FormularioLogin } from "@/components/login/formulario-login";

export default function PaginaLogin() {
  return (
    <div className="flex min-h-dvh flex-col px-12 py-8">
      <header className="flex h-6 w-full items-center justify-between">
        <span className="text-sm font-semibold">SOPHIA</span>
        <p className="text-destaque text-right text-xs">
          Termos de uso e Política de privacidade
        </p>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center gap-7 py-10">
        <Image
          src="/logo-sophia.png"
          alt="Sophia"
          width={166}
          height={142}
          priority
          className="h-[142px] w-[166px] object-cover"
        />

        <div className="flex w-[440px] flex-col gap-6">
          <h1 className="text-4xl font-bold">Bem-vindo à Sophia</h1>
          <p className="text-base">IA que apoia advogados em reuniões com clientes</p>

          <FormularioLogin />

          <p className="text-destaque mt-16 text-[13px]">
            Plataforma web para advogados e escritórios jurídicos
          </p>
        </div>
      </main>
    </div>
  );
}
