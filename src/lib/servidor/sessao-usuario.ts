import { cookies } from "next/headers";

import { COOKIE_USUARIO, opcoesCookieUsuario } from "@/lib/servidor/back";
import { assinarSessao, lerSessaoAssinada } from "@/lib/servidor/cookie-assinado";

export async function gravarUsuarioNaSessao(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_USUARIO, assinarSessao(userId), opcoesCookieUsuario());
}

/** `""` quando não há cookie ou quando ele foi adulterado. */
export async function idDoUsuarioNaSessao() {
  const jar = await cookies();
  return lerSessaoAssinada(jar.get(COOKIE_USUARIO)?.value);
}

export async function apagarSessaoUsuario() {
  const jar = await cookies();
  jar.delete(COOKIE_USUARIO);
}
