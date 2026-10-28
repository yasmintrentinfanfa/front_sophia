"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Tutorial } from "@/components/tutorial/tutorial";
import { gravarTutorialVisto, viuTutorial } from "@/lib/tutorial";

const ContextoTutorial = createContext<{ abrirTutorial: () => void }>({ abrirTutorial: () => {} });

/**
 * Abre o tutorial sozinho no primeiro acesso do usuário e deixa qualquer tela reabri-lo
 * (Configurações → "Ver tutorial"). Só é montado depois que o layout confirma a sessão,
 * já no navegador, então ler o localStorage na renderização é seguro.
 */
export function ProvedorTutorial({ usuarioId, children }: { usuarioId: string | null; children: ReactNode }) {
  const [reaberto, setReaberto] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const primeiroAcesso = Boolean(usuarioId) && !dispensado && !viuTutorial(usuarioId ?? "");

  function fechar() {
    if (usuarioId) gravarTutorialVisto(usuarioId);
    setDispensado(true);
    setReaberto(false);
  }

  return (
    <ContextoTutorial.Provider value={{ abrirTutorial: () => setReaberto(true) }}>
      {children}
      <Tutorial aberto={reaberto || primeiroAcesso} aoFechar={fechar} />
    </ContextoTutorial.Provider>
  );
}

export function useTutorial() {
  return useContext(ContextoTutorial);
}
