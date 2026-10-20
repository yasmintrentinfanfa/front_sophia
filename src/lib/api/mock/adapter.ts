/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend real não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 */

import type { Assinatura, BandeiraCartao, Caso, SophiaApi, Usuario } from "@/lib/api/types";
import { pastaDoCaso } from "@/lib/casos/rotulo";

import { CASOS, OFERTA_ASSINATURA } from "./dados";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `caso-${Date.now()}`;
}

/*
 * Contas e sessão simuladas no sessionStorage, para o fluxo cadastro → assinatura
 * sobreviver a um recarregamento da página. Senha não é guardada nem conferida.
 */
const CHAVE_USUARIOS = "sophia-mock-usuarios";
const CHAVE_SESSAO = "sophia-mock-sessao";

function lerUsuarios(): Usuario[] {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CHAVE_USUARIOS) ?? "[]") as Usuario[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarUsuario(usuario: Usuario) {
  try {
    const outros = lerUsuarios().filter((item) => item.id !== usuario.id);
    sessionStorage.setItem(CHAVE_USUARIOS, JSON.stringify([...outros, usuario]));
  } catch {
    /* private mode */
  }
}

function abrirSessao(usuario: Usuario | null) {
  try {
    if (usuario) sessionStorage.setItem(CHAVE_SESSAO, usuario.id);
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    /* private mode */
  }
}

function usuarioDaSessao() {
  try {
    const id = sessionStorage.getItem(CHAVE_SESSAO);
    return lerUsuarios().find((usuario) => usuario.id === id) ?? null;
  } catch {
    return null;
  }
}

let casos = structuredClone(CASOS).map((caso) => ({
  ...caso,
  pasta: pastaDoCaso(caso),
}));

export const mockApi: SophiaApi = {
  async listarCasos() {
    await esperar(220);
    casos = casos.map((caso) => ({ ...caso, pasta: pastaDoCaso(caso) }));
    return structuredClone(casos);
  },

  async criarCaso(dados) {
    await esperar(180);
    let id = slug(dados.titulo);
    if (casos.some((caso) => caso.id === id)) {
      id = `${id}-${Date.now()}`;
    }
    const criado: Caso = {
      id,
      titulo: dados.titulo.trim(),
      cliente: dados.cliente.trim(),
      area: dados.area?.trim() || undefined,
      status: "gravacao_pendente",
      pasta: "ativo",
      atualizadoEm: new Date().toISOString(),
    };
    casos = [criado, ...casos];
    return structuredClone(criado);
  },

  async moverCaso(id, pasta) {
    await esperar(120);
    const atual = casos.find((caso) => caso.id === id);
    if (!atual) throw new Error("Caso não encontrado");
    const atualizado = { ...atual, pasta, atualizadoEm: new Date().toISOString() };
    casos = casos.map((caso) => (caso.id === id ? atualizado : caso));
    return structuredClone(atualizado);
  },

  async excluirCaso(id) {
    await esperar(120);
    casos = casos.filter((caso) => caso.id !== id);
  },

  async criarConta(dados) {
    await esperar(400);
    const email = dados.email.trim().toLowerCase();
    if (lerUsuarios().some((usuario) => usuario.email === email)) {
      throw new Error("Já existe uma conta com este e-mail.");
    }
    const usuario: Usuario = {
      id: `usuario-${Date.now()}`,
      nome: dados.nome.trim(),
      email,
      statusConta: "pagamento_pendente",
      criadoEm: new Date().toISOString(),
    };
    salvarUsuario(usuario);
    abrirSessao(usuario);
    return structuredClone(usuario);
  },

  async entrar(dados) {
    await esperar(300);
    const email = dados.email.trim().toLowerCase();
    // E-mail desconhecido entra como conta ativa de demonstração, como o login fazia antes.
    const usuario: Usuario = lerUsuarios().find((item) => item.email === email) ?? {
      id: `usuario-demo-${email || "anonimo"}`,
      nome: "Advogado(a) de demonstração",
      email,
      statusConta: "ativa",
      criadoEm: new Date().toISOString(),
    };
    salvarUsuario(usuario);
    abrirSessao(usuario);
    return structuredClone(usuario);
  },

  async sair() {
    await esperar(100);
    abrirSessao(null);
  },

  async obterUsuarioAtual() {
    await esperar(150);
    return structuredClone(usuarioDaSessao());
  },

  async obterOfertaAssinatura() {
    await esperar(200);
    return structuredClone(OFERTA_ASSINATURA);
  },

  async assinar(dados) {
    await esperar(700);
    const usuario = usuarioDaSessao();
    if (!usuario) throw new Error("Sua sessão expirou. Entre novamente para assinar.");
    const plano = OFERTA_ASSINATURA.planos.find((item) => item.id === dados.planoId);
    if (!plano) throw new Error("Plano não encontrado.");

    // O backend real consulta o cartão no gateway pelo token; o mock o lê do próprio token.
    const [, , bandeira, final] = dados.tokenCartao.split("_");
    if (final === "0002") {
      throw new Error("Pagamento recusado pelo emissor do cartão. Tente outro cartão.");
    }

    const assinatura: Assinatura = {
      id: `assinatura-${Date.now()}`,
      usuarioId: usuario.id,
      planoId: plano.id,
      status: "ativa",
      valorMensal: OFERTA_ASSINATURA.plataforma.precoMensal + plano.precoMensal,
      cartao: { bandeira: bandeira as BandeiraCartao, final, validade: "" },
      criadaEm: new Date().toISOString(),
    };
    salvarUsuario({ ...usuario, statusConta: "ativa" });
    return structuredClone(assinatura);
  },
};
