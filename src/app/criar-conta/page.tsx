"use client";

import { useState } from "react";

import { FormularioCriarConta } from "@/components/conta/formulario-criar-conta";
import { ModalClausulas } from "@/components/casos/modal-clausulas";
import styles from "@/components/fluxo/telas.module.css";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";

export default function PaginaCriarConta() {
  const [termosAbertos, setTermosAbertos] = useState(false);
  return (
    <div className={`${styles.tela} ${styles.acesso} bg-fundo`}>
      <header className="flex min-h-8 shrink-0 items-center gap-3">
        <BotaoVoltar destino="/login" />
        <button
          type="button"
          onClick={() => setTermosAbertos(true)}
          className="text-left text-[11px] text-[var(--texto-discreto)]"
        >
          Termos de uso e Politica de privacidade
        </button>
      </header>
      <main className={styles.corpoAcesso}>
        <FormularioCriarConta />
      </main>
      <ModalClausulas
        aberto={termosAbertos}
        modo="consulta"
        aoFechar={() => setTermosAbertos(false)}
      />
    </div>
  );
}
