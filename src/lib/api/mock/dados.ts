/**
 * Casos de demonstração enquanto o backend é construído em paralelo.
 * São os mesmos que aparecem no protótipo do Figma.
 */

import type { Caso, OfertaAssinatura } from "@/lib/api/types";

export const CASOS: Caso[] = [
  {
    id: "rescisao-silva",
    titulo: "Rescisão contratual",
    cliente: "João Silva",
    status: "em_analise",
    pasta: "ativo",
    atualizadoEm: "2026-09-21T14:32:00.000Z",
  },
  {
    id: "cobranca-xyz",
    titulo: "Ação de cobrança",
    cliente: "Empresa XYZ Ltda",
    status: "gravacao_pendente",
    pasta: "ativo",
    atualizadoEm: "2026-09-20T18:05:00.000Z",
  },
  {
    id: "locacao-santos",
    titulo: "Revisão de contrato de locação",
    cliente: "Maria Santos",
    status: "concluido",
    pasta: "ativo",
    atualizadoEm: "2026-03-10T11:20:00.000Z",
  },
];

/**
 * Oferta da tela de assinatura. Preços definidos pelo negócio; os textos dos
 * planos são provisórios até a equipe fechar quantos créditos cada um inclui.
 */
export const OFERTA_ASSINATURA: OfertaAssinatura = {
  plataforma: {
    nome: "Plataforma Sophia",
    precoMensal: 15_000,
    inclui: [
      "Gravação e transcrição das entrevistas com clientes",
      "Análise preliminar do caso com fontes citadas",
      "Conversa com a IA para aprofundar cada caso",
      "Rascunhos de peças processuais a partir do caso",
      "Repositório com tudo do caso em um só lugar",
    ],
  },
  planos: [
    {
      id: "basico",
      nome: "Básico",
      precoMensal: 10_000,
      descricao: "Para quem está começando a usar IA nos atendimentos.",
      beneficios: ["Créditos de IA para uso leve", "Ideal para poucos casos por mês"],
    },
    {
      id: "intermediario",
      nome: "Intermediário",
      precoMensal: 25_000,
      descricao: "Para quem atende clientes toda semana.",
      beneficios: ["Créditos de IA para uso frequente", "Ideal para uma rotina de casos constante"],
      recomendado: true,
    },
    {
      id: "pro",
      nome: "Pro",
      precoMensal: 60_000,
      descricao: "Para escritórios com volume alto de casos.",
      beneficios: ["Créditos de IA para uso intenso", "Ideal para equipes com vários advogados"],
    },
  ],
};
