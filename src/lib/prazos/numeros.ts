/**
 * Número único de processo (CNJ, NNNNNNN-DD.AAAA.J.TR.OOOO) e número da OAB.
 * O backend valida de novo (`backend/prazos/numeros.py`); aqui é para avisar na hora.
 */

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Máscara progressiva enquanto o advogado digita ou cola o número. */
export function mascararProcesso(valor: string) {
  const d = soDigitos(valor).slice(0, 20);
  const partes: [number, number, string][] = [
    [0, 7, ""],
    [7, 9, "-"],
    [9, 13, "."],
    [13, 14, "."],
    [14, 16, "."],
    [16, 20, "."],
  ];
  return partes
    .filter(([inicio]) => d.length > inicio)
    .map(([inicio, fim, separador]) => separador + d.slice(inicio, fim))
    .join("");
}

export function formatarProcesso(digitos: string | null | undefined) {
  if (!digitos) return "";
  return soDigitos(digitos).length === 20 ? mascararProcesso(digitos) : digitos;
}

/** Resto da divisão por 97 de um número em texto, sem BigInt. */
function modulo97(digitos: string) {
  let resto = 0;
  for (const caractere of digitos) resto = (resto * 10 + Number(caractere)) % 97;
  return resto;
}

/** Dígito verificador do CNJ (ISO 7064, módulo 97). */
export function processoValido(valor: string) {
  const d = soDigitos(valor);
  if (d.length !== 20) return false;
  const dv = 98 - modulo97(d.slice(0, 7) + d.slice(9) + "00");
  return String(dv).padStart(2, "0") === d.slice(7, 9);
}

/** "100000" + "SP" → "OAB/SP 100.000". */
export function rotuloOab(numero: string | null | undefined, uf: string | null | undefined) {
  const digitos = soDigitos(numero ?? "");
  const comPontos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `OAB/${uf ?? ""} ${comPontos}`.trim();
}
