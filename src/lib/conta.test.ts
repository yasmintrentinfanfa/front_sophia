import { describe, expect, it } from "vitest";

import type { Usuario } from "@/lib/api/types";
import { redirecionamentoDosCasos, rotaInicial } from "@/lib/conta";

const usuario = (statusConta: Usuario["statusConta"]): Usuario => ({
  id: "u1",
  nome: "Ana",
  email: "ana@teste.com",
  statusConta,
  contaAtiva: true,
  criadoEm: "2026-10-01T00:00:00.000Z",
});

describe("acesso a /casos", () => {
  it("manda para o login quem não tem sessão", () => {
    expect(redirecionamentoDosCasos(null)).toBe("/login");
  });

  // MVP sem plano: conta sem assinatura também entra. Com os planos de volta, o esperado é "/assinatura".
  it("libera quem ainda não escolheu plano", () => {
    expect(redirecionamentoDosCasos(usuario("pagamento_pendente"))).toBeNull();
  });

  it("libera quem tem assinatura ativa", () => {
    expect(redirecionamentoDosCasos(usuario("ativa"))).toBeNull();
  });
});

describe("rota depois de entrar ou criar conta", () => {
  it("vai para os casos, com ou sem plano", () => {
    // MVP sem plano. Com os planos de volta: pagamento_pendente → "/assinatura".
    expect(rotaInicial(usuario("pagamento_pendente"))).toBe("/casos");
    expect(rotaInicial(usuario("ativa"))).toBe("/casos");
  });
});
