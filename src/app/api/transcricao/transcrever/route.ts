import { MENSAGEM_API_INDISPONIVEL, urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 300;

export async function POST(pedido: Request) {
  // Transcrição consome CPU do servidor: só para quem está logado.
  if (!(await idDoUsuarioNaSessao())) {
    return Response.json({ erro: "Entre na sua conta para transcrever." }, { status: 401 });
  }
  try {
    const form = await pedido.formData();
    const res = await fetch(urlDoBack("/transcribe"), { method: "POST", body: form });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: MENSAGEM_API_INDISPONIVEL },
      { status: 503 },
    );
  }
}
