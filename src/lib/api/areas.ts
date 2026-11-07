/**
 * Catálogo de áreas jurídicas. Fonte real: `GET /areas` no backend (lista fixa, sem
 * `user_id`). Se a chamada falhar, cai no catálogo local de `lib/casos/areas-juridicas`,
 * que tem os mesmos ids, nomes e grupos de peça.
 */

import { AREAS_JURIDICAS, type AreaJuridica } from "@/lib/casos/areas-juridicas";
import { requisitarJson } from "./conta";

export type { AreaJuridica };

export const areasApi = {
  async obterCatalogo(): Promise<AreaJuridica[]> {
    try {
      const { areas } = await requisitarJson<{ areas: AreaJuridica[] }>("/api/areas");
      return areas?.length ? areas : [...AREAS_JURIDICAS];
    } catch {
      return [...AREAS_JURIDICAS];
    }
  },
};
