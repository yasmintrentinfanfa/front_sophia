/**
 * Conta e assinatura pelas rotas do próprio Next (`src/app/api`), que falam com o
 * backend Python e cuidam do cookie de sessão assinado. Vale para o mock e para o
 * adapter HTTP: o login e a lista de casos já são reais.
 *
 * Nenhuma chamada envia id de usuário; a rota descobre quem é pelo cookie.
 */

import type { SophiaApi } from "@/lib/api/types";
import { OFERTA_ASSINATURA } from "@/lib/api/mock/dados";

import { assinaturaDaApi, assinaturaParaApi, usuarioDaApi, type AssinaturaApi, type UsuarioApi } from "./http/mapeadores";

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

/** Mensagens para quando a rota não manda `{ erro }` no corpo. */
const MENSAGEM_POR_STATUS: Record<number, string> = {
  401: "Sua sessão expirou. Entre novamente.",
  402: "Pagamento recusado pelo emissor do cartão. Tente outro cartão.",
  404: "Caso não encontrado.",
  409: "Já existe uma conta com este e-mail.",
};

/**
 * O que dá para aproveitar de um corpo de erro: `erro`/`mensagem` (padrão das rotas e do
 * backend) ou, fora do padrão, o `detail` do FastAPI ou o começo do texto/HTML devolvido.
 */
function lerCorpoDeErro(texto: string): { erro?: string; detalhe?: string } {
  try {
    const corpo = JSON.parse(texto) as Record<string, unknown> | null;
    if (corpo && typeof corpo === "object") {
      if (typeof corpo.erro === "string" && corpo.erro.trim()) return { erro: corpo.erro };
      if (typeof corpo.mensagem === "string" && corpo.mensagem.trim()) return { erro: corpo.mensagem };
      if (corpo.detail !== undefined) {
        return { detalhe: typeof corpo.detail === "string" ? corpo.detail : JSON.stringify(corpo.detail) };
      }
    }
  } catch {
    // Não é JSON: segue com o texto cru.
  }
  const limpo = texto.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { detalhe: limpo || undefined };
}

/** `fetch` com cookie de sessão e erros no formato `{ erro }` usado pelas rotas e pelo backend. */
export async function requisitarJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const metodo = (init.method ?? "GET").toUpperCase();
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (falha) {
    const causa = falha instanceof Error ? falha.message : String(falha);
    throw new ErroApi(`Não foi possível conectar ao servidor. Verifique sua internet. (${metodo} ${url}: ${causa})`, 0);
  }

  if (!resposta.ok) {
    const { erro, detalhe } = lerCorpoDeErro(await resposta.text().catch(() => ""));
    if (erro) throw new ErroApi(erro, resposta.status);
    // Status conhecido sem corpo (ex.: 404 de caso alheio) fica só com a mensagem amigável.
    const conhecida = MENSAGEM_POR_STATUS[resposta.status];
    if (conhecida && !detalhe) throw new ErroApi(conhecida, resposta.status);
    // Fora do padrão `{ erro }`: mostra o que aconteceu de fato, para dar para diagnosticar.
    const base = conhecida ?? "Algo deu errado.";
    const tecnico = `HTTP ${resposta.status}${resposta.statusText ? ` ${resposta.statusText}` : ""} em ${metodo} ${url}`;
    throw new ErroApi(`${base} (${tecnico}${detalhe ? `: ${detalhe.slice(0, 400)}` : ""})`, resposta.status);
  }

  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

type ApiConta = Pick<
  SophiaApi,
  "obterUsuarioAtual" | "obterOfertaAssinatura" | "assinar" | "trocarPlano" | "cancelarConta" | "aceitarTermos"
>;

export const contaApi: ApiConta = {
  async obterUsuarioAtual() {
    try {
      const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/auth/eu");
      return usuarioDaApi(usuario);
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 401) return null;
      throw erro;
    }
  },

  async obterOfertaAssinatura() {
    // Preço e textos ficam no front até o backend expor uma rota de oferta.
    return structuredClone(OFERTA_ASSINATURA);
  },

  async assinar(dados) {
    const { assinatura } = await requisitarJson<{ assinatura: AssinaturaApi }>("/api/assinatura", {
      method: "POST",
      body: JSON.stringify(assinaturaParaApi(dados)),
    });
    return assinaturaDaApi(assinatura);
  },

  async trocarPlano(planoId) {
    const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/assinatura/plano", {
      method: "POST",
      body: JSON.stringify({ plan_id: planoId }),
    });
    return usuarioDaApi(usuario);
  },

  async cancelarConta() {
    const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/conta/cancelar", {
      method: "POST",
    });
    return usuarioDaApi(usuario);
  },
  async aceitarTermos() {
    const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/conta/termos", {
      method: "POST",
    });
    return usuarioDaApi(usuario);
  },
};
