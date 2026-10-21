import type { SophiaApi } from "./types";

import { criarHttpApi } from "./http/adapter";
import { mockApi } from "./mock/adapter";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Único ponto de acesso a dados do front.
 *
 * Sem `NEXT_PUBLIC_API_URL` tudo roda no mock. Com ela (ex.: `/api` se o backend
 * for rota do próprio Next, ou `http://localhost:5000/api`), conta e assinatura
 * passam a usar a API real — nenhum componente muda.
 */
export const api: SophiaApi = API_URL ? criarHttpApi(API_URL) : mockApi;

export type * from "./types";
