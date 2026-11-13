import { urlDoBack } from "@/lib/servidor/back";
import { corpoJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 120;

/**
 * Chat com a resposta chegando enquanto a IA escreve. O corpo NDJSON do backend passa direto,
 * sem esperar a resposta inteira. Se o leitor desistir (fechou a aba), o pedido ao backend
 * também é cancelado e nada é gravado.
 */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string; mensagem?: string };
  const casoId = (corpo.casoId ?? "").trim();
  const mensagem = (corpo.mensagem ?? "").trim().slice(0, 4000);
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para conversar." }, { status: 401 });
  if (!casoId || !mensagem) return Response.json({ erro: "Informe o caso e a mensagem." }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(urlDoBack(`/chat/${encodeURIComponent(casoId)}/stream`), {
      ...corpoJson({ user_id: userId, mensagem }),
      signal: pedido.signal,
    });
  } catch {
    return Response.json({ erro: "Não foi possível enviar a mensagem." }, { status: 503 });
  }

  if (!res.ok || !res.body) {
    const dados = (await res.json().catch(() => ({}))) as { erro?: string };
    // Backend publicado antes do streaming: a rota não existe (404 sem `erro`, ou 405).
    if (res.status === 405 || (res.status === 404 && !dados.erro)) {
      return Response.json({ erro: "Streaming indisponível." }, { status: 501 });
    }
    return Response.json(dados, { status: res.status });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
