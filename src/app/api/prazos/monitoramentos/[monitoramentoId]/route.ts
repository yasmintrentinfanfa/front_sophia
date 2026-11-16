import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ monitoramentoId: string }> };

const caminho = (id: string) => `/prazos/monitoramentos/${encodeURIComponent(id)}`;

/** Liga o processo acompanhado a um caso (`casoId`) ou desfaz a ligação (`casoId: null`). */
export async function PATCH(pedido: Request, contexto: Contexto) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string | null };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para alterar o acompanhamento." }, { status: 401 });
  const { monitoramentoId } = await contexto.params;
  const casoId = typeof corpo.casoId === "string" ? corpo.casoId.trim().slice(0, 120) : "";
  return repassarJson(
    caminho(monitoramentoId),
    corpoJson({ user_id: userId, caso_id: casoId || null }, "PATCH"),
    "Não foi possível alterar o acompanhamento.",
  );
}

/** Deixa de acompanhar. Intimações que viraram prazo continuam salvas. */
export async function DELETE(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para alterar o acompanhamento." }, { status: 401 });
  const { monitoramentoId } = await contexto.params;
  return repassarJson(
    doUsuario(caminho(monitoramentoId), userId),
    { method: "DELETE" },
    "Não foi possível remover o acompanhamento.",
  );
}
