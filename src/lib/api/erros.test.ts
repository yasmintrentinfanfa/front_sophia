/** Mensagens de erro que chegam à tela: o motivo real aparece quando a resposta foge do padrão `{ erro }`. */

import { afterEach, describe, expect, it, vi } from "vitest";

import { requisitarJson } from "@/lib/api/conta";

afterEach(() => vi.unstubAllGlobals());

function responder(resposta: Response) {
  vi.stubGlobal("fetch", vi.fn(async () => resposta));
}

const mensagem = (promessa: Promise<unknown>) => promessa.then(() => "", (falha: Error) => falha.message);

describe("requisitarJson", () => {
  it("usa o { erro } do servidor como está", async () => {
    responder(Response.json({ erro: "Informe o número da OAB." }, { status: 400 }));
    expect(await mensagem(requisitarJson("/api/x"))).toBe("Informe o número da OAB.");
  });

  it("erro 500 em HTML mostra status, rota e o texto", async () => {
    responder(new Response("<html><body><h1>Internal Server Error</h1></body></html>", { status: 500 }));
    expect(await mensagem(requisitarJson("/api/prazos/monitoramentos", { method: "POST" }))).toBe(
      "Algo deu errado. (HTTP 500 em POST /api/prazos/monitoramentos: Internal Server Error)",
    );
  });

  it("detail do FastAPI aparece", async () => {
    responder(Response.json({ detail: "Method Not Allowed" }, { status: 405 }));
    expect(await mensagem(requisitarJson("/api/x"))).toContain("HTTP 405 em GET /api/x: Method Not Allowed");
  });

  it("status conhecido sem corpo fica com a mensagem amigável", async () => {
    responder(new Response(null, { status: 404 }));
    expect(await mensagem(requisitarJson("/api/x"))).toBe("Caso não encontrado.");
  });

  it("falha de rede diz qual chamada falhou", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    expect(await mensagem(requisitarJson("/api/prazos"))).toContain("(GET /api/prazos: Failed to fetch)");
  });
});
