/**
 * Catálogo das 12 áreas jurídicas, usado na criação e na edição do caso.
 *
 * Fonte de verdade: `GET /areas` no backend (`src/lib/api/areas.ts`). Esta lista é o
 * fallback quando a chamada falha — por isso os ids, nomes e grupos de peça aqui
 * precisam continuar batendo com o que o backend devolve.
 */

export interface AreaJuridica {
  id: string;
  nome: string;
  descricao: string;
  /** Grupos de `GET /pecas/modelos` mais úteis para esta área, na ordem de prioridade. */
  gruposPecas: string[];
}

export const AREAS_JURIDICAS = [
  {
    id: "civil",
    nome: "Direito Civil",
    descricao: "Contratos, obrigações, cobranças, responsabilidade civil e indenizações entre particulares.",
    gruposPecas: ["civel", "juizados", "superiores", "extrajudicial"],
  },
  {
    id: "familia-sucessoes",
    nome: "Família e Sucessões",
    descricao: "Divórcio, união estável, guarda, convivência, alimentos, partilha, inventário e testamentos.",
    gruposPecas: ["familia", "civel", "superiores", "extrajudicial"],
  },
  {
    id: "trabalhista",
    nome: "Direito do Trabalho",
    descricao: "Vínculo de emprego, verbas rescisórias, jornada, adicionais, acidentes e assédio.",
    gruposPecas: ["trabalhista", "extrajudicial"],
  },
  {
    id: "previdenciario",
    nome: "Direito Previdenciário",
    descricao: "Aposentadorias, benefícios por incapacidade, pensão por morte, BPC/LOAS e revisões no INSS.",
    gruposPecas: ["previdenciario", "juizados", "civel", "superiores", "extrajudicial"],
  },
  {
    id: "consumidor",
    nome: "Direito do Consumidor",
    descricao: "Produtos e serviços com defeito, cobranças indevidas, negativação, bancos, planos de saúde e voos.",
    gruposPecas: ["civel", "juizados", "superiores", "extrajudicial"],
  },
  {
    id: "empresarial",
    nome: "Direito Empresarial",
    descricao: "Sociedades, conflitos entre sócios, contratos empresariais, títulos de crédito e recuperação judicial.",
    gruposPecas: ["civel", "superiores", "extrajudicial"],
  },
  {
    id: "tributario",
    nome: "Direito Tributário",
    descricao: "Cobranças de tributos, autos de infração, execução fiscal, restituição e planejamento tributário.",
    gruposPecas: ["tributario", "administrativo", "civel", "superiores", "extrajudicial"],
  },
  {
    id: "penal",
    nome: "Direito Penal",
    descricao: "Defesa criminal, prisões, inquéritos, ações penais, queixa-crime e execução penal.",
    gruposPecas: ["penal", "superiores"],
  },
  {
    id: "administrativo",
    nome: "Direito Administrativo",
    descricao: "Servidores públicos, concursos, licitações, multas, processos administrativos e responsabilidade do Estado.",
    gruposPecas: ["administrativo", "civel", "juizados", "superiores", "extrajudicial"],
  },
  {
    id: "imobiliario",
    nome: "Direito Imobiliário",
    descricao: "Compra e venda de imóveis, locação, posse, usucapião, condomínio, distrato e vícios de construção.",
    gruposPecas: ["civel", "juizados", "superiores", "extrajudicial"],
  },
  {
    id: "ambiental",
    nome: "Direito Ambiental",
    descricao: "Autos de infração ambientais, licenciamento, APP e reserva legal, dano ambiental e crimes ambientais.",
    gruposPecas: ["administrativo", "civel", "penal", "superiores", "extrajudicial"],
  },
  {
    id: "digital",
    nome: "Direito Digital",
    descricao: "Proteção de dados (LGPD), remoção de conteúdo, perfis falsos, golpes e crimes na internet.",
    gruposPecas: ["civel", "juizados", "penal", "superiores", "extrajudicial"],
  },
] as const satisfies readonly AreaJuridica[];

export type IdAreaJuridica = (typeof AREAS_JURIDICAS)[number]["id"];

export function areaPorId(id: string | undefined) {
  return AREAS_JURIDICAS.find((area) => area.id === id);
}
