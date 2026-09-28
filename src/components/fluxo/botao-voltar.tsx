"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const ContextoVoltar = createContext<((destino: string) => void) | null>(null);

export function ProvedorNavegacao({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const caminhos = useRef<string[]>([]);

  useEffect(() => {
    const historico = caminhos.current;
    if (historico.at(-1) === pathname) return;
    // Encerrar ou sair da sessao substitui sua entrada no navegador.
    if (historico.at(-1)?.endsWith("/sessao") && /\/(analise|gravacao)$/.test(pathname)) {
      historico.pop();
    }
    const anterior = historico.lastIndexOf(pathname);
    if (anterior >= 0) historico.splice(anterior + 1);
    else historico.push(pathname);
  }, [pathname]);

  function voltar(destino: string) {
    if (caminhos.current.length > 1) {
      caminhos.current.pop();
      router.back();
    } else {
      caminhos.current = [];
      router.replace(destino);
    }
  }

  return <ContextoVoltar value={voltar}>{children}</ContextoVoltar>;
}

export function BotaoVoltar({ destino, aoVoltar, desabilitado = false }: {
  destino: string;
  aoVoltar?: () => void;
  desabilitado?: boolean;
}) {
  const voltar = useContext(ContextoVoltar);
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Voltar"
      title="Voltar"
      disabled={desabilitado}
      onClick={aoVoltar ?? (() => voltar ? voltar(destino) : router.replace(destino))}
      className="pressionavel border-borda text-tinta-suave hover:bg-tinta/5 flex size-8 shrink-0 items-center justify-center rounded-[6px] border disabled:opacity-50"
    >
      <ArrowLeft size={18} aria-hidden="true" />
    </button>
  );
}

export function VoltarNosCasos() {
  const pathname = usePathname();
  if (["/casos", "/casos/arquivo"].includes(pathname) || pathname.endsWith("/sessao")) return null;
  const destino = /\/(chat|repositorio)$/.test(pathname)
    ? pathname.replace(/\/(chat|repositorio)$/, "/analise")
    : "/casos";
  return (
    <div className="shrink-0 px-7 pt-3 max-[700px]:px-4">
      <BotaoVoltar destino={destino} />
    </div>
  );
}
