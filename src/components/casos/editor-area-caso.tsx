"use client";

import { useId, useState } from "react";
import { PenLine } from "lucide-react";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { SeletorAreaJuridica } from "@/components/casos/seletor-area-juridica";
import { areaPorId } from "@/lib/casos/areas-juridicas";

/**
 * Mostra a área jurídica do caso e permite trocá-la. Sem área (caso antigo), avisa
 * que a IA está usando orientação genérica e oferece o mesmo seletor para escolher uma.
 */
export function EditorAreaCaso({ casoId, area }: { casoId: string; area?: string }) {
  const idCampo = useId();
  const { alterarArea } = useListaCasos();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const nomeAtual = areaPorId(area)?.nome;

  async function salvar(novaArea: string) {
    setSalvando(true);
    setErro("");
    try {
      await alterarArea(casoId, novaArea);
      setEditando(false);
      const nome = areaPorId(novaArea)?.nome ?? novaArea;
      setAviso(
        `Área alterada. A próxima análise já usa a orientação de ${nome}. Gere ou atualize a análise para refazer os cards.`,
      );
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível alterar a área.");
    } finally {
      setSalvando(false);
    }
  }

  if (editando) {
    return (
      <div className="flex max-w-[320px] flex-col gap-1.5">
        <SeletorAreaJuridica id={idCampo} valor={area ?? ""} aoMudar={(novaArea) => void salvar(novaArea)} />
        {salvando ? <p className="text-tinta-suave text-[11px]">Salvando…</p> : null}
        {erro ? (
          <p role="alert" className="text-destructive text-[11px] font-medium">
            {erro}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setEditando(false)}
          disabled={salvando}
          className="text-tinta-suave self-start text-[11px] underline"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {nomeAtual ? (
          <span className="text-[12px]">
            Área: <strong className="font-semibold">{nomeAtual}</strong>
          </span>
        ) : (
          <span className="text-destaque text-[12px]">
            Área não definida: a IA está usando uma orientação genérica.
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-destaque flex items-center gap-1 text-[11px] font-semibold underline"
        >
          <PenLine className="size-3" aria-hidden />
          {nomeAtual ? "Alterar área" : "Escolher área"}
        </button>
      </div>
      {aviso ? <p className="text-tinta-suave text-[11px]">{aviso}</p> : null}
      {erro ? (
        <p role="alert" className="text-destructive text-[11px] font-medium">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
