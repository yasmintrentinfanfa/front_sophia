/**
 * Rotas do Next que dependem da sessão, com `next/headers` e o backend simulados:
 * cookie forjado não chega ao backend, e o `user_id` enviado ao backend é sempre o
 * do cookie — nunca um que venha no corpo da requisição.
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

const { GET: obterEu } = await import("@/app/api/auth/eu/route");
const { POST: assinar } = await import("@/app/api/assinatura/route");
const { GET: obterCaso } = await import("@/app/api/transcricao/caso/route");
const { POST: trocarPlano } = await import("@/app/api/assinatura/plano/route");
const { POST: cancelarConta } = await import("@/app/api/conta/cancelar/route");
const { POST: aceitarTermos } = await import("@/app/api/conta/termos/route");
const { POST: transcrever } = await import("@/app/api/transcricao/transcrever/route");
const { POST: revisar } = await import("@/app/api/transcricao/revisar/route");
const { GET: listarCasos, POST: criarCaso } = await import("@/app/api/casos/route");
const { PATCH: atualizarCaso, DELETE: excluirCaso } = await import("@/app/api/casos/[casoId]/route");
const rotaAnalise = await import("@/app/api/analise/route");
const rotaChat = await import("@/app/api/chat/route");
const rotaPecas = await import("@/app/api/pecas/route");
const { GET: obterPeca } = await import("@/app/api/pecas/[pecaId]/route");
const { GET: baixarPeca } = await import("@/app/api/pecas/[pecaId]/docx/route");

let backend: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  backend = vi.fn<typeof fetch>(async () => Response.json({ usuario: { _id: ANA }, assinatura: {} }));
  vi.stubGlobal("fetch", backend);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cookieAtual.valor = undefined;
});

const urlChamada = () => String(backend.mock.calls[0][0]);
const corpoChamado = () => JSON.parse(String(backend.mock.calls[0][1]?.body));

describe("cookie forjado não acessa a conta de ninguém", () => {
  it("UUID puro de outro usuário no cookie → 401, sem chamar o backend", async () => {
    cookieAtual.valor = BRUNO;

    expect((await obterEu()).status).toBe(401);
    expect((await obterCaso(new Request("http://x/api/transcricao/caso?casoId=rescisao-silva"))).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cookie com assinatura adulterada → 401", async () => {
    cookieAtual.valor = `${BRUNO}.${assinarSessao(ANA).split(".").pop()}`;
    expect((await obterEu()).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cookie legítimo consulta o backend com o id do próprio usuário", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    expect((await obterEu()).status).toBe(200);
    expect(urlChamada()).toMatch(new RegExp(`/usuario/${ANA}$`));
  });
});

describe("transcrição só para quem está logado", () => {
  it("sem sessão, transcrever e revisar → 401 sem chamar o backend", async () => {
    const form = new FormData();
    form.append("audio", new Blob(["x"]), "a.mp3");
    expect((await transcrever(new Request("http://x", { method: "POST", body: form }))).status).toBe(401);
    expect(
      (await revisar(new Request("http://x", { method: "POST", body: JSON.stringify({ texto: "oi" }) }))).status,
    ).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("com sessão, o áudio segue para o backend", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const form = new FormData();
    form.append("audio", new Blob(["x"]), "a.mp3");
    await transcrever(new Request("http://x", { method: "POST", body: form }));
    expect(urlChamada()).toMatch(/\/transcribe$/);
  });
});

describe("troca de plano", () => {
  it("troca o plano do usuário da sessão, ignorando user_id no corpo", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura/plano", {
      method: "POST",
      body: JSON.stringify({ user_id: BRUNO, plan_id: "basico" }),
    });

    expect((await trocarPlano(pedido)).status).toBe(200);
    expect(urlChamada()).toMatch(/\/assinatura\/plano$/);
    expect(corpoChamado()).toEqual({ user_id: ANA, plan_id: "basico" });
  });

  it("sem sessão (ou com cookie forjado) → 401, sem chamar o backend", async () => {
    const pedido = () =>
      new Request("http://x/api/assinatura/plano", { method: "POST", body: JSON.stringify({ plan_id: "pro" }) });

    expect((await trocarPlano(pedido())).status).toBe(401);
    cookieAtual.valor = ANA;
    expect((await trocarPlano(pedido())).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("cancelamento da conta", () => {
  it("marca o cancelamento do usuário da sessão, ignorando user_id no corpo", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/conta/cancelar", {
      method: "POST",
      body: JSON.stringify({ user_id: BRUNO }),
    });

    expect((await cancelarConta(pedido)).status).toBe(200);
    expect(urlChamada()).toMatch(/\/conta\/cancelar$/);
    expect(corpoChamado()).toEqual({ user_id: ANA });
  });

  it("sem sessão → 401, sem chamar o backend", async () => {
    const pedido = new Request("http://x/api/conta/cancelar", { method: "POST" });
    expect((await cancelarConta(pedido)).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("dono vem sempre do cookie", () => {
  it("a transcrição do caso é buscada com o user_id da sessão", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    await obterCaso(new Request(`http://x/api/transcricao/caso?casoId=rescisao-silva&user_id=${BRUNO}`));

    const url = new URL(urlChamada());
    expect(url.searchParams.get("user_id")).toBe(ANA);
  });

  it("assinatura ignora user_id no corpo e usa o da sessão", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({
        user_id: BRUNO,
        plan_id: "pro",
        card_token: "tok_mock_visa_4242_1",
        card_expiry: "08/31",
        holder: { name: "Ana Silva", cpf: "52998224725" },
      }),
    });

    expect((await assinar(pedido)).status).toBe(200);
    expect(corpoChamado()).toEqual({
      user_id: ANA,
      plan_id: "pro",
      card: { brand: "visa", last4: "4242", expiry: "08/31", holder_name: "Ana Silva" },
    });
  });

  it("assinatura sem sessão → 401", async () => {
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({ plan_id: "pro", card_token: "tok_mock_visa_4242_1" }),
    });
    expect((await assinar(pedido)).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("lista e cria casos com o usuário da sessão, ignorando user_id no pedido", async () => {
    cookieAtual.valor = assinarSessao(ANA);

    await listarCasos(new Request(`http://x/api/casos?user_id=${BRUNO}`));
    expect(new URL(urlChamada()).searchParams.get("user_id")).toBe(ANA);

    backend.mockClear();
    await criarCaso(
      new Request("http://x/api/casos", {
        method: "POST",
        body: JSON.stringify({
          user_id: BRUNO,
          caso_id: "divorcio-abc",
          title: "Divórcio",
          client_name: "Paula",
          legal_area: "familia",
        }),
      }),
    );
    expect(corpoChamado()).toEqual({
      user_id: ANA,
      caso_id: "divorcio-abc",
      title: "Divórcio",
      client_name: "Paula",
      legal_area: "familia",
    });
  });

  it("arquivar e excluir usam o dono da sessão", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const contexto = { params: Promise.resolve({ casoId: "divorcio-abc" }) };

    await atualizarCaso(
      new Request("http://x/api/casos/divorcio-abc", {
        method: "PATCH",
        body: JSON.stringify({ user_id: BRUNO, folder: "arquivo" }),
      }),
      contexto,
    );
    expect(urlChamada()).toMatch(/\/casos\/divorcio-abc$/);
    expect(corpoChamado()).toEqual({ user_id: ANA, folder: "arquivo" });

    backend.mockClear();
    await excluirCaso(new Request(`http://x/api/casos/divorcio-abc?user_id=${BRUNO}`, { method: "DELETE" }), contexto);
    expect(new URL(urlChamada()).searchParams.get("user_id")).toBe(ANA);
  });

  it("sem sessão, a lista de casos não chama o backend", async () => {
    expect((await listarCasos(new Request("http://x/api/casos"))).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cartão de teste 0002 é recusado (402) sem registrar assinatura", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({ plan_id: "pro", card_token: "tok_mock_visa_0002_1" }),
    });
    expect((await assinar(pedido)).status).toBe(402);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("análise, chat e minutas com IA", () => {
  it("o dono vem do cookie, nunca do corpo, e o front só manda o que é novo", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    await rotaAnalise.POST(
      new Request("http://x/api/analise", { method: "POST", body: JSON.stringify({ casoId: "caso-1", user_id: BRUNO }) }),
    );
    expect(urlChamada()).toMatch(/\/analise\/caso-1$/);
    expect(corpoChamado()).toEqual({ user_id: ANA });

    backend.mockClear();
    await rotaChat.POST(
      new Request("http://x/api/chat", {
        method: "POST",
        body: JSON.stringify({ casoId: "caso-1", mensagem: " Quais riscos? ", user_id: BRUNO, historico: ["x"] }),
      }),
    );
    expect(urlChamada()).toMatch(/\/chat\/caso-1$/);
    expect(corpoChamado()).toEqual({ user_id: ANA, mensagem: "Quais riscos?" });

    backend.mockClear();
    await rotaPecas.POST(
      new Request("http://x/api/pecas", {
        method: "POST",
        body: JSON.stringify({ casoId: "caso-1", modeloId: "contestacao", user_id: BRUNO }),
      }),
    );
    expect(corpoChamado()).toEqual({ user_id: ANA, modelo_id: "contestacao" });
  });

  it("atualizar a análise com o chat só liga incluir_chat quando pedido explicitamente", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedir = (corpo: unknown) =>
      rotaAnalise.POST(new Request("http://x/api/analise", { method: "POST", body: JSON.stringify(corpo) }));

    await pedir({ casoId: "caso-1", incluirChat: true });
    expect(corpoChamado()).toEqual({ user_id: ANA, incluir_chat: true });

    backend.mockClear();
    await pedir({ casoId: "caso-1", incluirChat: "sim" });
    expect(corpoChamado()).toEqual({ user_id: ANA });
  });

  it("leituras passam o user_id da sessão e protegem os ids na URL", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    await rotaChat.GET(new Request(`http://x/api/chat?casoId=../x&user_id=${BRUNO}`));
    expect(urlChamada()).toMatch(/\/chat\/\.\.%2Fx\?user_id=/);
    expect(new URL(urlChamada()).searchParams.get("user_id")).toBe(ANA);

    backend.mockClear();
    await obterPeca(new Request("http://x?casoId=caso-1"), { params: Promise.resolve({ pecaId: "p/1" }) });
    expect(urlChamada()).toMatch(/\/pecas\/caso-1\/p%2F1\?user_id=/);

    backend.mockClear();
    backend.mockResolvedValueOnce(
      new Response("PK", { headers: { "content-type": "application/vnd.openxmlformats", "content-disposition": "attachment" } }),
    );
    const download = await baixarPeca(new Request("http://x?casoId=caso-1"), { params: Promise.resolve({ pecaId: "p1" }) });
    expect(download.status).toBe(200);
    expect(download.headers.get("content-disposition")).toBe("attachment");
  });

  it("sem sessão → 401, sem chamar o backend", async () => {
    const post = (corpo: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(corpo) });
    expect((await rotaAnalise.POST(post({ casoId: "c" }))).status).toBe(401);
    expect((await rotaChat.POST(post({ casoId: "c", mensagem: "oi" }))).status).toBe(401);
    expect((await rotaPecas.POST(post({ casoId: "c", modeloId: "contestacao" }))).status).toBe(401);
    expect((await rotaPecas.GET(new Request("http://x?casoId=c"))).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("aceite dos termos de uso", () => {
  it("grava o aceite na conta da sessão, nunca na de outro usuário", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    expect((await aceitarTermos()).status).toBe(200);
    expect(urlChamada()).toMatch(/\/conta\/aceitar-termos$/);
    expect(corpoChamado()).toEqual({ user_id: ANA });
  });

  it("sem sessão (ou com cookie forjado) → 401, sem chamar o backend", async () => {
    expect((await aceitarTermos()).status).toBe(401);
    cookieAtual.valor = BRUNO;
    expect((await aceitarTermos()).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});
