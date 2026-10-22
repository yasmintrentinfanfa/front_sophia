import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 120;

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
  const mensagem = (corpo.mensagem ?? "").trim().slice(0, 4000);
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para conversar." }, { status: 401 });
  if (!casoId || !mensagem) return Response.json({ erro: "Informe o caso e a mensagem." }, { status: 400 });
  return repassarJson(
    `/chat/${encodeURIComponent(casoId)}`,
    corpoJson({ user_id: userId, mensagem }),
    "Não foi possível enviar a mensagem.",
  );
}
