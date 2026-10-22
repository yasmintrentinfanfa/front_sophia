import { urlDoBack } from "@/lib/servidor/back";
import { doUsuario } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ pecaId: string }> };

/** Download da minuta em .docx, montado pelo backend a partir do texto salvo. */
export async function GET(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;

  try {
    const res = await fetch(
      urlDoBack(doUsuario(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}/docx`, userId)),
    );
    if (!res.ok) {
      const dados = await res.json().catch(() => ({}));
      return Response.json(dados, { status: res.status });
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": res.headers.get("content-disposition") ?? 'attachment; filename="minuta.docx"',
      },
    });
  } catch {
    return Response.json({ erro: "Não foi possível baixar a minuta." }, { status: 503 });
  }
}
