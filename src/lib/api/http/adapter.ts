/**
 * Adapter HTTP do `SophiaApi`, ativado quando `NEXT_PUBLIC_API_URL` está definida
 * (ver `src/lib/api/index.ts`). Rotas e formatos estão em `docs/contrato-api.md`.
 *
 * A sessão viaja num cookie httpOnly definido pelo backend no cadastro/login,
 * por isso toda requisição vai com `credentials: "include"` e nenhuma envia o id
 * do usuário.
 */

import type { SophiaApi } from "@/lib/api/types";
import { mockApi } from "@/lib/api/mock/adapter";

/** Mensagens para quando o backend não manda `{ mensagem }` no corpo do erro. */
const MENSAGEM_POR_STATUS: Record<number, string> = {
  401: "E-mail ou senha incorretos.",
  402: "Pagamento recusado pelo emissor do cartão. Tente outro cartão.",
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

  const enviar = (corpo: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(corpo) });

  return {
    // Casos ainda não têm rota no backend; seguem no mock até lá.
    listarCasos: mockApi.listarCasos,
    criarCaso: mockApi.criarCaso,
    moverCaso: mockApi.moverCaso,
    excluirCaso: mockApi.excluirCaso,

    criarConta: (dados) => requisitar("/auth/cadastro", enviar(dados)),
    entrar: (dados) => requisitar("/auth/entrar", enviar(dados)),
    sair: () => requisitar("/auth/sair", { method: "POST" }),
    async obterUsuarioAtual() {
      try {
        return await requisitar("/auth/eu");
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 401) return null;
        throw erro;
      }
    },

    obterOfertaAssinatura: () => requisitar("/assinatura/oferta"),
    assinar: (dados) => requisitar("/assinatura", enviar(dados)),
  };
}
