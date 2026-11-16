/**
 * Rotas `/api/prazos/*`: sem sessão nada chega ao backend, e o `user_id` repassado é sempre
 * o do cookie assinado — nunca um que venha no corpo.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assinarSessao } from "@/lib/servidor/cookie-assinado";

const ANA = "98ff6434-655e-486f-b255-1bd89542ea7f";
const BRUNO = "d11143d4-e6d6-435b-9807-4ecd182e905f";

const cookieAtual = vi.hoisted(() => ({ valor: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieAtual.valor === undefined ? undefined : { value: cookieAtual.valor }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

const { GET: obterPainel } = await import("@/app/api/prazos/route");
const { POST: sincronizar } = await import("@/app/api/prazos/sincronizar/route");
const { POST: acompanhar } = await import("@/app/api/prazos/monitoramentos/route");
const rotaMonitoramento = await import("@/app/api/prazos/monitoramentos/[monitoramentoId]/route");
const { PATCH: marcarPublicacao } = await import("@/app/api/prazos/publicacoes/[publicacaoId]/route");
const { POST: agendar } = await import("@/app/api/prazos/agenda/route");
const rotaPrazo = await import("@/app/api/prazos/agenda/[prazoId]/route");

let backend: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  backend = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
  vi.stubGlobal("fetch", backend);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cookieAtual.valor = undefined;
});

const urlChamada = () => String(backend.mock.calls[0][0]);
const initChamado = () => backend.mock.calls[0][1];
const corpoChamado = () => JSON.parse(String(initChamado()?.body));
const params = <T extends Record<string, string>>(valor: T) => ({ params: Promise.resolve(valor) });
const json = (url: string, corpo: unknown, method = "POST") =>
  new Request(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });

describe("prazos só com sessão", () => {
  it("sem cookie, todas as rotas → 401 sem chamar o backend", async () => {
    const respostas = await Promise.all([
      obterPainel(new Request("http://x/api/prazos")),
      sincronizar(json("http://x/api/prazos/sincronizar", {})),
      acompanhar(json("http://x/api/prazos/monitoramentos", { tipo: "oab", oabNumero: "1", oabUf: "SP" })),
      rotaMonitoramento.PATCH(json("http://x", { casoId: "c" }, "PATCH"), params({ monitoramentoId: "m" })),
      rotaMonitoramento.DELETE(new Request("http://x", { method: "DELETE" }), params({ monitoramentoId: "m" })),
      marcarPublicacao(json("http://x", { situacao: "sem_prazo" }, "PATCH"), params({ publicacaoId: "p" })),
      agendar(json("http://x/api/prazos/agenda", { descricao: "x", dataFinal: "2026-12-01" })),
      rotaPrazo.PATCH(json("http://x", { cumprido: true }, "PATCH"), params({ prazoId: "z" })),
      rotaPrazo.DELETE(new Request("http://x", { method: "DELETE" }), params({ prazoId: "z" })),
    ]);
    expect(respostas.map((r) => r.status)).toEqual(Array(9).fill(401));
    expect(backend).not.toHaveBeenCalled();
  });

  it("cookie adulterado → 401", async () => {
    cookieAtual.valor = `${BRUNO}.${assinarSessao(ANA).split(".").pop()}`;
    expect((await obterPainel(new Request("http://x/api/prazos"))).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("o dono vem do cookie", () => {
  beforeEach(() => {
    cookieAtual.valor = assinarSessao(ANA);
  });

  it("painel do caso pede ao backend com o id da sessão", async () => {
    await obterPainel(new Request("http://x/api/prazos?casoId=caso-1"));
    expect(urlChamada()).toMatch(new RegExp(`/prazos/painel\\?user_id=${ANA}&caso_id=caso-1$`));
  });

  it("user_id no corpo é ignorado ao acompanhar e ao agendar", async () => {
    await acompanhar(
      json("http://x/api/prazos/monitoramentos", { user_id: BRUNO, tipo: "processo", numeroProcesso: "1", casoId: "c" }),
    );
    expect(corpoChamado()).toMatchObject({ user_id: ANA, tipo: "processo", numero_processo: "1", caso_id: "c" });

    backend.mockClear();
    await agendar(json("http://x/api/prazos/agenda", { user_id: BRUNO, descricao: " Réplica ", dataFinal: "2026-12-01" }));
    expect(corpoChamado()).toEqual({ user_id: ANA, descricao: "Réplica", data_final: "2026-12-01" });
  });

  it("sincronizar só força quando pedem com true", async () => {
    await sincronizar(json("http://x/api/prazos/sincronizar", { forcar: "sim" }));
    expect(corpoChamado()).toEqual({ user_id: ANA, forcar: false });
  });

  it("excluir repassa o 204 sem corpo", async () => {
    backend.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const resposta = await rotaPrazo.DELETE(new Request("http://x", { method: "DELETE" }), params({ prazoId: "abc" }));
    expect(resposta.status).toBe(204);
    expect(urlChamada()).toMatch(new RegExp(`/prazos/agenda/abc\\?user_id=${ANA}$`));
    expect(initChamado()?.method).toBe("DELETE");
  });

  it("desligar do caso manda caso_id null", async () => {
    await rotaMonitoramento.PATCH(json("http://x", { casoId: null }, "PATCH"), params({ monitoramentoId: "m1" }));
    expect(corpoChamado()).toEqual({ user_id: ANA, caso_id: null });
    expect(initChamado()?.method).toBe("PATCH");
  });

  it("backend fora do ar → 503 com a mensagem da rota e o motivo, sem o user_id", async () => {
    backend.mockRejectedValueOnce(Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } }));
    const resposta = await obterPainel(new Request("http://x/api/prazos"));
    expect(resposta.status).toBe(503);
    const { erro } = await resposta.json();
    expect(erro).toMatch(/^Não foi possível carregar os prazos\. \(sem resposta de .*\/prazos\/painel: fetch failed: ECONNREFUSED\)$/);
    expect(erro).not.toContain(ANA);
  });

  it("rota inexistente no backend (404 do FastAPI) avisa que o módulo pode não estar publicado", async () => {
    backend.mockResolvedValueOnce(Response.json({ detail: "Not Found" }, { status: 404 }));
    const { erro } = await (await obterPainel(new Request("http://x/api/prazos"))).json();
    expect(erro).toContain("backend respondeu HTTP 404: Not Found");
    expect(erro).toContain("a rota não existe no backend em uso");
  });

  it("erro 500 em texto puro chega com o texto", async () => {
    backend.mockResolvedValueOnce(new Response("Internal Server Error", { status: 500 }));
    const resposta = await acompanhar(json("http://x/api/prazos/monitoramentos", { tipo: "oab" }));
    expect(resposta.status).toBe(500);
    expect((await resposta.json()).erro).toBe(
      "Não foi possível salvar o acompanhamento. (backend respondeu HTTP 500: Internal Server Error)",
    );
  });

  it("validação do FastAPI (422) mostra o detail", async () => {
    backend.mockResolvedValueOnce(
      Response.json({ detail: [{ loc: ["body", "tipo"], msg: "Field required" }] }, { status: 422 }),
    );
    const { erro } = await (await acompanhar(json("http://x/api/prazos/monitoramentos", {}))).json();
    expect(erro).toContain("HTTP 422");
    expect(erro).toContain("Field required");
  });

  it("erro no padrão { erro } passa como está", async () => {
    backend.mockResolvedValueOnce(Response.json({ erro: "MongoDB não configurado." }, { status: 503 }));
    expect(await (await obterPainel(new Request("http://x/api/prazos"))).json()).toEqual({
      erro: "MongoDB não configurado.",
    });
  });
});
