import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Grava na conta da sessão o aceite dos termos de uso. O id vem do cookie, nunca do corpo. */
export async function POST() {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para aceitar os termos." }, { status: 401 });
  }

  try {
    const res = await fetch(urlDoBack("/conta/aceitar-termos"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível registrar o aceite dos termos." }, { status: 503 });
  }
}
