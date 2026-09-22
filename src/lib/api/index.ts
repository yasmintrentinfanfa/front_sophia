import type { SophiaApi } from "./types";

import { mockApi } from "./mock/adapter";

/**
 * Único ponto de acesso a dados do front.
 *
 * Quando a API real estiver disponível, crie `./http/adapter.ts` implementando
 * `SophiaApi` e troque a atribuição abaixo.
 */
export const api: SophiaApi = mockApi;

export type * from "./types";
