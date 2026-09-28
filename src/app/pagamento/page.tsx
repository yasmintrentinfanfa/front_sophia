import Image from "next/image";

import { FormularioPagamento } from "@/components/conta/formulario-pagamento";
import styles from "@/components/fluxo/telas.module.css";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";

export default function PaginaPagamento() {
  return (
    <div className={`${styles.tela} ${styles.acesso} bg-fundo overflow-x-clip`}>
      <header className="flex min-h-8 shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BotaoVoltar destino="/criar-conta" />
          <div className="text-[14px] font-bold">SOPHIA</div>
        </div>
        <p className="text-[11px] text-[var(--texto-discreto)]">
          Assinatura segura
        </p>
      </header>
      <main className={styles.corpoAcesso}>
        <div className="flex w-full max-w-[520px] flex-col items-center gap-3">
          <Image
            src="/logo-sophia.png"
            alt="Sophia"
            width={72}
            height={61}
            priority
            className="hidden h-[61px] w-[72px] object-cover dark:block"
          />
          <FormularioPagamento />
        </div>
      </main>
    </div>
  );
}
