import Image from "next/image";

import { FormularioPagamento } from "@/components/conta/formulario-pagamento";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { LinkTermos } from "@/components/login/link-termos";
import { BotaoTema } from "@/components/tema/botao-tema";

export default function PaginaPagamento() {
  return (
    <div className="tela-login flex min-h-dvh flex-col overflow-x-clip px-8 py-5">
      <header className="flex h-6 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino="/criar-conta" />
          <span className="text-[13px] font-semibold">SOPHIA</span>
        </div>
        <div className="flex items-center gap-2">
          <BotaoTema />
          <LinkTermos />
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-6">
        <div className="flex w-full max-w-[520px] flex-col items-center gap-3">
          <Image
            src="/logo-sophia.png"
            alt="Sophia"
            width={72}
            height={61}
            priority
            className="h-[61px] w-[72px] object-contain dark:hidden"
          />
          <Image
            src="/logo-sophia-escuro.png"
            alt="Sophia"
            width={72}
            height={61}
            priority
            className="hidden h-[61px] w-[72px] object-contain dark:block"
          />
          <FormularioPagamento />
        </div>
      </main>
    </div>
  );
}
