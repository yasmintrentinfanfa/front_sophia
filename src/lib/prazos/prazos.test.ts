import { describe, expect, it } from "vitest";

import {
  datasDaIntimacao,
  diasEntre,
  ehDiaUtil,
  emRecesso,
  formatarData,
  hojeEmBrasilia,
  nomeDoFeriado,
  pascoa,
  vencimento,
} from "@/lib/prazos/calendario";
import { descreverPrazo, ordenarPrazos, urgenciaDoPrazo } from "@/lib/prazos/estado";
import { formatarProcesso, mascararProcesso, processoValido, rotuloOab } from "@/lib/prazos/numeros";

describe("número do processo", () => {
  it("aplica a máscara do CNJ enquanto digita", () => {
    expect(mascararProcesso("1003686")).toBe("1003686");
    expect(mascararProcesso("10036864")).toBe("1003686-4");
    expect(mascararProcesso("10036864920158260586")).toBe("1003686-49.2015.8.26.0586");
    expect(mascararProcesso("1003686-49.2015.8.26.0586999")).toBe("1003686-49.2015.8.26.0586");
  });

  it("confere o dígito verificador (número real do TJSP)", () => {
    expect(processoValido("1003686-49.2015.8.26.0586")).toBe(true);
    expect(processoValido("1003686-48.2015.8.26.0586")).toBe(false);
    expect(processoValido("123")).toBe(false);
  });

  it("formata só quando tem 20 dígitos", () => {
    expect(formatarProcesso("10036864920158260586")).toBe("1003686-49.2015.8.26.0586");
    expect(formatarProcesso("")).toBe("");
  });

  it("monta o rótulo da OAB", () => {
    expect(rotuloOab("100000", "SP")).toBe("OAB/SP 100.000");
    expect(rotuloOab("9876", "RJ")).toBe("OAB/RJ 9.876");
  });
});

describe("calendário forense", () => {
  it("calcula a Páscoa e a Sexta-feira Santa", () => {
    expect(pascoa(2025)).toBe("2025-04-20");
    expect(pascoa(2026)).toBe("2026-04-05");
    expect(nomeDoFeriado("2026-04-03")).toBe("Sexta-feira Santa");
  });

  it("Consciência Negra só é feriado nacional a partir de 2024", () => {
    expect(ehDiaUtil("2023-11-20")).toBe(true);
    expect(ehDiaUtil("2025-11-20")).toBe(false);
  });

  it("não inventa feriado: Carnaval e Corpus Christi contam como dia útil (data nunca passa da real)", () => {
    expect(ehDiaUtil("2026-02-16")).toBe(true);
    expect(ehDiaUtil("2026-06-04")).toBe(true);
  });

  it("disponibilização → publicação no dia útil seguinte → contagem no dia útil depois", () => {
    // Exemplo do TJMG: disponibilizado em 19/05/2025, publicado em 20/05, contagem a partir de 21/05.
    expect(datasDaIntimacao("2025-05-19")).toEqual({ publicacao: "2025-05-20", inicioContagem: "2025-05-21" });
    // Sexta → segunda → terça.
    expect(datasDaIntimacao("2026-11-13")).toEqual({ publicacao: "2026-11-16", inicioContagem: "2026-11-17" });
  });

  it("pula feriado nacional na publicação", () => {
    // 19/11/2026 (qui) → 20/11 é feriado → publicação 23/11 (seg), contagem 24/11.
    expect(datasDaIntimacao("2026-11-19")).toEqual({ publicacao: "2026-11-23", inicioContagem: "2026-11-24" });
  });

  it("conta dias úteis com o início como 1º dia", () => {
    expect(vencimento("2025-05-21", 15, "uteis")).toBe("2025-06-10");
    expect(vencimento("2025-05-21", 1, "uteis")).toBe("2025-05-21");
  });

  it("dias úteis param no recesso de 20/12 a 20/01", () => {
    expect(emRecesso("2026-12-20")).toBe(true);
    expect(emRecesso("2027-01-20")).toBe(true);
    expect(emRecesso("2027-01-21")).toBe(false);
    // 17/12/2026 (qui) é o 1º dia, 18/12 o 2º; o 3º só em 21/01/2027.
    expect(vencimento("2026-12-17", 3, "uteis")).toBe("2027-01-21");
  });

  it("dias corridos: vencimento sem expediente passa para o próximo dia útil", () => {
    // 5 dias a partir de 09/11/2026 (seg) → 13/11 (sex).
    expect(vencimento("2026-11-09", 5, "corridos")).toBe("2026-11-13");
    // 6 dias → 14/11 (sáb) → 15/11 é feriado e domingo → 16/11 (seg).
    expect(vencimento("2026-11-09", 6, "corridos")).toBe("2026-11-16");
  });

  it("usa o dia de Brasília e formata em pt-BR", () => {
    expect(hojeEmBrasilia(new Date("2026-11-16T01:30:00Z"))).toBe("2026-11-15");
    expect(formatarData("2026-11-13")).toBe("13/11/2026");
    expect(diasEntre("2026-11-15", "2026-11-18")).toBe(3);
  });
});

describe("situação do prazo", () => {
  const hoje = "2026-11-15";

  it("descreve o quanto falta", () => {
    expect(descreverPrazo({ dataFinal: "2026-11-15", cumprido: false }, hoje)).toBe("Vence hoje");
    expect(descreverPrazo({ dataFinal: "2026-11-16", cumprido: false }, hoje)).toBe("Vence amanhã");
    expect(descreverPrazo({ dataFinal: "2026-11-20", cumprido: false }, hoje)).toBe("Faltam 5 dias");
    expect(descreverPrazo({ dataFinal: "2026-11-13", cumprido: false }, hoje)).toBe("Venceu há 2 dias");
    expect(descreverPrazo({ dataFinal: "2026-11-13", cumprido: true }, hoje)).toBe("Cumprido");
  });

  it("classifica a urgência", () => {
    expect(urgenciaDoPrazo({ dataFinal: "2026-11-14", cumprido: false }, hoje)).toBe("vencido");
    expect(urgenciaDoPrazo({ dataFinal: "2026-11-15", cumprido: false }, hoje)).toBe("hoje");
    expect(urgenciaDoPrazo({ dataFinal: "2026-11-18", cumprido: false }, hoje)).toBe("proximo");
    expect(urgenciaDoPrazo({ dataFinal: "2026-11-30", cumprido: false }, hoje)).toBe("futuro");
  });

  it("ordena abertos por data e deixa os cumpridos no fim", () => {
    const lista = ordenarPrazos([
      { dataFinal: "2026-11-30", cumprido: false, criadoEm: "1" },
      { dataFinal: "2026-11-01", cumprido: true, criadoEm: "2" },
      { dataFinal: "2026-11-20", cumprido: false, criadoEm: "3" },
    ]);
    expect(lista.map((p) => p.criadoEm)).toEqual(["3", "1", "2"]);
  });
});
