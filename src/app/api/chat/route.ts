import { LIMITE_MENSAGEM_CHAT } from "@/lib/chat/limites";
import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Resposta longa com busca na web pode passar de 2 minutos; o mesmo teto da análise e das peças. */
export const maxDuration = 300;

/**
 * Chat com IA sobre o caso. O front manda só a mensagem nova: o histórico fica no banco e o
 * backend lê dele as últimas mensagens. O dono vem do cookie assinado; caso alheio é 404.
 */
export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  return repassarJson(
    doUsuario(`/chat/${encodeURIComponent(casoId)}`, userId),
    undefined,
    "Não foi possível carregar as mensagens.",
  );
}

export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string; mensagem?: string };
  const casoId = (corpo.casoId ?? "").trim();
  const mensagem = (corpo.mensagem ?? "").trim().slice(0, LIMITE_MENSAGEM_CHAT);
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para conversar." }, { status: 401 });
  if (!casoId || !mensagem) return Response.json({ erro: "Informe o caso e a mensagem." }, { status: 400 });
  return repassarJson(
    `/chat/${encodeURIComponent(casoId)}`,
    corpoJson({ user_id: userId, mensagem }),
    "Não foi possível enviar a mensagem.",
  );
}
