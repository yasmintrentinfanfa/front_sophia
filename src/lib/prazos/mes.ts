/**
 * Grade mensal do calendário de prazos. Datas em "AAAA-MM-DD", sem fuso (como em calendario.ts):
 * a semana começa no domingo, como nos calendários de escritório.
 */

import { somarDias, type DataIso } from "./calendario";

/** `mes` vai de 1 (janeiro) a 12 (dezembro). */
export interface Mes {
  ano: number;
  mes: number;
}

export const DIAS_DA_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"] as const;

const NOMES_DOS_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Mês da data ("2026-12-09" → dezembro de 2026). */
export function mesDe(iso: DataIso): Mes {
  return { ano: Number(iso.slice(0, 4)), mes: Number(iso.slice(5, 7)) };
}

/** Mês `delta` meses depois (negativo = antes), atravessando o ano. */
export function mesVizinho({ ano, mes }: Mes, delta: number): Mes {
  const indice = ano * 12 + (mes - 1) + delta;
  return { ano: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function mesmoMes(a: Mes, b: Mes) {
  return a.ano === b.ano && a.mes === b.mes;
}

/** "Dezembro de 2026". */
export function tituloDoMes({ ano, mes }: Mes) {
  return `${NOMES_DOS_MESES[mes - 1]} de ${ano}`;
}

/** Dia da semana de 0 (domingo) a 6 (sábado). */
export function diaDaSemana(iso: DataIso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/**
 * Semanas que a grade mostra, de domingo a sábado: começa no domingo da semana do dia 1 e
 * termina no sábado da semana do último dia (de 4 a 6 semanas). Os dias de fora do mês entram
 * para completar as linhas.
 */
export function semanasDoMes({ ano, mes }: Mes): DataIso[][] {
  const primeiro = `${ano}-${doisDigitos(mes)}-01`;
  const proximo = mesVizinho({ ano, mes }, 1);
  const ultimo = somarDias(`${proximo.ano}-${doisDigitos(proximo.mes)}-01`, -1);
  let dia = somarDias(primeiro, -diaDaSemana(primeiro));
  const fim = somarDias(ultimo, 6 - diaDaSemana(ultimo));

  const semanas: DataIso[][] = [];
  while (dia <= fim) {
    const semana: DataIso[] = [];
    for (let i = 0; i < 7; i += 1) {
      semana.push(dia);
      dia = somarDias(dia, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

/** Agrupa pela data final; dentro do dia, a ordem de chegada é mantida. */
export function prazosPorDia<T extends { dataFinal: DataIso }>(prazos: T[]) {
  const dias = new Map<DataIso, T[]>();
  for (const prazo of prazos) {
    const lista = dias.get(prazo.dataFinal);
    if (lista) lista.push(prazo);
    else dias.set(prazo.dataFinal, [prazo]);
  }
  return dias;
}

const formatoDiaPorExtenso = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "Terça-feira, 1 de dezembro de 2026". */
export function diaPorExtenso(iso: DataIso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const texto = formatoDiaPorExtenso.format(new Date(Date.UTC(ano, mes - 1, dia)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
