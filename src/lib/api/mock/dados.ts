/**
 * Casos de demonstração enquanto o backend é construído em paralelo.
 * São os mesmos que aparecem no protótipo do Figma.
 */

import type { Caso } from "@/lib/api/types";

export const CASOS: Caso[] = [
  {
    id: "rescisao-silva",
    titulo: "Rescisão contratual — Silva",
    cliente: "João Silva",
    status: "em_analise",
    atualizadoEm: "2026-09-21T14:32:00.000Z",
  },
  {
    id: "cobranca-xyz",
    titulo: "Ação de cobrança — Empresa XYZ",
    cliente: "Empresa XYZ Ltda",
    status: "gravacao_pendente",
    atualizadoEm: "2026-09-20T18:05:00.000Z",
  },
  {
    id: "locacao-santos",
    titulo: "Revisão de contrato de locação",
    cliente: "Maria Santos",
    status: "concluido",
    atualizadoEm: "2026-03-10T11:20:00.000Z",
  },
];
