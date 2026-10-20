/**
 * Adapter HTTP do `SophiaApi`, ativado quando `NEXT_PUBLIC_API_URL` está definida
 * (ver `src/lib/api/index.ts`). Rotas e formatos estão em `docs/contrato-api.md`.
 *
 * A sessão viaja num cookie httpOnly definido pelo backend no cadastro/login,
 * por isso toda requisição vai com `credentials: "include"` e nenhuma envia o id
 * do usuário. É o backend que restringe cada consulta aos casos do dono da sessão.
 */

import type { SophiaApi } from "@/lib/api/types";

import {
  assinaturaDaApi,
  assinaturaParaApi,
  cadastroParaApi,
  casoDaApi,
  entrarParaApi,
  novoCasoParaApi,
  ofertaDaApi,
  usuarioDaApi,
  type AssinaturaApi,
  type CasoApi,
  type OfertaApi,
  type UsuarioApi,
} from "./mapeadores";

/** Mensagens para quando o backend não manda `{ mensagem }` no corpo do erro. */
const MENSAGEM_POR_STATUS: Record<number, string> = {
  401: "Sua sessão expirou. Entre novamente.",
  402: "Pagamento recusado pelo emissor do cartão. Tente outro cartão.",
  404: "Caso não encontrado.",
  409: "Já existe uma conta com este e-mail.",
};

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

export function criarHttpApi(baseUrl: string): SophiaApi {
  const base = baseUrl.replace(/\/$/, "");

  async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
    let resposta: Response;
    try {
      resposta = await fetch(`${base}${caminho}`, {
        ...init,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...init.headers },
      });
    } catch {
      throw new ErroApi("Não foi possível conectar ao servidor. Verifique sua internet.", 0);
    }

    if (!resposta.ok) {
      const corpo = (await resposta.json().catch(() => null)) as { mensagem?: string } | null;
      throw new ErroApi(
        corpo?.mensagem ?? MENSAGEM_POR_STATUS[resposta.status] ?? "Algo deu errado. Tente novamente.",
        resposta.status,
      );
    }

    if (resposta.status === 204) return undefined as T;
    return (await resposta.json()) as T;
  }

  const comCorpo = (method: string, corpo: unknown): RequestInit => ({ method, body: JSON.stringify(corpo) });
  const caminhoCaso = (id: string) => `/casos/${encodeURIComponent(id)}`;

  return {
    async listarCasos() {
      const lista = await requisitar<CasoApi[]>("/casos");
      return lista.map(casoDaApi);
    },
    async criarCaso(dados) {
      return casoDaApi(await requisitar<CasoApi>("/casos", comCorpo("POST", novoCasoParaApi(dados))));
    },
    async moverCaso(id, pasta) {
      return casoDaApi(await requisitar<CasoApi>(caminhoCaso(id), comCorpo("PATCH", { folder: pasta })));
    },
    async excluirCaso(id) {
      await requisitar<void>(caminhoCaso(id), { method: "DELETE" });
    },

    async criarConta(dados) {
      return usuarioDaApi(await requisitar<UsuarioApi>("/auth/cadastro", comCorpo("POST", cadastroParaApi(dados))));
    },
    async entrar(dados) {
      try {
        return usuarioDaApi(await requisitar<UsuarioApi>("/auth/entrar", comCorpo("POST", entrarParaApi(dados))));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 401) {
          throw new ErroApi("E-mail ou senha incorretos.", 401);
        }
        throw erro;
      }
    },
    async sair() {
      await requisitar<void>("/auth/sair", { method: "POST" });
    },
    async obterUsuarioAtual() {
      try {
        return usuarioDaApi(await requisitar<UsuarioApi>("/auth/eu"));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 401) return null;
        throw erro;
      }
    },

    async obterOfertaAssinatura() {
      return ofertaDaApi(await requisitar<OfertaApi>("/assinatura/oferta"));
    },
    async assinar(dados) {
      return assinaturaDaApi(await requisitar<AssinaturaApi>("/assinatura", comCorpo("POST", assinaturaParaApi(dados))));
    },
  };
}
