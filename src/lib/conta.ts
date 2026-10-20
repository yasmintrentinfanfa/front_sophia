import type { Usuario } from "@/lib/api/types";

/**
 * Versão do texto dos Termos de uso e da Política de privacidade. Vai junto do
 * aceite no cadastro; troque quando o texto mudar, para saber o que cada
 * usuário aceitou.
 */
export const VERSAO_TERMOS = "2026-10";

/** Para onde o usuário vai depois de entrar ou criar a conta. */
export function rotaInicial(usuario: Usuario) {
  return usuario.statusConta === "ativa" ? "/casos" : "/assinatura";
}
