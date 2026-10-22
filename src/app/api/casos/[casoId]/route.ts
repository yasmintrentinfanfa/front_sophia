import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ casoId: string }> };

/** Arquiva, restaura ou atualiza o status. O dono sai do cookie. */
export async function PATCH(pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para alterar o caso." }, { status: 401 });
  }
  const { casoId } = await contexto.params;
  const corpo = (await pedido.json().catch(() => ({}))) as { folder?: string; status?: string };

  try {
    const res = await fetch(urlDoBack(`/casos/${encodeURIComponent(casoId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        ...(corpo.folder ? { folder: corpo.folder } : {}),
        ...(corpo.status ? { status: corpo.status } : {}),
      }),
    });
    const dados = (await res.json().catch(() => ({}))) as { caso?: unknown; erro?: string };
    if (!res.ok) return Response.json(dados, { status: res.status });
    return Response.json(dados.caso ?? dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível atualizar o caso. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}

/** Some da tela do cliente. O documento continua no Mongo, com in_system false. */
export async function DELETE(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para excluir o caso." }, { status: 401 });
  }
  const { casoId } = await contexto.params;

  try {
    const res = await fetch(
      `${urlDoBack(`/casos/${encodeURIComponent(casoId)}`)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    if (res.status === 204) return new Response(null, { status: 204 });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível excluir o caso. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}
