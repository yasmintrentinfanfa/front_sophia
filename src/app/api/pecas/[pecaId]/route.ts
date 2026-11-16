import { urlDoBack } from "@/lib/servidor/back";
import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
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

/** Grava o texto revisado pelo advogado. O dono vem do cookie. */
export async function PATCH(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para editar a minuta." }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;
  const corpo = (await pedido.json().catch(() => ({}))) as { texto?: string };
  const texto = typeof corpo.texto === "string" ? corpo.texto : "";
  if (!texto.trim()) return Response.json({ erro: "A minuta não pode ficar vazia." }, { status: 400 });
  try {
    const res = await fetch(
      urlDoBack(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}`),
      corpoJson({ user_id: userId, texto }, "PATCH"),
    );
    if (res.status === 405) {
      return Response.json({ erro: "A edição de minutas ainda não está disponível no servidor." }, { status: 501 });
    }
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível salvar a minuta." }, { status: 503 });
  }
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
