import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Anexa PDF, Word, DOC ou TXT ao caso. O texto não entra na transcrição. */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json()) as { casoId?: string; nome?: string; tipo?: string; texto?: string };
  const casoId = (corpo.casoId ?? "").trim();
  const nome = (corpo.nome ?? "").trim();
  const tipo = (corpo.tipo ?? "").trim().toLowerCase();
  const texto = (corpo.texto ?? "").trim();
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para anexar o documento." }, { status: 401 });
  }
  if (!casoId || !nome || !tipo || texto.length < 20) {
    return Response.json({ erro: "Informe o caso e um arquivo com texto legível." }, { status: 400 });
  }

  try {
    const res = await fetch(urlDoBack("/salvar-documento"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, caso_id: casoId, nome, tipo, texto }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível salvar o documento." }, { status: 503 });
  }
}
