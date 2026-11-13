import type { Usuario } from "@/lib/api/types";

/** Para onde o usuário vai depois de entrar ou criar a conta: a mesma regra de quem pode ver `/casos`. */
export function rotaInicial(usuario: Usuario) {
  // MVP sem plano: segue `redirecionamentoDosCasos`, que hoje libera qualquer conta.
  // Com a linha da assinatura descomentada lá, volta a dar o mesmo que o original:
  // return usuario.statusConta === "ativa" ? "/casos" : "/assinatura";
  return redirecionamentoDosCasos(usuario) ?? "/casos";
}

/**
 * Quem pode ver `/casos`: conta com sessão (e, com os planos ligados, assinatura paga).
 * Devolve a rota para onde mandar o usuário, ou `null` quando o acesso é liberado.
 */
export function redirecionamentoDosCasos(usuario: Usuario | null) {
  if (!usuario) return "/login";
  // MVP sem plano: a escolha do plano saiu do cadastro, então basta estar logado.
  // Para voltar a exigir a assinatura, descomente a linha abaixo.
  // if (usuario.statusConta !== "ativa") return "/assinatura";
  return null;
}
