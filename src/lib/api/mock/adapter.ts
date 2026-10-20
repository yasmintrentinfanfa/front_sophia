/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend real não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 *
 * Reproduz a regra de isolamento do backend: cada caso pertence a um usuário e
 * toda operação só enxerga os casos do dono da sessão. Caso de outro usuário se
 * comporta exatamente como caso inexistente.
 */

import type { Assinatura, BandeiraCartao, Caso, SophiaApi, Usuario } from "@/lib/api/types";
import { pastaDoCaso } from "@/lib/casos/rotulo";

import { CASOS, OFERTA_ASSINATURA } from "./dados";

/** Latência simulada da rede; desligada nos testes para não deixá-los lentos. */
function esperar(ms: number) {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "caso";
}

/*
 * Contas, sessão e casos simulados no sessionStorage, para o fluxo sobreviver a um
 * recarregamento da página. Senha não é guardada nem conferida.
 */
const CHAVE_USUARIOS = "sophia-mock-usuarios";
const CHAVE_SESSAO = "sophia-mock-sessao";
const CHAVE_CASOS = "sophia-mock-casos";

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = sessionStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* private mode */
  }
}

function lerUsuarios(): Usuario[] {
  const lista = ler<Usuario[]>(CHAVE_USUARIOS, []);
  return Array.isArray(lista) ? lista : [];
}

function salvarUsuario(usuario: Usuario) {
  const outros = lerUsuarios().filter((item) => item.id !== usuario.id);
  gravar(CHAVE_USUARIOS, [...outros, usuario]);
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

/** Casos indexados pelo id do dono, como o filtro `{ user_id }` no MongoDB. */
type CasosPorUsuario = Record<string, Caso[]>;

/** Equivale ao 401 do backend: sem sessão, nenhuma operação de caso acontece. */
function donoDaSessao() {
  const usuario = usuarioDaSessao();
  if (!usuario) throw new Error("Sua sessão expirou. Entre novamente.");
  return usuario.id;
}

function casosDe(usuarioId: string): Caso[] {
  return ler<CasosPorUsuario>(CHAVE_CASOS, {})[usuarioId] ?? [];
}

function salvarCasosDe(usuarioId: string, lista: Caso[]) {
  gravar(CHAVE_CASOS, { ...ler<CasosPorUsuario>(CHAVE_CASOS, {}), [usuarioId]: lista });
}

/** Equivale ao `find_one({ _id, user_id })`: caso alheio e caso inexistente dão o mesmo erro. */
function casoDoDono(usuarioId: string, id: string) {
  const caso = casosDe(usuarioId).find((item) => item.id === id);
  if (!caso) throw new Error("Caso não encontrado.");
  return caso;
}

export const mockApi: SophiaApi = {
  async listarCasos() {
    await esperar(220);
    const dono = donoDaSessao();
    return structuredClone(casosDe(dono).map((caso) => ({ ...caso, pasta: pastaDoCaso(caso) })));
  },

  async criarCaso(dados) {
    await esperar(180);
    const dono = donoDaSessao();
    const criado: Caso = {
      id: `${slug(dados.titulo)}-${Date.now().toString(36)}`,
      titulo: dados.titulo.trim(),
      cliente: dados.cliente.trim(),
      area: dados.area?.trim() || undefined,
      status: "gravacao_pendente",
      pasta: "ativo",
      atualizadoEm: new Date().toISOString(),
    };
    salvarCasosDe(dono, [criado, ...casosDe(dono)]);
    return structuredClone(criado);
  },

  async moverCaso(id, pasta) {
    await esperar(120);
    const dono = donoDaSessao();
    const atualizado = { ...casoDoDono(dono, id), pasta, atualizadoEm: new Date().toISOString() };
    salvarCasosDe(dono, casosDe(dono).map((caso) => (caso.id === id ? atualizado : caso)));
    return structuredClone(atualizado);
  },

  async excluirCaso(id) {
    await esperar(120);
    const dono = donoDaSessao();
    casoDoDono(dono, id);
    salvarCasosDe(dono, casosDe(dono).filter((caso) => caso.id !== id));
  },

  async criarConta(dados) {
    await esperar(400);
    const email = dados.email.trim().toLowerCase();
    if (lerUsuarios().some((usuario) => usuario.email === email)) {
      throw new Error("Já existe uma conta com este e-mail.");
    }
    const usuario: Usuario = {
      id: `usuario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
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
    const existente = lerUsuarios().find((item) => item.email === email);
    if (existente) {
      abrirSessao(existente);
      return structuredClone(existente);
    }

    // E-mail desconhecido entra como conta ativa de demonstração, já com os casos do protótipo.
    const demo: Usuario = {
      id: `usuario-demo-${slug(email)}`,
      nome: "Advogado(a) de demonstração",
      email,
      statusConta: "ativa",
      criadoEm: new Date().toISOString(),
    };
    salvarUsuario(demo);
    salvarCasosDe(demo.id, structuredClone(CASOS));
    abrirSessao(demo);
    return structuredClone(demo);
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
