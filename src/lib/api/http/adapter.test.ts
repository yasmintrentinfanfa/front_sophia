/**
 * Adapter HTTP com `fetch` simulado: garante que o front nunca diz ao backend de
 * quem é o caso (o dono vem da sessão) e que respostas de acesso negado viram
 * mensagens que não revelam se o caso existe.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { criarHttpApi, ErroApi } from "@/lib/api/http/adapter";
import { redirecionamentoDosCasos } from "@/lib/conta";

const BASE = "https://api.sophia.test/api";

function responder(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function simularFetch(...respostas: Response[]) {
  const fetchFalso = vi.fn<typeof fetch>();
  for (const resposta of respostas) fetchFalso.mockResolvedValueOnce(resposta);
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

/** Tudo o que saiu do front numa chamada: URL e corpo. */
function enviado(fetchFalso: ReturnType<typeof simularFetch>, chamada = 0) {
  const [url, init] = fetchFalso.mock.calls[chamada];
  return { url: String(url), init: init ?? {}, corpo: init?.body ? JSON.parse(String(init.body)) : undefined };
}

const CASO_NO_BANCO = {
  _id: { $oid: "6abd98668c404093b1cd875c" },
  user_id: "a3f1c2e4-4b8a-4b6a-9b1a-000000000001",
  title: "Rescisão contratual",
  client_name: "João Silva",
  legal_area: null,
  status: "em_analise",
  folder: "ativo",
  updated_at: "2026-09-30T20:16:54",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("casos pelo adapter HTTP", () => {
  const api = criarHttpApi(BASE);

  it("lista casos pela sessão (cookie), sem mandar id de usuário", async () => {
    const fetchFalso = simularFetch(responder(200, [CASO_NO_BANCO]));
    await api.listarCasos();

    const { url, init } = enviado(fetchFalso);
    expect(url).toBe(`${BASE}/casos`);
    expect(init.credentials).toBe("include");
    expect(url).not.toMatch(/user/i);
  });

  it("converte o documento do Mongo e não expõe o user_id ao resto do front", async () => {
    simularFetch(responder(200, [CASO_NO_BANCO]));
    const [caso] = await api.listarCasos();

    expect(caso).toEqual({
      id: "6abd98668c404093b1cd875c",
      titulo: "Rescisão contratual",
      cliente: "João Silva",
      area: undefined,
      status: "em_analise",
      pasta: "ativo",
      atualizadoEm: "2026-09-30T20:16:54",
    });
    expect(JSON.stringify(caso)).not.toContain(CASO_NO_BANCO.user_id);
  });

  it("nenhuma operação de caso envia user_id, nem na URL nem no corpo", async () => {
    const fetchFalso = simularFetch(
      responder(201, CASO_NO_BANCO),
      responder(200, { ...CASO_NO_BANCO, folder: "arquivo" }),
      responder(204),
    );
    await api.criarCaso({ titulo: "Rescisão contratual", cliente: "João Silva" });
    await api.moverCaso("6abd98668c404093b1cd875c", "arquivo");
    await api.excluirCaso("6abd98668c404093b1cd875c");

    for (let chamada = 0; chamada < 3; chamada++) {
      const { url, corpo } = enviado(fetchFalso, chamada);
      expect(url).not.toMatch(/user/i);
      expect(JSON.stringify(corpo ?? {})).not.toMatch(/user/i);
    }
    expect(enviado(fetchFalso, 0).corpo).toEqual({
      title: "Rescisão contratual",
      client_name: "João Silva",
      legal_area: null,
    });
    expect(enviado(fetchFalso, 1).init.method).toBe("PATCH");
    expect(enviado(fetchFalso, 2).init.method).toBe("DELETE");
  });

  it("caso de outro usuário (404) vira 'Caso não encontrado'", async () => {
    simularFetch(responder(404));
    const erro = await api.moverCaso("caso-de-outro-usuario", "arquivo").catch((falha: unknown) => falha);

    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 404, message: "Caso não encontrado." });
  });

  it("protege o id do caso na URL", async () => {
    const fetchFalso = simularFetch(responder(204));
    await api.excluirCaso("../users");
    expect(enviado(fetchFalso).url).toBe(`${BASE}/casos/..%2Fusers`);
  });

  it("sem sessão (401) a lista falha em vez de mostrar dados", async () => {
    simularFetch(responder(401));
    await expect(api.listarCasos()).rejects.toMatchObject({ status: 401 });
  });
});

describe("conta pelo adapter HTTP", () => {
  const api = criarHttpApi(`${BASE}/`);

  it("sem sessão, obterUsuarioAtual devolve null e /casos manda para o login", async () => {
    simularFetch(responder(401));
    const usuario = await api.obterUsuarioAtual();
    expect(usuario).toBeNull();
    expect(redirecionamentoDosCasos(usuario)).toBe("/login");
  });

  it("usuário do Mongo sem account_status é tratado como pagamento pendente", async () => {
    simularFetch(
      responder(200, {
        _id: "98ff6434-655e-486f-b255-1bd89542ea7f",
        name: "Ana Silva",
        email: "ana.nome@sophia.app",
        created_at: "2026-09-30T21:28:29",
      }),
    );
    const usuario = await api.obterUsuarioAtual();
    expect(usuario).toMatchObject({ id: "98ff6434-655e-486f-b255-1bd89542ea7f", nome: "Ana Silva" });
    expect(redirecionamentoDosCasos(usuario)).toBe("/assinatura");
  });

  it("login com credenciais erradas mostra mensagem própria", async () => {
    simularFetch(responder(401));
    await expect(api.entrar({ email: "a@b.com", senha: "x" })).rejects.toThrow("E-mail ou senha incorretos.");
  });

  it("usa a mensagem do backend quando ela vem no corpo", async () => {
    simularFetch(responder(409, { mensagem: "E-mail já usado em outra conta." }));
    await expect(
      api.criarConta({
        nome: "Ana",
        email: "ana@teste.com",
        senha: "senha1234",
        aceiteTermos: { versao: "2026-10", aceitoEm: "2026-10-01T00:00:00.000Z" },
      }),
    ).rejects.toThrow("E-mail já usado em outra conta.");
  });

  it("assinatura não envia user_id: o dono vem da sessão", async () => {
    const fetchFalso = simularFetch(
      responder(201, {
        _id: { $oid: "6abd98668c404093b1cd0001" },
        user_id: "98ff6434-655e-486f-b255-1bd89542ea7f",
        plan_id: "basico",
        status: "ativa",
        monthly_amount: 25_000,
        card: { brand: "visa", last4: "4242", expiry: "12/30" },
        created_at: "2026-10-01T00:00:00",
      }),
    );
    const assinatura = await api.assinar({
      planoId: "basico",
      tokenCartao: "tok_123",
      titular: { nome: "Ana", cpf: "52998224725" },
    });

    expect(enviado(fetchFalso).corpo).toEqual({
      plan_id: "basico",
      card_token: "tok_123",
      holder: { name: "Ana", cpf: "52998224725" },
    });
    expect(assinatura.usuarioId).toBe("98ff6434-655e-486f-b255-1bd89542ea7f");
  });
});
