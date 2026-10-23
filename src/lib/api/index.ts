import type { SophiaApi } from "./types";

import { criarAnaliseApi } from "./analise-real";
import { criarHttpApi } from "./http/adapter";
import { mockApi } from "./mock/adapter";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
/** Análise e chat com IA de verdade; nos testes seguem simulados. */
const ANALISE_REAL = process.env.NODE_ENV !== "test" && process.env.NEXT_PUBLIC_ANALISE_REAL !== "false";

const base: SophiaApi = API_URL ? criarHttpApi(API_URL) : mockApi;

/**
 * Único ponto de acesso a dados do front.
 *
 * Sem `NEXT_PUBLIC_API_URL` os casos usam o adapter de base (mock + `/api/casos`). Análise
 * preliminar e chat vêm do backend (IA de verdade), salvo com `NEXT_PUBLIC_ANALISE_REAL=false`
 * — nenhum componente muda.
 */
export const api: SophiaApi = ANALISE_REAL ? { ...base, ...criarAnaliseApi(base) } : base;

export type * from "./types";
