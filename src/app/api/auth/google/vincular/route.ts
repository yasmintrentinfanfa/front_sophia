import { entrarComGoogle } from "@/lib/servidor/google";

/** Liga o Google a uma conta que já tem senha: o backend exige o token e a senha. */
export function POST(pedido: Request) {
  return entrarComGoogle(pedido, "/entrar/google/vincular");
}
