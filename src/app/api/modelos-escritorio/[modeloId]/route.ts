import { MENSAGEM_API_INDISPONIVEL, urlDoBack } from "@/lib/servidor/back";
import { doUsuario } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ modeloId: string }> };

/** Exclui um modelo do escritório do advogado da sessão. */
export async function DELETE(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  const { modeloId } = await contexto.params;
  try {
    const res = await fetch(urlDoBack(doUsuario(`/modelos-escritorio/${encodeURIComponent(modeloId)}`, userId)), {
      method: "DELETE",
    });
    if (res.status === 204) return new Response(null, { status: 204 });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: MENSAGEM_API_INDISPONIVEL }, { status: 503 });
  }
}
