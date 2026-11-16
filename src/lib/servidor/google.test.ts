/**
 * Rotas do login com Google com `next/headers` e o backend simulados: o nonce bruto só existe
 * no cookie httpOnly, o backend recebe o nonce do cookie (nunca um vindo do navegador) e a
 * sessão só é gravada quando o backend confirma a conta.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_USUARIO } from "@/lib/servidor/back";
import { lerSessaoAssinada } from "@/lib/servidor/cookie-assinado";
import { COOKIE_NONCE_GOOGLE, hashDoNonce } from "@/lib/servidor/google";

const ANA = "98ff6434-655e-486f-b255-1bd89542ea7f";

type Gravado = { valor: string; opcoes: Record<string, unknown> };
const jar = vi.hoisted(() => ({ cookies: new Map<string, Gravado>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nome: string) => {
      const c = jar.cookies.get(nome);
      return c && c.opcoes.maxAge !== 0 ? { value: c.valor } : undefined;
    },
    set: (nome: string, valor: string, opcoes: Record<string, unknown> = {}) => {
      jar.cookies.set(nome, { valor, opcoes });
    },
    delete: (nome: string) => jar.cookies.delete(nome),
  }),
}));

const { POST: iniciar } = await import("@/app/api/auth/google/inicio/route");
const { POST: entrar } = await import("@/app/api/auth/google/route");
const { POST: vincular } = await import("@/app/api/auth/google/vincular/route");

let backend: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  backend = vi.fn<typeof fetch>(async () => Response.json({ usuario: { _id: ANA } }));
  vi.stubGlobal("fetch", backend);
});

afterEach(() => {
  vi.unstubAllGlobals();
  jar.cookies.clear();
});

const pedido = (corpo: unknown) =>
  new Request("http://x/api/auth/google", { method: "POST", body: JSON.stringify(corpo) });
const corpoChamado = () => JSON.parse(String(backend.mock.calls[0][1]?.body));
const nonceDoCookie = () => jar.cookies.get(COOKIE_NONCE_GOOGLE)?.valor ?? "";

describe("nonce", () => {
  it("é o mesmo cálculo do backend (SHA-256 em base64url)", () => {
    expect(hashDoNonce("nonce-bruto-do-cookie")).toBe("NbKda_8wrsgmsXms8weJKEewnOkO-DwR7Dq45zElTKE");
  });

  it("valor bruto só no cookie httpOnly; a página recebe o hash", async () => {
    const { nonce } = (await (await iniciar()).json()) as { nonce: string };
    const cookie = jar.cookies.get(COOKIE_NONCE_GOOGLE);
    expect(cookie?.opcoes).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/api/auth/google" });
    expect(cookie?.valor).toHaveLength(43);
    expect(nonce).toBe(hashDoNonce(cookie!.valor));
    expect(nonce).not.toBe(cookie!.valor);
  });

  it("cada tentativa tem um nonce novo", async () => {
    await iniciar();
    const primeiro = nonceDoCookie();
    await iniciar();
    expect(nonceDoCookie()).not.toBe(primeiro);
  });
});

describe("entrar com Google", () => {
  it("sem o cookie do nonce (POST de outro site ou tentativa vencida) → 401 sem chamar o backend", async () => {
    const res = await entrar(pedido({ credencial: "token" }));
    expect(res.status).toBe(401);
    expect(((await res.json()) as { codigo: string }).codigo).toBe("nonce");
    expect(backend).not.toHaveBeenCalled();
  });

  it("sem credencial ou com credencial gigante → 400 sem chamar o backend", async () => {
    await iniciar();
    expect((await entrar(pedido({}))).status).toBe(400);
    expect((await entrar(pedido({ credencial: "a".repeat(5000) }))).status).toBe(400);
    expect((await entrar(new Request("http://x", { method: "POST", body: "{" }))).status).toBe(400);
    expect(backend).not.toHaveBeenCalled();
  });

  it("manda ao backend o nonce do cookie, ignora nonce e user_id vindos do navegador", async () => {
    await iniciar();
    const nonce = nonceDoCookie();
    await entrar(pedido({ credencial: "token-do-google", nonce: "forjado", user_id: "outra-pessoa" }));
    expect(String(backend.mock.calls[0][0])).toMatch(/\/entrar\/google$/);
    expect(corpoChamado()).toEqual({ credencial: "token-do-google", nonce });
  });

  it("conta confirmada → sessão assinada gravada e nonce apagado (vale uma vez)", async () => {
    await iniciar();
    const res = await entrar(pedido({ credencial: "token" }));
    expect(res.status).toBe(200);
    expect(lerSessaoAssinada(jar.cookies.get(COOKIE_USUARIO)?.valor)).toBe(ANA);
    expect(jar.cookies.get(COOKIE_NONCE_GOOGLE)?.opcoes).toMatchObject({ maxAge: 0, path: "/api/auth/google" });
  });

  it("token recusado pelo backend → repassa o erro e não grava sessão", async () => {
    backend.mockResolvedValueOnce(Response.json({ erro: "Não foi possível confirmar.", codigo: "token_invalido" }, { status: 401 }));
    await iniciar();
    const res = await entrar(pedido({ credencial: "token-falso" }));
    expect(res.status).toBe(401);
    expect(jar.cookies.has(COOKIE_USUARIO)).toBe(false);
  });

  it("email com conta de senha → 409 sem sessão, e o nonce fica para o vínculo", async () => {
    backend.mockResolvedValueOnce(
      Response.json({ codigo: "vincular_conta", email: "ana@gmail.com", erro: "..." }, { status: 409 }),
    );
    await iniciar();
    const nonce = nonceDoCookie();
    expect((await entrar(pedido({ credencial: "token" }))).status).toBe(409);
    expect(jar.cookies.has(COOKIE_USUARIO)).toBe(false);
    expect(nonceDoCookie()).toBe(nonce);
  });

  it("backend fora do ar → 503", async () => {
    backend.mockRejectedValueOnce(new TypeError("fetch failed"));
    await iniciar();
    expect((await entrar(pedido({ credencial: "token" }))).status).toBe(503);
  });
});

describe("ligar o Google à conta com senha", () => {
  it("repassa token, nonce do cookie e senha; com sucesso grava a sessão", async () => {
    await iniciar();
    const nonce = nonceDoCookie();
    const res = await vincular(pedido({ credencial: "token", senha: "senha-certa" }));
    expect(res.status).toBe(200);
    expect(String(backend.mock.calls[0][0])).toMatch(/\/entrar\/google\/vincular$/);
    expect(corpoChamado()).toEqual({ credencial: "token", nonce, senha: "senha-certa" });
    expect(lerSessaoAssinada(jar.cookies.get(COOKIE_USUARIO)?.valor)).toBe(ANA);
  });

  it("senha errada → 401 sem sessão", async () => {
    backend.mockResolvedValueOnce(Response.json({ erro: "Senha incorreta." }, { status: 401 }));
    await iniciar();
    expect((await vincular(pedido({ credencial: "token", senha: "errada" }))).status).toBe(401);
    expect(jar.cookies.has(COOKIE_USUARIO)).toBe(false);
  });
});
