import { urlDoBack } from "@/lib/servidor/back";
import { doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ pecaId: string }> };

/** Uma minuta com o texto completo. */
export async function GET(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;
  return repassarJson(
    doUsuario(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}`, userId),
    undefined,
    "Não foi possível abrir a minuta.",
  );
}

/** Apaga a minuta do histórico do caso e do banco. O dono vem do cookie; minuta alheia é 404. */
export async function DELETE(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para excluir a minuta." }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;
  try {
    const res = await fetch(
      urlDoBack(doUsuario(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}`, userId)),
      { method: "DELETE" },
    );
    if (res.status === 405) {
      // Backend publicado antes da rota de exclusão.
      return Response.json({ erro: "A exclusão de minutas ainda não está disponível no servidor." }, { status: 501 });
    }
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível excluir a minuta." }, { status: 503 });
  }
}
