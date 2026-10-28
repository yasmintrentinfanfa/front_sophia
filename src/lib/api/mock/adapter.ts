/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend de casos não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 *
 * Conta, assinatura e a lista de casos já são reais (`contaApi` e `/api/casos`).
 * Análise e chat seguem simulados. Cada caso pertence a um usuário: operação
 * sobre caso alheio se comporta como caso inexistente.
 */

import { contaApi, requisitarJson } from "@/lib/api/conta";
import { casoDaApi, novoCasoParaApi, type CasoApi } from "@/lib/api/http/mapeadores";
import type { Caso, PastaCaso, SophiaApi } from "@/lib/api/types";

import { criarMockFluxo } from "./fluxo";

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
 * Espelho local da lista, para a análise e o chat (ainda simulados) acharem o caso
 * nesta aba. Fora dos testes a lista de verdade está no Mongo: este espelho é
 * reescrito toda vez que o usuário entra.
 *
 * Nos testes (`NODE_ENV=test`) o sessionStorage continua sendo a fonte, para
 * cobrir o isolamento entre usuários sem subir a API.
 */
function casosNoBanco() {
  return process.env.NODE_ENV !== "test";
}
const CHAVE_CASOS = "sophia-mock-casos";

type CasosPorUsuario = Record<string, Caso[]>;

function lerTodos(): CasosPorUsuario {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_CASOS) ?? "{}") as CasosPorUsuario;
  } catch {
    return {};
  }
}

function salvarCasosDe(usuarioId: string, lista: Caso[]) {
  try {
    sessionStorage.setItem(CHAVE_CASOS, JSON.stringify({ ...lerTodos(), [usuarioId]: lista }));
  } catch {
    /* private mode */
  }
}

/** Casos de exemplo do protótipo. Quem já os tinha na sessão deixa de vê-los. */
const IDS_DEMONSTRACAO = new Set(["rescisao-silva", "cobranca-xyz", "locacao-santos"]);

/** Cada usuário começa sem casos e só vê os que ele mesmo criou. */
function casosDe(usuarioId: string): Caso[] {
  const todos = lerTodos();
  const salvos = todos[usuarioId] ?? [];
  const proprios = salvos.filter((caso) => !IDS_DEMONSTRACAO.has(caso.id));
  if (!todos[usuarioId] || proprios.length !== salvos.length) {
    salvarCasosDe(usuarioId, proprios);
  }
  return proprios;
}

/** Dono da sessão, conhecido depois de `obterUsuarioAtual` (o layout de /casos chama antes de tudo). */
let dono: string | null = null;

/** Equivale ao 401 do backend: sem sessão, nenhuma operação de caso acontece. */
function donoDaSessao() {
  if (!dono) throw new Error("Sua sessão expirou. Entre novamente.");
  return dono;
}

/**
 * O id fica em memória depois do layout. Se o módulo recarrega no meio da
 * gravação, a finalização não acha o caso e a análise não abre. Relê a sessão.
 */
async function garantirDono() {
  if (!dono) {
    const usuario = await contaApi.obterUsuarioAtual();
    dono = usuario?.id ?? null;
  }
  return donoDaSessao();
}

/** Equivale ao `find_one({ _id, user_id })`: caso alheio e caso inexistente dão o mesmo erro. */
function casoDoDono(usuarioId: string, id: string) {
  const caso = casosDe(usuarioId).find((item) => item.id === id);
  if (!caso) throw new Error("Caso não encontrado.");
  return caso;
}

const fluxo = criarMockFluxo({
  encontrarCaso: (id) => (dono ? casosDe(dono).find((caso) => caso.id === id) : undefined),
  salvarCaso: (caso) => {
    const usuarioId = donoDaSessao();
    salvarCasosDe(usuarioId, casosDe(usuarioId).map((item) => (item.id === caso.id ? caso : item)));
  },
  escopo: donoDaSessao,
});

export const mockApi: SophiaApi = {
  ...contaApi,
  ...fluxo,

  async obterUsuarioAtual() {
    const usuario = await contaApi.obterUsuarioAtual();
    dono = usuario?.id ?? null;
    return usuario;
  },

  async finalizarSessao(casoId, transcricao, analisar = true) {
    await garantirDono();
    const caso = await fluxo.finalizarSessao(casoId, transcricao, analisar);
    if (casosNoBanco()) await atualizarCasoNoBanco(casoId, { status: "em_analise" });
    return caso;
  },

  async obterCaso(casoId) {
    await garantirDono();
    return fluxo.obterCaso(casoId);
  },

  async solicitarAnalise(casoId, opcoes) {
    await garantirDono();
    return fluxo.solicitarAnalise(casoId, opcoes);
  },

  async listarMensagens(casoId) {
    await garantirDono();
    return fluxo.listarMensagens(casoId);
  },

  async enviarMensagem(casoId, conteudo) {
    await garantirDono();
    return fluxo.enviarMensagem(casoId, conteudo);
  },

  async listarCasos() {
    const usuarioId = await garantirDono();
    if (!casosNoBanco()) {
      await esperar(220);
      return structuredClone(casosDe(usuarioId));
    }
    const lista = (await requisitarJson<CasoApi[]>("/api/casos")).map(casoDaApi);
    salvarCasosDe(usuarioId, lista);
    return lista;
  },

  async criarCaso(dados) {
    const usuarioId = await garantirDono();
    if (!casosNoBanco()) {
      await esperar(180);
      const criado: Caso = {
        id: `${slug(dados.titulo)}-${Date.now().toString(36)}`,
        titulo: dados.titulo.trim(),
        cliente: dados.cliente.trim(),
        area: dados.area?.trim() || undefined,
        status: "gravacao_pendente",
        pasta: "ativo",
        atualizadoEm: new Date().toISOString(),
      };
      salvarCasosDe(usuarioId, [criado, ...casosDe(usuarioId)]);
      return structuredClone(criado);
    }
    const criado = casoDaApi(
      await requisitarJson<CasoApi>("/api/casos", {
        method: "POST",
        body: JSON.stringify({
          ...novoCasoParaApi(dados),
          caso_id: `${slug(dados.titulo)}-${Date.now().toString(36)}`,
        }),
      }),
    );
    salvarCasosDe(usuarioId, [criado, ...casosDe(usuarioId).filter((caso) => caso.id !== criado.id)]);
    return criado;
  },

  async moverCaso(id, pasta) {
    const usuarioId = await garantirDono();
    if (!casosNoBanco()) {
      await esperar(120);
      const atualizado = { ...casoDoDono(usuarioId, id), pasta, atualizadoEm: new Date().toISOString() };
      salvarCasosDe(usuarioId, casosDe(usuarioId).map((caso) => (caso.id === id ? atualizado : caso)));
      return structuredClone(atualizado);
    }
    const atualizado = await atualizarCasoNoBanco(id, { folder: pasta });
    guardarCasoLocal(usuarioId, atualizado);
    return atualizado;
  },

  async excluirCaso(id) {
    const usuarioId = await garantirDono();
    if (!casosNoBanco()) {
      await esperar(120);
      casoDoDono(usuarioId, id);
      salvarCasosDe(usuarioId, casosDe(usuarioId).filter((caso) => caso.id !== id));
      return;
    }
    await requisitarJson<void>(`/api/casos/${encodeURIComponent(id)}`, { method: "DELETE" });
    salvarCasosDe(usuarioId, casosDe(usuarioId).filter((caso) => caso.id !== id));
  },
};

function guardarCasoLocal(usuarioId: string, caso: Caso) {
  const lista = casosDe(usuarioId);
  const existe = lista.some((item) => item.id === caso.id);
  salvarCasosDe(
    usuarioId,
    existe ? lista.map((item) => (item.id === caso.id ? caso : item)) : [caso, ...lista],
  );
}

async function atualizarCasoNoBanco(id: string, campos: { folder?: PastaCaso; status?: Caso["status"] }) {
  return casoDaApi(
    await requisitarJson<CasoApi>(`/api/casos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(campos),
    }),
  );
}
