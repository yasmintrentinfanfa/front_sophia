import { corpoJson, doUsuario, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

type Contexto = { params: Promise<{ prazoId: string }> };

const caminho = (id: string) => `/prazos/agenda/${encodeURIComponent(id)}`;

/** Edita a descrição ou a data final, ou marca como cumprido. */
export async function PATCH(pedido: Request, contexto: Contexto) {
  const corpo = (await pedido.json().catch(() => ({}))) as {
    descricao?: string;
    dataFinal?: string;
    cumprido?: boolean;
  };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para alterar o prazo." }, { status: 401 });
  const { prazoId } = await contexto.params;
  return repassarJson(
    caminho(prazoId),
    corpoJson(
      {
        user_id: userId,
        ...(typeof corpo.descricao === "string" ? { descricao: corpo.descricao.trim().slice(0, 200) } : {}),
        ...(typeof corpo.dataFinal === "string" ? { data_final: corpo.dataFinal.trim().slice(0, 10) } : {}),
        ...(typeof corpo.cumprido === "boolean" ? { cumprido: corpo.cumprido } : {}),
      },
      "PATCH",
    ),
    "Não foi possível alterar o prazo.",
  );
}

/** Exclui o prazo. Se era o único da intimação, ela volta para "a tratar". */
export async function DELETE(_pedido: Request, contexto: Contexto) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para excluir o prazo." }, { status: 401 });
  const { prazoId } = await contexto.params;
  return repassarJson(doUsuario(caminho(prazoId), userId), { method: "DELETE" }, "Não foi possível excluir o prazo.");
}
