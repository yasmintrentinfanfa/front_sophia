/**
 * Isolamento de casos entre usuários no mock. São as mesmas regras que o backend
 * precisa cumprir (ver "Isolamento por usuário" em docs/contrato-api.md).
 */

import { describe, expect, it } from "vitest";

import { mockApi as api } from "@/lib/api/mock/adapter";

const CARTAO = "tok_mock_visa_4242_1";

/** Cria a conta, paga a assinatura e deixa a sessão aberta nela. */
async function contaAtiva(nome: string, email: string) {
  const usuario = await api.criarConta({
    nome,
    email,
    senha: "senha1234",
    aceiteTermos: { versao: "teste", aceitoEm: "2026-10-01T00:00:00.000Z" },
  });
  await api.assinar({ planoId: "basico", tokenCartao: CARTAO, titular: { nome, cpf: "52998224725" } });
  return usuario;
}

/** Troca a sessão para outro usuário já cadastrado. */
const entrarComo = (email: string) => api.entrar({ email, senha: "senha1234" });

async function cenarioComDoisUsuarios() {
  await contaAtiva("Ana", "ana@teste.com");
  const casoDaAna = await api.criarCaso({ titulo: "Rescisão contratual", cliente: "João Silva" });
  await contaAtiva("Bruno", "bruno@teste.com");
  const casoDoBruno = await api.criarCaso({ titulo: "Ação de cobrança", cliente: "Empresa XYZ" });
  return { casoDaAna, casoDoBruno };
}

describe("isolamento de casos por usuário", { timeout: 20_000 }, () => {
  it("cada usuário lista só os próprios casos", async () => {
    const { casoDaAna, casoDoBruno } = await cenarioComDoisUsuarios();

    const doBruno = await api.listarCasos();
    expect(doBruno.map((caso) => caso.id)).toEqual([casoDoBruno.id]);

    await entrarComo("ana@teste.com");
    const daAna = await api.listarCasos();
    expect(daAna.map((caso) => caso.id)).toEqual([casoDaAna.id]);
  });

  it("não deixa arquivar o caso de outro usuário", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    await expect(api.moverCaso(casoDaAna.id, "arquivo")).rejects.toThrow("Caso não encontrado.");

    await entrarComo("ana@teste.com");
    const [intacto] = await api.listarCasos();
    expect(intacto.pasta).toBe("ativo");
  });

  it("não deixa excluir o caso de outro usuário", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    await expect(api.excluirCaso(casoDaAna.id)).rejects.toThrow("Caso não encontrado.");

    await entrarComo("ana@teste.com");
    expect(await api.listarCasos()).toHaveLength(1);
  });

  it("caso alheio e caso inexistente dão o mesmo erro, sem revelar que o caso existe", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    const alheio = await api.moverCaso(casoDaAna.id, "arquivo").catch((erro: Error) => erro.message);
    const inexistente = await api.moverCaso("nao-existe", "arquivo").catch((erro: Error) => erro.message);
    expect(alheio).toBe(inexistente);
  });

  it("o dono continua com acesso total ao próprio caso", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();
    await entrarComo("ana@teste.com");

    const arquivado = await api.moverCaso(casoDaAna.id, "arquivo");
    expect(arquivado.pasta).toBe("arquivo");

    await api.excluirCaso(casoDaAna.id);
    expect(await api.listarCasos()).toEqual([]);
  });

  it("conta nova começa sem nenhum caso", async () => {
    await cenarioComDoisUsuarios();
    await contaAtiva("Carla", "carla@teste.com");
    expect(await api.listarCasos()).toEqual([]);
  });

  it("sem sessão nenhuma operação de caso funciona", async () => {
    const { casoDoBruno } = await cenarioComDoisUsuarios();
    await api.sair();

    await expect(api.listarCasos()).rejects.toThrow("Sua sessão expirou");
    await expect(api.criarCaso({ titulo: "X", cliente: "Y" })).rejects.toThrow("Sua sessão expirou");
    await expect(api.moverCaso(casoDoBruno.id, "arquivo")).rejects.toThrow("Sua sessão expirou");
    await expect(api.excluirCaso(casoDoBruno.id)).rejects.toThrow("Sua sessão expirou");
  });
});

describe("conta e assinatura", { timeout: 10_000 }, () => {
  it("conta nova começa com pagamento pendente e fica ativa depois de assinar", async () => {
    const usuario = await api.criarConta({
      nome: "Ana",
      email: "Ana@Teste.com",
      senha: "senha1234",
      aceiteTermos: { versao: "teste", aceitoEm: "2026-10-01T00:00:00.000Z" },
    });
    expect(usuario.statusConta).toBe("pagamento_pendente");
    expect(usuario.email).toBe("ana@teste.com");

    const assinatura = await api.assinar({
      planoId: "pro",
      tokenCartao: CARTAO,
      titular: { nome: "Ana", cpf: "52998224725" },
    });
    expect(assinatura.usuarioId).toBe(usuario.id);
    expect((await api.obterUsuarioAtual())?.statusConta).toBe("ativa");
  });

  it("recusa e-mail já cadastrado", async () => {
    await contaAtiva("Ana", "ana@teste.com");
    await expect(
      api.criarConta({
        nome: "Outra Ana",
        email: "ANA@teste.com",
        senha: "senha1234",
        aceiteTermos: { versao: "teste", aceitoEm: "2026-10-01T00:00:00.000Z" },
      }),
    ).rejects.toThrow("Já existe uma conta com este e-mail.");
  });
});
