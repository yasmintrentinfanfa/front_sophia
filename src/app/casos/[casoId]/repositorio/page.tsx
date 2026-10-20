"use client";

import { useState } from "react";

import { ColunasAnalise } from "@/components/casos/colunas-analise";
import { useCasoAtual } from "@/components/casos/contexto-caso-atual";
import { ModalPecaProcessual } from "@/components/casos/modal-peca-processual";
import { INSIGHTS } from "@/lib/analise/dados";
import { listarPecas, ROTULO_TIPO_PECA, type PecaGerada } from "@/lib/pecas";
import { cn } from "@/lib/utils";

type Aba = "transcricao" | "documentos" | "analise" | "historico";

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: "transcricao", rotulo: "Transcrição" },
  { valor: "documentos", rotulo: "Documentos" },
  { valor: "analise", rotulo: "Análise" },
  { valor: "historico", rotulo: "Histórico" },
];

const TRANSCRICAO = [
  { tempo: "00:12", texto: "Cliente descreve atraso de pagamentos" },
  { tempo: "00:45", texto: "Advogado questiona sobre cláusula penal" },
  { tempo: "01:20", texto: "Cliente menciona tentativa de acordo" },
];

const DOCUMENTOS = [
  { nome: "contrato-assinado.pdf", status: "limpo" as const },
  { nome: "comprovantes-pagamento.pdf", status: "limpo" as const },
  { nome: "troca-emails.pdf", status: "suspeito" as const },
];

const ROTULO_STATUS_DOCUMENTO = {
  limpo: "Verificado",
  suspeito: "Instrução oculta removida",
  pendente: "Verificando…",
};

export default function PaginaRepositorio() {
  const caso = useCasoAtual();
  const [aba, setAba] = useState<Aba>("transcricao");
  const [modalPecaAberto, setModalPecaAberto] = useState(false);
  // O layout do caso só renderiza a página no cliente, depois de carregar a lista.
  const [pecas, setPecas] = useState<PecaGerada[]>(() => listarPecas(caso.id));

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <h1 className="text-[22px] leading-none font-bold">Repositório do caso</h1>
        <p className="text-[13px]">{caso.titulo}</p>
      </header>

      <nav className="flex shrink-0 gap-1 px-7 pt-3" role="tablist" aria-label="Seções do repositório">
        {ABAS.map((item) => (
          <button
            key={item.valor}
            type="button"
            role="tab"
            aria-selected={aba === item.valor}
            onClick={() => setAba(item.valor)}
            className={cn(
              "flex h-10 items-center rounded-t-[8px] border-b-2 px-4 text-[13px] font-semibold",
              aba === item.valor ? "border-destaque text-tinta" : "text-tinta-suave border-transparent",
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      <div className="border-borda min-h-0 flex-1 overflow-y-auto border-t px-7 pt-5 pb-7">
        {aba === "transcricao" ? (
          <div className="flex max-w-[720px] flex-col gap-3">
            {TRANSCRICAO.map((linha) => (
              <p key={linha.tempo} className="bg-campo border-borda rounded-[8px] border px-4 py-3 text-[13px]">
                <span className="text-tinta-suave font-mono text-[12px]">[{linha.tempo}]</span> {linha.texto}
              </p>
            ))}
            <button
              type="button"
              onClick={() => setModalPecaAberto(true)}
              className="bg-acao text-acao-tinta mt-2 flex h-10 w-fit items-center rounded-[8px] px-4 text-[12px] font-semibold"
            >
              Gerar peça processual
            </button>
          </div>
        ) : null}

        {aba === "documentos" ? (
          <ul className="flex max-w-[720px] flex-col gap-2.5">
            {DOCUMENTOS.map((documento) => (
              <li
                key={documento.nome}
                className="bg-campo border-borda flex items-center justify-between gap-3 rounded-[8px] border px-4 py-3"
              >
                <span className="text-[13px] font-medium">{documento.nome}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    documento.status === "suspeito"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-destaque-suave text-destaque",
                  )}
                >
                  {ROTULO_STATUS_DOCUMENTO[documento.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {aba === "analise" ? <ColunasAnalise insights={INSIGHTS} /> : null}

        {aba === "historico" ? (
          <div className="flex flex-col gap-3">
            {pecas.length === 0 ? (
              <p className="text-tinta-suave text-[13px]">Nenhuma peça gerada ainda para este caso.</p>
            ) : (
              <ul className="flex max-w-[720px] flex-col gap-2.5">
                {pecas.map((peca) => (
                  <li key={peca.id} className="bg-campo border-borda rounded-[8px] border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold">{ROTULO_TIPO_PECA[peca.tipo]}</span>
                      <span className="text-tinta-suave text-[11px]">
                        {new Date(peca.geradaEm).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <pre className="text-tinta-suave mt-2 max-h-24 overflow-hidden text-[11px] whitespace-pre-wrap">
                      {peca.conteudo}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setModalPecaAberto(true)}
              className="border-borda bg-campo flex h-9 w-fit items-center rounded-[8px] border px-3 text-[12px] font-semibold"
            >
              Gerar nova peça
            </button>
          </div>
        ) : null}
      </div>

      <ModalPecaProcessual
        aberto={modalPecaAberto}
        aoFechar={() => setModalPecaAberto(false)}
        caso={caso}
        aoGerar={() => setPecas(listarPecas(caso.id))}
      />
    </>
  );
}
