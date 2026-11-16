import type { Insight, NivelPrecedente, SituacaoPrecedente } from "@/lib/api/analise";

/** Abas da coluna de precedentes, na ordem de autoridade (como no catálogo do backend). */
export const NIVEIS: { id: NivelPrecedente; rotulo: string; descricao: string }[] = [
  { id: "N1", rotulo: "Vinculantes", descricao: "STF e repetitivos do STJ e do TST" },
  { id: "N2", rotulo: "Uniformização", descricao: "Súmulas dos tribunais superiores e TNU" },
  { id: "N3", rotulo: "Regionais", descricao: "TRF, TRT, TJ e turmas regionais (valem na região)" },
];

export const SITUACOES: Record<SituacaoPrecedente, string> = {
  vigente: "Vigente",
  em_atencao: "Em atenção",
  alterado: "Alterado",
  superado: "Superado",
};

const REGIONAL = /^(TRF|TRT|TRU|TJ)/;

function tribunalDo(item: Insight) {
  return (item.tribunal ?? item.fontes[0]?.tribunal ?? "").toUpperCase().replace(/\s/g, "");
}

/**
 * Nível do precedente. O backend já manda `nivel`; análises antigas e o modo de demonstração não
 * têm o campo, então ele é deduzido do tribunal e do tipo (súmula vai para uniformização).
 */
export function nivelDoInsight(item: Insight): NivelPrecedente {
  if (item.nivel) return item.nivel;
  const tribunal = tribunalDo(item);
  const texto = `${item.identificador ?? ""} ${item.titulo} ${item.fontes[0]?.identificador ?? ""}`;
  if (REGIONAL.test(tribunal)) return "N3";
  if (tribunal === "TNU" || /s[úu]mula/i.test(texto)) return "N2";
  return "N1";
}

/** Rótulo curto do card: "STJ · Tema 1124". */
export function rotuloDoPrecedente(item: Insight) {
  const tribunal = item.tribunal ?? item.fontes[0]?.tribunal;
  const partes = [tribunal && tribunal !== "Fonte citada" ? tribunal : null, item.identificador].filter(Boolean);
  return partes.join(" · ");
}

export function agruparPorNivel(itens: Insight[]) {
  const grupos: Record<NivelPrecedente, Insight[]> = { N1: [], N2: [], N3: [] };
  for (const item of itens) grupos[nivelDoInsight(item)].push(item);
  return grupos;
}
