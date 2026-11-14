import { urlDoBack } from "@/lib/servidor/back";
import { doUsuario } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ casoId: string; documentoId: string }> };

/**
 * Tira do caso um documento anexado por engano. O dono vem do cookie; documento de caso alheio
 * responde 404, como documento inexistente.
 */
export async function DELETE(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para excluir o documento." }, { status: 401 });
  const { casoId, documentoId } = await contexto.params;
  try {
    const res = await fetch(
      urlDoBack(
        doUsuario(`/casos/${encodeURIComponent(casoId)}/documentos/${encodeURIComponent(documentoId)}`, userId),
      ),
      { method: "DELETE" },
    );
    if (res.status === 204) return new Response(null, { status: 204 });
    const dados = (await res.json().catch(() => ({}))) as { erro?: string };
    // Backend publicado antes desta rota: o FastAPI responde 405 (ou 404 sem `erro`).
    if (res.status === 405 || (res.status === 404 && !dados.erro)) {
      return Response.json(
        { erro: "A exclusão de documentos ainda não está disponível no servidor." },
        { status: 501 },
      );
    }
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível excluir o documento." }, { status: 503 });
  }
}
