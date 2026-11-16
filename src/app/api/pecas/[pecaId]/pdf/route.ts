import { urlDoBack } from "@/lib/servidor/back";
import { corpoJson, doUsuario } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ pecaId: string }> };

async function repassarPdf(res: Response) {
  if (!res.ok) {
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": res.headers.get("content-disposition") ?? 'attachment; filename="minuta.pdf"',
    },
  });
}

/** PDF da minuta salva no backend. */
export async function GET(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;

  try {
    const res = await fetch(
      urlDoBack(doUsuario(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}/pdf`, userId)),
    );
    return await repassarPdf(res);
  } catch {
    return Response.json({ erro: "Não foi possível baixar a minuta." }, { status: 503 });
  }
}

/** PDF com o texto da tela, inclusive a edição ainda não gravada. */
export async function POST(pedido: Request, contexto: Contexto) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para baixar a minuta." }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });
  const { pecaId } = await contexto.params;
  const corpo = (await pedido.json().catch(() => ({}))) as { texto?: string };
  const texto = typeof corpo.texto === "string" ? corpo.texto : "";
  if (!texto.trim()) return Response.json({ erro: "A minuta não pode ficar vazia." }, { status: 400 });

  try {
    const res = await fetch(
      urlDoBack(`/pecas/${encodeURIComponent(casoId)}/${encodeURIComponent(pecaId)}/pdf`),
      corpoJson({ user_id: userId, texto }),
    );
    if (res.status === 405) {
      return Response.json(
        { erro: "O download em PDF ainda não está disponível no servidor." },
        { status: 501 },
      );
    }
    return await repassarPdf(res);
  } catch {
    return Response.json({ erro: "Não foi possível baixar a minuta." }, { status: 503 });
  }
}
