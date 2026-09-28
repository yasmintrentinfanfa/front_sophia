"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BarraLateralCasos } from "@/components/casos/barra-lateral-casos";
import { ProvedorListaCasos } from "@/components/casos/contexto-lista-casos";
import { VoltarNosCasos } from "@/components/fluxo/botao-voltar";
import type { ConteudoCaso } from "@/lib/api/analise";
import { api } from "@/lib/api";
import type { Caso, DadosNovoCaso, PastaCaso } from "@/lib/api/types";

export default function LayoutCasos({ children }: { children: ReactNode }) {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    api
      .listarCasos()
      .then((lista) => {
        if (ativo) setCasos(lista);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const contexto = useMemo(
    () => ({
      casos,
      carregando,
      async finalizarSessao(id: string, transcricao: ConteudoCaso["transcricao"]) {
        const atualizado = await api.finalizarSessao(id, transcricao);
        setCasos((lista) => lista.map((item) => item.id === id ? atualizado : item));
      },
      async criarCaso(dados: DadosNovoCaso) {
        const criado = await api.criarCaso(dados);
        setCasos((lista) => [criado, ...lista.filter((item) => item.id !== criado.id)]);
        return criado;
      },
      async moverCaso(id: string, pasta: PastaCaso) {
        const atualizado = await api.moverCaso(id, pasta);
        setCasos((lista) => lista.map((item) => (item.id === id ? atualizado : item)));
      },
      async excluirCaso(id: string) {
        await api.excluirCaso(id);
        setCasos((lista) => lista.filter((item) => item.id !== id));
      },
    }),
    [carregando, casos],
  );

  return (
    <ProvedorListaCasos value={contexto}>
      <div className="bg-fundo flex h-dvh overflow-hidden">
        <BarraLateralCasos casos={casos} carregando={carregando} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <VoltarNosCasos />
          {children}
        </main>
      </div>
    </ProvedorListaCasos>
  );
}
