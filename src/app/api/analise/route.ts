import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** A IA pode levar quase um minuto, com uma nova tentativa se a resposta for rejeitada. */
export const maxDuration = 300;

/**
 * Análise preliminar do caso. O `user_id` sai só do cookie assinado, nunca do corpo ou da
 * URL; o backend responde 404 para caso inexistente ou de outro usuário.
 */
export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  return repassarJson(
    doUsuario(`/analise/${encodeURIComponent(casoId)}`, userId),
    undefined,
    "Não foi possível ler a análise.",
  );
}

export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as {
    casoId?: string;
    incluirChat?: boolean;
    fonteTipo?: string;
    fonteId?: string;
  };
  const casoId = (corpo.casoId ?? "").trim();
  const fonteTipo = (corpo.fonteTipo ?? "").trim();
  const fonteId = (corpo.fonteId ?? "").trim();
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para analisar o caso." }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  return repassarJson(
    `/analise/${encodeURIComponent(casoId)}`,
    corpoJson({
      user_id: userId,
      ...(corpo.incluirChat === true ? { incluir_chat: true } : {}),
      ...(fonteTipo ? { fonte_tipo: fonteTipo, ...(fonteId ? { fonte_id: fonteId } : {}) } : {}),
    }),
    "Não foi possível gerar a análise. Confira se a API está na porta 8000.",
  );
}
