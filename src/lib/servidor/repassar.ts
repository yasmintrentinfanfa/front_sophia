import { urlDoBack } from "@/lib/servidor/back";

/**
 * Repassa a resposta JSON do backend com o mesmo status. Se a API nem responder,
 * devolve 503 com a mensagem de falha da rota. 204 segue sem corpo.
 */
export async function repassarJson(caminho: string, init: RequestInit | undefined, falha: string) {
  try {
    const res = await fetch(urlDoBack(caminho), init);
    if (res.status === 204) return new Response(null, { status: 204 });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: falha }, { status: 503 });
  }
}

export function corpoJson(corpo: unknown, method = "POST"): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) };
}

/** `?user_id=` para as rotas GET do backend; o id sai sempre do cookie assinado. */
export function doUsuario(caminho: string, userId: string) {
  return `${caminho}?user_id=${encodeURIComponent(userId)}`;
}
