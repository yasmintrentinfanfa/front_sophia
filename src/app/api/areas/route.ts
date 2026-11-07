import { repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Catálogo fixo das 12 áreas jurídicas (sem `user_id`, igual ao de `/pecas/modelos`). */
export async function GET() {
  if (!(await idDoUsuarioNaSessao())) return Response.json({ erro: "não autenticado" }, { status: 401 });
  return repassarJson("/areas", undefined, "Não foi possível carregar as áreas jurídicas.");
}
