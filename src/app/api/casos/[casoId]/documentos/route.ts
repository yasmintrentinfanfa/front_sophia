import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ casoId: string }> };

export const maxDuration = 60;

/**
 * Anexa PDF, DOCX ou TXT ao caso. O arquivo vai inteiro para o backend, que extrai só o
 * texto e grava um item em `documents`. O dono sai do cookie, nunca do corpo do pedido.
 */
export async function POST(pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para anexar o documento." }, { status: 401 });
  }
  const { casoId } = await contexto.params;

  const recebido = await pedido.formData().catch(() => null);
  const arquivo = recebido?.get("arquivo");
  if (!casoId || !(arquivo instanceof File) || arquivo.size === 0) {
    return Response.json({ erro: "Informe o caso e escolha um arquivo." }, { status: 400 });
  }

  const form = new FormData();
  form.append("user_id", userId);
  form.append("caso_id", casoId);
  form.append("arquivo", arquivo, arquivo.name);

  try {
    const res = await fetch(urlDoBack("/anexar-documento"), { method: "POST", body: form });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível salvar o documento. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}
