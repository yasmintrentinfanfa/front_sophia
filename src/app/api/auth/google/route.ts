import { entrarComGoogle } from "@/lib/servidor/google";

/** Entra (ou cria a conta) com o ID token do Google. Quem confere o token é o backend. */
export function POST(pedido: Request) {
  return entrarComGoogle(pedido, "/entrar/google");
}
