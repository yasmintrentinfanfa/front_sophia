import { cookies } from "next/headers";

import { COOKIE_USUARIO, opcoesCookieUsuario } from "@/lib/servidor/back";

export async function gravarUsuarioNaSessao(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_USUARIO, userId, opcoesCookieUsuario());
}

export async function idDoUsuarioNaSessao() {
  const jar = await cookies();
  return jar.get(COOKIE_USUARIO)?.value ?? "";
}

export async function apagarSessaoUsuario() {
  const jar = await cookies();
  jar.delete(COOKIE_USUARIO);
}
