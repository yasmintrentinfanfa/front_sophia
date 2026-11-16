import { corpoJson, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Agenda um prazo com a data final que o advogado definiu (a partir de uma intimação ou avulso). */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as {
    descricao?: string;
    dataFinal?: string;
    publicacaoId?: string;
    casoId?: string;
    numeroProcesso?: string;
  };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para agendar o prazo." }, { status: 401 });
  const texto = (valor: unknown, limite: number) => (typeof valor === "string" ? valor.trim().slice(0, limite) : "");
  const opcional = (nome: string, valor: string) => (valor ? { [nome]: valor } : {});
  return repassarJson(
    "/prazos/agenda",
    corpoJson({
      user_id: userId,
      descricao: texto(corpo.descricao, 200),
      data_final: texto(corpo.dataFinal, 10),
      ...opcional("publicacao_id", texto(corpo.publicacaoId, 40)),
      ...opcional("caso_id", texto(corpo.casoId, 120)),
      ...opcional("numero_processo", texto(corpo.numeroProcesso, 30)),
    }),
    "Não foi possível agendar o prazo.",
  );
}
