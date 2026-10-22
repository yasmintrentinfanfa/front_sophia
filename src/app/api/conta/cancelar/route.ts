import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Marca a conta da sessão como cancelada. O id vem do cookie, nunca do corpo. */
export async function POST() {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para cancelar." }, { status: 401 });
  }

  try {
    const res = await fetch(urlDoBack("/conta/cancelar"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível cancelar a conta." }, { status: 503 });
  }
}
