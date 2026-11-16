import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ publicacaoId: string }> };

/** Intimação com o inteiro teor (no painel o texto vem resumido). */
export async function GET(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para ver a intimação." }, { status: 401 });
  const { publicacaoId } = await contexto.params;
  return repassarJson(
    doUsuario(`/prazos/publicacoes/${encodeURIComponent(publicacaoId)}`, userId),
    undefined,
    "Não foi possível abrir a intimação.",
  );
}

/** Marca a intimação como "sem prazo a cumprir" (`sem_prazo`) ou devolve para "a tratar" (`pendente`). */
export async function PATCH(pedido: Request, contexto: Contexto) {
  const corpo = (await pedido.json().catch(() => ({}))) as { situacao?: string };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para alterar a intimação." }, { status: 401 });
  const { publicacaoId } = await contexto.params;
  return repassarJson(
    `/prazos/publicacoes/${encodeURIComponent(publicacaoId)}`,
    corpoJson({ user_id: userId, situacao: typeof corpo.situacao === "string" ? corpo.situacao : "" }, "PATCH"),
    "Não foi possível alterar a intimação.",
  );
}
