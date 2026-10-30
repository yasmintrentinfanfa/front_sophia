import { MENSAGEM_API_INDISPONIVEL } from "@/lib/servidor/back";
import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 300;

/** Minutas do caso: lista (sem o texto) e geração a partir de um modelo do catálogo. */
export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  return repassarJson(
    doUsuario(`/pecas/${encodeURIComponent(casoId)}`, userId),
    undefined,
    "Não foi possível carregar as minutas.",
  );
}

export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as {
    casoId?: string;
    modeloId?: string;
    instrucoes?: string;
  };
  const casoId = (corpo.casoId ?? "").trim();
  const modeloId = (corpo.modeloId ?? "").trim();
  const instrucoes = (corpo.instrucoes ?? "").trim().slice(0, 2000);
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para gerar a minuta." }, { status: 401 });
  if (!casoId || !modeloId) return Response.json({ erro: "Informe o caso e o modelo." }, { status: 400 });
  return repassarJson(
    `/pecas/${encodeURIComponent(casoId)}`,
    corpoJson({ user_id: userId, modelo_id: modeloId, ...(instrucoes ? { instrucoes } : {}) }),
    MENSAGEM_API_INDISPONIVEL,
  );
}
