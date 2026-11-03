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
    const dados = (await res.json().catch(() => ({}))) as { text?: string; erro?: string };
    if (!res.ok) {
      const erro =
        dados.erro ||
        (res.status === 413
          ? "O áudio é grande demais para enviar. Use um arquivo menor, de preferência MP3."
          : "Não foi possível transcrever o áudio.");
      return Response.json({ erro }, { status: res.status === 413 ? 413 : res.status });
    }
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: MENSAGEM_API_INDISPONIVEL },
      { status: 503 },
    );
  }
}
