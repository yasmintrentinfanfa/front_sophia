import { doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Painel de prazos: acompanhamentos, intimações do DJEN e prazos. `?casoId=` limita a um caso. */
export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para ver os prazos." }, { status: 401 });
  const caminho = doUsuario("/prazos/painel", userId) + (casoId ? `&caso_id=${encodeURIComponent(casoId)}` : "");
  return repassarJson(caminho, undefined, "Não foi possível carregar os prazos.");
}
