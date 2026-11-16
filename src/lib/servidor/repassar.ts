import { urlDoBack } from "@/lib/servidor/back";

/** Causa de uma falha de rede do `fetch` do Node ("fetch failed" esconde o motivo em `cause`). */
function causaDaFalha(falha: unknown) {
  if (!(falha instanceof Error)) return String(falha);
  const causa = (falha as Error & { cause?: { code?: string; message?: string } }).cause;
  const detalhe = causa?.code ?? causa?.message;
  return detalhe ? `${falha.message}: ${detalhe}` : falha.message;
}

/** Erro do backend fora do padrão `{ erro }` (FastAPI `detail`, HTML da Vercel, texto) vira `{ erro }` com o detalhe. */
function erroForaDoPadrao(status: number, texto: string, falha: string) {
  let detalhe = texto.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  try {
    const corpo = JSON.parse(texto) as { detail?: unknown };
    if (corpo && corpo.detail !== undefined) {
      detalhe = typeof corpo.detail === "string" ? corpo.detail : JSON.stringify(corpo.detail);
    }
  } catch {
    // Texto cru.
  }
  const pista =
    status === 404 && detalhe === "Not Found"
      ? " — a rota não existe no backend em uso (ele pode estar sem este módulo publicado)"
      : "";
  return `${falha} (backend respondeu HTTP ${status}${detalhe ? `: ${detalhe.slice(0, 400)}` : ""}${pista})`;
}

/**
 * Repassa a resposta JSON do backend com o mesmo status. Se a API nem responder,
 * devolve 503 com a mensagem de falha da rota e o motivo. 204 segue sem corpo. Erro sem
 * `{ erro }` ganha um, com o que o backend devolveu, para a tela mostrar o que houve.
 */
export async function repassarJson(caminho: string, init: RequestInit | undefined, falha: string) {
  const destino = urlDoBack(caminho);
  let res: Response;
  try {
    res = await fetch(destino, init);
  } catch (erro) {
    const semQuery = destino.split("?")[0];
    return Response.json({ erro: `${falha} (sem resposta de ${semQuery}: ${causaDaFalha(erro)})` }, { status: 503 });
  }
  if (res.status === 204) return new Response(null, { status: 204 });
  const texto = await res.text().catch(() => "");
  let dados: unknown = null;
  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = null;
  }
  const temErro = !!dados && typeof dados === "object" && typeof (dados as { erro?: unknown }).erro === "string";
  if (!res.ok && !temErro) {
    return Response.json({ erro: erroForaDoPadrao(res.status, texto, falha) }, { status: res.status });
  }
  if (dados === null) {
    return Response.json({ erro: `${falha} (o backend devolveu uma resposta que não é JSON)` }, { status: 502 });
  }
  return Response.json(dados, { status: res.status });
}

export function corpoJson(corpo: unknown, method = "POST"): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) };
}

/** `?user_id=` para as rotas GET do backend; o id sai sempre do cookie assinado. */
export function doUsuario(caminho: string, userId: string) {
  return `${caminho}?user_id=${encodeURIComponent(userId)}`;
}
