import { MENSAGEM_API_INDISPONIVEL, urlDoBack } from "@/lib/servidor/back";
import { doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 60;

/** Modelos do escritório do advogado da sessão (peças-modelo que orientam as minutas). */
export async function GET() {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  return repassarJson(
    doUsuario("/modelos-escritorio", userId),
    undefined,
    "Não foi possível carregar os modelos do escritório.",
  );
}

/**
 * Envia uma peça-modelo (DOCX, PDF ou TXT). O arquivo vai inteiro para o backend, que extrai
 * o texto e guarda o Word para o timbre. O dono sai do cookie, nunca do corpo do pedido.
 */
export async function POST(pedido: Request) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para enviar o modelo." }, { status: 401 });
  }
  const recebido = await pedido.formData().catch(() => null);
  const arquivo = recebido?.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return Response.json({ erro: "Escolha o arquivo do modelo." }, { status: 400 });
  }

  const form = new FormData();
  form.append("user_id", userId);
  form.append("nome", String(recebido?.get("nome") ?? "").slice(0, 120));
  form.append("aplica_a", String(recebido?.get("aplicaA") ?? "todas"));
  form.append("arquivo", arquivo, arquivo.name);

  try {
    const res = await fetch(urlDoBack("/modelos-escritorio"), { method: "POST", body: form });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: MENSAGEM_API_INDISPONIVEL }, { status: 503 });
  }
}
