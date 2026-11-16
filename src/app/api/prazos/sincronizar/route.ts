import { corpoJson, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 300;

/** Consulta o DJEN para os acompanhamentos da conta (ou só os do caso) e devolve o painel atualizado. */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string; forcar?: boolean };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para atualizar os prazos." }, { status: 401 });
  const casoId = (corpo.casoId ?? "").trim();
  return repassarJson(
    "/prazos/sincronizar",
    corpoJson({ user_id: userId, forcar: corpo.forcar === true, ...(casoId ? { caso_id: casoId } : {}) }),
    "Não foi possível consultar o DJEN agora.",
  );
}
