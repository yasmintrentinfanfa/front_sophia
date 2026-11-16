/**
 * Datas de apoio ao prazo, todas em "AAAA-MM-DD" (sem fuso: é a data do calendário forense).
 *
 * A Sophia não decide o prazo. Estas contas só ajudam o advogado a preencher a data final,
 * que ele confere e pode trocar antes de salvar. Por isso a regra é conservadora:
 *
 * - Feriados: só os nacionais certos (Lei 662/1949, Lei 6.802/1980, Lei 14.759/2023) e a
 *   Sexta-feira Santa. Carnaval, Corpus Christi e feriados locais NÃO entram. Esquecer um
 *   feriado deixa a data igual ou ANTERIOR à real, nunca depois dela.
 * - Disponibilização no DJEN em D → publicação no primeiro dia útil seguinte → a contagem
 *   começa no primeiro dia útil depois da publicação (Lei 11.419/2006, art. 4º, §§ 3º e 4º;
 *   CPC, art. 224, § 3º; Resolução CNJ 455/2022).
 * - Dias úteis (CPC, art. 219): o recesso de 20/12 a 20/01 suspende a contagem (CPC, art. 220).
 * - Dias corridos: o vencimento em dia sem expediente passa para o próximo dia útil
 *   (CPC, art. 224, § 1º). O recesso não entra nessa conta.
 */

export type DataIso = string;
export type TipoContagem = "uteis" | "corridos";

const DIA_MS = 86_400_000;

function paraData(iso: DataIso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function paraIso(data: Date): DataIso {
  return data.toISOString().slice(0, 10);
}

export function somarDias(iso: DataIso, dias: number): DataIso {
  return paraIso(new Date(paraData(iso).getTime() + dias * DIA_MS));
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): DataIso {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const cacheFeriados = new Map<number, Map<DataIso, string>>();

export function feriadosNacionais(ano: number): Map<DataIso, string> {
  const salvo = cacheFeriados.get(ano);
  if (salvo) return salvo;
  const fixos: [string, string][] = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["12-25", "Natal"],
  ];
  if (ano >= 2024) fixos.push(["11-20", "Dia Nacional de Zumbi e da Consciência Negra"]);
  const feriados = new Map<DataIso, string>(fixos.map(([diaMes, nome]) => [`${ano}-${diaMes}`, nome]));
  feriados.set(somarDias(pascoa(ano), -2), "Sexta-feira Santa");
  cacheFeriados.set(ano, feriados);
  return feriados;
}

export function nomeDoFeriado(iso: DataIso) {
  return feriadosNacionais(Number(iso.slice(0, 4))).get(iso) ?? null;
}

export function ehDiaUtil(iso: DataIso) {
  const semana = paraData(iso).getUTCDay();
  return semana !== 0 && semana !== 6 && !nomeDoFeriado(iso);
}

/** Recesso forense de 20/12 a 20/01 (CPC, art. 220). */
export function emRecesso(iso: DataIso) {
  const mes = Number(iso.slice(5, 7));
  const dia = Number(iso.slice(8, 10));
  return (mes === 12 && dia >= 20) || (mes === 1 && dia <= 20);
}

/** Primeiro dia útil depois de `iso` (nunca o próprio dia). */
export function proximoDiaUtil(iso: DataIso) {
  let atual = somarDias(iso, 1);
  while (!ehDiaUtil(atual)) atual = somarDias(atual, 1);
  return atual;
}

/** Publicação e início da contagem a partir da disponibilização no DJEN. */
export function datasDaIntimacao(disponibilizacao: DataIso) {
  const publicacao = proximoDiaUtil(disponibilizacao);
  return { publicacao, inicioContagem: proximoDiaUtil(publicacao) };
}

const contaEmDiasUteis = (iso: DataIso) => ehDiaUtil(iso) && !emRecesso(iso);

/**
 * Vencimento de um prazo de `quantidade` dias contado a partir de `inicio` (o 1º dia do prazo).
 * Ex.: início 21/05/2025, 15 dias úteis → 10/06/2025.
 */
export function vencimento(inicio: DataIso, quantidade: number, tipo: TipoContagem): DataIso {
  const total = Math.max(1, Math.floor(quantidade));
  if (tipo === "corridos") {
    let final = somarDias(inicio, total - 1);
    while (!ehDiaUtil(final)) final = somarDias(final, 1);
    return final;
  }
  let atual = inicio;
  while (!contaEmDiasUteis(atual)) atual = somarDias(atual, 1);
  for (let contados = 1; contados < total; contados += 1) {
    atual = somarDias(atual, 1);
    while (!contaEmDiasUteis(atual)) atual = somarDias(atual, 1);
  }
  return atual;
}

/** Hoje no calendário de Brasília, mesmo com o navegador em outro fuso. */
export function hojeEmBrasilia(agora = new Date()): DataIso {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return partes;
}

/** Dias de calendário de `de` até `ate` (negativo = já passou). */
export function diasEntre(de: DataIso, ate: DataIso) {
  return Math.round((paraData(ate).getTime() - paraData(de).getTime()) / DIA_MS);
}

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const formatoDiaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

/** "2026-11-13" → "13/11/2026". */
export function formatarData(iso: DataIso | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? "";
  return formatoData.format(paraData(iso));
}

/** "2026-11-13" → "sex., 13/11/2026". */
export function formatarDataComSemana(iso: DataIso) {
  return `${formatoDiaSemana.format(paraData(iso))}, ${formatarData(iso)}`;
}
