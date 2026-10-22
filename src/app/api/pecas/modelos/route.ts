import { repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Catálogo de modelos de peça. O mesmo catálogo orienta a IA no backend. */
export async function GET() {
  if (!(await idDoUsuarioNaSessao())) return Response.json({ erro: "não autenticado" }, { status: 401 });
  return repassarJson("/pecas/modelos", undefined, "Não foi possível carregar os modelos de peça.");
}
