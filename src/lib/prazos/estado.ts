import type { PrazoAgendado } from "@/lib/api/prazos";

import { diasEntre, type DataIso } from "./calendario";

export type UrgenciaPrazo = "cumprido" | "vencido" | "hoje" | "proximo" | "futuro";

/** Até quantos dias de calendário o prazo aparece em destaque. */
export const DIAS_EM_DESTAQUE = 3;

export function urgenciaDoPrazo(prazo: Pick<PrazoAgendado, "dataFinal" | "cumprido">, hoje: DataIso): UrgenciaPrazo {
  if (prazo.cumprido) return "cumprido";
  const faltam = diasEntre(hoje, prazo.dataFinal);
  if (faltam < 0) return "vencido";
  if (faltam === 0) return "hoje";
  return faltam <= DIAS_EM_DESTAQUE ? "proximo" : "futuro";
}

/** "Vence hoje", "Vence amanhã", "Faltam 5 dias", "Venceu há 2 dias", "Cumprido". */
export function descreverPrazo(prazo: Pick<PrazoAgendado, "dataFinal" | "cumprido">, hoje: DataIso) {
  if (prazo.cumprido) return "Cumprido";
  const faltam = diasEntre(hoje, prazo.dataFinal);
  if (faltam === 0) return "Vence hoje";
  if (faltam === 1) return "Vence amanhã";
  if (faltam > 1) return `Faltam ${faltam} dias`;
  if (faltam === -1) return "Venceu ontem";
  return `Venceu há ${-faltam} dias`;
}

/** Abertos primeiro (do mais urgente ao mais distante), cumpridos por último. */
export function ordenarPrazos<T extends Pick<PrazoAgendado, "dataFinal" | "cumprido" | "criadoEm">>(prazos: T[]) {
  return [...prazos].sort(
    (a, b) =>
      Number(a.cumprido) - Number(b.cumprido) ||
      a.dataFinal.localeCompare(b.dataFinal) ||
      a.criadoEm.localeCompare(b.criadoEm),
  );
}
