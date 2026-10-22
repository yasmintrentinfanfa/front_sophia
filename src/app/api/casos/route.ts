import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Lista os casos do usuário da sessão. O id nunca vem da query. */
export async function GET(_pedido: Request) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para ver os casos." }, { status: 401 });
  }

  try {
    const res = await fetch(`${urlDoBack("/casos")}?user_id=${encodeURIComponent(userId)}`);
    const dados = (await res.json().catch(() => ({}))) as { casos?: unknown; erro?: string };
    if (!res.ok) return Response.json(dados, { status: res.status });
    return Response.json(dados.casos ?? []);
  } catch {
    return Response.json(
      { erro: "Não foi possível carregar os casos. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}

/** Cria o caso já no banco, para a lista sobreviver a um novo login. */
export async function POST(pedido: Request) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para criar um caso." }, { status: 401 });
  }

  const corpo = (await pedido.json().catch(() => ({}))) as {
    caso_id?: string;
    title?: string;
    client_name?: string;
    legal_area?: string | null;
  };

  try {
    const res = await fetch(urlDoBack("/casos"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        caso_id: (corpo.caso_id ?? "").trim(),
        title: (corpo.title ?? "").trim(),
        client_name: (corpo.client_name ?? "").trim(),
        legal_area: corpo.legal_area ?? null,
      }),
    });
    const dados = (await res.json().catch(() => ({}))) as { caso?: unknown; erro?: string };
    if (!res.ok) return Response.json(dados, { status: res.status });
    return Response.json(dados.caso ?? dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível salvar o caso. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}
